// Quita caracteres que rompen la sintaxis de los filtros .or() de PostgREST
export function limpiarBusqueda(texto) {
  return (texto ?? '').replace(/[,()%*\\]/g, ' ').trim()
}

export function rangoDePagina(pagina, tamano) {
  const desde = (pagina - 1) * tamano
  return [desde, desde + tamano - 1]
}
