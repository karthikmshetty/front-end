import type { ApiResult } from '../shared/apiClient.ts'
import { isRecord, postJson, request, UNEXPECTED_RESPONSE } from '../shared/apiClient.ts'

export interface LoginInput {
  username: string
  password: string
}

export interface AuthUser {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  image: string
}

export interface LoginData extends AuthUser {
  accessToken: string
  refreshToken: string
}

export interface SignupInput {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface CreatedUser {
  id: number
  firstName: string
  lastName: string
  email: string
}

const isAuthUser = (value: unknown): value is AuthUser =>
  isRecord(value) &&
  typeof value['id'] === 'number' &&
  typeof value['username'] === 'string' &&
  typeof value['firstName'] === 'string'

const isLoginData = (value: unknown): value is LoginData =>
  isRecord(value) && isAuthUser(value) && typeof value['accessToken'] === 'string'

const isCreatedUser = (value: unknown): value is CreatedUser =>
  isRecord(value) && typeof value['id'] === 'number'

export async function login(input: LoginInput): Promise<ApiResult<LoginData>> {
  const result = await postJson('/auth/login', {
    username: input.username.trim(),
    password: input.password,
  })
  if (result.error) {
    return result
  }
  return isLoginData(result.data) ? { error: false, data: result.data } : UNEXPECTED_RESPONSE
}

export async function getCurrentUser(token: string): Promise<ApiResult<AuthUser>> {
  const result = await request('/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (result.error) {
    return result
  }
  return isAuthUser(result.data) ? { error: false, data: result.data } : UNEXPECTED_RESPONSE
}

export async function signup(input: SignupInput): Promise<ApiResult<CreatedUser>> {
  const result = await postJson('/users/add', {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email: input.email.trim(),
    password: input.password,
  })
  if (result.error) {
    return result
  }
  return isCreatedUser(result.data) ? { error: false, data: result.data } : UNEXPECTED_RESPONSE
}
