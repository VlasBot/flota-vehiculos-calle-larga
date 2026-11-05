import { supabase } from '../../lib/supabaseClient'
import { rangoDePagina } from '../../utils/consultas'

const COLUMNAS_LISTA = `
  id, folio, emitido_en,
  viaje:viajes(
    salida_programada, regreso_programado, origen, destino, estado,
    vehiculo:vehiculos(patente),
    conductor:profiles!viajes_conductor_id_fkey(nombre_completo)
  )
`

// Todo lo que se imprime en el documento del permiso
const COLUMNAS_DOCUMENTO = `
  id, folio, observaciones, emitido_en,
  emisor:profiles!permisos_emitido_por_fkey(nombre_completo),
  viaje:viajes(
    salida_programada, regreso_programado, origen, destino, motivo,
    unidad_solicitante, cantidad_pasajeros, estado,
    vehiculo:vehiculos(patente, numero_interno, tipo, marca, modelo, anio, color),
    conductor:profiles!viajes_conductor_id_fkey(
      nombre_completo, rut, telefono, licencia_clases, licencia_vencimiento
    )
  )
`

export async function listarPermisos({ pagina, tamano }) {
  const { data, error, count } = await supabase
    .from('permisos')
    .select(COLUMNAS_LISTA, { count: 'exact' })
    .order('folio', { ascending: false })
    .range(...rangoDePagina(pagina, tamano))

  return { data, error, total: count }
}

export async function obtenerPermiso(id) {
  return supabase.from('permisos').select(COLUMNAS_DOCUMENTO).eq('id', id).single()
}

// Viajes programados del conductor que aún no terminan, con su permiso si ya tiene uno
export async function listarViajesProgramadosDe(conductorId) {
  return supabase
    .from('viajes')
    .select(
      'id, salida_programada, regreso_programado, origen, destino, motivo, vehiculo:vehiculos(patente, marca, modelo), permiso:permisos(id)',
    )
    .eq('conductor_id', conductorId)
    .eq('estado', 'programado')
    .gte('regreso_programado', new Date().toISOString())
    .order('salida_programada')
}

export async function crearPermiso({ viajeId, observaciones }) {
  return supabase.from('permisos').insert({ viaje_id: viajeId, observaciones }).select('id').single()
}

export async function anularPermiso(id) {
  return supabase.from('permisos').delete().eq('id', id)
}

// ---------------------------------------------------------------------
// Feriados
// ---------------------------------------------------------------------

export async function listarFeriados({ desde, hasta } = {}) {
  let consulta = supabase.from('feriados').select('fecha, nombre').order('fecha')
  if (desde) consulta = consulta.gte('fecha', desde)
  if (hasta) consulta = consulta.lte('fecha', hasta)
  return consulta
}

export async function crearFeriado(feriado) {
  return supabase.from('feriados').insert(feriado)
}

export async function eliminarFeriado(fecha) {
  return supabase.from('feriados').delete().eq('fecha', fecha)
}
