import Button from './Button.tsx'
import Modal from './Modal.tsx'

export interface SuccessModalProps {
  title: string
  children: React.ReactNode
  onClose: () => void
}

// Figma "Success Modal": Cancel closes it, Home goes to the dashboard.
export default function SuccessModal({
  title,
  children,
  onClose,
}: SuccessModalProps): React.JSX.Element {
  return (
    <Modal
      tone="success"
      title={title}
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button to="/dashboard">Home</Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
