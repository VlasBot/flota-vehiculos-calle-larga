import { supabase } from '../../lib/supabaseClient'
import { limpiarBusqueda, rangoDePagina } from '../../utils/consultas'

const COLUMNAS = `
  id, vehiculo_id, tipo, estado, descripcion, km_programado,
  fecha_realizada, km_realizado, taller, costo, observaciones,
  vehiculo:vehiculos(patente, marca, modelo, kilometraje_actual)
`

export async function listarMantenciones({ busqueda, estado, vehiculoId, pagina, tamano }) {
  let consulta = supabase
    .from('mantenciones')
    .select(COLUMNAS, { count: 'exact' })
    .order('km_programado', { ascending: true })
    .range(...rangoDePagina(pagina, tamano))

  const termino = limpiarBusqueda(busqueda)
  if (termino) consulta = consulta.or(`descripcion.ilike.%${termino}%,taller.ilike.%${termino}%`)

  // "pendientes" agrupa lo que aún requiere atención
  if (estado === 'pendientes') consulta = consulta.in('estado', ['programada', 'en_proceso'])
  else if (estado) consulta = consulta.eq('estado', estado)

  if (vehiculoId) consulta = consulta.eq('vehiculo_id', vehiculoId)

  const { data, error, count } = await consulta
  return { data, error, total: count }
}

export async function crearMantencion(mantencion) {
  return supabase.from('mantenciones').insert(mantencion)
}

export async function actualizarMantencion(id, cambios) {
  return supabase.from('mantenciones').update(cambios).eq('id', id)
}
