import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { InputField } from '../../components/ui/InputField'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { SelectField } from '../../components/ui/SelectField'
import { Spinner } from '../../components/ui/Spinner'
import { StatusChip } from '../../components/ui/StatusChip'
import { IconOjo } from '../../components/icons'
import { useListaPaginada } from '../../hooks/useListaPaginada'
import { formatearFechaHora } from '../../utils/fechas'
import { formatearKm } from '../../utils/formato'
import { ESTADOS_BITACORA } from '../shared/catalogos'
import { opcionConductor, opcionVehiculo } from '../shared/catalogosApi'
import { DetalleBitacoraModal } from '../shared/DetalleBitacoraModal'
import { EstadoChip } from '../shared/EstadoChip'
import { useSelectores } from '../shared/useSelectores'
import { listarBitacoras } from './bitacorasApi'

const COLUMNAS = [
  { key: 'inicio', titulo: 'Inicio' },
  { key: 'conductor', titulo: 'Conductor' },
  { key: 'vehiculo', titulo: 'Vehículo' },
  { key: 'destino', titulo: 'Destino' },
  { key: 'km', titulo: 'Recorrido', alinearDerecha: true },
  { key: 'estado', titulo: 'Estado' },
  { key: 'acciones', titulo: 'Detalle', alinearDerecha: true },
]

const TODOS = { value: '', label: 'Todos' }

export function BitacorasPage() {
  const { vehiculos, conductores } = useSelectores()
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [estado, setEstado] = useState('')
  const [vehiculoId, setVehiculoId] = useState('')
  const [conductorId, setConductorId] = useState('')
  const [seleccionada, setSeleccionada] = useState(null)

  const lista = useListaPaginada(listarBitacoras, { desde, hasta, estado, vehiculoId, conductorId })

  return (
    <section className="pagina">
      <PageHeader
        titulo="Bitácoras"
        descripcion="Registros de inicio y término de viaje hechos por los conductores."
      />

      <Card sinPadding>
        <div className="barra-filtros">
          <InputField label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <InputField label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          <SelectField
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            opciones={[TODOS, { value: 'abierta', label: 'En curso' }, { value: 'cerrada', label: 'Cerrada' }]}
          />
          <SelectField
            label="Vehículo"
            value={vehiculoId}
            onChange={(e) => setVehiculoId(e.target.value)}
            opciones={[TODOS, ...vehiculos.map(opcionVehiculo)]}
          />
          <SelectField
            label="Conductor"
            value={conductorId}
            onChange={(e) => setConductorId(e.target.value)}
            opciones={[TODOS, ...conductores.map(opcionConductor)]}
          />
        </div>

        {lista.cargando ? (
          <Spinner />
        ) : (
          <DataTable
            columnas={COLUMNAS}
            filas={lista.filas}
            mensajeVacio={lista.error || 'No hay bitácoras para los filtros seleccionados.'}
            renderFila={(bitacora) => (
              <tr key={bitacora.id}>
                <td data-label="Inicio">{formatearFechaHora(bitacora.inicio_en)}</td>
                <td data-label="Conductor">{bitacora.conductor?.nombre_completo}</td>
                <td data-label="Vehículo">{bitacora.vehiculo?.patente}</td>
                <td data-label="Destino">
                  {bitacora.destino}
                  {bitacora.novedades && (
                    <span className="texto-secundario">
                      <StatusChip tono="alerta">Con novedades</StatusChip>
                    </span>
                  )}
                </td>
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
                      aria-label="Ver detalle de la bitácora"
                      title="Ver detalle"
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
