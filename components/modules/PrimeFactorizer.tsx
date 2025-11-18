import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { primeFactorize } from '../../services/mathService';

interface FactorizationResult {
    number: number;
    factors: number[];
}

export const PrimeFactorizer: React.FC = () => {
    const { theme } = useTheme();
    const [numberStr, setNumberStr] = useState<string>('');
    const [result, setResult] = useState<FactorizationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFactorize = useCallback((): void => {
        setError(null);
        setResult(null);

        if (!numberStr.trim()) {
            setError("Please enter a number.");
            return;
        }

        const num: number = Number(numberStr);

        if (isNaN(num)) {
            setError("Invalid input. Please enter a valid integer.");
            return;
        }

        if (num < 2) {
            setError("Please enter an integer greater than 1.");
            return;
        }

        try {
            const factors: number[] = primeFactorize(num);
            setResult({ number: num, factors });
        } catch (e: any) {
            setError(e.message);
        }
    }, [numberStr]);
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            handleFactorize();
        }
    };

    // Function to get all factors (divisors) of a number
    const getAllFactors = useCallback((num: number): number[] => {
        const factors: number[] = [];
        const sqrt: number = Math.sqrt(num);
        
        for (let i = 1; i <= sqrt; i++) {
            if (num % i === 0) {
                factors.push(i);
                if (i !== num / i) {
                    factors.push(num / i);
                }
            }
        }
        
        // Sort factors in ascending order
        return factors.sort((a, b) => a - b);
    }, []);

    const exponentialFormJsx = useMemo((): React.ReactNode | null => {
        if (!result || result.factors.length <= 1) {
            return null;
        }

        const factorGroups: Map<number, number> = new Map();
        result.factors.forEach((factor: number) => {
            factorGroups.set(factor, (factorGroups.get(factor) || 0) + 1);
        });

        const parts: React.ReactNode[] = [];
        const iterator = factorGroups.entries();
        let current = iterator.next();

        while (!current.done) {
            const [factor, count] = current.value;

            if (count === 1) {
                parts.push(<React.Fragment key={factor}>{factor}</React.Fragment>);
            } else {
                parts.push(
                    <React.Fragment key={factor}>
                        {factor}<sup>{count}</sup>
                    </React.Fragment>
                );
            }

            current = iterator.next();
            if (!current.done) {
                parts.push(' × ');
            }
        }
        
        if (parts.length === 0) return null;

        return <>{parts}</>;
    }, [result]);

    // Get all factors for the current result
    const allFactors: number[] = useMemo((): number[] => {
        if (!result) return [];
        return getAllFactors(result.number);
    }, [result, getAllFactors]);

    // Get factor pairs for display
    const factorPairs = useMemo((): string[] => {
        if (!allFactors.length) return [];
        const pairs: string[] = [];
        const halfLength: number = Math.ceil(allFactors.length / 2);
        
        for (let i = 0; i < halfLength; i++) {
            const factor1: number = allFactors[i];
            const factor2: number = allFactors[allFactors.length - 1 - i];
            pairs.push(`${factor1} × ${factor2}`);
        }
        
        return pairs;
    }, [allFactors]);

    return (
        <Card>
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.primary }}>
                Prime Factorizer
            </h2>
            <p className="mb-4" style={{ color: theme.textSecondary }}>
                Finds the prime factors and all divisors of an integer.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
                <Input
                    type="text"
                    inputMode="numeric"
                    value={numberStr}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setNumberStr(e.target.value.replace(/[^0-9]/g, ''))
                    }
                    onKeyPress={handleKeyPress}
                    placeholder="Enter an integer > 1"
                    className="flex-grow p-3 text-lg"
                    aria-label="Number to factorize"
                />
                <Button onClick={handleFactorize} className="w-full sm:w-auto px-5 py-3 text-lg">
                    Factorize
                </Button>
            </div>

            {error && (
                <p className="text-red-500 font-semibold text-center mt-4">
                    {error}
                </p>
            )}

            {result && (
                <div className="mt-6 space-y-4">
                    {/* Prime Factors Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-center" style={{ color: theme.textSecondary }}>
                            Prime factors of <span className="font-mono" style={{ color: theme.primary }}>{result.number}</span>
                        </h3>
                        <div className="p-4 rounded-lg text-center" style={{ backgroundColor: theme.bg }}>
                            <p className="text-xl sm:text-2xl font-mono break-words">
                                {result.factors.length > 1 ? result.factors.join(' × ') : `${result.number} is prime.`}
                            </p>
                        </div>
                    </div>

                    {/* Exponential Form Section */}
                    {exponentialFormJsx && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-center" style={{ color: theme.textSecondary }}>
                                Exponential Form
                            </h3>
                            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: theme.bg }}>
                                <p className="text-xl sm:text-2xl font-mono break-words">
                                    {exponentialFormJsx}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* All Factors Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-center" style={{ color: theme.textSecondary }}>
                            All Factors ({allFactors.length})
                        </h3>
                        <div className="p-4 rounded-lg" style={{ backgroundColor: theme.bg }}>
                            <div className="flex flex-wrap justify-center gap-2">
                                {allFactors.map((factor: number) => (
                                    <span
                                        key={factor}
                                        className="inline-block px-3 py-2 rounded-md font-mono text-lg border"
                                        style={{
                                            backgroundColor: theme.card,
                                            borderColor: theme.accent,
                                            color: theme.text,
                                        }}
                                    >
                                        {factor}
                                    </span>
                                ))}
                            </div>
                            <p className="text-center mt-3 text-sm" style={{ color: theme.textSecondary }}>
                                Total: {allFactors.length} factors
                            </p>
                        </div>
                    </div>

                    {/* Factor Pair Summary */}
                    {factorPairs.length > 0 && (
                        <div className="text-center">
                            <p className="text-sm" style={{ color: theme.textSecondary }}>
                                Factor pairs: {factorPairs.join(', ')}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};