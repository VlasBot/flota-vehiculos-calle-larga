import { supabase } from '../../lib/supabaseClient'
import { rangoDePagina } from '../../utils/consultas'
import { COLUMNAS_BITACORA } from '../shared/bitacorasCompartidasApi'

export async function listarBitacoras({ desde, hasta, estado, vehiculoId, conductorId, pagina, tamano }) {
  let consulta = supabase
    .from('bitacoras')
    .select(COLUMNAS_BITACORA, { count: 'exact' })
    .order('inicio_en', { ascending: false })
    .range(...rangoDePagina(pagina, tamano))

  if (desde) consulta = consulta.gte('inicio_en', new Date(`${desde}T00:00:00`).toISOString())
  if (hasta) consulta = consulta.lte('inicio_en', new Date(`${hasta}T23:59:59`).toISOString())
  if (estado) consulta = consulta.eq('estado', estado)
  if (vehiculoId) consulta = consulta.eq('vehiculo_id', vehiculoId)
  if (conductorId) consulta = consulta.eq('conductor_id', conductorId)

  const { data, error, count } = await consulta
  return { data, error, total: count }
}
