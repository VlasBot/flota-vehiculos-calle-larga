import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Spinner } from '../../components/ui/Spinner'
import { IconClose, IconDescargar, IconMas } from '../../components/icons'
import { useListaPaginada } from '../../hooks/useListaPaginada'
import { useToast } from '../../hooks/useToast'
import { formatearFecha } from '../../utils/fechas'
import { formatearKm, formatearPesos } from '../../utils/formato'
import { traducirError } from '../shared/errorMessages'
import { formatearFolio } from '../permisos/diasEspeciales'
import { calcularCotizacion } from './calculoCotizacion'
import { CotizacionFormModal } from './CotizacionFormModal'
import { anularCotizacion, listarCotizaciones, listarVehiculosParaCotizar } from './cotizacionesApi'

const COLUMNAS = [
  { key: 'folio', titulo: 'Folio' },
  { key: 'recorrido', titulo: 'Recorrido' },
  { key: 'vehiculo', titulo: 'Vehículo' },
  { key: 'total', titulo: 'Costo aproximado' },
  { key: 'acciones', titulo: 'Acciones', alinearDerecha: true },
]

export function CotizacionesPage() {
  const navigate = useNavigate()
  const { mostrarExito, mostrarError } = useToast()
  const [vehiculos, setVehiculos] = useState([])
  const [modal, setModal] = useState(null) // { tipo: 'nueva' | 'anular', cotizacion }
  const [anulando, setAnulando] = useState(false)

  const lista = useListaPaginada(listarCotizaciones, {})

  useEffect(() => {
    let vigente = true
    listarVehiculosParaCotizar().then(({ data }) => {
      if (vigente) setVehiculos(data ?? [])
    })
    return () => {
      vigente = false
    }
  }, [])

  const cerrarModal = () => setModal(null)

  const alEmitir = (id) => {
    cerrarModal()
    navigate(`/cotizaciones/${id}/imprimir`)
  }

  const alAnular = async () => {
    setAnulando(true)
    const { error } = await anularCotizacion(modal.cotizacion.id)
    setAnulando(false)

    if (error) {
      mostrarError(traducirError(error))
      return
    }

    mostrarExito(`Cotización folio N° ${formatearFolio(modal.cotizacion.folio)} anulada.`)
    cerrarModal()
    lista.recargar()
  }

  return (
    <section className="pagina">
      <PageHeader
        titulo="Cotizar viaje"
        descripcion="Calcula el costo aproximado de un viaje según el vehículo, la distancia, el combustible y los peajes."
      >
        <Button onClick={() => setModal({ tipo: 'nueva' })}>
          <IconMas size={18} />
          Nueva cotización
        </Button>
      </PageHeader>

      <Card sinPadding>
        {lista.cargando ? (
          <Spinner />
        ) : (
          <DataTable
            columnas={COLUMNAS}
            filas={lista.filas}
            mensajeVacio={lista.error || 'Aún no se han generado cotizaciones.'}
            renderFila={(cotizacion) => {
              const calculo = calcularCotizacion(cotizacion)
              return (
                <tr key={cotizacion.id}>
                  <td data-label="Folio">
                    <strong>N° {formatearFolio(cotizacion.folio)}</strong>
                    <span className="texto-secundario">Emitida el {formatearFecha(cotizacion.emitido_en)}</span>
                  </td>
                  <td data-label="Recorrido">
                    <strong>
                      {cotizacion.origen} → {cotizacion.destino}
                    </strong>
                    <span className="texto-secundario">
                      {formatearKm(calculo.kmTotal)}
                      {cotizacion.ida_y_vuelta && ' (ida y vuelta)'}
                      {cotizacion.solicitante && ` · ${cotizacion.solicitante}`}
                    </span>
                  </td>
                  <td data-label="Vehículo">
                    <strong>{cotizacion.vehiculo?.patente}</strong>
                    <span className="texto-secundario">
                      {cotizacion.vehiculo?.marca} {cotizacion.vehiculo?.modelo}
                    </span>
                  </td>
                  <td data-label="Costo aproximado">
                    <strong>{formatearPesos(calculo.total)}</strong>
                  </td>
                  <td data-label="Acciones">
                    <div className="acciones-fila">
                      <Link
                        to={`/cotizaciones/${cotizacion.id}/imprimir`}
                        className="boton-icono"
                        aria-label={`Ver y descargar cotización folio ${formatearFolio(cotizacion.folio)}`}
                        title="Ver y descargar PDF"
                      >
                        <IconDescargar size={20} />
                      </Link>
                      <button
                        type="button"
                        className="boton-icono boton-icono--peligro"
                        onClick={() => setModal({ tipo: 'anular', cotizacion })}
                        aria-label={`Anular cotización folio ${formatearFolio(cotizacion.folio)}`}
                        title="Anular"
                      >
                        <IconClose size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            }}
          />
        )}

        <Pagination
          paginaActual={lista.pagina}
          totalPaginas={lista.totalPaginas}
          onCambiarPagina={lista.setPagina}
        />
      </Card>

      {modal?.tipo === 'nueva' && (
        <CotizacionFormModal vehiculos={vehiculos} onCerrar={cerrarModal} onEmitida={alEmitir} />
      )}

      {modal?.tipo === 'anular' && (
        <ConfirmModal
          titulo="Anular cotización"
          mensaje={`La cotización folio N° ${formatearFolio(modal.cotizacion.folio)} (${modal.cotizacion.origen} → ${modal.cotizacion.destino}) se eliminará del registro.`}
          textoConfirmar="Sí, anular cotización"
          variante="urgente"
          procesando={anulando}
          onConfirmar={alAnular}
          onCancelar={cerrarModal}
        />
      )}
    </section>
  )
}
