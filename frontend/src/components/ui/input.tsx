import React, { useId } from 'react';
import { cn } from './utils';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const baseInputClasses =
  'w-full rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white dark:placeholder:text-surface-500 transition-colors duration-200';

const errorInputClasses =
  'border-error focus:ring-error focus:border-error dark:border-error';

export const Input = ({
    ref, label, error, hint, leftIcon, rightIcon, className, id, ...props }: InputProps & { ref?: React.Ref<HTMLInputElement> }) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-surface-400 dark:text-surface-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseInputClasses,
              error && errorInputClasses,
              leftIcon ? 'pl-10' : undefined,
              rightIcon ? 'pr-10' : undefined,
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            {...props}
          />
          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 dark:text-surface-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-error"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={hintId}
            className="mt-1.5 text-sm text-surface-500 dark:text-surface-400"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }


Input.displayName = 'Input';
