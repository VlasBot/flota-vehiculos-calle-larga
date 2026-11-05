import { supabase } from '../../lib/supabaseClient'

// Listas cortas para poblar selectores de formularios y filtros

export async function listarVehiculosParaSelector() {
  return supabase
    .from('vehiculos')
    .select('id, patente, marca, modelo, tipo, estado, kilometraje_actual, capacidad_pasajeros')
    .order('patente')
}

export async function listarConductoresParaSelector() {
  return supabase
    .from('profiles')
    .select('id, nombre_completo, licencia_clases, licencia_vencimiento')
    .eq('role', 'conductor')
    .eq('activo', true)
    .order('nombre_completo')
}

export function opcionVehiculo(vehiculo) {
  return { value: vehiculo.id, label: `${vehiculo.patente} · ${vehiculo.marca} ${vehiculo.modelo}` }
}

export function opcionConductor(conductor) {
  return { value: conductor.id, label: conductor.nombre_completo }
}
