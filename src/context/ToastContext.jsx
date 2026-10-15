import { createContext, useCallback, useMemo, useRef, useState } from 'react'
import { ToastContainer } from '../components/ui/Toast'

export const ToastContext = createContext(null)

let siguienteId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const temporizadores = useRef({})

  const cerrarToast = useCallback((id) => {
    setToasts((actuales) => actuales.filter((toast) => toast.id !== id))
    clearTimeout(temporizadores.current[id])
    delete temporizadores.current[id]
  }, [])

  const mostrarToast = useCallback((mensaje, tipo = 'info', duracionMs = 5000) => {
    const id = siguienteId++
    setToasts((actuales) => [...actuales, { id, mensaje, tipo }])

    temporizadores.current[id] = setTimeout(() => {
      setToasts((actuales) => actuales.filter((toast) => toast.id !== id))
      delete temporizadores.current[id]
    }, duracionMs)

    return id
  }, [])

  // Memorizado para que las páginas puedan usar estas funciones como
  // dependencias de efectos sin recargar datos cada vez que aparece un toast
  const value = useMemo(
    () => ({
      mostrarExito: (mensaje) => mostrarToast(mensaje, 'exito'),
      mostrarError: (mensaje) => mostrarToast(mensaje, 'error'),
      mostrarInfo: (mensaje) => mostrarToast(mensaje, 'info'),
    }),
    [mostrarToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onCerrar={cerrarToast} />
    </ToastContext.Provider>
  )
}
