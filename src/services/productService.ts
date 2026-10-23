import { EMPTY_PRODUCT_VALUES } from '../helpers/productOptions.ts'
import type { ProductFiles, ProductFormValues } from '../helpers/validators.ts'
import type { ApiResult } from '../shared/apiClient.ts'
import { isRecord, request, UNEXPECTED_RESPONSE } from '../shared/apiClient.ts'

// The DummyJSON fields we use. Add/update echo back only the fields that were sent.
export interface Product {
  id: number
  title: string
  description: string
  category: string
  price: number | string
  thumbnail?: string
}

export interface SavedProduct {
  id: number
}

const isProduct = (value: unknown): value is Product =>
  isRecord(value) &&
  typeof value['id'] === 'number' &&
  typeof value['title'] === 'string' &&
  typeof value['category'] === 'string'

const isSavedProduct = (value: unknown): value is SavedProduct =>
  isRecord(value) && typeof value['id'] === 'number'

export async function getProduct(id: number): Promise<ApiResult<Product>> {
  const result = await request(`/products/${String(id)}`, { method: 'GET' })
  if (result.error) {
    return result
  }
  return isProduct(result.data) ? { error: false, data: result.data } : UNEXPECTED_RESPONSE
}

// No Content-Type header: for FormData the browser sets multipart/form-data with the boundary.
export async function addProduct(data: FormData): Promise<ApiResult<SavedProduct>> {
  const result = await request('/products/add', { method: 'POST', body: data })
  if (result.error) {
    return result
  }
  return isSavedProduct(result.data) ? { error: false, data: result.data } : UNEXPECTED_RESPONSE
}

export async function updateProduct(id: number, data: FormData): Promise<ApiResult<SavedProduct>> {
  const result = await request(`/products/${String(id)}`, { method: 'PUT', body: data })
  if (result.error) {
    return result
  }
  return isSavedProduct(result.data) ? { error: false, data: result.data } : UNEXPECTED_RESPONSE
}

// Form field -> API field. DummyJSON calls the name "title" and the selling price "price".
export function buildProductFormData(values: ProductFormValues, files: ProductFiles): FormData {
  const data = new FormData()
  data.append('title', values.name.trim())
  data.append('category', values.category)
  data.append('description', values.description.trim())
  data.append('form', values.form)
  data.append('safety', values.safety)
  data.append('uom', values.uom)
  data.append('ecoFriendly', String(values.ecoFriendly))
  data.append('handleWithCare', String(values.handleWithCare))
  data.append('ratePerUnit', values.ratePerUnit.trim())
  data.append('price', values.marketPrice.trim())
  data.append('profitMargin', values.profitMargin.trim())
  data.append('productType', values.productType.trim())
  data.append('productSize', values.productSize.trim())
  data.append('productVariant', values.productVariant.trim())
  data.append('productColor', values.productColor.trim())
  files.images.forEach((image) => {
    data.append('images', image)
  })
  if (files.brochure !== null) {
    data.append('brochure', files.brochure)
  }
  return data
}

// Pre-fills the edit form. DummyJSON products only have some of our fields; the rest stay empty.
export function toProductFormValues(product: Product): ProductFormValues {
  return {
    ...EMPTY_PRODUCT_VALUES,
    name: product.title,
    category: product.category,
    description: product.description,
    marketPrice: String(product.price),
  }
}
