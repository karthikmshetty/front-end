import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { Product } from '../services/productService.ts'
import {
  fillRequiredProductFields,
  installApiMocks,
  jsonResponse,
  renderLoggedInAt,
} from '../testUtils.ts'

const CEMENT: Product = {
  id: 1,
  title: 'RCC Cement',
  description: 'Ordinary Portland cement',
  category: 'Construction',
  price: 300,
  uom: 'Per Bag',
}

const listOf = (products: readonly Product[]): Response =>
  jsonResponse({ products, total: products.length, skip: 0, limit: products.length })

describe('ProductsPage', () => {
  installApiMocks()

  it('lists products with an edit link for each', async () => {
    await renderLoggedInAt('/products', { 'GET /products?limit=0': () => listOf([CEMENT]) })

    const row = (await screen.findByText('RCC Cement')).closest('tr')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getByText('Per Bag')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit RCC Cement' })).toHaveAttribute(
      'href',
      '/products/1/edit',
    )
    expect(screen.getByRole('link', { name: 'Add Product' })).toBeInTheDocument()
  })

  it('searches with the API and says when nothing matches', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt('/products', {
      'GET /products?limit=0': () => listOf([CEMENT]),
      'GET /products/search?q=wire&limit=0': () => listOf([]),
    })
    await screen.findByText('RCC Cement')

    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'wire')

    expect(await screen.findByText(/No products match/)).toHaveTextContent('wire')
    expect(screen.queryByText('RCC Cement')).not.toBeInTheDocument()
  })

  it('shows the error when the list cannot be loaded', async () => {
    await renderLoggedInAt('/products', {
      'GET /products?limit=0': () => jsonResponse({ message: 'Server is down' }, 500),
    })

    expect(await screen.findByRole('alert')).toHaveTextContent('Server is down')
  })

  it('shows a newly added product in the list (Redux cache is refreshed)', async () => {
    const products: Product[] = []
    const user = userEvent.setup()
    await renderLoggedInAt('/products', {
      'GET /products?limit=0': () => listOf(products),
      'POST /products/add': () => {
        products.push({ ...CEMENT, id: 7 })
        return jsonResponse({ id: 7 }, 201)
      },
    })

    await user.click(await screen.findByRole('link', { name: 'Add Product' }))
    await user.upload(
      screen.getByLabelText('Product image file'),
      new File(['png'], 'cement.png', { type: 'image/png' }),
    )
    await user.type(screen.getByLabelText('Product Name'), 'RCC Cement')
    await user.selectOptions(screen.getByLabelText('Product Category'), 'Construction')
    await user.type(
      screen.getByLabelText('Product Description (Usage, Size or Color)'),
      'Ordinary Portland cement',
    )
    await user.type(screen.getByLabelText('Market Selling Price'), '300')
    await fillRequiredProductFields(user)
    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    const dialog = await screen.findByRole('dialog', { name: 'Product Added Successfully' })
    expect(dialog).toHaveTextContent('#7')
    expect(await screen.findByRole('link', { name: 'Edit RCC Cement' })).toBeInTheDocument()
  })
})
