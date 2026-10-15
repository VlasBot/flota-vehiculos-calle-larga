import { IconMenu } from '../icons'
import { tituloDeRuta } from './navegacion'
import './Header.css'

export function Header({ pathname, onAbrirMenu }) {
  return (
    <header className="header">
      <button
        type="button"
        className="header__menu"
        onClick={onAbrirMenu}
        aria-label="Abrir menú"
      >
        <IconMenu />
      </button>
      <p className="header__titulo">{tituloDeRuta(pathname)}</p>
      <span className="header__franja" aria-hidden="true" />
    </header>
  )
}
