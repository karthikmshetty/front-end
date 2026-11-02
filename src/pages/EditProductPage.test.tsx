import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  API_PRODUCT,
  IMAGE_UPLOAD_ROUTES,
  installApiMocks,
  jsonResponse,
  renderLoggedInAt,
  requestJson,
  S3_FILE_URL,
} from '../testUtils.ts'

const SAVED = {
  ...API_PRODUCT,
  form: 'Powder',
  safety: 'Non-hazardous',
  sale_profit_margin: 33,
  images: ['https://s3.test/products/old.png'],
  brochure: 'https://s3.test/products/brochures/old.pdf',
}
const GET = `GET /products/${SAVED.id}`
const PUT = `PUT /products/${SAVED.id}`
const EDIT_URL = `/products/${SAVED.id}/edit`

const found = (): Response =>
  jsonResponse({ message: 'Product retrieved successfully', data: SAVED })

describe('EditProductPage', () => {
  installApiMocks()

  it('loads the product and pre-fills every field', async () => {
    await renderLoggedInAt(EDIT_URL, { [GET]: found })

    expect(screen.getByText('Loading product…')).toBeInTheDocument()
    expect(await screen.findByLabelText('Product Name')).toHaveValue('RCC Cement')
    expect(screen.getByLabelText('Product Category')).toHaveValue('Construction')
    expect(screen.getByLabelText('Form')).toHaveValue('Powder')
    expect(screen.getByLabelText('Rate per Unit')).toHaveValue('200')
    expect(screen.getByLabelText('Sale Profit Margin (%)')).toHaveValue('33')
    expect(screen.getByRole('img', { name: 'Product preview' })).toHaveAttribute(
      'src',
      SAVED.images[0],
    )
    expect(screen.getByRole('link', { name: 'Current brochure (PDF)' })).toHaveAttribute(
      'href',
      SAVED.brochure,
    )
  })

  it('saves the changes with PUT and keeps the current image and brochure', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt(EDIT_URL, {
      [GET]: found,
      [PUT]: () =>
        jsonResponse({
          message: 'Product updated successfully',
          data: { ...SAVED, name: 'RCC Cement 53 Grade' },
        }),
    })
    const name = await screen.findByLabelText('Product Name')
    await user.clear(name)
    await user.type(name, 'RCC Cement 53 Grade')
    await user.selectOptions(screen.getByLabelText('UOM'), 'Per Bag')

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(
      await screen.findByRole('dialog', { name: 'Product Updated Successfully' }),
    ).toHaveTextContent('RCC Cement 53 Grade')
    expect(requestJson(PUT)).toMatchObject({
      name: 'RCC Cement 53 Grade',
      form: 'Powder',
      sale_profit_margin: 33,
      images: SAVED.images,
      brochure: SAVED.brochure,
    })
  })

  it('uploads a new image and sends it instead of the old one', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt(EDIT_URL, {
      ...IMAGE_UPLOAD_ROUTES,
      [GET]: found,
      [PUT]: () => jsonResponse({ message: 'Product updated successfully', data: SAVED }),
    })
    await screen.findByLabelText('Product Name')
    await user.upload(
      screen.getByLabelText('Product image file'),
      new File(['png'], 'new.png', { type: 'image/png' }),
    )
    await user.selectOptions(screen.getByLabelText('UOM'), 'Per Bag')

    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await screen.findByRole('dialog', { name: 'Product Updated Successfully' })
    expect(requestJson(PUT)).toMatchObject({ images: [S3_FILE_URL] })
  })

  it('shows "Product not found" when the API returns 404', async () => {
    await renderLoggedInAt('/products/unknown-id/edit', {
      'GET /products/unknown-id': () => jsonResponse({ message: 'Product not found' }, 404),
    })

    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeInTheDocument()
  })
})
