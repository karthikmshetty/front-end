import { ChevronDown } from 'lucide-react'
import { useId } from 'react'

import FieldError from './FieldError.tsx'

export interface SelectProps {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
  error?: string | undefined
}

// Same floating-label look as <Input variant="floating">.
export default function Select({
  label,
  value,
  options,
  onChange,
  error,
}: SelectProps): React.JSX.Element {
  const id = useId()
  const errorId = `${id}-error`
  const hasError = error !== undefined
  // An edited product can hold a value that is not in our list (e.g. DummyJSON's "beauty").
  const allOptions = value === '' || options.includes(value) ? options : [value, ...options]

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <select
          id={id}
          value={value}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          onChange={(event) => {
            onChange(event.target.value)
          }}
          className={`peer h-14 w-full appearance-none rounded-lg border bg-surface pr-12 pl-4 text-body-large text-on-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${hasError ? 'border-error-outline' : 'border-outline'}`}
        >
          <option value="" disabled hidden />
          {allOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-3 bg-surface px-1 text-on-surface-variant transition-all ${value === '' ? 'top-1/2 -translate-y-1/2 text-body-large peer-focus:top-0 peer-focus:text-label-medium peer-focus:text-primary' : 'top-0 -translate-y-1/2 text-label-medium'}`}
        >
          {label}
        </label>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-on-surface-variant"
        />
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
