import { useId } from 'react'

import FieldError from './FieldError.tsx'

export interface InputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password'
  // 'stacked': label above (login). 'floating': label inside the border (product form).
  variant?: 'stacked' | 'floating'
  multiline?: boolean
  inputMode?: 'text' | 'decimal'
  error?: string | undefined
  placeholder?: string
  autoComplete?: string
}

// Floating label: sits inside the field while empty, moves onto the border on focus or when filled.
const FLOATED_LABEL = 'top-0 -translate-y-1/2 text-label-medium'
const RESTING_LABEL =
  'text-body-large peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-label-medium peer-focus:text-primary'

export default function Input({
  label,
  value,
  onChange,
  type = 'text',
  variant = 'stacked',
  multiline = false,
  inputMode = 'text',
  error,
  placeholder,
  autoComplete,
}: InputProps): React.JSX.Element {
  const id = useId()
  const errorId = `${id}-error`
  const hasError = error !== undefined
  const isFloating = variant === 'floating'

  const handleChange = (event: { target: { value: string } }): void => {
    onChange(event.target.value)
  }
  const restingPosition = multiline ? 'top-4' : 'top-1/2 -translate-y-1/2'
  const labelClass = isFloating
    ? `pointer-events-none absolute left-3 bg-surface px-1 text-on-surface-variant transition-all ${value === '' ? `${restingPosition} ${RESTING_LABEL}` : FLOATED_LABEL}`
    : 'text-title-small text-on-surface'
  const borderClass = hasError
    ? 'border-error-outline'
    : isFloating
      ? 'border-outline'
      : 'border-outline-variant'
  const fieldClass = `peer w-full rounded-lg border bg-surface px-4 text-body-large text-on-surface placeholder:text-on-surface-variant focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${borderClass} ${multiline ? 'min-h-44 py-4' : 'h-14'}`
  const sharedProps = {
    id,
    value,
    'aria-invalid': hasError,
    'aria-describedby': hasError ? errorId : undefined,
    placeholder: isFloating ? undefined : placeholder,
    className: fieldClass,
  }
  const labelElement = (
    <label htmlFor={id} className={labelClass}>
      {label}
    </label>
  )

  return (
    <div className="flex flex-col gap-2">
      {!isFloating && labelElement}
      <div className="relative">
        {multiline ? (
          <textarea {...sharedProps} rows={6} onChange={handleChange} />
        ) : (
          <input
            {...sharedProps}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            onChange={handleChange}
          />
        )}
        {isFloating && labelElement}
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
