import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface ZoomSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const ZoomSlider: React.FC<ZoomSliderProps> = ({ label, className = '', ...props }) => {
    const { theme } = useTheme();

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <label htmlFor="zoom-slider" className="text-sm font-medium">{label}</label>
            <input
                id="zoom-slider"
                type="range"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 zoom-slider"
                {...props}
            />
            <style>{`
                .zoom-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    background: ${theme.primary};
                    border-radius: 50%;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }
                .zoom-slider::-webkit-slider-thumb:hover {
                    background: ${theme.accent};
                }

                .zoom-slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    background: ${theme.primary};
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                    transition: background-color 0.2s ease;
                }
                .zoom-slider::-moz-range-thumb:hover {
                    background: ${theme.accent};
                }
            `}</style>
        </div>
    );
};
