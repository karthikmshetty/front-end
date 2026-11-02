// Fake product database for the MSW mock API (same data shape as the real products API).
// Kept in localStorage so products survive a reload. Used only when VITE_USE_MOCKS=true.

export const MOCK_PRODUCTS_KEY = 'mockProducts'
export const MOCK_IMAGES_KEY = 'mockProductImages'

// Same fields as the API's Product entity (back-end: entities/Product.ts), snake_case.
export interface MockProduct {
  id: string
  name: string
  category: string
  rate_per_unit: number
  description?: string
  form?: string
  safety?: string
  uom?: string
  product_type?: string
  product_size?: string
  product_variant?: string
  product_color?: string
  market_selling_price?: number
  sale_profit_margin?: number
  eco_friendly: boolean
  handle_with_care: boolean
  images: string[]
  brochure?: string
  created_at: string
  updated_at: string
}

const seed = (
  id: string,
  createdAt: string,
  fields: Omit<MockProduct, 'id' | 'images' | 'created_at' | 'updated_at'>,
): MockProduct => ({ id, images: [], created_at: createdAt, updated_at: createdAt, ...fields })

const SEED_PRODUCTS: readonly MockProduct[] = [
  seed('mock-cement', '2026-10-01T10:00:00.000Z', {
    name: 'RCC Cement',
    category: 'Construction',
    description: 'Ordinary Portland cement, 50 kg bag.',
    rate_per_unit: 200,
    market_selling_price: 300,
    sale_profit_margin: 33,
    form: 'Powder',
    uom: 'Per Bag',
    eco_friendly: false,
    handle_with_care: false,
  }),
  seed('mock-wire', '2026-10-02T10:00:00.000Z', {
    name: 'Copper Wire 2.5 mm',
    category: 'Electrical',
    description: 'Insulated copper wire, 90 m coil.',
    rate_per_unit: 2000,
    market_selling_price: 2450,
    sale_profit_margin: 18,
    form: 'Solid',
    uom: 'Per Box',
    eco_friendly: false,
    handle_with_care: false,
  }),
  seed('mock-paint', '2026-10-03T10:00:00.000Z', {
    name: 'Exterior Emulsion Paint',
    category: 'Paints',
    description: 'Weather-proof wall paint, white, 20 L.',
    rate_per_unit: 4300,
    market_selling_price: 5200,
    sale_profit_margin: 17,
    form: 'Liquid',
    uom: 'Per Litre',
    eco_friendly: false,
    handle_with_care: true,
  }),
]

let cache: MockProduct[] | null = null

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the change lives in memory for this session.
  }
}

function all(): MockProduct[] {
  if (cache === null) {
    const stored = readJson(MOCK_PRODUCTS_KEY)
    cache = Array.isArray(stored) ? (stored as MockProduct[]) : [...SEED_PRODUCTS]
  }
  return cache
}

// Tests start from the seed data again.
export function resetMockProducts(): void {
  cache = null
  try {
    localStorage.removeItem(MOCK_PRODUCTS_KEY)
    localStorage.removeItem(MOCK_IMAGES_KEY)
  } catch {
    // Nothing stored.
  }
}

// Newest first, like the real API's default sort_order=desc. Search matches the name only.
export function listMockProducts(search = ''): MockProduct[] {
  const query = search.trim().toLowerCase()
  return all()
    .filter((product) => product.name.toLowerCase().includes(query))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function createMockProduct(
  fields: Omit<MockProduct, 'id' | 'created_at' | 'updated_at'>,
): MockProduct {
  const now = new Date().toISOString()
  const product: MockProduct = {
    ...fields,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  }
  cache = [...all(), product]
  writeJson(MOCK_PRODUCTS_KEY, cache)
  return product
}

export function findMockProduct(id: string): MockProduct | undefined {
  return all().find((product) => product.id === id)
}

// PUT is a full replace: everything except id and created_at comes from `fields`.
export function replaceMockProduct(
  id: string,
  fields: Omit<MockProduct, 'id' | 'created_at' | 'updated_at'>,
): MockProduct | undefined {
  const existing = findMockProduct(id)
  if (existing === undefined) {
    return undefined
  }
  const updated: MockProduct = {
    ...fields,
    id,
    created_at: existing.created_at,
    updated_at: new Date().toISOString(),
  }
  cache = all().map((product) => (product.id === id ? updated : product))
  writeJson(MOCK_PRODUCTS_KEY, cache)
  return updated
}

export function deleteMockProduct(id: string): boolean {
  if (findMockProduct(id) === undefined) {
    return false
  }
  cache = all().filter((product) => product.id !== id)
  writeJson(MOCK_PRODUCTS_KEY, cache)
  return true
}

// Fake S3: uploaded images are kept as small data: URLs, looked up by their file_url.
function images(): Record<string, string> {
  const stored = readJson(MOCK_IMAGES_KEY)
  return typeof stored === 'object' && stored !== null ? (stored as Record<string, string>) : {}
}

export function saveMockImage(fileUrl: string, dataUrl: string): void {
  writeJson(MOCK_IMAGES_KEY, { ...images(), [fileUrl]: dataUrl })
}

// The URL an <img> can show: the stored data: URL, or the original when there is none.
export function mockImageSrc(fileUrl: string): string {
  return images()[fileUrl] ?? fileUrl
}
