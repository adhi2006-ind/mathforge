import React from 'react';
import { SwipeableHandlers } from 'react-swipeable'; // --- ADDED ---
import { MODULES, ModuleId } from '../constants';
import { useTheme } from '../hooks/useTheme';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    setActiveModule: (id: ModuleId) => void;
    swipeHandlers: Partial<SwipeableHandlers>; // --- ADDED ---
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, 
    onClose, 
    setActiveModule, 
    swipeHandlers // --- ADDED ---
}) => {
    const { theme } = useTheme();

    const handleModuleClick = (id: ModuleId) => {
        setActiveModule(id);
        onClose();
    };

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />
            
            {/* --- MODIFIED: Added {...swipeHandlers} to this div --- */}
            <div
                {...swipeHandlers} 
                className={`fixed top-0 right-0 h-full w-4/5 max-w-sm z-40 px-8 py-4 transition-transform duration-300 transform flex flex-col ${isOpen ? 'translate-x-3' : 'translate-x-full'}`}
                style={{ backgroundColor: theme.card,opacity: 0.98 }}
            >
                <div className="relative text-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold py-2" style={{ color: theme.primary }}>MODES</h2>
                    <button onClick={onClose} className="absolute top-0 right-0 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="space-y-4 flex-grow overflow-y-auto">
                    {MODULES.map(module => (
                        <button
                            key={module.id}
                            onClick={() => handleModuleClick(module.id)}
                            className="w-full flex items-center justify-start p-4 rounded-lg transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <span className="mr-6" style={{ color: theme.primary }}>{module.icon}</span>
                            <span className="font-medium text-lg">{module.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};