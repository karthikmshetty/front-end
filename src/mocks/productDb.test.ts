import { beforeEach, describe, expect, it } from 'vitest'

import {
  createMockProduct,
  findMockProduct,
  listMockProducts,
  MOCK_PRODUCTS_KEY,
  resetMockProducts,
  updateMockProduct,
} from './productDb.ts'

const fields = (entries: Record<string, string>): Map<string, string> =>
  new Map(Object.entries(entries))

describe('mock product database', () => {
  beforeEach(() => {
    resetMockProducts()
  })

  it('starts with the seed products', () => {
    expect(listMockProducts().map((product) => product.title)).toEqual([
      'RCC Cement',
      'Copper Wire 2.5 mm',
      'Exterior Emulsion Paint',
    ])
  })

  it('searches title, category and description, ignoring case', () => {
    expect(listMockProducts('PAINTS').map((product) => product.id)).toEqual([3])
    expect(listMockProducts('coil').map((product) => product.id)).toEqual([2])
    expect(listMockProducts('nothing like this')).toEqual([])
  })

  it('creates a product with the next id and saves it in localStorage', () => {
    const product = createMockProduct(
      fields({ title: 'Steel Rod', price: '850', ecoFriendly: 'true' }),
      'data:image/jpeg;base64,abc',
    )

    expect(product).toMatchObject({ id: 4, title: 'Steel Rod', price: 850, ecoFriendly: true })
    expect(product.thumbnail).toBe('data:image/jpeg;base64,abc')
    expect(localStorage.getItem(MOCK_PRODUCTS_KEY)).toContain('Steel Rod')
  })

  it('updates a product and keeps its thumbnail when no new image is sent', () => {
    createMockProduct(fields({ title: 'Steel Rod' }), 'data:old')

    const updated = updateMockProduct(4, fields({ title: 'Steel Rod 12 mm' }), undefined)

    expect(updated).toMatchObject({ id: 4, title: 'Steel Rod 12 mm', thumbnail: 'data:old' })
    expect(findMockProduct(4)?.title).toBe('Steel Rod 12 mm')
  })

  it('returns undefined when updating an unknown id', () => {
    expect(updateMockProduct(999, fields({ title: 'x' }), undefined)).toBeUndefined()
  })
})
