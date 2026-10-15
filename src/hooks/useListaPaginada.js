import { useEffect, useState } from 'react'
import { traducirError } from '../features/shared/errorMessages'

export const TAMANO_PAGINA = 10

// Carga una página de resultados cada vez que cambian los filtros o la página.
// `consultar` es una función de la capa *Api.js que recibe
// { ...filtros, pagina, tamano } y devuelve { data, error, total }.
export function useListaPaginada(consultar, filtros) {
  const clave = JSON.stringify(filtros)
  const [estadoPagina, setEstadoPagina] = useState({ clave, pagina: 1 })
  const [resultado, setResultado] = useState({ filas: [], total: 0, error: '' })
  const [cargando, setCargando] = useState(true)
  const [version, setVersion] = useState(0)

  // Al cambiar un filtro se vuelve a la primera página
  const pagina = estadoPagina.clave === clave ? estadoPagina.pagina : 1

  useEffect(() => {
    let vigente = true
    setCargando(true)

    consultar({ ...JSON.parse(clave), pagina, tamano: TAMANO_PAGINA }).then(({ data, error, total }) => {
      if (!vigente) return
      setResultado({
        filas: data ?? [],
        total: total ?? 0,
        error: error ? traducirError(error) : '',
      })
      setCargando(false)
    })

    return () => {
      vigente = false
    }
  }, [consultar, clave, pagina, version])

  return {
    ...resultado,
    cargando,
    pagina,
    totalPaginas: Math.max(1, Math.ceil(resultado.total / TAMANO_PAGINA)),
    setPagina: (nueva) => setEstadoPagina({ clave, pagina: nueva }),
    recargar: () => setVersion((actual) => actual + 1),
  }
}
