import { useState } from 'react'

import ProductForm from '../components/ProductForm.tsx'
import SuccessModal from '../components/SuccessModal.tsx'
import { clearProductDraft, loadProductDraft, saveProductDraft } from '../helpers/productDraft.ts'
import type { ProductFormValues } from '../helpers/validators.ts'
import { useProductSave } from '../hooks/useProductSave.ts'
import { addProduct } from '../services/productService.ts'

// The draft is no longer needed once the product is saved.
const addAndClearDraft: typeof addProduct = async (data) => {
  const result = await addProduct(data)
  if (!result.error) {
    clearProductDraft()
  }
  return result
}

export type AddProductPageProps = Record<string, never>

export default function AddProductPage(_props: AddProductPageProps): React.JSX.Element {
  const { isSaving, error, save } = useProductSave(addAndClearDraft, 'added')
  const [draft] = useState(loadProductDraft)
  const [isDraftSaved, setIsDraftSaved] = useState(false)
  const [draftError, setDraftError] = useState<string | undefined>(undefined)

  const handleSaveDraft = (values: ProductFormValues): void => {
    const saved = saveProductDraft(values)
    setIsDraftSaved(saved)
    setDraftError(saved ? undefined : 'This browser does not allow saving drafts.')
  }

  return (
    <>
      <h1 className="sr-only">Add product</h1>
      <ProductForm
        mode="add"
        initialValues={draft}
        isSubmitting={isSaving}
        submitError={error ?? draftError}
        onSubmit={save}
        onSaveDraft={handleSaveDraft}
      />
      {isDraftSaved && (
        <SuccessModal
          title="Draft Saved Successfully"
          onClose={() => {
            setIsDraftSaved(false)
          }}
        >
          Your product details are saved in this browser and will be filled in next time you add a
          product. Images and the brochure are not saved in drafts.
        </SuccessModal>
      )}
    </>
  )
}
