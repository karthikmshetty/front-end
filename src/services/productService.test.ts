import { describe, expect, it } from 'vitest'

import { EMPTY_PRODUCT_VALUES } from '../helpers/productOptions.ts'
import {
  API_PRODUCT,
  findRequest,
  IMAGE_UPLOAD_ROUTES,
  installApiMocks,
  jsonResponse,
  mockApi,
  mockFetch,
  productList,
  requestJson,
  S3_FILE_URL,
} from '../testUtils.ts'
import type { Product } from './productService.ts'
import {
  addProduct,
  getProduct,
  listProducts,
  toProductBody,
  toProductFormValues,
  updateProduct,
} from './productService.ts'

const VALUES = {
  ...EMPTY_PRODUCT_VALUES,
  name: ' RCC Cement ',
  category: 'Construction',
  description: 'Ordinary Portland cement',
  ratePerUnit: '200',
  marketPrice: '300',
  profitMargin: '33',
  uom: 'Per Bag',
  ecoFriendly: true,
}

const PNG = new File(['png'], 'cement.png', { type: 'image/png' })
const PDF = new File(['pdf'], 'brochure.pdf', { type: 'application/pdf' })
const IMAGES = { images: [PNG], brochure: null }
const NO_FILES = { images: [], brochure: null }

describe('productService', () => {
  installApiMocks()

  describe('listProducts', () => {
    it('reads { data, total_count } and maps snake_case to the app shape', async () => {
      mockApi({ 'GET /products?page_size=100': () => jsonResponse(productList([API_PRODUCT])) })

      expect(await listProducts()).toEqual({
        error: false,
        data: {
          total: 1,
          products: [
            {
              id: API_PRODUCT.id,
              name: 'RCC Cement',
              category: 'Construction',
              description: 'Ordinary Portland cement',
              ratePerUnit: 200,
              marketSellingPrice: 300,
              uom: 'Per Bag',
              ecoFriendly: false,
              handleWithCare: false,
              images: [],
            },
          ],
        },
      })
    })

    it('sends the search text as ?search=', async () => {
      mockApi({
        'GET /products?page_size=100&search=rcc+cement': () => jsonResponse(productList([])),
      })

      expect(await listProducts('  rcc cement ')).toEqual({
        error: false,
        data: { products: [], total: 0 },
      })
    })

    it('passes on the API error message', async () => {
      mockApi({
        'GET /products?page_size=100': () =>
          jsonResponse({ message: 'Page size must be between 1 and 100' }, 400),
      })

      expect(await listProducts()).toEqual({
        error: true,
        status: 400,
        message: 'Page size must be between 1 and 100',
      })
    })
  })

  describe('toProductBody', () => {
    it('converts the form to the API fields and leaves out empty optional ones', () => {
      expect(toProductBody(VALUES, { images: [S3_FILE_URL] })).toEqual({
        name: 'RCC Cement',
        category: 'Construction',
        description: 'Ordinary Portland cement',
        rate_per_unit: 200,
        market_selling_price: 300,
        sale_profit_margin: 33,
        uom: 'Per Bag',
        eco_friendly: true,
        handle_with_care: false,
        images: [S3_FILE_URL],
      })
    })
  })

  describe('addProduct', () => {
    it('uploads each image to S3, then posts the product as JSON with the image URLs', async () => {
      mockApi({
        ...IMAGE_UPLOAD_ROUTES,
        'POST /products': () =>
          jsonResponse(
            {
              message: 'Product added successfully',
              data: { ...API_PRODUCT, images: [S3_FILE_URL] },
            },
            201,
          ),
      })

      const result = await addProduct(VALUES, IMAGES)

      expect(result).toMatchObject({
        error: false,
        data: { name: 'RCC Cement', images: [S3_FILE_URL] },
      })
      expect(requestJson('POST /products/upload-url')).toEqual({
        content_type: 'image/png',
      })
      const upload = mockFetch.mock.calls.find(([, init]) => init?.method === 'PUT')?.[1]
      expect(upload).toEqual({ method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: PNG })
      const created = findRequest('POST /products')
      expect(created?.headers).toEqual({ 'Content-Type': 'application/json' })
      expect(requestJson('POST /products')).toMatchObject({ images: [S3_FILE_URL] })
    })

    it('does not create the product when an image upload fails', async () => {
      mockApi({
        ...IMAGE_UPLOAD_ROUTES,
        'PUT https://s3.test/upload/products/image.png': () => new Response(null, { status: 403 }),
      })

      expect(await addProduct(VALUES, IMAGES)).toEqual({
        error: true,
        status: 403,
        message: 'Could not upload cement.png.',
      })
      expect(findRequest('POST /products')).toBeUndefined()
    })

    it('passes on validation messages from the API', async () => {
      mockApi({ 'POST /products': () => jsonResponse({ message: 'Category is required' }, 400) })

      expect(await addProduct({ ...VALUES, category: '' }, NO_FILES)).toEqual({
        error: true,
        status: 400,
        message: 'Category is required',
      })
    })
  })

  describe('getProduct', () => {
    it('loads one product and maps every field for the edit form', async () => {
      mockApi({
        [`GET /products/${API_PRODUCT.id}`]: () =>
          jsonResponse({
            message: 'Product retrieved successfully',
            data: {
              ...API_PRODUCT,
              form: 'Powder',
              sale_profit_margin: 33,
              brochure: 'https://s3.test/b.pdf',
            },
          }),
      })

      const result = await getProduct(API_PRODUCT.id)

      expect(result).toMatchObject({
        error: false,
        data: { form: 'Powder', brochure: 'https://s3.test/b.pdf' },
      })
      expect(result.error ? undefined : toProductFormValues(result.data)).toMatchObject({
        name: 'RCC Cement',
        ratePerUnit: '200',
        marketPrice: '300',
        profitMargin: '33',
        form: 'Powder',
      })
    })

    it('returns 404 for an unknown id', async () => {
      mockApi({ 'GET /products/nope': () => jsonResponse({ message: 'Product not found' }, 404) })

      expect(await getProduct('nope')).toEqual({
        error: true,
        status: 404,
        message: 'Product not found',
      })
    })
  })

  describe('updateProduct', () => {
    const SAVED: Product = {
      id: API_PRODUCT.id,
      name: 'RCC Cement',
      category: 'Construction',
      description: '',
      ratePerUnit: 200,
      ecoFriendly: false,
      handleWithCare: false,
      images: ['https://s3.test/old.png'],
      brochure: 'https://s3.test/old.pdf',
    }

    it('keeps the current images and brochure when no new files were picked', async () => {
      mockApi({
        [`PUT /products/${API_PRODUCT.id}`]: () =>
          jsonResponse({ message: 'Product updated successfully', data: API_PRODUCT }),
      })

      const result = await updateProduct(SAVED, VALUES, NO_FILES)

      expect(result.error).toBe(false)
      expect(findRequest(`PUT /products/${API_PRODUCT.id}`)?.headers).toEqual({
        'Content-Type': 'application/json',
      })
      expect(requestJson(`PUT /products/${API_PRODUCT.id}`)).toMatchObject({
        name: 'RCC Cement',
        images: ['https://s3.test/old.png'],
        brochure: 'https://s3.test/old.pdf',
      })
    })

    it('uploads a new brochure as a PDF and sends its URL', async () => {
      mockApi({
        ...IMAGE_UPLOAD_ROUTES,
        [`PUT /products/${API_PRODUCT.id}`]: () =>
          jsonResponse({ message: 'Product updated successfully', data: API_PRODUCT }),
      })

      await updateProduct(SAVED, VALUES, { images: [], brochure: PDF })

      expect(requestJson('POST /products/upload-url')).toEqual({ content_type: 'application/pdf' })
      expect(requestJson(`PUT /products/${API_PRODUCT.id}`)).toMatchObject({
        images: ['https://s3.test/old.png'],
        brochure: S3_FILE_URL,
      })
    })
  })
})
