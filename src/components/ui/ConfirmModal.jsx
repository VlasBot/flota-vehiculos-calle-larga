import { Button } from './Button'
import { Modal } from './Modal'

export function ConfirmModal({
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  variante = 'primario',
  procesando = false,
  onConfirmar,
  onCancelar,
}) {
  return (
    <Modal
      titulo={titulo}
      onCerrar={onCancelar}
      footer={
        <>
          <Button variante="secundario" onClick={onCancelar} disabled={procesando}>
            Cancelar
          </Button>
          <Button variante={variante} onClick={onConfirmar} disabled={procesando}>
            {procesando ? 'Procesando…' : textoConfirmar}
          </Button>
        </>
      }
    >
      <p>{mensaje}</p>
    </Modal>
  )
}
