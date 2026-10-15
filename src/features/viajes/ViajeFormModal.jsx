import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Modal } from '../../components/ui/Modal'
import { SelectField } from '../../components/ui/SelectField'
import { IconAlerta } from '../../components/icons'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import {
  datetimeLocalAISO,
  fechaHoraLocalISO,
  formatearFecha,
  formatearFechaHora,
  formatearHora,
} from '../../utils/fechas'
import { aNumeroONulo, textoONulo } from '../../utils/formato'
import { opcionConductor, opcionVehiculo } from '../shared/catalogosApi'
import { traducirError } from '../shared/errorMessages'
import { actualizarViaje, buscarViajesEnConflicto, crearViaje } from './viajesApi'

const aFormulario = (viaje) => ({
  vehiculo_id: viaje?.vehiculo_id ?? '',
  conductor_id: viaje?.conductor_id ?? '',
  salida_programada: fechaHoraLocalISO(viaje?.salida_programada),
  regreso_programado: fechaHoraLocalISO(viaje?.regreso_programado),
  origen: viaje?.origen ?? 'Municipalidad de Calle Larga',
  destino: viaje?.destino ?? '',
  motivo: viaje?.motivo ?? '',
  unidad_solicitante: viaje?.unidad_solicitante ?? '',
  cantidad_pasajeros: viaje?.cantidad_pasajeros ?? '',
  observaciones: viaje?.observaciones ?? '',
})

const validar = (valores, vehiculo, conductor) => {
  const errores = {}

  if (!valores.vehiculo_id) errores.vehiculo_id = 'Selecciona un vehículo.'
  if (!valores.conductor_id) errores.conductor_id = 'Selecciona un conductor.'
  if (!valores.salida_programada) errores.salida_programada = 'Indica la fecha y hora de salida.'
  if (!valores.regreso_programado) errores.regreso_programado = 'Indica la fecha y hora de regreso.'
  if (!valores.destino.trim()) errores.destino = 'Indica el destino.'
  if (!valores.motivo.trim()) errores.motivo = 'Indica el motivo del viaje.'

  if (
    valores.salida_programada &&
    valores.regreso_programado &&
    new Date(valores.regreso_programado) <= new Date(valores.salida_programada)
  ) {
    errores.regreso_programado = 'El regreso debe ser posterior a la salida.'
  }

  if (vehiculo?.estado === 'fuera_servicio') {
    errores.vehiculo_id = 'El vehículo está fuera de servicio.'
  }

  if (vehiculo?.capacidad_pasajeros && Number(valores.cantidad_pasajeros) > vehiculo.capacidad_pasajeros) {
    errores.cantidad_pasajeros = `El vehículo tiene capacidad para ${vehiculo.capacidad_pasajeros} pasajeros.`
  }

  if (conductor?.licencia_vencimiento && valores.regreso_programado) {
    const vencimiento = new Date(`${conductor.licencia_vencimiento}T23:59:59`)
    if (vencimiento < new Date(valores.regreso_programado)) {
      errores.conductor_id = `La licencia del conductor vence el ${formatearFecha(conductor.licencia_vencimiento)}.`
    }
  }

  return errores
}

const describirConflicto = (viaje, vehiculoId) => {
  const quien =
    viaje.vehiculo_id === vehiculoId
      ? `El vehículo ${viaje.vehiculo?.patente}`
      : `El conductor ${viaje.conductor?.nombre_completo}`
  return `${quien} ya tiene un viaje a ${viaje.destino} entre ${formatearFechaHora(viaje.salida_programada)} y ${formatearHora(viaje.regreso_programado)}.`
}

export function ViajeFormModal({ viaje, vehiculos, conductores, onCerrar, onGuardado }) {
  const { mostrarExito } = useToast()
  const { valores, cambiar } = useFormulario(aFormulario(viaje))
  const [errores, setErrores] = useState({})
  const [conflictos, setConflictos] = useState([])
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const esEdicion = Boolean(viaje)

  const vehiculo = vehiculos.find((item) => item.id === valores.vehiculo_id)
  const conductor = conductores.find((item) => item.id === valores.conductor_id)

  const alGuardar = async (evento) => {
    evento.preventDefault()
    setErrorGeneral('')
    setConflictos([])

    const nuevosErrores = validar(valores, vehiculo, conductor)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const datos = {
      vehiculo_id: valores.vehiculo_id,
      conductor_id: valores.conductor_id,
      salida_programada: datetimeLocalAISO(valores.salida_programada),
      regreso_programado: datetimeLocalAISO(valores.regreso_programado),
      origen: valores.origen.trim() || 'Municipalidad de Calle Larga',
      destino: valores.destino.trim(),
      motivo: valores.motivo.trim(),
      unidad_solicitante: textoONulo(valores.unidad_solicitante),
      cantidad_pasajeros: aNumeroONulo(valores.cantidad_pasajeros),
      observaciones: textoONulo(valores.observaciones),
    }

    setGuardando(true)

    const { data: enConflicto, error: errorConflicto } = await buscarViajesEnConflicto({
      vehiculoId: datos.vehiculo_id,
      conductorId: datos.conductor_id,
      inicio: datos.salida_programada,
      fin: datos.regreso_programado,
      excluirId: viaje?.id,
    })

    if (!errorConflicto && enConflicto.length > 0) {
      setGuardando(false)
      setConflictos(enConflicto.map((item) => describirConflicto(item, datos.vehiculo_id)))
      return
    }

    const { error } = esEdicion ? await actualizarViaje(viaje.id, datos) : await crearViaje(datos)
    setGuardando(false)

    if (error) {
      setErrorGeneral(traducirError(error))
      return
    }

    mostrarExito(
      esEdicion
        ? 'Viaje actualizado correctamente.'
        : `Viaje a ${datos.destino} programado para el ${formatearFechaHora(datos.salida_programada)}.`,
    )
    onGuardado()
  }

  return (
    <Modal
      titulo={esEdicion ? 'Editar viaje' : 'Programar viaje'}
      onCerrar={onCerrar}
      ancho="grande"
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-viaje" disabled={guardando}>
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Programar viaje'}
          </Button>
        </>
      }
    >
      <form id="formulario-viaje" className="formulario" onSubmit={alGuardar} noValidate>
        {(errorGeneral || conflictos.length > 0) && (
          <div className="alerta-formulario" role="alert">
            <IconAlerta size={18} />
            <div>
              {errorGeneral && <p>{errorGeneral}</p>}
              {conflictos.length > 0 && (
                <>
                  <p>
                    <strong>Hay un cruce de horario:</strong>
                  </p>
                  <ul>
                    {conflictos.map((texto) => (
                      <li key={texto}>{texto}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}

        <div className="formulario__grid">
          <SelectField
            label="Vehículo *"
            value={valores.vehiculo_id}
            onChange={cambiar('vehiculo_id')}
            opciones={vehiculos.map(opcionVehiculo)}
            placeholder="Selecciona un vehículo"
            error={errores.vehiculo_id}
          />
          <SelectField
            label="Conductor *"
            value={valores.conductor_id}
            onChange={cambiar('conductor_id')}
            opciones={conductores.map(opcionConductor)}
            placeholder="Selecciona un conductor"
            error={errores.conductor_id}
          />
          <InputField
            label="Salida *"
            type="datetime-local"
            value={valores.salida_programada}
            onChange={cambiar('salida_programada')}
            error={errores.salida_programada}
          />
          <InputField
            label="Regreso estimado *"
            type="datetime-local"
            value={valores.regreso_programado}
            onChange={cambiar('regreso_programado')}
            error={errores.regreso_programado}
          />
          <InputField label="Origen" value={valores.origen} onChange={cambiar('origen')} />
          <InputField
            label="Destino *"
            value={valores.destino}
            onChange={cambiar('destino')}
            error={errores.destino}
            placeholder="Ej: Hospital San Juan de Dios, Los Andes"
          />
          <InputField
            label="Unidad solicitante"
            value={valores.unidad_solicitante}
            onChange={cambiar('unidad_solicitante')}
            placeholder="Ej: DIDECO"
          />
          <InputField
            label="Cantidad de pasajeros"
            type="number"
            inputMode="numeric"
            min="0"
            value={valores.cantidad_pasajeros}
            onChange={cambiar('cantidad_pasajeros')}
            error={errores.cantidad_pasajeros}
          />
          <div className="formulario__ancho-completo">
            <InputField
              label="Motivo *"
              value={valores.motivo}
              onChange={cambiar('motivo')}
              error={errores.motivo}
              placeholder="Ej: Traslado de adultos mayores a operativo de salud"
            />
          </div>
          <div className="formulario__ancho-completo">
            <InputField
              as="textarea"
              label="Observaciones"
              value={valores.observaciones}
              onChange={cambiar('observaciones')}
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
