import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { IconChevronLeft, IconDescargar } from '../../components/icons'
import logoMunicipalidad from '../../assets/logo-muni-2026.png'
import { fechaLocalISO, formatearDiaLargo, formatearFecha, formatearFechaHora } from '../../utils/fechas'
import { TIPOS_VEHICULO, etiqueta } from '../shared/catalogos'
import { traducirError } from '../shared/errorMessages'
import { diasEspeciales, formatearFolio } from './diasEspeciales'
import { listarFeriados, obtenerPermiso } from './permisosApi'
import './PermisoDocumento.css'

function Dato({ etiqueta: titulo, children }) {
  return (
    <div>
      <dt>{titulo}</dt>
      <dd>{children || '—'}</dd>
    </div>
  )
}

export function PermisoDocumentoPage() {
  const { id } = useParams()
  const [estado, setEstado] = useState({ cargando: true })

  useEffect(() => {
    let vigente = true

    obtenerPermiso(id).then(async ({ data: permiso, error }) => {
      if (error) {
        if (vigente) setEstado({ error: traducirError(error) })
        return
      }

      const { salida_programada: salida, regreso_programado: regreso } = permiso.viaje
      const { data: feriados } = await listarFeriados({
        desde: fechaLocalISO(new Date(salida)),
        hasta: fechaLocalISO(new Date(regreso)),
      })

      if (vigente) setEstado({ permiso, dias: diasEspeciales(salida, regreso, feriados ?? []) })
    })

    return () => {
      vigente = false
    }
  }, [id])

  // El título sugiere el nombre del archivo al "Guardar como PDF"
  useEffect(() => {
    if (!estado.permiso) return
    const tituloAnterior = document.title
    document.title = `Permiso_${formatearFolio(estado.permiso.folio)}`
    return () => {
      document.title = tituloAnterior
    }
  }, [estado.permiso])

  if (estado.cargando) return <Spinner />

  if (estado.error) {
    return <EmptyState mensaje={`No se pudo cargar el permiso. ${estado.error}`} />
  }

  const { permiso, dias } = estado
  const { viaje } = permiso
  const { vehiculo, conductor } = viaje
  const sinValidez = viaje.estado === 'cancelado'

  return (
    <main className="permiso-pagina">
      <nav className="permiso-pagina__barra no-imprimir" aria-label="Acciones del permiso">
        <Link to="/permisos" className="boton boton--secundario">
          <IconChevronLeft size={18} />
          Volver a permisos
        </Link>
        <Button onClick={() => window.print()} disabled={sinValidez}>
          <IconDescargar size={18} />
          Descargar PDF
        </Button>
        <p className="texto-secundario">
          En la ventana de impresión elige <strong>"Guardar como PDF"</strong> como destino.
        </p>
      </nav>

      {sinValidez && (
        <p className="alerta-formulario no-imprimir" role="alert">
          El viaje de este permiso fue cancelado, por lo que el permiso no tiene validez.
        </p>
      )}

      <article className="permiso-hoja">
        <header className="permiso-hoja__cabecera">
          <img src={logoMunicipalidad} alt="Municipalidad de Calle Larga" className="permiso-hoja__logo" />
          <div className="permiso-hoja__institucion">
            <p className="permiso-hoja__municipio">Municipalidad de Calle Larga</p>
            <p>Gestión de Flota Vehicular</p>
          </div>
          <div className="permiso-hoja__folio">
            <span>Folio</span>
            <strong>N° {formatearFolio(permiso.folio)}</strong>
          </div>
        </header>

        <h1 className="permiso-hoja__titulo">Permiso de circulación en fin de semana o feriado</h1>

        <p className="permiso-hoja__texto">
          De conformidad a lo establecido en el Decreto Ley N.º 799/84 y sus modificaciones, y a las facultades
          que me confiere el Art. N.º 63 letra ñ) de la Ley N.º 18.695, Orgánica Constitucional de
          Municipalidades, sobre el uso y circulación de vehículos de propiedad municipal, otorgo el presente
          permiso de circulación al conductor individualizado a continuación, para conducir el vehículo
          municipal que se indica y cumplir el cometido detallado en este documento
          {dias.length > 0 && (
            <>
              {' '}
              el o los días <strong>{dias.map((dia) => formatearDiaLargo(dia.fecha)).join(', ')}</strong>
            </>
          )}
          .
        </p>

        <section className="permiso-hoja__seccion">
          <h2>Datos del conductor</h2>
          <dl className="permiso-hoja__datos">
            <Dato etiqueta="Nombre completo">{conductor?.nombre_completo}</Dato>
            <Dato etiqueta="RUT">{conductor?.rut}</Dato>
            <Dato etiqueta="Clase de licencia">{conductor?.licencia_clases?.join(', ')}</Dato>
            <Dato etiqueta="Vencimiento de licencia">
              {conductor?.licencia_vencimiento && formatearFecha(conductor.licencia_vencimiento)}
            </Dato>
            <Dato etiqueta="Teléfono">{conductor?.telefono}</Dato>
          </dl>
        </section>

        <section className="permiso-hoja__seccion">
          <h2>Datos del vehículo</h2>
          <dl className="permiso-hoja__datos">
            <Dato etiqueta="Patente">{vehiculo?.patente}</Dato>
            <Dato etiqueta="N° interno">{vehiculo?.numero_interno}</Dato>
            <Dato etiqueta="Tipo">{vehiculo && etiqueta(TIPOS_VEHICULO, vehiculo.tipo)}</Dato>
            <Dato etiqueta="Marca y modelo">{vehiculo && `${vehiculo.marca} ${vehiculo.modelo}`}</Dato>
            <Dato etiqueta="Año">{vehiculo?.anio}</Dato>
            <Dato etiqueta="Color">{vehiculo?.color}</Dato>
          </dl>
        </section>

        <section className="permiso-hoja__seccion">
          <h2>Información del viaje</h2>
          <dl className="permiso-hoja__datos">
            <Dato etiqueta="Salida programada">{formatearFechaHora(viaje.salida_programada)}</Dato>
            <Dato etiqueta="Regreso programado">{formatearFechaHora(viaje.regreso_programado)}</Dato>
            <Dato etiqueta="Unidad solicitante">{viaje.unidad_solicitante}</Dato>
            <Dato etiqueta="Pasajeros">{viaje.cantidad_pasajeros}</Dato>
            <div className="permiso-hoja__dato-ancho">
              <dt>Motivo</dt>
              <dd>{viaje.motivo}</dd>
            </div>
            {dias.some((dia) => dia.feriado) && (
              <div className="permiso-hoja__dato-ancho">
                <dt>Feriados incluidos</dt>
                <dd>
                  {dias
                    .filter((dia) => dia.feriado)
                    .map((dia) => `${dia.feriado} (${formatearFecha(dia.fecha)})`)
                    .join(', ')}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="permiso-hoja__seccion">
          <h2>Origen y destino</h2>
          <dl className="permiso-hoja__datos">
            <Dato etiqueta="Origen">{viaje.origen}</Dato>
            <Dato etiqueta="Destino">{viaje.destino}</Dato>
          </dl>
        </section>

        {permiso.observaciones && (
          <section className="permiso-hoja__seccion">
            <h2>Observaciones</h2>
            <p>{permiso.observaciones}</p>
          </section>
        )}

        <p className="permiso-hoja__pie">
          Emitido el {formatearFechaHora(permiso.emitido_en)}
          {permiso.emisor && ` por ${permiso.emisor.nombre_completo}`} · Folio N° {formatearFolio(permiso.folio)}
        </p>
      </article>
    </main>
  )
}
