import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  fillRequiredProductFields,
  findRequest,
  installApiMocks,
  jsonResponse,
  mockFetch,
  renderLoggedInAt,
} from '../testUtils.ts'

const MASCARA = {
  id: 1,
  title: 'Mascara',
  description: 'Volumising mascara',
  category: 'beauty',
  price: 9.99,
  thumbnail: 'https://cdn.test/mascara.webp',
}

describe('EditProductPage', () => {
  installApiMocks()

  it('loads the product and pre-fills the form', async () => {
    await renderLoggedInAt('/products/1/edit', { 'GET /products/1': () => jsonResponse(MASCARA) })

    expect(screen.getByText('Loading product…')).toBeInTheDocument()
    expect(await screen.findByLabelText('Product Name')).toHaveValue('Mascara')
    expect(screen.getByLabelText('Product Category')).toHaveValue('beauty')
    expect(screen.getByLabelText('Market Selling Price')).toHaveValue('9.99')
    expect(screen.getByRole('img', { name: 'Product preview' })).toHaveAttribute(
      'src',
      MASCARA.thumbnail,
    )
  })

  it('sends the changes as FormData with PUT', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt('/products/1/edit', {
      'GET /products/1': () => jsonResponse(MASCARA),
      'PUT /products/1': () => jsonResponse({ id: 1, title: 'Mascara Pro' }),
    })
    const name = await screen.findByLabelText('Product Name')
    await user.clear(name)
    await user.type(name, 'Mascara Pro')
    await fillRequiredProductFields(user)

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(
      await screen.findByRole('dialog', { name: 'Product Updated Successfully' }),
    ).toHaveTextContent('#1')
    const body = findRequest('PUT /products/1')?.body as FormData
    expect(body.get('title')).toBe('Mascara Pro')
    // No new image was picked, so the current one is kept on the server.
    expect(body.has('images')).toBe(false)
  })

  it('shows "Product not found" for a non-numeric id without calling the API', async () => {
    await renderLoggedInAt('/products/abc/edit')

    expect(screen.getByRole('heading', { name: 'Product not found' })).toBeInTheDocument()
    expect(findRequest('GET /products/abc')).toBeUndefined()
    expect(mockFetch).toHaveBeenCalledTimes(1) // only /auth/me
  })

  it('shows "Product not found" when the API returns 404', async () => {
    await renderLoggedInAt('/products/99999/edit', {
      'GET /products/99999': () =>
        jsonResponse({ message: "Product with id '99999' not found" }, 404),
    })

    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeInTheDocument()
  })
})
