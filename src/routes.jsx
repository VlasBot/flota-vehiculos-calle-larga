import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/guards/ProtectedRoute'
import { RoleRoute } from './components/guards/RoleRoute'
import { AppShell } from './components/layout/AppShell'
import { Spinner } from './components/ui/Spinner'
import { useAuth } from './hooks/useAuth'
import { rutaInicioPorRol } from './utils/rutas'

// Cada página se descarga recién cuando se visita
const cargarPagina = (importar, nombre) =>
  lazy(() => importar().then((modulo) => ({ default: modulo[nombre] })))

const LoginPage = cargarPagina(() => import('./features/auth/LoginPage'), 'LoginPage')
const PanelPage = cargarPagina(() => import('./features/panel/PanelPage'), 'PanelPage')
const VehiculosPage = cargarPagina(() => import('./features/vehiculos/VehiculosPage'), 'VehiculosPage')
const ViajesPage = cargarPagina(() => import('./features/viajes/ViajesPage'), 'ViajesPage')
const TurnosPage = cargarPagina(() => import('./features/turnos/TurnosPage'), 'TurnosPage')
const BitacorasPage = cargarPagina(() => import('./features/bitacoras/BitacorasPage'), 'BitacorasPage')
const CombustiblePage = cargarPagina(() => import('./features/combustible/CombustiblePage'), 'CombustiblePage')
const MantencionesPage = cargarPagina(() => import('./features/mantenciones/MantencionesPage'), 'MantencionesPage')
const PersonalPage = cargarPagina(() => import('./features/personal/PersonalPage'), 'PersonalPage')
const MiTurnoPage = cargarPagina(() => import('./features/conductor/MiTurnoPage'), 'MiTurnoPage')
const MiHistorialPage = cargarPagina(() => import('./features/conductor/MiHistorialPage'), 'MiHistorialPage')

const GESTION = ['admin', 'usuario']

function InicioSegunRol() {
  const { profile, loading } = useAuth()

  if (loading) return <Spinner />
  if (!profile) return <Navigate to="/login" replace />

  return <Navigate to={rutaInicioPorRol(profile.role)} replace />
}

export function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<InicioSegunRol />} />

          <Route element={<RoleRoute allowedRoles={['admin']} />}>
            <Route path="/panel" element={<PanelPage />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={GESTION} />}>
            <Route path="/vehiculos" element={<VehiculosPage />} />
            <Route path="/viajes" element={<ViajesPage />} />
            <Route path="/turnos" element={<TurnosPage />} />
            <Route path="/bitacoras" element={<BitacorasPage />} />
            <Route path="/combustible" element={<CombustiblePage />} />
            <Route path="/mantenciones" element={<MantencionesPage />} />
            <Route path="/conductores" element={<PersonalPage key="conductores" tipo="conductores" />} />
            <Route path="/usuarios" element={<PersonalPage key="usuarios" tipo="usuarios" />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['conductor']} />}>
            <Route path="/mi-turno" element={<MiTurnoPage />} />
            <Route path="/mi-historial" element={<MiHistorialPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
