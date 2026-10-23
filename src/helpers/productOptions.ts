import type { ProductFormValues } from './validators.ts'

// Dropdown choices for the product form. The Figma design shows only the closed dropdowns,
// so these lists are placeholders until the real options are agreed.
export const PRODUCT_CATEGORIES = [
  'Construction',
  'Electrical',
  'Plumbing',
  'Hardware',
  'Paints',
  'Tools',
] as const
export const PRODUCT_FORMS = ['Powder', 'Liquid', 'Solid', 'Granules', 'Paste'] as const
export const PRODUCT_SAFETY = [
  'Non-hazardous',
  'Flammable',
  'Corrosive',
  'Toxic',
  'Fragile',
] as const
export const PRODUCT_UOMS = ['Per Unit', 'Per Kg', 'Per Litre', 'Per Bag', 'Per Box'] as const

export const EMPTY_PRODUCT_VALUES: ProductFormValues = {
  name: '',
  category: '',
  description: '',
  form: '',
  safety: '',
  uom: '',
  ecoFriendly: false,
  handleWithCare: false,
  ratePerUnit: '',
  marketPrice: '',
  profitMargin: '',
  productType: '',
  productSize: '',
  productVariant: '',
  productColor: '',
}
