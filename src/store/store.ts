import { configureStore } from '@reduxjs/toolkit'

import { productsApi } from './productsApi.ts'

// A function, not a single store, so every test (and every App render) starts with an empty cache.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- configureStore's type is inferred; spelling it out would repeat this whole config
export function makeStore() {
  return configureStore({
    reducer: { [productsApi.reducerPath]: productsApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // Add/update send FormData (with files), which Redux would otherwise warn is not
        // serializable. It only passes through RTK Query and is never read from the store.
        serializableCheck: {
          ignoredActionPaths: ['meta.arg.originalArgs', 'meta.baseQueryMeta'],
          ignoredPaths: [`${productsApi.reducerPath}.mutations`],
        },
      }).concat(productsApi.middleware),
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
