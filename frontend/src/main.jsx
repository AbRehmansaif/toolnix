import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Dispatch render-event after React mounts — signals vite-plugin-prerender
// that the page is fully rendered and ready to snapshot.
document.dispatchEvent(new Event('render-event'))
