import { supabase } from '../../lib/supabaseClient'
import { rangoDePagina } from '../../utils/consultas'

const aplicarFiltros = (consulta, { desde, hasta, vehiculoId }) => {
  let filtrada = consulta
  if (desde) filtrada = filtrada.gte('fecha', new Date(`${desde}T00:00:00`).toISOString())
  if (hasta) filtrada = filtrada.lte('fecha', new Date(`${hasta}T23:59:59`).toISOString())
  if (vehiculoId) filtrada = filtrada.eq('vehiculo_id', vehiculoId)
  return filtrada
}

export async function listarCargas({ pagina, tamano, ...filtros }) {
  const consulta = supabase
    .from('cargas_combustible')
    .select(
      `id, fecha, litros, monto, kilometraje, numero_documento, estacion, bitacora_id,
       vehiculo:vehiculos(patente, marca, modelo),
       conductor:profiles!cargas_combustible_conductor_id_fkey(nombre_completo)`,
      { count: 'exact' },
    )
    .order('fecha', { ascending: false })
    .range(...rangoDePagina(pagina, tamano))

  const { data, error, count } = await aplicarFiltros(consulta, filtros)
  return { data, error, total: count }
}

// Totales del período filtrado (litros y gasto)
export async function resumirCargas(filtros) {
  const { data, error } = await aplicarFiltros(
    supabase.from('cargas_combustible').select('litros, monto'),
    filtros,
  )

  if (error) return { error }

  return {
    litros: data.reduce((total, carga) => total + Number(carga.litros), 0),
    monto: data.reduce((total, carga) => total + (carga.monto ?? 0), 0),
    cantidad: data.length,
  }
}

export async function crearCarga(carga) {
  return supabase.from('cargas_combustible').insert(carga)
}
