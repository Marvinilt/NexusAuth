import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'social';
    loading?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    loading = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    const loadingClass = loading ? 'opacity-70 cursor-not-allowed' : '';

    return (
        <button
            className={`${baseClass} ${variantClass} ${loadingClass} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {!loading && children}
        </button>
    );
}
