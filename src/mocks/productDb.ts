// Fake product database for the MSW mock API. Kept in localStorage so products survive a reload.
// Delete this folder once the real back-end exists.
import type { Product } from '../services/productService.ts'

export const MOCK_PRODUCTS_KEY = 'mockProducts'

const SEED_PRODUCTS: readonly Product[] = [
  {
    id: 1,
    title: 'RCC Cement',
    description: 'Ordinary Portland cement, 50 kg bag.',
    category: 'Construction',
    price: 300,
    form: 'Powder',
    safety: 'Non-hazardous',
    uom: 'Per Bag',
    ratePerUnit: '200',
    profitMargin: '33',
  },
  {
    id: 2,
    title: 'Copper Wire 2.5 mm',
    description: 'Insulated copper wire, 90 m coil.',
    category: 'Electrical',
    price: 2450,
    form: 'Solid',
    safety: 'Non-hazardous',
    uom: 'Per Box',
    ratePerUnit: '2000',
    profitMargin: '18',
  },
  {
    id: 3,
    title: 'Exterior Emulsion Paint',
    description: 'Weather-proof wall paint, white, 20 L.',
    category: 'Paints',
    price: 5200,
    form: 'Liquid',
    safety: 'Flammable',
    uom: 'Per Litre',
    ratePerUnit: '4300',
    profitMargin: '17',
    handleWithCare: true,
  },
]

let cache: Product[] | null = null

function readStored(): Product[] | null {
  try {
    const raw = localStorage.getItem(MOCK_PRODUCTS_KEY)
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Product[]) : null
  } catch {
    return null
  }
}

function all(): Product[] {
  cache ??= readStored() ?? [...SEED_PRODUCTS]
  return cache
}

function persist(products: Product[]): void {
  cache = products
  try {
    localStorage.setItem(MOCK_PRODUCTS_KEY, JSON.stringify(products))
  } catch {
    // Storage full or blocked: keep the change in memory for this session.
  }
}

// Tests start from the seed data again.
export function resetMockProducts(): void {
  cache = null
  try {
    localStorage.removeItem(MOCK_PRODUCTS_KEY)
  } catch {
    // Nothing stored.
  }
}

export function listMockProducts(search = ''): Product[] {
  const query = search.trim().toLowerCase()
  const products = all()
  if (query === '') {
    return products
  }
  return products.filter((product) =>
    [product.title, product.category, product.description].some((text) =>
      text.toLowerCase().includes(query),
    ),
  )
}

export function findMockProduct(id: number): Product | undefined {
  return all().find((product) => product.id === id)
}

// Turns the FormData text fields into a product (numbers and booleans arrive as strings).
function fromFields(fields: ReadonlyMap<string, string>): Omit<Product, 'id'> {
  const text = (key: string): string => fields.get(key) ?? ''
  return {
    title: text('title'),
    description: text('description'),
    category: text('category'),
    price: Number(text('price')),
    form: text('form'),
    safety: text('safety'),
    uom: text('uom'),
    ecoFriendly: text('ecoFriendly') === 'true',
    handleWithCare: text('handleWithCare') === 'true',
    ratePerUnit: text('ratePerUnit'),
    profitMargin: text('profitMargin'),
    productType: text('productType'),
    productSize: text('productSize'),
    productVariant: text('productVariant'),
    productColor: text('productColor'),
  }
}

export function createMockProduct(
  fields: ReadonlyMap<string, string>,
  thumbnail: string | undefined,
): Product {
  const products = all()
  const id = products.reduce((max, product) => Math.max(max, product.id), 0) + 1
  const product: Product = {
    id,
    ...fromFields(fields),
    ...(thumbnail === undefined ? {} : { thumbnail }),
  }
  persist([...products, product])
  return product
}

// Keeps the old thumbnail when no new image was uploaded.
export function updateMockProduct(
  id: number,
  fields: ReadonlyMap<string, string>,
  thumbnail: string | undefined,
): Product | undefined {
  const existing = findMockProduct(id)
  if (existing === undefined) {
    return undefined
  }
  const newThumbnail = thumbnail ?? existing.thumbnail
  const updated: Product = {
    id,
    ...fromFields(fields),
    ...(newThumbnail === undefined ? {} : { thumbnail: newThumbnail }),
  }
  persist(all().map((product) => (product.id === id ? updated : product)))
  return updated
}
