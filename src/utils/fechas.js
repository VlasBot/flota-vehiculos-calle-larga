const ZONA = 'America/Santiago'

const formatoFecha = new Intl.DateTimeFormat('es-CL', {
  timeZone: ZONA,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const formatoFechaHora = new Intl.DateTimeFormat('es-CL', {
  timeZone: ZONA,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const formatoHora = new Intl.DateTimeFormat('es-CL', {
  timeZone: ZONA,
  hour: '2-digit',
  minute: '2-digit',
})

// Las columnas tipo `date` llegan como "2026-10-15": se agrega la hora para
// que el navegador no las interprete en UTC y muestre el día anterior.
const aFecha = (valor) => (valor.length === 10 ? new Date(`${valor}T12:00:00`) : new Date(valor))

export function formatearFecha(valor) {
  return valor ? formatoFecha.format(aFecha(valor)) : '—'
}

export function formatearFechaHora(valor) {
  return valor ? formatoFechaHora.format(new Date(valor)) : '—'
}

export function formatearHora(valor) {
  return valor ? formatoHora.format(new Date(valor)) : '—'
}

const dosDigitos = (numero) => String(numero).padStart(2, '0')

// "2026-10-15" en hora local, para inputs type="date"
export function fechaLocalISO(fecha = new Date()) {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`
}

// "2026-10-15T08:30" en hora local, para inputs type="datetime-local"
export function fechaHoraLocalISO(valor) {
  if (!valor) return ''
  const fecha = new Date(valor)
  return `${fechaLocalISO(fecha)}T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`
}

// Convierte el valor de un datetime-local a ISO con zona horaria para Supabase
export function datetimeLocalAISO(valor) {
  return valor ? new Date(valor).toISOString() : null
}

export function inicioDelDia(fecha = new Date()) {
  const copia = new Date(fecha)
  copia.setHours(0, 0, 0, 0)
  return copia
}

export function sumarDias(fecha, dias) {
  const copia = new Date(fecha)
  copia.setDate(copia.getDate() + dias)
  return copia
}

export function diasHasta(fechaISO) {
  if (!fechaISO) return null
  const objetivo = inicioDelDia(aFecha(fechaISO))
  return Math.round((objetivo - inicioDelDia()) / 86400000)
}

export function duracionLegible(inicio, fin) {
  if (!inicio || !fin) return '—'
  const minutos = Math.max(0, Math.round((new Date(fin) - new Date(inicio)) / 60000))
  const horas = Math.floor(minutos / 60)
  return horas > 0 ? `${horas} h ${minutos % 60} min` : `${minutos} min`
}
