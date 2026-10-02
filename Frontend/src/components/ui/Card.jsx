import { cn } from '../../lib/format'

export function Card({ as: Component = 'div', hover = false, className, children, ...props }) {
  return (
    <Component
      className={cn(
        'rounded-xl border border-slate-200/70 bg-white shadow-card',
        hover && 'transition-shadow duration-200 hover:shadow-card-hover',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export function CardHeader({ title, description, action, as: Heading = 'h2', className }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4', className)}>
      <div className="min-w-0">
        <Heading className="text-base font-semibold text-slate-900">{title}</Heading>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}
