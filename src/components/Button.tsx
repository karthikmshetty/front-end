import { Link } from 'react-router'

export interface ButtonProps {
  children: React.ReactNode
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'danger' | 'text'
  icon?: React.ReactNode
  fullWidth?: boolean
  disabled?: boolean
  onClick?: (() => void) | undefined
  // Renders a router link that looks like a button (e.g. "Add Product" -> /products/new).
  to?: string
}

const VARIANT_CLASSES = {
  primary: 'bg-primary text-on-primary hover:opacity-90',
  secondary: 'border border-primary bg-surface text-primary hover:bg-surface-container',
  danger: 'border border-error-outline bg-surface text-error hover:bg-surface-container',
  text: 'text-primary hover:bg-surface-container',
} as const

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  icon,
  fullWidth = false,
  disabled = false,
  onClick,
  to,
}: ButtonProps): React.JSX.Element {
  const className = `inline-flex h-13 items-center justify-center gap-2 rounded-lg px-6 text-label-large focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${fullWidth ? 'w-full' : ''}`

  if (to !== undefined) {
    return (
      <Link to={to} className={className}>
        {icon}
        {children}
      </Link>
    )
  }

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={className}>
      {icon}
      {children}
    </button>
  )
}
