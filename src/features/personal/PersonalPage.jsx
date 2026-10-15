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
import { StatusChip } from '../../components/ui/StatusChip'
import { IconEditar, IconMas } from '../../components/icons'
import { useAuth } from '../../hooks/useAuth'
import { useListaPaginada } from '../../hooks/useListaPaginada'
import { useToast } from '../../hooks/useToast'
import { useValorDiferido } from '../../hooks/useValorDiferido'
import { ROLES, etiqueta } from '../shared/catalogos'
import { traducirError } from '../shared/errorMessages'
import { VencimientoChip } from '../shared/VencimientoChip'
import { PersonaFormModal } from './PersonaFormModal'
import { actualizarPersona, listarPersonas } from './personalApi'

const CONFIGURACION = {
  conductores: {
    titulo: 'Conductores',
    descripcion: 'Conductores habilitados para usar la flota y el vencimiento de sus licencias.',
    roles: ['conductor'],
    textoNuevo: 'Nuevo conductor',
  },
  usuarios: {
    titulo: 'Usuarios del sistema',
    descripcion: 'Secretaría, encargado de flota y administradores con acceso a la gestión.',
    roles: ['admin', 'usuario'],
    textoNuevo: 'Nuevo usuario',
  },
}

export function PersonalPage({ tipo }) {
  const config = CONFIGURACION[tipo]
  const esConductores = tipo === 'conductores'
  const { profile } = useAuth()
  const { mostrarExito, mostrarError } = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [activo, setActivo] = useState('true')
  const [modal, setModal] = useState(null) // { tipo: 'form' | 'estado', persona }
  const [procesando, setProcesando] = useState(false)
  const busquedaDiferida = useValorDiferido(busqueda)

  const esAdmin = profile?.role === 'admin'
  // El perfil "usuario" no puede crear ni editar administradores
  const rolesPermitidos = esConductores ? ['conductor'] : esAdmin ? ['usuario', 'admin'] : ['usuario']

  const lista = useListaPaginada(listarPersonas, {
    roles: config.roles,
    busqueda: busquedaDiferida,
    activo,
  })

  const columnas = [
    { key: 'nombre', titulo: 'Nombre' },
    { key: 'rut', titulo: 'RUT' },
    { key: 'telefono', titulo: 'Teléfono' },
    esConductores ? { key: 'licencia', titulo: 'Licencia' } : { key: 'perfil', titulo: 'Perfil' },
    { key: 'estado', titulo: 'Estado' },
    { key: 'acciones', titulo: 'Acciones', alinearDerecha: true },
  ]

  const puedeEditar = (persona) => esAdmin || persona.role !== 'admin'

  const cerrarModal = () => setModal(null)

  const alGuardar = () => {
    cerrarModal()
    lista.recargar()
  }

  const alCambiarEstado = async () => {
    const { persona } = modal
    setProcesando(true)
    const { error } = await actualizarPersona(persona.id, { activo: !persona.activo })
    setProcesando(false)

    if (error) {
      mostrarError(traducirError(error))
      return
    }

    mostrarExito(`${persona.nombre_completo} fue ${persona.activo ? 'desactivado' : 'reactivado'}.`)
    cerrarModal()
    lista.recargar()
  }

  return (
    <section className="pagina">
      <PageHeader titulo={config.titulo} descripcion={config.descripcion}>
        <Button onClick={() => setModal({ tipo: 'form', persona: null })}>
          <IconMas size={18} />
          {config.textoNuevo}
        </Button>
      </PageHeader>

      <Card sinPadding>
        <div className="barra-filtros">
          <InputField
            label="Buscar"
            type="search"
            placeholder="Nombre, correo o RUT"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <SelectField
            label="Estado"
            value={activo}
            onChange={(e) => setActivo(e.target.value)}
            opciones={[
              { value: 'true', label: 'Activos' },
              { value: 'false', label: 'Inactivos' },
              { value: '', label: 'Todos' },
            ]}
          />
        </div>

        {lista.cargando ? (
          <Spinner />
        ) : (
          <DataTable
            columnas={columnas}
            filas={lista.filas}
            mensajeVacio={
              lista.error ||
              (busquedaDiferida
                ? `No se encontraron resultados para "${busquedaDiferida}".`
                : `No hay ${config.titulo.toLowerCase()} para mostrar.`)
            }
            renderFila={(persona) => (
              <tr key={persona.id}>
                <td data-label="Nombre">
                  <strong>{persona.nombre_completo}</strong>
                  <span className="texto-secundario">{persona.email}</span>
                </td>
                <td data-label="RUT">{persona.rut ?? '—'}</td>
                <td data-label="Teléfono">{persona.telefono ?? '—'}</td>
                {esConductores ? (
                  <td data-label="Licencia">
                    {persona.licencia_clase ? `Clase ${persona.licencia_clase}` : '—'}
                    <span className="texto-secundario">
                      <VencimientoChip fecha={persona.licencia_vencimiento} />
                    </span>
                  </td>
                ) : (
                  <td data-label="Perfil">{etiqueta(ROLES, persona.role)}</td>
                )}
                <td data-label="Estado">
                  <StatusChip tono={persona.activo ? 'exito' : 'neutro'}>
                    {persona.activo ? 'Activo' : 'Inactivo'}
                  </StatusChip>
                </td>
                <td data-label="Acciones">
                  {puedeEditar(persona) ? (
                    <div className="acciones-fila">
                      <button
                        type="button"
                        className="boton-icono"
                        onClick={() => setModal({ tipo: 'form', persona })}
                        aria-label={`Editar a ${persona.nombre_completo}`}
                        title="Editar"
                      >
                        <IconEditar size={20} />
                      </button>
                      {persona.id !== profile?.id && (
                        <Button variante="texto" onClick={() => setModal({ tipo: 'estado', persona })}>
                          {persona.activo ? 'Desactivar' : 'Reactivar'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <span className="texto-secundario">Solo administradores</span>
                  )}
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

      {modal?.tipo === 'form' && (
        <PersonaFormModal
          persona={modal.persona}
          esConductor={esConductores}
          // Nadie puede cambiar su propio perfil (evita quedarse sin administrador)
          rolesPermitidos={modal.persona?.id === profile?.id ? [profile.role] : rolesPermitidos}
          onCerrar={cerrarModal}
          onGuardado={alGuardar}
        />
      )}

      {modal?.tipo === 'estado' && (
        <ConfirmModal
          titulo={modal.persona.activo ? 'Desactivar cuenta' : 'Reactivar cuenta'}
          mensaje={
            modal.persona.activo
              ? `${modal.persona.nombre_completo} no podrá volver a ingresar al sistema hasta que se reactive su cuenta. Su historial se conserva.`
              : `${modal.persona.nombre_completo} podrá volver a ingresar al sistema.`
          }
          textoConfirmar={modal.persona.activo ? 'Desactivar' : 'Reactivar'}
          variante={modal.persona.activo ? 'urgente' : 'primario'}
          procesando={procesando}
          onConfirmar={alCambiarEstado}
          onCancelar={cerrarModal}
        />
      )}
    </section>
  )
}
