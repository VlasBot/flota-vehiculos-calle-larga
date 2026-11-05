// Edge Function: crea un usuario en Supabase Auth (el trigger handle_new_user
// genera su perfil). Necesita la service_role key, por eso vive acá y no en
// el cliente.
//
// Reglas:
//  - admin   => puede crear admin, usuario o conductor
//  - usuario => puede crear usuario o conductor
//  - otros   => 403
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ROLES_PERMITIDOS: Record<string, string[]> = {
  admin: ['admin', 'usuario', 'conductor'],
  usuario: ['usuario', 'conductor'],
}

const responder = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return responder({ error: 'Método no permitido.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceRoleKey)

  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: datosUsuario, error: errorUsuario } = await admin.auth.getUser(token)

  if (errorUsuario || !datosUsuario.user) {
    return responder({ error: 'Sesión no válida.' }, 401)
  }

  const { data: perfilSolicitante } = await admin
    .from('profiles')
    .select('role, activo')
    .eq('id', datosUsuario.user.id)
    .single()

  if (!perfilSolicitante?.activo || !ROLES_PERMITIDOS[perfilSolicitante.role]) {
    return responder({ error: 'No tienes permisos para crear usuarios.' }, 403)
  }

  let cuerpo: Record<string, string | null>
  try {
    cuerpo = await req.json()
  } catch {
    return responder({ error: 'Solicitud inválida.' }, 400)
  }

  const email = (cuerpo.email ?? '').trim().toLowerCase()
  const password = cuerpo.password ?? ''
  const nombreCompleto = (cuerpo.nombre_completo ?? '').trim()
  const role = cuerpo.role ?? ''
  // Es el único campo que llega como arreglo: ["A2", "B", …]
  const licenciaClases = (cuerpo as Record<string, unknown>).licencia_clases

  if (!email || !nombreCompleto) {
    return responder({ error: 'El nombre y el correo son obligatorios.' }, 400)
  }

  if (password.length < 8) {
    return responder({ error: 'La contraseña debe tener al menos 8 caracteres.' }, 400)
  }

  if (!ROLES_PERMITIDOS[perfilSolicitante.role].includes(role)) {
    return responder({ error: 'No puedes crear usuarios con ese perfil.' }, 403)
  }

  // El RUT es único en profiles: si se repite, el trigger fallaría con un
  // error genérico de Auth, así que se valida antes para dar un mensaje claro.
  if (cuerpo.rut) {
    const { data: rutExistente } = await admin
      .from('profiles')
      .select('id')
      .eq('rut', cuerpo.rut)
      .maybeSingle()

    if (rutExistente) {
      return responder({ error: 'Ya existe una persona registrada con ese RUT.' }, 400)
    }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nombre_completo: nombreCompleto,
      rut: cuerpo.rut ?? null,
      telefono: cuerpo.telefono ?? null,
      role,
      licencia_clases: role === 'conductor' && Array.isArray(licenciaClases) ? licenciaClases : null,
      licencia_vencimiento: role === 'conductor' ? cuerpo.licencia_vencimiento ?? null : null,
    },
  })

  if (error) {
    const yaExiste = error.message.toLowerCase().includes('already')
    return responder(
      { error: yaExiste ? 'Ya existe un usuario con ese correo.' : 'No se pudo crear el usuario.' },
      400,
    )
  }

  return responder({ id: data.user.id })
})
