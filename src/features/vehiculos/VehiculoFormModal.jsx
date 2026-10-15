import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Modal } from '../../components/ui/Modal'
import { SelectField } from '../../components/ui/SelectField'
import { IconAlerta } from '../../components/icons'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { aNumeroONulo, normalizarPatente, textoONulo } from '../../utils/formato'
import {
  OPCIONES_COMBUSTIBLE,
  OPCIONES_TIPO_VEHICULO,
  ESTADOS_VEHICULO,
} from '../shared/catalogos'
import { traducirError } from '../shared/errorMessages'
import { actualizarVehiculo, crearVehiculo } from './vehiculosApi'

// "En ruta" lo asignan las bitácoras de los conductores, no se elige a mano
const OPCIONES_ESTADO = ['disponible', 'en_mantencion', 'fuera_servicio'].map((valor) => ({
  value: valor,
  label: ESTADOS_VEHICULO[valor].label,
}))

const aFormulario = (vehiculo) => ({
  patente: vehiculo?.patente ?? '',
  numero_interno: vehiculo?.numero_interno ?? '',
  tipo: vehiculo?.tipo ?? '',
  marca: vehiculo?.marca ?? '',
  modelo: vehiculo?.modelo ?? '',
  anio: vehiculo?.anio ?? '',
  color: vehiculo?.color ?? '',
  tipo_combustible: vehiculo?.tipo_combustible ?? 'diesel',
  capacidad_pasajeros: vehiculo?.capacidad_pasajeros ?? '',
  unidad_asignada: vehiculo?.unidad_asignada ?? '',
  kilometraje_actual: vehiculo?.kilometraje_actual ?? 0,
  estado: vehiculo?.estado ?? 'disponible',
  vencimiento_revision_tecnica: vehiculo?.vencimiento_revision_tecnica ?? '',
  vencimiento_permiso_circulacion: vehiculo?.vencimiento_permiso_circulacion ?? '',
  vencimiento_soap: vehiculo?.vencimiento_soap ?? '',
  observaciones: vehiculo?.observaciones ?? '',
})

const validar = (valores) => {
  const errores = {}
  const anioActual = new Date().getFullYear()

  if (!/^[A-Z0-9]{5,6}$/.test(normalizarPatente(valores.patente))) {
    errores.patente = 'Ingresa una patente válida (ej: ABCD12 o AB1234).'
  }
  if (!valores.tipo) errores.tipo = 'Selecciona el tipo de vehículo.'
  if (!valores.marca.trim()) errores.marca = 'Ingresa la marca.'
  if (!valores.modelo.trim()) errores.modelo = 'Ingresa el modelo.'
  if (valores.anio !== '' && (valores.anio < 1950 || valores.anio > anioActual + 1)) {
    errores.anio = `El año debe estar entre 1950 y ${anioActual + 1}.`
  }
  if (valores.kilometraje_actual === '' || Number(valores.kilometraje_actual) < 0) {
    errores.kilometraje_actual = 'Ingresa el kilometraje actual.'
  }

  return errores
}

export function VehiculoFormModal({ vehiculo, onCerrar, onGuardado }) {
  const { mostrarExito } = useToast()
  const { valores, cambiar } = useFormulario(aFormulario(vehiculo))
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const esEdicion = Boolean(vehiculo)
  const opcionesEstado =
    vehiculo?.estado === 'en_ruta'
      ? [{ value: 'en_ruta', label: ESTADOS_VEHICULO.en_ruta.label }, ...OPCIONES_ESTADO]
      : OPCIONES_ESTADO

  const alGuardar = async (evento) => {
    evento.preventDefault()
    setErrorGeneral('')

    const nuevosErrores = validar(valores)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const datos = {
      patente: normalizarPatente(valores.patente),
      numero_interno: textoONulo(valores.numero_interno),
      tipo: valores.tipo,
      marca: valores.marca.trim(),
      modelo: valores.modelo.trim(),
      anio: aNumeroONulo(valores.anio),
      color: textoONulo(valores.color),
      tipo_combustible: valores.tipo_combustible,
      capacidad_pasajeros: aNumeroONulo(valores.capacidad_pasajeros),
      unidad_asignada: textoONulo(valores.unidad_asignada),
      kilometraje_actual: aNumeroONulo(valores.kilometraje_actual),
      estado: valores.estado,
      vencimiento_revision_tecnica: valores.vencimiento_revision_tecnica || null,
      vencimiento_permiso_circulacion: valores.vencimiento_permiso_circulacion || null,
      vencimiento_soap: valores.vencimiento_soap || null,
      observaciones: textoONulo(valores.observaciones),
    }

    setGuardando(true)
    const { error } = esEdicion
      ? await actualizarVehiculo(vehiculo.id, datos)
      : await crearVehiculo(datos)
    setGuardando(false)

    if (error) {
      setErrorGeneral(traducirError(error))
      return
    }

    mostrarExito(esEdicion ? 'Vehículo actualizado correctamente.' : `Vehículo ${datos.patente} registrado.`)
    onGuardado()
  }

  return (
    <Modal
      titulo={esEdicion ? `Editar vehículo ${vehiculo.patente}` : 'Nuevo vehículo'}
      onCerrar={onCerrar}
      ancho="grande"
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-vehiculo" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar vehículo'}
          </Button>
        </>
      }
    >
      <form id="formulario-vehiculo" className="formulario" onSubmit={alGuardar} noValidate>
        {errorGeneral && (
          <p className="alerta-formulario" role="alert">
            <IconAlerta size={18} />
            <span>{errorGeneral}</span>
          </p>
        )}

        <fieldset className="formulario__seccion">
          <legend>Identificación</legend>
          <div className="formulario__grid">
            <InputField
              label="Patente *"
              value={valores.patente}
              onChange={cambiar('patente')}
              error={errores.patente}
              placeholder="ABCD12"
              maxLength={8}
            />
            <InputField
              label="N° interno"
              value={valores.numero_interno}
              onChange={cambiar('numero_interno')}
              placeholder="Ej: M-12"
            />
            <SelectField
              label="Tipo *"
              value={valores.tipo}
              onChange={cambiar('tipo')}
              opciones={OPCIONES_TIPO_VEHICULO}
              placeholder="Selecciona un tipo"
              error={errores.tipo}
            />
            <SelectField
              label="Combustible"
              value={valores.tipo_combustible}
              onChange={cambiar('tipo_combustible')}
              opciones={OPCIONES_COMBUSTIBLE}
            />
            <InputField label="Marca *" value={valores.marca} onChange={cambiar('marca')} error={errores.marca} />
            <InputField label="Modelo *" value={valores.modelo} onChange={cambiar('modelo')} error={errores.modelo} />
            <InputField
              label="Año"
              type="number"
              inputMode="numeric"
              value={valores.anio}
              onChange={cambiar('anio')}
              error={errores.anio}
            />
            <InputField label="Color" value={valores.color} onChange={cambiar('color')} />
          </div>
        </fieldset>

        <fieldset className="formulario__seccion">
          <legend>Operación</legend>
          <div className="formulario__grid">
            <InputField
              label="Kilometraje actual *"
              type="number"
              inputMode="numeric"
              min="0"
              value={valores.kilometraje_actual}
              onChange={cambiar('kilometraje_actual')}
              error={errores.kilometraje_actual}
            />
            <InputField
              label="Capacidad de pasajeros"
              type="number"
              inputMode="numeric"
              min="0"
              value={valores.capacidad_pasajeros}
              onChange={cambiar('capacidad_pasajeros')}
            />
            <InputField
              label="Unidad / departamento asignado"
              value={valores.unidad_asignada}
              onChange={cambiar('unidad_asignada')}
              placeholder="Ej: DIDECO, Obras, Salud"
            />
            <SelectField
              label="Estado"
              value={valores.estado}
              onChange={cambiar('estado')}
              opciones={opcionesEstado}
              disabled={vehiculo?.estado === 'en_ruta'}
            />
          </div>
        </fieldset>

        <fieldset className="formulario__seccion">
          <legend>Documentación (vencimientos)</legend>
          <div className="formulario__grid">
            <InputField
              label="Revisión técnica"
              type="date"
              value={valores.vencimiento_revision_tecnica}
              onChange={cambiar('vencimiento_revision_tecnica')}
            />
            <InputField
              label="Permiso de circulación"
              type="date"
              value={valores.vencimiento_permiso_circulacion}
              onChange={cambiar('vencimiento_permiso_circulacion')}
            />
            <InputField
              label="SOAP"
              type="date"
              value={valores.vencimiento_soap}
              onChange={cambiar('vencimiento_soap')}
            />
          </div>
        </fieldset>

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
