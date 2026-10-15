import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Spinner } from '../../components/ui/Spinner'
import { IconChevronLeft, IconChevronRight, IconClose, IconEditar, IconMas } from '../../components/icons'
import { useToast } from '../../hooks/useToast'
import { fechaLocalISO, formatearHora, inicioDelDia, sumarDias } from '../../utils/fechas'
import { traducirError } from '../shared/errorMessages'
import { useSelectores } from '../shared/useSelectores'
import { TurnoFormModal } from './TurnoFormModal'
import { eliminarTurno, listarTurnosEntre } from './turnosApi'
import './TurnosPage.css'

const formatoDia = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })
const formatoRango = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

const lunesDe = (fecha) => {
  const lunes = inicioDelDia(fecha)
  const diaSemana = (lunes.getDay() + 6) % 7 // lunes = 0
  return sumarDias(lunes, -diaSemana)
}

export function TurnosPage() {
  const { mostrarExito, mostrarError } = useToast()
  const { vehiculos, conductores } = useSelectores()
  const [lunes, setLunes] = useState(() => lunesDe(new Date()))
  const [turnos, setTurnos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null) // { tipo: 'form' | 'eliminar', turno, fecha }
  const [eliminando, setEliminando] = useState(false)

  const dias = Array.from({ length: 7 }, (_, indice) => sumarDias(lunes, indice))
  const domingo = dias[6]

  const cargar = useCallback(async () => {
    setCargando(true)
    const { data, error } = await listarTurnosEntre(lunes, sumarDias(lunes, 7))
    setTurnos(data ?? [])
    setCargando(false)
    if (error) mostrarError(traducirError(error))
  }, [lunes, mostrarError])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cerrarModal = () => setModal(null)

  const alGuardar = () => {
    cerrarModal()
    cargar()
  }

  const alEliminar = async () => {
    setEliminando(true)
    const { error } = await eliminarTurno(modal.turno.id)
    setEliminando(false)

    if (error) {
      mostrarError(traducirError(error))
      return
    }

    mostrarExito('Turno eliminado.')
    cerrarModal()
    cargar()
  }

  const turnosDelDia = (dia) =>
    turnos.filter((turno) => inicioDelDia(new Date(turno.inicio)).getTime() === dia.getTime())

  const esHoy = (dia) => dia.getTime() === inicioDelDia().getTime()

  return (
    <section className="pagina">
      <PageHeader
        titulo="Turnos de conductores"
        descripcion="Asignación semanal de turnos. El sistema no permite turnos que se crucen para un mismo conductor."
      >
        <Button onClick={() => setModal({ tipo: 'form', turno: null, fecha: fechaLocalISO() })}>
          <IconMas size={18} />
          Asignar turno
        </Button>
      </PageHeader>

      <Card>
        <nav className="semana-navegacion" aria-label="Cambiar semana">
          <button
            type="button"
            className="boton-icono"
            onClick={() => setLunes(sumarDias(lunes, -7))}
            aria-label="Semana anterior"
          >
            <IconChevronLeft />
          </button>
          <p className="semana-navegacion__rango">
            {formatoRango.format(lunes)} – {formatoRango.format(domingo)}
          </p>
          <button
            type="button"
            className="boton-icono"
            onClick={() => setLunes(sumarDias(lunes, 7))}
            aria-label="Semana siguiente"
          >
            <IconChevronRight />
          </button>
          <Button variante="texto" onClick={() => setLunes(lunesDe(new Date()))}>
            Hoy
          </Button>
        </nav>

        {cargando ? (
          <Spinner />
        ) : (
          <ol className="semana">
            {dias.map((dia) => {
              const delDia = turnosDelDia(dia)
              return (
                <li key={dia.toISOString()} className={`semana__dia ${esHoy(dia) ? 'semana__dia--hoy' : ''}`}>
                  <header className="semana__cabecera">
                    <h2 className="semana__titulo">{formatoDia.format(dia)}</h2>
                    <button
                      type="button"
                      className="boton-icono"
                      onClick={() => setModal({ tipo: 'form', turno: null, fecha: fechaLocalISO(dia) })}
                      aria-label={`Asignar turno el ${formatoDia.format(dia)}`}
                    >
                      <IconMas size={18} />
                    </button>
                  </header>

                  {delDia.length === 0 ? (
                    <p className="semana__vacio">Sin turnos</p>
                  ) : (
                    <ul className="semana__turnos">
                      {delDia.map((turno) => (
                        <li key={turno.id} className="turno">
                          <p className="turno__hora">
                            {formatearHora(turno.inicio)} – {formatearHora(turno.fin)}
                          </p>
                          <p className="turno__conductor">{turno.conductor?.nombre_completo}</p>
                          {turno.vehiculo && <p className="texto-secundario">{turno.vehiculo.patente}</p>}
                          <div className="turno__acciones">
                            <button
                              type="button"
                              className="boton-icono"
                              onClick={() => setModal({ tipo: 'form', turno })}
                              aria-label="Editar turno"
                            >
                              <IconEditar size={16} />
                            </button>
                            <button
                              type="button"
                              className="boton-icono boton-icono--peligro"
                              onClick={() => setModal({ tipo: 'eliminar', turno })}
                              aria-label="Eliminar turno"
                            >
                              <IconClose size={16} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </Card>

      {modal?.tipo === 'form' && (
        <TurnoFormModal
          turno={modal.turno}
          fechaInicial={modal.fecha}
          vehiculos={vehiculos}
          conductores={conductores}
          onCerrar={cerrarModal}
          onGuardado={alGuardar}
        />
      )}

      {modal?.tipo === 'eliminar' && (
        <ConfirmModal
          titulo="Eliminar turno"
          mensaje={`Se eliminará el turno de ${modal.turno.conductor?.nombre_completo} (${formatearHora(modal.turno.inicio)} – ${formatearHora(modal.turno.fin)}).`}
          textoConfirmar="Eliminar turno"
          variante="urgente"
          procesando={eliminando}
          onConfirmar={alEliminar}
          onCancelar={cerrarModal}
        />
      )}
    </section>
  )
}
