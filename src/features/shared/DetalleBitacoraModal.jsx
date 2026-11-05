import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { IconAlerta, IconCheck, IconClose } from '../../components/icons'
import { duracionLegible, formatearFechaHora } from '../../utils/fechas'
import { formatearKm, formatearLitros, formatearPesos } from '../../utils/formato'
import { ESTADOS_BITACORA, ITEMS_CHECKLIST, NIVELES_COMBUSTIBLE, etiqueta } from './catalogos'
import { EstadoChip } from './EstadoChip'
import { listarCargasDeBitacora } from './bitacorasCompartidasApi'
import './DetalleBitacoraModal.css'

export function DetalleBitacoraModal({ bitacora, onCerrar }) {
  const [cargas, setCargas] = useState(null)

  useEffect(() => {
    let vigente = true
    listarCargasDeBitacora(bitacora.id).then(({ data }) => {
      if (vigente) setCargas(data ?? [])
    })
    return () => {
      vigente = false
    }
  }, [bitacora.id])

  const kmRecorridos = bitacora.km_fin !== null ? bitacora.km_fin - bitacora.km_inicio : null

  return (
    <Modal titulo={`Bitácora · ${bitacora.vehiculo?.patente ?? ''}`} onCerrar={onCerrar} ancho="grande">
      <div className="detalle-bitacora">
        <dl className="lista-datos">
          <div>
            <dt>Conductor</dt>
            <dd>{bitacora.conductor?.nombre_completo}</dd>
          </div>
          <div>
            <dt>Vehículo</dt>
            <dd>
              {bitacora.vehiculo?.patente} · {bitacora.vehiculo?.marca} {bitacora.vehiculo?.modelo}
            </dd>
          </div>
          <div>
            <dt>Destino</dt>
            <dd>{bitacora.destino}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>
              <EstadoChip catalogo={ESTADOS_BITACORA} valor={bitacora.estado} />
            </dd>
          </div>
          {bitacora.viaje?.motivo && (
            <div>
              <dt>Viaje programado</dt>
              <dd>{bitacora.viaje.motivo}</dd>
            </div>
          )}
          <div>
            <dt>Duración</dt>
            <dd>{bitacora.fin_en ? duracionLegible(bitacora.inicio_en, bitacora.fin_en) : 'En curso'}</dd>
          </div>
          <div>
            <dt>Km recorridos</dt>
            <dd>{formatearKm(kmRecorridos)}</dd>
          </div>
        </dl>

        {bitacora.novedades && (
          <p className="detalle-bitacora__novedades" role="note">
            <IconAlerta size={18} />
            <span>
              <strong>Novedades reportadas:</strong> {bitacora.novedades}
            </span>
          </p>
        )}

        <div className="detalle-bitacora__tramos">
          <section className="detalle-bitacora__tramo">
            <h3>Inicio</h3>
            <dl className="lista-datos">
              <div>
                <dt>Fecha y hora</dt>
                <dd>{formatearFechaHora(bitacora.inicio_en)}</dd>
              </div>
              <div>
                <dt>Kilometraje</dt>
                <dd>{formatearKm(bitacora.km_inicio)}</dd>
              </div>
              <div>
                <dt>Combustible</dt>
                <dd>{etiqueta(NIVELES_COMBUSTIBLE, bitacora.combustible_inicio)}</dd>
              </div>
            </dl>
            <ul className="detalle-bitacora__checklist">
              {/* Solo los puntos que existían cuando se registró la bitácora */}
              {ITEMS_CHECKLIST.filter((item) => item.clave in (bitacora.checklist_inicio ?? {})).map((item) => {
                const ok = bitacora.checklist_inicio[item.clave] === true
                return (
                  <li key={item.clave} className={ok ? 'ok' : 'pendiente'}>
                    {ok ? <IconCheck size={16} /> : <IconClose size={16} />}
                    <span>{item.label}</span>
                  </li>
                )
              })}
            </ul>
            {bitacora.observaciones_inicio && <p>{bitacora.observaciones_inicio}</p>}
          </section>

          <section className="detalle-bitacora__tramo">
            <h3>Término</h3>
            {bitacora.estado === 'abierta' ? (
              <p className="texto-secundario">El viaje aún no ha sido finalizado.</p>
            ) : (
              <>
                <dl className="lista-datos">
                  <div>
                    <dt>Fecha y hora</dt>
                    <dd>{formatearFechaHora(bitacora.fin_en)}</dd>
                  </div>
                  <div>
                    <dt>Kilometraje</dt>
                    <dd>{formatearKm(bitacora.km_fin)}</dd>
                  </div>
                  <div>
                    <dt>Combustible</dt>
                    <dd>{etiqueta(NIVELES_COMBUSTIBLE, bitacora.combustible_fin)}</dd>
                  </div>
                </dl>
                {bitacora.observaciones_fin && <p>{bitacora.observaciones_fin}</p>}
              </>
            )}
          </section>
        </div>

        <section>
          <h3>Cargas de combustible</h3>
          {!cargas ? (
            <Spinner />
          ) : cargas.length === 0 ? (
            <p className="texto-secundario">No se registraron cargas en este viaje.</p>
          ) : (
            <ul className="detalle-bitacora__cargas">
              {cargas.map((carga) => (
                <li key={carga.id}>
                  <strong>{formatearLitros(carga.litros)}</strong>
                  <span>{formatearFechaHora(carga.fecha)}</span>
                  <span>{formatearPesos(carga.monto)}</span>
                  {carga.estacion && <span>{carga.estacion}</span>}
                  {carga.numero_documento && <span>Doc. {carga.numero_documento}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  )
}
