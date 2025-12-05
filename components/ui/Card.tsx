import React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    interactive?: boolean;
    children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, interactive = false, children, ...props }, ref) => (
        <div
            className={clsx(
                'card p-6',
                interactive && 'card-interactive',
                className
            )}
            ref={ref}
            {...props}
        >
            {children}
        </div>
    )
);
Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
    ({ className, title, description, children, ...props }, ref) => (
        <div className={clsx('border-b border-[var(--border)] pb-4 mb-4', className)} ref={ref} {...props}>
            {title && <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>}
            {description && <p className="text-sm text-[var(--text-muted)] mt-1">{description}</p>}
            {children}
        </div>
    )
);
CardHeader.displayName = 'CardHeader';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div className={clsx('py-2', className)} ref={ref} {...props} />
    )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div className={clsx('border-t border-[var(--border)] pt-4 mt-4 flex justify-end gap-2', className)} ref={ref} {...props} />
    )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
