import { supabase } from '../../lib/supabaseClient'

const COLUMNAS = `
  id, conductor_id, vehiculo_id, inicio, fin, observaciones,
  conductor:profiles!turnos_conductor_id_fkey(nombre_completo),
  vehiculo:vehiculos(patente)
`

export async function listarTurnosEntre(desde, hasta) {
  return supabase
    .from('turnos')
    .select(COLUMNAS)
    .lt('inicio', hasta.toISOString())
    .gt('fin', desde.toISOString())
    .order('inicio')
}

export async function crearTurno(turno) {
  return supabase.from('turnos').insert(turno).select('id').single()
}

export async function actualizarTurno(id, cambios) {
  return supabase.from('turnos').update(cambios).eq('id', id).select('id').single()
}

export async function eliminarTurno(id) {
  return supabase.from('turnos').delete().eq('id', id)
}

export async function buscarTurnosEnConflicto({ conductorId, inicio, fin, excluirId }) {
  let consulta = supabase
    .from('turnos')
    .select('id, inicio, fin')
    .eq('conductor_id', conductorId)
    .lt('inicio', fin)
    .gt('fin', inicio)

  if (excluirId) consulta = consulta.neq('id', excluirId)

  return consulta
}
