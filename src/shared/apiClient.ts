// The one place that talks HTTP: every service calls request() instead of fetch().

export type ApiResult<T> =
  { error: false; data: T } | { error: true; status?: number; message: string }

export const UNEXPECTED_RESPONSE = {
  error: true,
  message: 'Unexpected response from the server',
} as const

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readMessage = (body: unknown): string | undefined =>
  isRecord(body) && typeof body['message'] === 'string' ? body['message'] : undefined

export async function request(path: string, init: RequestInit): Promise<ApiResult<unknown>> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  if (baseUrl === undefined || baseUrl === '') {
    return { error: true, message: 'VITE_API_BASE_URL is not configured' }
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, init)
  } catch {
    return { error: true, message: 'Network error. Check your connection and try again.' }
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

export const postJson = (path: string, payload: unknown): Promise<ApiResult<unknown>> =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
