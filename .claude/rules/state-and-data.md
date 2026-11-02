---
paths:
  - 'src/**'
---

# State, data fetching and forms

ArchGuard cannot check these; they come from bugs fixed in other 7Edge projects.

## Where state lives

| What                                           | Where                                                       |
| ---------------------------------------------- | ----------------------------------------------------------- |
| Form values, loading flags, modal open/close   | `useState` in the component or its hook                     |
| Multi-step form drafts that survive navigation | A store with session-storage persistence, inside the domain |
| Cross-screen UI preferences                    | A global store                                              |
| Navigation helpers (back links, breadcrumbs)   | React Context                                               |
| Server data (product list, product details)    | RTK Query endpoints in `src/store/` (Redux Toolkit)         |

A global store is never used for form state. Redux Toolkit is installed for server data only:
RTK Query endpoints use `queryFn` to call the `*Service.ts` functions (never `fetch` directly) and
use tags so lists refetch after add/edit. Ask before adding other state libraries.

## Products API

Products come from the team's API (back-end repo `part-4-serverless/api-design`, contract in
`services/products/docs/products-swagger.yaml`), base URL `VITE_PRODUCTS_API_URL`. Login still
uses DummyJSON (`VITE_API_BASE_URL`). `productService.ts` is the only file that knows the API's
snake_case fields and `{ message, data }` envelope; it maps them to the app's `Product` type.

- Images: `POST /products/upload-url` → `PUT` the file to `upload_url` (via `uploadFile` in
  `src/shared/apiClient.ts`) → send the `file_url`s in `images` on `POST /products` (JSON).
- The API rejects unknown fields and query parameters with 400, so send only documented ones.
- Edit uses `GET` and `PUT /products/{id}`. PUT is a full replace, so unchanged images and the
  brochure URL are sent again. Brochures upload like images with content type `application/pdf`.
- `DELETE /products/{id}` exists in the API but has no UI yet.

## Fake API (offline development)

`src/mocks/` holds an MSW copy of the products API, including a fake S3 upload. It runs only on the
dev server when `VITE_USE_MOCKS=true`. When the real API changes, update the handlers too; pages and
services must not know whether they talk to the fake or the real API.

## Filter popups: pending vs applied

Filters in a popup are staged. Keep two state values:

```
pending → changes on every checkbox/dropdown change (not sent to the API)
applied → set from pending only on "Apply" (drives the API call and the badge count)
open    → seed pending from applied
close   → reset pending to applied (discard unsaved changes)
clear   → reset both, close
```

Pass `pending` to the controls and `applied` to the request and the badge. Binding a control
directly to the state used by the API call is a bug: closing without Apply leaves stale
selections visible on the next open.

## API calls

- All HTTP goes through one client module in `src/shared/` (auth header, refresh, error
  handling in one place). Domain code calls it from `application/` services
  (`<name>.service.ts`), never `fetch`/axios directly in components or hooks.
- Each API function has typed `Input` / `Result` types. Results are a discriminated union
  such as `{ error: false; data: T } | { error: true; status?: number; details?: FieldError[] }`
  so callers must narrow before touching `data`.
- No floating promises (lint-enforced): `await` it, or mark fire-and-forget with `void`.

## Validation

Shared field schemas (email, phone, name, page sizes) live in one module under `src/shared/`
and are imported, not redefined per form.

## Success messages after navigation

Pass the message in router location state and have the destination page read it once and
clear it, so it does not reappear on refresh or back-navigation.
