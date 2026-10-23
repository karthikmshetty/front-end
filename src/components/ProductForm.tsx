import type { SubmitEvent } from 'react'
import { useState } from 'react'

import {
  EMPTY_PRODUCT_VALUES,
  PRODUCT_CATEGORIES,
  PRODUCT_FORMS,
  PRODUCT_SAFETY,
  PRODUCT_UOMS,
} from '../helpers/productOptions.ts'
import type { FormErrors, ProductFiles, ProductFormValues } from '../helpers/validators.ts'
import { hasErrors, validateProductForm } from '../helpers/validators.ts'
import BrochureUpload from './BrochureUpload.tsx'
import Checkbox from './Checkbox.tsx'
import FormSection from './FormSection.tsx'
import ImageUpload from './ImageUpload.tsx'
import Input from './Input.tsx'
import ProductFormActions from './ProductFormActions.tsx'
import Select from './Select.tsx'

type TextField = {
  [K in keyof ProductFormValues]: ProductFormValues[K] extends string ? K : never
}[keyof ProductFormValues]
type FlagField = 'ecoFriendly' | 'handleWithCare'

export interface ProductFormProps {
  mode: 'add' | 'edit'
  initialValues?: ProductFormValues | undefined
  currentImageUrl?: string | undefined
  isSubmitting: boolean
  submitError?: string | undefined
  onSubmit: (values: ProductFormValues, files: ProductFiles) => void
  // Shows the "Save as draft" button (add page only).
  onSaveDraft?: ((values: ProductFormValues) => void) | undefined
}

// Figma "Add Product" form, shared by the add and edit pages.
export default function ProductForm({
  mode,
  initialValues,
  currentImageUrl,
  isSubmitting,
  submitError,
  onSubmit,
  onSaveDraft,
}: ProductFormProps): React.JSX.Element {
  const [values, setValues] = useState<ProductFormValues>(initialValues ?? EMPTY_PRODUCT_VALUES)
  const [errors, setErrors] = useState<FormErrors<ProductFormValues>>({})
  const [images, setImages] = useState<File[]>([])
  const [brochure, setBrochure] = useState<File | null>(null)
  const [imageError, setImageError] = useState<string | undefined>(undefined)

  const update = (field: TextField | FlagField, value: string | boolean): void => {
    setValues((current) => ({ ...current, [field]: value }))
    // Hide a field's error as soon as the user changes it; submit checks everything again.
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const nextErrors = validateProductForm(values)
    // Edit mode already has the product's image, so a new one is optional there.
    const nextImageError =
      mode === 'add' && images.length === 0 ? 'Upload a product image' : undefined
    setErrors(nextErrors)
    setImageError(nextImageError)
    if (!hasErrors(nextErrors) && nextImageError === undefined) {
      onSubmit(values, { images, brochure })
    }
  }

  const textField = (
    field: TextField,
    label: string,
    extra?: 'multiline' | 'decimal',
  ): React.JSX.Element => (
    <Input
      variant="floating"
      label={label}
      value={values[field]}
      onChange={(value) => {
        update(field, value)
      }}
      error={errors[field]}
      multiline={extra === 'multiline'}
      inputMode={extra === 'decimal' ? 'decimal' : 'text'}
    />
  )

  const selectField = (
    field: TextField,
    label: string,
    options: readonly string[],
  ): React.JSX.Element => (
    <Select
      label={label}
      value={values[field]}
      options={options}
      onChange={(value) => {
        update(field, value)
      }}
      error={errors[field]}
    />
  )

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl bg-surface p-5">
          <FormSection title="Upload Product Image">
            <ImageUpload
              files={images}
              onChange={(files) => {
                setImages(files)
                setImageError(undefined)
              }}
              currentImageUrl={currentImageUrl}
              error={imageError}
            />
          </FormSection>
        </div>

        <div className="space-y-10 rounded-2xl bg-surface p-5">
          <FormSection title="Product Basic Details">
            {textField('name', 'Product Name')}
            {selectField('category', 'Product Category', PRODUCT_CATEGORIES)}
            {textField('description', 'Product Description (Usage, Size or Color)', 'multiline')}
          </FormSection>

          <FormSection title="Additional Product Attributes">
            <div className="grid gap-5 sm:grid-cols-2">
              {selectField('form', 'Form', PRODUCT_FORMS)}
              {selectField('safety', 'Safety', PRODUCT_SAFETY)}
              {selectField('uom', 'UOM', PRODUCT_UOMS)}
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              {(['ecoFriendly', 'handleWithCare'] as const).map((field) => (
                <Checkbox
                  key={field}
                  label={field === 'ecoFriendly' ? 'Eco Friendly' : 'Handle with Care'}
                  checked={values[field]}
                  onChange={(checked) => {
                    update(field, checked)
                  }}
                />
              ))}
            </div>
          </FormSection>

          <FormSection title="Pricing and Rate Settings">
            <div className="grid gap-5 sm:grid-cols-2">
              {textField('ratePerUnit', 'Rate per Unit', 'decimal')}
              {textField('marketPrice', 'Market Selling Price', 'decimal')}
              {textField('profitMargin', 'Sale Profit Margin (%)', 'decimal')}
            </div>
          </FormSection>

          <FormSection title="Other Details (optional)">
            <div className="grid gap-5 sm:grid-cols-2">
              {textField('productType', 'Product Type')}
              {textField('productSize', 'Product Size (L*W*H)')}
              {textField('productVariant', 'Product Variant')}
              {textField('productColor', 'Product Color')}
            </div>
          </FormSection>

          <FormSection title="Upload Product Brochure (optional)">
            <BrochureUpload file={brochure} onChange={setBrochure} />
          </FormSection>
        </div>
      </div>

      {submitError !== undefined && (
        <p role="alert" className="mt-6 text-body-medium text-error">
          {submitError}
        </p>
      )}

      <ProductFormActions
        submitLabel={mode === 'add' ? 'Add Product' : 'Save Changes'}
        isSubmitting={isSubmitting}
        onSaveDraft={
          onSaveDraft === undefined
            ? undefined
            : () => {
                onSaveDraft(values)
              }
        }
      />
    </form>
  )
}
