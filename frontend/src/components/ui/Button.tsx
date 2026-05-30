import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'warm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  fullWidth?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 uppercase font-sans font-semibold ' +
  'text-[12px] tracking-[0.06em] transition-colors duration-150 disabled:opacity-50 ' +
  'disabled:cursor-not-allowed focus:outline-none focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-warm rounded-none'

const variants: Record<Variant, string> = {
  // Heritage primary on light surfaces — dark fill, copper text.
  primary:
    'bg-ink text-warm px-5 py-3 hover:bg-warm hover:text-ink',
  // Outlined on light.
  secondary:
    'bg-white text-ink border border-[var(--rule-lt-strong)] px-4 py-2.5 ' +
    'hover:border-ink hover:text-ink',
  // Copper-on-ink — used inside dark surfaces or for the login CTA.
  warm:
    'bg-warm text-ink px-5 py-3 hover:bg-ink hover:text-warm',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', leadingIcon, trailingIcon, fullWidth, className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
})

export default Button
