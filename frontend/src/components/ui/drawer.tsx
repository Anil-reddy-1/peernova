"use client";

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  side?: 'left' | 'right';
  children: React.ReactNode;
}

export const Drawer = ({
    ref, isOpen, onClose, title, side = 'right', children }: DrawerProps & { ref?: React.Ref<HTMLDivElement> }) => {
    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      },
      [onClose]
    );

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
          document.removeEventListener('keydown', handleKeyDown);
          document.body.style.overflow = '';
        };
      }
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          aria-hidden="true"
          onClick={onClose}
        />

        {/* Panel */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          className={cn(
            'fixed inset-y-0 z-10 flex w-full max-w-sm flex-col bg-white shadow-2xl dark:bg-surface-900',
            'transition-transform duration-300 ease-in-out',
            side === 'right' && 'right-0 translate-x-0',
            side === 'left' && 'left-0 translate-x-0'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4 dark:border-surface-700">
            <h2
              id="drawer-title"
              className="text-lg font-semibold text-surface-900 dark:text-white"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800 dark:hover:text-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Close drawer"
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
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        </div>
      </div>,
      document.body
    );
  }


Drawer.displayName = 'Drawer';
