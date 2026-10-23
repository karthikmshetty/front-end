import { Check, ExternalLink } from 'lucide-react'
import { Link } from 'react-router'

// Placeholder cropped from the design screenshot; replace with the Figma export.
import illustration from '../../assets/login-illustration-placeholder.png'
import Logo from '../Logo.tsx'

const HIGHLIGHTS = [
  'A home for your products',
  'Orders and vendors, in sync',
  'Simple tools for everyday business',
] as const

export interface AuthLayoutProps {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
  footer: React.ReactNode
}

// Shared frame for the login and signup pages (Figma "Login" / "Sign up" frames).
export default function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthLayoutProps): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans text-on-surface">
      <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-12">
        <Logo />
        <p className="text-body-medium">
          Need a hand?{' '}
          <a
            href="mailto:support@oldtownmarket.example"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Contact support
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        </p>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-4 pb-8 sm:px-8 lg:grid-cols-2">
        <section className="hidden rounded-3xl bg-surface-container-low p-12 lg:block">
          <p className="inline-block rounded-md bg-primary-container px-3 py-1.5 text-label-medium tracking-wide text-on-primary-container uppercase">
            Your business, better connected
          </p>
          <p className="mt-6 text-display-medium font-medium">
            Big possibilities.
            <br />
            One simple place.
          </p>
          <p className="mt-6 text-body-large text-on-surface-variant">
            Bring your products, orders and vendors together. Make room for what&apos;s next.
          </p>
          <img src={illustration} alt="" className="mt-14 w-full rounded-lg" />
          <ul className="mt-14 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-body-large">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary-container text-primary">
                  <Check aria-hidden="true" className="size-4" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-md">
          <p className="text-label-large tracking-wide text-primary uppercase">{eyebrow}</p>
          <h1 className="mt-3 text-headline-large font-medium">{title}</h1>
          <p className="mt-3 text-body-large text-on-surface-variant">{description}</p>
          <div className="mt-8">{children}</div>
          <hr className="my-8 border-outline-variant" />
          <p className="text-center text-body-large">{footer}</p>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-4 px-4 py-6 text-body-medium text-outline sm:px-12">
        <p>© 2026 Old Town Market. All rights reserved.</p>
        <nav aria-label="Legal" className="flex gap-6">
          <Link to="/privacy" className="hover:underline">
            Privacy policy
          </Link>
          <Link to="/terms" className="hover:underline">
            Terms of service
          </Link>
        </nav>
      </footer>
    </div>
  )
}
