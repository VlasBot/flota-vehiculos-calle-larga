import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { IconClose, IconSalir } from '../icons'
import { ENLACES_POR_ROL, NOMBRE_ROL } from './navegacion'
import './Sidebar.css'

export function Sidebar({ abierta, onCerrar }) {
  const { profile, signOut } = useAuth()
  const enlaces = ENLACES_POR_ROL[profile?.role] ?? []

  return (
    <>
      {abierta && <div className="sidebar-fondo" onClick={onCerrar} aria-hidden="true" />}

      <aside className={`sidebar ${abierta ? 'sidebar--abierta' : ''}`} aria-label="Menú principal">
        <div className="sidebar__marca">
          <span className="sidebar__logo" aria-hidden="true">
            CL
          </span>
          <div>
            <p className="sidebar__titulo">Gestión de Flota</p>
            <p className="sidebar__subtitulo">Municipalidad de Calle Larga</p>
          </div>
          <button
            type="button"
            className="sidebar__cerrar"
            onClick={onCerrar}
            aria-label="Cerrar menú"
          >
            <IconClose />
          </button>
        </div>

        <nav className="sidebar__nav">
          <ul>
            {enlaces.map(({ to, label, Icono }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onCerrar}
                  className={({ isActive }) =>
                    `sidebar__enlace ${isActive ? 'sidebar__enlace--activo' : ''}`
                  }
                >
                  <Icono size={20} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <footer className="sidebar__pie">
          <p className="sidebar__usuario">{profile?.nombre_completo}</p>
          <p className="sidebar__rol">{NOMBRE_ROL[profile?.role]}</p>
          <button type="button" className="sidebar__salir" onClick={signOut}>
            <IconSalir size={18} />
            <span>Cerrar sesión</span>
          </button>
        </footer>
      </aside>
    </>
  )
}
