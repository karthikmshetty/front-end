import { useParams } from 'react-router'

import Button from '../components/Button.tsx'
import EmptyState from '../components/EmptyState.tsx'
import ProductForm from '../components/ProductForm.tsx'
import type { ProductFiles, ProductFormValues } from '../helpers/validators.ts'
import { useProductSave } from '../hooks/useProductSave.ts'
import type { Product } from '../services/productService.ts'
import { toProductFormValues } from '../services/productService.ts'
import type { ApiResult } from '../shared/apiClient.ts'
import {
  errorMessage,
  errorStatus,
  toApiResult,
  useGetProductQuery,
  useUpdateProductMutation,
} from '../store/productsApi.ts'

export type EditProductPageProps = Record<string, never>

export default function EditProductPage(_props: EditProductPageProps): React.JSX.Element {
  const { id = '' } = useParams()
  // RTK Query loads the product (GET /products/{id}) into the Redux store.
  const { data: product, error, isFetching } = useGetProductQuery(id)
  const [updateProduct] = useUpdateProductMutation()
  const sendUpdate = async (
    values: ProductFormValues,
    files: ProductFiles,
  ): Promise<ApiResult<Product>> => {
    if (product === undefined) {
      return { error: true, message: 'The product is still loading.' }
    }
    return toApiResult(await updateProduct({ product, values, files }))
  }
  const { isSaving, error: saveError, save } = useProductSave(sendUpdate, 'updated')

  if (errorStatus(error) === 404) {
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
  if (product === undefined || (isFetching && product.id !== id)) {
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
        currentImageUrl={product.images[0]}
        currentBrochureUrl={product.brochure}
        isSubmitting={isSaving}
        submitError={saveError}
        onSubmit={save}
      />
    </>
  )
}
