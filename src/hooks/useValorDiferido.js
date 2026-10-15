import { useEffect, useState } from 'react'

// Retrasa el valor para no consultar Supabase en cada tecla de un buscador
export function useValorDiferido(valor, demoraMs = 300) {
  const [valorDiferido, setValorDiferido] = useState(valor)

  useEffect(() => {
    const temporizador = setTimeout(() => setValorDiferido(valor), demoraMs)
    return () => clearTimeout(temporizador)
  }, [valor, demoraMs])

  return valorDiferido
}
