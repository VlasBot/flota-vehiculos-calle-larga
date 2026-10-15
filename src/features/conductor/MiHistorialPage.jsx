import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Spinner } from '../../components/ui/Spinner'
import { IconOjo } from '../../components/icons'
import { useAuth } from '../../hooks/useAuth'
import { useListaPaginada } from '../../hooks/useListaPaginada'
import { formatearFechaHora } from '../../utils/fechas'
import { formatearKm } from '../../utils/formato'
import { ESTADOS_BITACORA } from '../shared/catalogos'
import { DetalleBitacoraModal } from '../shared/DetalleBitacoraModal'
import { EstadoChip } from '../shared/EstadoChip'
import { listarMiHistorial } from './conductorApi'

const COLUMNAS = [
  { key: 'inicio', titulo: 'Fecha' },
  { key: 'vehiculo', titulo: 'Vehículo' },
  { key: 'destino', titulo: 'Destino' },
  { key: 'km', titulo: 'Recorrido', alinearDerecha: true },
  { key: 'estado', titulo: 'Estado' },
  { key: 'detalle', titulo: 'Detalle', alinearDerecha: true },
]

export function MiHistorialPage() {
  const { profile } = useAuth()
  const [seleccionada, setSeleccionada] = useState(null)
  const lista = useListaPaginada(listarMiHistorial, { conductorId: profile.id })

  return (
    <section className="pagina">
      <PageHeader titulo="Mi historial" descripcion="Todos los viajes que has registrado." />

      <Card sinPadding>
        {lista.cargando ? (
          <Spinner />
        ) : (
          <DataTable
            columnas={COLUMNAS}
            filas={lista.filas}
            mensajeVacio={lista.error || 'Aún no has registrado viajes.'}
            renderFila={(bitacora) => (
              <tr key={bitacora.id}>
                <td data-label="Fecha">{formatearFechaHora(bitacora.inicio_en)}</td>
                <td data-label="Vehículo">{bitacora.vehiculo?.patente}</td>
                <td data-label="Destino">{bitacora.destino}</td>
                <td data-label="Recorrido" className="tabla__col-derecha">
                  {bitacora.km_fin !== null ? formatearKm(bitacora.km_fin - bitacora.km_inicio) : '—'}
                </td>
                <td data-label="Estado">
                  <EstadoChip catalogo={ESTADOS_BITACORA} valor={bitacora.estado} />
                </td>
                <td data-label="Detalle">
                  <div className="acciones-fila">
                    <button
                      type="button"
                      className="boton-icono"
                      onClick={() => setSeleccionada(bitacora)}
                      aria-label="Ver detalle del viaje"
                    >
                      <IconOjo size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        )}
        <Pagination
          paginaActual={lista.pagina}
          totalPaginas={lista.totalPaginas}
          onCambiarPagina={lista.setPagina}
        />
      </Card>

      {seleccionada && (
        <DetalleBitacoraModal bitacora={seleccionada} onCerrar={() => setSeleccionada(null)} />
      )}
    </section>
  )
}
