// Shared helpers for tests that render the whole app against a fake API.
import { render, screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import type { AuthSession, JWT } from 'aws-amplify/auth'
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth'
import { createElement } from 'react'
import { afterEach, beforeEach, vi } from 'vitest'

import App from './App.tsx'

const PRODUCTS_API_URL = 'https://products.test'
const S3_UPLOAD_URL = 'https://s3.test/upload/products/image.png'
export const S3_FILE_URL = 'https://s3.test/products/image.png'

// ID token claims of a Cognito user (setupTests.ts replaces aws-amplify/auth with mocks).
export const EMILY_CLAIMS: JWT['payload'] = {
  sub: '7f1c2a9e-0000-4000-8000-000000000001',
  'cognito:username': 'emilys',
  email: 'emily@example.com',
  given_name: 'Emily',
  family_name: 'Johnson',
}

const jwt = (payload: JWT['payload']): JWT => ({ payload, toString: () => 'jwt' })

// What fetchAuthSession returns: a logged-in session, or {} when nobody is logged in.
export const cognitoSession = (claims: JWT['payload'] = EMILY_CLAIMS): AuthSession => ({
  tokens: { idToken: jwt(claims), accessToken: jwt({}) },
})

export const mockSignIn = vi.mocked(signIn)
export const mockSignOut = vi.mocked(signOut)
export const mockFetchAuthSession = vi.mocked(fetchAuthSession)

// A product as the products API returns it (snake_case, string id).
export const API_PRODUCT = {
  id: 'e3fd6d01-87a8-4b81-8505-e6a6982b7ea0',
  item_code: 'product',
  name: 'RCC Cement',
  name_lowercase: 'rcc cement',
  category: 'Construction',
  description: 'Ordinary Portland cement',
  rate_per_unit: 200,
  market_selling_price: 300,
  uom: 'Per Bag',
  eco_friendly: false,
  handle_with_care: false,
  images: [] as string[],
  created_at: '2026-10-27T13:36:15.141Z',
  updated_at: '2026-10-27T13:36:15.141Z',
}

// GET /products response body.
export const productList = (products: readonly unknown[]): unknown => ({
  message: products.length === 0 ? 'No results found' : 'Products retrieved successfully',
  data: products,
  total_count: products.length,
})

// Routes for the two-step image upload: presigned URL from the API, then PUT to "S3".
export const IMAGE_UPLOAD_ROUTES: MockRoutes = {
  'POST /products/upload-url': () =>
    jsonResponse({
      message: 'Upload URL created successfully',
      data: { upload_url: S3_UPLOAD_URL, file_url: S3_FILE_URL, key: 'products/image.png' },
    }),
  [`PUT ${S3_UPLOAD_URL}`]: () => new Response(null, { status: 200 }),
}

export const mockFetch = vi.fn<typeof fetch>()

export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

// Call inside a describe(): every test gets the fake API, nobody logged in and a clean localStorage.
export function installApiMocks(): void {
  beforeEach(() => {
    vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'ap-south-1_test')
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'test-client')
    vi.stubEnv('VITE_PRODUCTS_API_URL', PRODUCTS_API_URL)
    vi.stubGlobal('fetch', mockFetch)
    mockFetchAuthSession.mockResolvedValue({})
    mockSignOut.mockResolvedValue()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    mockFetch.mockReset()
    mockSignIn.mockReset()
    mockSignOut.mockReset()
    mockFetchAuthSession.mockReset()
    localStorage.clear()
  })
}

// Keys look like 'GET /products' or 'POST /products' (the API base URL is stripped).
export type MockRoutes = Record<string, () => Response | Promise<Response>>

const requestKey = (input: RequestInfo | URL, init?: RequestInit): string => {
  const url = input instanceof Request ? input.url : input.toString()
  return `${init?.method ?? 'GET'} ${url.replace(PRODUCTS_API_URL, '')}`
}

export function mockApi(routes: MockRoutes): void {
  mockFetch.mockImplementation((input, init) => {
    const key = requestKey(input, init)
    const route = routes[key]
    return Promise.resolve(
      route === undefined ? jsonResponse({ message: `No mock for ${key}` }, 500) : route(),
    )
  })
}

// The options of the first request matching e.g. 'POST /products'.
export function findRequest(key: string): RequestInit | undefined {
  return mockFetch.mock.calls.find(([input, init]) => requestKey(input, init) === key)?.[1]
}

// The parsed JSON body of the first request matching `key` (undefined if none or not JSON text).
export function requestJson(key: string): unknown {
  const body = findRequest(key)?.body
  return typeof body === 'string' ? JSON.parse(body) : undefined
}

export function renderAt(path: string): void {
  window.history.pushState({}, '', path)
  render(createElement(App))
}

// Starts on a protected page with Emily's Cognito session already saved.
export async function renderLoggedInAt(path: string, routes: MockRoutes = {}): Promise<void> {
  mockFetchAuthSession.mockResolvedValue(cognitoSession())
  mockApi({
    // The products page loads the list; empty unless a test overrides it.
    'GET /products?page_size=100': () => jsonResponse(productList([])),
    ...routes,
  })
  renderAt(path)
  await screen.findByRole('banner')
}

// Fills every required product field except the name and image.
export async function fillRequiredProductFields(user: UserEvent): Promise<void> {
  await user.selectOptions(screen.getByLabelText('Form'), 'Powder')
  await user.selectOptions(screen.getByLabelText('Safety'), 'Flammable')
  await user.selectOptions(screen.getByLabelText('UOM'), 'Per Bag')
  await user.type(screen.getByLabelText('Rate per Unit'), '200')
  await user.type(screen.getByLabelText('Sale Profit Margin (%)'), '33')
}
