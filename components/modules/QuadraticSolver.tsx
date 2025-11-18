
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { solveQuadratic } from '../../services/mathService';

interface ResultState {
    roots: string[];
    type: 'real' | 'complex' | 'single';
    discriminant: number;
    vertex: { x: number, y: number };
    axisOfSymmetry: number;
    vertexForm: string;
    coeffs: { a: string, b: string, c: string };
}

const ResultItem: React.FC<{ label: string, value: React.ReactNode, fullWidth?: boolean, className?: string }> = ({ label, value, fullWidth = false, className = '' }) => {
    const { theme } = useTheme();
    return (
        <div className={`${fullWidth ? 'sm:col-span-2' : ''} ${className}`}>
            <p className="font-semibold text-sm" style={{ color: theme.textSecondary }}>{label}</p>
            <div className="text-lg font-mono break-words">{value}</div>
        </div>
    );
};


export const QuadraticSolver: React.FC = () => {
    const { theme } = useTheme();
    const [coeffs, setCoeffs] = useState({ a: '', b: '', c: '' });
    const [result, setResult] = useState<ResultState | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (value === '' || value === '-' || /^-?\d*\.?\d*$/.test(value)) {
            setCoeffs(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSolve = () => {
        setError(null);
        setResult(null);

        const a = parseFloat(coeffs.a);
        const b = parseFloat(coeffs.b);
        const c = parseFloat(coeffs.c);

        if (isNaN(a) || isNaN(b) || isNaN(c)) {
            setError('Please enter valid numbers for all coefficients.');
            return;
        }

        try {
            const solution = solveQuadratic(a, b, c);
            setResult({ ...solution, coeffs });
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSolve();
        }
    };
    
    const renderEquation = (r: { coeffs: { a: string, b: string, c: string } }) => {
        const { a, b, c } = r.coeffs;
        // This regex handles " + -5" -> " - 5"
        return `${a}x² + ${b}x + ${c} = 0`.replace(/\+ -/g, '- ');
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>Quadratic Solver</h2>
            </div>
            <p className="mb-4" style={{ color: theme.textSecondary }}>Solves equations of the form ax² + bx + c = 0</p>
            
            <div className="flex items-center gap-2 mb-4">
                <Input name="a" value={coeffs.a} onChange={handleInputChange} onKeyPress={handleKeyPress} placeholder="a" className="flex-1 text-center" aria-label="Coefficient a" />
                <span className="font-bold text-xl">x² +</span>
                <Input name="b" value={coeffs.b} onChange={handleInputChange} onKeyPress={handleKeyPress} placeholder="b" className="flex-1 text-center" aria-label="Coefficient b" />
                <span className="font-bold text-xl">x +</span>
                <Input name="c" value={coeffs.c} onChange={handleInputChange} onKeyPress={handleKeyPress} placeholder="c" className="flex-1 text-center" aria-label="Coefficient c" />
                <span className="font-bold text-xl">= 0</span>
            </div>

            <Button onClick={handleSolve} className="w-full">Solve</Button>

            {error && <p className="text-red-500 font-semibold text-center mt-4">{error}</p>}

            {result && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-center">
                        Analysis of <span style={{color: theme.primary}} className="font-mono">{renderEquation(result)}</span>
                    </h3>
                    <div className="p-4 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-center sm:text-left" style={{ backgroundColor: theme.bg }}>
                        <ResultItem 
                            label="Roots (x)" 
                            value={
                                <div className="text-xl">
                                {result.type === 'single' ? `x = ${result.roots[0]}` :
                                (
                                    <>
                                        <p>x₁ = {result.roots[0]}</p>
                                        <p>x₂ = {result.roots[1]}</p>
                                    </>
                                )}
                                </div>
                            } 
                            fullWidth 
                        />
                        
                        <ResultItem 
                            label="Nature of Roots" 
                            value={<span className="capitalize">{
                                result.type === 'single' ? 'One Real Root (Repeated)' : 
                                (result.type === 'real' ? 'Two Distinct Real Roots' : 'Two Complex Roots')
                            }</span>}
                        />

                        <ResultItem label="Discriminant (Δ)" value={result.discriminant.toPrecision(4)} />
                        
                        <ResultItem label="Vertex (h, k)" value={`(${result.vertex.x.toPrecision(4)}, ${result.vertex.y.toPrecision(4)})`} />

                        <ResultItem label="Axis of Symmetry" value={`x = ${result.axisOfSymmetry.toPrecision(4)}`} />

                        <ResultItem label="Standard Form" value={renderEquation(result)} fullWidth />
                        <ResultItem label="Vertex Form" value={result.vertexForm} fullWidth />

                    </div>
                </div>
            )}
        </Card>
    );
};
