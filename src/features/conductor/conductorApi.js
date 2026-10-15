import { supabase } from '../../lib/supabaseClient'
import { rangoDePagina } from '../../utils/consultas'
import { inicioDelDia, sumarDias } from '../../utils/fechas'
import { COLUMNAS_BITACORA } from '../shared/bitacorasCompartidasApi'

export async function obtenerBitacoraAbierta(conductorId) {
  return supabase
    .from('bitacoras')
    .select(COLUMNAS_BITACORA)
    .eq('conductor_id', conductorId)
    .eq('estado', 'abierta')
    .maybeSingle()
}

// Viajes asignados desde hoy hasta 7 días adelante
export async function listarMisViajesProgramados(conductorId) {
  return supabase
    .from('viajes')
    .select(
      'id, vehiculo_id, salida_programada, regreso_programado, origen, destino, motivo, cantidad_pasajeros, vehiculo:vehiculos(patente, marca, modelo, estado, kilometraje_actual)',
    )
    .eq('conductor_id', conductorId)
    .eq('estado', 'programado')
    .gte('regreso_programado', inicioDelDia().toISOString())
    .lte('salida_programada', sumarDias(inicioDelDia(), 8).toISOString())
    .order('salida_programada')
}

export async function listarMisProximosTurnos(conductorId) {
  return supabase
    .from('turnos')
    .select('id, inicio, fin, observaciones, vehiculo:vehiculos(patente)')
    .eq('conductor_id', conductorId)
    .gte('fin', new Date().toISOString())
    .order('inicio')
    .limit(5)
}

export async function listarVehiculosDisponibles() {
  return supabase
    .from('vehiculos')
    .select('id, patente, marca, modelo, tipo, kilometraje_actual')
    .eq('estado', 'disponible')
    .order('patente')
}

export async function iniciarViaje({ vehiculoId, viajeId, destino, kmInicio, combustible, checklist, observaciones }) {
  return supabase.rpc('iniciar_bitacora', {
    p_vehiculo_id: vehiculoId,
    p_viaje_id: viajeId ?? null,
    p_destino: destino,
    p_km_inicio: kmInicio,
    p_combustible_inicio: combustible,
    p_checklist: checklist,
    p_observaciones: observaciones,
  })
}

export async function finalizarViaje({ bitacoraId, kmFin, combustible, observaciones, novedades }) {
  return supabase.rpc('finalizar_bitacora', {
    p_bitacora_id: bitacoraId,
    p_km_fin: kmFin,
    p_combustible_fin: combustible,
    p_observaciones: observaciones,
    p_novedades: novedades,
  })
}

export async function registrarCargaEnViaje(bitacora, datos) {
  return supabase.from('cargas_combustible').insert({
    ...datos,
    vehiculo_id: bitacora.vehiculo_id,
    conductor_id: bitacora.conductor_id,
    bitacora_id: bitacora.id,
  })
}

export async function listarMiHistorial({ conductorId, pagina, tamano }) {
  const { data, error, count } = await supabase
    .from('bitacoras')
    .select(COLUMNAS_BITACORA, { count: 'exact' })
    .eq('conductor_id', conductorId)
    .order('inicio_en', { ascending: false })
    .range(...rangoDePagina(pagina, tamano))

  return { data, error, total: count }
}
