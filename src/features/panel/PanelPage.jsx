import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { StatusChip } from '../../components/ui/StatusChip'
import { IconAlerta } from '../../components/icons'
import { diasHasta, formatearFecha, formatearFechaHora, formatearHora } from '../../utils/fechas'
import { formatearKm, formatearLitros, formatearNumero, formatearPesos } from '../../utils/formato'
import { ESTADOS_VEHICULO } from '../shared/catalogos'
import { traducirError } from '../shared/errorMessages'
import { documentosPorVencer } from '../vehiculos/vehiculosApi'
import { obtenerResumenPanel } from './panelApi'
import './PanelPage.css'

const MAX_BARRAS = 8

function Indicador({ etiqueta, valor, detalle, acento = 'primario' }) {
  return (
    <li className={`indicador indicador--${acento}`}>
      <span className="indicador__etiqueta">{etiqueta}</span>
      <strong className="indicador__valor">{valor}</strong>
      {detalle && <span className="indicador__detalle">{detalle}</span>}
    </li>
  )
}

// Barras horizontales de una sola serie: el valor va rotulado en cada barra,
// así el dato nunca depende solo del largo o del color.
function BarrasKm({ datos }) {
  const maximo = Math.max(...datos.map((dato) => dato.km), 1)

  return (
    <ul className="barras" aria-label="Kilómetros recorridos por vehículo este mes">
      {datos.map((dato) => (
        <li key={dato.patente} className="barras__fila" title={`${dato.patente}: ${formatearKm(dato.km)}`}>
          <span className="barras__etiqueta">{dato.patente}</span>
          <span className="barras__pista">
            <span className="barras__barra" style={{ width: `${(dato.km / maximo) * 100}%` }} />
          </span>
          <span className="barras__valor">{formatearKm(dato.km)}</span>
        </li>
      ))}
    </ul>
  )
}

const mantencionAtrasada = (mantencion) =>
  mantencion.estado === 'programada' &&
  ((mantencion.fecha_programada && diasHasta(mantencion.fecha_programada) < 0) ||
    (mantencion.km_programado !== null &&
      mantencion.vehiculo?.kilometraje_actual >= mantencion.km_programado))

export function PanelPage() {
  const [resumen, setResumen] = useState(null)

  useEffect(() => {
    let vigente = true
    obtenerResumenPanel().then((resultado) => {
      if (vigente) setResumen(resultado)
    })
    return () => {
      vigente = false
    }
  }, [])

  if (!resumen) return <Spinner />

  if (resumen.error) {
    return <EmptyState mensaje={`No se pudo cargar el panel. ${traducirError(resumen.error)}`} />
  }

  const { vehiculos, enRuta, kmPorVehiculo, mantenciones, licencias, novedades } = resumen
  const porEstado = (estado) => vehiculos.filter((vehiculo) => vehiculo.estado === estado).length
  const kmMes = kmPorVehiculo.reduce((total, dato) => total + dato.km, 0)
  const atrasadas = mantenciones.filter(mantencionAtrasada)
  const documentos = vehiculos
    .flatMap((vehiculo) =>
      documentosPorVencer(vehiculo).map((alerta) => ({ ...alerta, patente: vehiculo.patente })),
    )
    .sort((a, b) => a.dias - b.dias)

  const totalAlertas = documentos.length + licencias.length + atrasadas.length

  return (
    <section className="pagina">
      <PageHeader
        titulo="Panel de administración"
        descripcion="Estado de la flota municipal en tiempo real y resumen del mes en curso."
      />

      <ul className="indicadores" aria-label="Indicadores principales">
        <Indicador
          etiqueta="Vehículos disponibles"
          valor={`${porEstado('disponible')} / ${vehiculos.length}`}
          detalle={`${porEstado('en_mantencion')} en mantención · ${porEstado('fuera_servicio')} fuera de servicio`}
          acento="positivo"
        />
        <Indicador etiqueta="En ruta ahora" valor={formatearNumero(enRuta.length)} detalle="viajes abiertos" acento="turquesa" />
        <Indicador etiqueta="Viajes programados hoy" valor={formatearNumero(resumen.viajesHoy)} acento="primario" />
        <Indicador etiqueta="Km recorridos (mes)" valor={formatearKm(kmMes)} acento="primario" />
        <Indicador
          etiqueta="Combustible (mes)"
          valor={formatearLitros(Math.round(resumen.litrosMes))}
          detalle={formatearPesos(resumen.gastoMes)}
          acento="turquesa"
        />
        <Indicador
          etiqueta="Alertas"
          valor={formatearNumero(totalAlertas)}
          detalle={`${mantenciones.length} mantenciones pendientes`}
          acento="magenta"
        />
      </ul>

      <div className="panel-grid">
        <Card>
          <header className="panel-tarjeta__cabecera">
            <h2>Vehículos en ruta</h2>
            <Link to="/bitacoras" className="panel-enlace">Ver bitácoras</Link>
          </header>
          {enRuta.length === 0 ? (
            <p className="texto-secundario">No hay vehículos en ruta en este momento.</p>
          ) : (
            <ul className="panel-lista">
              {enRuta.map((bitacora) => (
                <li key={bitacora.id}>
                  <strong>{bitacora.vehiculo?.patente}</strong>
                  <span>
                    {bitacora.destino}
                    <span className="texto-secundario">
                      {bitacora.conductor?.nombre_completo} · salió {formatearHora(bitacora.inicio_en)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <header className="panel-tarjeta__cabecera">
            <h2>Estado de la flota</h2>
            <Link to="/vehiculos" className="panel-enlace">Ver vehículos</Link>
          </header>
          <ul className="panel-lista">
            {Object.entries(ESTADOS_VEHICULO).map(([estado, { label, tono }]) => (
              <li key={estado}>
                <StatusChip tono={tono}>{label}</StatusChip>
                <strong className="panel-lista__numero">{porEstado(estado)}</strong>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="panel-grid__ancho">
          <header className="panel-tarjeta__cabecera">
            <h2>Kilómetros recorridos por vehículo · mes actual</h2>
          </header>
          {kmPorVehiculo.length === 0 ? (
            <p className="texto-secundario">Aún no hay viajes cerrados este mes.</p>
          ) : (
            <BarrasKm datos={kmPorVehiculo.slice(0, MAX_BARRAS)} />
          )}
        </Card>

        <Card>
          <header className="panel-tarjeta__cabecera">
            <h2>Alertas</h2>
          </header>
          {totalAlertas === 0 ? (
            <p className="texto-secundario">Todo al día: sin documentos, licencias ni mantenciones vencidas.</p>
          ) : (
            <ul className="panel-alertas">
              {documentos.map((alerta) => (
                <li key={`${alerta.patente}-${alerta.documento}`} className={alerta.vencido ? 'panel-alertas--grave' : ''}>
                  <IconAlerta size={18} />
                  <span>
                    <strong>{alerta.patente}</strong> · {alerta.documento}{' '}
                    {alerta.vencido ? 'vencido' : `vence en ${alerta.dias} días`}
                  </span>
                </li>
              ))}
              {licencias.map((conductor) => {
                const dias = diasHasta(conductor.licencia_vencimiento)
                return (
                  <li key={conductor.id} className={dias < 0 ? 'panel-alertas--grave' : ''}>
                    <IconAlerta size={18} />
                    <span>
                      <strong>{conductor.nombre_completo}</strong> · licencia{' '}
                      {dias < 0 ? 'vencida' : `vence el ${formatearFecha(conductor.licencia_vencimiento)}`}
                    </span>
                  </li>
                )
              })}
              {atrasadas.map((mantencion) => (
                <li key={mantencion.id} className="panel-alertas--grave">
                  <IconAlerta size={18} />
                  <span>
                    <strong>{mantencion.vehiculo?.patente}</strong> · mantención atrasada: {mantencion.descripcion}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <header className="panel-tarjeta__cabecera">
            <h2>Novedades reportadas (30 días)</h2>
          </header>
          {novedades.length === 0 ? (
            <p className="texto-secundario">Los conductores no han reportado novedades.</p>
          ) : (
            <ul className="panel-lista">
              {novedades.map((bitacora) => (
                <li key={bitacora.id}>
                  <strong>{bitacora.vehiculo?.patente}</strong>
                  <span>
                    {bitacora.novedades}
                    <span className="texto-secundario">
                      {bitacora.conductor?.nombre_completo} · {formatearFechaHora(bitacora.fin_en)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  )
}
