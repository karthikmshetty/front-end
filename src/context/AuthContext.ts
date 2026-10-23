import { createContext } from 'react'

import type { ApiResult } from '../shared/apiClient.ts'
import type { AuthUser, LoginData, LoginInput } from '../services/authService.ts'

// 'checking' = a saved token exists and is being verified with /auth/me.
export type AuthState =
  { status: 'checking' } | { status: 'authenticated'; user: AuthUser } | { status: 'anonymous' }

export interface AuthContextValue {
  status: AuthState['status']
  user: AuthUser | null
  login: (input: LoginInput) => Promise<ApiResult<LoginData>>
  logout: () => void
}

// Lives apart from AuthProvider.tsx: React Fast Refresh needs component files to export only components.
export const AuthContext = createContext<AuthContextValue | null>(null)
