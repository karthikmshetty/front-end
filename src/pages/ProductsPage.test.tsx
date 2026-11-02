import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  API_PRODUCT,
  fillRequiredProductFields,
  IMAGE_UPLOAD_ROUTES,
  installApiMocks,
  jsonResponse,
  productList,
  renderLoggedInAt,
  S3_FILE_URL,
} from '../testUtils.ts'

const LIST = 'GET /products?page_size=100'

describe('ProductsPage', () => {
  installApiMocks()

  it('lists products from the API', async () => {
    await renderLoggedInAt('/products', {
      [LIST]: () => jsonResponse(productList([{ ...API_PRODUCT, images: [S3_FILE_URL] }])),
    })

    const row = (await screen.findByText('RCC Cement')).closest('tr')
    expect(row).not.toBeNull()
    const cells = within(row as HTMLElement)
    expect(cells.getByText('Construction')).toBeInTheDocument()
    expect(cells.getByText('Per Bag')).toBeInTheDocument()
    expect(cells.getByText('200')).toBeInTheDocument()
    expect(cells.getByText('300')).toBeInTheDocument()
    expect(row?.querySelector('img')).toHaveAttribute('src', S3_FILE_URL)
    expect(screen.getByRole('link', { name: 'Add Product' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit RCC Cement' })).toHaveAttribute(
      'href',
      `/products/${API_PRODUCT.id}/edit`,
    )
  })

  it('searches with the API and says when nothing matches', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt('/products', {
      [LIST]: () => jsonResponse(productList([API_PRODUCT])),
      [`${LIST}&search=wire`]: () => jsonResponse(productList([])),
    })
    await screen.findByText('RCC Cement')

    await user.type(screen.getByRole('searchbox', { name: 'Search products' }), 'wire')

    expect(await screen.findByText(/No products match/)).toHaveTextContent('wire')
    expect(screen.queryByText('RCC Cement')).not.toBeInTheDocument()
  })

  it('shows the error when the list cannot be loaded', async () => {
    await renderLoggedInAt('/products', {
      [LIST]: () =>
        jsonResponse({ message: 'Oops! Something went wrong. Please try again later.' }, 500),
    })

    expect(await screen.findByRole('alert')).toHaveTextContent('Oops! Something went wrong.')
  })

  it('shows a newly added product in the list (Redux cache is refreshed)', async () => {
    const products: unknown[] = []
    const user = userEvent.setup()
    await renderLoggedInAt('/products', {
      ...IMAGE_UPLOAD_ROUTES,
      [LIST]: () => jsonResponse(productList(products)),
      'POST /products': () => {
        products.push(API_PRODUCT)
        return jsonResponse({ message: 'Product added successfully', data: API_PRODUCT }, 201)
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
    expect(dialog).toHaveTextContent('RCC Cement')
    expect(await screen.findByRole('link', { name: 'Edit RCC Cement' })).toBeInTheDocument()
  })
})
