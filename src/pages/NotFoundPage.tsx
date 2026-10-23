import { Link } from 'react-router'

export type NotFoundPageProps = Record<string, never>

export default function NotFoundPage(_props: NotFoundPageProps): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6 font-sans text-on-surface">
      <h1 className="text-headline-large">Page not found</h1>
      <Link to="/" className="font-medium text-primary hover:underline">
        Go to the start page
      </Link>
    </main>
  )
}
