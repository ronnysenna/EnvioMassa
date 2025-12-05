import React from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    description?: string;
    icon?: React.ReactNode;
}

const iconMap = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant = 'info', title, description, icon, children, ...props }, ref) => (
        <div
            className={clsx(
                'alert',
                `alert-${variant}`,
                className
            )}
            role="alert"
            ref={ref}
            {...props}
        >
            {icon || (iconMap[variant] && <div className="alert-icon">{iconMap[variant]}</div>)}
            <div className="flex-1">
                {title && <div className="font-semibold mb-1">{title}</div>}
                {description && <div className="text-sm opacity-90">{description}</div>}
                {children}
            </div>
        </div>
    )
);
Alert.displayName = 'Alert';

export default Alert;
