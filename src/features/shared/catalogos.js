// Etiquetas en español y tono visual para cada valor de los enums de la base

const aOpciones = (mapa) => Object.entries(mapa).map(([value, { label }]) => ({ value, label }))

export const TIPOS_VEHICULO = {
  auto: { label: 'Automóvil' },
  camioneta: { label: 'Camioneta' },
  furgon: { label: 'Furgón' },
  minibus: { label: 'Minibús' },
  micro: { label: 'Micro' },
  bus: { label: 'Bus' },
  camion: { label: 'Camión' },
  moto: { label: 'Motocicleta' },
  maquinaria: { label: 'Maquinaria' },
  otro: { label: 'Otro' },
}

export const ESTADOS_VEHICULO = {
  disponible: { label: 'Disponible', tono: 'exito' },
  en_ruta: { label: 'En ruta', tono: 'info' },
  en_mantencion: { label: 'En mantención', tono: 'alerta' },
  fuera_servicio: { label: 'Fuera de servicio', tono: 'peligro' },
}

export const TIPOS_COMBUSTIBLE = {
  diesel: { label: 'Diésel' },
  gasolina: { label: 'Gasolina' },
  hibrido: { label: 'Híbrido' },
  electrico: { label: 'Eléctrico' },
}

export const ESTADOS_VIAJE = {
  programado: { label: 'Programado', tono: 'marca' },
  en_curso: { label: 'En curso', tono: 'info' },
  finalizado: { label: 'Finalizado', tono: 'exito' },
  cancelado: { label: 'Cancelado', tono: 'neutro' },
}

export const ESTADOS_BITACORA = {
  abierta: { label: 'En curso', tono: 'info' },
  cerrada: { label: 'Cerrada', tono: 'exito' },
}

export const NIVELES_COMBUSTIBLE = {
  reserva: { label: 'Reserva' },
  un_cuarto: { label: '1/4' },
  medio: { label: '1/2' },
  tres_cuartos: { label: '3/4' },
  lleno: { label: 'Lleno' },
}

export const TIPOS_MANTENCION = {
  preventiva: { label: 'Preventiva' },
  correctiva: { label: 'Correctiva' },
  revision_tecnica: { label: 'Revisión técnica' },
  neumaticos: { label: 'Neumáticos' },
  otra: { label: 'Otra' },
}

export const ESTADOS_MANTENCION = {
  programada: { label: 'Programada', tono: 'marca' },
  en_proceso: { label: 'En taller', tono: 'alerta' },
  realizada: { label: 'Realizada', tono: 'exito' },
  cancelada: { label: 'Cancelada', tono: 'neutro' },
}

export const ROLES = {
  admin: { label: 'Administrador' },
  usuario: { label: 'Gestión de flota' },
  conductor: { label: 'Conductor' },
}

export const CLASES_LICENCIA = ['A1', 'A2', 'A3', 'A4', 'A5', 'B', 'C', 'D', 'E', 'F']

// Revisión previa del vehículo que hace el conductor al iniciar un viaje
export const ITEMS_CHECKLIST = [
  { clave: 'luces', label: 'Luces y señalizadores funcionando' },
  { clave: 'frenos', label: 'Frenos en buen estado' },
  { clave: 'neumaticos', label: 'Neumáticos y repuesto en buen estado' },
  { clave: 'niveles', label: 'Niveles de aceite y agua correctos' },
  { clave: 'documentos', label: 'Documentos del vehículo a bordo' },
  { clave: 'seguridad', label: 'Botiquín, extintor y triángulos' },
  { clave: 'limpieza', label: 'Vehículo limpio y ordenado' },
]

export const OPCIONES_TIPO_VEHICULO = aOpciones(TIPOS_VEHICULO)
export const OPCIONES_ESTADO_VEHICULO = aOpciones(ESTADOS_VEHICULO)
export const OPCIONES_COMBUSTIBLE = aOpciones(TIPOS_COMBUSTIBLE)
export const OPCIONES_ESTADO_VIAJE = aOpciones(ESTADOS_VIAJE)
export const OPCIONES_NIVEL_COMBUSTIBLE = aOpciones(NIVELES_COMBUSTIBLE)
export const OPCIONES_TIPO_MANTENCION = aOpciones(TIPOS_MANTENCION)
export const OPCIONES_ESTADO_MANTENCION = aOpciones(ESTADOS_MANTENCION)
export const OPCIONES_CLASE_LICENCIA = CLASES_LICENCIA.map((clase) => ({ value: clase, label: `Clase ${clase}` }))

export function etiqueta(catalogo, valor) {
  return catalogo[valor]?.label ?? valor ?? '—'
}
