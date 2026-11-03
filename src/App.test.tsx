import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  cognitoSession,
  installApiMocks,
  mockFetchAuthSession,
  mockSignIn,
  mockSignOut,
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

    it('has no sign up: users come from an admin', () => {
      renderAt('/login')

      expect(screen.getByText('No account yet? Ask your admin to create one.')).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Sign up' })).not.toBeInTheDocument()
    })

    it('shows the not found page for unknown paths', () => {
      renderAt('/does-not-exist')

      expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    })
  })

  describe('auth', () => {
    it('redirects protected pages to /login when logged out', async () => {
      renderAt('/products')

      expect(await screen.findByRole('heading', LOGIN_HEADING)).toBeInTheDocument()
      expect(window.location.pathname).toBe('/login')
    })

    it('shows the Cognito error when login fails', async () => {
      mockSignIn.mockRejectedValue(
        Object.assign(new Error('Incorrect username or password.'), {
          name: 'NotAuthorizedException',
        }),
      )
      const user = userEvent.setup()
      renderAt('/login')

      await user.type(screen.getByLabelText('Username'), 'emilys')
      await user.type(screen.getByLabelText('Password'), 'wrong')
      await user.click(screen.getByRole('button', { name: 'Log in' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect username or password.')
      expect(window.location.pathname).toBe('/login')
    })

    it('logs in, greets the user and logs out', async () => {
      mockSignIn.mockResolvedValue({ isSignedIn: true, nextStep: { signInStep: 'DONE' } })
      const user = userEvent.setup()
      renderAt('/login')
      await screen.findByRole('heading', LOGIN_HEADING)

      // From now on Amplify has a session to return.
      mockFetchAuthSession.mockResolvedValue(cognitoSession())
      await user.type(screen.getByLabelText('Username'), 'emilys')
      await user.type(screen.getByLabelText('Password'), 'Emilys-pass1')
      await user.click(screen.getByRole('button', { name: 'Log in' }))

      expect(
        await screen.findByRole('heading', { name: 'Welcome back, Emily' }),
      ).toBeInTheDocument()
      expect(mockSignIn).toHaveBeenCalledWith({ username: 'emilys', password: 'Emilys-pass1' })

      await user.click(screen.getByRole('button', { name: 'Logout' }))

      expect(screen.getByRole('heading', LOGIN_HEADING)).toBeInTheDocument()
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('restores a saved Cognito session', async () => {
      mockFetchAuthSession.mockResolvedValue(cognitoSession())
      renderAt('/dashboard')

      expect(screen.getByText('Checking your session…')).toBeInTheDocument()
      expect(
        await screen.findByRole('heading', { name: 'Welcome back, Emily' }),
      ).toBeInTheDocument()
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
