import { Plus } from 'lucide-react'

import { PRODUCT_IMAGE_LIMIT } from '../helpers/validators.ts'

export interface ImageThumbnailsProps {
  previewUrls: readonly string[]
  activeIndex: number
  onSelect: (index: number) => void
  onAdd: () => void
}

const SLOT_CLASS = 'aspect-square w-full rounded-xl'

// The four slots under the main image (Figma: grey while empty, then thumbnails and "+" slots).
export default function ImageThumbnails({
  previewUrls,
  activeIndex,
  onSelect,
  onAdd,
}: ImageThumbnailsProps): React.JSX.Element {
  const slots = Array.from({ length: PRODUCT_IMAGE_LIMIT }, (_, index) => index)

  return (
    <ul className="grid grid-cols-4 gap-5">
      {slots.map((index) => {
        const url = previewUrls[index]
        return (
          <li key={index}>
            {url !== undefined ? (
              <button
                type="button"
                aria-label={`Show image ${String(index + 1)}`}
                aria-pressed={index === activeIndex}
                onClick={() => {
                  onSelect(index)
                }}
                className={`${SLOT_CLASS} overflow-hidden bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${index === activeIndex ? 'ring-2 ring-primary' : ''}`}
              >
                <img src={url} alt="" className="size-full object-contain" />
              </button>
            ) : previewUrls.length === 0 ? (
              <div aria-hidden="true" className={`${SLOT_CLASS} bg-surface-container`} />
            ) : (
              <button
                type="button"
                aria-label="Add another image"
                onClick={onAdd}
                className={`${SLOT_CLASS} flex items-center justify-center border border-dashed border-primary bg-surface-container text-primary hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`}
              >
                <Plus aria-hidden="true" className="size-12" strokeWidth={1.5} />
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
