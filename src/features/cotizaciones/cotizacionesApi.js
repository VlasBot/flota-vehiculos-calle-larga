import { supabase } from '../../lib/supabaseClient'
import { rangoDePagina } from '../../utils/consultas'

const COLUMNAS_CALCULO = 'km_tramo, ida_y_vuelta, rendimiento_km_litro, precio_combustible, peajes, otros_gastos'

const COLUMNAS_LISTA = `
  id, folio, emitido_en, origen, destino, solicitante, ${COLUMNAS_CALCULO},
  vehiculo:vehiculos(patente, marca, modelo)
`

// Todo lo que se imprime en el documento de la cotización
const COLUMNAS_DOCUMENTO = `
  id, folio, emitido_en, origen, destino, solicitante, fecha_viaje, observaciones, ${COLUMNAS_CALCULO},
  emisor:profiles!cotizaciones_emitido_por_fkey(nombre_completo),
  vehiculo:vehiculos(patente, numero_interno, tipo, marca, modelo, anio, tipo_combustible, capacidad_pasajeros)
`

export async function listarCotizaciones({ pagina, tamano }) {
  const { data, error, count } = await supabase
    .from('cotizaciones')
    .select(COLUMNAS_LISTA, { count: 'exact' })
    .order('folio', { ascending: false })
    .range(...rangoDePagina(pagina, tamano))

  return { data, error, total: count }
}

export async function obtenerCotizacion(id) {
  return supabase.from('cotizaciones').select(COLUMNAS_DOCUMENTO).eq('id', id).single()
}

export async function crearCotizacion(cotizacion) {
  return supabase.from('cotizaciones').insert(cotizacion).select('id, folio').single()
}

export async function anularCotizacion(id) {
  return supabase.from('cotizaciones').delete().eq('id', id)
}

// Vehículos con lo necesario para estimar el rendimiento
export async function listarVehiculosParaCotizar() {
  return supabase
    .from('vehiculos')
    .select('id, patente, marca, modelo, tipo, tipo_combustible, rendimiento_km_litro')
    .order('patente')
}

// Últimas cargas con kilometraje, para calcular el rendimiento real
export async function listarCargasDeVehiculo(vehiculoId) {
  return supabase
    .from('cargas_combustible')
    .select('litros, kilometraje')
    .eq('vehiculo_id', vehiculoId)
    .not('kilometraje', 'is', null)
    .order('fecha', { ascending: false })
    .limit(20)
}
