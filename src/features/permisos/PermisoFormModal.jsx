import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Modal } from '../../components/ui/Modal'
import { SelectField } from '../../components/ui/SelectField'
import { Spinner } from '../../components/ui/Spinner'
import { StatusChip } from '../../components/ui/StatusChip'
import { IconAlerta } from '../../components/icons'
import { useToast } from '../../hooks/useToast'
import { fechaLocalISO, formatearDiaLargo, formatearFechaHora } from '../../utils/fechas'
import { textoONulo } from '../../utils/formato'
import { opcionConductor } from '../shared/catalogosApi'
import { traducirError } from '../shared/errorMessages'
import { diasEspeciales, tienePermiso } from './diasEspeciales'
import { crearPermiso, listarFeriados, listarViajesProgramadosDe } from './permisosApi'
import './Permisos.css'

// Por qué un viaje no puede recibir permiso (null = sí puede)
const motivoNoDisponible = (viaje) => {
  if (tienePermiso(viaje)) return 'Ya tiene permiso'
  if (viaje.dias.length === 0) return 'Día hábil'
  return null
}

export function PermisoFormModal({ conductores, onCerrar, onEmitido }) {
  const { mostrarExito } = useToast()
  const [conductorId, setConductorId] = useState('')
  const [viajes, setViajes] = useState(null) // null = aún no se elige conductor o está cargando
  const [cargando, setCargando] = useState(false)
  const [viajeId, setViajeId] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!conductorId) return
    let vigente = true

    Promise.all([listarViajesProgramadosDe(conductorId), listarFeriados({ desde: fechaLocalISO() })]).then(
      ([respuestaViajes, respuestaFeriados]) => {
        if (!vigente) return
        const error = respuestaViajes.error ?? respuestaFeriados.error
        if (error) setErrorGeneral(traducirError(error))

        const feriados = respuestaFeriados.data ?? []
        setViajes(
          (respuestaViajes.data ?? []).map((viaje) => ({
            ...viaje,
            dias: diasEspeciales(viaje.salida_programada, viaje.regreso_programado, feriados),
          })),
        )
        setCargando(false)
      },
    )

    return () => {
      vigente = false
    }
  }, [conductorId])

  const alElegirConductor = (evento) => {
    setConductorId(evento.target.value)
    setViajeId('')
    setViajes(null)
    setCargando(true)
    setErrorGeneral('')
  }

  const alEmitir = async (evento) => {
    evento.preventDefault()
    setErrorGeneral('')

    const nuevos = {}
    if (!conductorId) nuevos.conductor = 'Selecciona el conductor.'
    else if (!viajeId) nuevos.viaje = 'Selecciona el viaje programado.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setGuardando(true)
    const { data, error } = await crearPermiso({ viajeId, observaciones: textoONulo(observaciones) })
    setGuardando(false)

    if (error) {
      setErrorGeneral(traducirError(error))
      return
    }

    mostrarExito('Permiso generado. Ya puedes descargarlo en PDF.')
    onEmitido(data.id)
  }

  const disponibles = viajes?.filter((viaje) => !motivoNoDisponible(viaje)) ?? []

  return (
    <Modal
      titulo="Nuevo permiso de fin de semana o feriado"
      onCerrar={onCerrar}
      ancho="grande"
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-permiso" disabled={guardando || disponibles.length === 0}>
            {guardando ? 'Generando…' : 'Generar permiso'}
          </Button>
        </>
      }
    >
      <form id="formulario-permiso" className="formulario" onSubmit={alEmitir} noValidate>
        {errorGeneral && (
          <p className="alerta-formulario" role="alert">
            <IconAlerta size={18} />
            <span>{errorGeneral}</span>
          </p>
        )}

        <SelectField
          label="Conductor *"
          value={conductorId}
          onChange={alElegirConductor}
          opciones={conductores.map(opcionConductor)}
          placeholder="Selecciona un conductor"
          error={errores.conductor}
        />

        {cargando && <Spinner />}

        {viajes && (
          <fieldset className="formulario__seccion">
            <legend>Viaje programado *</legend>
            {viajes.length === 0 ? (
              <p className="texto-secundario">
                Este conductor no tiene viajes programados. Primero programa el viaje en la sección Viajes.
              </p>
            ) : (
              <>
                <p className="texto-secundario">
                  Solo se pueden elegir viajes que incluyan un sábado, domingo o feriado registrado.
                </p>
                <ul className="permiso-viajes">
                  {viajes.map((viaje) => {
                    const noDisponible = motivoNoDisponible(viaje)
                    return (
                      <li key={viaje.id}>
                        <label className={`permiso-viaje ${noDisponible ? 'permiso-viaje--bloqueado' : ''}`}>
                          <input
                            type="radio"
                            name="viaje-permiso"
                            value={viaje.id}
                            checked={viajeId === viaje.id}
                            onChange={() => setViajeId(viaje.id)}
                            disabled={Boolean(noDisponible)}
                          />
                          <span className="permiso-viaje__datos">
                            <strong>
                              {viaje.origen} → {viaje.destino}
                            </strong>
                            <span className="texto-secundario">
                              {formatearFechaHora(viaje.salida_programada)} a{' '}
                              {formatearFechaHora(viaje.regreso_programado)} · {viaje.vehiculo?.patente}
                            </span>
                            {viaje.dias.length > 0 && (
                              <span className="texto-secundario">
                                {viaje.dias
                                  .map((dia) => formatearDiaLargo(dia.fecha) + (dia.feriado ? ` (${dia.feriado})` : ''))
                                  .join(' · ')}
                              </span>
                            )}
                          </span>
                          {noDisponible && <StatusChip tono="neutro">{noDisponible}</StatusChip>}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
            {errores.viaje && <span className="campo__error">{errores.viaje}</span>}
          </fieldset>
        )}

        {disponibles.length > 0 && (
          <InputField
            as="textarea"
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Indicaciones adicionales que aparecerán en el permiso"
          />
        )}
      </form>
    </Modal>
  )
}
