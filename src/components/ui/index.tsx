'use client'

import { forwardRef } from 'react'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

// ── Button ───────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
}

const btnBase = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed'

const btnVariants: Record<ButtonVariant, string> = {
  primary:   'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 focus-visible:ring-brand-500',
  secondary: 'bg-white text-gray-900 border border-surface-200 hover:bg-surface-50 active:bg-surface-100 focus-visible:ring-surface-200',
  ghost:     'text-gray-600 hover:bg-surface-100 active:bg-surface-200 focus-visible:ring-surface-200',
  danger:    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
}

const btnSizes: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 h-8',
  md: 'text-sm px-4 py-2.5 h-10',
  lg: 'text-sm px-5 py-3 h-12',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(btnBase, btnVariants[variant], btnSizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

// ── Badge ────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'draft'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const badgeVariants: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: '#F4F3EE', color: '#5C5A53' },
  success: { bg: '#DCFCED', color: '#085041' },
  warning: { bg: '#FEF3C7', color: '#92400E' },
  danger:  { bg: '#FEE2E2', color: '#991B1B' },
  info:    { bg: '#DBEAFE', color: '#1E3A8A' },
  draft:   { bg: '#F4F3EE', color: '#8C8A82' },
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const { bg, color } = badgeVariants[variant]
  return (
    <span
      className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', className)}
      style={{ background: bg, color }}
    >
      {children}
    </span>
  )
}

// ── Input ────────────────────────────────────────────────────
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'> {
  label?: string
  error?: string
  hint?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {label}
            {props.required && <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 pointer-events-none" style={{ color: 'var(--text-tertiary)' }}>
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full rounded-lg text-sm transition-all duration-150',
              'border bg-white placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-50',
              prefix ? 'pl-9' : 'pl-3',
              suffix ? 'pr-9' : 'pr-3',
              'py-2.5 h-10',
              error
                ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400'
                : 'border-surface-200',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 pointer-events-none" style={{ color: 'var(--text-tertiary)' }}>
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ── Select ───────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {label}
            {props.required && <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full rounded-lg text-sm transition-all duration-150 h-10 px-3',
            'border bg-white appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500',
            error ? 'border-red-400' : 'border-surface-200',
            className
          )}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

// ── Page Header ──────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div
      className="px-4 md:px-8 py-4 md:py-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      style={{ borderColor: 'var(--border-subtle)', background: 'white' }}
    >
      <div>
        <h1
          className="text-xl md:text-2xl font-bold tracking-tight"
          style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}

// ── Empty State ──────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      {icon && (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--surface-100)', color: 'var(--text-tertiary)' }}
        >
          {icon}
        </div>
      )}
      <h3
        className="text-base font-semibold mb-1"
        style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
