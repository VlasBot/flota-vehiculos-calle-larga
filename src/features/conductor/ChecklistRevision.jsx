import { IconCheck, IconClose } from '../../components/icons'
import { ITEMS_CHECKLIST } from '../shared/catalogos'
import './ChecklistRevision.css'

// Cada punto se marca como "Bien" (true) o "Mal" (false). Los que quedan sin
// marcar (null) se guardan como "Mal" al registrar el inicio del viaje.
export function ChecklistRevision({ valores, onCambiar }) {
  return (
    <fieldset className="formulario__seccion checklist">
      <legend>Revisión del vehículo antes de salir</legend>
      <p className="texto-secundario">
        Marca "Bien" o "Mal" en cada punto. Lo que no marques quedará registrado como "Mal".
      </p>
      <ul className="checklist__lista">
        {ITEMS_CHECKLIST.map((item) => (
          <li key={item.clave} className="checklist__item">
            <span className="checklist__texto" id={`checklist-${item.clave}`}>
              {item.label}
            </span>
            <div className="checklist__opciones" role="radiogroup" aria-labelledby={`checklist-${item.clave}`}>
              <label className="checklist__opcion checklist__opcion--bien">
                <input
                  type="radio"
                  name={`checklist-${item.clave}`}
                  checked={valores[item.clave] === true}
                  onChange={() => onCambiar(item.clave, true)}
                />
                <IconCheck size={18} />
                <span>Bien</span>
              </label>
              <label className="checklist__opcion checklist__opcion--mal">
                <input
                  type="radio"
                  name={`checklist-${item.clave}`}
                  checked={valores[item.clave] === false}
                  onChange={() => onCambiar(item.clave, false)}
                />
                <IconClose size={18} />
                <span>Mal</span>
              </label>
            </div>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}
