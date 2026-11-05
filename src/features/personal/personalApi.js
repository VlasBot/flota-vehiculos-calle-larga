import { supabase } from '../../lib/supabaseClient'
import { limpiarBusqueda, rangoDePagina } from '../../utils/consultas'

const COLUMNAS =
  'id, nombre_completo, email, rut, role, telefono, licencia_clases, licencia_vencimiento, activo'

export async function listarPersonas({ roles, busqueda, activo, pagina, tamano }) {
  let consulta = supabase
    .from('profiles')
    .select(COLUMNAS, { count: 'exact' })
    .in('role', roles)
    .order('nombre_completo')
    .range(...rangoDePagina(pagina, tamano))

  const termino = limpiarBusqueda(busqueda)
  if (termino) {
    consulta = consulta.or(
      `nombre_completo.ilike.%${termino}%,email.ilike.%${termino}%,rut.ilike.%${termino}%`,
    )
  }
  if (activo !== '') consulta = consulta.eq('activo', activo === 'true')

  const { data, error, count } = await consulta
  return { data, error, total: count }
}

// La creación de cuentas pasa por la Edge Function porque requiere la
// service_role key, que nunca debe estar en el navegador.
export async function crearPersona(datos) {
  const { data, error } = await supabase.functions.invoke('crear-usuario', { body: datos })

  if (error) {
    let mensaje = 'No se pudo crear el usuario.'
    try {
      const cuerpo = await error.context.json()
      if (cuerpo?.error) mensaje = cuerpo.error
    } catch {
      // La respuesta no era JSON: se mantiene el mensaje genérico
    }
    return { data: null, error: { message: mensaje, code: 'P0001' } }
  }

  return { data, error: null }
}

export async function actualizarPersona(id, cambios) {
  return supabase.from('profiles').update(cambios).eq('id', id).select('id').single()
}
