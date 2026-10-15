import { StatusChip } from '../../components/ui/StatusChip'
import { diasHasta, formatearFecha } from '../../utils/fechas'

export const DIAS_AVISO_VENCIMIENTO = 30

// Muestra una fecha de vencimiento con color según qué tan cerca está
export function VencimientoChip({ fecha }) {
  if (!fecha) return <StatusChip tono="neutro">Sin registro</StatusChip>

  const dias = diasHasta(fecha)
  const texto = formatearFecha(fecha)

  if (dias < 0) return <StatusChip tono="peligro">Vencido {texto}</StatusChip>
  if (dias <= DIAS_AVISO_VENCIMIENTO) return <StatusChip tono="alerta">{texto}</StatusChip>
  return <StatusChip tono="exito">{texto}</StatusChip>
}
