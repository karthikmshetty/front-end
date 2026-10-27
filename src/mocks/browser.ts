import { setupWorker } from 'msw/browser'

import { handlers } from './handlers.ts'

// Started from main.tsx in development when VITE_USE_MOCKS=true.
export const worker = setupWorker(...handlers)
