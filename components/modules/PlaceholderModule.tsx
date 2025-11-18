
import React from 'react';
import { Card } from '../ui/Card';
import { useTheme } from '../../hooks/useTheme';

interface PlaceholderModuleProps {
    title: string;
}

export const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({ title }) => {
    const { theme } = useTheme();

    return (
        <Card>
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold mb-2" style={{ color: theme.primary }}>{title}</h2>
                <p style={{ color: theme.textSecondary }}>This module is under construction.</p>
            </div>
        </Card>
    );
};
