interface ImportMetaEnv {
  // Login (DummyJSON).
  readonly VITE_API_BASE_URL?: string
  // Products API (back-end repo, API Gateway stage URL ending in /staging).
  readonly VITE_PRODUCTS_API_URL?: string
  // 'true' = answer product requests with the fake API in src/mocks (dev server only).
  readonly VITE_USE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
