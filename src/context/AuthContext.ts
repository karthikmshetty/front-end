import { createContext } from 'react'

import type { ApiResult } from '../shared/apiClient.ts'
import type { AuthUser, LoginInput } from '../services/authService.ts'

// 'checking' = asking Amplify whether a saved Cognito session exists (on every page load).
export type AuthState =
  { status: 'checking' } | { status: 'authenticated'; user: AuthUser } | { status: 'anonymous' }

export interface AuthContextValue {
  status: AuthState['status']
  user: AuthUser | null
  login: (input: LoginInput) => Promise<ApiResult<AuthUser>>
  logout: () => void
}

// Lives apart from AuthProvider.tsx: React Fast Refresh needs component files to export only components.
export const AuthContext = createContext<AuthContextValue | null>(null)
