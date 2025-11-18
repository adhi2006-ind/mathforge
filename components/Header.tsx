
import React, { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
    onMenuClick: () => void;
    onThemeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onThemeClick }) => {
    const { theme, isDarkMode, toggleDarkMode } = useTheme();
    const [shaking, setShaking] = useState(false);

    const handleToggle = () => {
        toggleDarkMode();
        setShaking(true);
    };
    
    useEffect(() => {
        if(shaking) {
            const timer = setTimeout(() => setShaking(false), 300);
            return () => clearTimeout(timer);
        }
    }, [shaking]);

    return (
        <header 
            className="fixed top-0 left-0 w-full h-16 flex items-center justify-between px-4 sm:px-6 z-20 backdrop-blur-md"
            style={{ 
                backgroundColor: theme.primary,
                boxShadow: isDarkMode ? '0 1px 2px 0 rgba(255, 255, 255, 0.06)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                color: isDarkMode ? theme.text : '#FFFFFF'
            }}
        >
            <div className="text-2xl font-bold" style={{fontFamily: "'Segoe UI', sans-serif"}}>
                MathForge
            </div>
            <div className="flex items-center space-x-2">
                <button
                    onClick={onThemeClick}
                    className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    aria-label="Open theme settings"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <button
                    onClick={handleToggle}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-2xl transition-transform duration-300 ${shaking ? 'animate-shake' : ''} hover:bg-black/10 dark:hover:bg-white/10`}
                    aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                >
                    {isDarkMode ? '🌙' : '☀️'}
                </button>
                <button
                    onClick={onMenuClick}
                    className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    aria-label="Open navigation menu"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </button>
            </div>
             <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </header>
    );
};
