import React, { useId } from 'react';
import { cn } from './utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const baseTextareaClasses =
  'w-full rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white dark:placeholder:text-surface-500 transition-colors duration-200 resize-y min-h-[80px]';

const errorTextareaClasses =
  'border-error focus:ring-error focus:border-error dark:border-error';

export const Textarea = ({
    ref, label, error, hint, maxLength, className, id, value, defaultValue, ...props }: TextareaProps & { ref?: React.Ref<HTMLTextAreaElement> }) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const countId = maxLength ? `${textareaId}-count` : undefined;

    const describedBy =
      [errorId, hintId, countId].filter(Boolean).join(' ') || undefined;

    const currentLength =
      typeof value === 'string'
        ? value.length
        : typeof defaultValue === 'string'
          ? defaultValue.length
          : 0;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            baseTextareaClasses,
            error && errorTextareaClasses,
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          {...props}
        />
        <div className="mt-1.5 flex items-center justify-between">
          <div>
            {error && (
              <p id={errorId} className="text-sm text-error" role="alert">
                {error}
              </p>
            )}
            {hint && !error && (
              <p
                id={hintId}
                className="text-sm text-surface-500 dark:text-surface-400"
              >
                {hint}
              </p>
            )}
          </div>
          {maxLength != null && (
            <p
              id={countId}
              className={cn(
                'text-sm',
                currentLength >= maxLength
                  ? 'text-error'
                  : 'text-surface-500 dark:text-surface-400'
              )}
              aria-live="polite"
            >
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }


Textarea.displayName = 'Textarea';
