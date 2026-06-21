import React from 'react';
import { cn } from './utils';
import { Spinner } from './spinner';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
  secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white shadow-sm',
  outline:
    'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950',
  ghost:
    'text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800',
  danger: 'bg-error hover:bg-red-600 text-white',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900 disabled:opacity-50 disabled:cursor-not-allowed';

export const Button = ({
    ref,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <Spinner
            size="sm"
            color={variant === 'outline' || variant === 'ghost' ? 'primary' : 'white'}
          />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }


Button.displayName = 'Button';
