import { fechaLocalISO, inicioDelDia } from '../../utils/fechas'

// Días del viaje que caen en sábado, domingo o feriado.
// Devuelve [{ fecha: '2026-10-24', feriado: 'Día de…' | null }]
export function diasEspeciales(salida, regreso, feriados) {
  const nombres = new Map(feriados.map((feriado) => [feriado.fecha, feriado.nombre]))
  const fin = new Date(regreso)
  const dia = inicioDelDia(new Date(salida))
  const dias = []

  while (dia <= fin) {
    const fecha = fechaLocalISO(dia)
    const feriado = nombres.get(fecha) ?? null
    const finDeSemana = dia.getDay() === 0 || dia.getDay() === 6
    if (feriado || finDeSemana) dias.push({ fecha, feriado })
    dia.setDate(dia.getDate() + 1)
  }

  return dias
}

export const formatearFolio = (folio) => String(folio).padStart(5, '0')

// Un viaje puede venir con su permiso como objeto, arreglo o null según la relación
export const tienePermiso = (viaje) =>
  Array.isArray(viaje.permiso) ? viaje.permiso.length > 0 : Boolean(viaje.permiso)
