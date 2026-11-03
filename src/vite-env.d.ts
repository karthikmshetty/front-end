interface ImportMetaEnv {
  // Login (Cognito user pool and its web app client, from the back-end resources stack).
  readonly VITE_COGNITO_USER_POOL_ID?: string
  readonly VITE_COGNITO_CLIENT_ID?: string
  // Products API (back-end repo, API Gateway stage URL ending in /staging).
  readonly VITE_PRODUCTS_API_URL?: string
  // 'true' = answer product requests with the fake API in src/mocks (dev server only).
  readonly VITE_USE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
