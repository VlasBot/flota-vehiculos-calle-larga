import './StatusChip.css'

// tono: 'exito' | 'alerta' | 'peligro' | 'info' | 'neutro' | 'marca'
export function StatusChip({ tono = 'neutro', children }) {
  return <span className={`chip chip--${tono}`}>{children}</span>
}
