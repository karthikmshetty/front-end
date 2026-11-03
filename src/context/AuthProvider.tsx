import { useCallback, useEffect, useMemo, useState } from 'react'

import type { ApiResult } from '../shared/apiClient.ts'
import type { AuthUser, LoginInput } from '../services/authService.ts'
import * as authService from '../services/authService.ts'
import type { AuthContextValue, AuthState } from './AuthContext.ts'
import { AuthContext } from './AuthContext.ts'

export interface AuthProviderProps {
  children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [state, setState] = useState<AuthState>({ status: 'checking' })

  // Restore the session after a page refresh: Amplify keeps the Cognito tokens in localStorage.
  useEffect(() => {
    let cancelled = false
    void authService.getCurrentUser().then((result) => {
      if (!cancelled) {
        setState(
          result.error ? { status: 'anonymous' } : { status: 'authenticated', user: result.data },
        )
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (input: LoginInput): Promise<ApiResult<AuthUser>> => {
    const result = await authService.login(input)
    if (!result.error) {
      setState({ status: 'authenticated', user: result.data })
    }
    return result
  }, [])

  const logout = useCallback((): void => {
    void authService.logout()
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
