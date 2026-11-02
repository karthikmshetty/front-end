import { screen, within } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  API_PRODUCT,
  fillRequiredProductFields,
  findRequest,
  IMAGE_UPLOAD_ROUTES,
  installApiMocks,
  jsonResponse,
  mockFetch,
  renderLoggedInAt,
  requestJson,
  S3_FILE_URL,
} from '../testUtils.ts'

const PNG = new File(['png'], 'cement.png', { type: 'image/png' })

const created = (): Response =>
  jsonResponse({ message: 'Product added successfully', data: API_PRODUCT }, 201)

// Image upload works; creating the product answers with `create`.
const saveRoutes = (create: () => Response | Promise<Response>): Record<string, typeof create> => ({
  ...IMAGE_UPLOAD_ROUTES,
  'POST /products': create,
})

const fillProduct = async (user: UserEvent): Promise<void> => {
  await user.upload(screen.getByLabelText('Product image file'), PNG)
  await user.type(screen.getByLabelText('Product Name'), 'RCC Cement')
  await user.selectOptions(screen.getByLabelText('Product Category'), 'Construction')
  await user.type(
    screen.getByLabelText('Product Description (Usage, Size or Color)'),
    'Ordinary Portland cement',
  )
  await user.type(screen.getByLabelText('Market Selling Price'), '300')
  await fillRequiredProductFields(user)
}

describe('AddProductPage', () => {
  installApiMocks()

  it('opens from the products page', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt('/products')

    await user.click(await screen.findByRole('link', { name: 'Add Product' }))

    expect(window.location.pathname).toBe('/products/new')
    expect(within(screen.getByRole('banner')).getByText('Add Products')).toBeInTheDocument()
  })

  it('shows the errors when submitted empty', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt('/products/new')

    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Upload a product image')
    expect(screen.getByText('Product name is required')).toBeInTheDocument()
    expect(screen.getByText('Sale profit margin is required')).toBeInTheDocument()
    expect(screen.queryByText('Product type is required')).not.toBeInTheDocument()
  })

  it('rejects images that break the file rules', async () => {
    // applyAccept: false lets the test pick files the browser dialog would normally hide.
    const user = userEvent.setup({ applyAccept: false })
    await renderLoggedInAt('/products/new')
    const input = screen.getByLabelText('Product image file')

    await user.upload(input, new File(['gif'], 'a.gif', { type: 'image/gif' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Upload a JPG, PNG or WebP image')

    const tooBig = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })
    await user.upload(input, tooBig)
    expect(screen.getByRole('alert')).toHaveTextContent('Image must be 2 MB or smaller')
    expect(screen.queryByRole('img', { name: 'Product preview' })).not.toBeInTheDocument()

    await user.upload(input, PNG)
    expect(screen.getByRole('img', { name: 'Product preview' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('removes the picked image from the attention modal', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt('/products/new')
    await user.upload(screen.getByLabelText('Product image file'), PNG)

    await user.click(screen.getByRole('button', { name: 'Change image' }))
    const dialog = screen.getByRole('dialog', { name: 'Attention !' })
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Product preview' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Click to Upload Product Picture/ })).toBeVisible()
  })

  it('uploads the image, sends JSON, shows "Saving…", then the product on /products', async () => {
    let respond: (response: Response) => void = () => undefined
    const pending = new Promise<Response>((resolve) => {
      respond = resolve
    })
    const user = userEvent.setup()
    await renderLoggedInAt(
      '/products/new',
      saveRoutes(() => pending),
    )
    await fillProduct(user)

    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
    await vi.waitFor(() => {
      expect(findRequest('POST /products')).toBeDefined()
    })
    const body: unknown = requestJson('POST /products')
    expect(body).toMatchObject({
      name: 'RCC Cement',
      category: 'Construction',
      rate_per_unit: 200,
      market_selling_price: 300,
      images: [S3_FILE_URL],
    })

    respond(created())

    const dialog = await screen.findByRole('dialog', { name: 'Product Added Successfully' })
    expect(dialog).toHaveTextContent('RCC Cement')
    expect(window.location.pathname).toBe('/products')
  })

  it('keeps what the user typed when saving fails', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt(
      '/products/new',
      saveRoutes(() => jsonResponse({ message: 'Server is down' }, 500)),
    )
    await fillProduct(user)

    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Server is down')
    expect(screen.getByLabelText('Product Name')).toHaveValue('RCC Cement')
    expect(screen.getByRole('img', { name: 'Product preview' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/products/new')
  })
})

describe('AddProductPage gallery, brochure and draft', () => {
  installApiMocks()

  const image = (name: string): File => new File([name], name, { type: 'image/png' })

  it('shows up to four images as thumbnails', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt('/products/new')
    const input = screen.getByLabelText('Product image file')

    await user.upload(input, image('one.png'))
    await user.upload(input, image('two.png'))

    expect(screen.getByRole('button', { name: 'Show image 2' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getAllByRole('button', { name: 'Add another image' })).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Show image 1' }))
    expect(screen.getByRole('button', { name: 'Show image 1' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.upload(input, image('three.png'))
    await user.upload(input, image('four.png'))
    await user.upload(input, image('five.png'))
    expect(screen.queryByRole('button', { name: 'Add another image' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show image 5' })).not.toBeInTheDocument()
  })

  it('uploads every image and sends all their URLs', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt('/products/new', saveRoutes(created))
    await fillProduct(user)
    await user.upload(screen.getByLabelText('Product image file'), image('second.png'))

    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    await screen.findByRole('dialog', { name: 'Product Added Successfully' })
    const uploads = mockFetch.mock.calls.filter(([, init]) => init?.method === 'PUT')
    expect(uploads).toHaveLength(2)
    expect(requestJson('POST /products')).toMatchObject({
      images: [S3_FILE_URL, S3_FILE_URL],
    })
  })

  it('saves a draft and fills it in next time', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt('/products/new')
    await user.type(screen.getByLabelText('Product Name'), 'RCC Cement')
    await user.click(screen.getByLabelText('Eco Friendly'))

    await user.click(screen.getByRole('button', { name: 'Save as draft' }))
    const dialog = screen.getByRole('dialog', { name: 'Draft Saved Successfully' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await user.click(screen.getByRole('link', { name: 'Cancel' }))
    await user.click(await screen.findByRole('link', { name: 'Add Product' }))

    expect(screen.getByLabelText('Product Name')).toHaveValue('RCC Cement')
    expect(screen.getByLabelText('Eco Friendly')).toBeChecked()
  })

  it('clears the draft once the product is added', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt('/products/new', saveRoutes(created))
    await fillProduct(user)
    await user.click(screen.getByRole('button', { name: 'Save as draft' }))
    expect(localStorage.getItem('productDraft')).not.toBeNull()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    await screen.findByRole('dialog', { name: 'Product Added Successfully' })
    expect(localStorage.getItem('productDraft')).toBeNull()
  })

  it('uploads the brochure as a PDF and sends its URL', async () => {
    const user = userEvent.setup()
    await renderLoggedInAt('/products/new', saveRoutes(created))
    await fillProduct(user)
    const brochure = new File(['pdf'], 'brochure.pdf', { type: 'application/pdf' })
    await user.upload(screen.getByLabelText('Product brochure file'), brochure)
    expect(screen.getByText('brochure.pdf')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add Product' }))

    await screen.findByRole('dialog', { name: 'Product Added Successfully' })
    const contentTypes = mockFetch.mock.calls
      .filter(([, init]) => init?.method === 'PUT')
      .map(([, init]) => (init?.headers as Record<string, string> | undefined)?.['Content-Type'])
    expect(contentTypes).toEqual(['image/png', 'application/pdf'])
    expect(requestJson('POST /products')).toMatchObject({ brochure: S3_FILE_URL })
  })

  it('rejects a brochure that is not a PDF or is over 25 MB', async () => {
    const user = userEvent.setup({ applyAccept: false })
    await renderLoggedInAt('/products/new')
    const input = screen.getByLabelText('Product brochure file')

    await user.upload(input, new File(['doc'], 'brochure.docx', { type: 'application/msword' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Upload the brochure as a PDF')

    const big = new File(['pdf'], 'big.pdf', { type: 'application/pdf' })
    Object.defineProperty(big, 'size', { value: 25 * 1024 * 1024 + 1 })
    await user.upload(input, big)
    expect(screen.getByRole('alert')).toHaveTextContent('Brochure must be 25 MB or smaller')
    expect(screen.queryByText('big.pdf')).not.toBeInTheDocument()
  })
})
