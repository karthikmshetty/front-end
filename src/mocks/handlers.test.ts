// Runs the real productService against the MSW handlers (msw/node), the same pair the browser
// uses when VITE_USE_MOCKS=true. Proves the fake API speaks the same contract as the real one.
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { EMPTY_PRODUCT_VALUES } from '../helpers/productOptions.ts'
import { addProduct, getProduct, listProducts, updateProduct } from '../services/productService.ts'
import { handlers } from './handlers.ts'
import { resetMockProducts } from './productDb.ts'

const server = setupServer(...handlers)

const STEEL = {
  ...EMPTY_PRODUCT_VALUES,
  name: 'Steel Rod',
  category: 'Construction',
  description: '12 mm TMT bar',
  ratePerUnit: '700',
  marketPrice: '850',
  uom: 'Per Unit',
}

describe('mock products API', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })
  afterAll(() => {
    server.close()
  })
  beforeEach(() => {
    vi.stubEnv('VITE_PRODUCTS_API_URL', 'https://products.test')
    resetMockProducts()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('lists and searches products', async () => {
    expect(await listProducts()).toMatchObject({ error: false, data: { total: 3 } })
    expect(await listProducts('paint')).toMatchObject({
      error: false,
      data: { total: 1, products: [{ name: 'Exterior Emulsion Paint' }] },
    })
  })

  it('uploads an image, adds the product and lists it first', async () => {
    const image = new File(['png'], 'rod.png', { type: 'image/png' })

    const added = await addProduct(STEEL, { images: [image], brochure: null })

    expect(added).toMatchObject({
      error: false,
      data: { name: 'Steel Rod', ratePerUnit: 700, marketSellingPrice: 850, uom: 'Per Unit' },
    })
    const list = await listProducts()
    expect(list).toMatchObject({ error: false, data: { total: 4 } })
    expect(list.error ? undefined : list.data.products[0]?.name).toBe('Steel Rod')
  })

  it('rejects a product without a category, like the real API', async () => {
    expect(await addProduct({ ...STEEL, category: '' }, { images: [], brochure: null })).toEqual({
      error: true,
      status: 400,
      message: 'Category is required',
    })
  })

  it('gets, updates and 404s like the real API', async () => {
    const loaded = await getProduct('mock-cement')
    expect(loaded).toMatchObject({ error: false, data: { name: 'RCC Cement', form: 'Powder' } })
    if (loaded.error) {
      return
    }

    const updated = await updateProduct(
      loaded.data,
      { ...STEEL, name: 'RCC Cement 53 Grade' },
      { images: [], brochure: null },
    )

    expect(updated).toMatchObject({ error: false, data: { name: 'RCC Cement 53 Grade' } })
    expect(await getProduct('mock-cement')).toMatchObject({ data: { name: 'RCC Cement 53 Grade' } })
    expect(await getProduct('nope')).toEqual({
      error: true,
      status: 404,
      message: 'Product not found',
    })
  })
})
