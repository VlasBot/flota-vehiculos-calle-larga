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
import { IconEditar, IconMas, IconOjo, IconClose } from '../../components/icons'
import { useAuth } from '../../hooks/useAuth'
import { useListaPaginada } from '../../hooks/useListaPaginada'
import { useToast } from '../../hooks/useToast'
import { useValorDiferido } from '../../hooks/useValorDiferido'
import { formatearKm } from '../../utils/formato'
import {
  ESTADOS_VEHICULO,
  OPCIONES_ESTADO_VEHICULO,
  OPCIONES_TIPO_VEHICULO,
  TIPOS_VEHICULO,
  etiqueta,
} from '../shared/catalogos'
import { EstadoChip } from '../shared/EstadoChip'
import { traducirError } from '../shared/errorMessages'
import { VehiculoDetalleModal } from './VehiculoDetalleModal'
import { VehiculoFormModal } from './VehiculoFormModal'
import { documentosPorVencer, eliminarVehiculo, listarVehiculos } from './vehiculosApi'
import './VehiculosPage.css'

const COLUMNAS = [
  { key: 'vehiculo', titulo: 'Vehículo' },
  { key: 'tipo', titulo: 'Tipo' },
  { key: 'km', titulo: 'Kilometraje', alinearDerecha: true },
  { key: 'estado', titulo: 'Estado' },
  { key: 'documentos', titulo: 'Documentos' },
  { key: 'acciones', titulo: 'Acciones', alinearDerecha: true },
]

export function VehiculosPage() {
  const { profile } = useAuth()
  const { mostrarExito, mostrarError } = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('')
  const [tipo, setTipo] = useState('')
  const [modal, setModal] = useState(null) // { tipo: 'form' | 'detalle' | 'eliminar', vehiculo }
  const [eliminando, setEliminando] = useState(false)
  const busquedaDiferida = useValorDiferido(busqueda)

  const lista = useListaPaginada(listarVehiculos, { busqueda: busquedaDiferida, estado, tipo })
  const hayFiltros = Boolean(busquedaDiferida || estado || tipo)

  const cerrarModal = () => setModal(null)

  const alGuardar = () => {
    cerrarModal()
    lista.recargar()
  }

  const alEliminar = async () => {
    setEliminando(true)
    const { error } = await eliminarVehiculo(modal.vehiculo.id)
    setEliminando(false)

    if (error) {
      mostrarError(
        error.code === '23503'
          ? 'No se puede eliminar: el vehículo tiene viajes o bitácoras registradas. Márcalo como "Fuera de servicio".'
          : traducirError(error),
      )
      return
    }

    mostrarExito(`Vehículo ${modal.vehiculo.patente} eliminado.`)
    cerrarModal()
    lista.recargar()
  }

  return (
    <section className="pagina">
      <PageHeader
        titulo="Vehículos"
        descripcion="Flota municipal: datos, estado operativo y vencimiento de documentos."
      >
        <Button onClick={() => setModal({ tipo: 'form', vehiculo: null })}>
          <IconMas size={18} />
          Nuevo vehículo
        </Button>
      </PageHeader>

      <Card sinPadding>
        <div className="barra-filtros">
          <InputField
            label="Buscar"
            type="search"
            placeholder="Patente, marca, modelo o N° interno"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
          <SelectField
            label="Estado"
            value={estado}
            onChange={(evento) => setEstado(evento.target.value)}
            opciones={[{ value: '', label: 'Todos' }, ...OPCIONES_ESTADO_VEHICULO]}
          />
          <SelectField
            label="Tipo"
            value={tipo}
            onChange={(evento) => setTipo(evento.target.value)}
            opciones={[{ value: '', label: 'Todos' }, ...OPCIONES_TIPO_VEHICULO]}
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
              (hayFiltros
                ? 'No se encontraron vehículos con esos filtros.'
                : 'Aún no hay vehículos registrados. Agrega el primero con "Nuevo vehículo".')
            }
            renderFila={(vehiculo) => {
              const alertas = documentosPorVencer(vehiculo)
              return (
                <tr key={vehiculo.id}>
                  <td data-label="Vehículo">
                    <strong className="vehiculo-patente">{vehiculo.patente}</strong>
                    <span className="texto-secundario">
                      {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio ?? ''}
                      {vehiculo.numero_interno && ` · N° ${vehiculo.numero_interno}`}
                    </span>
                  </td>
                  <td data-label="Tipo">{etiqueta(TIPOS_VEHICULO, vehiculo.tipo)}</td>
                  <td data-label="Kilometraje" className="tabla__col-derecha">
                    {formatearKm(vehiculo.kilometraje_actual)}
                  </td>
                  <td data-label="Estado">
                    <EstadoChip catalogo={ESTADOS_VEHICULO} valor={vehiculo.estado} />
                  </td>
                  <td data-label="Documentos">
                    {alertas.length === 0 ? (
                      <span className="texto-secundario">Al día</span>
                    ) : (
                      <ul className="vehiculo-alertas">
                        {alertas.map((alerta) => (
                          <li key={alerta.documento} className={alerta.vencido ? 'texto-alerta' : ''}>
                            {alerta.documento}: {alerta.vencido ? 'vencido' : `vence en ${alerta.dias} días`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td data-label="Acciones">
                    <div className="acciones-fila">
                      <button
                        type="button"
                        className="boton-icono"
                        onClick={() => setModal({ tipo: 'detalle', vehiculo })}
                        aria-label={`Ver ficha de ${vehiculo.patente}`}
                        title="Ver ficha"
                      >
                        <IconOjo size={20} />
                      </button>
                      <button
                        type="button"
                        className="boton-icono"
                        onClick={() => setModal({ tipo: 'form', vehiculo })}
                        aria-label={`Editar ${vehiculo.patente}`}
                        title="Editar"
                      >
                        <IconEditar size={20} />
                      </button>
                      {profile?.role === 'admin' && (
                        <button
                          type="button"
                          className="boton-icono boton-icono--peligro"
                          onClick={() => setModal({ tipo: 'eliminar', vehiculo })}
                          aria-label={`Eliminar ${vehiculo.patente}`}
                          title="Eliminar"
                        >
                          <IconClose size={20} />
                        </button>
                      )}
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

      {modal?.tipo === 'form' && (
        <VehiculoFormModal vehiculo={modal.vehiculo} onCerrar={cerrarModal} onGuardado={alGuardar} />
      )}

      {modal?.tipo === 'detalle' && (
        <VehiculoDetalleModal vehiculo={modal.vehiculo} onCerrar={cerrarModal} />
      )}

      {modal?.tipo === 'eliminar' && (
        <ConfirmModal
          titulo="Eliminar vehículo"
          mensaje={`Se eliminará el vehículo ${modal.vehiculo.patente} junto con su historial de mantenciones. Esta acción no se puede deshacer.`}
          textoConfirmar="Eliminar"
          variante="urgente"
          procesando={eliminando}
          onConfirmar={alEliminar}
          onCancelar={cerrarModal}
        />
      )}
    </section>
  )
}
