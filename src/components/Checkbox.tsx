export interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export default function Checkbox({ label, checked, onChange }: CheckboxProps): React.JSX.Element {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-body-large text-on-surface-variant">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked)
        }}
        className="size-5 cursor-pointer accent-primary"
      />
    </label>
  )
}
