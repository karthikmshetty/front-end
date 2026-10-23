import type { LucideIcon } from 'lucide-react'
import { LayoutGrid, Package, PackageSearch, Users } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  // Shown in the header while this section is open (Figma: "Products List").
  title: string
  icon: LucideIcon
  // Orders and Vendors are in the design but have no pages yet.
  enabled: boolean
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', title: 'Dashboard', icon: LayoutGrid, enabled: true },
  {
    label: 'Products',
    to: '/products',
    title: 'Products List',
    icon: PackageSearch,
    enabled: true,
  },
  { label: 'Orders', to: '/orders', title: 'Orders', icon: Package, enabled: false },
  { label: 'Vendors', to: '/vendors', title: 'Vendors', icon: Users, enabled: false },
]

export interface Breadcrumb {
  label: string
  // Missing on the last crumb: that is the current page.
  to?: string
}

const PRODUCTS_CRUMB: Breadcrumb = { label: 'Products List', to: '/products' }

// Header trail (Figma: "Product List • Add Products").
export function getBreadcrumbs(pathname: string): readonly Breadcrumb[] {
  if (pathname === '/products/new') {
    return [PRODUCTS_CRUMB, { label: 'Add Products' }]
  }
  if (/^\/products\/[^/]+\/edit$/.test(pathname)) {
    return [PRODUCTS_CRUMB, { label: 'Edit Product' }]
  }
  const item = NAV_ITEMS.find((navItem) => pathname.startsWith(navItem.to))
  return item === undefined ? [] : [{ label: item.title }]
}

export const NAV_ITEM_CLASS =
  'relative flex w-full items-center gap-3 rounded-r-lg px-7 py-3.5 text-label-large'
