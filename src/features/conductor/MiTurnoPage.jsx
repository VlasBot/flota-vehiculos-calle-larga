import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Spinner } from '../../components/ui/Spinner'
import { IconAlerta, IconCombustible, IconRuta } from '../../components/icons'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { diasHasta, formatearFecha, formatearFechaHora, formatearHora } from '../../utils/fechas'
import { formatearKm, formatearLitros } from '../../utils/formato'
import { listarCargasDeBitacora } from '../shared/bitacorasCompartidasApi'
import { CargaCombustibleModal } from '../shared/CargaCombustibleModal'
import { NIVELES_COMBUSTIBLE, etiqueta } from '../shared/catalogos'
import { traducirError } from '../shared/errorMessages'
import {
  listarMisProximosTurnos,
  listarMisViajesProgramados,
  obtenerBitacoraAbierta,
  registrarCargaEnViaje,
} from './conductorApi'
import { FinalizarViajeModal } from './FinalizarViajeModal'
import { IniciarViajeModal } from './IniciarViajeModal'
import './MiTurnoPage.css'

function AvisoLicencia({ vencimiento }) {
  const dias = diasHasta(vencimiento)
  if (dias === null || dias > 30) return null

  return (
    <p className="aviso-licencia" role="alert">
      <IconAlerta size={20} />
      {dias < 0
        ? `Tu licencia de conducir venció el ${formatearFecha(vencimiento)}. Avisa al encargado de flota.`
        : `Tu licencia de conducir vence el ${formatearFecha(vencimiento)} (en ${dias} días).`}
    </p>
  )
}

export function MiTurnoPage() {
  const { profile } = useAuth()
  const { mostrarError } = useToast()
  const [datos, setDatos] = useState(null)
  const [modal, setModal] = useState(null) // { tipo: 'iniciar' | 'finalizar' | 'carga', viaje }
  const [fechaHoy] = useState(() => new Intl.DateTimeFormat('es-CL', { dateStyle: 'full' }).format(new Date()))

  const cargar = useCallback(async () => {
    const [abierta, viajes, turnos] = await Promise.all([
      obtenerBitacoraAbierta(profile.id),
      listarMisViajesProgramados(profile.id),
      listarMisProximosTurnos(profile.id),
    ])

    const error = abierta.error ?? viajes.error ?? turnos.error
    if (error) mostrarError(traducirError(error))

    let cargas = []
    if (abierta.data) {
      const respuesta = await listarCargasDeBitacora(abierta.data.id)
      cargas = respuesta.data ?? []
    }

    setDatos({
      bitacora: abierta.data,
      cargas,
      viajes: viajes.data ?? [],
      turnos: turnos.data ?? [],
    })
  }, [profile.id, mostrarError])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cerrarYRecargar = () => {
    setModal(null)
    cargar()
  }

  if (!datos) return <Spinner />

  const { bitacora, cargas, viajes, turnos } = datos
  const primerNombre = profile.nombre_completo.split(' ')[0]

  return (
    <section className="pagina mi-turno">
      <header>
        <h1 className="mi-turno__saludo">Hola, {primerNombre}</h1>
        <p className="texto-secundario">{fechaHoy}</p>
      </header>

      <AvisoLicencia vencimiento={profile.licencia_vencimiento} />

      {bitacora ? (
        <Card oscura className="viaje-en-curso">
          <p className="viaje-en-curso__etiqueta">Viaje en curso</p>
          <h2 className="viaje-en-curso__destino">{bitacora.destino}</h2>
          <dl className="viaje-en-curso__datos">
            <div>
              <dt>Vehículo</dt>
              <dd>
                {bitacora.vehiculo?.patente} · {bitacora.vehiculo?.marca} {bitacora.vehiculo?.modelo}
              </dd>
            </div>
            <div>
              <dt>Salida</dt>
              <dd>{formatearFechaHora(bitacora.inicio_en)}</dd>
            </div>
            <div>
              <dt>Km inicial</dt>
              <dd>{formatearKm(bitacora.km_inicio)}</dd>
            </div>
            <div>
              <dt>Combustible al salir</dt>
              <dd>{etiqueta(NIVELES_COMBUSTIBLE, bitacora.combustible_inicio)}</dd>
            </div>
          </dl>

          {cargas.length > 0 && (
            <div className="viaje-en-curso__cargas">
              <p>Cargas de combustible en este viaje:</p>
              <ul>
                {cargas.map((carga) => (
                  <li key={carga.id}>
                    {formatearLitros(carga.litros)} · {formatearHora(carga.fecha)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="viaje-en-curso__acciones">
            <Button variante="secundario" onClick={() => setModal({ tipo: 'carga' })}>
              <IconCombustible size={20} />
              Registrar carga de combustible
            </Button>
            <Button variante="urgente" onClick={() => setModal({ tipo: 'finalizar' })}>
              Finalizar viaje
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="sin-viaje">
          <IconRuta size={40} />
          <div>
            <h2>No tienes un viaje en curso</h2>
            <p className="texto-secundario">
              Antes de salir registra el kilometraje, el combustible y la revisión del vehículo.
            </p>
          </div>
          <Button onClick={() => setModal({ tipo: 'iniciar', viaje: null })}>Iniciar viaje</Button>
        </Card>
      )}

      <div className="mi-turno__columnas">
        <Card>
          <h2 className="mi-turno__subtitulo">Mis viajes programados</h2>
          {viajes.length === 0 ? (
            <p className="texto-secundario">No tienes viajes asignados para los próximos días.</p>
          ) : (
            <ul className="mi-turno__lista">
              {viajes.map((viaje) => (
                <li key={viaje.id}>
                  <div>
                    <strong>{viaje.destino}</strong>
                    <span className="texto-secundario">
                      {formatearFechaHora(viaje.salida_programada)} · {viaje.vehiculo?.patente}
                    </span>
                    <span className="texto-secundario">{viaje.motivo}</span>
                  </div>
                  {!bitacora && (
                    <Button variante="secundario" onClick={() => setModal({ tipo: 'iniciar', viaje })}>
                      Iniciar este viaje
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mi-turno__subtitulo">Mis próximos turnos</h2>
          {turnos.length === 0 ? (
            <p className="texto-secundario">No tienes turnos asignados.</p>
          ) : (
            <ul className="mi-turno__lista">
              {turnos.map((turno) => (
                <li key={turno.id}>
                  <div>
                    <strong>{formatearFecha(turno.inicio)}</strong>
                    <span className="texto-secundario">
                      {formatearHora(turno.inicio)} – {formatearHora(turno.fin)}
                      {turno.vehiculo && ` · ${turno.vehiculo.patente}`}
                    </span>
                    {turno.observaciones && <span className="texto-secundario">{turno.observaciones}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {modal?.tipo === 'iniciar' && (
        <IniciarViajeModal viaje={modal.viaje} onCerrar={() => setModal(null)} onIniciado={cerrarYRecargar} />
      )}

      {modal?.tipo === 'finalizar' && (
        <FinalizarViajeModal bitacora={bitacora} onCerrar={() => setModal(null)} onFinalizado={cerrarYRecargar} />
      )}

      {modal?.tipo === 'carga' && (
        <CargaCombustibleModal
          guardar={(datosCarga) => registrarCargaEnViaje(bitacora, datosCarga)}
          vehiculoFijo={{ id: bitacora.vehiculo_id, ...bitacora.vehiculo }}
          kmSugerido={bitacora.km_inicio}
          onCerrar={() => setModal(null)}
          onGuardado={cerrarYRecargar}
        />
      )}
    </section>
  )
}
