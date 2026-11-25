import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Modal } from '../../components/ui/Modal'
import { SelectField } from '../../components/ui/SelectField'
import { IconAlerta } from '../../components/icons'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { aNumeroONulo, formatearKm, formatearNumero, formatearPesos, textoONulo } from '../../utils/formato'
import { opcionVehiculo } from '../shared/catalogosApi'
import { traducirError } from '../shared/errorMessages'
import { calcularCotizacion, rendimientoSugerido, unidadEnergia } from './calculoCotizacion'
import { crearCotizacion, listarCargasDeVehiculo } from './cotizacionesApi'
import { formatearFolio } from '../permisos/diasEspeciales'
import './Cotizaciones.css'

const VALORES_INICIALES = {
  vehiculo_id: '',
  origen: 'Municipalidad de Calle Larga',
  destino: '',
  km_tramo: '',
  ida_y_vuelta: true,
  rendimiento_km_litro: '',
  precio_combustible: '',
  peajes: '',
  otros_gastos: '',
  solicitante: '',
  fecha_viaje: '',
  observaciones: '',
}

const esPositivo = (valor) => valor !== '' && Number(valor) > 0
const esNoNegativo = (valor) => valor === '' || Number(valor) >= 0

const validar = (valores) => {
  const errores = {}
  if (!valores.vehiculo_id) errores.vehiculo_id = 'Selecciona el vehículo.'
  if (!valores.origen.trim()) errores.origen = 'Ingresa el origen.'
  if (!valores.destino.trim()) errores.destino = 'Ingresa el destino.'
  if (!esPositivo(valores.km_tramo)) errores.km_tramo = 'Ingresa los kilómetros del recorrido.'
  if (!esPositivo(valores.rendimiento_km_litro)) errores.rendimiento_km_litro = 'Ingresa el rendimiento.'
  if (!esPositivo(valores.precio_combustible)) errores.precio_combustible = 'Ingresa el precio del combustible.'
  if (!esNoNegativo(valores.peajes)) errores.peajes = 'El valor no puede ser negativo.'
  if (!esNoNegativo(valores.otros_gastos)) errores.otros_gastos = 'El valor no puede ser negativo.'
  return errores
}

export function CotizacionFormModal({ vehiculos, onCerrar, onEmitida }) {
  const { mostrarExito } = useToast()
  const { valores, setValores, cambiar } = useFormulario(VALORES_INICIALES)
  const [fuenteRendimiento, setFuenteRendimiento] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const vehiculo = vehiculos.find((item) => item.id === valores.vehiculo_id)
  const unidad = unidadEnergia(vehiculo)
  const calculo = calcularCotizacion(valores)

  // Al elegir el vehículo se propone su rendimiento (se puede corregir a mano)
  const alElegirVehiculo = async (evento) => {
    const id = evento.target.value
    const elegido = vehiculos.find((item) => item.id === id)
    setValores((actuales) => ({ ...actuales, vehiculo_id: id }))
    setFuenteRendimiento('Buscando el rendimiento del vehículo…')

    const { data: cargas } = await listarCargasDeVehiculo(id)
    const sugerido = rendimientoSugerido(elegido, cargas ?? [])
    setValores((actuales) =>
      actuales.vehiculo_id === id ? { ...actuales, rendimiento_km_litro: sugerido.valor } : actuales,
    )
    setFuenteRendimiento(sugerido.fuente)
  }

  const alCambiarRendimiento = (evento) => {
    cambiar('rendimiento_km_litro')(evento)
    setFuenteRendimiento('Rendimiento ingresado manualmente.')
  }

  const alEmitir = async (evento) => {
    evento.preventDefault()
    setErrorGeneral('')

    const nuevosErrores = validar(valores)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const datos = {
      vehiculo_id: valores.vehiculo_id,
      origen: valores.origen.trim(),
      destino: valores.destino.trim(),
      km_tramo: aNumeroONulo(valores.km_tramo),
      ida_y_vuelta: valores.ida_y_vuelta,
      rendimiento_km_litro: aNumeroONulo(valores.rendimiento_km_litro),
      precio_combustible: Math.round(Number(valores.precio_combustible)),
      peajes: Math.round(Number(valores.peajes || 0)),
      otros_gastos: Math.round(Number(valores.otros_gastos || 0)),
      solicitante: textoONulo(valores.solicitante),
      fecha_viaje: valores.fecha_viaje || null,
      observaciones: textoONulo(valores.observaciones),
    }

    setGuardando(true)
    const { data, error } = await crearCotizacion(datos)
    setGuardando(false)

    if (error) {
      setErrorGeneral(traducirError(error))
      return
    }

    mostrarExito(`Cotización folio N° ${formatearFolio(data.folio)} generada. Ya puedes descargarla en PDF.`)
    onEmitida(data.id)
  }

  return (
    <Modal
      titulo="Nueva cotización de viaje"
      onCerrar={onCerrar}
      ancho="grande"
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-cotizacion" disabled={guardando}>
            {guardando ? 'Generando…' : 'Generar cotización'}
          </Button>
        </>
      }
    >
      <form id="formulario-cotizacion" className="formulario" onSubmit={alEmitir} noValidate>
        {errorGeneral && (
          <p className="alerta-formulario" role="alert">
            <IconAlerta size={18} />
            <span>{errorGeneral}</span>
          </p>
        )}

        <fieldset className="formulario__seccion">
          <legend>Recorrido</legend>
          <div className="formulario__grid">
            <SelectField
              label="Vehículo *"
              value={valores.vehiculo_id}
              onChange={alElegirVehiculo}
              opciones={vehiculos.map(opcionVehiculo)}
              placeholder="Selecciona un vehículo"
              error={errores.vehiculo_id}
            />
            <InputField
              label="Fecha estimada del viaje"
              type="date"
              value={valores.fecha_viaje}
              onChange={cambiar('fecha_viaje')}
            />
            <InputField label="Origen *" value={valores.origen} onChange={cambiar('origen')} error={errores.origen} />
            <InputField
              label="Destino *"
              value={valores.destino}
              onChange={cambiar('destino')}
              error={errores.destino}
              placeholder="Ej: Santiago"
            />
            <InputField
              label="Kilómetros (solo ida) *"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={valores.km_tramo}
              onChange={cambiar('km_tramo')}
              error={errores.km_tramo}
            />
            <InputField
              label="Solicitante"
              value={valores.solicitante}
              onChange={cambiar('solicitante')}
              placeholder="Unidad, organización o persona"
            />
          </div>
          <label className="casilla">
            <input type="checkbox" checked={valores.ida_y_vuelta} onChange={cambiar('ida_y_vuelta')} />
            <span>Viaje de ida y vuelta (se duplican los kilómetros)</span>
          </label>
        </fieldset>

        <fieldset className="formulario__seccion">
          <legend>Costos</legend>
          <div className="formulario__grid">
            <InputField
              label={`Rendimiento (km por ${unidad === 'kWh' ? 'kWh' : 'litro'}) *`}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={valores.rendimiento_km_litro}
              onChange={alCambiarRendimiento}
              error={errores.rendimiento_km_litro}
              ayuda={fuenteRendimiento || 'Se propone al seleccionar el vehículo.'}
            />
            <InputField
              label={`Precio del combustible ($ por ${unidad === 'kWh' ? 'kWh' : 'litro'}) *`}
              type="number"
              inputMode="numeric"
              min="0"
              value={valores.precio_combustible}
              onChange={cambiar('precio_combustible')}
              error={errores.precio_combustible}
            />
            <InputField
              label="Peajes (total del viaje)"
              type="number"
              inputMode="numeric"
              min="0"
              value={valores.peajes}
              onChange={cambiar('peajes')}
              error={errores.peajes}
              ayuda="Suma de todos los peajes, considerando ida y vuelta."
            />
            <InputField
              label="Otros gastos"
              type="number"
              inputMode="numeric"
              min="0"
              value={valores.otros_gastos}
              onChange={cambiar('otros_gastos')}
              error={errores.otros_gastos}
              ayuda="Opcional: estacionamiento, viático del conductor, etc."
            />
          </div>
        </fieldset>

        <section className="cotizacion-resumen" aria-live="polite" aria-label="Costo estimado">
          <dl className="cotizacion-resumen__detalle">
            <div>
              <dt>Distancia total</dt>
              <dd>{formatearKm(calculo.kmTotal)}</dd>
            </div>
            <div>
              <dt>Consumo estimado</dt>
              <dd>
                {formatearNumero(calculo.litros)} {unidad}
              </dd>
            </div>
            <div>
              <dt>Combustible</dt>
              <dd>{formatearPesos(calculo.costoCombustible)}</dd>
            </div>
            <div>
              <dt>Peajes y otros</dt>
              <dd>{formatearPesos(calculo.costoPeajes + calculo.costoOtros)}</dd>
            </div>
          </dl>
          <p className="cotizacion-resumen__total">
            <span>Costo aproximado</span>
            <strong>{formatearPesos(calculo.total)}</strong>
          </p>
        </section>

        <InputField
          as="textarea"
          label="Observaciones"
          value={valores.observaciones}
          onChange={cambiar('observaciones')}
          placeholder="Información adicional que aparecerá en la cotización"
        />
      </form>
    </Modal>
  )
}
