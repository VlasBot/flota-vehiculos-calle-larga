import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Modal } from '../../components/ui/Modal'
import { SelectField } from '../../components/ui/SelectField'
import { IconAlerta } from '../../components/icons'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { fechaLocalISO } from '../../utils/fechas'
import { aNumeroONulo, textoONulo } from '../../utils/formato'
import { opcionVehiculo } from '../shared/catalogosApi'
import { OPCIONES_ESTADO_MANTENCION, OPCIONES_TIPO_MANTENCION } from '../shared/catalogos'
import { traducirError } from '../shared/errorMessages'
import { actualizarMantencion, crearMantencion } from './mantencionesApi'

const aFormulario = (mantencion) => ({
  vehiculo_id: mantencion?.vehiculo_id ?? '',
  tipo: mantencion?.tipo ?? 'preventiva',
  estado: mantencion?.estado ?? 'programada',
  descripcion: mantencion?.descripcion ?? '',
  fecha_programada: mantencion?.fecha_programada ?? '',
  km_programado: mantencion?.km_programado ?? '',
  fecha_realizada: mantencion?.fecha_realizada ?? '',
  km_realizado: mantencion?.km_realizado ?? '',
  taller: mantencion?.taller ?? '',
  costo: mantencion?.costo ?? '',
  observaciones: mantencion?.observaciones ?? '',
})

export function MantencionFormModal({ mantencion, vehiculos, onCerrar, onGuardado }) {
  const { mostrarExito } = useToast()
  const { valores, cambiar, setValores } = useFormulario(aFormulario(mantencion))
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const esEdicion = Boolean(mantencion)
  const realizada = valores.estado === 'realizada'

  const alCambiarEstado = (evento) => {
    const estado = evento.target.value
    // Al marcarla como realizada se propone la fecha de hoy
    setValores((actuales) => ({
      ...actuales,
      estado,
      fecha_realizada: estado === 'realizada' && !actuales.fecha_realizada ? fechaLocalISO() : actuales.fecha_realizada,
    }))
  }

  const alGuardar = async (evento) => {
    evento.preventDefault()
    setErrorGeneral('')

    const nuevosErrores = {}
    if (!valores.vehiculo_id) nuevosErrores.vehiculo_id = 'Selecciona el vehículo.'
    if (!valores.descripcion.trim()) nuevosErrores.descripcion = 'Describe el trabajo a realizar.'
    if (!valores.fecha_programada && valores.km_programado === '') {
      nuevosErrores.fecha_programada = 'Indica una fecha o un kilometraje programado.'
    }
    if (realizada && !valores.fecha_realizada) {
      nuevosErrores.fecha_realizada = 'Indica la fecha en que se realizó.'
    }
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const datos = {
      vehiculo_id: valores.vehiculo_id,
      tipo: valores.tipo,
      estado: valores.estado,
      descripcion: valores.descripcion.trim(),
      fecha_programada: valores.fecha_programada || null,
      km_programado: aNumeroONulo(valores.km_programado),
      fecha_realizada: realizada ? valores.fecha_realizada : null,
      km_realizado: realizada ? aNumeroONulo(valores.km_realizado) : null,
      taller: textoONulo(valores.taller),
      costo: aNumeroONulo(valores.costo),
      observaciones: textoONulo(valores.observaciones),
    }

    setGuardando(true)
    const { error } = esEdicion
      ? await actualizarMantencion(mantencion.id, datos)
      : await crearMantencion(datos)
    setGuardando(false)

    if (error) {
      setErrorGeneral(traducirError(error))
      return
    }

    mostrarExito(esEdicion ? 'Mantención actualizada.' : 'Mantención registrada.')
    onGuardado()
  }

  return (
    <Modal
      titulo={esEdicion ? 'Editar mantención' : 'Nueva mantención'}
      onCerrar={onCerrar}
      ancho="grande"
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-mantencion" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar mantención'}
          </Button>
        </>
      }
    >
      <form id="formulario-mantencion" className="formulario" onSubmit={alGuardar} noValidate>
        {errorGeneral && (
          <p className="alerta-formulario" role="alert">
            <IconAlerta size={18} />
            <span>{errorGeneral}</span>
          </p>
        )}

        <div className="formulario__grid">
          <SelectField
            label="Vehículo *"
            value={valores.vehiculo_id}
            onChange={cambiar('vehiculo_id')}
            opciones={vehiculos.map(opcionVehiculo)}
            placeholder="Selecciona un vehículo"
            error={errores.vehiculo_id}
            disabled={esEdicion}
          />
          <SelectField label="Tipo" value={valores.tipo} onChange={cambiar('tipo')} opciones={OPCIONES_TIPO_MANTENCION} />
          <div className="formulario__ancho-completo">
            <InputField
              label="Descripción *"
              value={valores.descripcion}
              onChange={cambiar('descripcion')}
              error={errores.descripcion}
              placeholder="Ej: Cambio de aceite y filtros, mantención 50.000 km"
            />
          </div>
          <InputField
            label="Fecha programada"
            type="date"
            value={valores.fecha_programada}
            onChange={cambiar('fecha_programada')}
            error={errores.fecha_programada}
          />
          <InputField
            label="Kilometraje programado"
            type="number"
            inputMode="numeric"
            min="0"
            value={valores.km_programado}
            onChange={cambiar('km_programado')}
          />
          <SelectField
            label="Estado"
            value={valores.estado}
            onChange={alCambiarEstado}
            opciones={OPCIONES_ESTADO_MANTENCION}
          />
          <InputField label="Taller" value={valores.taller} onChange={cambiar('taller')} />
          {realizada && (
            <>
              <InputField
                label="Fecha realizada *"
                type="date"
                value={valores.fecha_realizada}
                onChange={cambiar('fecha_realizada')}
                error={errores.fecha_realizada}
              />
              <InputField
                label="Kilometraje al realizarla"
                type="number"
                inputMode="numeric"
                min="0"
                value={valores.km_realizado}
                onChange={cambiar('km_realizado')}
              />
            </>
          )}
          <InputField
            label="Costo ($)"
            type="number"
            inputMode="numeric"
            min="0"
            value={valores.costo}
            onChange={cambiar('costo')}
          />
        </div>
        <p className="texto-secundario">
          Al pasar a "En taller" el vehículo queda en mantención y no se puede usar; al marcarla como
          realizada vuelve a quedar disponible.
        </p>
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
