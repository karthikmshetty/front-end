import { useEffect, useState } from 'react'
import { useParams } from 'react-router'

import Button from '../components/Button.tsx'
import EmptyState from '../components/EmptyState.tsx'
import ProductForm from '../components/ProductForm.tsx'
import { useProductSave } from '../hooks/useProductSave.ts'
import type { Product } from '../services/productService.ts'
import { getProduct, toProductFormValues, updateProduct } from '../services/productService.ts'

// Tagged with the id it belongs to, so a stale result for another id counts as "loading".
type LoadResult =
  | { id: string; status: 'loaded'; product: Product }
  | { id: string; status: 'not-found' }
  | { id: string; status: 'failed'; message: string }

const POSITIVE_INTEGER = /^[1-9]\d*$/

export type EditProductPageProps = Record<string, never>

export default function EditProductPage(_props: EditProductPageProps): React.JSX.Element {
  const { id = '' } = useParams()
  const productId = POSITIVE_INTEGER.test(id) ? Number(id) : null
  const [loaded, setLoaded] = useState<LoadResult | null>(null)
  const { isSaving, error, save } = useProductSave(
    (data) => updateProduct(productId ?? 0, data),
    'updated',
  )

  useEffect(() => {
    if (productId === null) {
      return undefined
    }
    let cancelled = false
    void getProduct(productId).then((result) => {
      if (cancelled) {
        return
      }
      if (!result.error) {
        setLoaded({ id, status: 'loaded', product: result.data })
      } else if (result.status === 404) {
        setLoaded({ id, status: 'not-found' })
      } else {
        setLoaded({ id, status: 'failed', message: result.message })
      }
    })
    return () => {
      cancelled = true
    }
  }, [id, productId])

  // A result for a different id (the user changed the URL) means the new one is still loading.
  const current = loaded?.id === id ? loaded : null

  if (productId === null || current?.status === 'not-found') {
    return (
      <EmptyState
        title="Product not found"
        description={`There is no product with the id "${id}".`}
        action={
          <Button fullWidth to="/products">
            Back to products
          </Button>
        }
      />
    )
  }

  if (current === null) {
    return (
      <p className="py-12 text-center text-body-large text-on-surface-variant">Loading product…</p>
    )
  }

  if (current.status === 'failed') {
    return (
      <p role="alert" className="py-12 text-center text-body-large text-error">
        {current.message}
      </p>
    )
  }

  return (
    <>
      <h1 className="sr-only">Edit product</h1>
      <ProductForm
        key={id}
        mode="edit"
        initialValues={toProductFormValues(current.product)}
        currentImageUrl={current.product.thumbnail}
        isSubmitting={isSaving}
        submitError={error}
        onSubmit={save}
      />
    </>
  )
}
