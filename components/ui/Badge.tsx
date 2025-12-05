import React from 'react';
import clsx from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
    icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'primary', icon, children, ...props }, ref) => (
        <span
            className={clsx(
                'badge',
                `badge-${variant}`,
                className
            )}
            ref={ref}
            {...props}
        >
            {icon}
            {children}
        </span>
    )
);
Badge.displayName = 'Badge';

export default Badge;
