import { describe, expect, it } from 'vitest'

import { EMPTY_PRODUCT_VALUES } from './productOptions.ts'
import {
  BROCHURE_MAX_BYTES,
  hasErrors,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_NAME_MAX_LENGTH,
  validateAmount,
  validateBrochureFile,
  validateConfirmPassword,
  validateEmail,
  validateImageFile,
  validateLoginForm,
  validateNewPassword,
  validatePercentage,
  validateProductForm,
  validateRequired,
  validateSignupForm,
  validateUsername,
} from './validators.ts'

describe('validateRequired', () => {
  it('rejects empty and whitespace-only values', () => {
    expect(validateRequired('', 'Name')).toBe('Name is required')
    expect(validateRequired('   ', 'Name')).toBe('Name is required')
  })

  it('accepts a value', () => {
    expect(validateRequired('Asha', 'Name')).toBeUndefined()
  })
})

describe('validateUsername', () => {
  it('requires a username of at least 3 characters', () => {
    expect(validateUsername('')).toBe('Username is required')
    expect(validateUsername('ab')).toBe('Username must be at least 3 characters')
    expect(validateUsername('abc')).toBeUndefined()
  })
})

describe('validateEmail', () => {
  it('requires a valid email address', () => {
    expect(validateEmail('')).toBe('Email is required')
    expect(validateEmail('asha')).toBe('Enter a valid email address')
    expect(validateEmail('asha@example')).toBe('Enter a valid email address')
    expect(validateEmail('asha@example.com')).toBeUndefined()
  })
})

describe('validateNewPassword', () => {
  it('requires at least 8 characters', () => {
    expect(validateNewPassword('')).toBe('Password is required')
    expect(validateNewPassword('1234567')).toBe('Password must be at least 8 characters')
    expect(validateNewPassword('12345678')).toBeUndefined()
  })
})

describe('validateConfirmPassword', () => {
  it('requires a matching confirmation', () => {
    expect(validateConfirmPassword('secret123', '')).toBe('Please confirm your password')
    expect(validateConfirmPassword('secret123', 'secret124')).toBe('Passwords do not match')
    expect(validateConfirmPassword('secret123', 'secret123')).toBeUndefined()
  })
})

describe('validateLoginForm', () => {
  it('only checks that the password is present', () => {
    const errors = validateLoginForm({ username: 'asha', password: 'x' })

    expect(errors.password).toBeUndefined()
    expect(hasErrors(errors)).toBe(false)
  })

  it('reports every empty field', () => {
    const errors = validateLoginForm({ username: '', password: '' })

    expect(errors).toEqual({
      username: 'Username is required',
      password: 'Password is required',
    })
  })
})

describe('validateSignupForm', () => {
  it('passes with valid values', () => {
    const errors = validateSignupForm({
      firstName: 'Asha',
      lastName: 'Rao',
      email: 'asha@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    })

    expect(hasErrors(errors)).toBe(false)
  })

  it('reports each invalid field', () => {
    const errors = validateSignupForm({
      firstName: '',
      lastName: ' ',
      email: 'not-an-email',
      password: 'short',
      confirmPassword: 'other',
    })

    expect(errors).toEqual({
      firstName: 'First name is required',
      lastName: 'Last name is required',
      email: 'Enter a valid email address',
      password: 'Password must be at least 8 characters',
      confirmPassword: 'Passwords do not match',
    })
  })
})

describe('validateImageFile', () => {
  const file = (type: string, size: number): Pick<File, 'type' | 'size'> => ({ type, size })

  it('accepts JPG, PNG and WebP images', () => {
    expect(validateImageFile(file('image/jpeg', 1000))).toBeUndefined()
    expect(validateImageFile(file('image/png', 1000))).toBeUndefined()
    expect(validateImageFile(file('image/webp', 1000))).toBeUndefined()
  })

  it('rejects other file types', () => {
    expect(validateImageFile(file('image/gif', 1000))).toBe('Upload a JPG, PNG or WebP image')
    expect(validateImageFile(file('application/pdf', 1000))).toBe('Upload a JPG, PNG or WebP image')
  })

  it('allows exactly 2 MB and rejects anything larger', () => {
    expect(validateImageFile(file('image/png', PRODUCT_IMAGE_MAX_BYTES))).toBeUndefined()
    expect(validateImageFile(file('image/png', PRODUCT_IMAGE_MAX_BYTES + 1))).toBe(
      'Image must be 2 MB or smaller',
    )
  })
})

describe('validateAmount and validatePercentage', () => {
  it('requires a number with up to 2 decimals', () => {
    expect(validateAmount('', 'Rate')).toBe('Rate is required')
    expect(validateAmount('abc', 'Rate')).toBe('Rate must be a number with up to 2 decimals')
    expect(validateAmount('-5', 'Rate')).toBe('Rate must be a number with up to 2 decimals')
    expect(validateAmount('1.999', 'Rate')).toBe('Rate must be a number with up to 2 decimals')
    expect(validateAmount('200', 'Rate')).toBeUndefined()
    expect(validateAmount('199.99', 'Rate')).toBeUndefined()
  })

  it('caps percentages at 100', () => {
    expect(validatePercentage('100', 'Margin')).toBeUndefined()
    expect(validatePercentage('100.5', 'Margin')).toBe('Margin cannot be more than 100')
  })
})

describe('validateProductForm', () => {
  it('requires every field outside "Other Details"', () => {
    const errors = validateProductForm(EMPTY_PRODUCT_VALUES)

    expect(errors).toEqual({
      name: 'Product name is required',
      category: 'Product category is required',
      description: 'Product description is required',
      form: 'Form is required',
      safety: 'Safety is required',
      uom: 'UOM is required',
      ratePerUnit: 'Rate per unit is required',
      marketPrice: 'Market selling price is required',
      profitMargin: 'Sale profit margin is required',
    })
  })

  it('passes without the optional details', () => {
    const errors = validateProductForm({
      ...EMPTY_PRODUCT_VALUES,
      name: 'RCC Cement',
      category: 'Construction',
      description: 'Ordinary Portland cement',
      form: 'Powder',
      safety: 'Non-hazardous',
      uom: 'Per Bag',
      ratePerUnit: '200',
      marketPrice: '300',
      profitMargin: '33.33',
    })

    expect(hasErrors(errors)).toBe(false)
  })
})

describe('product text limits from the API', () => {
  it('rejects a name over 100 or a description over 1000 characters', () => {
    const errors = validateProductForm({
      ...EMPTY_PRODUCT_VALUES,
      name: 'x'.repeat(PRODUCT_NAME_MAX_LENGTH + 1),
      description: 'y'.repeat(PRODUCT_DESCRIPTION_MAX_LENGTH + 1),
    })

    expect(errors.name).toBe('Product name must be at most 100 characters')
    expect(errors.description).toBe('Product description must be at most 1000 characters')
  })
})

describe('validateBrochureFile', () => {
  it('accepts a PDF up to 25 MB only', () => {
    expect(
      validateBrochureFile({ type: 'application/pdf', size: BROCHURE_MAX_BYTES }),
    ).toBeUndefined()
    expect(validateBrochureFile({ type: 'application/pdf', size: BROCHURE_MAX_BYTES + 1 })).toBe(
      'Brochure must be 25 MB or smaller',
    )
    expect(validateBrochureFile({ type: 'image/png', size: 100 })).toBe(
      'Upload the brochure as a PDF',
    )
  })
})
