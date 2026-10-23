import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentUser, login, signup } from './authService.ts'

const mockFetch = vi.fn<typeof fetch>()

const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('authService', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    mockFetch.mockReset()
  })

  describe('login', () => {
    it('posts the credentials and returns the user with tokens', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse(
          {
            id: 1,
            username: 'emilys',
            firstName: 'Emily',
            accessToken: 'token-1',
            refreshToken: 'r',
          },
          200,
        ),
      )

      const result = await login({ username: ' emilys ', password: 'emilyspass' })

      expect(result.error).toBe(false)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'emilys', password: 'emilyspass' }),
        }),
      )
    })

    it('returns the server message on invalid credentials', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ message: 'Invalid credentials' }, 400))

      const result = await login({ username: 'x', password: 'y' })

      expect(result).toEqual({ error: true, status: 400, message: 'Invalid credentials' })
    })

    it('returns a network error when the request fails', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

      const result = await login({ username: 'x', password: 'y' })

      expect(result).toEqual({
        error: true,
        message: 'Network error. Check your connection and try again.',
      })
    })

    it('fails clearly when the base URL is missing', async () => {
      vi.stubEnv('VITE_API_BASE_URL', '')

      const result = await login({ username: 'x', password: 'y' })

      expect(result).toEqual({ error: true, message: 'VITE_API_BASE_URL is not configured' })
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('getCurrentUser', () => {
    it('sends the token as a bearer header', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ id: 1, username: 'emilys', firstName: 'Emily' }, 200),
      )

      const result = await getCurrentUser('token-1')

      expect(result).toEqual({
        error: false,
        data: { id: 1, username: 'emilys', firstName: 'Emily' },
      })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test/auth/me',
        expect.objectContaining({ headers: { Authorization: 'Bearer token-1' } }),
      )
    })

    it('returns the status for an expired token', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ message: 'Token Expired!' }, 401))

      const result = await getCurrentUser('old-token')

      expect(result).toEqual({ error: true, status: 401, message: 'Token Expired!' })
    })
  })

  describe('signup', () => {
    it('posts the new user to /users/add', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ id: 209, firstName: 'Asha', lastName: 'Rao', email: 'a@b.com' }, 201),
      )

      const result = await signup({
        firstName: 'Asha',
        lastName: 'Rao',
        email: 'a@b.com',
        password: 'secret123',
      })

      expect(result).toEqual({
        error: false,
        data: { id: 209, firstName: 'Asha', lastName: 'Rao', email: 'a@b.com' },
      })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test/users/add',
        expect.objectContaining({
          body: JSON.stringify({
            firstName: 'Asha',
            lastName: 'Rao',
            email: 'a@b.com',
            password: 'secret123',
          }),
        }),
      )
    })
  })
})
