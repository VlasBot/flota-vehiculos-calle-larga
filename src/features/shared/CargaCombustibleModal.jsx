import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Modal } from '../../components/ui/Modal'
import { SelectField } from '../../components/ui/SelectField'
import { IconAlerta } from '../../components/icons'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { datetimeLocalAISO, fechaHoraLocalISO } from '../../utils/fechas'
import { aNumeroONulo, formatearLitros, textoONulo } from '../../utils/formato'
import { opcionConductor, opcionVehiculo } from './catalogosApi'
import { traducirError } from './errorMessages'

// Se usa en dos contextos:
//  - Gestión: elige vehículo, conductor y fecha libremente.
//  - Conductor: el vehículo y la bitácora vienen fijos del viaje en curso.
export function CargaCombustibleModal({
  guardar,
  vehiculos,
  conductores,
  vehiculoFijo,
  kmSugerido,
  onCerrar,
  onGuardado,
}) {
  const { mostrarExito } = useToast()
  const { valores, cambiar } = useFormulario(() => ({
    vehiculo_id: vehiculoFijo?.id ?? '',
    conductor_id: '',
    fecha: fechaHoraLocalISO(new Date()),
    litros: '',
    monto: '',
    kilometraje: kmSugerido ?? '',
    numero_documento: '',
    estacion: '',
  }))
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const alGuardar = async (evento) => {
    evento.preventDefault()
    setErrorGeneral('')

    const litros = aNumeroONulo(valores.litros)
    const nuevosErrores = {}
    if (!valores.vehiculo_id) nuevosErrores.vehiculo_id = 'Selecciona el vehículo.'
    if (!litros || litros <= 0) nuevosErrores.litros = 'Ingresa los litros cargados.'
    if (litros > 1000) nuevosErrores.litros = 'La cantidad de litros no parece válida.'
    if (valores.monto !== '' && Number(valores.monto) < 0) nuevosErrores.monto = 'El monto no puede ser negativo.'
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const datos = {
      vehiculo_id: valores.vehiculo_id,
      litros,
      monto: aNumeroONulo(valores.monto),
      kilometraje: aNumeroONulo(valores.kilometraje),
      numero_documento: textoONulo(valores.numero_documento),
      estacion: textoONulo(valores.estacion),
    }

    if (!vehiculoFijo) {
      datos.fecha = datetimeLocalAISO(valores.fecha)
      datos.conductor_id = valores.conductor_id || null
    }

    setGuardando(true)
    const { error } = await guardar(datos)
    setGuardando(false)

    if (error) {
      setErrorGeneral(traducirError(error))
      return
    }

    mostrarExito(`Carga de ${formatearLitros(litros)} registrada correctamente.`)
    onGuardado()
  }

  return (
    <Modal
      titulo="Registrar carga de combustible"
      onCerrar={onCerrar}
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-carga" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Registrar carga'}
          </Button>
        </>
      }
    >
      <form id="formulario-carga" className="formulario" onSubmit={alGuardar} noValidate>
        {errorGeneral && (
          <p className="alerta-formulario" role="alert">
            <IconAlerta size={18} />
            <span>{errorGeneral}</span>
          </p>
        )}

        {vehiculoFijo ? (
          <p>
            Vehículo: <strong>{vehiculoFijo.patente}</strong> · {vehiculoFijo.marca} {vehiculoFijo.modelo}
          </p>
        ) : (
          <>
            <SelectField
              label="Vehículo *"
              value={valores.vehiculo_id}
              onChange={cambiar('vehiculo_id')}
              opciones={vehiculos.map(opcionVehiculo)}
              placeholder="Selecciona un vehículo"
              error={errores.vehiculo_id}
            />
            <SelectField
              label="Conductor"
              value={valores.conductor_id}
              onChange={cambiar('conductor_id')}
              opciones={[{ value: '', label: 'Sin conductor' }, ...conductores.map(opcionConductor)]}
            />
            <InputField label="Fecha y hora" type="datetime-local" value={valores.fecha} onChange={cambiar('fecha')} />
          </>
        )}

        <div className="formulario__grid">
          <InputField
            label="Litros *"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={valores.litros}
            onChange={cambiar('litros')}
            error={errores.litros}
          />
          <InputField
            label="Monto ($)"
            type="number"
            inputMode="numeric"
            min="0"
            value={valores.monto}
            onChange={cambiar('monto')}
            error={errores.monto}
          />
          <InputField
            label="Kilometraje al cargar"
            type="number"
            inputMode="numeric"
            min="0"
            value={valores.kilometraje}
            onChange={cambiar('kilometraje')}
          />
          <InputField
            label="N° boleta / vale"
            value={valores.numero_documento}
            onChange={cambiar('numero_documento')}
          />
        </div>
        <InputField
          label="Estación de servicio"
          value={valores.estacion}
          onChange={cambiar('estacion')}
          placeholder="Ej: Copec Calle Larga"
        />
      </form>
    </Modal>
  )
}
