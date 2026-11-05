// Traduce los errores de Supabase/Postgres a mensajes claros en español

const MENSAJES_RESTRICCION = {
  viajes_vehiculo_sin_solapamiento:
    'El vehículo ya tiene otro viaje programado que se cruza con ese horario.',
  viajes_conductor_sin_solapamiento:
    'El conductor ya tiene otro viaje programado que se cruza con ese horario.',
  turnos_conductor_sin_solapamiento: 'El conductor ya tiene un turno que se cruza con ese horario.',
  viajes_rango_valido: 'El regreso debe ser posterior a la salida.',
  turnos_rango_valido: 'El término del turno debe ser posterior al inicio.',
  vehiculos_patente_key: 'Ya existe un vehículo registrado con esa patente.',
  profiles_rut_key: 'Ya existe una persona registrada con ese RUT.',
  bitacoras_una_abierta_por_conductor: 'Ya tienes un viaje en curso. Finalízalo antes de iniciar otro.',
  bitacoras_una_abierta_por_vehiculo: 'El vehículo ya está siendo usado en otro viaje.',
  permisos_viaje_id_key: 'Este viaje ya tiene un permiso emitido.',
  feriados_pkey: 'Esa fecha ya está registrada como feriado.',
  mantenciones_realizada_con_fecha: 'Indica la fecha en que se realizó la mantención.',
}

export function traducirError(error) {
  if (!error) return ''

  const mensaje = error.message ?? ''

  const restriccion = Object.keys(MENSAJES_RESTRICCION).find((nombre) => mensaje.includes(nombre))
  if (restriccion) return MENSAJES_RESTRICCION[restriccion]

  // Excepciones lanzadas a propósito desde las funciones SQL: ya vienen en español
  if (error.code === 'P0001') return mensaje

  if (error.code === '42501' || mensaje.includes('row-level security')) {
    return 'No tienes permisos para realizar esta acción.'
  }

  if (error.code === '23503') {
    return 'No se puede completar: el registro está relacionado con otros datos.'
  }

  if (error.code === '23514') return 'Alguno de los datos ingresados no es válido.'

  if (mensaje.includes('Failed to fetch') || mensaje.includes('NetworkError')) {
    return 'No hay conexión con el servidor. Revisa tu conexión a internet.'
  }

  if (mensaje.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.'

  return 'Ocurrió un error inesperado. Intenta nuevamente.'
}
