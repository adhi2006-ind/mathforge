
import React, { useState } from 'react';
import { PALETTES } from '../constants';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/Button';

interface ThemeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose }) => {
    const { theme, setPalette, setCustomColors } = useTheme();
    const [customPrimary, setCustomPrimary] = useState(theme.primary);
    const [customAccent, setCustomAccent] = useState(theme.accent);

    if (!isOpen) return null;

    const handleApplyCustom = () => {
        setCustomColors(customPrimary, customAccent);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="rounded-lg shadow-2xl p-6 w-full max-w-md"
                style={{ backgroundColor: theme.card, color: theme.text }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Theme Settings</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="mb-6">
                    <h3 className="font-semibold mb-2">Preset Palettes</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {PALETTES.map(p => (
                            <button key={p.name} onClick={() => setPalette(p)} className="p-2 border rounded-md dark:border-gray-600">
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-5 h-5 rounded-full" style={{backgroundColor: p.colors.primary}}></div>
                                    <div className="w-5 h-5 rounded-full" style={{backgroundColor: p.colors.accent}}></div>
                                </div>
                                <span className="text-xs mt-1 block">{p.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold mb-2">Custom Colors</h3>
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Primary</label>
                            <input 
                                type="color" 
                                value={customPrimary}
                                onChange={(e) => setCustomPrimary(e.target.value)}
                                className="w-full h-10 p-1 border rounded-md dark:border-gray-600"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">Accent</label>
                            <input 
                                type="color" 
                                value={customAccent}
                                onChange={(e) => setCustomAccent(e.target.value)}
                                className="w-full h-10 p-1 border rounded-md dark:border-gray-600"
                            />
                        </div>
                    </div>
                    <Button onClick={handleApplyCustom} className="w-full mt-4">Apply Custom Colors</Button>
                </div>
            </div>
        </div>
    );
};
