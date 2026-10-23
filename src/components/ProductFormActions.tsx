import Button from './Button.tsx'

export interface ProductFormActionsProps {
  submitLabel: string
  isSubmitting: boolean
  // Omitted on the edit page, which has no "Save as draft".
  onSaveDraft?: (() => void) | undefined
}

// Sticky bar at the bottom of the product form (Figma: Cancel · Save as draft · Add Product).
export default function ProductFormActions({
  submitLabel,
  isSubmitting,
  onSaveDraft,
}: ProductFormActionsProps): React.JSX.Element {
  return (
    <div className="sticky bottom-0 -mx-4 mt-8 flex flex-wrap items-center gap-3 border-t border-outline-variant bg-surface px-4 py-4 sm:-mx-8 sm:px-8">
      <Button variant="text" to="/products">
        Cancel
      </Button>
      <div className="ml-auto flex flex-wrap justify-end gap-3">
        {onSaveDraft !== undefined && (
          <Button variant="secondary" onClick={onSaveDraft}>
            Save as draft
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </div>
  )
}
