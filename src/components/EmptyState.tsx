export interface EmptyStateProps {
  title: string
  description: string
  image?: string | undefined
  action?: React.ReactNode
}

export default function EmptyState({
  title,
  description,
  image,
  action,
}: EmptyStateProps): React.JSX.Element {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-12 text-center">
      {image !== undefined && <img src={image} alt="" className="mb-14 w-full max-w-sm" />}
      <h2 className="text-headline-small font-medium text-on-surface sm:text-headline-medium">
        {title}
      </h2>
      <p className="mt-6 max-w-2xl text-body-large text-on-surface-variant">{description}</p>
      {action !== undefined && <div className="mt-12 w-full max-w-md">{action}</div>}
    </section>
  )
}
