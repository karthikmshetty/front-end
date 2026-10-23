export interface FieldErrorProps {
  // Referenced by the field's aria-describedby so screen readers announce the message.
  id: string
  message: string | undefined
}

export default function FieldError({ id, message }: FieldErrorProps): React.JSX.Element | null {
  if (message === undefined) {
    return null
  }
  return (
    <p id={id} className="text-body-medium text-error">
      {message}
    </p>
  )
}
