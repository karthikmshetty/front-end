// Pure validation rules: each returns an error message, or undefined when the value is valid.

export const USERNAME_MIN_LENGTH = 3
export const PASSWORD_MIN_LENGTH = 8

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type FormErrors<T> = Partial<Record<keyof T, string | undefined>>

export interface LoginValues {
  username: string
  password: string
}

export interface SignupValues {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
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

export function validateEmail(value: string): string | undefined {
  if (isBlank(value)) {
    return 'Email is required'
  }
  if (!EMAIL_PATTERN.test(value.trim())) {
    return 'Enter a valid email address'
  }
  return undefined
}

export function validateNewPassword(value: string): string | undefined {
  if (value === '') {
    return 'Password is required'
  }
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${String(PASSWORD_MIN_LENGTH)} characters`
  }
  return undefined
}

export function validateConfirmPassword(password: string, confirm: string): string | undefined {
  if (confirm === '') {
    return 'Please confirm your password'
  }
  if (confirm !== password) {
    return 'Passwords do not match'
  }
  return undefined
}

export function validateLoginForm(values: LoginValues): FormErrors<LoginValues> {
  return {
    username: validateUsername(values.username),
    // Login only checks presence: length rules belong to signup, not to existing passwords.
    password: values.password === '' ? 'Password is required' : undefined,
  }
}

export function validateSignupForm(values: SignupValues): FormErrors<SignupValues> {
  return {
    firstName: validateRequired(values.firstName, 'First name'),
    lastName: validateRequired(values.lastName, 'Last name'),
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
    confirmPassword: validateConfirmPassword(values.password, values.confirmPassword),
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

// The files picked in the product form, sent with the fields on submit.
export interface ProductFiles {
  images: readonly File[]
  brochure: File | null
}

export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024
// The design has four thumbnail slots under the main image.
export const PRODUCT_IMAGE_LIMIT = 4
// "Upload Product Brochure (optional)": the design only sets the size limit, not the file type.
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

export function validateBrochureFile(file: Pick<File, 'size'>): string | undefined {
  return file.size > BROCHURE_MAX_BYTES ? 'Brochure must be 25 MB or smaller' : undefined
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
    name: validateRequired(values.name, 'Product name'),
    category: validateRequired(values.category, 'Product category'),
    description: validateRequired(values.description, 'Product description'),
    form: validateRequired(values.form, 'Form'),
    safety: validateRequired(values.safety, 'Safety'),
    uom: validateRequired(values.uom, 'UOM'),
    ratePerUnit: validateAmount(values.ratePerUnit, 'Rate per unit'),
    marketPrice: validateAmount(values.marketPrice, 'Market selling price'),
    profitMargin: validatePercentage(values.profitMargin, 'Sale profit margin'),
  }
}
