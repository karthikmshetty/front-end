import { useState } from 'react'
import { useNavigate } from 'react-router'

import type { ProductFiles, ProductFormValues } from '../helpers/validators.ts'
import type { ApiResult } from '../shared/apiClient.ts'
import type { SavedProduct } from '../services/productService.ts'
import { buildProductFormData } from '../services/productService.ts'

// Sent to /products in router state; ProductsPage reads it once to show the success modal.
export interface SavedProductState {
  savedProduct: { id: number; action: 'added' | 'updated' }
}

// Router state is `unknown` (it survives reloads and can be anything), so check its shape.
export function readSavedProductState(
  state: unknown,
): SavedProductState['savedProduct'] | undefined {
  if (typeof state !== 'object' || state === null || !('savedProduct' in state)) {
    return undefined
  }
  const saved = state.savedProduct
  if (typeof saved !== 'object' || saved === null || !('id' in saved) || !('action' in saved)) {
    return undefined
  }
  const { id, action } = saved
  if (typeof id !== 'number' || (action !== 'added' && action !== 'updated')) {
    return undefined
  }
  return { id, action }
}

export interface ProductSave {
  isSaving: boolean
  error: string | undefined
  save: (values: ProductFormValues, files: ProductFiles) => void
}

// Shared by the add and edit pages: builds the FormData, calls the service, handles the result.
export function useProductSave(
  send: (data: FormData) => Promise<ApiResult<SavedProduct>>,
  action: SavedProductState['savedProduct']['action'],
): ProductSave {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const run = async (values: ProductFormValues, files: ProductFiles): Promise<void> => {
    setIsSaving(true)
    setError(undefined)
    const result = await send(buildProductFormData(values, files))
    setIsSaving(false)
    if (result.error) {
      // The form keeps its own state, so everything the user typed stays in place.
      setError(result.message)
      return
    }
    const state: SavedProductState = { savedProduct: { id: result.data.id, action } }
    void navigate('/products', { state })
  }

  return {
    isSaving,
    error,
    save: (values, files) => {
      void run(values, files)
    },
  }
}
