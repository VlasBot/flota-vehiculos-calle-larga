import { useState } from 'react'

// `valoresIniciales` puede ser un objeto o una función que lo construye
export function useFormulario(valoresIniciales) {
  const [valores, setValores] = useState(valoresIniciales)

  // Devuelve el onChange de un campo: cambiar('patente')
  const cambiar = (campo) => (evento) => {
    const { type, checked, value } = evento.target
    setValores((actuales) => ({ ...actuales, [campo]: type === 'checkbox' ? checked : value }))
  }

  return { valores, setValores, cambiar }
}
