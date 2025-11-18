import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
    const { theme } = useTheme();

    return (
        <button
            className={`px-4 py-2 rounded-md font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
            // Fix: Replaced invalid style properties 'focusRingColor' and 'focusRingOffsetColor' with CSS custom properties for Tailwind CSS.
            style={{ 
                backgroundColor: theme.primary,
                color: 'white',
                '--tw-ring-color': theme.accent,
                '--tw-ring-offset-color': theme.bg 
            } as React.CSSProperties}
            {...props}
        >
            {children}
        </button>
    );
};
