import { createContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export const AuthContext = createContext(null)

const cargarPerfil = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre_completo, email, rut, role, telefono, licencia_clases, licencia_vencimiento, activo')
    .eq('id', userId)
    .single()

  if (error) {
    return null
  }

  return data
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [sesionResuelta, setSesionResuelta] = useState(false)
  const [profile, setProfile] = useState(null)
  // id del usuario cuyo perfil ya terminó de cargarse (con o sin éxito)
  const [perfilCargadoPara, setPerfilCargadoPara] = useState(null)
  const [mensajeAcceso, setMensajeAcceso] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSesionResuelta(true)
    })

    // No se llama a Supabase dentro de este callback: hacerlo puede dejar
    // bloqueada la sesión. El perfil se carga en el efecto de abajo.
    const { data: subscription } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion)
      setSesionResuelta(true)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id

  useEffect(() => {
    let activo = true

    if (!userId) return

    cargarPerfil(userId).then((perfil) => {
      if (!activo) return

      if (!perfil || !perfil.activo) {
        setMensajeAcceso(
          perfil
            ? 'Tu cuenta está desactivada. Contacta al encargado de flota.'
            : 'No se encontró tu perfil de usuario. Contacta al administrador.',
        )
        supabase.auth.signOut()
        setProfile(null)
      } else {
        setProfile(perfil)
      }

      setPerfilCargadoPara(userId)
    })

    return () => {
      activo = false
    }
  }, [userId])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const loading = !sesionResuelta || (Boolean(userId) && perfilCargadoPara !== userId)

  // Tras cerrar sesión puede quedar el perfil anterior en el estado: solo vale
  // si corresponde al usuario de la sesión actual.
  const perfilVigente = profile?.id === userId ? profile : null

  const value = {
    session,
    profile: perfilVigente,
    loading,
    signOut,
    mensajeAcceso,
    limpiarMensajeAcceso: () => setMensajeAcceso(''),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
