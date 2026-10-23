export interface FormSectionProps {
  title: string
  children: React.ReactNode
}

// Titled block with the divider line used in the Figma product form.
export default function FormSection({ title, children }: FormSectionProps): React.JSX.Element {
  return (
    <section className="space-y-5">
      <h2 className="border-b border-outline-variant pb-3 text-title-medium text-on-surface">
        {title}
      </h2>
      {children}
    </section>
  )
}
