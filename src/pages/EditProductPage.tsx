import { skipToken } from '@reduxjs/toolkit/query/react'
import { useParams } from 'react-router'

import Button from '../components/Button.tsx'
import EmptyState from '../components/EmptyState.tsx'
import ProductForm from '../components/ProductForm.tsx'
import { useProductSave } from '../hooks/useProductSave.ts'
import type { SavedProduct } from '../services/productService.ts'
import { toProductFormValues } from '../services/productService.ts'
import type { ApiResult } from '../shared/apiClient.ts'
import {
  errorMessage,
  errorStatus,
  toApiResult,
  useGetProductQuery,
  useUpdateProductMutation,
} from '../store/productsApi.ts'

const POSITIVE_INTEGER = /^[1-9]\d*$/

export type EditProductPageProps = Record<string, never>

export default function EditProductPage(_props: EditProductPageProps): React.JSX.Element {
  const { id = '' } = useParams()
  const productId = POSITIVE_INTEGER.test(id) ? Number(id) : null
  // RTK Query loads the product into the Redux store; skipToken = do not call the API at all.
  const { data: product, error, isFetching } = useGetProductQuery(productId ?? skipToken)
  const [updateProduct] = useUpdateProductMutation()
  const sendUpdate = async (data: FormData): Promise<ApiResult<SavedProduct>> =>
    toApiResult(await updateProduct({ id: productId ?? 0, data }))
  const { isSaving, error: saveError, save } = useProductSave(sendUpdate, 'updated')

  if (productId === null || errorStatus(error) === 404) {
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

  if (error !== undefined) {
    return (
      <p role="alert" className="py-12 text-center text-body-large text-error">
        {errorMessage(error)}
      </p>
    )
  }

  // isFetching (not just isLoading) so a cached product for another id is never shown.
  if (product === undefined || (isFetching && product.id !== productId)) {
    return (
      <p className="py-12 text-center text-body-large text-on-surface-variant">Loading product…</p>
    )
  }

  return (
    <>
      <h1 className="sr-only">Edit product</h1>
      <ProductForm
        key={id}
        mode="edit"
        initialValues={toProductFormValues(product)}
        currentImageUrl={product.thumbnail}
        isSubmitting={isSaving}
        submitError={saveError}
        onSubmit={save}
      />
    </>
  )
}
