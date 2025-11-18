import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { useTheme } from '../../hooks/useTheme';
import { CURRENCY_INFO } from '../../constants';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const CurrencyConverter: React.FC = () => {
    const { theme, isDarkMode } = useTheme();
    
    const currencies = Object.keys(CURRENCY_INFO);
    
    const [amount, setAmount] = useState('1');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('INR');
    const [result, setResult] = useState<string | null>(null);

    const [rates, setRates] = useState<{ [key: string]: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const fetchRates = useCallback(async (base: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);

            if (!response.ok) {
                if (response.status >= 500) {
                    throw new Error('The currency exchange service is currently down. Please try again later.');
                }
                throw new Error(`Network error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (data.result === 'error') {
                const errorType = data['error-type'];
                switch (errorType) {
                    case 'unsupported-code':
                        throw new Error(`The currency code '${base}' is not supported by the API.`);
                    case 'malformed-request':
                        throw new Error('The request to the currency API was malformed.');
                    case 'invalid-key':
                        throw new Error('The API key for the currency service is invalid.');
                    case 'inactive-account':
                        throw new Error('The currency service account is inactive.');
                    case 'quota-reached':
                        throw new Error('API request limit reached. Please try again tomorrow.');
                    default:
                        throw new Error('An unknown API error occurred.');
                }
            }

            setRates(data.rates);
            if (data.time_last_update_unix && typeof data.time_last_update_unix === 'number') {
                const date = new Date(data.time_last_update_unix * 1000);
                if (!isNaN(date.getTime())) {
                    setLastUpdated(date.toLocaleString());
                }
            }
        } catch (e: any) {
            if (e instanceof TypeError && e.message === 'Failed to fetch') {
                setError('Could not connect to the currency service. Check your internet connection.');
            } else {
                setError(e.message);
            }
            setRates(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRates(fromCurrency);
    }, [fromCurrency, fetchRates]);

    useEffect(() => {
        if (!rates) {
            setResult(null);
            return;
        }

        const amt = parseFloat(amount);
        if (isNaN(amt) || amt < 0) {
            setResult('');
            return;
        }

        const conversionRate = rates[toCurrency];

        if (conversionRate) {
            const conversion = amt * conversionRate;
            setResult(conversion.toFixed(4));
        } else {
            setResult('N/A');
        }
    }, [amount, toCurrency, rates]);

    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };
    
    return (
        <Card>
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.primary }}>Currency Converter</h2>
            
            {loading && !rates && <p style={{ color: theme.textSecondary }}>Loading live rates...</p>}
            {error && <p className="text-red-500 mb-2 font-medium">{error}</p>}
            
            <div className={`space-y-4 ${loading && !rates ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-end sm:space-x-2">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" disabled={loading && !rates} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">From</label>
                        <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="w-full p-2 border rounded-md bg-transparent dark:border-gray-600 focus:outline-none focus:ring-2" style={{ borderColor: theme.accent, '--tw-ring-color': theme.primary } as React.CSSProperties} disabled={loading && !rates}>
                            {currencies.map(c => <option key={c} value={c} style={isDarkMode ? { backgroundColor: theme.card, color: theme.text } : {}}>{CURRENCY_INFO[c]} ({c})</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-center pt-5 pb-4">

                    <Button onClick={handleSwap} className="p-4 rounded-full" aria-label="Swap currencies" disabled={loading && !rates}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </Button>
                </div>

                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:items-end sm:space-x-2">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium mb-1">Converted Amount</label>
                        <div 
                            className="p-2 border rounded-md dark:border-gray-600 min-h-[42px] flex items-center font-mono text-lg"
                            style={!isDarkMode ? { backgroundColor: '#e0e0e0', color: theme.text } : { backgroundColor: theme.bg }}
                        >
                            {result !== null ? result : '...'}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">To</label>
                        <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="w-full p-2 border rounded-md bg-transparent dark:border-gray-600 focus:outline-none focus:ring-2" style={{ borderColor: theme.accent, '--tw-ring-color': theme.primary } as React.CSSProperties} disabled={loading && !rates}>
                            {currencies.map(c => <option key={c} value={c} style={isDarkMode ? { backgroundColor: theme.card, color: theme.text } : {}}>{CURRENCY_INFO[c]} ({c})</option>)}
                        </select>
                    </div>
                </div>

                {/* REFRESH BUTTON REMOVED */}

                <div className="flex items-center justify-center space-x-2 pt-2 text-xs" style={{color: theme.textSecondary}}>
                    {lastUpdated && !error && (
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span>Live rates from: {lastUpdated}</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
