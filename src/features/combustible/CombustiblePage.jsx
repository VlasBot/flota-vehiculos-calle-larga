import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DataTable } from '../../components/ui/DataTable'
import { InputField } from '../../components/ui/InputField'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { SelectField } from '../../components/ui/SelectField'
import { Spinner } from '../../components/ui/Spinner'
import { IconMas } from '../../components/icons'
import { useListaPaginada } from '../../hooks/useListaPaginada'
import { fechaLocalISO, formatearFechaHora } from '../../utils/fechas'
import { formatearKm, formatearLitros, formatearNumero, formatearPesos } from '../../utils/formato'
import { opcionVehiculo } from '../shared/catalogosApi'
import { CargaCombustibleModal } from '../shared/CargaCombustibleModal'
import { useSelectores } from '../shared/useSelectores'
import { crearCarga, listarCargas, resumirCargas } from './combustibleApi'
import './CombustiblePage.css'

const COLUMNAS = [
  { key: 'fecha', titulo: 'Fecha' },
  { key: 'vehiculo', titulo: 'Vehículo' },
  { key: 'conductor', titulo: 'Conductor' },
  { key: 'litros', titulo: 'Litros', alinearDerecha: true },
  { key: 'monto', titulo: 'Monto', alinearDerecha: true },
  { key: 'km', titulo: 'Kilometraje', alinearDerecha: true },
  { key: 'documento', titulo: 'Documento' },
]

const primerDiaDelMes = () => {
  const hoy = new Date()
  return fechaLocalISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
}

export function CombustiblePage() {
  const { vehiculos, conductores } = useSelectores()
  const [desde, setDesde] = useState(primerDiaDelMes)
  const [hasta, setHasta] = useState('')
  const [vehiculoId, setVehiculoId] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [resumen, setResumen] = useState(null)

  const filtros = { desde, hasta, vehiculoId }
  const lista = useListaPaginada(listarCargas, filtros)
  const { recargar } = lista

  useEffect(() => {
    let vigente = true
    resumirCargas({ desde, hasta, vehiculoId }).then((resultado) => {
      if (vigente) setResumen(resultado)
    })
    return () => {
      vigente = false
    }
  }, [desde, hasta, vehiculoId, lista.total])

  const alGuardar = () => {
    setModalAbierto(false)
    recargar()
  }

  return (
    <section className="pagina">
      <PageHeader
        titulo="Combustible"
        descripcion="Cargas registradas por los conductores en sus viajes y cargas ingresadas por gestión."
      >
        <Button onClick={() => setModalAbierto(true)}>
          <IconMas size={18} />
          Registrar carga
        </Button>
      </PageHeader>

      {resumen && !resumen.error && (
        <ul className="resumen-combustible" aria-label="Resumen del período">
          <li>
            <span>Litros cargados</span>
            <strong>{formatearLitros(Math.round(resumen.litros * 10) / 10)}</strong>
          </li>
          <li>
            <span>Gasto total</span>
            <strong>{formatearPesos(resumen.monto)}</strong>
          </li>
          <li>
            <span>Cargas</span>
            <strong>{formatearNumero(resumen.cantidad)}</strong>
          </li>
        </ul>
      )}

      <Card sinPadding>
        <div className="barra-filtros">
          <InputField label="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <InputField label="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
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
            mensajeVacio={lista.error || 'No hay cargas de combustible en el período seleccionado.'}
            renderFila={(carga) => (
              <tr key={carga.id}>
                <td data-label="Fecha">{formatearFechaHora(carga.fecha)}</td>
                <td data-label="Vehículo">{carga.vehiculo?.patente}</td>
                <td data-label="Conductor">{carga.conductor?.nombre_completo ?? '—'}</td>
                <td data-label="Litros" className="tabla__col-derecha">
                  {formatearLitros(carga.litros)}
                </td>
                <td data-label="Monto" className="tabla__col-derecha">
                  {formatearPesos(carga.monto)}
                </td>
                <td data-label="Kilometraje" className="tabla__col-derecha">
                  {formatearKm(carga.kilometraje)}
                </td>
                <td data-label="Documento">
                  {carga.numero_documento ?? '—'}
                  {carga.estacion && <span className="texto-secundario">{carga.estacion}</span>}
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

      {modalAbierto && (
        <CargaCombustibleModal
          guardar={crearCarga}
          vehiculos={vehiculos}
          conductores={conductores}
          onCerrar={() => setModalAbierto(false)}
          onGuardado={alGuardar}
        />
      )}
    </section>
  )
}
