import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EMPTY_PRODUCT_VALUES } from '../helpers/productOptions.ts'
import {
  addProduct,
  buildProductFormData,
  getProduct,
  toProductFormValues,
  updateProduct,
} from './productService.ts'

const mockFetch = vi.fn<typeof fetch>()

const NO_FILES = { images: [], brochure: null }

const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const VALUES = {
  ...EMPTY_PRODUCT_VALUES,
  name: ' RCC Cement ',
  category: 'Construction',
  description: 'Ordinary Portland cement',
  ecoFriendly: true,
  marketPrice: '300',
}

describe('productService', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    mockFetch.mockReset()
  })

  describe('buildProductFormData', () => {
    it('maps the form fields to the API names and adds the files', () => {
      const front = new File(['img'], 'front.png', { type: 'image/png' })
      const back = new File(['img'], 'back.png', { type: 'image/png' })
      const brochure = new File(['pdf'], 'brochure.pdf', { type: 'application/pdf' })

      const data = buildProductFormData(VALUES, { images: [front, back], brochure })

      expect(data.get('title')).toBe('RCC Cement')
      expect(data.get('price')).toBe('300')
      expect(data.get('ecoFriendly')).toBe('true')
      expect(data.getAll('images')).toEqual([front, back])
      expect(data.get('brochure')).toBe(brochure)
    })

    it('leaves the files out when none were picked', () => {
      const data = buildProductFormData(VALUES, NO_FILES)

      expect(data.has('images')).toBe(false)
      expect(data.has('brochure')).toBe(false)
    })
  })

  describe('addProduct', () => {
    it('posts FormData without setting Content-Type', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ id: 195, title: 'RCC Cement' }, 201))
      const data = buildProductFormData(VALUES, NO_FILES)

      const result = await addProduct(data)

      expect(result).toEqual({ error: false, data: { id: 195, title: 'RCC Cement' } })
      expect(mockFetch).toHaveBeenCalledWith('https://api.test/products/add', {
        method: 'POST',
        body: data,
      })
    })
  })

  describe('updateProduct', () => {
    it('puts FormData to /products/:id', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ id: 1 }, 200))
      const data = buildProductFormData(VALUES, NO_FILES)

      await updateProduct(1, data)

      expect(mockFetch).toHaveBeenCalledWith('https://api.test/products/1', {
        method: 'PUT',
        body: data,
      })
    })
  })

  describe('getProduct', () => {
    it('returns the product', async () => {
      const product = { id: 1, title: 'Mascara', description: 'd', category: 'beauty', price: 9.99 }
      mockFetch.mockResolvedValue(jsonResponse(product, 200))

      expect(await getProduct(1)).toEqual({ error: false, data: product })
    })

    it('returns status 404 for an unknown id', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ message: "Product with id '99999' not found" }, 404),
      )

      expect(await getProduct(99999)).toEqual({
        error: true,
        status: 404,
        message: "Product with id '99999' not found",
      })
    })
  })

  describe('toProductFormValues', () => {
    it('fills the fields DummyJSON has and leaves the rest empty', () => {
      const values = toProductFormValues({
        id: 1,
        title: 'Mascara',
        description: 'Volumising',
        category: 'beauty',
        price: 9.99,
      })

      expect(values).toEqual({
        ...EMPTY_PRODUCT_VALUES,
        name: 'Mascara',
        category: 'beauty',
        description: 'Volumising',
        marketPrice: '9.99',
      })
    })
  })
})
