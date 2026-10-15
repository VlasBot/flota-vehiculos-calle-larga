import { StatusChip } from '../../components/ui/StatusChip'

export function EstadoChip({ catalogo, valor }) {
  const item = catalogo[valor]
  return <StatusChip tono={item?.tono ?? 'neutro'}>{item?.label ?? valor}</StatusChip>
}
