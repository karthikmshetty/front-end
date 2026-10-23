// "Save as draft": keeps the typed product details in this browser. Files (images, brochure)
// cannot be stored in localStorage, so drafts hold text fields and checkboxes only.
import { EMPTY_PRODUCT_VALUES } from './productOptions.ts'
import type { ProductFormValues } from './validators.ts'

export const PRODUCT_DRAFT_KEY = 'productDraft'

// Returns false when the browser blocks storage (private mode, full disk).
export function saveProductDraft(values: ProductFormValues): boolean {
  try {
    localStorage.setItem(PRODUCT_DRAFT_KEY, JSON.stringify(values))
    return true
  } catch {
    return false
  }
}

// Only fields with the expected type are restored; anything else falls back to empty.
export function loadProductDraft(): ProductFormValues | undefined {
  try {
    const raw = localStorage.getItem(PRODUCT_DRAFT_KEY)
    if (raw === null) {
      return undefined
    }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return undefined
    }
    const stored = parsed as Record<string, unknown>
    const draft: Record<string, unknown> = { ...EMPTY_PRODUCT_VALUES }
    for (const [key, emptyValue] of Object.entries(EMPTY_PRODUCT_VALUES)) {
      if (typeof stored[key] === typeof emptyValue) {
        draft[key] = stored[key]
      }
    }
    return draft as unknown as ProductFormValues
  } catch {
    return undefined
  }
}

export function clearProductDraft(): void {
  try {
    localStorage.removeItem(PRODUCT_DRAFT_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
