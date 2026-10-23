import { afterEach, describe, expect, it } from 'vitest'

import { clearToken, getToken, saveToken } from './tokenStorage.ts'

describe('tokenStorage', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('returns null when no token is saved', () => {
    expect(getToken()).toBeNull()
  })

  it('saves, reads and clears the token', () => {
    saveToken('abc123')
    expect(getToken()).toBe('abc123')

    clearToken()
    expect(getToken()).toBeNull()
  })
})
