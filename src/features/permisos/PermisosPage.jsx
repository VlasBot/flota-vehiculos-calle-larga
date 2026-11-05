import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Spinner } from '../../components/ui/Spinner'
import { IconCalendario, IconClose, IconDescargar, IconMas } from '../../components/icons'
import { useListaPaginada } from '../../hooks/useListaPaginada'
import { useToast } from '../../hooks/useToast'
import { formatearFecha, formatearFechaHora } from '../../utils/fechas'
import { ESTADOS_VIAJE } from '../shared/catalogos'
import { EstadoChip } from '../shared/EstadoChip'
import { traducirError } from '../shared/errorMessages'
import { useSelectores } from '../shared/useSelectores'
import { formatearFolio } from './diasEspeciales'
import { FeriadosModal } from './FeriadosModal'
import { PermisoFormModal } from './PermisoFormModal'
import { anularPermiso, listarPermisos } from './permisosApi'

const COLUMNAS = [
  { key: 'folio', titulo: 'Folio' },
  { key: 'conductor', titulo: 'Conductor' },
  { key: 'viaje', titulo: 'Viaje' },
  { key: 'vehiculo', titulo: 'Vehículo' },
  { key: 'estado', titulo: 'Estado del viaje' },
  { key: 'acciones', titulo: 'Acciones', alinearDerecha: true },
]

export function PermisosPage() {
  const navigate = useNavigate()
  const { mostrarExito, mostrarError } = useToast()
  const { conductores } = useSelectores()
  const [modal, setModal] = useState(null) // { tipo: 'nuevo' | 'feriados' | 'anular', permiso }
  const [anulando, setAnulando] = useState(false)

  const lista = useListaPaginada(listarPermisos, {})

  const cerrarModal = () => setModal(null)

  const alEmitir = (id) => {
    cerrarModal()
    navigate(`/permisos/${id}/imprimir`)
  }

  const alAnular = async () => {
    setAnulando(true)
    const { error } = await anularPermiso(modal.permiso.id)
    setAnulando(false)

    if (error) {
      mostrarError(traducirError(error))
      return
    }

    mostrarExito(`Permiso folio ${formatearFolio(modal.permiso.folio)} anulado.`)
    cerrarModal()
    lista.recargar()
  }

  return (
    <section className="pagina">
      <PageHeader
        titulo="Permisos"
        descripcion="Permisos para conductores que realizan viajes programados en fin de semana o feriado."
      >
        <Button variante="secundario" onClick={() => setModal({ tipo: 'feriados' })}>
          <IconCalendario size={18} />
          Feriados
        </Button>
        <Button onClick={() => setModal({ tipo: 'nuevo' })}>
          <IconMas size={18} />
          Nuevo permiso
        </Button>
      </PageHeader>

      <Card sinPadding>
        {lista.cargando ? (
          <Spinner />
        ) : (
          <DataTable
            columnas={COLUMNAS}
            filas={lista.filas}
            mensajeVacio={lista.error || 'Aún no se han emitido permisos.'}
            renderFila={(permiso) => (
              <tr key={permiso.id}>
                <td data-label="Folio">
                  <strong>N° {formatearFolio(permiso.folio)}</strong>
                  <span className="texto-secundario">Emitido el {formatearFecha(permiso.emitido_en)}</span>
                </td>
                <td data-label="Conductor">{permiso.viaje?.conductor?.nombre_completo}</td>
                <td data-label="Viaje">
                  <strong>
                    {permiso.viaje?.origen} → {permiso.viaje?.destino}
                  </strong>
                  <span className="texto-secundario">{formatearFechaHora(permiso.viaje?.salida_programada)}</span>
                </td>
                <td data-label="Vehículo">{permiso.viaje?.vehiculo?.patente}</td>
                <td data-label="Estado del viaje">
                  <EstadoChip catalogo={ESTADOS_VIAJE} valor={permiso.viaje?.estado} />
                </td>
                <td data-label="Acciones">
                  <div className="acciones-fila">
                    <Link
                      to={`/permisos/${permiso.id}/imprimir`}
                      className="boton-icono"
                      aria-label={`Ver y descargar permiso folio ${formatearFolio(permiso.folio)}`}
                      title="Ver y descargar PDF"
                    >
                      <IconDescargar size={20} />
                    </Link>
                    <button
                      type="button"
                      className="boton-icono boton-icono--peligro"
                      onClick={() => setModal({ tipo: 'anular', permiso })}
                      aria-label={`Anular permiso folio ${formatearFolio(permiso.folio)}`}
                      title="Anular"
                    >
                      <IconClose size={20} />
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

      {modal?.tipo === 'nuevo' && (
        <PermisoFormModal conductores={conductores} onCerrar={cerrarModal} onEmitido={alEmitir} />
      )}

      {modal?.tipo === 'feriados' && <FeriadosModal onCerrar={cerrarModal} />}

      {modal?.tipo === 'anular' && (
        <ConfirmModal
          titulo="Anular permiso"
          mensaje={`El permiso folio ${formatearFolio(modal.permiso.folio)} de ${modal.permiso.viaje?.conductor?.nombre_completo} quedará sin efecto y se eliminará del registro. Podrás generar uno nuevo para el viaje si es necesario.`}
          textoConfirmar="Sí, anular permiso"
          variante="urgente"
          procesando={anulando}
          onConfirmar={alAnular}
          onCancelar={cerrarModal}
        />
      )}
    </section>
  )
}
