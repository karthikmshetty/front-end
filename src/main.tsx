import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Root element #root was not found in index.html')
}

// Fake product API (src/mocks) until the real back-end exists. Dev only; never in a build.
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
  const { worker } = await import('./mocks/browser.ts')
  // Requests without a handler (login, /auth/me) still go to the real server.
  await worker.start({ onUnhandledRequest: 'bypass' })
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
