// Validación de RUT chileno con dígito verificador (módulo 11)

const limpiarRut = (rut) => rut.replace(/[^0-9kK]/g, '').toUpperCase()

const calcularDigitoVerificador = (cuerpo) => {
  let suma = 0
  let multiplicador = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

export function validarRut(rut) {
  const limpio = limpiarRut(rut)
  if (limpio.length < 2) return false

  const cuerpo = limpio.slice(0, -1)
  const digito = limpio.slice(-1)

  return /^\d+$/.test(cuerpo) && calcularDigitoVerificador(cuerpo) === digito
}

// "123456789" => "12.345.678-9"
export function formatearRut(rut) {
  const limpio = limpiarRut(rut)
  if (limpio.length < 2) return limpio

  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpo}-${limpio.slice(-1)}`
}
