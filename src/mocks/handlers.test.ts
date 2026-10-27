// Runs the real productService against the MSW handlers (msw/node), the same pair the browser
// uses in development.
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { EMPTY_PRODUCT_VALUES } from '../helpers/productOptions.ts'
import {
  addProduct,
  buildProductFormData,
  getProduct,
  listProducts,
  updateProduct,
} from '../services/productService.ts'
import { handlers } from './handlers.ts'
import { resetMockProducts } from './productDb.ts'

const server = setupServer(...handlers)

const CEMENT = {
  ...EMPTY_PRODUCT_VALUES,
  name: 'Steel Rod',
  category: 'Construction',
  description: '12 mm TMT bar',
  form: 'Solid',
  uom: 'Per Unit',
  marketPrice: '850',
}

describe('mock product API', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })
  afterAll(() => {
    server.close()
  })
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
    resetMockProducts()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('lists and searches products', async () => {
    const all = await listProducts()
    const paints = await listProducts('paint')

    expect(all).toMatchObject({ error: false, data: { total: 3 } })
    expect(paints).toMatchObject({
      error: false,
      data: { total: 1, products: [{ title: 'Exterior Emulsion Paint' }] },
    })
  })

  it('adds a product from FormData, then lists and loads it', async () => {
    const image = new File(['png'], 'rod.png', { type: 'image/png' })
    const added = await addProduct(
      buildProductFormData(CEMENT, { images: [image], brochure: null }),
    )

    expect(added).toEqual({ error: false, data: expect.objectContaining({ id: 4 }) as unknown })
    expect(await getProduct(4)).toMatchObject({
      error: false,
      data: { title: 'Steel Rod', price: 850, form: 'Solid', uom: 'Per Unit' },
    })
    expect(await listProducts()).toMatchObject({ data: { total: 4 } })
  })

  it('updates a product', async () => {
    const result = await updateProduct(
      1,
      buildProductFormData(
        { ...CEMENT, name: 'RCC Cement 53 Grade' },
        { images: [], brochure: null },
      ),
    )

    expect(result.error).toBe(false)
    expect(await getProduct(1)).toMatchObject({ data: { title: 'RCC Cement 53 Grade' } })
  })

  it('returns 404 for an unknown product', async () => {
    expect(await getProduct(999)).toEqual({
      error: true,
      status: 404,
      message: "Product with id '999' not found",
    })
  })
})
