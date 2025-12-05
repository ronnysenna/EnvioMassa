import React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, ...props }, ref) => (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    {label}
                </label>
            )}
            <input
                className={clsx(
                    'w-full px-3 py-2 rounded-md border border-[var(--border)] text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
                    'disabled:bg-[var(--bg-secondary)] disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-[var(--danger)] focus:ring-[var(--danger)]',
                    className
                )}
                ref={ref}
                {...props}
            />
            {error && (
                <p className="text-xs text-[var(--danger)] mt-1">{error}</p>
            )}
            {helperText && !error && (
                <p className="text-xs text-[var(--text-muted)] mt-1">{helperText}</p>
            )}
        </div>
    )
);
Input.displayName = 'Input';

export default Input;
