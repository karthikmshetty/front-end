// The one place that talks HTTP: every service calls request() instead of fetch().

export type ApiResult<T> =
  { error: false; data: T } | { error: true; status?: number; message: string }

export const UNEXPECTED_RESPONSE = {
  error: true,
  message: 'Unexpected response from the server',
} as const

// Login goes to Cognito through Amplify (authService.ts), not through this client.
export type ApiBaseUrl = 'VITE_PRODUCTS_API_URL'

export const NETWORK_ERROR = 'Network error. Check your connection and try again.'

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readMessage = (body: unknown): string | undefined =>
  isRecord(body) && typeof body['message'] === 'string' ? body['message'] : undefined

export async function request(
  path: string,
  init: RequestInit,
  baseUrlVar: ApiBaseUrl = 'VITE_PRODUCTS_API_URL',
): Promise<ApiResult<unknown>> {
  const baseUrl = import.meta.env[baseUrlVar]
  if (baseUrl === undefined || baseUrl === '') {
    return { error: true, message: `${baseUrlVar} is not configured` }
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, init)
  } catch {
    return { error: true, message: NETWORK_ERROR }
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    return {
      error: true,
      status: response.status,
      message: readMessage(body) ?? 'Something went wrong. Please try again.',
    }
  }
  return { error: false, data: body }
}

export const postJson = (
  path: string,
  payload: unknown,
  baseUrlVar: ApiBaseUrl = 'VITE_PRODUCTS_API_URL',
): Promise<ApiResult<unknown>> =>
  request(
    path,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    baseUrlVar,
  )

// PUTs a file to a presigned URL (S3). No auth header: the signature is in the URL, and the
// Content-Type must match the one the URL was signed for.
export async function uploadFile(uploadUrl: string, file: File): Promise<ApiResult<null>> {
  let response: Response
  try {
    response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
  } catch {
    return { error: true, message: NETWORK_ERROR }
  }
  return response.ok
    ? { error: false, data: null }
    : { error: true, status: response.status, message: `Could not upload ${file.name}.` }
}
