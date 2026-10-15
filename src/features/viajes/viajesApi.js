import { supabase } from '../../lib/supabaseClient'
import { limpiarBusqueda, rangoDePagina } from '../../utils/consultas'

const COLUMNAS = `
  id, vehiculo_id, conductor_id, salida_programada, regreso_programado, origen, destino,
  motivo, unidad_solicitante, cantidad_pasajeros, estado, observaciones,
  vehiculo:vehiculos(patente, marca, modelo),
  conductor:profiles!viajes_conductor_id_fkey(nombre_completo)
`

export async function listarViajes({ busqueda, desde, hasta, estado, pagina, tamano }) {
  let consulta = supabase
    .from('viajes')
    .select(COLUMNAS, { count: 'exact' })
    .order('salida_programada')
    .range(...rangoDePagina(pagina, tamano))

  const termino = limpiarBusqueda(busqueda)
  if (termino) {
    consulta = consulta.or(
      `destino.ilike.%${termino}%,motivo.ilike.%${termino}%,unidad_solicitante.ilike.%${termino}%`,
    )
  }
  // Un viaje entra en el rango si termina después de "desde" y sale antes de "hasta"
  if (desde) consulta = consulta.gte('regreso_programado', new Date(`${desde}T00:00:00`).toISOString())
  if (hasta) consulta = consulta.lte('salida_programada', new Date(`${hasta}T23:59:59`).toISOString())
  if (estado) consulta = consulta.eq('estado', estado)

  const { data, error, count } = await consulta
  return { data, error, total: count }
}

export async function crearViaje(viaje) {
  return supabase.from('viajes').insert(viaje).select('id').single()
}

export async function actualizarViaje(id, cambios) {
  return supabase.from('viajes').update(cambios).eq('id', id).select('id').single()
}

export async function cancelarViaje(id) {
  return supabase.from('viajes').update({ estado: 'cancelado' }).eq('id', id).eq('estado', 'programado')
}

// Viajes activos del mismo vehículo o conductor que se cruzan con el horario
export async function buscarViajesEnConflicto({ vehiculoId, conductorId, inicio, fin, excluirId }) {
  let consulta = supabase
    .from('viajes')
    .select(COLUMNAS)
    .in('estado', ['programado', 'en_curso'])
    .lt('salida_programada', fin)
    .gt('regreso_programado', inicio)
    .or(`vehiculo_id.eq.${vehiculoId},conductor_id.eq.${conductorId}`)

  if (excluirId) consulta = consulta.neq('id', excluirId)

  return consulta
}
