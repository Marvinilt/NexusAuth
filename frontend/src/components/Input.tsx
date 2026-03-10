import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="form-group">
                <label>{label}</label>
                <input ref={ref} className={className} {...props} />
                {error && <p className="error-text">{error}</p>}
            </div>
        );
    }
);
Input.displayName = 'Input';
