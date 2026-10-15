import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Modal } from '../../components/ui/Modal'
import { SelectField } from '../../components/ui/SelectField'
import { Spinner } from '../../components/ui/Spinner'
import { IconAlerta } from '../../components/icons'
import { useToast } from '../../hooks/useToast'
import { formatearKm, textoONulo } from '../../utils/formato'
import { ITEMS_CHECKLIST } from '../shared/catalogos'
import { traducirError } from '../shared/errorMessages'
import { iniciarViaje, listarVehiculosDisponibles } from './conductorApi'
import { NivelCombustibleSelector } from './NivelCombustibleSelector'

const checklistVacio = () => Object.fromEntries(ITEMS_CHECKLIST.map((item) => [item.clave, false]))

// `viaje` es opcional: si viene, el vehículo y el destino quedan fijados por la planificación
export function IniciarViajeModal({ viaje, onCerrar, onIniciado }) {
  const { mostrarExito } = useToast()
  const [vehiculos, setVehiculos] = useState(null)
  const [vehiculoId, setVehiculoId] = useState(viaje?.vehiculo_id ?? '')
  const [destino, setDestino] = useState(viaje?.destino ?? '')
  const [kmInicio, setKmInicio] = useState(viaje?.vehiculo?.kilometraje_actual ?? '')
  const [combustible, setCombustible] = useState('')
  const [checklist, setChecklist] = useState(checklistVacio)
  const [observaciones, setObservaciones] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (viaje) return
    listarVehiculosDisponibles().then(({ data }) => setVehiculos(data ?? []))
  }, [viaje])

  const vehiculo = viaje ? viaje.vehiculo : vehiculos?.find((item) => item.id === vehiculoId)
  const itemsPendientes = ITEMS_CHECKLIST.filter((item) => !checklist[item.clave])

  const alElegirVehiculo = (evento) => {
    const id = evento.target.value
    setVehiculoId(id)
    const elegido = vehiculos.find((item) => item.id === id)
    if (elegido) setKmInicio(elegido.kilometraje_actual)
  }

  const alMarcar = (clave) => (evento) => {
    setChecklist((actual) => ({ ...actual, [clave]: evento.target.checked }))
  }

  const alEnviar = async (evento) => {
    evento.preventDefault()
    setErrorGeneral('')

    const nuevos = {}
    if (!vehiculoId) nuevos.vehiculo = 'Selecciona el vehículo.'
    if (!destino.trim()) nuevos.destino = 'Indica el destino.'
    if (kmInicio === '' || Number(kmInicio) < 0) nuevos.kmInicio = 'Ingresa el kilometraje del tablero.'
    else if (vehiculo && Number(kmInicio) < vehiculo.kilometraje_actual) {
      nuevos.kmInicio = `No puede ser menor al último registrado (${formatearKm(vehiculo.kilometraje_actual)}).`
    }
    if (!combustible) nuevos.combustible = 'Indica el nivel de combustible.'
    // Si algo de la revisión no está bien, el conductor debe explicarlo
    if (itemsPendientes.length > 0 && !observaciones.trim()) {
      nuevos.observaciones = 'Hay puntos de la revisión sin marcar: describe el problema.'
    }
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    const { error } = await iniciarViaje({
      vehiculoId,
      viajeId: viaje?.id,
      destino: destino.trim(),
      kmInicio: Number(kmInicio),
      combustible,
      checklist,
      observaciones: textoONulo(observaciones),
    })
    setEnviando(false)

    if (error) {
      setErrorGeneral(traducirError(error))
      return
    }

    mostrarExito(`Viaje iniciado con el vehículo ${vehiculo?.patente}. ¡Buen viaje!`)
    onIniciado()
  }

  return (
    <Modal
      titulo="Iniciar viaje"
      onCerrar={onCerrar}
      ancho="grande"
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-iniciar" disabled={enviando}>
            {enviando ? 'Registrando…' : 'Registrar inicio'}
          </Button>
        </>
      }
    >
      <form id="formulario-iniciar" className="formulario" onSubmit={alEnviar} noValidate>
        {errorGeneral && (
          <p className="alerta-formulario" role="alert">
            <IconAlerta size={18} />
            <span>{errorGeneral}</span>
          </p>
        )}

        {viaje ? (
          <p>
            Vehículo asignado: <strong>{viaje.vehiculo?.patente}</strong> · {viaje.vehiculo?.marca}{' '}
            {viaje.vehiculo?.modelo}
            <span className="texto-secundario">Motivo: {viaje.motivo}</span>
          </p>
        ) : vehiculos === null ? (
          <Spinner />
        ) : (
          <SelectField
            label="Vehículo *"
            value={vehiculoId}
            onChange={alElegirVehiculo}
            opciones={vehiculos.map((item) => ({
              value: item.id,
              label: `${item.patente} · ${item.marca} ${item.modelo}`,
            }))}
            placeholder={vehiculos.length ? 'Selecciona el vehículo' : 'No hay vehículos disponibles'}
            error={errores.vehiculo}
          />
        )}

        <div className="formulario__grid">
          <InputField
            label="Destino *"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            error={errores.destino}
            readOnly={Boolean(viaje)}
          />
          <InputField
            label="Kilometraje inicial (tablero) *"
            type="number"
            inputMode="numeric"
            min="0"
            value={kmInicio}
            onChange={(e) => setKmInicio(e.target.value)}
            error={errores.kmInicio}
            ayuda={vehiculo ? `Último registro: ${formatearKm(vehiculo.kilometraje_actual)}` : undefined}
          />
        </div>

        <NivelCombustibleSelector
          nombre="combustible-inicio"
          leyenda="Nivel de combustible *"
          valor={combustible}
          onCambiar={setCombustible}
          error={errores.combustible}
        />

        <fieldset className="formulario__seccion">
          <legend>Revisión del vehículo antes de salir</legend>
          {ITEMS_CHECKLIST.map((item) => (
            <label key={item.clave} className="casilla">
              <input type="checkbox" checked={checklist[item.clave]} onChange={alMarcar(item.clave)} />
              <span>{item.label}</span>
            </label>
          ))}
        </fieldset>

        <InputField
          as="textarea"
          label={itemsPendientes.length > 0 ? 'Observaciones *' : 'Observaciones'}
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          error={errores.observaciones}
          placeholder="Daños visibles, ruidos, luces de advertencia, etc."
        />
      </form>
    </Modal>
  )
}
