
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/Card';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { 
    matrixAdd, 
    matrixSubtract, 
    matrixMultiply,
    determinant,
    matrixInverse,
    matrixDivide,
    solveLinearSystem,
    eigen2x2,
    adjoint,
    minorMatrix,
    cofactorMatrix,
    transpose
} from '../../services/mathService';

type StringMatrix = string[][];
type NumberMatrix = number[][];

const createStringMatrix = (rows: number, cols: number): StringMatrix => Array(rows).fill('0').map(() => Array(cols).fill('0'));

interface MatrixGridProps {
    matrix: StringMatrix | NumberMatrix;
    onChange?: (r: number, c: number, v: string) => void;
    onBlur?: (r: number, c: number) => void;
    onIncrement?: (r: number, c: number) => void;
    onDecrement?: (r: number, c: number) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => void;
    readOnly?: boolean;
    inputStyle?: React.CSSProperties;
}

const StepperButton: React.FC<{ onClick: () => void, 'aria-label': string, children: React.ReactNode }> = ({ onClick, ...props }) => (
    <button
        onClick={onClick}
        tabIndex={-1}
        className="flex items-center justify-center h-1/2 w-5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm"
        aria-label={props['aria-label']}
    >
        {props.children}
    </button>
);

const MatrixGrid: React.FC<MatrixGridProps> = ({ matrix, onChange, onBlur, onIncrement, onDecrement, onKeyDown, readOnly = false, inputStyle }) => {
    const rows = matrix.length;
    if (rows === 0) return null;
    const cols = matrix[0]?.length ?? 0;

    return (
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {matrix.map((row, r) =>
                row.map((val, c) => (
                    <div key={`${r}-${c}`} className="relative group">
                        <Input
                            type="text"
                            inputMode={readOnly ? "text" : "decimal"}
                            className="w-full text-center p-1"
                            value={readOnly ? Number(val).toPrecision(4) : (val as string)}
                            onChange={(e) => onChange && onChange(r, c, e.target.value)}
                            onBlur={() => onBlur && onBlur(r, c)}
                            onFocus={(e) => !readOnly && e.target.select()}
                            onKeyDown={(e) => onKeyDown && onKeyDown(e, r, c)}
                            readOnly={readOnly}
                            style={inputStyle}
                        />
                         {!readOnly && (
                            <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                                <StepperButton onClick={() => onIncrement?.(r, c)} aria-label={`Increment row ${r+1} column ${c+1}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                                </StepperButton>
                                <StepperButton onClick={() => onDecrement?.(r, c)} aria-label={`Decrement row ${r+1} column ${c+1}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                </StepperButton>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export const MatrixCalculator: React.FC = () => {
    const { theme, isDarkMode } = useTheme();
    
    const [rowsAStr, setRowsAStr] = useState('2');
    const [colsAStr, setColsAStr] = useState('2');
    const [rowsBStr, setRowsBStr] = useState('2');
    const [colsBStr, setColsBStr] = useState('2');
    
    const [matrixA, setMatrixA] = useState<StringMatrix>(createStringMatrix(2, 2));
    const [matrixB, setMatrixB] = useState<StringMatrix>(createStringMatrix(2, 2));
    const [vectorB, setVectorB] = useState<string[]>(Array(2).fill('0'));

    const [results, setResults] = useState<{ [key: string]: { title: string; result: any } | null }>({});
    const [error, setError] = useState<string | null>(null);

    const [history, setHistory] = useState<{ title: string; result: any }[]>(() => {
        try {
            const saved = localStorage.getItem('matrix-calculator-history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load matrix history from localStorage.", e);
            return [];
        }
    });
    const [isHistoryVisible, setHistoryVisible] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem('matrix-calculator-history', JSON.stringify(history));
        } catch (e) {
            console.error("Failed to save matrix history to localStorage.", e);
        }
    }, [history]);

    const rowsA = parseInt(rowsAStr, 10) || 0;
    const colsA = parseInt(colsAStr, 10) || 0;
    const rowsB = parseInt(rowsBStr, 10) || 0;
    const colsB = parseInt(colsBStr, 10) || 0;

    const showMinorCofactorA = rowsA > 1 && rowsA === colsA;
    const showMinorCofactorB = rowsB > 1 && rowsB === colsB;
    const showMinorCofactorSection = showMinorCofactorA || showMinorCofactorB;

    useEffect(() => {
        const newRows = parseInt(rowsAStr, 10) || 1;
        const newCols = parseInt(colsAStr, 10) || 1;
        setMatrixA(createStringMatrix(newRows, newCols));
        setVectorB(Array(newRows).fill('0'));
    }, [rowsAStr, colsAStr]);

    useEffect(() => {
        const newRows = parseInt(rowsBStr, 10) || 1;
        const newCols = parseInt(colsBStr, 10) || 1;
        setMatrixB(createStringMatrix(newRows, newCols));
    }, [rowsBStr, colsBStr]);
    
    const handleDimChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
        if (value === '' || /^\d*$/.test(value)) {
            setter(value);
        }
    };

    const handleDimBlur = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1) {
            setter('1');
        } else if (num > 8) {
            setter('8');
        } else {
            setter(String(num));
        }
    };

    const handleDimStep = (setter: React.Dispatch<React.SetStateAction<string>>, currentValue: string, step: number) => {
        const num = parseInt(currentValue, 10) || 1;
        let newValue = num + step;
        if (newValue < 1) newValue = 1;
        if (newValue > 8) newValue = 8;
        setter(String(newValue));
    };

    const handleDimKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>, currentValue: string) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleDimStep(setter, currentValue, 1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleDimStep(setter, currentValue, -1);
        }
    };

    const matrixToNumbers = (m: StringMatrix): NumberMatrix => m.map(row => row.map(cell => parseFloat(cell) || 0));
    const vectorToNumbers = (v: string[]): number[] => v.map(cell => parseFloat(cell) || 0);

    const updateMatrix = (setter: React.Dispatch<React.SetStateAction<StringMatrix>>) => (r: number, c: number, v: string) => {
        if (v !== '' && v !== '-' && !/^-?\d*\.?\d*$/.test(v)) return;
        setter(prev => {
            const newMatrix = prev.map(row => [...row]);
            newMatrix[r][c] = v;
            return newMatrix;
        });
    };

    const handleBlur = (setter: React.Dispatch<React.SetStateAction<StringMatrix>>) => (r: number, c: number) => {
        setter(prev => {
            const newMatrix = prev.map(row => [...row]);
            if (newMatrix[r][c] === '' || newMatrix[r][c] === '-') {
                newMatrix[r][c] = '0';
            }
            return newMatrix;
        });
    };
    
    const updateVectorB = (index: number, value: string) => {
        if (value !== '' && value !== '-' && !/^-?\d*\.?\d*$/.test(value)) return;
        setVectorB(prev => {
            const newVector = [...prev];
            newVector[index] = value;
            return newVector;
        });
    };

    const handleVectorBlur = (index: number) => {
        setVectorB(prev => {
            const newVector = [...prev];
            if (newVector[index] === '' || newVector[index] === '-') {
                newVector[index] = '0';
            }
            return newVector;
        });
    };
    
    const handleMatrixValueStep = (setter: React.Dispatch<React.SetStateAction<StringMatrix>>, r: number, c: number, step: number) => {
        setter(prev => {
            const newMatrix = prev.map(row => [...row]);
            const currentVal = parseFloat(newMatrix[r][c]) || 0;
            newMatrix[r][c] = String(currentVal + step);
            return newMatrix;
        });
    };

    const handleMatrixCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<StringMatrix>>, r: number, c: number) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleMatrixValueStep(setter, r, c, 1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleMatrixValueStep(setter, r, c, -1);
        }
    };

    const handleVectorValueStep = (index: number, step: number) => {
        setVectorB(prev => {
            const newVector = [...prev];
            const currentVal = parseFloat(newVector[index]) || 0;
            newVector[index] = String(currentVal + step);
            return newVector;
        });
    };

    const handleVectorCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleVectorValueStep(index, 1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleVectorValueStep(index, -1);
        }
    };

    const performOperation = (op: (...args: any[]) => any, title: string, sectionKey: string, ...args: any[]) => {
        try {
            setError(null);
            const convertedArgs = args.map(arg => {
                if (Array.isArray(arg) && Array.isArray(arg[0])) {
                    return matrixToNumbers(arg as StringMatrix);
                } else if (Array.isArray(arg)) {
                    return vectorToNumbers(arg as string[]);
                }
                return arg;
            });
            const newResult = op(...convertedArgs);
            setResults(prev => ({ ...prev, [sectionKey]: { title, result: newResult } }));
            setHistory(prev => [{ title, result: newResult }, ...prev.slice(0, 19)]);
        } catch (e: any) {
            setError(e.message);
        }
    };

    const clearResult = (key: string) => {
        setResults(prev => ({ ...prev, [key]: null }));
    };

    const renderSingleResult = (item: { title: string; result: any }, isForHistory: boolean = false) => {
        const { title, result } = item;
        if (result === null) return null;
    
        const historyItemStyle = { backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' };
        const historyInputStyle = { color: 'white' };
        const inlineItemStyle = { backgroundColor: isDarkMode ? theme.bg : '#6B7280' };

        const itemStyle = isForHistory ? historyItemStyle : inlineItemStyle;
        const inputStyle = isForHistory ? historyInputStyle : undefined;

        if (title === 'Solution vector x') {
            const vector = result as number[];
            const colMatrix = vector.map(v => [v]);
            const variableNames = ['x', 'y', 'z', 'w', 'a', 'b', 'c', 'd'];
            return (
                 <div>
                    <MatrixGrid matrix={colMatrix} readOnly inputStyle={inputStyle} />
                    <div className="mt-2 p-2 text-center font-mono rounded" style={itemStyle}>
                        {vector.map((val, i) => (
                            <p key={i}>{`${variableNames[i] || `x${i + 1}`} = ${val.toPrecision(4)}`}</p>
                        ))}
                    </div>
                </div>
            );
        }

        if (typeof result === 'number') {
            return <div className="p-4 text-center text-2xl font-mono rounded" style={itemStyle}>{result.toPrecision(4)}</div>;
        } else if (Array.isArray(result) && typeof result[0] !== 'undefined' && Array.isArray(result[0])) {
            return <MatrixGrid matrix={result} readOnly inputStyle={inputStyle} />;
        } else if (Array.isArray(result) && (typeof result[0] === 'number' || result.length === 0)) {
            return (
                <div className="p-4 text-center font-mono rounded" style={itemStyle}>
                    [ {result.map(v => v.toFixed(3)).join(', ')} ]
                </div>
            );
        } else if (result.eigenvalues) {
            return (
                <div className="space-y-2 text-sm">
                    {result.eigenvalues.map((val: any, i: number) => (
                        <div key={i} className="p-2 rounded" style={itemStyle}>
                            <p><b>Eigenvalue (λ{i+1}):</b> <span className="font-mono">{typeof val === 'number' ? val.toPrecision(4) : val}</span></p>
                            <p><b>Eigenvector (v{i+1}):</b> <span className="font-mono">
                                {typeof result.eigenvectors[i] === 'string' 
                                    ? result.eigenvectors[i] 
                                    : `[ ${result.eigenvectors[i].map((v:number) => v.toPrecision(4)).join(', ')} ]`}
                            </span></p>
                        </div>
                    ))}
                </div>
            );
        }
    
        return <p>Could not display result.</p>;
    };

    const ResultBox: React.FC<{
        resultData: { title: string; result: any } | null;
        onClear: () => void;
    }> = ({ resultData, onClear }) => {
        if (!resultData) return null;

        return (
            <div className="mt-3 p-3 rounded-md relative" style={{ backgroundColor: theme.bg }}>
                <button
                    onClick={onClear}
                    className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    aria-label="Clear result"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
                <h4 className="font-semibold mb-2 text-md" style={{ color: theme.primary }}>{resultData.title}</h4>
                {renderSingleResult(resultData)}
            </div>
        );
    };

    return (
        <Card>
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.primary }}>Matrix Calculator</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4">
                <div>
                    <h3 className="font-semibold mb-2 text-center">Matrix A</h3>
                    <div className="flex gap-2 items-center justify-center mb-2">
                        <label className="text-sm">Rows:</label>
                        <div className="relative group w-16">
                            <Input type="text" inputMode="numeric" className="w-full text-center" value={rowsAStr} 
                                onChange={e => handleDimChange(setRowsAStr, e.target.value)} 
                                onBlur={e => handleDimBlur(setRowsAStr, e.target.value)}
                                onKeyDown={e => handleDimKeyDown(e, setRowsAStr, rowsAStr)}
                            />
                            <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                                <StepperButton onClick={() => handleDimStep(setRowsAStr, rowsAStr, 1)} aria-label="Increment rows for Matrix A">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                                </StepperButton>
                                <StepperButton onClick={() => handleDimStep(setRowsAStr, rowsAStr, -1)} aria-label="Decrement rows for Matrix A">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                </StepperButton>
                            </div>
                        </div>
                        <label className="text-sm">Cols:</label>
                        <div className="relative group w-16">
                            <Input type="text" inputMode="numeric" className="w-full text-center" value={colsAStr} 
                                onChange={e => handleDimChange(setColsAStr, e.target.value)} 
                                onBlur={e => handleDimBlur(setColsAStr, e.target.value)}
                                onKeyDown={e => handleDimKeyDown(e, setColsAStr, colsAStr)}
                            />
                            <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                                <StepperButton onClick={() => handleDimStep(setColsAStr, colsAStr, 1)} aria-label="Increment columns for Matrix A">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                                </StepperButton>
                                <StepperButton onClick={() => handleDimStep(setColsAStr, colsAStr, -1)} aria-label="Decrement columns for Matrix A">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                </StepperButton>
                            </div>
                        </div>
                    </div>
                    <MatrixGrid 
                        matrix={matrixA} 
                        onChange={updateMatrix(setMatrixA)} 
                        onBlur={handleBlur(setMatrixA)}
                        onIncrement={(r, c) => handleMatrixValueStep(setMatrixA, r, c, 1)}
                        onDecrement={(r, c) => handleMatrixValueStep(setMatrixA, r, c, -1)}
                        onKeyDown={(e, r, c) => handleMatrixCellKeyDown(e, setMatrixA, r, c)}
                    />
                </div>
                <div>
                    <h3 className="font-semibold mb-2 text-center">Matrix B</h3>
                    <div className="flex gap-2 items-center justify-center mb-2">
                        <label className="text-sm">Rows:</label>
                        <div className="relative group w-16">
                            <Input type="text" inputMode="numeric" className="w-full text-center" value={rowsBStr}
                                onChange={e => handleDimChange(setRowsBStr, e.target.value)}
                                onBlur={e => handleDimBlur(setRowsBStr, e.target.value)}
                                onKeyDown={e => handleDimKeyDown(e, setRowsBStr, rowsBStr)}
                            />
                             <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                                <StepperButton onClick={() => handleDimStep(setRowsBStr, rowsBStr, 1)} aria-label="Increment rows for Matrix B">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                                </StepperButton>
                                <StepperButton onClick={() => handleDimStep(setRowsBStr, rowsBStr, -1)} aria-label="Decrement rows for Matrix B">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                </StepperButton>
                            </div>
                        </div>
                        <label className="text-sm">Cols:</label>
                        <div className="relative group w-16">
                            <Input type="text" inputMode="numeric" className="w-full text-center" value={colsBStr}
                                onChange={e => handleDimChange(setColsBStr, e.target.value)}
                                onBlur={e => handleDimBlur(setColsBStr, e.target.value)}
                                onKeyDown={e => handleDimKeyDown(e, setColsBStr, colsBStr)}
                            />
                            <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                                <StepperButton onClick={() => handleDimStep(setColsBStr, colsBStr, 1)} aria-label="Increment columns for Matrix B">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                                </StepperButton>
                                <StepperButton onClick={() => handleDimStep(setColsBStr, colsBStr, -1)} aria-label="Decrement columns for Matrix B">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                </StepperButton>
                            </div>
                        </div>
                    </div>
                    <MatrixGrid 
                        matrix={matrixB} 
                        onChange={updateMatrix(setMatrixB)} 
                        onBlur={handleBlur(setMatrixB)} 
                        onIncrement={(r, c) => handleMatrixValueStep(setMatrixB, r, c, 1)}
                        onDecrement={(r, c) => handleMatrixValueStep(setMatrixB, r, c, -1)}
                        onKeyDown={(e, r, c) => handleMatrixCellKeyDown(e, setMatrixB, r, c)}
                    />
                </div>
            </div>

            <div className="space-y-4 mt-6">
                <div>
                    <h3 className="font-semibold text-sm uppercase tracking-wider mb-2 border-b pb-1" style={{borderColor: theme.accent, color: theme.textSecondary}}>Basic Operations</h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                        <Button onClick={() => performOperation(matrixAdd, 'Result: A + B', 'basic', matrixA, matrixB)}>A + B</Button>
                        <Button onClick={() => performOperation(matrixSubtract, 'Result: A - B', 'basic', matrixA, matrixB)}>A - B</Button>
                        <Button onClick={() => performOperation(matrixMultiply, 'Result: A × B', 'basic', matrixA, matrixB)}>A × B</Button>
                        <Button onClick={() => performOperation(matrixDivide, 'Result: A × B⁻¹', 'basic', matrixA, matrixB)}>A ÷ B</Button>
                        <Button onClick={() => performOperation(transpose, 'Transpose of A', 'basic', matrixA)}>Aᵀ</Button>
                        <Button onClick={() => performOperation(transpose, 'Transpose of B', 'basic', matrixB)}>Bᵀ</Button>
                    </div>
                    <ResultBox resultData={results.basic} onClear={() => clearResult('basic')} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="font-semibold text-sm uppercase tracking-wider mb-2 border-b pb-1" style={{borderColor: theme.accent, color: theme.textSecondary}}>Advanced Operations (A)</h3>
                         <div className="flex flex-wrap gap-2 justify-center">
                            <Button onClick={() => performOperation(determinant, 'Determinant of A', 'advancedA', matrixA)}>Det(A)</Button>
                            <Button onClick={() => performOperation(matrixInverse, 'Inverse of A', 'advancedA', matrixA)}>A⁻¹</Button>
                            <Button onClick={() => performOperation(adjoint, 'Adjoint of A', 'advancedA', matrixA)}>Adj(A)</Button>
                            <Button onClick={() => performOperation(eigen2x2, 'Eigenvalues/Vectors of A', 'advancedA', matrixA)}>Eigen(A)</Button>
                        </div>
                        <ResultBox resultData={results.advancedA} onClear={() => clearResult('advancedA')} />
                    </div>
                     <div>
                        <h3 className="font-semibold text-sm uppercase tracking-wider mb-2 border-b pb-1" style={{borderColor: theme.accent, color: theme.textSecondary}}>Advanced Operations (B)</h3>
                         <div className="flex flex-wrap gap-2 justify-center">
                            <Button onClick={() => performOperation(determinant, 'Determinant of B', 'advancedB', matrixB)}>Det(B)</Button>
                            <Button onClick={() => performOperation(matrixInverse, 'Inverse of B', 'advancedB', matrixB)}>B⁻¹</Button>
                            <Button onClick={() => performOperation(adjoint, 'Adjoint of B', 'advancedB', matrixB)}>Adj(B)</Button>
                            <Button onClick={() => performOperation(eigen2x2, 'Eigenvalues/Vectors of B', 'advancedB', matrixB)}>Eigen(B)</Button>
                        </div>
                        <ResultBox resultData={results.advancedB} onClear={() => clearResult('advancedB')} />
                    </div>
                </div>
                
                {showMinorCofactorSection && (
                    <div className="mt-4">
                        <h3 className="font-semibold text-sm uppercase tracking-wider mb-2 border-b pb-1 text-center" style={{borderColor: theme.accent, color: theme.textSecondary}}>Minor & Cofactor Matrices</h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {showMinorCofactorA && (
                                <>
                                    <Button onClick={() => performOperation(minorMatrix, 'Minor Matrix of A', 'minorCofactor', matrixA)}>Minor(A)</Button>
                                    <Button onClick={() => performOperation(cofactorMatrix, 'Cofactor Matrix of A', 'minorCofactor', matrixA)}>Cofactor(A)</Button>
                                </>
                            )}
                            {showMinorCofactorB && (
                                <>
                                    <Button onClick={() => performOperation(minorMatrix, 'Minor Matrix of B', 'minorCofactor', matrixB)}>Minor(B)</Button>
                                    <Button onClick={() => performOperation(cofactorMatrix, 'Cofactor Matrix of B', 'minorCofactor', matrixB)}>Cofactor(B)</Button>
                                </>
                            )}
                        </div>
                         <ResultBox resultData={results.minorCofactor} onClear={() => clearResult('minorCofactor')} />
                    </div>
                )}

                <div>
                     <h3 className="font-semibold text-sm uppercase tracking-wider mb-2 border-b pb-1" style={{borderColor: theme.accent, color: theme.textSecondary}}>Solve System of Linear Equations (Ax = B)</h3>
                     <div className="flex justify-center mt-2">
                         <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                             <div>
                                 <p className="text-sm mb-1 text-center" style={{color: theme.textSecondary}}>Vector B</p>
                                 <div className="flex flex-col gap-1 w-24">
                                    {vectorB.map((val, i) => (
                                        <div key={i} className="relative group">
                                            <Input 
                                                type="text"
                                                inputMode="decimal" 
                                                value={val} 
                                                onChange={e => updateVectorB(i, e.target.value)}
                                                onBlur={() => handleVectorBlur(i)}
                                                onFocus={(e) => e.target.select()}
                                                onKeyDown={(e) => handleVectorCellKeyDown(e, i)}
                                                className="w-full text-center"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                                                <StepperButton onClick={() => handleVectorValueStep(i, 1)} aria-label={`Increment vector element ${i+1}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                                                </StepperButton>
                                                <StepperButton onClick={() => handleVectorValueStep(i, -1)} aria-label={`Decrement vector element ${i+1}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                                </StepperButton>
                                            </div>
                                        </div>
                                    ))}
                                 </div>
                             </div>
                             <Button onClick={() => performOperation(solveLinearSystem, 'Solution vector x', 'solve', matrixA, vectorB)}>Solve for x</Button>
                         </div>
                     </div>
                     <ResultBox resultData={results.solve} onClear={() => clearResult('solve')} />
                </div>
            </div>
            
            <div className="mt-6 pt-4 border-t" style={{ borderColor: theme.accent + '40' }}>
                <button onClick={() => setHistoryVisible(!isHistoryVisible)} className="font-semibold text-sm mb-2" style={{ color: theme.accent }}>
                    {isHistoryVisible ? 'Hide History' : 'Show History'}
                </button>
                {isHistoryVisible && (
                    <div className="relative p-3 bg-gray-900 border border-gray-700 rounded-lg space-y-3 max-h-64 overflow-y-auto">
                        {history.length > 0 && (
                            <button
                                onClick={() => setHistory([])}
                                className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                aria-label="Clear history"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                        {history.length > 0 ? history.map((item, i) => (
                            <div key={i} className="p-2 rounded bg-black/20" style={{ color: 'white' }}>
                                <h4 className="font-semibold text-md mb-2" style={{ color: theme.primary }}>{item.title}</h4>
                                {renderSingleResult(item, true)}
                            </div>
                        )) : <p className="text-center italic py-8 text-gray-300 dark:text-gray-400">No history yet.</p>}
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 mt-4 text-center font-semibold">{error}</p>}
        </Card>
    );
};
