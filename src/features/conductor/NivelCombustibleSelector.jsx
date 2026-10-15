import { OPCIONES_NIVEL_COMBUSTIBLE } from '../shared/catalogos'
import './NivelCombustibleSelector.css'

export function NivelCombustibleSelector({ nombre, leyenda, valor, onCambiar, error }) {
  return (
    <fieldset className="nivel-combustible">
      <legend className="campo__etiqueta">{leyenda}</legend>
      <div className="nivel-combustible__opciones">
        {OPCIONES_NIVEL_COMBUSTIBLE.map((opcion) => (
          <label
            key={opcion.value}
            className={`nivel-combustible__opcion ${valor === opcion.value ? 'nivel-combustible__opcion--activa' : ''}`}
          >
            <input
              type="radio"
              name={nombre}
              value={opcion.value}
              checked={valor === opcion.value}
              onChange={() => onCambiar(opcion.value)}
              className="visually-hidden"
            />
            {opcion.label}
          </label>
        ))}
      </div>
      {error && <span className="campo__error">{error}</span>}
    </fieldset>
  )
}
