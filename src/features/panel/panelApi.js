import { supabase } from '../../lib/supabaseClient'
import { fechaLocalISO, inicioDelDia, sumarDias } from '../../utils/fechas'

const inicioDelMes = () => {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
}

// Todas las consultas del panel en paralelo; los totales se calculan acá
// porque el volumen de una flota municipal es pequeño.
export async function obtenerResumenPanel() {
  const hoy = inicioDelDia()
  const mes = inicioDelMes().toISOString()
  const limiteAviso = fechaLocalISO(sumarDias(hoy, 30))

  const [vehiculos, viajesHoy, enRuta, bitacorasMes, cargasMes, mantenciones, licencias, novedades] =
    await Promise.all([
      supabase
        .from('vehiculos')
        .select('id, patente, marca, modelo, estado, kilometraje_actual, vencimiento_revision_tecnica, vencimiento_permiso_circulacion, vencimiento_soap'),
      supabase
        .from('viajes')
        .select('id', { count: 'exact', head: true })
        .neq('estado', 'cancelado')
        .gte('salida_programada', hoy.toISOString())
        .lt('salida_programada', sumarDias(hoy, 1).toISOString()),
      supabase
        .from('bitacoras')
        .select('id, inicio_en, destino, vehiculo:vehiculos(patente), conductor:profiles!bitacoras_conductor_id_fkey(nombre_completo)')
        .eq('estado', 'abierta')
        .order('inicio_en'),
      supabase
        .from('bitacoras')
        .select('vehiculo_id, km_inicio, km_fin, vehiculo:vehiculos(patente)')
        .eq('estado', 'cerrada')
        .gte('inicio_en', mes),
      supabase.from('cargas_combustible').select('litros, monto').gte('fecha', mes),
      supabase
        .from('mantenciones')
        .select('id, estado, km_programado, descripcion, vehiculo:vehiculos(patente, kilometraje_actual)')
        .in('estado', ['programada', 'en_proceso']),
      supabase
        .from('profiles')
        .select('id, nombre_completo, licencia_vencimiento')
        .eq('role', 'conductor')
        .eq('activo', true)
        .lte('licencia_vencimiento', limiteAviso)
        .order('licencia_vencimiento'),
      supabase
        .from('bitacoras')
        .select('id, fin_en, novedades, vehiculo:vehiculos(patente), conductor:profiles!bitacoras_conductor_id_fkey(nombre_completo)')
        .not('novedades', 'is', null)
        .gte('fin_en', sumarDias(hoy, -30).toISOString())
        .order('fin_en', { ascending: false })
        .limit(5),
    ])

  const error = [vehiculos, viajesHoy, enRuta, bitacorasMes, cargasMes, mantenciones, licencias, novedades]
    .map((respuesta) => respuesta.error)
    .find(Boolean)

  if (error) return { error }

  const kmPorVehiculo = {}
  for (const bitacora of bitacorasMes.data) {
    const patente = bitacora.vehiculo?.patente ?? '—'
    kmPorVehiculo[patente] = (kmPorVehiculo[patente] ?? 0) + (bitacora.km_fin - bitacora.km_inicio)
  }

  return {
    vehiculos: vehiculos.data,
    viajesHoy: viajesHoy.count ?? 0,
    enRuta: enRuta.data,
    kmPorVehiculo: Object.entries(kmPorVehiculo)
      .map(([patente, km]) => ({ patente, km }))
      .sort((a, b) => b.km - a.km),
    litrosMes: cargasMes.data.reduce((total, carga) => total + Number(carga.litros), 0),
    gastoMes: cargasMes.data.reduce((total, carga) => total + (carga.monto ?? 0), 0),
    mantenciones: mantenciones.data,
    licencias: licencias.data,
    novedades: novedades.data,
  }
}
