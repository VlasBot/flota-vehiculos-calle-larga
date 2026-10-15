import { useEffect, useState } from 'react'
import { listarConductoresParaSelector, listarVehiculosParaSelector } from './catalogosApi'

// Carga vehículos y conductores una vez para los selectores de una página
export function useSelectores() {
  const [vehiculos, setVehiculos] = useState([])
  const [conductores, setConductores] = useState([])

  useEffect(() => {
    let vigente = true

    Promise.all([listarVehiculosParaSelector(), listarConductoresParaSelector()]).then(
      ([respuestaVehiculos, respuestaConductores]) => {
        if (!vigente) return
        setVehiculos(respuestaVehiculos.data ?? [])
        setConductores(respuestaConductores.data ?? [])
      },
    )

    return () => {
      vigente = false
    }
  }, [])

  return { vehiculos, conductores }
}
