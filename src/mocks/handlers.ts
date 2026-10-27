// MSW request handlers: a fake back-end with the same URLs as DummyJSON's product API.
// "*/" matches any origin, so they work with whatever VITE_API_BASE_URL is set to.
import { delay, http, HttpResponse } from 'msw'

import {
  createMockProduct,
  findMockProduct,
  listMockProducts,
  updateMockProduct,
} from './productDb.ts'

const THUMBNAIL_SIZE = 320

// localStorage holds about 5 MB, so only a small JPEG of the first image is kept.
async function makeThumbnail(image: File | undefined): Promise<string | undefined> {
  if (image === undefined) {
    return undefined
  }
  try {
    const bitmap = await createImageBitmap(image)
    const scale = Math.min(1, THUMBNAIL_SIZE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.8)
  } catch {
    // Not a decodable image (or no canvas, e.g. in tests): save the product without one.
    return undefined
  }
}

async function readForm(request: Request): Promise<{
  fields: Map<string, string>
  thumbnail: string | undefined
}> {
  const form = await request.formData()
  const fields = new Map<string, string>()
  let firstImage: File | undefined
  form.forEach((value, key) => {
    if (typeof value === 'string') {
      fields.set(key, value)
    } else if (key === 'images') {
      firstImage ??= value
    }
  })
  return { fields, thumbnail: await makeThumbnail(firstImage) }
}

const notFound = (id: string): Response =>
  HttpResponse.json({ message: `Product with id '${id}' not found` }, { status: 404 })

const listResponse = (search: string): Response => {
  const products = listMockProducts(search)
  return HttpResponse.json({ products, total: products.length, skip: 0, limit: products.length })
}

export const handlers = [
  http.get('*/products', async () => {
    await delay()
    return listResponse('')
  }),

  // Registered before "/products/:id" so "search" is not read as an id.
  http.get('*/products/search', async ({ request }) => {
    await delay()
    return listResponse(new URL(request.url).searchParams.get('q') ?? '')
  }),

  http.get('*/products/:id', async ({ params }) => {
    await delay()
    const id = String(params['id'])
    const product = findMockProduct(Number(id))
    return product === undefined ? notFound(id) : HttpResponse.json(product)
  }),

  http.post('*/products/add', async ({ request }) => {
    await delay()
    const { fields, thumbnail } = await readForm(request)
    return HttpResponse.json(createMockProduct(fields, thumbnail), { status: 201 })
  }),

  http.put('*/products/:id', async ({ params, request }) => {
    await delay()
    const id = String(params['id'])
    const { fields, thumbnail } = await readForm(request)
    const product = updateMockProduct(Number(id), fields, thumbnail)
    return product === undefined ? notFound(id) : HttpResponse.json(product)
  }),
]
