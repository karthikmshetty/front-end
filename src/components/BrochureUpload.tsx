import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { validateBrochureFile } from '../helpers/validators.ts'

export interface BrochureUploadProps {
  file: File | null
  onChange: (file: File | null) => void
}

// Figma "Upload Product Brochure (optional)" drop zone.
export default function BrochureUpload({ file, onChange }: BrochureUploadProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | undefined>(undefined)

  const acceptFile = (picked: File | undefined): void => {
    if (picked === undefined) {
      return
    }
    const message = validateBrochureFile(picked)
    setError(message)
    if (message === undefined) {
      onChange(picked)
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        aria-label="Product brochure file"
        className="hidden"
        onChange={(event) => {
          acceptFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <div
        onDragOver={(event) => {
          event.preventDefault()
        }}
        onDrop={(event) => {
          event.preventDefault()
          acceptFile(event.dataTransfer.files[0])
        }}
        className={`flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-4 text-center text-body-large text-on-surface-variant ${error === undefined ? 'border-primary' : 'border-error-outline'}`}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-primary-fixed-dim text-on-surface">
          <Upload aria-hidden="true" className="size-5" />
        </span>
        {file === null ? (
          <p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-semibold text-primary hover:underline"
            >
              Click to Upload
            </button>{' '}
            or drag and drop
          </p>
        ) : (
          <p>
            <span className="font-medium text-on-surface">{file.name}</span>{' '}
            <button
              type="button"
              onClick={() => {
                onChange(null)
              }}
              className="font-semibold text-error hover:underline"
            >
              Remove
            </button>
          </p>
        )}
        <span className="text-label-medium text-on-surface-variant">(Max. File size: 25 MB)</span>
      </div>
      {error !== undefined && (
        <p role="alert" className="text-body-medium text-error">
          {error}
        </p>
      )}
    </div>
  )
}
