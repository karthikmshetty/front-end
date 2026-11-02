import { beforeEach, describe, expect, it } from 'vitest'

import {
  createMockProduct,
  listMockProducts,
  MOCK_PRODUCTS_KEY,
  mockImageSrc,
  resetMockProducts,
  saveMockImage,
} from './productDb.ts'

const STEEL = {
  name: 'Steel Rod',
  category: 'Construction',
  rate_per_unit: 700,
  eco_friendly: false,
  handle_with_care: false,
  images: [],
}

describe('mock product database', () => {
  beforeEach(() => {
    resetMockProducts()
  })

  it('starts with the seed products, newest first', () => {
    expect(listMockProducts().map((product) => product.name)).toEqual([
      'Exterior Emulsion Paint',
      'Copper Wire 2.5 mm',
      'RCC Cement',
    ])
  })

  it('searches the name, ignoring case', () => {
    expect(listMockProducts('PAINT').map((product) => product.id)).toEqual(['mock-paint'])
    expect(listMockProducts('nothing like this')).toEqual([])
  })

  it('creates a product with a new id and saves it in localStorage', () => {
    const product = createMockProduct(STEEL)

    expect(product.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(listMockProducts()[0]?.name).toBe('Steel Rod')
    expect(localStorage.getItem(MOCK_PRODUCTS_KEY)).toContain('Steel Rod')
  })

  it('serves uploaded images as stored data URLs', () => {
    saveMockImage('https://mock-s3.local/products/a.png', 'data:image/jpeg;base64,abc')

    expect(mockImageSrc('https://mock-s3.local/products/a.png')).toBe('data:image/jpeg;base64,abc')
    expect(mockImageSrc('https://example.com/b.png')).toBe('https://example.com/b.png')
  })
})
