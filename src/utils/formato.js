const formatoNumero = new Intl.NumberFormat('es-CL')
const formatoPesos = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export function formatearNumero(valor) {
  return valor === null || valor === undefined ? '—' : formatoNumero.format(valor)
}

export function formatearKm(valor) {
  return valor === null || valor === undefined ? '—' : `${formatoNumero.format(valor)} km`
}

export function formatearLitros(valor) {
  return valor === null || valor === undefined ? '—' : `${formatoNumero.format(valor)} L`
}

export function formatearPesos(valor) {
  return valor === null || valor === undefined ? '—' : formatoPesos.format(valor)
}

export function normalizarPatente(valor) {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

// Convierte el texto de un input a número o null (inputs vacíos)
export function aNumeroONulo(valor) {
  if (valor === '' || valor === null || valor === undefined) return null
  const numero = Number(valor)
  return Number.isNaN(numero) ? null : numero
}

export function textoONulo(valor) {
  const limpio = (valor ?? '').trim()
  return limpio === '' ? null : limpio
}
