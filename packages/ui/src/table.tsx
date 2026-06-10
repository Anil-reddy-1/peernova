import React from 'react';
import { cn } from './utils';

/* ─── Table ────────────────────────────────────────────────────────────────── */

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export const Table = ({
    ref, className, children, ...props }: TableProps & { ref?: React.Ref<HTMLTableElement> }) => {
    return (
      <div className="w-full overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-700">
        <table
          ref={ref}
          className={cn('w-full border-collapse text-sm', className)}
          role="table"
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }


Table.displayName = 'Table';

/* ─── TableHeader ──────────────────────────────────────────────────────────── */

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader = ({
    ref, className, children, ...props }: TableHeaderProps & { ref?: React.Ref<HTMLTableSectionElement> }) => {
  return (
    <thead
      ref={ref}
      className={cn('bg-surface-50 dark:bg-surface-800', className)}
      {...props}
    >
      {children}
    </thead>
  );
}

TableHeader.displayName = 'TableHeader';

/* ─── TableBody ────────────────────────────────────────────────────────────── */

export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = ({
    ref, className, children, ...props }: TableBodyProps & { ref?: React.Ref<HTMLTableSectionElement> }) => {
  return (
    <tbody
      ref={ref}
      className={cn('divide-y divide-surface-200 dark:divide-surface-700', className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

TableBody.displayName = 'TableBody';

/* ─── TableRow ─────────────────────────────────────────────────────────────── */

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {}

export const TableRow = ({
    ref, className, children, ...props }: TableRowProps & { ref?: React.Ref<HTMLTableRowElement> }) => {
    return (
      <tr
        ref={ref}
        className={cn(
          'transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/50',
          className
        )}
        {...props}
      >
        {children}
      </tr>
    );
  }


TableRow.displayName = 'TableRow';

/* ─── TableHead ────────────────────────────────────────────────────────────── */

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export const TableHead = ({
    ref, className, children, ...props }: TableHeadProps & { ref?: React.Ref<HTMLTableCellElement> }) => {
    return (
      <th
        ref={ref}
        className={cn(
          'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-600 dark:text-surface-400',
          className
        )}
        {...props}
      >
        {children}
      </th>
    );
  }


TableHead.displayName = 'TableHead';

/* ─── TableCell ────────────────────────────────────────────────────────────── */

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell = ({
    ref, className, children, ...props }: TableCellProps & { ref?: React.Ref<HTMLTableCellElement> }) => {
    return (
      <td
        ref={ref}
        className={cn(
          'px-4 py-3 text-surface-700 dark:text-surface-300',
          className
        )}
        {...props}
      >
        {children}
      </td>
    );
  }


TableCell.displayName = 'TableCell';
