import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/format'

const controlBase =
  'block w-full rounded-lg border bg-white text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:bg-slate-50 disabled:text-slate-500'

const controlState = (invalid) =>
  invalid ? 'border-red-300 focus:border-red-500' : 'border-slate-200 hover:border-slate-300 focus:border-brand-500'

/**
 * Label + control + hint/error wrapper. The child receives `id`, `aria-invalid`
 * and `aria-describedby` through a render function so labels are always wired up.
 */
export function Field({ label, hint, error, required, className, children, hideLabel = false }) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className={cn('mb-1.5 block text-sm font-medium text-slate-700', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-sm text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export const Input = forwardRef(function Input({ invalid, className, ...props }, ref) {
  return <input ref={ref} className={cn(controlBase, controlState(invalid), 'h-10 px-3', className)} {...props} />
})

export const Textarea = forwardRef(function Textarea({ invalid, className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(controlBase, controlState(invalid), 'px-3 py-2', className)} {...props} />
})

/** Native select for full keyboard and screen-reader support. `options` accepts strings or { value, label }. */
export const Select = forwardRef(function Select({ invalid, className, options = [], placeholder, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(controlBase, controlState(invalid), 'h-10 appearance-none pl-3 pr-9', className)}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const { value, label } = typeof option === 'object' ? option : { value: option, label: option }
          return (
            <option key={value} value={value}>
              {label}
            </option>
          )
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
    </div>
  )
})

export function Toggle({ checked, onChange, label, description, id }) {
  const generatedId = useId()
  const labelId = `${id ?? generatedId}-label`
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p id={labelId} className="text-sm font-medium text-slate-700">
          {label}
        </p>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-brand-700' : 'bg-slate-200',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}
