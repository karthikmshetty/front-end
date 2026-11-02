import { useState } from 'react'
import { useNavigate } from 'react-router'

import type { ProductFiles, ProductFormValues } from '../helpers/validators.ts'
import type { Product } from '../services/productService.ts'
import type { ApiResult } from '../shared/apiClient.ts'

// Sent to /products in router state; ProductsPage reads it once to show the success modal.
export interface SavedProductState {
  savedProduct: { name: string; action: 'added' | 'updated' }
}

// Router state is `unknown` (it survives reloads and can be anything), so check its shape.
export function readSavedProductState(
  state: unknown,
): SavedProductState['savedProduct'] | undefined {
  if (typeof state !== 'object' || state === null || !('savedProduct' in state)) {
    return undefined
  }
  const saved = state.savedProduct
  if (typeof saved !== 'object' || saved === null || !('name' in saved) || !('action' in saved)) {
    return undefined
  }
  const { name, action } = saved
  if (typeof name !== 'string' || (action !== 'added' && action !== 'updated')) {
    return undefined
  }
  return { name, action }
}

export interface ProductSave {
  isSaving: boolean
  error: string | undefined
  save: (values: ProductFormValues, files: ProductFiles) => void
}

// Shared by the add and edit pages: calls the save function, then shows errors or goes back
// to the list.
export function useProductSave(
  send: (values: ProductFormValues, files: ProductFiles) => Promise<ApiResult<Product>>,
  action: SavedProductState['savedProduct']['action'],
): ProductSave {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const run = async (values: ProductFormValues, files: ProductFiles): Promise<void> => {
    setIsSaving(true)
    setError(undefined)
    const result = await send(values, files)
    setIsSaving(false)
    if (result.error) {
      // The form keeps its own state, so everything the user typed stays in place.
      setError(result.message)
      return
    }
    const state: SavedProductState = { savedProduct: { name: result.data.name, action } }
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
