import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

// Placeholder cropped from the design screenshot; replace with the Figma export.
import emptyIllustration from '../assets/products-empty-placeholder.png'
import Button from '../components/Button.tsx'
import EmptyState from '../components/EmptyState.tsx'
import ProductTable from '../components/ProductTable.tsx'
import SuccessModal from '../components/SuccessModal.tsx'
import { useDebouncedValue } from '../hooks/useDebouncedValue.ts'
import { readSavedProductState } from '../hooks/useProductSave.ts'
import { errorMessage, useGetProductsQuery } from '../store/productsApi.ts'

const ADD_ICON = <Plus aria-hidden="true" className="size-5" />

export type ProductsPageProps = Record<string, never>

export default function ProductsPage(_props: ProductsPageProps): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  // Read the "just saved" message once; it is then cleared so a refresh or Back does not repeat it.
  const [saved, setSaved] = useState(() => readSavedProductState(location.state))
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  // The list lives in the Redux store (RTK Query) and refetches after every add or edit.
  const { data, error, isLoading } = useGetProductsQuery(debouncedSearch)

  useEffect(() => {
    if (location.state !== null) {
      void navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state, location.pathname, navigate])

  const closeModal = (): void => {
    setSaved(undefined)
  }

  const hasNoProducts = data?.total === 0 && debouncedSearch.trim() === ''
  // Only once the list has loaded, so it does not flash before the empty state's own button.
  const showAddButton = data !== undefined && !hasNoProducts

  return (
    <div className="flex flex-col gap-8">
      {saved !== undefined && (
        <SuccessModal
          title={`Product ${saved.action === 'added' ? 'Added' : 'Updated'} Successfully`}
          onClose={closeModal}
        >
          &ldquo;{saved.name}&rdquo; was {saved.action === 'added' ? 'added to' : 'updated in'} your
          product list.
        </SuccessModal>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-headline-small font-medium">Products</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block sm:w-80">
            <span className="sr-only">Search products</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-outline"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
              }}
              placeholder="Search products"
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface pr-3 pl-10 text-body-medium placeholder:text-on-surface-variant focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            />
          </label>
          {showAddButton && (
            <Button to="/products/new" icon={ADD_ICON}>
              Add Product
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-body-large text-on-surface-variant">
          Loading products…
        </p>
      ) : error !== undefined ? (
        <p role="alert" className="py-12 text-center text-body-large text-error">
          {errorMessage(error)}
        </p>
      ) : hasNoProducts ? (
        <EmptyState
          image={emptyIllustration}
          title="Upload Products to Kickstart and Streamline Your Business Operations"
          description="No products yet. Add your first product to start managing your catalogue, orders and vendors in one place."
          action={
            <Button fullWidth to="/products/new" icon={ADD_ICON}>
              Add Product
            </Button>
          }
        />
      ) : data === undefined || data.products.length === 0 ? (
        <p className="py-12 text-center text-body-large text-on-surface-variant">
          No products match &ldquo;{debouncedSearch}&rdquo;.
        </p>
      ) : (
        <ProductTable products={data.products} />
      )}
    </div>
  )
}
