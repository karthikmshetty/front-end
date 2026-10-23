import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

// Placeholder cropped from the design screenshot; replace with the Figma export.
import emptyIllustration from '../assets/products-empty-placeholder.png'
import Button from '../components/Button.tsx'
import EmptyState from '../components/EmptyState.tsx'
import SuccessModal from '../components/SuccessModal.tsx'
import { readSavedProductState } from '../hooks/useProductSave.ts'

export type ProductsPageProps = Record<string, never>

// There is no product list (DummyJSON does not store new products), so the page always shows
// the empty state from the design.
export default function ProductsPage(_props: ProductsPageProps): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  // Read the "just saved" message once; it is then cleared so a refresh or Back does not repeat it.
  const [saved, setSaved] = useState(() => readSavedProductState(location.state))

  useEffect(() => {
    if (location.state !== null) {
      void navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, location.pathname, navigate])

  const closeModal = (): void => {
    setSaved(undefined)
  }

  return (
    <div className="flex flex-col gap-8">
      {saved !== undefined && (
        <SuccessModal
          title={`Product ${saved.action === 'added' ? 'Added' : 'Updated'} Successfully`}
          onClose={closeModal}
        >
          The server saved it as product #{saved.id}. DummyJSON is a practice API, so the product
          will not appear in this list.
        </SuccessModal>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-headline-small font-medium">Products</h1>
        <label className="relative block sm:w-80">
          <span className="sr-only">Search products</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-outline"
          />
          <input
            type="search"
            placeholder="Search products"
            className="h-11 w-full rounded-lg border border-outline-variant bg-surface pr-3 pl-10 text-body-medium placeholder:text-on-surface-variant focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
        </label>
      </div>

      <EmptyState
        image={emptyIllustration}
        title="Upload Products to Kickstart and Streamline Your Business Operations"
        description="No products yet. Add your first product to start managing your catalogue, orders and vendors in one place."
        action={
          <Button
            fullWidth
            to="/products/new"
            icon={<Plus aria-hidden="true" className="size-5" />}
          >
            Add Product
          </Button>
        }
      />
    </div>
  )
}
