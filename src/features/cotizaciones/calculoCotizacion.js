// Cálculo del costo aproximado de un viaje. Se usa en el formulario (vista
// previa), en la lista y en el documento PDF, para que siempre coincidan.

// Rendimiento de referencia por tipo de vehículo, cuando no hay otro dato.
// Valores conservadores (uso mixto ciudad/carretera, con carga).
// Eléctricos: km por kWh.
export const RENDIMIENTO_REFERENCIA = {
  auto: 12,
  camioneta: 9,
  furgon: 9,
  minibus: 7,
  micro: 5,
  bus: 3.5,
  camion: 4,
  moto: 25,
  maquinaria: 3,
  otro: 8,
}

// Con menos kilómetros entre cargas el resultado es poco confiable
const KM_MINIMOS_HISTORIAL = 300

export const esElectrico = (vehiculo) => vehiculo?.tipo_combustible === 'electrico'

// Unidad de energía según el combustible del vehículo
export const unidadEnergia = (vehiculo) => (esElectrico(vehiculo) ? 'kWh' : 'L')

// Rendimiento real a partir de las cargas de combustible registradas con
// kilometraje: km recorridos entre la primera y la última carga dividido por
// los litros cargados después de la primera (la primera "llena" el estanque).
export function rendimientoSegunCargas(cargas) {
  const conKm = cargas.filter((carga) => carga.kilometraje !== null).sort((a, b) => a.kilometraje - b.kilometraje)
  if (conKm.length < 3) return null

  const kmRecorridos = conKm.at(-1).kilometraje - conKm[0].kilometraje
  const litros = conKm.slice(1).reduce((suma, carga) => suma + Number(carga.litros), 0)
  if (kmRecorridos < KM_MINIMOS_HISTORIAL || litros <= 0) return null

  return Math.round((kmRecorridos / litros) * 10) / 10
}

// Elige el rendimiento a proponer y explica de dónde sale
export function rendimientoSugerido(vehiculo, cargas) {
  const historial = esElectrico(vehiculo) ? null : rendimientoSegunCargas(cargas)
  if (historial) {
    return { valor: historial, fuente: 'Calculado con las cargas de combustible registradas del vehículo.' }
  }
  if (vehiculo.rendimiento_km_litro) {
    return { valor: Number(vehiculo.rendimiento_km_litro), fuente: 'Rendimiento registrado en la ficha del vehículo.' }
  }
  if (esElectrico(vehiculo)) {
    return { valor: '', fuente: 'Vehículo eléctrico sin rendimiento registrado: ingresa los km por kWh.' }
  }
  return {
    valor: RENDIMIENTO_REFERENCIA[vehiculo.tipo] ?? RENDIMIENTO_REFERENCIA.otro,
    fuente: 'Valor de referencia según el tipo de vehículo. Ajústalo si conoces el rendimiento real.',
  }
}

export function calcularCotizacion({
  km_tramo,
  ida_y_vuelta,
  rendimiento_km_litro,
  precio_combustible,
  peajes,
  otros_gastos,
}) {
  const kmTotal = Number(km_tramo || 0) * (ida_y_vuelta ? 2 : 1)
  const rendimiento = Number(rendimiento_km_litro || 0)
  const litros = rendimiento > 0 ? kmTotal / rendimiento : 0
  const costoCombustible = Math.round(litros * Number(precio_combustible || 0))
  const costoPeajes = Number(peajes || 0)
  const costoOtros = Number(otros_gastos || 0)

  return {
    kmTotal,
    litros: Math.round(litros * 10) / 10,
    costoCombustible,
    costoPeajes,
    costoOtros,
    total: costoCombustible + costoPeajes + costoOtros,
  }
}
