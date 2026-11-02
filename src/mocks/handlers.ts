// MSW request handlers: a fake copy of the products API (back-end: products-swagger.yaml), plus a
// fake S3 for image and brochure uploads. "*/" matches any origin, so they follow VITE_PRODUCTS_API_URL.
import { delay, http, HttpResponse } from 'msw'

import type { MockProduct } from './productDb.ts'
import {
  createMockProduct,
  deleteMockProduct,
  findMockProduct,
  listMockProducts,
  mockImageSrc,
  replaceMockProduct,
  saveMockImage,
} from './productDb.ts'

const MOCK_S3 = 'https://mock-s3.local'
const THUMBNAIL_SIZE = 320
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

// localStorage holds about 5 MB, so uploads are kept as small JPEG thumbnails.
async function makeThumbnail(image: Blob): Promise<string | undefined> {
  try {
    const bitmap = await createImageBitmap(image)
    const scale = Math.min(1, THUMBNAIL_SIZE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.8)
  } catch {
    // Not a decodable image (or no canvas, e.g. in tests): keep the product without a picture.
    return undefined
  }
}

const badRequest = (message: string): Response => HttpResponse.json({ message }, { status: 400 })

const text = (body: Record<string, unknown>, key: string): string | undefined => {
  const value = body[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

const amount = (body: Record<string, unknown>, key: string): number | undefined => {
  const value = body[key]
  return typeof value === 'number' ? value : undefined
}

// The checks the real API makes (validators.ts in the back-end), with the same messages.
function toMockProduct(
  body: Record<string, unknown>,
): Omit<MockProduct, 'id' | 'created_at' | 'updated_at'> | string {
  const name = text(body, 'name')
  const category = text(body, 'category')
  const rate = amount(body, 'rate_per_unit')
  if (name === undefined) {
    return 'Product name is required'
  }
  if (category === undefined) {
    return 'Category is required'
  }
  if (rate === undefined) {
    return 'Rate per unit is required'
  }
  const optional = (key: string, value: string | number | undefined): Record<string, unknown> =>
    value === undefined ? {} : { [key]: value }
  return {
    name,
    category,
    rate_per_unit: rate,
    eco_friendly: body['eco_friendly'] === true,
    handle_with_care: body['handle_with_care'] === true,
    images: Array.isArray(body['images'])
      ? body['images'].filter((url) => typeof url === 'string')
      : [],
    ...optional('description', text(body, 'description')),
    ...optional('form', text(body, 'form')),
    ...optional('safety', text(body, 'safety')),
    ...optional('uom', text(body, 'uom')),
    ...optional('product_type', text(body, 'product_type')),
    ...optional('product_size', text(body, 'product_size')),
    ...optional('product_variant', text(body, 'product_variant')),
    ...optional('product_color', text(body, 'product_color')),
    ...optional('market_selling_price', amount(body, 'market_selling_price')),
    ...optional('sale_profit_margin', amount(body, 'sale_profit_margin')),
    ...optional('brochure', text(body, 'brochure')),
  }
}

const notFound = (): Response =>
  HttpResponse.json({ message: 'Product not found' }, { status: 404 })

// Validates a POST/PUT body like the real API; a string result is the 400 message.
async function readProductBody(
  request: Request,
): Promise<Omit<MockProduct, 'id' | 'created_at' | 'updated_at'> | string> {
  const body: unknown = await request.json().catch(() => null)
  if (typeof body !== 'object' || body === null) {
    return 'Request body must be valid JSON'
  }
  return toMockProduct(body as Record<string, unknown>)
}

// Shows stored thumbnails instead of the fake S3 URLs.
const withImageSrc = (product: MockProduct): MockProduct => ({
  ...product,
  images: product.images.map(mockImageSrc),
})

export const handlers = [
  http.get('*/products', async ({ request }) => {
    await delay()
    const params = new URL(request.url).searchParams
    const pageNumber = Number(params.get('page_number') ?? '1')
    const pageSize = Number(params.get('page_size') ?? '10')
    const products = listMockProducts(params.get('search') ?? '')
    const start = (pageNumber - 1) * pageSize
    return HttpResponse.json({
      message: products.length === 0 ? 'No results found' : 'Products retrieved successfully',
      data: products.slice(start, start + pageSize).map(withImageSrc),
      total_count: products.length,
    })
  }),

  http.post('*/products/upload-url', async ({ request }) => {
    await delay()
    const body: unknown = await request.json().catch(() => null)
    const contentType =
      typeof body === 'object' && body !== null && 'content_type' in body
        ? String(body.content_type)
        : ''
    const extension = EXTENSIONS[contentType]
    if (extension === undefined) {
      return badRequest('Content type must be image/jpeg, image/png, image/webp or application/pdf')
    }
    const folder = extension === 'pdf' ? 'products/brochures' : 'products'
    const key = `${folder}/${crypto.randomUUID()}.${extension}`
    return HttpResponse.json({
      message: 'Upload URL created successfully',
      data: {
        upload_url: `${MOCK_S3}/upload/${key}`,
        file_url: `${MOCK_S3}/${key}`,
        key,
        expires_in: 300,
      },
    })
  }),

  // The browser PUTs the file here instead of to S3. Brochures are accepted but not stored.
  http.put(
    `${MOCK_S3}/upload/products/brochures/:file`,
    () => new HttpResponse(null, { status: 200 }),
  ),

  http.put(`${MOCK_S3}/upload/products/:file`, async ({ params, request }) => {
    const thumbnail = await makeThumbnail(await request.blob())
    if (thumbnail !== undefined) {
      saveMockImage(`${MOCK_S3}/products/${String(params['file'])}`, thumbnail)
    }
    return new HttpResponse(null, { status: 200 })
  }),

  http.post('*/products', async ({ request }) => {
    await delay()
    const fields = await readProductBody(request)
    if (typeof fields === 'string') {
      return badRequest(fields)
    }
    const product = createMockProduct(fields)
    return HttpResponse.json(
      { message: 'Product added successfully', data: withImageSrc(product) },
      { status: 201 },
    )
  }),

  http.get('*/products/:id', async ({ params }) => {
    await delay()
    const product = findMockProduct(String(params['id']))
    return product === undefined
      ? notFound()
      : HttpResponse.json({
          message: 'Product retrieved successfully',
          data: withImageSrc(product),
        })
  }),

  http.put('*/products/:id', async ({ params, request }) => {
    await delay()
    const fields = await readProductBody(request)
    if (typeof fields === 'string') {
      return badRequest(fields)
    }
    const product = replaceMockProduct(String(params['id']), fields)
    return product === undefined
      ? notFound()
      : HttpResponse.json({ message: 'Product updated successfully', data: withImageSrc(product) })
  }),

  http.delete('*/products/:id', async ({ params }) => {
    await delay()
    return deleteMockProduct(String(params['id']))
      ? HttpResponse.json({ message: 'Product deleted successfully' })
      : notFound()
  }),
]
