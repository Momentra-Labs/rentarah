import { forwardRef } from 'react'

export type DatePickerProps = {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  disabled?: boolean
  onFocus?: () => void
  isActive?: boolean
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { id, label, value, onChange, min, disabled, onFocus, isActive },
  ref,
) {
  return (
    <div
      className={[
        'rounded-2xl border-2 px-4 py-3 transition-colors duration-150',
        isActive ? 'border-neutral-900 bg-neutral-50 shadow-inner' : 'border-transparent bg-neutral-100/80 hover:bg-neutral-100',
        disabled ? 'pointer-events-none opacity-50' : '',
      ].join(' ')}
    >
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        type="date"
        value={value}
        min={min}
        disabled={disabled}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-neutral-900 outline-none focus:ring-0"
      />
    </div>
  )
})

export default DatePicker
