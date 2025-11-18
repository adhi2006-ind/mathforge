
import React, { forwardRef } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className = '', style, ...props }, ref) => {
    const { theme } = useTheme();

    return (
        <input
            ref={ref}
            className={`w-full p-2 border rounded-md bg-transparent focus:outline-none focus:ring-2 ${className}`}
            style={{
                borderColor: theme.accent,
                color: theme.text,
                '--tw-ring-color': theme.primary,
                ...style
            } as React.CSSProperties}
            {...props}
        />
    );
});