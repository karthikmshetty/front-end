interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  // 'true' = answer product requests with the fake API in src/mocks (dev server only).
  readonly VITE_USE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
