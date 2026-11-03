// Pure validation rules: each returns an error message, or undefined when the value is valid.

export const USERNAME_MIN_LENGTH = 3

export type FormErrors<T> = Partial<Record<keyof T, string | undefined>>

export interface LoginValues {
  username: string
  password: string
}

const isBlank = (value: string): boolean => value.trim() === ''

export function validateRequired(value: string, label: string): string | undefined {
  return isBlank(value) ? `${label} is required` : undefined
}

export function validateUsername(value: string): string | undefined {
  if (isBlank(value)) {
    return 'Username is required'
  }
  if (value.trim().length < USERNAME_MIN_LENGTH) {
    return `Username must be at least ${String(USERNAME_MIN_LENGTH)} characters`
  }
  return undefined
}

export function validateLoginForm(values: LoginValues): FormErrors<LoginValues> {
  return {
    username: validateUsername(values.username),
    // Login only checks presence: the password rules live in the Cognito pool.
    password: values.password === '' ? 'Password is required' : undefined,
  }
}

export function hasErrors<T>(errors: FormErrors<T>): boolean {
  return Object.values(errors).some((message) => message !== undefined)
}

// Product form (Figma "Add Product"). Selects hold '' until the user picks an option.
export interface ProductFormValues {
  name: string
  category: string
  description: string
  form: string
  safety: string
  uom: string
  ecoFriendly: boolean
  handleWithCare: boolean
  ratePerUnit: string
  marketPrice: string
  profitMargin: string
  productType: string
  productSize: string
  productVariant: string
  productColor: string
}

// The files picked in the product form, uploaded to S3 on submit.
export interface ProductFiles {
  images: readonly File[]
  brochure: File | null
}

export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024
// The design has four thumbnail slots under the main image (the API allows up to 5).
export const PRODUCT_IMAGE_LIMIT = 4
// Limits of the products API (POST /products); checked here so users see them before saving.
export const PRODUCT_NAME_MAX_LENGTH = 100
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 1000
// "Upload Product Brochure (optional)": 25 MB from the design; the API only accepts PDF uploads.
export const BROCHURE_TYPE = 'application/pdf'
export const BROCHURE_MAX_BYTES = 25 * 1024 * 1024

const DECIMAL_PATTERN = /^\d+(\.\d{1,2})?$/

export function validateImageFile(file: Pick<File, 'type' | 'size'>): string | undefined {
  if (!(PRODUCT_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Upload a JPG, PNG or WebP image'
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return 'Image must be 2 MB or smaller'
  }
  return undefined
}

export function validateBrochureFile(file: Pick<File, 'type' | 'size'>): string | undefined {
  if (file.type !== BROCHURE_TYPE) {
    return 'Upload the brochure as a PDF'
  }
  return file.size > BROCHURE_MAX_BYTES ? 'Brochure must be 25 MB or smaller' : undefined
}

function validateMaxLength(value: string, label: string, max: number): string | undefined {
  return value.trim().length > max
    ? `${label} must be at most ${String(max)} characters`
    : undefined
}

export function validateAmount(value: string, label: string): string | undefined {
  if (isBlank(value)) {
    return `${label} is required`
  }
  if (!DECIMAL_PATTERN.test(value.trim())) {
    return `${label} must be a number with up to 2 decimals`
  }
  return undefined
}

export function validatePercentage(value: string, label: string): string | undefined {
  const amountError = validateAmount(value, label)
  if (amountError !== undefined) {
    return amountError
  }
  return Number(value) > 100 ? `${label} cannot be more than 100` : undefined
}

// "Other Details" are optional in the design, so only the required sections are checked.
export function validateProductForm(values: ProductFormValues): FormErrors<ProductFormValues> {
  return {
    name:
      validateRequired(values.name, 'Product name') ??
      validateMaxLength(values.name, 'Product name', PRODUCT_NAME_MAX_LENGTH),
    category: validateRequired(values.category, 'Product category'),
    description:
      validateRequired(values.description, 'Product description') ??
      validateMaxLength(values.description, 'Product description', PRODUCT_DESCRIPTION_MAX_LENGTH),
    form: validateRequired(values.form, 'Form'),
    safety: validateRequired(values.safety, 'Safety'),
    uom: validateRequired(values.uom, 'UOM'),
    ratePerUnit: validateAmount(values.ratePerUnit, 'Rate per unit'),
    marketPrice: validateAmount(values.marketPrice, 'Market selling price'),
    profitMargin: validatePercentage(values.profitMargin, 'Sale profit margin'),
  }
}
