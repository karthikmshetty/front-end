import { Navigate, Outlet } from 'react-router'

import { useAuth } from '../context/useAuth.ts'

export type ProtectedRouteProps = Record<string, never>

// Layout route: wrap any <Route> that needs a logged-in user.
export default function ProtectedRoute(_props: ProtectedRouteProps): React.JSX.Element {
  const { status } = useAuth()

  switch (status) {
    case 'checking':
      return (
        <p className="flex min-h-screen items-center justify-center font-sans text-body-large text-on-surface-variant">
          Checking your session…
        </p>
      )
    case 'anonymous':
      return <Navigate to="/login" replace />
    case 'authenticated':
      return <Outlet />
  }
}
