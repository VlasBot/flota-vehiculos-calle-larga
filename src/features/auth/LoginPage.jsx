import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Spinner } from '../../components/ui/Spinner'
import { IconAlerta } from '../../components/icons'
import { useAuth } from '../../hooks/useAuth'
import { rutaInicioPorRol } from '../../utils/rutas'
import { traducirError } from '../shared/errorMessages'
import { iniciarSesion } from './authApi'
import './LoginPage.css'

export function LoginPage() {
  const { profile, loading, mensajeAcceso, limpiarMensajeAcceso } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  if (loading && !enviando) return <Spinner />

  if (profile) return <Navigate to={rutaInicioPorRol(profile.role)} replace />

  const alEnviar = async (evento) => {
    evento.preventDefault()
    setError('')
    limpiarMensajeAcceso()

    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.')
      return
    }

    setEnviando(true)
    const { error: errorLogin } = await iniciarSesion(email, password)
    setEnviando(false)

    if (errorLogin) setError(traducirError(errorLogin))
  }

  const mensaje = error || mensajeAcceso

  return (
    <div className="login">
      <section className="login__marca" aria-label="Municipalidad de Calle Larga">
        <span className="login__logo" aria-hidden="true">
          CL
        </span>
        <h1 className="login__titulo">Gestión de Flota Vehicular</h1>
        <p className="login__bajada">Municipalidad de Calle Larga</p>
        <ul className="login__puntos">
          <li>Vehículos, mantenciones y documentos al día</li>
          <li>Planificación de viajes y turnos de conductores</li>
          <li>Bitácoras digitales y control de combustible</li>
        </ul>
        <span className="login__franja" aria-hidden="true" />
      </section>

      <main className="login__panel">
        <form className="login__formulario" onSubmit={alEnviar} noValidate>
          <h2 className="login__formulario-titulo">Iniciar sesión</h2>
          <p className="texto-secundario">Ingresa con la cuenta entregada por el encargado de flota.</p>

          {mensaje && (
            <p className="alerta-formulario" role="alert">
              <IconAlerta size={18} />
              <span>{mensaje}</span>
            </p>
          )}

          <InputField
            label="Correo electrónico"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            required
          />
          <InputField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            required
          />

          <Button type="submit" anchoCompleto disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
      </main>
    </div>
  )
}
