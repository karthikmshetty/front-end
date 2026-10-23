// Adds DOM matchers such as toBeInTheDocument() to Vitest's expect.
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom has no object URLs; ImageUpload creates them for previews.
URL.createObjectURL = (): string => 'blob:preview'
URL.revokeObjectURL = (): void => undefined

// Vitest globals are off, so Testing Library cannot register its own cleanup.
afterEach(() => {
  cleanup()
})
