import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/global.css'

const raiz = createRoot(document.getElementById('root'))
const configurado = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Sin las variables de Supabase el cliente no puede crearse: se explica en
// pantalla en lugar de dejar la página en blanco.
if (configurado) {
  import('./App').then(({ App }) => {
    raiz.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
} else {
  raiz.render(
    <main style={{ maxWidth: '64rem', margin: '0 auto', padding: 'var(--space-xl) var(--space-md)' }}>
      <h1>Falta configurar Supabase</h1>
      <p>
        Crea el archivo <code>.env.local</code> a partir de <code>.env.example</code> con la URL y la
        publishable key del proyecto, y reinicia el servidor de desarrollo.
      </p>
    </main>,
  )
}
