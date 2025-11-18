import React, { forwardRef } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ children, className = '', style }, ref) => {
    const { theme } = useTheme();

    return (
        <div 
            ref={ref}
            className={`p-6 rounded-xl shadow-lg transition-colors duration-300 ${className}`}
            // Fix: Add support for a style prop to allow overrides.
            style={{ 
                backgroundColor: theme.card,
                ...style 
            }}
        >
            {children}
        </div>
    );
});