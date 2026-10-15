import { supabase } from '../../lib/supabaseClient'
import { limpiarBusqueda, rangoDePagina } from '../../utils/consultas'
import { diasHasta } from '../../utils/fechas'

const COLUMNAS = `
  id, patente, numero_interno, tipo, marca, modelo, anio, color, tipo_combustible,
  capacidad_pasajeros, unidad_asignada, kilometraje_actual, estado,
  vencimiento_revision_tecnica, vencimiento_permiso_circulacion, vencimiento_soap, observaciones
`

export async function listarVehiculos({ busqueda, estado, tipo, pagina, tamano }) {
  let consulta = supabase
    .from('vehiculos')
    .select(COLUMNAS, { count: 'exact' })
    .order('patente')
    .range(...rangoDePagina(pagina, tamano))

  const termino = limpiarBusqueda(busqueda)
  if (termino) {
    consulta = consulta.or(
      `patente.ilike.%${termino}%,marca.ilike.%${termino}%,modelo.ilike.%${termino}%,numero_interno.ilike.%${termino}%`,
    )
  }
  if (estado) consulta = consulta.eq('estado', estado)
  if (tipo) consulta = consulta.eq('tipo', tipo)

  const { data, error, count } = await consulta
  return { data, error, total: count }
}

export async function crearVehiculo(vehiculo) {
  return supabase.from('vehiculos').insert(vehiculo).select(COLUMNAS).single()
}

export async function actualizarVehiculo(id, cambios) {
  return supabase.from('vehiculos').update(cambios).eq('id', id).select(COLUMNAS).single()
}

export async function eliminarVehiculo(id) {
  return supabase.from('vehiculos').delete().eq('id', id)
}

export async function obtenerHistorialVehiculo(vehiculoId) {
  const [bitacoras, mantenciones] = await Promise.all([
    supabase
      .from('bitacoras')
      .select('id, inicio_en, destino, km_inicio, km_fin, estado, conductor:profiles!bitacoras_conductor_id_fkey(nombre_completo)')
      .eq('vehiculo_id', vehiculoId)
      .order('inicio_en', { ascending: false })
      .limit(5),
    supabase
      .from('mantenciones')
      .select('id, tipo, estado, descripcion, fecha_programada, fecha_realizada, km_programado')
      .eq('vehiculo_id', vehiculoId)
      .order('creado_en', { ascending: false })
      .limit(5),
  ])

  return {
    bitacoras: bitacoras.data ?? [],
    mantenciones: mantenciones.data ?? [],
    error: bitacoras.error ?? mantenciones.error,
  }
}

const DOCUMENTOS = [
  { campo: 'vencimiento_revision_tecnica', documento: 'Revisión técnica' },
  { campo: 'vencimiento_permiso_circulacion', documento: 'Permiso de circulación' },
  { campo: 'vencimiento_soap', documento: 'SOAP' },
]

// Documentos vencidos o que vencen dentro de los próximos `diasAviso` días
export function documentosPorVencer(vehiculo, diasAviso = 30) {
  return DOCUMENTOS.filter(({ campo }) => vehiculo[campo])
    .map(({ campo, documento }) => {
      const dias = diasHasta(vehiculo[campo])
      return { documento, dias, vencido: dias < 0 }
    })
    .filter(({ dias }) => dias <= diasAviso)
}
