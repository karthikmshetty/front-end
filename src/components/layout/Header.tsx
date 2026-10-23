import { Bell, Menu } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { useAuth } from '../../context/useAuth.ts'
import { getBreadcrumbs } from './navItems.ts'

export interface HeaderProps {
  isMenuOpen: boolean
  onMenuClick: () => void
}

export default function Header({ isMenuOpen, onMenuClick }: HeaderProps): React.JSX.Element {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-15 items-center gap-3 border-b border-outline-variant bg-surface px-4 sm:px-5">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={isMenuOpen}
        aria-controls="app-sidebar"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container lg:hidden"
      >
        <Menu aria-hidden="true" className="size-6" />
      </button>
      <nav aria-label="Breadcrumb" className="min-w-0 overflow-hidden">
        <ol className="flex items-center gap-2 text-label-large whitespace-nowrap">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.label} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true" className="size-1 rounded-full bg-outline" />}
              {crumb.to === undefined ? (
                <span aria-current="page" className="text-primary">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.to} className="text-on-surface hover:underline">
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {user !== null && <span className="text-label-large">{user.firstName}</span>}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-11 items-center justify-center rounded-lg bg-surface-container text-secondary hover:opacity-90"
        >
          <Bell aria-hidden="true" className="size-6" />
          <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  )
}
