import {
  IconBitacora,
  IconCalculadora,
  IconCalendario,
  IconCombustible,
  IconConductor,
  IconDocumento,
  IconHerramienta,
  IconHistorial,
  IconPanel,
  IconPersonas,
  IconRuta,
  IconVehiculo,
} from '../icons'

const ENLACES_GESTION = [
  { to: '/viajes', label: 'Viajes', Icono: IconRuta },
  { to: '/permisos', label: 'Permisos', Icono: IconDocumento },
  { to: '/turnos', label: 'Turnos', Icono: IconCalendario },
  { to: '/vehiculos', label: 'Vehículos', Icono: IconVehiculo },
  { to: '/mantenciones', label: 'Mantenciones', Icono: IconHerramienta },
  { to: '/bitacoras', label: 'Bitácoras', Icono: IconBitacora },
  { to: '/combustible', label: 'Combustible', Icono: IconCombustible },
  { to: '/conductores', label: 'Conductores', Icono: IconConductor },
  { to: '/usuarios', label: 'Usuarios', Icono: IconPersonas },
  { to: '/cotizaciones', label: 'Cotizar Viaje', Icono: IconCalculadora },
]

export const ENLACES_POR_ROL = {
  admin: [{ to: '/panel', label: 'Panel', Icono: IconPanel }, ...ENLACES_GESTION],
  usuario: ENLACES_GESTION,
  conductor: [
    { to: '/mi-turno', label: 'Mi turno', Icono: IconRuta },
    { to: '/mi-historial', label: 'Mi historial', Icono: IconHistorial },
  ],
}

export const NOMBRE_ROL = {
  admin: 'Administrador',
  usuario: 'Gestión de flota',
  conductor: 'Conductor',
}

export function tituloDeRuta(pathname) {
  const todos = Object.values(ENLACES_POR_ROL).flat()
  return todos.find((enlace) => pathname.startsWith(enlace.to))?.label ?? 'Gestión de Flota'
}
