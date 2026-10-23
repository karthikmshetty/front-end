import { Image as ImageIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  PRODUCT_IMAGE_LIMIT,
  PRODUCT_IMAGE_TYPES,
  validateImageFile,
} from '../helpers/validators.ts'
import Button from './Button.tsx'
import ImageThumbnails from './ImageThumbnails.tsx'
import Modal from './Modal.tsx'

export interface ImageUploadProps {
  // The picked files live in the parent form's state; nothing is uploaded until the form submits.
  files: readonly File[]
  onChange: (files: File[]) => void
  // Edit mode: the product's existing image, shown until a new file is picked.
  currentImageUrl?: string | undefined
  error?: string | undefined
}

export default function ImageUpload({
  files,
  onChange,
  currentImageUrl,
  error,
}: ImageUploadProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  // Where the next picked file goes: a new slot, or replacing the image at this index.
  const pickTarget = useRef<'add' | number>('add')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [fileError, setFileError] = useState<string | undefined>(undefined)
  const [isAttentionOpen, setIsAttentionOpen] = useState(false)

  // Temporary blob: URLs so the browser can show local files before they are uploaded.
  const previewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files])
  useEffect(() => {
    // Free the memory behind the old URLs when the files change or the form closes.
    return () => {
      previewUrls.forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, [previewUrls])

  const activeIndex = Math.min(selectedIndex, Math.max(files.length - 1, 0))
  const shownUrl = previewUrls[activeIndex] ?? currentImageUrl ?? null
  const shownError = fileError ?? error

  const openPicker = (target: 'add' | number): void => {
    pickTarget.current = target
    inputRef.current?.click()
  }

  const acceptFile = (picked: File | undefined): void => {
    if (picked === undefined) {
      return
    }
    const message = validateImageFile(picked)
    setFileError(message)
    if (message !== undefined) {
      return
    }
    const target = pickTarget.current
    if (target === 'add') {
      if (files.length < PRODUCT_IMAGE_LIMIT) {
        onChange([...files, picked])
        setSelectedIndex(files.length)
      }
    } else {
      onChange(files.map((file, index) => (index === target ? picked : file)))
    }
  }

  const removeActive = (): void => {
    onChange(files.filter((_, index) => index !== activeIndex))
    setSelectedIndex(0)
  }

  return (
    <div className="space-y-5">
      <input
        ref={inputRef}
        type="file"
        accept={PRODUCT_IMAGE_TYPES.join(',')}
        aria-label="Product image file"
        className="hidden"
        onChange={(event) => {
          acceptFile(event.target.files?.[0])
          // Reset so picking the same file again still fires onChange.
          event.target.value = ''
        }}
      />

      {shownUrl === null ? (
        <button
          type="button"
          onClick={() => {
            openPicker('add')
          }}
          onDragOver={(event) => {
            event.preventDefault()
          }}
          onDrop={(event) => {
            event.preventDefault()
            pickTarget.current = 'add'
            acceptFile(event.dataTransfer.files[0])
          }}
          className={`flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-surface-container text-body-large text-on-surface-variant hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${shownError === undefined ? 'border-primary' : 'border-error-outline'}`}
        >
          <ImageIcon aria-hidden="true" className="mb-6 size-28 text-outline" strokeWidth={1.25} />
          <span className="text-title-medium text-primary">Click to Upload Product Picture</span>
          <span>or drag and drop</span>
        </button>
      ) : (
        // Clicking the picture opens the Figma "Attention" modal (or the picker for the edit
        // page's existing image, which cannot be removed from here).
        <button
          type="button"
          aria-label="Change image"
          onClick={() => {
            if (files.length === 0) {
              openPicker('add')
            } else {
              setIsAttentionOpen(true)
            }
          }}
          className="block w-full rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <img
            src={shownUrl}
            alt="Product preview"
            className="aspect-square w-full rounded-xl bg-surface object-contain"
          />
        </button>
      )}

      <ImageThumbnails
        previewUrls={previewUrls}
        activeIndex={activeIndex}
        onSelect={setSelectedIndex}
        onAdd={() => {
          openPicker('add')
        }}
      />

      {shownError !== undefined && (
        <p role="alert" className="text-body-medium text-error">
          {shownError}
        </p>
      )}

      {isAttentionOpen && (
        <Modal
          tone="attention"
          title="Attention !"
          onClose={() => {
            setIsAttentionOpen(false)
          }}
          actions={
            <>
              <Button
                variant="danger"
                onClick={() => {
                  setIsAttentionOpen(false)
                  removeActive()
                }}
              >
                Remove
              </Button>
              <Button
                onClick={() => {
                  setIsAttentionOpen(false)
                  openPicker(activeIndex)
                }}
              >
                Replace
              </Button>
            </>
          }
        >
          Do you want to remove this image or replace it with a different one?
        </Modal>
      )}
    </div>
  )
}
