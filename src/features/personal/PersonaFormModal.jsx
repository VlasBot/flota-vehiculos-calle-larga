import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { InputField } from '../../components/ui/InputField'
import { Modal } from '../../components/ui/Modal'
import { SelectField } from '../../components/ui/SelectField'
import { IconAlerta } from '../../components/icons'
import { useFormulario } from '../../hooks/useFormulario'
import { useToast } from '../../hooks/useToast'
import { textoONulo } from '../../utils/formato'
import { formatearRut, validarRut } from '../../utils/rut'
import { CLASES_LICENCIA, ROLES } from '../shared/catalogos'
import { traducirError } from '../shared/errorMessages'
import { actualizarPersona, crearPersona } from './personalApi'

const aFormulario = (persona, rolPorDefecto) => ({
  nombre_completo: persona?.nombre_completo ?? '',
  email: persona?.email ?? '',
  password: '',
  rut: persona?.rut ?? '',
  telefono: persona?.telefono ?? '',
  role: persona?.role ?? rolPorDefecto,
  licencia_clases: persona?.licencia_clases ?? [],
  licencia_vencimiento: persona?.licencia_vencimiento ?? '',
})

export function PersonaFormModal({ persona, esConductor, rolesPermitidos, onCerrar, onGuardado }) {
  const { mostrarExito } = useToast()
  const { valores, cambiar, setValores } = useFormulario(aFormulario(persona, rolesPermitidos[0]))
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const esEdicion = Boolean(persona)
  const sustantivo = esConductor ? 'conductor' : 'usuario'

  const validar = () => {
    const nuevos = {}
    if (valores.nombre_completo.trim().length < 3) nuevos.nombre_completo = 'Ingresa el nombre completo.'
    if (!esEdicion) {
      if (!/^\S+@\S+\.\S+$/.test(valores.email.trim())) nuevos.email = 'Ingresa un correo válido.'
      if (valores.password.length < 8) nuevos.password = 'La contraseña debe tener al menos 8 caracteres.'
    }
    if (valores.rut && !validarRut(valores.rut)) nuevos.rut = 'El RUT no es válido.'
    if (esConductor) {
      if (!valores.rut) nuevos.rut = 'El RUT es obligatorio para los conductores.'
      if (valores.licencia_clases.length === 0) nuevos.licencia_clases = 'Selecciona al menos una clase de licencia.'
      if (!valores.licencia_vencimiento) nuevos.licencia_vencimiento = 'Indica el vencimiento de la licencia.'
    }
    return nuevos
  }

  // Se mantiene el orden del catálogo (A1, A2, …, B, C…) sin importar el orden en que se marquen
  const alMarcarClase = (clase) => (evento) => {
    const marcada = evento.target.checked
    setValores((actuales) => ({
      ...actuales,
      licencia_clases: CLASES_LICENCIA.filter((item) =>
        item === clase ? marcada : actuales.licencia_clases.includes(item),
      ),
    }))
  }

  const alGuardar = async (evento) => {
    evento.preventDefault()
    setErrorGeneral('')

    const nuevosErrores = validar()
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const datos = {
      nombre_completo: valores.nombre_completo.trim(),
      rut: valores.rut ? formatearRut(valores.rut) : null,
      telefono: textoONulo(valores.telefono),
      role: esConductor ? 'conductor' : valores.role,
      licencia_clases: esConductor ? valores.licencia_clases : null,
      licencia_vencimiento: esConductor ? valores.licencia_vencimiento : null,
    }

    setGuardando(true)
    const { error } = esEdicion
      ? await actualizarPersona(persona.id, datos)
      : await crearPersona({ ...datos, email: valores.email.trim(), password: valores.password })
    setGuardando(false)

    if (error) {
      setErrorGeneral(traducirError(error))
      return
    }

    mostrarExito(
      esEdicion
        ? `Datos de ${datos.nombre_completo} actualizados.`
        : `${esConductor ? 'Conductor' : 'Usuario'} ${datos.nombre_completo} creado. Ya puede ingresar con su correo.`,
    )
    onGuardado()
  }

  return (
    <Modal
      titulo={esEdicion ? `Editar ${sustantivo}` : `Nuevo ${sustantivo}`}
      onCerrar={onCerrar}
      footer={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" form="formulario-persona" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="formulario-persona" className="formulario" onSubmit={alGuardar} noValidate>
        {errorGeneral && (
          <p className="alerta-formulario" role="alert">
            <IconAlerta size={18} />
            <span>{errorGeneral}</span>
          </p>
        )}

        <InputField
          label="Nombre completo *"
          value={valores.nombre_completo}
          onChange={cambiar('nombre_completo')}
          error={errores.nombre_completo}
          autoComplete="off"
        />

        {esEdicion ? (
          <InputField label="Correo electrónico" value={valores.email} readOnly ayuda="El correo no se puede modificar." />
        ) : (
          <div className="formulario__grid">
            <InputField
              label="Correo electrónico *"
              type="email"
              value={valores.email}
              onChange={cambiar('email')}
              error={errores.email}
              autoComplete="off"
            />
            <InputField
              label="Contraseña inicial *"
              type="password"
              value={valores.password}
              onChange={cambiar('password')}
              error={errores.password}
              autoComplete="new-password"
              ayuda="Mínimo 8 caracteres. Entrégala a la persona de forma segura."
            />
          </div>
        )}

        <div className="formulario__grid">
          <InputField
            label={esConductor ? 'RUT *' : 'RUT'}
            value={valores.rut}
            onChange={cambiar('rut')}
            error={errores.rut}
            placeholder="12.345.678-9"
          />
          <InputField
            label="Teléfono"
            type="tel"
            value={valores.telefono}
            onChange={cambiar('telefono')}
            placeholder="+56 9 1234 5678"
          />
        </div>

        {esConductor ? (
          <>
            <fieldset className="formulario__seccion">
              <legend>Clases de licencia *</legend>
              <div className="casillas-licencia">
                {CLASES_LICENCIA.map((clase) => (
                  <label key={clase} className="casilla">
                    <input
                      type="checkbox"
                      checked={valores.licencia_clases.includes(clase)}
                      onChange={alMarcarClase(clase)}
                    />
                    <span>Clase {clase}</span>
                  </label>
                ))}
              </div>
              {errores.licencia_clases && <span className="campo__error">{errores.licencia_clases}</span>}
            </fieldset>
            <InputField
              label="Vencimiento de licencia *"
              type="date"
              value={valores.licencia_vencimiento}
              onChange={cambiar('licencia_vencimiento')}
              error={errores.licencia_vencimiento}
            />
          </>
        ) : (
          <SelectField
            label="Perfil"
            value={valores.role}
            onChange={cambiar('role')}
            opciones={rolesPermitidos.map((rol) => ({ value: rol, label: ROLES[rol].label }))}
          />
        )}
      </form>
    </Modal>
  )
}
