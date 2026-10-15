import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Modal } from '../../components/ui/Modal'
import { IconAlerta } from '../../components/icons'
import { useToast } from '../../hooks/useToast'
import { formatearKm, textoONulo } from '../../utils/formato'
import { traducirError } from '../shared/errorMessages'
import { finalizarViaje } from './conductorApi'
import { NivelCombustibleSelector } from './NivelCombustibleSelector'

// Más de esto en un solo viaje municipal probablemente es un error de tipeo
const KM_RECORRIDO_SOSPECHOSO = 1500

export function FinalizarViajeModal({ bitacora, onCerrar, onFinalizado }) {
  const { mostrarExito } = useToast()
  const [kmFin, setKmFin] = useState('')
  const [combustible, setCombustible] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [huboNovedades, setHuboNovedades] = useState(false)
  const [novedades, setNovedades] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  const recorrido = kmFin === '' ? null : Number(kmFin) - bitacora.km_inicio

  const alEnviar = async (evento) => {
    evento.preventDefault()
    setErrorGeneral('')

    const nuevos = {}
    if (kmFin === '') nuevos.kmFin = 'Ingresa el kilometraje del tablero.'
    else if (recorrido < 0) {
      nuevos.kmFin = `No puede ser menor al kilometraje inicial (${formatearKm(bitacora.km_inicio)}).`
    }
    if (!combustible) nuevos.combustible = 'Indica el nivel de combustible.'
    if (huboNovedades && !novedades.trim()) nuevos.novedades = 'Describe lo ocurrido.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    const { error } = await finalizarViaje({
      bitacoraId: bitacora.id,
      kmFin: Number(kmFin),
      combustible,
      observaciones: textoONulo(observaciones),
      novedades: huboNovedades ? textoONulo(novedades) : null,
    })
    setEnviando(false)

    if (error) {
      setErrorGeneral(traducirError(error))
      return
    }

    mostrarExito(`Viaje finalizado. Recorriste ${formatearKm(recorrido)}.`)
    onFinalizado()
  }

  return (
    <Modal
      titulo="Finalizar viaje"
      onCerrar={onCerrar}
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-finalizar" variante="urgente" disabled={enviando}>
            {enviando ? 'Registrando…' : 'Registrar término'}
          </Button>
        </>
      }
    >
      <form id="formulario-finalizar" className="formulario" onSubmit={alEnviar} noValidate>
        {errorGeneral && (
          <p className="alerta-formulario" role="alert">
            <IconAlerta size={18} />
            <span>{errorGeneral}</span>
          </p>
        )}

        <InputField
          label="Kilometraje final (tablero) *"
          type="number"
          inputMode="numeric"
          min={bitacora.km_inicio}
          value={kmFin}
          onChange={(e) => setKmFin(e.target.value)}
          error={errores.kmFin}
          ayuda={
            recorrido !== null && recorrido >= 0
              ? `Recorrido: ${formatearKm(recorrido)}${recorrido > KM_RECORRIDO_SOSPECHOSO ? ' — revisa que el número sea correcto' : ''}`
              : `Kilometraje inicial: ${formatearKm(bitacora.km_inicio)}`
          }
        />

        <NivelCombustibleSelector
          nombre="combustible-fin"
          leyenda="Nivel de combustible al llegar *"
          valor={combustible}
          onCambiar={setCombustible}
          error={errores.combustible}
        />

        <InputField
          as="textarea"
          label="Observaciones del viaje"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />

        <label className="casilla">
          <input type="checkbox" checked={huboNovedades} onChange={(e) => setHuboNovedades(e.target.checked)} />
          <span>Hubo novedades (daños, fallas, accidentes o multas)</span>
        </label>

        {huboNovedades && (
          <InputField
            as="textarea"
            label="Describe las novedades *"
            value={novedades}
            onChange={(e) => setNovedades(e.target.value)}
            error={errores.novedades}
          />
        )}
      </form>
    </Modal>
  )
}
