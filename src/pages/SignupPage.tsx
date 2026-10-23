import type { SubmitEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import Button from '../components/Button.tsx'
import Input from '../components/Input.tsx'
import AuthLayout from '../components/layout/AuthLayout.tsx'
import type { FormErrors, SignupValues } from '../helpers/validators.ts'
import { hasErrors, validateSignupForm } from '../helpers/validators.ts'

const INITIAL_VALUES: SignupValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export type SignupPageProps = Record<string, never>

// The Figma design has no password (an emailed code is step 2); we keep passwords for DummyJSON.
export default function SignupPage(_props: SignupPageProps): React.JSX.Element {
  const navigate = useNavigate()
  const [values, setValues] = useState<SignupValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<FormErrors<SignupValues>>({})

  const handleChange =
    (field: keyof SignupValues): ((value: string) => void) =>
    (value) => {
      setValues((current) => ({ ...current, [field]: value }))
    }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const nextErrors = validateSignupForm(values)
    setErrors(nextErrors)
    if (!hasErrors(nextErrors)) {
      void navigate('/login')
    }
  }

  return (
    <AuthLayout
      eyebrow="Sign up"
      title="Create your account"
      description="Start building your business with Old Town Market. All you need is your name, email and a password."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          label="First name"
          value={values.firstName}
          onChange={handleChange('firstName')}
          error={errors.firstName}
          placeholder="Enter your first name"
          autoComplete="given-name"
        />
        <Input
          label="Last name"
          value={values.lastName}
          onChange={handleChange('lastName')}
          error={errors.lastName}
          placeholder="Enter your last name"
          autoComplete="family-name"
        />
        <Input
          label="Email address"
          type="email"
          value={values.email}
          onChange={handleChange('email')}
          error={errors.email}
          placeholder="you@company.com"
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={values.password}
          onChange={handleChange('password')}
          error={errors.password}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <Input
          label="Confirm password"
          type="password"
          value={values.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={errors.confirmPassword}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />
        <Button type="submit" fullWidth>
          Create account
        </Button>
        <p className="text-center text-body-medium text-outline">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-primary hover:underline">
            Terms of service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy policy
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  )
}
