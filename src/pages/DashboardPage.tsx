import { useAuth } from '../context/useAuth.ts'

const CHECKS = [
  { name: 'TypeScript', detail: 'strict mode with extra safety flags' },
  { name: 'ESLint', detail: 'typescript-eslint strict + React rules' },
  { name: 'Prettier', detail: 'formats on save and on every commit' },
  { name: 'Tailwind CSS', detail: 'v4 through the Vite plugin' },
] as const

export type DashboardPageProps = Record<string, never>

// No Figma frame for the dashboard yet: placeholder content inside the shared layout.
export default function DashboardPage(_props: DashboardPageProps): React.JSX.Element {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-headline-small font-medium">
          {user === null ? 'Dashboard' : `Welcome back, ${user.firstName}`}
        </h1>
        <p className="text-body-large text-on-surface-variant">
          Every commit is linted, type-checked and formatted automatically.
        </p>
      </div>

      <ul className="divide-y divide-outline-variant rounded-xl border border-outline-variant bg-surface">
        {CHECKS.map((check) => (
          <li key={check.name} className="flex items-baseline justify-between gap-4 px-5 py-4">
            <span className="text-title-small">{check.name}</span>
            <span className="text-right text-body-medium text-on-surface-variant">
              {check.detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
