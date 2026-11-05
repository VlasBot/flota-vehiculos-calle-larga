import { KM_AVISO_MANTENCION } from './catalogos'

// Km que faltan para la mantención programada (negativo si ya se pasó)
export function kmRestantes(mantencion) {
  return mantencion.km_programado - (mantencion.vehiculo?.kilometraje_actual ?? 0)
}

// 'atrasada' | 'proxima' | null. Solo aplica a mantenciones aún programadas.
export function alertaMantencion(mantencion) {
  if (mantencion.estado !== 'programada') return null
  const restantes = kmRestantes(mantencion)
  if (restantes <= 0) return 'atrasada'
  if (restantes <= KM_AVISO_MANTENCION) return 'proxima'
  return null
}
