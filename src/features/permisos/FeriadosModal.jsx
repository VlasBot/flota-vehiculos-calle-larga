import { useCallback, useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { IconAlerta, IconClose, IconMas } from '../../components/icons'
import { useToast } from '../../hooks/useToast'
import { formatearDiaLargo } from '../../utils/fechas'
import { traducirError } from '../shared/errorMessages'
import { crearFeriado, eliminarFeriado, listarFeriados } from './permisosApi'
import './Permisos.css'

// Se muestran los feriados desde el 1 de enero del año en curso
const inicioDelAnio = () => `${new Date().getFullYear()}-01-01`

export function FeriadosModal({ onCerrar }) {
  const { mostrarExito, mostrarError } = useToast()
  const [feriados, setFeriados] = useState(null)
  const [fecha, setFecha] = useState('')
  const [nombre, setNombre] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    const { data, error } = await listarFeriados({ desde: inicioDelAnio() })
    if (error) setErrorGeneral(traducirError(error))
    setFeriados(data ?? [])
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const alAgregar = async (evento) => {
    evento.preventDefault()
    setErrorGeneral('')

    const nuevos = {}
    if (!fecha) nuevos.fecha = 'Indica la fecha.'
    if (!nombre.trim()) nuevos.nombre = 'Indica el nombre del feriado.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setGuardando(true)
    const { error } = await crearFeriado({ fecha, nombre: nombre.trim() })
    setGuardando(false)

    if (error) {
      setErrorGeneral(traducirError(error))
      return
    }

    mostrarExito(`Feriado "${nombre.trim()}" registrado.`)
    setFecha('')
    setNombre('')
    cargar()
  }

  const alEliminar = async (feriado) => {
    const { error } = await eliminarFeriado(feriado.fecha)
    if (error) {
      mostrarError(traducirError(error))
      return
    }
    mostrarExito(`Feriado "${feriado.nombre}" eliminado.`)
    cargar()
  }

  return (
    <Modal
      titulo="Feriados"
      onCerrar={onCerrar}
      footer={
        <Button variante="secundario" onClick={onCerrar}>
          Cerrar
        </Button>
      }
    >
      <form className="formulario" onSubmit={alAgregar} noValidate>
        <p className="texto-secundario">
          Los sábados y domingos se reconocen solos. Registra aquí los feriados para poder emitir permisos
          en esos días.
        </p>

        {errorGeneral && (
          <p className="alerta-formulario" role="alert">
            <IconAlerta size={18} />
            <span>{errorGeneral}</span>
          </p>
        )}

        <div className="formulario__grid">
          <InputField
            label="Fecha *"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            error={errores.fecha}
          />
          <InputField
            label="Nombre *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            error={errores.nombre}
            placeholder="Ej: Fiestas Patrias"
          />
        </div>
        <Button type="submit" variante="secundario" disabled={guardando}>
          <IconMas size={18} />
          {guardando ? 'Agregando…' : 'Agregar feriado'}
        </Button>
      </form>

      {feriados === null ? (
        <Spinner />
      ) : feriados.length === 0 ? (
        <p className="texto-secundario">Aún no hay feriados registrados para este año.</p>
      ) : (
        <ul className="feriados-lista">
          {feriados.map((feriado) => (
            <li key={feriado.fecha}>
              <span>
                <strong>{feriado.nombre}</strong>
                <span className="texto-secundario">{formatearDiaLargo(feriado.fecha)}</span>
              </span>
              <button
                type="button"
                className="boton-icono boton-icono--peligro"
                onClick={() => alEliminar(feriado)}
                aria-label={`Eliminar feriado ${feriado.nombre}`}
                title="Eliminar"
              >
                <IconClose size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
