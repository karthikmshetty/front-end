import { Package, Pencil } from 'lucide-react'
import { Link } from 'react-router'

import type { Product } from '../services/productService.ts'

export interface ProductTableProps {
  products: readonly Product[]
}

const CELL = 'px-4 py-3 text-left'
const NUMBER_CELL = `${CELL} text-right tabular-nums`

// No Figma frame for the list yet: a plain table styled with the project tokens.
export default function ProductTable({ products }: ProductTableProps): React.JSX.Element {
  return (
    <div className="overflow-x-auto rounded-2xl bg-surface">
      <table className="w-full min-w-[640px] text-body-medium">
        <thead className="border-b border-outline-variant text-label-large text-on-surface-variant">
          <tr>
            <th scope="col" className={CELL}>
              Product
            </th>
            <th scope="col" className={CELL}>
              Category
            </th>
            <th scope="col" className={CELL}>
              UOM
            </th>
            <th scope="col" className={`${CELL} text-right`}>
              Rate per Unit
            </th>
            <th scope="col" className={`${CELL} text-right`}>
              Selling Price
            </th>
            <th scope="col" className={CELL}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {products.map((product) => {
            const image = product.images[0]
            return (
              <tr key={product.id}>
                <td className={CELL}>
                  <div className="flex items-center gap-3">
                    {image === undefined ? (
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-container text-outline">
                        <Package aria-hidden="true" className="size-6" />
                      </span>
                    ) : (
                      <img
                        src={image}
                        alt=""
                        className="size-12 shrink-0 rounded-lg bg-surface-container object-contain"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-title-small text-on-surface">{product.name}</p>
                      <p className="truncate text-on-surface-variant">{product.description}</p>
                    </div>
                  </div>
                </td>
                <td className={CELL}>{product.category}</td>
                <td className={CELL}>{product.uom ?? '—'}</td>
                <td className={NUMBER_CELL}>{product.ratePerUnit}</td>
                <td className={NUMBER_CELL}>{product.marketSellingPrice ?? '—'}</td>
                <td className={`${CELL} text-right`}>
                  <Link
                    to={`/products/${encodeURIComponent(product.id)}/edit`}
                    aria-label={`Edit ${product.name}`}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-label-large text-primary hover:bg-surface-container"
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                    Edit
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
