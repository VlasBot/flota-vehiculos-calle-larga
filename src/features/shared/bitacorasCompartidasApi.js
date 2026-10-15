import { supabase } from '../../lib/supabaseClient'

export const COLUMNAS_BITACORA = `
  id, conductor_id, vehiculo_id, viaje_id, estado, destino, inicio_en, km_inicio,
  combustible_inicio, checklist_inicio, observaciones_inicio, fin_en, km_fin,
  combustible_fin, observaciones_fin, novedades,
  vehiculo:vehiculos(patente, marca, modelo),
  conductor:profiles!bitacoras_conductor_id_fkey(nombre_completo),
  viaje:viajes(motivo)
`

export async function listarCargasDeBitacora(bitacoraId) {
  return supabase
    .from('cargas_combustible')
    .select('id, fecha, litros, monto, kilometraje, numero_documento, estacion')
    .eq('bitacora_id', bitacoraId)
    .order('fecha')
}
