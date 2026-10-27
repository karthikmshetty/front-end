// Shared helpers for tests that render the whole app against a fake API.
import { render, screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { createElement } from 'react'
import { afterEach, beforeEach, vi } from 'vitest'

import App from './App.tsx'
import { saveToken } from './helpers/tokenStorage.ts'

const API_BASE_URL = 'https://api.test'

export const EMILY = {
  id: 1,
  username: 'emilys',
  email: 'emily@example.com',
  firstName: 'Emily',
  lastName: 'Johnson',
  image: '',
}

export const EMPTY_PRODUCT_LIST = { products: [], total: 0, skip: 0, limit: 0 }

export const mockFetch = vi.fn<typeof fetch>()

export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

// Call inside a describe(): every test gets the fake API and a clean localStorage.
export function installApiMocks(): void {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', API_BASE_URL)
    vi.stubGlobal('fetch', mockFetch)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    mockFetch.mockReset()
    localStorage.clear()
  })
}

// Keys look like 'GET /auth/me' or 'POST /products/add'.
export type MockRoutes = Record<string, () => Response | Promise<Response>>

const requestKey = (input: RequestInfo | URL, init?: RequestInit): string => {
  const url = input instanceof Request ? input.url : input.toString()
  return `${init?.method ?? 'GET'} ${url.replace(API_BASE_URL, '')}`
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

// The options of the first request matching e.g. 'POST /products/add'.
export function findRequest(key: string): RequestInit | undefined {
  return mockFetch.mock.calls.find(([input, init]) => requestKey(input, init) === key)?.[1]
}

export function renderAt(path: string): void {
  window.history.pushState({}, '', path)
  render(createElement(App))
}

// Starts on a protected page with a saved token that /auth/me accepts.
export async function renderLoggedInAt(path: string, routes: MockRoutes = {}): Promise<void> {
  saveToken('token-1')
  mockApi({
    'GET /auth/me': () => jsonResponse(EMILY),
    // The products page loads the list; empty unless a test overrides it.
    'GET /products?limit=0': () => jsonResponse(EMPTY_PRODUCT_LIST),
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
