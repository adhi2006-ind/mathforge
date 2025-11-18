import React, { useState, useMemo, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable'; // --- ADDED ---
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ThemeModal } from './components/ThemeModal';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { MODULES, ModuleId } from './constants';
import { Card } from './components/ui/Card';
import { BackgroundAnimation } from './components/ui/BackgroundAnimation';

const AppContent: React.FC = () => {
    const [activeModule, setActiveModule] = useState<ModuleId>(ModuleId.BASIC_CALCULATOR);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isThemeModalOpen, setThemeModalOpen] = useState(false);

    const { theme, isDarkMode } = useTheme();

    // --- ADDED: Check for Android ---
    const isAndroid = /android/i.test(navigator.userAgent);

    // --- ADDED: Swipe-to-OPEN handlers ---
    const openSidebarHandlers = useSwipeable({
        onSwipedLeft: () => setSidebarOpen(true),
        preventScrollOnSwipe: true, // <-- FIX: Corrected property name
        trackMouse: true // Good for testing on desktop
    });

    // --- ADDED: Swipe-to-CLOSE handlers ---
    const closeSidebarHandlers = useSwipeable({
        onSwipedRight: () => setSidebarOpen(false),
        preventScrollOnSwipe: true, // <-- FIX: Corrected property name
        trackMouse: true // Good for testing on desktop
    });

    const ActiveModuleComponent = useMemo(() => {
        const module = MODULES.find(m => m.id === activeModule);
        return module ? module.component : () => <Card>Module not found</Card>;
    }, [activeModule]);
    
    // ...
    return (
        <div className={`relative flex flex-col h-screen font-sans transition-colors duration-300 overflow-hidden ${isDarkMode ? 'dark' : ''}`} style={{
            height: '100dvh', // Use dvh to fix mobile viewport height issues
            backgroundColor: theme.bg,
            color: theme.text,
        }}>
            
            <BackgroundAnimation />
            <Header 
                onMenuClick={() => setSidebarOpen(true)}
                onThemeClick={() => setThemeModalOpen(true)}
            />
            
            {/* --- MODIFIED: Added swipe handlers to <main> --- */}
            <main 
                {...(isAndroid ? openSidebarHandlers : {})} 
                className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8 pt-20 sm:pt-22 lg:pt-24 flex justify-center items-start z-10"
            >
                <div className="w-full max-w-3xl lg:max-w-4xl">
                    <ActiveModuleComponent />
                </div>
            </main>
            
            {/* --- MODIFIED: Passed swipe handlers to <Sidebar> --- */}
            <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setSidebarOpen(false)}
                setActiveModule={setActiveModule}
                swipeHandlers={isAndroid ? closeSidebarHandlers : {}}
            />

            <ThemeModal 
                isOpen={isThemeModalOpen}
                onClose={() => setThemeModalOpen(false)}
            />
        </div>
    );
};


const App: React.FC = () => {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}

export default App;