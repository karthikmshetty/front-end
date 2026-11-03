import { describe, expect, it, vi } from 'vitest'

import {
  cognitoSession,
  installApiMocks,
  mockFetchAuthSession,
  mockSignIn,
  mockSignOut,
} from '../testUtils.ts'
import { getCurrentUser, login, logout } from './authService.ts'

const SIGNED_IN = { isSignedIn: true, nextStep: { signInStep: 'DONE' } } as const

const EMILY = {
  id: '7f1c2a9e-0000-4000-8000-000000000001',
  username: 'emilys',
  email: 'emily@example.com',
  firstName: 'Emily',
  lastName: 'Johnson',
}

const namedError = (name: string, message: string): Error =>
  Object.assign(new Error(message), { name })

describe('authService', () => {
  installApiMocks()

  describe('login', () => {
    it('signs in to Cognito and reads the user from the ID token', async () => {
      mockSignIn.mockResolvedValue(SIGNED_IN)
      mockFetchAuthSession.mockResolvedValue(cognitoSession())

      const result = await login({ username: ' emilys ', password: 'Emilys-pass1' })

      expect(result).toEqual({ error: false, data: EMILY })
      expect(mockSignIn).toHaveBeenCalledWith({ username: 'emilys', password: 'Emilys-pass1' })
    })

    it("returns Cognito's message on wrong credentials", async () => {
      mockSignIn.mockRejectedValue(
        namedError('NotAuthorizedException', 'Incorrect username or password.'),
      )

      expect(await login({ username: 'x', password: 'y' })).toEqual({
        error: true,
        message: 'Incorrect username or password.',
      })
    })

    it('returns the network error when Cognito cannot be reached', async () => {
      mockSignIn.mockRejectedValue(namedError('NetworkError', 'A network error has occurred.'))

      expect(await login({ username: 'x', password: 'y' })).toEqual({
        error: true,
        message: 'Network error. Check your connection and try again.',
      })
    })

    it('ends a leftover session and signs in again', async () => {
      mockSignIn
        .mockRejectedValueOnce(namedError('UserAlreadyAuthenticatedException', 'Already signed in'))
        .mockResolvedValueOnce(SIGNED_IN)
      mockFetchAuthSession.mockResolvedValue(cognitoSession())

      const result = await login({ username: 'emilys', password: 'Emilys-pass1' })

      expect(result.error).toBe(false)
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(mockSignIn).toHaveBeenCalledTimes(2)
    })

    it('explains when the account needs a step this app does not support', async () => {
      mockSignIn.mockResolvedValue({
        isSignedIn: false,
        nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED' },
      })

      const result = await login({ username: 'new', password: 'Temp-pass1' })

      expect(result).toEqual({
        error: true,
        message: expect.stringContaining('Ask an admin to set a permanent password') as string,
      })
      expect(mockFetchAuthSession).not.toHaveBeenCalled()
    })
  })

  describe('getCurrentUser', () => {
    it('uses the username when the user has no first name', async () => {
      mockFetchAuthSession.mockResolvedValue(
        cognitoSession({ sub: 'u-2', 'cognito:username': 'asha' }),
      )

      expect(await getCurrentUser()).toEqual({
        error: false,
        data: { id: 'u-2', username: 'asha', email: '', firstName: 'asha', lastName: '' },
      })
    })

    it('reports "not logged in" when there is no saved session', async () => {
      expect(await getCurrentUser()).toEqual({
        error: true,
        status: 401,
        message: 'Not logged in',
      })
    })
  })

  describe('logout', () => {
    it('signs out of Cognito and ignores a failed revoke', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      mockSignOut.mockRejectedValue(new Error('offline'))

      await logout()

      expect(mockSignOut).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalled()
      warn.mockRestore()
    })
  })

  it('fails clearly when the Cognito settings are missing', async () => {
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', '')
    // Fresh copy of the module: the one above is already configured.
    vi.resetModules()
    const fresh = await import('./authService.ts')

    expect(await fresh.login({ username: 'x', password: 'y' })).toEqual({
      error: true,
      message: 'VITE_COGNITO_CLIENT_ID is not configured',
    })
  })
})
