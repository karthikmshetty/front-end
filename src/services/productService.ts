// Products API (back-end repo: part-4-serverless/api-design, docs/products-swagger.yaml).
// The API uses snake_case and string ids; the rest of the app uses the Product type below.
import { EMPTY_PRODUCT_VALUES } from '../helpers/productOptions.ts'
import type { ProductFiles, ProductFormValues } from '../helpers/validators.ts'
import type { ApiResult } from '../shared/apiClient.ts'
import {
  isRecord,
  postJson,
  request,
  UNEXPECTED_RESPONSE,
  uploadFile,
} from '../shared/apiClient.ts'

const API = 'VITE_PRODUCTS_API_URL'

// GET /products allows at most 100 per page; the list page shows the first page only.
export const PRODUCT_PAGE_SIZE = 100

export interface Product {
  id: string
  name: string
  category: string
  description: string
  ratePerUnit: number
  marketSellingPrice?: number
  profitMargin?: number
  uom?: string
  form?: string
  safety?: string
  productType?: string
  productSize?: string
  productVariant?: string
  productColor?: string
  ecoFriendly: boolean
  handleWithCare: boolean
  // Image URLs; the first one is the main image.
  images: string[]
  // URL of the brochure PDF.
  brochure?: string
}

export interface ProductList {
  products: Product[]
  total: number
}

// The API's product object (back-end: entities/Product.ts).
interface ApiProduct {
  id: string
  name: string
  category: string
  rate_per_unit: number
  description?: string
  market_selling_price?: number
  sale_profit_margin?: number
  uom?: string
  form?: string
  safety?: string
  product_type?: string
  product_size?: string
  product_variant?: string
  product_color?: string
  eco_friendly?: boolean
  handle_with_care?: boolean
  images: string[]
  brochure?: string
}

const isApiProduct = (value: unknown): value is ApiProduct =>
  isRecord(value) &&
  typeof value['id'] === 'string' &&
  typeof value['name'] === 'string' &&
  typeof value['category'] === 'string' &&
  typeof value['rate_per_unit'] === 'number' &&
  Array.isArray(value['images'])

// Leaves optional fields out (instead of setting them to undefined), as exactOptionalPropertyTypes needs.
const optional = <K extends string, V>(key: K, value: V | undefined): Partial<Record<K, V>> =>
  value === undefined ? {} : ({ [key]: value } as Record<K, V>)

const fromApi = (product: ApiProduct): Product => ({
  id: product.id,
  name: product.name,
  category: product.category,
  description: product.description ?? '',
  ratePerUnit: product.rate_per_unit,
  ecoFriendly: product.eco_friendly ?? false,
  handleWithCare: product.handle_with_care ?? false,
  images: product.images,
  ...optional('marketSellingPrice', product.market_selling_price),
  ...optional('profitMargin', product.sale_profit_margin),
  ...optional('uom', product.uom),
  ...optional('form', product.form),
  ...optional('safety', product.safety),
  ...optional('productType', product.product_type),
  ...optional('productSize', product.product_size),
  ...optional('productVariant', product.product_variant),
  ...optional('productColor', product.product_color),
  ...optional('brochure', product.brochure),
})

// Successful responses are { message, data }.
const readData = (body: unknown): unknown => (isRecord(body) ? body['data'] : undefined)

const toProduct = (result: ApiResult<unknown>): ApiResult<Product> => {
  if (result.error) {
    return result
  }
  const data = readData(result.data)
  return isApiProduct(data) ? { error: false, data: fromApi(data) } : UNEXPECTED_RESPONSE
}

export async function listProducts(search = ''): Promise<ApiResult<ProductList>> {
  const params = new URLSearchParams({ page_size: String(PRODUCT_PAGE_SIZE) })
  if (search.trim() !== '') {
    params.set('search', search.trim())
  }
  const result = await request(`/products?${params.toString()}`, { method: 'GET' }, API)
  if (result.error) {
    return result
  }
  const data = readData(result.data)
  const total = isRecord(result.data) ? result.data['total_count'] : undefined
  if (!Array.isArray(data) || !data.every(isApiProduct) || typeof total !== 'number') {
    return UNEXPECTED_RESPONSE
  }
  return { error: false, data: { products: data.map(fromApi), total } }
}

export async function getProduct(id: string): Promise<ApiResult<Product>> {
  return toProduct(await request(`/products/${encodeURIComponent(id)}`, { method: 'GET' }, API))
}

// Step 1 of a file upload: ask the API for a presigned S3 URL for this file type.
async function getUploadUrl(
  contentType: string,
): Promise<ApiResult<{ uploadUrl: string; fileUrl: string }>> {
  const result = await postJson('/products/upload-url', { content_type: contentType }, API)
  if (result.error) {
    return result
  }
  const data = readData(result.data)
  if (
    !isRecord(data) ||
    typeof data['upload_url'] !== 'string' ||
    typeof data['file_url'] !== 'string'
  ) {
    return UNEXPECTED_RESPONSE
  }
  return { error: false, data: { uploadUrl: data['upload_url'], fileUrl: data['file_url'] } }
}

// Uploads one file (image or brochure PDF) straight to S3 and returns its public URL.
async function uploadToS3(file: File): Promise<ApiResult<string>> {
  const target = await getUploadUrl(file.type)
  if (target.error) {
    return target
  }
  const upload = await uploadFile(target.data.uploadUrl, file)
  return upload.error ? upload : { error: false, data: target.data.fileUrl }
}

// The URLs to save. New files are uploaded; when none were picked, `current` is kept (edit).
interface FileUrls {
  images: readonly string[]
  brochure?: string | undefined
}

async function uploadFiles(files: ProductFiles, current: FileUrls): Promise<ApiResult<FileUrls>> {
  const uploads = await Promise.all(files.images.map(uploadToS3))
  const images: string[] = []
  for (const upload of uploads) {
    if (upload.error) {
      return upload
    }
    images.push(upload.data)
  }
  let brochure = current.brochure
  if (files.brochure !== null) {
    const upload = await uploadToS3(files.brochure)
    if (upload.error) {
      return upload
    }
    brochure = upload.data
  }
  return { error: false, data: { images: images.length > 0 ? images : current.images, brochure } }
}

const optionalText = (value: string): string | undefined =>
  value.trim() === '' ? undefined : value.trim()

const optionalNumber = (value: string): number | undefined =>
  value.trim() === '' ? undefined : Number(value)

// Form values -> POST /products and PUT /products/{id} body. Empty optional fields are left out.
export function toProductBody(values: ProductFormValues, files: FileUrls): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: values.name.trim(),
    category: values.category,
    rate_per_unit: Number(values.ratePerUnit),
    description: optionalText(values.description),
    form: optionalText(values.form),
    safety: optionalText(values.safety),
    uom: optionalText(values.uom),
    product_type: optionalText(values.productType),
    product_size: optionalText(values.productSize),
    product_variant: optionalText(values.productVariant),
    product_color: optionalText(values.productColor),
    market_selling_price: optionalNumber(values.marketPrice),
    sale_profit_margin: optionalNumber(values.profitMargin),
    eco_friendly: values.ecoFriendly,
    handle_with_care: values.handleWithCare,
    images: files.images,
    brochure: files.brochure,
  }
  // JSON.stringify drops undefined, but removing them keeps the body readable in tests and logs.
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined))
}

// Uploads the files to S3 first, then creates the product with their URLs.
export async function addProduct(
  values: ProductFormValues,
  files: ProductFiles,
): Promise<ApiResult<Product>> {
  const urls = await uploadFiles(files, { images: [] })
  if (urls.error) {
    return urls
  }
  return toProduct(await postJson('/products', toProductBody(values, urls.data), API))
}

// PUT is a full replace: images and brochure the user did not change are sent again as they were.
export async function updateProduct(
  product: Product,
  values: ProductFormValues,
  files: ProductFiles,
): Promise<ApiResult<Product>> {
  const urls = await uploadFiles(files, { images: product.images, brochure: product.brochure })
  if (urls.error) {
    return urls
  }
  const result = await request(
    `/products/${encodeURIComponent(product.id)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toProductBody(values, urls.data)),
    },
    API,
  )
  return toProduct(result)
}

// Pre-fills the edit form from a product loaded from the API.
export function toProductFormValues(product: Product): ProductFormValues {
  const text = (value: number | undefined): string => (value === undefined ? '' : String(value))
  return {
    ...EMPTY_PRODUCT_VALUES,
    name: product.name,
    category: product.category,
    description: product.description,
    form: product.form ?? '',
    safety: product.safety ?? '',
    uom: product.uom ?? '',
    ecoFriendly: product.ecoFriendly,
    handleWithCare: product.handleWithCare,
    ratePerUnit: String(product.ratePerUnit),
    marketPrice: text(product.marketSellingPrice),
    profitMargin: text(product.profitMargin),
    productType: product.productType ?? '',
    productSize: product.productSize ?? '',
    productVariant: product.productVariant ?? '',
    productColor: product.productColor ?? '',
  }
}
