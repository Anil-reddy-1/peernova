import React from 'react';
import { cn } from './utils';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const colorClasses: Record<string, string> = {
  primary: 'text-primary-600',
  white: 'text-white',
  secondary: 'text-secondary-600',
};

export const Spinner = ({
    ref, size = 'md', color = 'primary', className, ...props }: SpinnerProps & { ref?: React.Ref<SVGSVGElement> }) => {
    const colorClass = colorClasses[color] || `text-${color}`;

    return (
      <svg
        ref={ref}
        className={cn('animate-spin', sizeClasses[size], colorClass, className)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-label="Loading"
        {...props}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
  }


Spinner.displayName = 'Spinner';
