import type { SubmitEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import Button from '../components/Button.tsx'
import Input from '../components/Input.tsx'
import AuthLayout from '../components/layout/AuthLayout.tsx'
import { useAuth } from '../context/useAuth.ts'
import type { FormErrors, LoginValues } from '../helpers/validators.ts'
import { hasErrors, validateLoginForm } from '../helpers/validators.ts'

const INITIAL_VALUES: LoginValues = { username: '', password: '' }

export type LoginPageProps = Record<string, never>

// The Figma design logs in with an emailed code; the Cognito pool uses username + password.
// There is no sign up: an admin creates users (back-end README, "Users (Cognito)").
export default function LoginPage(_props: LoginPageProps): React.JSX.Element {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [values, setValues] = useState<LoginValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<FormErrors<LoginValues>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)

  const handleChange =
    (field: keyof LoginValues): ((value: string) => void) =>
    (value) => {
      setValues((current) => ({ ...current, [field]: value }))
    }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const nextErrors = validateLoginForm(values)
    setErrors(nextErrors)
    if (!hasErrors(nextErrors)) {
      void logIn()
    }
  }

  const logIn = async (): Promise<void> => {
    setIsSubmitting(true)
    setSubmitError(undefined)
    const result = await login(values)
    setIsSubmitting(false)
    if (result.error) {
      setSubmitError(result.message)
      return
    }
    void navigate('/dashboard')
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in to Old Town Market"
      description="Your business is right where you left it. Enter your username and password to continue."
      footer="No account yet? Ask your admin to create one."
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Username"
          value={values.username}
          onChange={handleChange('username')}
          error={errors.username}
          placeholder="Enter your username"
          autoComplete="username"
        />
        <Input
          label="Password"
          type="password"
          value={values.password}
          onChange={handleChange('password')}
          error={errors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        {submitError !== undefined && (
          <p role="alert" className="text-body-medium text-error">
            {submitError}
          </p>
        )}
        <Button type="submit" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
