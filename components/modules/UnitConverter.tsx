import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/Card';
import { useTheme } from '../../hooks/useTheme';
import { UNIT_DEFINITIONS } from '../../constants';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

// Utility to format the result
const formatResult = (value: number): string => {
    if (isNaN(value)) return '';
    // Format to 6 decimal places and then remove trailing zeros
    const fixed = value.toFixed(6);
    return String(parseFloat(fixed));
};

export const UnitConverter: React.FC = () => {
    const { theme, isDarkMode } = useTheme();

    const categories = Object.keys(UNIT_DEFINITIONS);
    const [selectedCategory, setSelectedCategory] = useState(categories[0]);

    const { units, baseUnit } = useMemo(() => (UNIT_DEFINITIONS as any)[selectedCategory], [selectedCategory]);
    const unitKeys = Object.keys(units);

    const [amount, setAmount] = useState('1');
    const [fromUnit, setFromUnit] = useState(unitKeys[0]);
    const [toUnit, setToUnit] = useState(unitKeys.length > 1 ? unitKeys[1] : unitKeys[0]);
    const [result, setResult] = useState('');

    useEffect(() => {
        // Reset units when category changes
        const newUnitKeys = Object.keys((UNIT_DEFINITIONS as any)[selectedCategory].units);
        setFromUnit(newUnitKeys[0]);
        setToUnit(newUnitKeys.length > 1 ? newUnitKeys[1] : newUnitKeys[0]);
    }, [selectedCategory]);

    useEffect(() => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) {
            setResult('');
            return;
        }

        const from = units[fromUnit];
        const to = units[toUnit];
        
        // When the category changes, the from/to units might be stale for one render.
        // This guard prevents a crash by waiting for the state to be consistent.
        if (!from || !to) {
            return;
        }

        let valueInBase: number;
        
        // Handle temperature differently because it's not a simple factor
        if (selectedCategory === 'Temperature') {
            valueInBase = from.toBase(numAmount);
        } else {
            valueInBase = numAmount * from.toBase;
        }

        let convertedValue: number;
        if (selectedCategory === 'Temperature') {
            convertedValue = to.fromBase(valueInBase);
        } else {
             // toBase is the factor to convert FROM the unit TO the base.
             // So to convert FROM the base TO the unit, we divide.
            convertedValue = valueInBase / to.toBase;
        }

        setResult(formatResult(convertedValue));

    }, [amount, fromUnit, toUnit, selectedCategory, units]);

    const handleSwap = () => {
        setFromUnit(toUnit);
        setToUnit(fromUnit);
    };

    // Fix: Cast the style object to React.CSSProperties to allow for custom CSS properties.
    const commonSelectStyles = {
        borderColor: theme.accent,
        '--tw-ring-color': theme.primary
    } as React.CSSProperties;

    const commonOptionStyles = isDarkMode ? { backgroundColor: theme.card, color: theme.text } : {};

    return (
        <Card>
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.primary }}>Unit Converter</h2>

            <div className="mb-4">
                <label htmlFor="category-select" className="block text-sm font-medium mb-1">Category</label>
                <select 
                    id="category-select"
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border rounded-md bg-transparent dark:border-gray-600 focus:outline-none focus:ring-2"
                    style={commonSelectStyles}
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat} style={commonOptionStyles}>{cat}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-4">
                <div className="flex items-end space-x-2">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">From</label>
                        <select 
                            value={fromUnit} 
                            onChange={(e) => setFromUnit(e.target.value)} 
                            className="w-full p-2 border rounded-md bg-transparent dark:border-gray-600 focus:outline-none focus:ring-2"
                            style={commonSelectStyles}
                        >
                            {unitKeys.map(key => (
                                <option key={key} value={key} style={commonOptionStyles}>
                                    {`${units[key].name} (${units[key].symbol})`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex justify-center">
                    <Button onClick={handleSwap} className="p-2 rounded-full" aria-label="Swap units">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </Button>
                </div>

                 <div className="flex items-end space-x-2">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium mb-1">Converted Amount</label>
                        <div 
                            className="p-2 border rounded-md dark:border-gray-600 min-h-[42px] flex items-center font-mono text-lg break-all"
                             style={!isDarkMode ? { backgroundColor: '#e0e0e0', color: theme.text } : {backgroundColor: theme.bg}}
                        >
                            {result}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">To</label>
                         <select 
                            value={toUnit} 
                            onChange={(e) => setToUnit(e.target.value)} 
                            className="w-full p-2 border rounded-md bg-transparent dark:border-gray-600 focus:outline-none focus:ring-2"
                            style={commonSelectStyles}
                        >
                            {unitKeys.map(key => (
                                <option key={key} value={key} style={commonOptionStyles}>
                                    {`${units[key].name} (${units[key].symbol})`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </Card>
    );
};