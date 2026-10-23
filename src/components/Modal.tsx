import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useEffect, useEffectEvent, useId, useRef } from 'react'

export interface ModalProps {
  // Figma "Success Modal" (green check) and "Attention Modal" (orange alert + close button).
  tone: 'success' | 'attention'
  title: string
  children: React.ReactNode
  actions: React.ReactNode
  onClose: () => void
}

export default function Modal({
  tone,
  title,
  children,
  actions,
  onClose,
}: ModalProps): React.JSX.Element {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const handleKeyDown = useEffectEvent((event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      onClose()
    }
  })

  useEffect(() => {
    panelRef.current?.focus()
    const listener = (event: KeyboardEvent): void => {
      handleKeyDown(event)
    }
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-xl rounded-xl bg-surface p-5 shadow-xl focus:outline-none"
      >
        {tone === 'attention' && (
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-surface-container text-on-surface hover:opacity-90"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
        )}
        {tone === 'success' ? (
          <CircleCheck aria-hidden="true" className="size-10 text-success" />
        ) : (
          <CircleAlert aria-hidden="true" className="size-10 text-warning" />
        )}
        <h2 id={titleId} className="mt-4 text-title-medium text-on-surface">
          {title}
        </h2>
        <div className="mt-2 text-body-medium text-on-surface-variant">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{actions}</div>
      </div>
    </div>
  )
}
