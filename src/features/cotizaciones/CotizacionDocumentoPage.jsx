import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { IconChevronLeft, IconDescargar } from '../../components/icons'
import logoMunicipalidad from '../../assets/logo-muni-2026.png'
import { formatearFecha, formatearFechaHora } from '../../utils/fechas'
import { formatearKm, formatearNumero, formatearPesos } from '../../utils/formato'
import { TIPOS_COMBUSTIBLE, TIPOS_VEHICULO, etiqueta } from '../shared/catalogos'
import { traducirError } from '../shared/errorMessages'
import { formatearFolio } from '../permisos/diasEspeciales'
import { calcularCotizacion, unidadEnergia } from './calculoCotizacion'
import { obtenerCotizacion } from './cotizacionesApi'
import '../permisos/PermisoDocumento.css'
import './Cotizaciones.css'

function Dato({ etiqueta: titulo, children }) {
  return (
    <div>
      <dt>{titulo}</dt>
      <dd>{children || '—'}</dd>
    </div>
  )
}

export function CotizacionDocumentoPage() {
  const { id } = useParams()
  const [estado, setEstado] = useState({ cargando: true })

  useEffect(() => {
    let vigente = true

    obtenerCotizacion(id).then(({ data, error }) => {
      if (!vigente) return
      setEstado(error ? { error: traducirError(error) } : { cotizacion: data })
    })

    return () => {
      vigente = false
    }
  }, [id])

  // El título sugiere el nombre del archivo al "Guardar como PDF"
  useEffect(() => {
    if (!estado.cotizacion) return
    const tituloAnterior = document.title
    document.title = `Cotizacion_${formatearFolio(estado.cotizacion.folio)}`
    return () => {
      document.title = tituloAnterior
    }
  }, [estado.cotizacion])

  if (estado.cargando) return <Spinner />

  if (estado.error) {
    return <EmptyState mensaje={`No se pudo cargar la cotización. ${estado.error}`} />
  }

  const { cotizacion } = estado
  const { vehiculo } = cotizacion
  const calculo = calcularCotizacion(cotizacion)
  const unidad = unidadEnergia(vehiculo)
  const folio = formatearFolio(cotizacion.folio)

  return (
    <main className="permiso-pagina">
      <nav className="permiso-pagina__barra no-imprimir" aria-label="Acciones de la cotización">
        <Link to="/cotizaciones" className="boton boton--secundario">
          <IconChevronLeft size={18} />
          Volver a cotizaciones
        </Link>
        <Button onClick={() => window.print()}>
          <IconDescargar size={18} />
          Descargar PDF
        </Button>
        <p className="texto-secundario">
          En la ventana de impresión elige <strong>"Guardar como PDF"</strong> como destino.
        </p>
      </nav>

      <article className="permiso-hoja">
        <header className="permiso-hoja__cabecera">
          <img src={logoMunicipalidad} alt="Municipalidad de Calle Larga" className="permiso-hoja__logo" />
          <div className="permiso-hoja__institucion">
            <p className="permiso-hoja__municipio">Municipalidad de Calle Larga</p>
            <p>Gestión de Flota Vehicular</p>
          </div>
          <div className="permiso-hoja__folio">
            <span>Folio</span>
            <strong>N° {folio}</strong>
          </div>
        </header>

        <h1 className="permiso-hoja__titulo">Cotización de viaje, folio N° {folio}</h1>

        <section className="permiso-hoja__seccion">
          <h2>Información del viaje</h2>
          <dl className="permiso-hoja__datos">
            <Dato etiqueta="Origen">{cotizacion.origen}</Dato>
            <Dato etiqueta="Destino">{cotizacion.destino}</Dato>
            <Dato etiqueta="Tipo de recorrido">{cotizacion.ida_y_vuelta ? 'Ida y vuelta' : 'Solo ida'}</Dato>
            <Dato etiqueta="Fecha estimada">{cotizacion.fecha_viaje && formatearFecha(cotizacion.fecha_viaje)}</Dato>
            <Dato etiqueta="Solicitante">{cotizacion.solicitante}</Dato>
            <Dato etiqueta="Distancia total">{formatearKm(calculo.kmTotal)}</Dato>
          </dl>
        </section>

        <section className="permiso-hoja__seccion">
          <h2>Datos del vehículo</h2>
          <dl className="permiso-hoja__datos">
            <Dato etiqueta="Patente">{vehiculo?.patente}</Dato>
            <Dato etiqueta="Tipo">{vehiculo && etiqueta(TIPOS_VEHICULO, vehiculo.tipo)}</Dato>
            <Dato etiqueta="Marca y modelo">{vehiculo && `${vehiculo.marca} ${vehiculo.modelo}`}</Dato>
            <Dato etiqueta="Año">{vehiculo?.anio}</Dato>
            <Dato etiqueta="Combustible">{vehiculo && etiqueta(TIPOS_COMBUSTIBLE, vehiculo.tipo_combustible)}</Dato>
            <Dato etiqueta="Capacidad">
              {vehiculo?.capacidad_pasajeros && `${vehiculo.capacidad_pasajeros} pasajeros`}
            </Dato>
          </dl>
        </section>

        <section className="permiso-hoja__seccion">
          <h2>Detalle de costos</h2>
          <table className="cotizacion-costos">
            <tbody>
              <tr>
                <th scope="row">
                  Combustible: {formatearKm(calculo.kmTotal)} ÷ {formatearNumero(cotizacion.rendimiento_km_litro)} km/
                  {unidad} = {formatearNumero(calculo.litros)} {unidad} × {formatearPesos(cotizacion.precio_combustible)}
                </th>
                <td>{formatearPesos(calculo.costoCombustible)}</td>
              </tr>
              <tr>
                <th scope="row">Peajes</th>
                <td>{formatearPesos(calculo.costoPeajes)}</td>
              </tr>
              {calculo.costoOtros > 0 && (
                <tr>
                  <th scope="row">Otros gastos</th>
                  <td>{formatearPesos(calculo.costoOtros)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Costo aproximado del viaje</th>
                <td>{formatearPesos(calculo.total)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="cotizacion-nota">
            Valor referencial calculado con el rendimiento del vehículo y los precios indicados a la fecha de
            emisión. El costo final puede variar según las condiciones del viaje.
          </p>
        </section>

        {cotizacion.observaciones && (
          <section className="permiso-hoja__seccion">
            <h2>Observaciones</h2>
            <p>{cotizacion.observaciones}</p>
          </section>
        )}

        <p className="permiso-hoja__pie">
          Emitida el {formatearFechaHora(cotizacion.emitido_en)}
          {cotizacion.emisor && ` por ${cotizacion.emisor.nombre_completo}`} · Folio N° {folio}
        </p>
      </article>
    </main>
  )
}
