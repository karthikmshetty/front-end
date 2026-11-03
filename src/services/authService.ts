// Login goes to the team's Cognito user pool through Amplify. Amplify keeps the tokens in
// localStorage and refreshes them; this file only turns its answers into ApiResults.
import { Amplify } from 'aws-amplify'
import type { JWT } from 'aws-amplify/auth'
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth'

import type { ApiResult } from '../shared/apiClient.ts'
import { NETWORK_ERROR } from '../shared/apiClient.ts'

export interface LoginInput {
  username: string
  password: string
}

export interface AuthUser {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
}

let configured = false

// Configures Amplify on first use; returns an error message when the env values are missing.
function configureAuth(): string | undefined {
  if (configured) {
    return undefined
  }
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID
  const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID
  if (userPoolId === undefined || userPoolId === '') {
    return 'VITE_COGNITO_USER_POOL_ID is not configured'
  }
  if (userPoolClientId === undefined || userPoolClientId === '') {
    return 'VITE_COGNITO_CLIENT_ID is not configured'
  }
  Amplify.configure({ Auth: { Cognito: { userPoolId, userPoolClientId } } })
  configured = true
  return undefined
}

const claim = (token: JWT, name: string): string => {
  const value = token.payload[name]
  return typeof value === 'string' ? value : ''
}

// The ID token carries the user's attributes, so no extra request is needed.
const toAuthUser = (idToken: JWT): AuthUser => {
  const username = claim(idToken, 'cognito:username')
  const firstName = claim(idToken, 'given_name')
  return {
    id: claim(idToken, 'sub'),
    username,
    email: claim(idToken, 'email'),
    // Users created without a name still get something to show in the header.
    firstName: firstName === '' ? username : firstName,
    lastName: claim(idToken, 'family_name'),
  }
}

const toError = (error: unknown): { error: true; message: string } => {
  if (error instanceof Error) {
    return { error: true, message: error.name === 'NetworkError' ? NETWORK_ERROR : error.message }
  }
  return { error: true, message: 'Something went wrong. Please try again.' }
}

export async function getCurrentUser(): Promise<ApiResult<AuthUser>> {
  const configError = configureAuth()
  if (configError !== undefined) {
    return { error: true, message: configError }
  }
  try {
    const { tokens } = await fetchAuthSession()
    return tokens?.idToken === undefined
      ? { error: true, status: 401, message: 'Not logged in' }
      : { error: false, data: toAuthUser(tokens.idToken) }
  } catch (error) {
    return toError(error)
  }
}

export async function login(input: LoginInput): Promise<ApiResult<AuthUser>> {
  const configError = configureAuth()
  if (configError !== undefined) {
    return { error: true, message: configError }
  }
  const credentials = { username: input.username.trim(), password: input.password }
  try {
    let result
    try {
      result = await signIn(credentials)
    } catch (error) {
      // A session from another user is still saved: end it and try once more.
      if (!(error instanceof Error) || error.name !== 'UserAlreadyAuthenticatedException') {
        throw error
      }
      await signOut()
      result = await signIn(credentials)
    }
    if (!result.isSignedIn) {
      // e.g. a user created with a temporary password; this app has no screen for that yet.
      return {
        error: true,
        message: `This account needs an extra step (${result.nextStep.signInStep}). Ask an admin to set a permanent password.`,
      }
    }
  } catch (error) {
    return toError(error)
  }
  return getCurrentUser()
}

export async function logout(): Promise<void> {
  if (configureAuth() !== undefined) {
    return
  }
  try {
    await signOut()
  } catch (error) {
    // Amplify clears the saved tokens even when revoking them on the server fails.
    console.warn('Sign out did not reach Cognito', error)
  }
}
