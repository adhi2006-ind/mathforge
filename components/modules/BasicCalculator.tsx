import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useTheme } from '../../hooks/useTheme';
import { safeEvaluate, evaluateScientific } from '../../services/mathService';

export const BasicCalculator: React.FC = () => {
    const [display, setDisplay] = useState('0');
    // Load history from localStorage on initial render
    const [history, setHistory] = useState<string[]>(() => {
        try {
            const savedHistory = localStorage.getItem('calculator-history');
            if (savedHistory) {
                const parsed = JSON.parse(savedHistory);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error("Failed to load calculator history from localStorage.", e);
        }
        return [];
    });
    const [isHistoryVisible, setHistoryVisible] = useState(false);
    const [isScientific, setIsScientific] = useState(false);
    const [isDeg, setIsDeg] = useState(true);
    const { theme, isDarkMode } = useTheme();

    // Save history to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('calculator-history', JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save calculator history to localStorage.", e);
        }
    }, [history]);

    const handleInput = useCallback((value: string) => {
        setDisplay(prev => {
            if (prev === '0' && value !== '.' && !['π', 'e'].includes(value)) return value;
            if (prev === 'Error') return value;
            // Handle implicit multiplication for constants
            if (['π', 'e'].includes(value)) {
                 const lastChar = prev.slice(-1);
                 if (/[0-9)πe]/.test(lastChar)) {
                     return `${prev} * ${value}`;
                 }
            }
            return prev + value;
        });
    }, []);

    const handleOperator = useCallback((op: string) => {
        setDisplay(prev => {
            if (prev === 'Error') return '0';
            const trimmedPrev = prev.trim();
            const lastChar = trimmedPrev.slice(-1);
            if (['+', '-', '*', '/', '^'].includes(lastChar)) {
                return `${trimmedPrev.slice(0, -1).trim()} ${op} `;
            }
            return `${trimmedPrev} ${op} `;
        });
    }, []);
    
    const handleFunction = useCallback((func: string) => {
        setDisplay(prev => {
            if (prev === '0' || prev === 'Error') return `${func}(`;
             const lastChar = prev.slice(-1);
             if (/[0-9)πe]/.test(lastChar)) { // implicit multiplication
                 return `${prev} * ${func}(`;
             }
            return `${prev}${func}(`;
        });
    }, []);

    const calculate = useCallback(() => {
        setDisplay(prev => {
            if (prev === 'Error' || prev.trim() === '' || prev.trim() === '0') return prev;
            try {
                const evalFunction = isScientific ? evaluateScientific : safeEvaluate;
                // @ts-ignore
                const result = evalFunction(prev, isDeg);
                if (result === null || !isFinite(result)) {
                    throw new Error("Invalid calculation");
                }
                const formattedResult = parseFloat(result.toPrecision(12));
                setHistory(h => [`${prev} = ${formattedResult}`, ...h.slice(0, 4)]);
                return String(formattedResult);
            } catch (error) {
                return 'Error';
            }
        });
    }, [isScientific, isDeg]);

    const clear = useCallback(() => setDisplay('0'), []);

    const toggleSign = useCallback(() => {
        setDisplay(prev => {
            if (prev === '0' || prev === 'Error') return prev;
            // This is a simple implementation. A more robust one would parse the last number.
            if (prev.startsWith('-')) {
                return prev.substring(1);
            }
            return `-${prev}`;
        });
    }, []);

    const handleBackspace = useCallback(() => {
        setDisplay(prev => {
            if (prev === 'Error') return '0';
            if (prev.length === 1) return '0';
            if (prev.endsWith(' ')) return prev.slice(0, -3); // Operator with spaces
            return prev.slice(0, -1);
        });
    }, []);
    
    const handleClearHistory = () => {
        setHistory([]);
    };

    const scientificButtons = [
        'sin', 'cos', 'tan', 'log', 'ln', 'e',
        'sqrt', '^', '(', ')', 'π', 'DEG/RAD'
    ];

    const handleButtonClick = (btn: string) => {
        switch (btn) {
            case 'C': clear(); break;
            case '=': calculate(); break;
            case '±': toggleSign(); break;
            case 'DEL': handleBackspace(); break;
            case '+': case '-': case '*': case '/': case '^': handleOperator(btn); break;
            case '%': handleOperator('%'); break;
            case 'sin': case 'cos': case 'tan': case 'log': case 'ln': case 'sqrt': handleFunction(btn); break;
            case 'π': case 'e': handleInput(btn); break;
            default: handleInput(btn); break;
        }
    };
    
    const buttons = [
        { label: 'C', type: 'function' }, { label: '±', type: 'function' }, { label: '%', type: 'function' }, { label: 'DEL', type: 'function' },
        { label: '7', type: 'number' },   { label: '8', type: 'number' },   { label: '9', type: 'number' },   { label: '/', type: 'operator' },
        { label: '4', type: 'number' },   { label: '5', type: 'number' },   { label: '6', type: 'number' },   { label: '*', type: 'operator' },
        { label: '1', type: 'number' },   { label: '2', type: 'number' },   { label: '3', type: 'number' },   { label: '-', type: 'operator' },
        { label: '0', type: 'number', span: 2 }, { label: '.', type: 'number' }, { label: '+', type: 'operator' },
    ];


    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const { key } = event;
            if ((key >= '0' && key <= '9') || key === '.' || key === '(' || key === ')') {
                event.preventDefault();
                handleInput(key);
            } else if (['+', '-', '*', '/', '^'].includes(key)) {
                event.preventDefault();
                handleOperator(key);
            } else if (key === 'Enter' || key === '=') {
                event.preventDefault();
                calculate();
            } else if (key === 'Escape') {
                event.preventDefault();
                clear();
            } else if (key === 'Backspace') {
                event.preventDefault();
                handleBackspace();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleInput, handleOperator, calculate, clear, handleBackspace]);

    return (
        <Card>
            
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>
                    {isScientific ? 'Scientific' : 'Basic'} Calculator
                </h2>
                <Button 
                    onClick={() => setIsScientific(!isScientific)} 
                    className="text-xs px-2 py-1"
                    aria-label={`Switch to ${isScientific ? 'basic' : 'scientific'} mode`}
                    >
                    {isScientific ? 'BASIC MODE' : 'SCIENTIFIC MODE'}
                </Button>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded-lg text-right text-4xl font-mono mb-4 break-words min-h-[64px] overflow-x-auto">
                {display}
            </div>
            
            {isScientific && (
                <div className="grid grid-cols-6 gap-2 mb-2">
                    {scientificButtons.map(btn => (
                        <Button
                            key={btn}
                            onClick={() => {
                                if (btn === 'DEG/RAD') {
                                    setIsDeg(!isDeg);
                                } else {
                                    handleButtonClick(btn);
                                }
                            }}
                            className="text-sm p-2 py-4 sm:p-2"
                        >
                            {btn === 'DEG/RAD' ? (isDeg ? 'DEG' : 'RAD') : btn}
                        </Button>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-4 gap-2">
                {buttons.map((btn) => {
                    const style: React.CSSProperties = {
                        border: `1px solid ${theme.accent}`,
                    };
                    let textColor: string;
                    let bgColor: string;

                    if (btn.type === 'operator') {
                        bgColor = theme.primary;
                        textColor = 'white';
                    } else { // Handles 'number' and 'function'
                        bgColor = theme.card;
                        textColor = isDarkMode ? '#FFFFFF' : theme.text;
                    }
                    
                    style.backgroundColor = bgColor;
                    style.color = textColor;

                    return (
                        <Button
                            key={btn.label}
                            onClick={() => handleButtonClick(btn.label)}
                            className={`text-2xl p-4 py-6 sm:p-4 rounded-lg ${btn.span ? `col-span-${btn.span}` : ''}`}
                            style={style}
                        >
                            {btn.label}
                        </Button>
                    );
                })}
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
                 <Button
                    onClick={() => handleButtonClick('=')}
                    className="text-2xl p-4 py-6 sm:p-4 rounded-lg col-span-4"
                    style={{ 
                        backgroundColor: theme.primary,
                        color: 'white',
                        border: `1px solid ${theme.accent}`
                    }}
                >
                    =
                </Button>
            </div>

            <div className="mt-4">
                <button onClick={() => setHistoryVisible(!isHistoryVisible)} className="font-semibold" style={{color: theme.accent}}>
                    {isHistoryVisible ? 'Hide' : 'Show'} History
                </button>
                {isHistoryVisible && (
                    <div className="relative mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-sm space-y-1 text-gray-900 dark:text-gray-100">
                        {history.length > 0 && (
                            <button
                                onClick={handleClearHistory}
                                className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                aria-label="Clear history"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                        {history.length > 0 ? history.map((item, i) => <p key={i}>{item}</p>) : <p>No history yet.</p>}
                    </div>
                )}
            </div>
        </Card>
    );
};