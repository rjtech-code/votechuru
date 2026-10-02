import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/format'

const variants = {
  primary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800 disabled:bg-brand-700/60',
  secondary: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  link: 'text-brand-700 hover:text-brand-900 hover:underline underline-offset-4',
}

const sizes = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-base',
  icon: 'h-9 w-9',
}

/**
 * Renders a <button>, a router <Link> (when `to` is set) or an <a> (when `href` is set).
 */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading = false, to, href, className, children, disabled, type = 'button', ...props },
  ref,
) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    variant === 'link' ? 'gap-1 text-sm' : sizes[size],
    className,
  )
  const iconSize = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  const content = (
    <>
      {loading ? <Loader2 className={cn(iconSize, 'animate-spin')} aria-hidden="true" /> : Icon && <Icon className={iconSize} aria-hidden="true" />}
      {children}
      {IconRight && <IconRight className={iconSize} aria-hidden="true" />}
    </>
  )

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    )
  }
  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  )
})

export default Button
