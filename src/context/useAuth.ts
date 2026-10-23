import { use } from 'react'

import type { AuthContextValue } from './AuthContext.ts'
import { AuthContext } from './AuthContext.ts'

export function useAuth(): AuthContextValue {
  const value = use(AuthContext)
  if (value === null) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return value
}
