const INICIO_POR_ROL = {
  admin: '/panel',
  usuario: '/viajes',
  conductor: '/mi-turno',
}

export function rutaInicioPorRol(rol) {
  return INICIO_POR_ROL[rol] ?? '/login'
}
