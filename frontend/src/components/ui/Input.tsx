import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: ReactNode
  error?: string
  surface?: 'light' | 'dark'
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, surface = 'light', id, className = '', ...rest },
  ref,
) {
  const generated = useId()
  const inputId = id ?? generated

  const surfaceStyles =
    surface === 'dark'
      ? {
          background: 'rgba(245,241,234,0.06)',
          border: '1px solid var(--rule)',
          color: 'var(--color-paper)',
        }
      : {
          background: '#fff',
          border: `1px solid ${error ? 'var(--color-warm-dk)' : 'var(--rule-lt-md)'}`,
          color: 'var(--color-ink)',
        }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: surface === 'dark' ? 'var(--mute)' : 'var(--mute-lt)',
          }}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className="w-full px-3.5 py-3 text-[15px] outline-none transition-colors duration-150 focus:border-warm"
        style={{ ...surfaceStyles, fontFamily: 'var(--font-sans)' }}
        {...rest}
      />
      {error ? (
        <p
          className="pl-2 border-l text-[12px]"
          style={{
            borderColor: 'var(--color-warm-dk)',
            color: 'var(--color-warm-dk)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {error}
        </p>
      ) : (
        hint && (
          <p
            className="text-[12px]"
            style={{
              color: surface === 'dark' ? 'var(--mute)' : 'var(--mute-lt)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {hint}
          </p>
        )
      )}
    </div>
  )
})

export default Input
