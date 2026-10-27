// RTK Query: fetches products and caches them in the Redux store. It calls productService (the
// only place that talks HTTP), so swapping the fake API for the real one changes nothing here.
import type { SerializedError } from '@reduxjs/toolkit'
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

import type { Product, ProductList, SavedProduct } from '../services/productService.ts'
import * as productService from '../services/productService.ts'
import type { ApiResult } from '../shared/apiClient.ts'

export interface ProductsApiError {
  status?: number
  message: string
}

const toQueryResult = <T>(result: ApiResult<T>): { data: T } | { error: ProductsApiError } => {
  if (!result.error) {
    return { data: result.data }
  }
  return {
    error:
      result.status === undefined
        ? { message: result.message }
        : { status: result.status, message: result.message },
  }
}

// "LIST" is refetched after add/update, so the products page always shows the latest data.
const LIST_TAG = { type: 'Product', id: 'LIST' } as const

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fakeBaseQuery<ProductsApiError>(),
  tagTypes: ['Product'],
  endpoints: (build) => ({
    getProducts: build.query<ProductList, string>({
      queryFn: async (search) => toQueryResult(await productService.listProducts(search)),
      providesTags: (result) => [
        LIST_TAG,
        ...(result?.products.map(({ id }) => ({ type: 'Product' as const, id })) ?? []),
      ],
    }),
    getProduct: build.query<Product, number>({
      queryFn: async (id) => toQueryResult(await productService.getProduct(id)),
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
    addProduct: build.mutation<SavedProduct, FormData>({
      queryFn: async (data) => toQueryResult(await productService.addProduct(data)),
      invalidatesTags: [LIST_TAG],
    }),
    updateProduct: build.mutation<SavedProduct, { id: number; data: FormData }>({
      queryFn: async ({ id, data }) => toQueryResult(await productService.updateProduct(id, data)),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Product', id }, LIST_TAG],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useAddProductMutation,
  useUpdateProductMutation,
} = productsApi

type QueryError = ProductsApiError | SerializedError

// Status of a failed query/mutation, e.g. 404 for "Product not found".
export function errorStatus(error: QueryError | undefined): number | undefined {
  return error !== undefined && 'status' in error ? error.status : undefined
}

export function errorMessage(error: QueryError): string {
  return error.message ?? 'Something went wrong. Please try again.'
}

// What awaiting a mutation trigger returns: either data or an error.
type MutationResult<T> = { data: T; error?: undefined } | { data?: undefined; error: QueryError }

// Mutation results back into ApiResult, the shape useProductSave works with.
export function toApiResult<T>(result: MutationResult<T>): ApiResult<T> {
  if (result.error === undefined) {
    return { error: false, data: result.data }
  }
  const status = errorStatus(result.error)
  const message = errorMessage(result.error)
  return status === undefined ? { error: true, message } : { error: true, status, message }
}
