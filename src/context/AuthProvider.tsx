import { useCallback, useEffect, useMemo, useState } from 'react'

import { clearToken, getToken, saveToken } from '../helpers/tokenStorage.ts'
import type { ApiResult } from '../shared/apiClient.ts'
import type { LoginData, LoginInput } from '../services/authService.ts'
import * as authService from '../services/authService.ts'
import type { AuthContextValue, AuthState } from './AuthContext.ts'
import { AuthContext } from './AuthContext.ts'

export interface AuthProviderProps {
  children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [state, setState] = useState<AuthState>(() =>
    getToken() === null ? { status: 'anonymous' } : { status: 'checking' },
  )

  // Restore the session after a page refresh: the token survives in localStorage, the user does not.
  useEffect(() => {
    const token = getToken()
    if (token === null) {
      return undefined
    }
    let cancelled = false
    void authService.getCurrentUser(token).then((result) => {
      if (cancelled) {
        return
      }
      if (result.error) {
        clearToken()
        setState({ status: 'anonymous' })
        return
      }
      setState({ status: 'authenticated', user: result.data })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (input: LoginInput): Promise<ApiResult<LoginData>> => {
    const result = await authService.login(input)
    if (!result.error) {
      const { accessToken, refreshToken: _refreshToken, ...user } = result.data
      saveToken(accessToken)
      setState({ status: 'authenticated', user })
    }
    return result
  }, [])

  const logout = useCallback((): void => {
    clearToken()
    setState({ status: 'anonymous' })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: state.status === 'authenticated' ? state.user : null,
      login,
      logout,
    }),
    [state, login, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
