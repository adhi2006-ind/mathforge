
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Theme, Palette } from '../types';
import { PALETTES } from '../constants';

interface ThemeContextType {
    theme: Theme;
    isDarkMode: boolean;
    setPalette: (palette: Palette) => void;
    setCustomColors: (primary: string, accent: string) => void;
    toggleDarkMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const createTheme = (primary: string, accent: string, isDarkMode: boolean): Theme => {
    if (isDarkMode) {
        return {
            primary,
            accent,
            bg: '#121212',
            card: '#1E1E1E',
            text: '#E0E0E0',
            textSecondary: '#A0A0A0',
        };
    }
    return {
        primary,
        accent,
        bg: '#F5F5F5',
        card: '#FFFFFF',
        text: '#212121',
        textSecondary: '#757575',
    };
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [primaryColor, setPrimaryColor] = useState(PALETTES[0].colors.primary);
    const [accentColor, setAccentColor] = useState(PALETTES[0].colors.accent);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const savedPrimary = localStorage.getItem('theme-primary');
        const savedAccent = localStorage.getItem('theme-accent');
        const savedDarkMode = localStorage.getItem('theme-dark-mode') === 'true';

        if (savedPrimary) setPrimaryColor(savedPrimary);
        if (savedAccent) setAccentColor(savedAccent);
        setIsDarkMode(savedDarkMode);

        if (savedDarkMode) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = useCallback(() => {
        setIsDarkMode(prev => {
            const newMode = !prev;
            localStorage.setItem('theme-dark-mode', String(newMode));
            if (newMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            return newMode;
        });
    }, []);

    const setPalette = useCallback((palette: Palette) => {
        setPrimaryColor(palette.colors.primary);
        setAccentColor(palette.colors.accent);
        localStorage.setItem('theme-primary', palette.colors.primary);
        localStorage.setItem('theme-accent', palette.colors.accent);
    }, []);

    const setCustomColors = useCallback((primary: string, accent: string) => {
        setPrimaryColor(primary);
        setAccentColor(accent);
        localStorage.setItem('theme-primary', primary);
        localStorage.setItem('theme-accent', accent);
    }, []);

    const theme = useMemo(() => createTheme(primaryColor, accentColor, isDarkMode), [primaryColor, accentColor, isDarkMode]);

    const value = { theme, isDarkMode, setPalette, setCustomColors, toggleDarkMode };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
