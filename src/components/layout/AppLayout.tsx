import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router'

import Header from './Header.tsx'
import Sidebar from './Sidebar.tsx'

export type AppLayoutProps = Record<string, never>

// Frame for every logged-in page. Below the lg breakpoint the sidebar slides in over the page.
export default function AppLayout(_props: AppLayoutProps): React.JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = useCallback((): void => {
    setIsMenuOpen(false)
  }, [])

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  return (
    <div className="flex min-h-screen bg-surface-container-low font-sans text-on-surface">
      <Sidebar isOpen={isMenuOpen} onClose={closeMenu} />
      {isMenuOpen && (
        <div
          aria-hidden="true"
          onClick={closeMenu}
          className="fixed inset-0 z-30 bg-on-surface/40 lg:hidden"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          isMenuOpen={isMenuOpen}
          onMenuClick={() => {
            setIsMenuOpen(true)
          }}
        />
        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
