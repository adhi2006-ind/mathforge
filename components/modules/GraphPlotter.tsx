import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { useTheme } from '../../hooks/useTheme';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { parseFunction } from '../../services/mathService';

// --- Interfaces ---
interface PlottedFunction {
    id: string;
    funcStr: string;
    func: (x: number) => number | null;
    color: string;
}
interface Point {
    x: number;
    y: number;
    label: string;
}

// --- Constants ---
const POINT_RADIUS = 5;
const CLICK_THRESHOLD = 15; // pixels to detect click near a line or point
const ZOOM_FACTOR = 1.2;
const LONG_PRESS_DELAY = 300; // ms
const PLOT_COLORS = ['#3B82F6', '#EF4444', '#22C55E', '#F97316', '#8B5CF6', '#14B8A6'];
const FUNCTIONS_LIST = [
    'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 
    'sinh', 'cosh', 'tanh', 'sec', 'csc', 'cot', 
    'asec', 'acsc', 'acot', 'sqrt', 'cbrt', 'abs', 
    'sign', 'log', 'ln', 'log10', 'log2', 'exp', 
    'pow', 'ceil', 'floor', 'round', 'fact'
];


// --- Helper Functions ---

const getGridStep = (zoom: number): { step: number; precision: number } => {
    const targetSpacingInUnits = 80 / zoom;
    const powerOf10 = Math.pow(10, Math.floor(Math.log10(targetSpacingInUnits)));
    const magnitude = targetSpacingInUnits / powerOf10;

    let step;
    if (magnitude < 1.5) step = powerOf10;
    else if (magnitude < 3.5) step = 2 * powerOf10;
    else if (magnitude < 7.5) step = 5 * powerOf10;
    else step = 10 * powerOf10;
    
    const precision = Math.max(0, Math.ceil(-Math.log10(step)));
    return { step, precision };
};

const getRadianGridStep = (zoom: number): { step: number; precision: number } => {
    const targetSpacingInUnits = 80 / zoom;
    let bestStep = Math.PI;
    let minDiff = Infinity;

    // Search for the best step by scaling PI by powers of 2
    for (let i = -10; i <= 10; i++) {
        const factor = Math.pow(2, i);
        const candidate = Math.PI * factor;
        if (candidate <= 0) continue;
        const diff = Math.abs(candidate - targetSpacingInUnits);
        if (diff < minDiff) {
            minDiff = diff;
            bestStep = candidate;
        }
    }
    // Check if half the step is a better fit, allowing for π/2, π/4 etc.
    if (Math.abs((bestStep / 2) - targetSpacingInUnits) < Math.abs(bestStep - targetSpacingInUnits)) {
        bestStep /= 2;
    }
    
    return { step: bestStep, precision: 0 };
};


const getPointPrecision = (zoom: number): number => {
    if (zoom <= 0) return 2;
    return Math.max(2, Math.ceil(Math.log10(zoom / 50)) + 2);
};

// Formats a number as a fraction or multiple of PI
const formatAsPi = (value: number): string => {
    if (Math.abs(value) < 1e-9) return '0';
    const multiple = value / Math.PI;

    const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : Math.abs(a);

    const maxDenominator = 64; 

    let best_n = Math.round(multiple);
    let best_d = 1;
    let min_error = Math.abs(multiple - best_n);

    if (min_error < 1e-9) {
        if (best_n === 1) return 'π';
        if (best_n === -1) return '-π';
        if (best_n === 0) return '0';
        return `${best_n}π`;
    }

    for (let d = 2; d <= maxDenominator; d++) {
        const n = Math.round(multiple * d);
        if (n === 0) continue;
        const error = Math.abs(multiple - n / d);
        if (error < min_error) {
            min_error = error;
            best_n = n;
            best_d = d;
        }
    }
    
    const commonDivisor = gcd(best_n, best_d);
    const n = best_n / commonDivisor;
    const d = best_d / commonDivisor;
    
    const sign = n < 0 ? '-' : '';
    const absN = Math.abs(n);

    if (d === 1) { // Simplified to an integer
        if (absN === 1) return `${sign}π`;
        return `${sign}${absN}π`;
    }
    
    const nStr = absN === 1 ? '' : absN.toString();
    return `${sign}${nStr}π/${d}`;
};

// --- Help Modal Component ---
const HelpModal: React.FC<{ onClose: () => void; theme: any }> = ({ onClose, theme }) => {
    const sections = {
        "Operators": ['+', '-', '*', '/', '^ (power)'],
        "Constants": ['pi', 'e'],
        "Functions": [
            'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 
            'sinh', 'cosh', 'tanh', 
            'sec', 'csc', 'cot', 'asec', 'acsc', 'acot',
            'sqrt', 'cbrt', 'abs', 'sign',
            'log' /* (base,x) */, 'ln', 'log10', 'log2',
            'exp', 'pow', 'ceil', 'floor', 'round', 'fact'
        ],
        "Implicit Multiplication": [
            '2x -> 2*x',
            '2sin(x) -> 2*sin(x)',
            '(x+1)(x-1) -> (x+1)*(x-1)',
            'x(x+1) -> x*(x+1)'
        ],
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="rounded-lg shadow-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
                style={{ backgroundColor: theme.card, color: theme.text }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold" style={{color: theme.primary}}>Syntax Help</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                {Object.entries(sections).map(([title, items]) => (
                    <div key={title} className="mb-4">
                        <h3 className="font-semibold text-lg mb-2" style={{color: theme.textSecondary}}>{title}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm font-mono">
                            {items.map(item => <div key={item} className="p-2 rounded-md" style={{backgroundColor: theme.bg}}>{item}</div>)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Main Component ---
export const GraphPlotter: React.FC = () => {
    const { theme, isDarkMode } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const functionsListRef = useRef<HTMLDivElement | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const functionInputRef = useRef<HTMLInputElement>(null);
    const functionPaletteRef = useRef<HTMLDivElement>(null);


    // State
    const [functionInput, setFunctionInput] = useState('sin(x)');
    const [plottedFunctions, setPlottedFunctions] = useState<PlottedFunction[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [pointError, setPointError] = useState<string | null>(null);

    const [points, setPoints] = useState<Point[]>([]);
    const [zoom, setZoom] = useState(50);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [coordinateStr, setCoordinateStr] = useState('');

    const [isRadianMode, setIsRadianMode] = useState(false);
    const [isFollowLocked, setIsFollowLocked] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isFunctionPaletteOpen, setIsFunctionPaletteOpen] = useState(false);
    const [isTouchInteractable, setIsTouchInteractable] = useState(false);
    const [isGraphInteractionOn, setIsGraphInteractionOn] = useState(false);
    
    // Color Picker State
    const [editingColorId, setEditingColorId] = useState<string | null>(null);
    const [tempColor, setTempColor] = useState<string>('');
    const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);
    
    // Refs for smooth interaction
    const panRef = useRef(pan);
    const zoomRef = useRef(zoom);
    const isPanning = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false);
    const mousePosRef = useRef<{ x: number; y: number } | null>(null);
    const hoveredPointRef = useRef<Point | null>(null);
    const hoveredExtremumRef = useRef<Point | null>(null);
    const zoomIntervalRef = useRef<number | null>(null);
    const zoomTimeoutRef = useRef<number | null>(null);
    const colorIndexRef = useRef(0);
    const followPointRef = useRef<{ x: number; y: number; color: string; coords: string; funcId: string; } | null>(null);
    const pinchInfo = useRef<{ lastDistance: number | null; lastCenter: { x: number; y: number } | null; }>({ lastDistance: null, lastCenter: null });

    // Keep refs updated with the latest state for event listeners
    useEffect(() => {
        zoomRef.current = zoom;
    }, [zoom]);
    useEffect(() => {
        panRef.current = pan;
    }, [pan]);

    const pointPrecision = getPointPrecision(zoom);

    const getNextColor = useCallback(() => {
        const color = PLOT_COLORS[colorIndexRef.current];
        colorIndexRef.current = (colorIndexRef.current + 1) % PLOT_COLORS.length;
        return color;
    }, []);

    // Memoized calculation for local extrema
    const extrema = useMemo((): { [id: string]: Point[] } => {
        const canvas = canvasRef.current;
        if (!canvas) return {};
        const { width } = canvas.getBoundingClientRect();
        const origin = { x: width / 2 + pan.x };
        const newExtrema: { [id: string]: Point[] } = {};

        plottedFunctions.forEach(pf => {
            newExtrema[pf.id] = [];
            const func = pf.func;
            const step = 1 / zoom;

            for (let px = 1; px < width - 1; px++) {
                const x = (px - origin.x) / zoom;
                const y = func(x);
                if (y === null || !isFinite(y)) continue;

                const prevY = func(x - step);
                const nextY = func(x + step);

                if (prevY !== null && nextY !== null && isFinite(prevY) && isFinite(nextY)) {
                    const isMax = y > prevY && y > nextY;
                    const isMin = y < prevY && y < nextY;
                    if (isMax || isMin) {
                        const xLabel = isRadianMode
                            ? formatAsPi(x)
                            : x.toFixed(pointPrecision);
                        newExtrema[pf.id].push({ x, y, label: `(${xLabel}, ${y.toFixed(pointPrecision)})` });
                    }
                }
            }
        });
        return newExtrema;
    }, [plottedFunctions, pan, zoom, pointPrecision, isRadianMode]);

    // --- Drawing Logic ---
    const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = theme.card;
        ctx.fillRect(0, 0, width, height);

        const currentZoom = zoomRef.current;
        const currentPan = panRef.current;
        const origin = { x: width / 2 + currentPan.x, y: height / 2 + currentPan.y };
        const crisp = (val: number) => Math.floor(val) + 0.5;

        // Grid, Axes, and Labels (with Radian Mode)
        const { step: majorStep, precision: labelPrecision } = isRadianMode ? getRadianGridStep(currentZoom) : getGridStep(currentZoom);
        const minorStep = majorStep / 5;
        const majorGridStepPx = majorStep * currentZoom;
        const minorGridStepPx = minorStep * currentZoom;

        const minorGridColor = isDarkMode ? '#2D2D2D' : '#F0F0F0';
        const majorGridColor = isDarkMode ? '#404040' : '#E0E0E0';
        const axisColor = isDarkMode ? '#666666' : '#BDBDBD';

        ctx.lineWidth = 1;
        ctx.font = `12px sans-serif`;

        // Draw Minor Grid
        if (minorGridStepPx > 5) {
            ctx.strokeStyle = minorGridColor;
            ctx.beginPath();
            for (let x = origin.x % minorGridStepPx; x < width; x += minorGridStepPx) {
                ctx.moveTo(crisp(x), 0); ctx.lineTo(crisp(x), height);
            }
            for (let y = origin.y % minorGridStepPx; y < height; y += minorGridStepPx) {
                ctx.moveTo(0, crisp(y)); ctx.lineTo(width, crisp(y));
            }
            ctx.stroke();
        }

        // Draw Major Grid
        ctx.strokeStyle = majorGridColor;
        ctx.beginPath();
        for (let x = origin.x % majorGridStepPx; x < width; x += majorGridStepPx) {
            ctx.moveTo(crisp(x), 0); ctx.lineTo(crisp(x), height);
        }
        for (let y = origin.y % majorGridStepPx; y < height; y += majorGridStepPx) {
            ctx.moveTo(0, crisp(y)); ctx.lineTo(width, crisp(y));
        }
        ctx.stroke();

        // Draw Axes
        ctx.strokeStyle = axisColor;
        ctx.beginPath();
        if (origin.x >= 0 && origin.x <= width) {
            ctx.moveTo(crisp(origin.x), 0); ctx.lineTo(crisp(origin.x), height);
        }
        if (origin.y >= 0 && origin.y <= height) {
            ctx.moveTo(0, crisp(origin.y)); ctx.lineTo(width, crisp(origin.y));
        }
        ctx.stroke();
        
        // Draw Labels
        ctx.fillStyle = theme.textSecondary; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let i = Math.floor(-origin.x / majorGridStepPx); origin.x + i * majorGridStepPx < width; i++) {
            const x = origin.x + i * majorGridStepPx;
            const value = i * majorStep;
            if (Math.abs(value) > 1e-9) {
                const label = isRadianMode ? formatAsPi(value) : value.toFixed(labelPrecision);
                ctx.fillText(label, x, Math.min(height - 20, Math.max(20, origin.y + 15)));
            }
        }
        ctx.textAlign = 'right';
        for (let i = Math.floor(-origin.y / majorGridStepPx); origin.y + i * majorGridStepPx < height; i++) {
            const y = origin.y + i * majorGridStepPx;
            const value = -i * majorStep;
            if (Math.abs(value) > 1e-9) ctx.fillText(value.toFixed(labelPrecision), Math.max(20, Math.min(width - 20, origin.x - 10)), y);
        }
        ctx.textAlign = 'right'; ctx.textBaseline = 'top';
        ctx.fillText('0', origin.x - 5, origin.y + 5);

        // --- Function Plots ---
        plottedFunctions.forEach(pf => {
            ctx.strokeStyle = pf.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            let lastY: number | null = null;
            for (let px = 0; px < width; px++) {
                const x = (px - origin.x) / currentZoom;
                const y = pf.func(x);
                if (y !== null && isFinite(y)) {
                    const py = origin.y - y * currentZoom;
                    if (lastY !== null && Math.abs(y - lastY) * currentZoom > height) {
                        ctx.stroke();
                        ctx.save();
                        ctx.strokeStyle = theme.accent; ctx.globalAlpha = 0.7; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
                        ctx.beginPath(); ctx.moveTo(px - 0.5, 0); ctx.lineTo(px - 0.5, height); ctx.stroke();
                        ctx.restore();
                        ctx.beginPath();
                    }
                    ctx.lineTo(px, py);
                    lastY = y;
                } else {
                    ctx.stroke(); ctx.beginPath(); lastY = null;
                }
            }
            ctx.stroke();
        });
        
        // --- Legend ---
        if (plottedFunctions.length > 0) {
            const legendX = 15;
            const legendY = 15;
            const padding = 8;
            const lineHeight = 20;
            const swatchSize = 12;
            const textGap = 8;
            
            ctx.font = '14px sans-serif';
            let maxWidth = 0;
            plottedFunctions.forEach(pf => {
                const text = `f(x) = ${pf.funcStr}`;
                maxWidth = Math.max(maxWidth, ctx.measureText(text).width);
            });
        
            const legendWidth = padding * 2 + swatchSize + textGap + maxWidth;
            const legendHeight = padding * 2 + (plottedFunctions.length * lineHeight) - (lineHeight - swatchSize) + (plottedFunctions.length-1)*2;
        
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = isDarkMode ? '#282828' : '#FFFFFF';
            ctx.strokeStyle = theme.accent + '80';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(legendX, legendY, legendWidth, legendHeight, 8);
            ctx.fill();
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
        
            plottedFunctions.forEach((pf, index) => {
                const yPos = legendY + padding + (index * (lineHeight+2)) + (swatchSize / 2);
                
                ctx.fillStyle = pf.color;
                ctx.fillRect(legendX + padding, yPos - swatchSize / 2, swatchSize, swatchSize);
                
                ctx.fillStyle = theme.text;
                const text = `f(x) = ${pf.funcStr}`;
                ctx.fillText(text, legendX + padding + swatchSize + textGap, yPos);
            });
        }

        // --- Plotted Points ---
        points.forEach(p => {
            const px = origin.x + p.x * currentZoom;
            const py = origin.y - p.y * currentZoom;
            const isHovered = hoveredPointRef.current?.label === p.label;
            const radius = isHovered ? POINT_RADIUS * 1.5 : POINT_RADIUS;
            if (isHovered) { ctx.beginPath(); ctx.arc(px, py, radius + 4, 0, Math.PI * 2); ctx.fillStyle = `${theme.primary}40`; ctx.fill(); }
            ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fillStyle = theme.primary; ctx.fill(); ctx.strokeStyle = theme.card; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = theme.text; ctx.font = `bold 14px sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
            ctx.fillText(p.label, px + radius + 2, py - radius - 2);
        });
        
        // --- Extrema Highlight ---
        const currentHoveredExtremum = hoveredExtremumRef.current;
        if (currentHoveredExtremum) {
            const px = origin.x + currentHoveredExtremum.x * currentZoom;
            const py = origin.y - currentHoveredExtremum.y * currentZoom;
            ctx.beginPath(); ctx.arc(px, py, POINT_RADIUS, 0, 2 * Math.PI); ctx.fillStyle = `${theme.accent}80`; ctx.fill();
            const text = currentHoveredExtremum.label;
            ctx.font = '14px sans-serif'; const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = isDarkMode ? 'rgba(40,40,40,0.85)' : 'rgba(255,255,255,0.85)';
            ctx.fillRect(px - textWidth / 2 - 5, py + 10, textWidth + 10, 20);
            ctx.fillStyle = theme.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(text, px, py + 20);
        }

        // --- Follow Ball and Coords ---
        const followPoint = followPointRef.current;
        if (followPoint && mousePosRef.current) {
            const px = origin.x + followPoint.x * currentZoom;
            const py = origin.y - followPoint.y * currentZoom;
            ctx.beginPath(); ctx.arc(px, py, POINT_RADIUS + 1, 0, 2 * Math.PI); ctx.fillStyle = followPoint.color; ctx.fill();
            ctx.strokeStyle = theme.card; ctx.lineWidth = 1.5; ctx.stroke();

            const text = followPoint.coords;
            const mousePx = mousePosRef.current.x; const mousePy = mousePosRef.current.y;
            ctx.font = '14px monospace'; const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = isDarkMode ? 'rgba(40,40,40,0.85)' : 'rgba(255,255,255,0.85)';
            ctx.fillRect(mousePx - textWidth / 2 - 5, mousePy - 35, textWidth + 10, 20);
            ctx.fillStyle = theme.text; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(text, mousePx, mousePy - 25);
        }

    }, [theme, isDarkMode, plottedFunctions, points, isRadianMode, getPointPrecision(zoom)]);

    // Canvas setup and render loop
    useEffect(() => {
        const canvas = canvasRef.current; const container = containerRef.current;
        if (!canvas || !container) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let animationFrameId: number;
        const render = () => {
            const { width, height } = container.getBoundingClientRect();
            draw(ctx, width, height);
            animationFrameId = requestAnimationFrame(render);
        };
        const resizeObserver = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
            ctx.resetTransform(); ctx.scale(dpr, dpr);
        });
        resizeObserver.observe(container); render();
        return () => { resizeObserver.disconnect(); cancelAnimationFrame(animationFrameId); }
    }, [draw]);
    
    // --- Event Handlers ---
    const getNextLabel = (currentPoints: Point[]): string => {
        const existingLabels = new Set(currentPoints.map(p => p.label));
        for (let i = 65; i <= 90; i++) { const label = String.fromCharCode(i); if (!existingLabels.has(label)) return label; }
        let i = 1; while (true) { const label = `P${i++}`; if (!existingLabels.has(label)) return label; }
    };

    const handlePlot = () => {
        setError(null);
        if (!functionInput.trim()) return;
        try {
            const newFunc = parseFunction(functionInput);
            setPlottedFunctions(prev => [...prev, {
                id: `${Date.now()}`, funcStr: functionInput, func: newFunc, color: getNextColor()
            }]);
            setFunctionInput('');
        } catch (e: any) { setError(e.message); }
    };

    const handleInsertFunction = (func: string) => {
        const input = functionInputRef.current;
        if (!input) {
            setFunctionInput(prev => prev + `${func}()`);
            return;
        }
    
        const start = input.selectionStart ?? functionInput.length;
        const end = input.selectionEnd ?? functionInput.length;
        
        const twoArgFuncs = ['pow', 'log'];
        const textToInsert = twoArgFuncs.includes(func) ? `${func}(, )` : `${func}()`;
        const cursorOffset = twoArgFuncs.includes(func) ? -3 : -1;
    
        const currentVal = functionInput;
        let prefix = '';
        if (start > 0 && /[a-z0-9)x]/.test(currentVal[start-1])) {
             prefix = ' * ';
        }

        const newValue = currentVal.substring(0, start) + prefix + textToInsert + currentVal.substring(end);
        
        setFunctionInput(newValue);
        setIsFunctionPaletteOpen(false);
    
        setTimeout(() => {
            input.focus();
            const newCursorPos = start + prefix.length + textToInsert.length + cursorOffset;
            input.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (functionPaletteRef.current && !functionPaletteRef.current.contains(event.target as Node)) {
                // Check if the click target is the toggle button itself
                const toggleButton = functionPaletteRef.current.previousElementSibling;
                if (toggleButton && toggleButton.contains(event.target as Node)) {
                    return;
                }
                setIsFunctionPaletteOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const handlePlotPoint = () => {
        setPointError(null);
        const match = coordinateStr.trim().match(/^([A-Za-z][A-Za-z0-9]*)\s*\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*\)$/);
        if (!match) { setPointError("Invalid format. Use 'Label(x, y)', e.g., A(2, 3)."); return; }
        const [, label, xStr, yStr] = match;
        if (points.some(p => p.label.toLowerCase() === label.toLowerCase())) { setPointError(`Label '${label}' already exists.`); return; }
        setPoints(prev => [...prev, { x: parseFloat(xStr), y: parseFloat(yStr), label }]);
        setCoordinateStr('');
    };
    
    const openColorPicker = (id: string, currentColor: string, event: React.MouseEvent) => {
        setEditingColorId(id);
        setTempColor(currentColor);
        const buttonRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const listRect = functionsListRef.current?.getBoundingClientRect();

        if (listRect) {
            setPickerPosition({
                top: buttonRect.top - listRect.top + buttonRect.height + 5,
                left: buttonRect.left - listRect.left,
            });
        }
    };
    
    const handleConfirmColorChange = () => {
        if (editingColorId) {
            setPlottedFunctions(prev =>
                prev.map(pf =>
                    pf.id === editingColorId ? { ...pf, color: tempColor } : pf
                )
            );
        }
        setEditingColorId(null);
        setPickerPosition(null);
    };

    const handleCancelColorChange = () => {
        setEditingColorId(null);
        setPickerPosition(null);
    };

    const handleZoomIn = useCallback(() => setZoom(prev => Math.min(1e12, prev * ZOOM_FACTOR)), []);
    const handleZoomOut = useCallback(() => setZoom(prev => Math.max(1e-9, prev / ZOOM_FACTOR)), []);

    const stopZoom = useCallback(() => {
        if (zoomIntervalRef.current) clearInterval(zoomIntervalRef.current);
        if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
        zoomIntervalRef.current = null; zoomTimeoutRef.current = null;
    }, []);

    useEffect(() => () => stopZoom(), [stopZoom]);

    const handleZoomInMouseDown = useCallback(() => {
        handleZoomIn();
        zoomTimeoutRef.current = window.setTimeout(() => { zoomIntervalRef.current = window.setInterval(handleZoomIn, 50); }, LONG_PRESS_DELAY);
    }, [handleZoomIn]);

    const handleZoomOutMouseDown = useCallback(() => {
        handleZoomOut();
        zoomTimeoutRef.current = window.setTimeout(() => { zoomIntervalRef.current = window.setInterval(handleZoomOut, 50); }, LONG_PRESS_DELAY);
    }, [handleZoomOut]);

    const handleZoomInTouchStart = useCallback((e: React.TouchEvent) => { e.preventDefault(); handleZoomInMouseDown(); }, [handleZoomInMouseDown]);
    const handleZoomOutTouchStart = useCallback((e: React.TouchEvent) => { e.preventDefault(); handleZoomOutMouseDown(); }, [handleZoomOutMouseDown]);

    const resetPanningState = useCallback(() => {
        if (canvasRef.current) canvasRef.current.style.cursor = 'crosshair';
        isPanning.current = false;
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isGraphInteractionOn) return;
        if (e.button !== 0) return; panRef.current = pan;
        if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
        isPanning.current = true; lastMousePos.current = { x: e.clientX, y: e.clientY }; hasDragged.current = false;
    }, [pan, isGraphInteractionOn]);

    const findClosestPointOnGraphs = useCallback((
        mousePx: number, 
        mousePy: number,
        functionsToSearch: PlottedFunction[]
    ): { point: { x: number; y: number }; func: PlottedFunction; distance: number } | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const origin = { x: rect.width / 2 + pan.x, y: rect.height / 2 + pan.y };
        
        let closestPointData: { point: { x: number; y: number }; func: PlottedFunction; distance: number } | null = null;
        const searchRadius = CLICK_THRESHOLD * 2;

        for (const pf of functionsToSearch) {
            // Search in a pixel grid around the cursor to find the closest point on the curve
            for (let pxOffset = -searchRadius; pxOffset <= searchRadius; pxOffset++) {
                const currentPx = mousePx + pxOffset;
                const worldX = (currentPx - origin.x) / zoom;
                const worldY = pf.func(worldX);

                if (worldY !== null && isFinite(worldY)) {
                    const currentPy = origin.y - worldY * zoom;
                    const distance = Math.sqrt(Math.pow(currentPx - mousePx, 2) + Math.pow(currentPy - mousePy, 2));

                    if (distance < (closestPointData?.distance ?? Infinity)) {
                        closestPointData = {
                            point: { x: worldX, y: worldY },
                            func: pf,
                            distance: distance
                        };
                    }
                }
            }
        }
        return closestPointData;
    }, [pan, zoom]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isGraphInteractionOn) {
            if (canvasRef.current) canvasRef.current.style.cursor = 'default';
            return;
        }
        const canvas = canvasRef.current; if (!canvas) return;
        const rect = canvas.getBoundingClientRect(); const clientX = e.clientX; const clientY = e.clientY;
        mousePosRef.current = { x: clientX - rect.left, y: clientY - rect.top };
        
        if (isPanning.current) {
            const dx = clientX - lastMousePos.current.x; const dy = clientY - lastMousePos.current.y;
            if (!hasDragged.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) hasDragged.current = true;
            if (hasDragged.current) panRef.current = { x: panRef.current.x + dx, y: panRef.current.y + dy };
            lastMousePos.current = { x: clientX, y: clientY };
            return;
        }

        const mousePx = mousePosRef.current.x;
        const mousePy = mousePosRef.current.y;
        
        // Update follow point (hover and lock logic)
        const activeFunc = isFollowLocked && followPointRef.current
            ? plottedFunctions.find(pf => pf.id === followPointRef.current!.funcId)
            : undefined;

        const functionsToSearch = activeFunc ? [activeFunc] : plottedFunctions;
        const closestPointData = findClosestPointOnGraphs(mousePx, mousePy, functionsToSearch);

        const updateFollowPoint = (data: typeof closestPointData) => {
            if (!data) return;
            const xLabel = isRadianMode
                ? formatAsPi(data.point.x)
                : data.point.x.toFixed(pointPrecision);
            followPointRef.current = {
                x: data.point.x,
                y: data.point.y,
                color: data.func.color,
                coords: `(${xLabel}, ${data.point.y.toFixed(pointPrecision)})`,
                funcId: data.func.id,
            };
        };

        if (activeFunc) { // Locked mode: always show ball on the active function
            updateFollowPoint(closestPointData);
        } else { // Hover mode: show ball only if close enough
            if (closestPointData && closestPointData.distance <= CLICK_THRESHOLD) {
                updateFollowPoint(closestPointData);
            } else {
                followPointRef.current = null;
            }
        }

        // Check for hovered point
        let foundPoint: Point | null = null;
        const origin = { x: rect.width / 2 + pan.x, y: rect.height / 2 + pan.y };
        for (const point of points) {
            const pointPx = origin.x + point.x * zoom; const pointPy = origin.y - point.y * zoom;
            if (Math.sqrt((mousePosRef.current.x - pointPx) ** 2 + (mousePosRef.current.y - pointPy) ** 2) < CLICK_THRESHOLD) { foundPoint = point; break; }
        }
        hoveredPointRef.current = foundPoint;

        // Check for hovered extremum
        let foundExtremum: Point | null = null;
        if (!foundPoint) {
            loop: for (const pointArray of Object.values(extrema)) {
                for (const ex of pointArray as Point[]) {
                    const exPx = origin.x + ex.x * zoom;
                    const exPy = origin.y - ex.y * zoom;
                    if (Math.sqrt((mousePosRef.current.x - exPx) ** 2 + (mousePosRef.current.y - exPy) ** 2) < CLICK_THRESHOLD) {
                        foundExtremum = ex;
                        break loop;
                    }
                }
            }
        }
        hoveredExtremumRef.current = foundExtremum;

        canvas.style.cursor = (foundPoint || foundExtremum || followPointRef.current) ? 'pointer' : 'crosshair';
    }, [pan, points, zoom, pointPrecision, plottedFunctions, extrema, isFollowLocked, findClosestPointOnGraphs, isRadianMode, isGraphInteractionOn]);

    const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isGraphInteractionOn) return;
        if (isPanning.current) setPan(panRef.current);
        resetPanningState();
        if (hasDragged.current) return;
        
        const canvas = canvasRef.current; if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mousePx = e.clientX - rect.left;
        const mousePy = e.clientY - rect.top;

        const closestPointData = findClosestPointOnGraphs(mousePx, mousePy, plottedFunctions);

        if (closestPointData && closestPointData.distance <= CLICK_THRESHOLD) {
            const xLabel = isRadianMode
                ? formatAsPi(closestPointData.point.x)
                : closestPointData.point.x.toFixed(pointPrecision);
            followPointRef.current = { 
                x: closestPointData.point.x, 
                y: closestPointData.point.y,
                color: closestPointData.func.color,
                coords: `(${xLabel}, ${closestPointData.point.y.toFixed(pointPrecision)})`,
                funcId: closestPointData.func.id
            };
            setIsFollowLocked(true);
        } else {
            followPointRef.current = null;
            setIsFollowLocked(false);
        }
    }, [resetPanningState, findClosestPointOnGraphs, pointPrecision, plottedFunctions, isRadianMode, isGraphInteractionOn]);

    const handleMouseLeave = useCallback(() => {
        if (!isGraphInteractionOn) return;
        resetPanningState(); mousePosRef.current = null; hoveredPointRef.current = null; hoveredExtremumRef.current = null;
        if (!isFollowLocked) {
            followPointRef.current = null;
        }
    }, [resetPanningState, isFollowLocked, isGraphInteractionOn]);
    
    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!isGraphInteractionOn) return;
        if (!isTouchInteractable) return;
        e.stopPropagation();

        if (e.touches.length === 1) {
            const t = e.touches[0];
            isPanning.current = true;
            lastMousePos.current = { x: t.clientX, y: t.clientY };
        } else if (e.touches.length === 2) {
            const [t1, t2] = e.touches;
            const dx = t2.clientX - t1.clientX;
            const dy = t2.clientY - t1.clientY;
            pinchInfo.current.lastDistance = Math.sqrt(dx * dx + dy * dy);
            pinchInfo.current.lastCenter = {
                x: (t1.clientX + t2.clientX) / 2,
                y: (t1.clientY + t2.clientY) / 2,
            };
        }
    }, [isTouchInteractable, isGraphInteractionOn]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isGraphInteractionOn) return;
        if (!isTouchInteractable) return;
        e.preventDefault();
        e.stopPropagation();

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        if (e.touches.length === 1 && isPanning.current) {
            const t = e.touches[0];
            const dx = t.clientX - lastMousePos.current.x;
            const dy = t.clientY - lastMousePos.current.y;
            panRef.current = { x: panRef.current.x + dx, y: panRef.current.y + dy };
            lastMousePos.current = { x: t.clientX, y: t.clientY };
        } else if (e.touches.length === 2) {
            const [t1, t2] = e.touches;
            const dx = t2.clientX - t1.clientX;
            const dy = t2.clientY - t1.clientY;
            const newDistance = Math.sqrt(dx * dx + dy * dy);

            if (pinchInfo.current.lastDistance !== null) {
                const distanceRatio = newDistance / pinchInfo.current.lastDistance;
                const newZoom = Math.max(1e-9, Math.min(1e12, zoomRef.current * distanceRatio));

                const center = pinchInfo.current.lastCenter!;
                const mouseX = center.x - rect.left;
                const mouseY = center.y - rect.top;

                const worldX = (mouseX - (rect.width / 2 + panRef.current.x)) / zoomRef.current;
                const worldY = (mouseY - (rect.height / 2 + panRef.current.y)) / -zoomRef.current;

                const newPanX = mouseX - rect.width / 2 - worldX * newZoom;
                const newPanY = mouseY - rect.height / 2 - worldY * -newZoom;
                
                zoomRef.current = newZoom;
                panRef.current = { x: newPanX, y: newPanY };
            }

            pinchInfo.current.lastDistance = newDistance;
            pinchInfo.current.lastCenter = {
                x: (t1.clientX + t2.clientX) / 2,
                y: (t1.clientY + t2.clientY) / 2,
            };
        }
    }, [isTouchInteractable, isGraphInteractionOn]);

    const handleTouchEnd = useCallback(() => {
        if (!isGraphInteractionOn) return;
        if (!isTouchInteractable) return;

        setPan(panRef.current);
        setZoom(zoomRef.current);
        
        isPanning.current = false;
        pinchInfo.current.lastDistance = null;
        pinchInfo.current.lastCenter = null;
    }, [isTouchInteractable, isGraphInteractionOn]);

    const preventScroll = useCallback((e: TouchEvent) => {
        if (!isGraphInteractionOn) return;
        if (isTouchInteractable && canvasRef.current && e.target === canvasRef.current) {
            e.preventDefault();
        }
    }, [isTouchInteractable, isGraphInteractionOn]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const addListeners = () => {
            canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
            canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
            canvas.addEventListener("touchend", handleTouchEnd, { passive: false });
            document.addEventListener("touchmove", preventScroll, { passive: false });
        };
        
        const removeListeners = () => {
            canvas.removeEventListener("touchstart", handleTouchStart);
            canvas.removeEventListener("touchmove", handleTouchMove);
            canvas.removeEventListener("touchend", handleTouchEnd);
            document.removeEventListener("touchmove", preventScroll);
        };

        if (isTouchInteractable) {
            addListeners();
        }

        return removeListeners;
    }, [isTouchInteractable, handleTouchStart, handleTouchMove, handleTouchEnd, preventScroll]);

    // Attaches a non-passive wheel event listener to prevent page scroll and zoom at cursor.
    useEffect(() => {
        const canvasElement = canvasRef.current;
        if (!canvasElement) return;

        const wheelListener = (e: WheelEvent) => {
            if (!isGraphInteractionOn) return;
            e.preventDefault();
            e.stopPropagation();
            
            const rect = canvasElement.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const zoomFactor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;

            const currentZoom = zoomRef.current;
            const currentPan = panRef.current;
            const newZoom = Math.max(1e-9, Math.min(1e12, currentZoom * zoomFactor));
            const worldX = (mouseX - (rect.width / 2 + currentPan.x)) / currentZoom;
            const worldY = (mouseY - (rect.height / 2 + currentPan.y)) / -currentZoom;
            const newPanX = mouseX - rect.width / 2 - worldX * newZoom;
            const newPanY = mouseY - rect.height / 2 - worldY * -newZoom;

            setZoom(newZoom);
            setPan({ x: newPanX, y: newPanY });
        };

        canvasElement.addEventListener('wheel', wheelListener, { passive: false });

        return () => {
            canvasElement.removeEventListener('wheel', wheelListener);
        };
    }, [isGraphInteractionOn]);

    const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isGraphInteractionOn) return;
        if (hasDragged.current) return; const canvas = canvasRef.current; if (!canvas) return;
        const rect = canvas.getBoundingClientRect(); const mousePx = e.clientX - rect.left; const mousePy = e.clientY - rect.top;
        const origin = { x: rect.width / 2 + pan.x, y: rect.height / 2 + pan.y };
        for (const point of points) {
            const pointPx = origin.x + point.x * zoom; const pointPy = origin.y - point.y * zoom;
            if (Math.sqrt((mousePx - pointPx) ** 2 + (mousePy - pointPy) ** 2) < CLICK_THRESHOLD) {
                setPoints(prev => prev.filter(p => p.label !== point.label)); return;
            }
        }
        const x = (mousePx - origin.x) / zoom; const y = -(mousePy - origin.y) / zoom;
        setPoints(prev => [...prev, { x, y, label: getNextLabel(points) }]);
    };

    const handleDeletePoint = (label: string) => setPoints(prev => prev.filter(p => p.label !== label));
    const handleResetAll = () => setPoints([]);
    const handleResetFunctions = () => {
        setPlottedFunctions([]);
        colorIndexRef.current = 0;
    };
    const handleResetView = () => { setPan({ x: 0, y: 0 }); panRef.current = { x: 0, y: 0 }; setZoom(50); };
    const handleDeleteFunction = (id: string) => setPlottedFunctions(prev => prev.filter(pf => pf.id !== id));
    
    const handleExport = () => {
        const canvas = canvasRef.current; if (!canvas) return;
        const { width, height } = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width * dpr; exportCanvas.height = height * dpr;
        const ctx = exportCanvas.getContext('2d'); if (!ctx) return;
        ctx.scale(dpr, dpr); ctx.drawImage(canvas, 0, 0, width, height);
        ctx.strokeStyle = '#000000'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, width, height);
        const link = document.createElement('a'); link.download = `mathforge_graph.jpg`;
        link.href = exportCanvas.toDataURL('image/jpeg', 0.95); link.click();
    };

    const toggleFullscreen = useCallback(() => {
        const elem = cardRef.current;
        if (!elem) return;

        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }, []);

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);
    
    return (
        <Card ref={cardRef} className="flex flex-col">
            {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} theme={theme} />}
            <div className="flex justify-between items-center mb-4 min-h-[40px]">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>Graph Plotter</h2>
                    <button 
                        onClick={() => setIsHelpModalOpen(true)} 
                        className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" 
                        aria-label="Open syntax help"
                        title="Syntax Help"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <label htmlFor="function-input" className="font-semibold text-lg whitespace-nowrap">f(x) =</label>
                <Input
                    ref={functionInputRef}
                    id="function-input" type="text" value={functionInput} onChange={(e) => setFunctionInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePlot()} placeholder="e.g., x^2 * sin(x)" className="flex-grow p-3 text-lg"
                />
                <div className="relative">
                     <Button 
                        onClick={() => setIsFunctionPaletteOpen(p => !p)} 
                        className="w-auto px-4 py-3 font-serif italic text-2xl"
                        aria-label="Insert function"
                        title="Insert function"
                    >
                        ƒ
                    </Button>
                    {isFunctionPaletteOpen && (
                        <div 
                            ref={functionPaletteRef}
                            className="absolute right-0 top-full mt-2 z-20 p-2 rounded-lg shadow-xl border w-80 max-h-60 overflow-y-auto"
                            style={{ backgroundColor: theme.card, borderColor: theme.accent }}
                        >
                            <div className="grid grid-cols-4 gap-1">
                                {FUNCTIONS_LIST.map(func => (
                                    <button 
                                        key={func} 
                                        onClick={() => handleInsertFunction(func)}
                                        className="p-1 text-center rounded-md text-sm font-mono hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        style={{ color: theme.text }}
                                        title={`${func} function`}
                                    >
                                        {func}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <Button onClick={handlePlot} className="w-auto px-5 py-3.5 text-lg">Plot</Button>
            </div>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            
            <div className="flex items-center gap-4 mb-4">
                <label htmlFor="point-input" className="font-semibold text-lg whitespace-nowrap">Add Point:</label>
                <Input
                    id="point-input" type="text" value={coordinateStr} onChange={(e) => { setCoordinateStr(e.target.value); setPointError(null); }}
                    onKeyPress={(e) => e.key === 'Enter' && handlePlotPoint()} placeholder="e.g., A(2, 3)" className="flex-grow p-3 text-lg"
                />
               <Button onClick={handlePlotPoint} className="w-auto px-4.8 py-0.8 text-base h-auto min-h-0">
    Plot Point
</Button>

            </div>
            {pointError && <p className="text-red-500 text-sm mb-2 -mt-2 text-center sm:text-left">{pointError}</p>}

            <div className="flex items-center justify-center gap-4 mb-4 p-2 rounded-md" style={{ backgroundColor: theme.bg }}>
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                    Toggle on to interact with graph
                </p>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={isGraphInteractionOn} 
                        onChange={() => {
                            const newState = !isGraphInteractionOn;
                            setIsGraphInteractionOn(newState);
                            setIsTouchInteractable(newState);
                        }} 
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"
                         // Fix: Cast the style object to React.CSSProperties to allow custom CSS properties.
                         style={{ 
                             '--tw-ring-color': theme.accent, 
                             backgroundColor: isGraphInteractionOn ? theme.primary : undefined 
                         } as React.CSSProperties}
                    ></div>
                </label>
            </div>

            <div className="relative flex-grow min-h-[400px]" ref={containerRef}>
                 <canvas
                    ref={canvasRef} className="absolute top-0 left-0 w-full h-full rounded-md" style={{ cursor: isGraphInteractionOn ? 'crosshair' : 'default', touchAction: isGraphInteractionOn ? 'none' : 'auto' }}
                    onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave} onDoubleClick={handleDoubleClick}
                />
                <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white/70 dark:bg-black/70 p-1 rounded-md">
                    <button onClick={() => setIsRadianMode(!isRadianMode)} title="Toggle Radian Mode" className={`w-10 h-10 p-0 flex items-center justify-center rounded font-bold text-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isRadianMode ? 'opacity-100' : 'opacity-50'}`} aria-label="Toggle Radian Mode" style={{ color: theme.primary }}>π</button>
                    <button onMouseDown={handleZoomInMouseDown} onMouseUp={stopZoom} onMouseLeave={stopZoom} onTouchStart={handleZoomInTouchStart} onTouchEnd={stopZoom} title="Zoom In" className="w-10 h-10 p-0 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Zoom in" style={{ color: theme.primary }}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg></button>
                    <button onMouseDown={handleZoomOutMouseDown} onMouseUp={stopZoom} onMouseLeave={stopZoom} onTouchStart={handleZoomOutTouchStart} onTouchEnd={stopZoom} title="Zoom Out" className="w-10 h-10 p-0 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Zoom out" style={{ color: theme.primary }}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg></button>
                    <button onClick={handleResetView} title="Reset View" className="w-10 h-10 p-0 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Reset view" style={{ color: theme.primary }}><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
                    <button onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} className="w-10 h-10 p-0 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Toggle fullscreen" style={{ color: theme.primary }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d={isFullscreen ? "M16 4h4v4m-6 2l6-6M8 20H4v-4m6-2l-6 6" : "M4 8V4h4m12 12v4h-4M4 20l6-6m10-10l-6 6"} />
                        </svg>
                    </button>
                </div>
            </div>
            
             <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative" ref={functionsListRef}>
                    <h3 className="font-semibold mb-2">Plotted Functions ({plottedFunctions.length})</h3>
                    <div className="max-h-28 overflow-y-auto pr-2 space-y-2">
                        {plottedFunctions.length > 0 ? plottedFunctions.map(pf => (
                            <div key={pf.id} className="flex items-center justify-between text-sm p-2 rounded-md" style={{backgroundColor: theme.bg}}>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => openColorPicker(pf.id, pf.color, e)}
                                        className="w-4 h-4 rounded-full cursor-pointer border dark:border-gray-500"
                                        style={{backgroundColor: pf.color}}
                                        aria-label={`Change color for function ${pf.funcStr}`}
                                    ></button>
                                    <span className="font-mono">f(x) = {pf.funcStr}</span>
                                </div>
                                <button onClick={() => handleDeleteFunction(pf.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label={`Delete function ${pf.funcStr}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )) : <p className="text-center italic" style={{ color: theme.textSecondary }}>Plot a function to see it here.</p>}
                    </div>
                     {editingColorId && pickerPosition && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={handleCancelColorChange} />
                            <div
                                className="absolute z-20 p-2 rounded-lg shadow-xl border dark:border-gray-600"
                                style={{
                                    backgroundColor: theme.card,
                                    top: pickerPosition.top,
                                    left: pickerPosition.left,
                                }}
                            >
                                <input
                                    type="color"
                                    value={tempColor}
                                    onChange={(e) => setTempColor(e.target.value)}
                                    className="w-full h-10 p-0 border-none bg-transparent"
                                />
                                <div className="flex justify-end mt-2">
                                    <Button onClick={handleConfirmColorChange} className="px-3 py-1 text-xs">OK</Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Plotted Points ({points.length})</h3>
                    <div className="max-h-28 overflow-y-auto pr-2 space-y-2">
                        {points.length > 0 ? points.map(p => (
                            <div key={p.label} className="flex items-center justify-between text-sm p-2 rounded-md" style={{backgroundColor: theme.bg}}>
                                <span><strong>{p.label}</strong>: ({isRadianMode ? formatAsPi(p.x) : p.x.toFixed(pointPrecision)}, {p.y.toFixed(pointPrecision)})</span>
                                <button onClick={() => handleDeletePoint(p.label)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label={`Delete point ${p.label}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )) : <p className="text-center italic" style={{ color: theme.textSecondary }}>Double-click graph to add points.</p>}
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-4">
                <Button onClick={handleResetFunctions} style={{backgroundColor: theme.accent}}>Reset Functions</Button>
                <Button onClick={handleResetAll} style={{backgroundColor: theme.accent}}>Reset Points</Button>
                <Button onClick={handleExport}>Share</Button>
            </div>
        </Card>
    );
};