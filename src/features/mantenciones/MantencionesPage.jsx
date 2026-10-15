import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { InputField } from '../../components/ui/InputField'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { SelectField } from '../../components/ui/SelectField'
import { Spinner } from '../../components/ui/Spinner'
import { StatusChip } from '../../components/ui/StatusChip'
import { IconEditar, IconMas } from '../../components/icons'
import { useListaPaginada } from '../../hooks/useListaPaginada'
import { useValorDiferido } from '../../hooks/useValorDiferido'
import { diasHasta, formatearFecha } from '../../utils/fechas'
import { formatearKm, formatearPesos } from '../../utils/formato'
import {
  ESTADOS_MANTENCION,
  OPCIONES_ESTADO_MANTENCION,
  TIPOS_MANTENCION,
  etiqueta,
} from '../shared/catalogos'
import { opcionVehiculo } from '../shared/catalogosApi'
import { EstadoChip } from '../shared/EstadoChip'
import { useSelectores } from '../shared/useSelectores'
import { MantencionFormModal } from './MantencionFormModal'
import { listarMantenciones } from './mantencionesApi'

const COLUMNAS = [
  { key: 'vehiculo', titulo: 'Vehículo' },
  { key: 'trabajo', titulo: 'Trabajo' },
  { key: 'programada', titulo: 'Programada' },
  { key: 'estado', titulo: 'Estado' },
  { key: 'costo', titulo: 'Costo', alinearDerecha: true },
  { key: 'acciones', titulo: 'Acciones', alinearDerecha: true },
]

// Atrasada si ya pasó la fecha o el vehículo ya superó el kilometraje programado
const estaAtrasada = (mantencion) => {
  if (mantencion.estado !== 'programada') return false
  const porFecha = mantencion.fecha_programada && diasHasta(mantencion.fecha_programada) < 0
  const porKm =
    mantencion.km_programado !== null &&
    mantencion.vehiculo?.kilometraje_actual >= mantencion.km_programado
  return Boolean(porFecha || porKm)
}

export function MantencionesPage() {
  const { vehiculos } = useSelectores()
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('pendientes')
  const [vehiculoId, setVehiculoId] = useState('')
  const [modal, setModal] = useState(null) // { mantencion }
  const busquedaDiferida = useValorDiferido(busqueda)

  const lista = useListaPaginada(listarMantenciones, { busqueda: busquedaDiferida, estado, vehiculoId })

  const alGuardar = () => {
    setModal(null)
    lista.recargar()
  }

  return (
    <section className="pagina">
      <PageHeader
        titulo="Mantenciones"
        descripcion="Mantenciones preventivas y correctivas de la flota, por fecha o por kilometraje."
      >
        <Button onClick={() => setModal({ mantencion: null })}>
          <IconMas size={18} />
          Nueva mantención
        </Button>
      </PageHeader>

      <Card sinPadding>
        <div className="barra-filtros">
          <InputField
            label="Buscar"
            type="search"
            placeholder="Descripción o taller"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <SelectField
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            opciones={[
              { value: 'pendientes', label: 'Pendientes' },
              { value: '', label: 'Todas' },
              ...OPCIONES_ESTADO_MANTENCION,
            ]}
          />
          <SelectField
            label="Vehículo"
            value={vehiculoId}
            onChange={(e) => setVehiculoId(e.target.value)}
            opciones={[{ value: '', label: 'Todos' }, ...vehiculos.map(opcionVehiculo)]}
          />
        </div>

        {lista.cargando ? (
          <Spinner />
        ) : (
          <DataTable
            columnas={COLUMNAS}
            filas={lista.filas}
            mensajeVacio={
              lista.error ||
              (estado === 'pendientes'
                ? 'No hay mantenciones pendientes. ¡La flota está al día!'
                : 'No hay mantenciones para los filtros seleccionados.')
            }
            renderFila={(mantencion) => (
              <tr key={mantencion.id}>
                <td data-label="Vehículo">
                  <strong>{mantencion.vehiculo?.patente}</strong>
                  <span className="texto-secundario">
                    {mantencion.vehiculo?.marca} {mantencion.vehiculo?.modelo}
                  </span>
                </td>
                <td data-label="Trabajo">
                  {mantencion.descripcion}
                  <span className="texto-secundario">
                    {etiqueta(TIPOS_MANTENCION, mantencion.tipo)}
                    {mantencion.taller && ` · ${mantencion.taller}`}
                  </span>
                </td>
                <td data-label="Programada">
                  {mantencion.fecha_programada && <span>{formatearFecha(mantencion.fecha_programada)}</span>}
                  {mantencion.km_programado !== null && (
                    <span className="texto-secundario">
                      a los {formatearKm(mantencion.km_programado)} (actual{' '}
                      {formatearKm(mantencion.vehiculo?.kilometraje_actual)})
                    </span>
                  )}
                  {mantencion.estado === 'realizada' && (
                    <span className="texto-secundario">
                      Realizada el {formatearFecha(mantencion.fecha_realizada)}
                    </span>
                  )}
                </td>
                <td data-label="Estado">
                  {estaAtrasada(mantencion) ? (
                    <StatusChip tono="peligro">Atrasada</StatusChip>
                  ) : (
                    <EstadoChip catalogo={ESTADOS_MANTENCION} valor={mantencion.estado} />
                  )}
                </td>
                <td data-label="Costo" className="tabla__col-derecha">
                  {formatearPesos(mantencion.costo)}
                </td>
                <td data-label="Acciones">
                  <div className="acciones-fila">
                    <button
                      type="button"
                      className="boton-icono"
                      onClick={() => setModal({ mantencion })}
                      aria-label="Editar mantención"
                      title="Editar"
                    >
                      <IconEditar size={20} />
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

      {modal && (
        <MantencionFormModal
          mantencion={modal.mantencion}
          vehiculos={vehiculos}
          onCerrar={() => setModal(null)}
          onGuardado={alGuardar}
        />
      )}
    </section>
  )
}
