import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Modal } from '../../components/ui/Modal'
import { SelectField } from '../../components/ui/SelectField'
import { IconAlerta } from '../../components/icons'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { fechaLocalISO, formatearFechaHora, formatearHora } from '../../utils/fechas'
import { textoONulo } from '../../utils/formato'
import { opcionConductor, opcionVehiculo } from '../shared/catalogosApi'
import { traducirError } from '../shared/errorMessages'
import { actualizarTurno, buscarTurnosEnConflicto, crearTurno } from './turnosApi'

const horaLocal = (valor) => {
  const fecha = new Date(valor)
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`
}

const aFormulario = (turno, fechaInicial) => ({
  conductor_id: turno?.conductor_id ?? '',
  vehiculo_id: turno?.vehiculo_id ?? '',
  fecha: turno ? fechaLocalISO(new Date(turno.inicio)) : fechaInicial,
  hora_inicio: turno ? horaLocal(turno.inicio) : '08:00',
  hora_fin: turno ? horaLocal(turno.fin) : '17:00',
  observaciones: turno?.observaciones ?? '',
})

// Si la hora de término es menor o igual a la de inicio, el turno termina al día siguiente
const calcularRango = ({ fecha, hora_inicio, hora_fin }) => {
  const inicio = new Date(`${fecha}T${hora_inicio}`)
  const fin = new Date(`${fecha}T${hora_fin}`)
  if (fin <= inicio) fin.setDate(fin.getDate() + 1)
  return { inicio, fin }
}

export function TurnoFormModal({ turno, fechaInicial, vehiculos, conductores, onCerrar, onGuardado }) {
  const { mostrarExito } = useToast()
  const { valores, cambiar } = useFormulario(aFormulario(turno, fechaInicial))
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const esEdicion = Boolean(turno)

  const rango = valores.fecha && valores.hora_inicio && valores.hora_fin ? calcularRango(valores) : null
  const terminaDiaSiguiente = rango && rango.fin.getDate() !== rango.inicio.getDate()

  const alGuardar = async (evento) => {
    evento.preventDefault()
    setErrorGeneral('')

    const nuevosErrores = {}
    if (!valores.conductor_id) nuevosErrores.conductor_id = 'Selecciona un conductor.'
    if (!valores.fecha) nuevosErrores.fecha = 'Indica la fecha del turno.'
    if (!valores.hora_inicio) nuevosErrores.hora_inicio = 'Indica la hora de inicio.'
    if (!valores.hora_fin) nuevosErrores.hora_fin = 'Indica la hora de término.'
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const datos = {
      conductor_id: valores.conductor_id,
      vehiculo_id: valores.vehiculo_id || null,
      inicio: rango.inicio.toISOString(),
      fin: rango.fin.toISOString(),
      observaciones: textoONulo(valores.observaciones),
    }

    setGuardando(true)

    const { data: enConflicto } = await buscarTurnosEnConflicto({
      conductorId: datos.conductor_id,
      inicio: datos.inicio,
      fin: datos.fin,
      excluirId: turno?.id,
    })

    if (enConflicto?.length > 0) {
      setGuardando(false)
      const choque = enConflicto[0]
      setErrorGeneral(
        `El conductor ya tiene un turno entre ${formatearFechaHora(choque.inicio)} y ${formatearHora(choque.fin)}.`,
      )
      return
    }

    const { error } = esEdicion ? await actualizarTurno(turno.id, datos) : await crearTurno(datos)
    setGuardando(false)

    if (error) {
      setErrorGeneral(traducirError(error))
      return
    }

    mostrarExito(esEdicion ? 'Turno actualizado correctamente.' : 'Turno asignado correctamente.')
    onGuardado()
  }

  return (
    <Modal
      titulo={esEdicion ? 'Editar turno' : 'Asignar turno'}
      onCerrar={onCerrar}
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-turno" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar turno'}
          </Button>
        </>
      }
    >
      <form id="formulario-turno" className="formulario" onSubmit={alGuardar} noValidate>
        {errorGeneral && (
          <p className="alerta-formulario" role="alert">
            <IconAlerta size={18} />
            <span>{errorGeneral}</span>
          </p>
        )}

        <SelectField
          label="Conductor *"
          value={valores.conductor_id}
          onChange={cambiar('conductor_id')}
          opciones={conductores.map(opcionConductor)}
          placeholder="Selecciona un conductor"
          error={errores.conductor_id}
        />
        <SelectField
          label="Vehículo asignado (opcional)"
          value={valores.vehiculo_id}
          onChange={cambiar('vehiculo_id')}
          opciones={[{ value: '', label: 'Sin vehículo fijo' }, ...vehiculos.map(opcionVehiculo)]}
        />
        <InputField
          label="Fecha *"
          type="date"
          value={valores.fecha}
          onChange={cambiar('fecha')}
          error={errores.fecha}
        />
        <div className="formulario__grid">
          <InputField
            label="Hora de inicio *"
            type="time"
            value={valores.hora_inicio}
            onChange={cambiar('hora_inicio')}
            error={errores.hora_inicio}
          />
          <InputField
            label="Hora de término *"
            type="time"
            value={valores.hora_fin}
            onChange={cambiar('hora_fin')}
            error={errores.hora_fin}
            ayuda={terminaDiaSiguiente ? 'El turno termina al día siguiente.' : undefined}
          />
        </div>
        <InputField
          as="textarea"
          label="Observaciones"
          value={valores.observaciones}
          onChange={cambiar('observaciones')}
        />
      </form>
    </Modal>
  )
}
