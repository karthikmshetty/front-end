import { LogOut, Settings, X } from 'lucide-react'
import { NavLink } from 'react-router'

import { useAuth } from '../../context/useAuth.ts'
import Logo from '../Logo.tsx'
import { NAV_ITEM_CLASS, NAV_ITEMS } from './navItems.ts'

const INACTIVE_CLASS = 'text-on-surface-variant hover:bg-surface-container'
const ACTIVE_CLASS =
  'bg-surface-container font-semibold text-primary before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary'
const DISABLED_CLASS = 'cursor-not-allowed text-on-surface-variant opacity-50'

export interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps): React.JSX.Element {
  const { user, logout } = useAuth()

  return (
    <aside
      id="app-sidebar"
      className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-surface-container-high py-8 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex items-center justify-between px-8">
        <Logo />
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container lg:hidden"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>

      <hr className="mx-6 my-8 border-outline-variant" />

      <nav aria-label="Main" className="flex-1 pr-2.5">
        <ul className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.to}>
                {item.enabled ? (
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `${NAV_ITEM_CLASS} ${isActive ? ACTIVE_CLASS : INACTIVE_CLASS}`
                    }
                  >
                    <Icon aria-hidden="true" className="size-6" />
                    {item.label}
                  </NavLink>
                ) : (
                  <span
                    aria-disabled="true"
                    title="Coming soon"
                    className={`${NAV_ITEM_CLASS} ${DISABLED_CLASS}`}
                  >
                    <Icon aria-hidden="true" className="size-6" />
                    {item.label}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <hr className="mx-6 my-6 border-outline-variant" />

      <div className="space-y-2 pr-2.5">
        <span
          aria-disabled="true"
          title="Coming soon"
          className={`${NAV_ITEM_CLASS} ${DISABLED_CLASS}`}
        >
          <Settings aria-hidden="true" className="size-6" />
          Setting
        </span>
        <button type="button" onClick={logout} className={`${NAV_ITEM_CLASS} ${INACTIVE_CLASS}`}>
          <LogOut aria-hidden="true" className="size-6" />
          Logout
        </button>
      </div>

      {user !== null && (
        <div className="mt-6 flex items-center gap-3 px-7">
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary-container text-label-medium text-on-secondary-container">
            {user.firstName.charAt(0)}
            {user.lastName.charAt(0)}
          </span>
          <span className="text-label-large font-semibold">
            {user.firstName} {user.lastName}
          </span>
        </div>
      )}
    </aside>
  )
}
