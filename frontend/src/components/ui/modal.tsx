"use client";

import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Modal = ({
    ref, isOpen, onClose, title, size = 'md', children }: ModalProps & { ref?: React.Ref<HTMLDivElement> }) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
          return;
        }

        if (event.key === 'Tab' && dialogRef.current) {
          const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          const firstFocusable = focusableElements[0];
          const lastFocusable = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            if (document.activeElement === firstFocusable) {
              event.preventDefault();
              lastFocusable?.focus();
            }
          } else {
            if (document.activeElement === lastFocusable) {
              event.preventDefault();
              firstFocusable?.focus();
            }
          }
        }
      },
      [onClose]
    );

    useEffect(() => {
      if (isOpen) {
        previousFocusRef.current = document.activeElement as HTMLElement;
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => {
          const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        });

        return () => {
          document.removeEventListener('keydown', handleKeyDown);
          document.body.style.overflow = '';
          previousFocusRef.current?.focus();
        };
      }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Dialog */}
        <div
          ref={(node) => {
            (dialogRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={cn(
            'relative z-10 w-full rounded-xl bg-white p-6 shadow-2xl dark:bg-surface-900',
            'animate-in fade-in zoom-in-95 duration-200',
            sizeClasses[size],
            'mx-4'
          )}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-surface-900 dark:text-white"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Close dialog"
            >
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div>{children}</div>
        </div>
      </div>,
      document.body
    );
  }


Modal.displayName = 'Modal';
