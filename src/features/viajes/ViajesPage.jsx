import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { DataTable } from '../../components/ui/DataTable'
import { InputField } from '../../components/ui/InputField'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { SelectField } from '../../components/ui/SelectField'
import { Spinner } from '../../components/ui/Spinner'
import { IconClose, IconEditar, IconMas } from '../../components/icons'
import { useListaPaginada } from '../../hooks/useListaPaginada'
import { useToast } from '../../hooks/useToast'
import { useValorDiferido } from '../../hooks/useValorDiferido'
import { fechaLocalISO, formatearFechaHora, formatearHora } from '../../utils/fechas'
import { ESTADOS_VIAJE, OPCIONES_ESTADO_VIAJE } from '../shared/catalogos'
import { EstadoChip } from '../shared/EstadoChip'
import { traducirError } from '../shared/errorMessages'
import { useSelectores } from '../shared/useSelectores'
import { ViajeFormModal } from './ViajeFormModal'
import { cancelarViaje, listarViajes } from './viajesApi'

const COLUMNAS = [
  { key: 'horario', titulo: 'Horario' },
  { key: 'destino', titulo: 'Destino y motivo' },
  { key: 'vehiculo', titulo: 'Vehículo' },
  { key: 'conductor', titulo: 'Conductor' },
  { key: 'estado', titulo: 'Estado' },
  { key: 'acciones', titulo: 'Acciones', alinearDerecha: true },
]

const mismoDia = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()

export function ViajesPage() {
  const { mostrarExito, mostrarError } = useToast()
  const { vehiculos, conductores } = useSelectores()
  const [busqueda, setBusqueda] = useState('')
  const [desde, setDesde] = useState(fechaLocalISO())
  const [hasta, setHasta] = useState('')
  const [estado, setEstado] = useState('')
  const [modal, setModal] = useState(null) // { tipo: 'form' | 'cancelar', viaje }
  const [cancelando, setCancelando] = useState(false)
  const busquedaDiferida = useValorDiferido(busqueda)

  const lista = useListaPaginada(listarViajes, { busqueda: busquedaDiferida, desde, hasta, estado })

  const cerrarModal = () => setModal(null)

  const alGuardar = () => {
    cerrarModal()
    lista.recargar()
  }

  const alCancelarViaje = async () => {
    setCancelando(true)
    const { error } = await cancelarViaje(modal.viaje.id)
    setCancelando(false)

    if (error) {
      mostrarError(traducirError(error))
      return
    }

    mostrarExito(`Viaje a ${modal.viaje.destino} cancelado.`)
    cerrarModal()
    lista.recargar()
  }

  return (
    <section className="pagina">
      <PageHeader
        titulo="Viajes"
        descripcion="Planificación de salidas: vehículo, conductor, horario y motivo de cada viaje."
      >
        <Button onClick={() => setModal({ tipo: 'form', viaje: null })}>
          <IconMas size={18} />
          Programar viaje
        </Button>
      </PageHeader>

      <Card sinPadding>
        <div className="barra-filtros">
          <InputField
            label="Buscar"
            type="search"
            placeholder="Destino, motivo o unidad"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
          <InputField
            label="Desde"
            type="date"
            value={desde}
            onChange={(evento) => setDesde(evento.target.value)}
          />
          <InputField
            label="Hasta"
            type="date"
            value={hasta}
            onChange={(evento) => setHasta(evento.target.value)}
          />
          <SelectField
            label="Estado"
            value={estado}
            onChange={(evento) => setEstado(evento.target.value)}
            opciones={[{ value: '', label: 'Todos' }, ...OPCIONES_ESTADO_VIAJE]}
          />
        </div>

        {lista.cargando ? (
          <Spinner />
        ) : (
          <DataTable
            columnas={COLUMNAS}
            filas={lista.filas}
            mensajeVacio={lista.error || 'No hay viajes para el período y filtros seleccionados.'}
            renderFila={(viaje) => (
              <tr key={viaje.id}>
                <td data-label="Horario">
                  <strong>{formatearFechaHora(viaje.salida_programada)}</strong>
                  <span className="texto-secundario">
                    Regreso:{' '}
                    {mismoDia(viaje.salida_programada, viaje.regreso_programado)
                      ? formatearHora(viaje.regreso_programado)
                      : formatearFechaHora(viaje.regreso_programado)}
                  </span>
                </td>
                <td data-label="Destino y motivo">
                  <strong>{viaje.destino}</strong>
                  <span className="texto-secundario">
                    {viaje.motivo}
                    {viaje.unidad_solicitante && ` · ${viaje.unidad_solicitante}`}
                  </span>
                </td>
                <td data-label="Vehículo">
                  {viaje.vehiculo?.patente}
                  <span className="texto-secundario">
                    {viaje.vehiculo?.marca} {viaje.vehiculo?.modelo}
                  </span>
                </td>
                <td data-label="Conductor">{viaje.conductor?.nombre_completo}</td>
                <td data-label="Estado">
                  <EstadoChip catalogo={ESTADOS_VIAJE} valor={viaje.estado} />
                </td>
                <td data-label="Acciones">
                  {viaje.estado === 'programado' ? (
                    <div className="acciones-fila">
                      <button
                        type="button"
                        className="boton-icono"
                        onClick={() => setModal({ tipo: 'form', viaje })}
                        aria-label={`Editar viaje a ${viaje.destino}`}
                        title="Editar"
                      >
                        <IconEditar size={20} />
                      </button>
                      <button
                        type="button"
                        className="boton-icono boton-icono--peligro"
                        onClick={() => setModal({ tipo: 'cancelar', viaje })}
                        aria-label={`Cancelar viaje a ${viaje.destino}`}
                        title="Cancelar viaje"
                      >
                        <IconClose size={20} />
                      </button>
                    </div>
                  ) : (
                    <span className="texto-secundario">—</span>
                  )}
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

      {modal?.tipo === 'form' && (
        <ViajeFormModal
          viaje={modal.viaje}
          vehiculos={vehiculos}
          conductores={conductores}
          onCerrar={cerrarModal}
          onGuardado={alGuardar}
        />
      )}

      {modal?.tipo === 'cancelar' && (
        <ConfirmModal
          titulo="Cancelar viaje"
          mensaje={`El viaje a ${modal.viaje.destino} del ${formatearFechaHora(modal.viaje.salida_programada)} quedará cancelado y el vehículo y el conductor quedarán libres en ese horario.`}
          textoConfirmar="Sí, cancelar viaje"
          variante="urgente"
          procesando={cancelando}
          onConfirmar={alCancelarViaje}
          onCancelar={cerrarModal}
        />
      )}
    </section>
  )
}
