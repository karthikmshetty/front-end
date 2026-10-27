import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { getToken, saveToken } from './helpers/tokenStorage.ts'
import {
  EMILY,
  installApiMocks,
  jsonResponse,
  mockFetch,
  renderAt,
  renderLoggedInAt,
} from './testUtils.ts'

const LOGIN_HEADING = { name: 'Log in to Old Town Market' }

describe('App', () => {
  installApiMocks()

  describe('public pages', () => {
    it('redirects / to the login page', () => {
      renderAt('/')

      expect(screen.getByRole('heading', LOGIN_HEADING)).toBeInTheDocument()
      expect(window.location.pathname).toBe('/login')
    })

    it('links between login and signup', async () => {
      const user = userEvent.setup()
      renderAt('/login')

      await user.click(screen.getByRole('link', { name: 'Sign up' }))
      expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()

      await user.click(screen.getByRole('link', { name: 'Log in' }))
      expect(screen.getByRole('heading', LOGIN_HEADING)).toBeInTheDocument()
    })

    it('shows the not found page for unknown paths', () => {
      renderAt('/does-not-exist')

      expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    })
  })

  describe('auth', () => {
    it('redirects protected pages to /login when logged out', () => {
      renderAt('/products')

      expect(screen.getByRole('heading', LOGIN_HEADING)).toBeInTheDocument()
      expect(window.location.pathname).toBe('/login')
    })

    it('shows the server error when login fails', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ message: 'Invalid credentials' }, 400))
      const user = userEvent.setup()
      renderAt('/login')

      await user.type(screen.getByLabelText('Username'), 'emilys')
      await user.type(screen.getByLabelText('Password'), 'wrong')
      await user.click(screen.getByRole('button', { name: 'Log in' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
      expect(getToken()).toBeNull()
    })

    it('logs in, greets the user and logs out', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ ...EMILY, accessToken: 'token-1', refreshToken: 'refresh-1' }),
      )
      const user = userEvent.setup()
      renderAt('/login')

      await user.type(screen.getByLabelText('Username'), 'emilys')
      await user.type(screen.getByLabelText('Password'), 'emilyspass')
      await user.click(screen.getByRole('button', { name: 'Log in' }))

      expect(
        await screen.findByRole('heading', { name: 'Welcome back, Emily' }),
      ).toBeInTheDocument()
      expect(getToken()).toBe('token-1')

      await user.click(screen.getByRole('button', { name: 'Logout' }))

      expect(screen.getByRole('heading', LOGIN_HEADING)).toBeInTheDocument()
      expect(getToken()).toBeNull()
    })

    it('restores the session from a saved token', async () => {
      saveToken('token-1')
      mockFetch.mockResolvedValue(jsonResponse(EMILY))
      renderAt('/dashboard')

      expect(screen.getByText('Checking your session…')).toBeInTheDocument()
      expect(
        await screen.findByRole('heading', { name: 'Welcome back, Emily' }),
      ).toBeInTheDocument()
    })

    it('clears an expired token and goes to login', async () => {
      saveToken('old-token')
      mockFetch.mockResolvedValue(jsonResponse({ message: 'Token Expired!' }, 401))
      renderAt('/dashboard')

      expect(await screen.findByRole('heading', LOGIN_HEADING)).toBeInTheDocument()
      expect(getToken()).toBeNull()
    })
  })

  describe('app layout', () => {
    it("shows the user's first name in the header", async () => {
      await renderLoggedInAt('/dashboard')

      expect(within(screen.getByRole('banner')).getByText('Emily')).toBeInTheDocument()
    })

    it('navigates with the sidebar links and highlights the active one', async () => {
      const user = userEvent.setup()
      await renderLoggedInAt('/dashboard')
      const sidebar = screen.getByRole('navigation', { name: 'Main' })

      await user.click(within(sidebar).getByRole('link', { name: 'Products' }))

      expect(window.location.pathname).toBe('/products')
      expect(within(sidebar).getByRole('link', { name: 'Products' })).toHaveAttribute(
        'aria-current',
        'page',
      )
      expect(within(screen.getByRole('banner')).getByText('Products List')).toBeInTheDocument()

      await user.click(within(sidebar).getByRole('link', { name: 'Dashboard' }))

      expect(window.location.pathname).toBe('/dashboard')
      expect(screen.getByRole('heading', { name: 'Welcome back, Emily' })).toBeInTheDocument()
    })

    it('shows the products empty state', async () => {
      await renderLoggedInAt('/products')

      expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument()
      expect(screen.getByRole('searchbox', { name: 'Search products' })).toBeInTheDocument()
      expect(await screen.findByText(/No products yet/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Add Product' })).toHaveAttribute(
        'href',
        '/products/new',
      )
    })
  })
})
