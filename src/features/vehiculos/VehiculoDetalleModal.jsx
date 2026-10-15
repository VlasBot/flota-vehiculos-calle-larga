import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { formatearFecha, formatearFechaHora } from '../../utils/fechas'
import { formatearKm } from '../../utils/formato'
import {
  ESTADOS_BITACORA,
  ESTADOS_MANTENCION,
  ESTADOS_VEHICULO,
  TIPOS_COMBUSTIBLE,
  TIPOS_MANTENCION,
  TIPOS_VEHICULO,
  etiqueta,
} from '../shared/catalogos'
import { EstadoChip } from '../shared/EstadoChip'
import { VencimientoChip } from '../shared/VencimientoChip'
import { obtenerHistorialVehiculo } from './vehiculosApi'

export function VehiculoDetalleModal({ vehiculo, onCerrar }) {
  const [historial, setHistorial] = useState(null)

  useEffect(() => {
    let vigente = true
    obtenerHistorialVehiculo(vehiculo.id).then((resultado) => {
      if (vigente) setHistorial(resultado)
    })
    return () => {
      vigente = false
    }
  }, [vehiculo.id])

  return (
    <Modal titulo={`Ficha del vehículo ${vehiculo.patente}`} onCerrar={onCerrar} ancho="grande">
      <div className="ficha-vehiculo">
        <dl className="lista-datos">
          <div>
            <dt>Vehículo</dt>
            <dd>
              {etiqueta(TIPOS_VEHICULO, vehiculo.tipo)} {vehiculo.marca} {vehiculo.modelo}{' '}
              {vehiculo.anio ?? ''}
            </dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>
              <EstadoChip catalogo={ESTADOS_VEHICULO} valor={vehiculo.estado} />
            </dd>
          </div>
          <div>
            <dt>Kilometraje</dt>
            <dd>{formatearKm(vehiculo.kilometraje_actual)}</dd>
          </div>
          <div>
            <dt>Combustible</dt>
            <dd>{etiqueta(TIPOS_COMBUSTIBLE, vehiculo.tipo_combustible)}</dd>
          </div>
          <div>
            <dt>N° interno</dt>
            <dd>{vehiculo.numero_interno ?? '—'}</dd>
          </div>
          <div>
            <dt>Color</dt>
            <dd>{vehiculo.color ?? '—'}</dd>
          </div>
          <div>
            <dt>Capacidad</dt>
            <dd>{vehiculo.capacidad_pasajeros ? `${vehiculo.capacidad_pasajeros} pasajeros` : '—'}</dd>
          </div>
          <div>
            <dt>Unidad asignada</dt>
            <dd>{vehiculo.unidad_asignada ?? '—'}</dd>
          </div>
          <div>
            <dt>Revisión técnica</dt>
            <dd>
              <VencimientoChip fecha={vehiculo.vencimiento_revision_tecnica} />
            </dd>
          </div>
          <div>
            <dt>Permiso de circulación</dt>
            <dd>
              <VencimientoChip fecha={vehiculo.vencimiento_permiso_circulacion} />
            </dd>
          </div>
          <div>
            <dt>SOAP</dt>
            <dd>
              <VencimientoChip fecha={vehiculo.vencimiento_soap} />
            </dd>
          </div>
        </dl>

        {vehiculo.observaciones && (
          <p>
            <strong>Observaciones:</strong> {vehiculo.observaciones}
          </p>
        )}

        {!historial ? (
          <Spinner />
        ) : (
          <>
            <section>
              <h3>Últimos viajes</h3>
              {historial.bitacoras.length === 0 ? (
                <p className="texto-secundario">Este vehículo aún no registra viajes.</p>
              ) : (
                <ul className="ficha-vehiculo__lista">
                  {historial.bitacoras.map((bitacora) => (
                    <li key={bitacora.id}>
                      <span>
                        {formatearFechaHora(bitacora.inicio_en)} · {bitacora.destino}
                        <span className="texto-secundario">{bitacora.conductor?.nombre_completo}</span>
                      </span>
                      <EstadoChip catalogo={ESTADOS_BITACORA} valor={bitacora.estado} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3>Mantenciones recientes</h3>
              {historial.mantenciones.length === 0 ? (
                <p className="texto-secundario">Sin mantenciones registradas.</p>
              ) : (
                <ul className="ficha-vehiculo__lista">
                  {historial.mantenciones.map((mantencion) => (
                    <li key={mantencion.id}>
                      <span>
                        {etiqueta(TIPOS_MANTENCION, mantencion.tipo)} · {mantencion.descripcion}
                        <span className="texto-secundario">
                          {formatearFecha(mantencion.fecha_realizada ?? mantencion.fecha_programada)}
                        </span>
                      </span>
                      <EstadoChip catalogo={ESTADOS_MANTENCION} valor={mantencion.estado} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </Modal>
  )
}
