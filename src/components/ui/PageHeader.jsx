import './PageHeader.css'

export function PageHeader({ titulo, descripcion, children }) {
  return (
    <header className="encabezado-pagina">
      <div>
        <h1 className="encabezado-pagina__titulo">{titulo}</h1>
        {descripcion && <p className="encabezado-pagina__descripcion">{descripcion}</p>}
      </div>
      {children && <div className="encabezado-pagina__acciones">{children}</div>}
    </header>
  )
}
