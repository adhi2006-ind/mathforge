// A very simple and safe expression evaluator
export const safeEvaluate = (expression: string): number | null => {
    // Remove anything that isn't a number, an operator, or a parenthesis.
    const sanitized = expression.replace(/[^0-9+\-*/().\s%]/g, '');
    if (sanitized !== expression.trim()) {
        // Potentially malicious characters were stripped
        return null;
    }
    try {
        // Using Function constructor is safer than direct eval
        return new Function(`return ${sanitized}`)();
    } catch (e) {
        console.error("Evaluation error:", e);
        return null;
    }
};

// More advanced evaluator for scientific mode
export const evaluateScientific = (expression: string, isDeg: boolean = true): number | null => {
    const sanitized = expression
        .replace(/\^/g, '**')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E');

    // Basic validation for allowed characters and function names
    const validationRegex = /[^0-9+\-*/().\s%a-z]/g;
    if (validationRegex.test(sanitized.replace(/Math\.PI|Math\.E/g, ''))) {
         console.error("Invalid characters in expression:", sanitized);
         return null;
    }

    try {
        const sin = isDeg ? (d: number) => Math.sin(d * Math.PI / 180) : Math.sin;
        const cos = isDeg ? (d: number) => Math.cos(d * Math.PI / 180) : Math.cos;
        const tan = isDeg ? (d: number) => Math.tan(d * Math.PI / 180) : Math.tan;
        
        const log = Math.log10;
        const ln = Math.log;
        const sqrt = Math.sqrt;

        // Using Function constructor is safer than direct eval
        // We pass our custom functions into its scope.
        return new Function(
            'sin', 'cos', 'tan', 'log', 'ln', 'sqrt',
            `return ${sanitized}`
        )(sin, cos, tan, log, ln, sqrt);
    } catch (e) {
        console.error("Scientific evaluation error:", e);
        return null;
    }
};


// Matrix operations
type Matrix = number[][];

export const matrixAdd = (a: Matrix, b: Matrix): Matrix => {
    if (a.length !== b.length || a[0].length !== b[0].length) {
        throw new Error("Wrong Order: Matrices must have the same dimensions for addition.");
    }
    return a.map((row, i) => row.map((val, j) => val + b[i][j]));
};

export const matrixSubtract = (a: Matrix, b: Matrix): Matrix => {
    if (a.length !== b.length || a[0].length !== b[0].length) {
        throw new Error("Wrong Order: Matrices must have the same dimensions for subtraction.");
    }
    return a.map((row, i) => row.map((val, j) => val - b[i][j]));
};

export const matrixMultiply = (a: Matrix, b: Matrix): Matrix => {
    if (a[0].length !== b.length) {
        throw new Error("Wrong Order: Columns of Matrix A must equal rows of Matrix B.");
    }
    const result: Matrix = Array(a.length).fill(0).map(() => Array(b[0].length).fill(0));
    
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < b.length; k++) {
                sum += a[i][k] * b[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
};

// Helper to get a minor of a matrix
const getMinor = (m: Matrix, r: number, c: number): Matrix => 
    m.filter((_, i) => i !== r).map(row => row.filter((_, j) => j !== c));

// Determinant calculation using Laplace expansion
export const determinant = (m: Matrix): number => {
    if (m.length === 0 || m.length !== m[0].length) {
        throw new Error("Wrong Order: Matrix must be square for determinant calculation.");
    }
    if (m.length === 1) return m[0][0];
    if (m.length === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
    
    let det = 0;
    for (let c = 0; c < m.length; c++) {
        det += ((-1) ** c) * m[0][c] * determinant(getMinor(m, 0, c));
    }
    return det;
};

export const minorMatrix = (m: Matrix): Matrix => {
    if (m.length === 0 || m.length !== m[0].length) {
        throw new Error("Wrong Order: Matrix must be square to find its minor matrix.");
    }
    return m.map((row, r) =>
        row.map((_, c) => {
            return determinant(getMinor(m, r, c));
        })
    );
};

export const cofactorMatrix = (m: Matrix): Matrix => {
    if (m.length === 0 || m.length !== m[0].length) {
        throw new Error("Wrong Order: Matrix must be square to find its cofactor matrix.");
    }
    return m.map((row, r) =>
        row.map((_, c) => {
            const minorDet = determinant(getMinor(m, r, c));
            return ((-1) ** (r + c)) * minorDet;
        })
    );
};

export const transpose = (m: Matrix): Matrix => {
    if (!m || m.length === 0 || m[0].length === 0) return [];
    return m[0].map((_, colIndex) => m.map(row => row[colIndex]));
};

export const adjoint = (m: Matrix): Matrix => {
    return transpose(cofactorMatrix(m));
};

// Matrix inverse using Gaussian elimination
export const matrixInverse = (m: Matrix): Matrix => {
    if (m.length === 0 || m.length !== m[0].length) {
        throw new Error("Wrong Order: Matrix must be square for inversion.");
    }
    const det = determinant(m);
    if (Math.abs(det) < 1e-10) {
        throw new Error("Matrix is singular and cannot be inverted (determinant is zero).");
    }

    const n = m.length;
    const augmented = m.map((row, i) => [
        ...row,
        ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
    ]);

    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                maxRow = k;
            }
        }
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

        const pivot = augmented[i][i];
        for (let j = i; j < 2 * n; j++) {
            augmented[i][j] /= pivot;
        }

        for (let k = 0; k < n; k++) {
            if (k !== i) {
                const factor = augmented[k][i];
                for (let j = i; j < 2 * n; j++) {
                    augmented[k][j] -= factor * augmented[i][j];
                }
            }
        }
    }

    return augmented.map(row => row.slice(n));
};

// Matrix division A/B is A * B^-1
export const matrixDivide = (a: Matrix, b: Matrix): Matrix => {
    const bInverse = matrixInverse(b);
    return matrixMultiply(a, bInverse);
};

// Solve system of linear equations Ax = B
export const solveLinearSystem = (A: Matrix, B: number[]): number[] => {
    if (A.length === 0 || A.length !== A[0].length) {
        throw new Error("Wrong Order: Coefficient matrix A must be square.");
    }
    if (A.length !== B.length) {
        throw new Error("Wrong Order: Rows of matrix A must match size of vector B.");
    }

    const A_inv = matrixInverse(A);
    const B_col_matrix = B.map(val => [val]);
    const result_matrix = matrixMultiply(A_inv, B_col_matrix);
    return result_matrix.map(row => row[0]);
};

// Eigenvalues and Eigenvectors for 2x2 matrices
export const eigen2x2 = (m: Matrix): { eigenvalues: (number | string)[], eigenvectors: number[][] | string[] } => {
    if (m.length !== 2 || m[0].length !== 2) {
        throw new Error("Wrong Order: Eigenvalue/vector calculation is only for 2x2 matrices.");
    }
    const [a, b] = m[0];
    const [c, d] = m[1];

    const trace = a + d;
    const det = a * d - b * c;
    const discriminant = trace * trace - 4 * det;

    if (discriminant < 0) {
        const realPart = (trace / 2).toFixed(4);
        const imagPart = (Math.sqrt(-discriminant) / 2).toFixed(4);
        return {
            eigenvalues: [`${realPart} + ${imagPart}i`, `${realPart} - ${imagPart}i`],
            eigenvectors: ["Complex eigenvectors not calculated."]
        };
    }

    const lambda1 = (trace + Math.sqrt(discriminant)) / 2;
    const lambda2 = (trace - Math.sqrt(discriminant)) / 2;
    
    const getVector = (lambda: number) => {
        if (Math.abs(c) > 1e-9) return [-(d - lambda), c];
        if (Math.abs(b) > 1e-9) return [b, -(a - lambda)];
        return (Math.abs(a - lambda) < 1e-9) ? [1, 0] : [0, 1];
    };
    
    const normalize = (v: number[]) => {
        const mag = Math.sqrt(v[0]**2 + v[1]**2);
        if (mag < 1e-9) return v;
        return [v[0] / mag, v[1] / mag];
    };
    
    return {
        eigenvalues: [lambda1, lambda2],
        eigenvectors: [normalize(getVector(lambda1)), normalize(getVector(lambda2))]
    };
};

// Quadratic Equation Solver
export const solveQuadratic = (a: number, b: number, c: number): { 
    roots: string[], 
    type: 'real' | 'complex' | 'single', 
    discriminant: number,
    vertex: { x: number, y: number },
    axisOfSymmetry: number,
    vertexForm: string,
} => {
    if (a === 0) {
        throw new Error("Coefficient 'a' cannot be zero for a quadratic equation.");
    }

    const discriminant = b * b - 4 * a * c;

    // Vertex and Axis of Symmetry
    const vertexX = -b / (2 * a);
    const vertexY = a * (vertexX ** 2) + b * vertexX + c;
    const vertex = { x: vertexX, y: vertexY };
    const axisOfSymmetry = vertexX;
    
    // Vertex form: a(x - h)^2 + k
    const h = vertexX;
    const k = vertexY;
    const aStr = a === 1 ? '' : (a === -1 ? '-' : a.toPrecision(4));
    const hStr = h === 0 ? 'x' : `(x ${h > 0 ? '-' : '+'} ${Math.abs(h).toPrecision(4)})`;
    const kStr = k === 0 ? '' : (k > 0 ? ` + ${k.toPrecision(4)}` : ` - ${Math.abs(k).toPrecision(4)}`);
    const vertexForm = `y = ${aStr}${hStr}²${kStr}`;


    if (discriminant > 0) {
        const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        return { 
            roots: [root1.toPrecision(4), root2.toPrecision(4)], 
            type: 'real', 
            discriminant,
            vertex,
            axisOfSymmetry,
            vertexForm
        };
    } else if (discriminant === 0) {
        const root = -b / (2 * a);
        return { 
            roots: [root.toPrecision(4)], 
            type: 'single', 
            discriminant,
            vertex,
            axisOfSymmetry,
            vertexForm
        };
    } else {
        const realPart = -b / (2 * a);
        const imagPart = Math.sqrt(-discriminant) / (2 * a);
        const root1 = `${realPart.toPrecision(4)} + ${imagPart.toPrecision(4)}i`;
        const root2 = `${realPart.toPrecision(4)} - ${imagPart.toPrecision(4)}i`;
        return { 
            roots: [root1, root2], 
            type: 'complex', 
            discriminant,
            vertex,
            axisOfSymmetry,
            vertexForm
        };
    }
};

// Helper function for factorial
const factorial = (n: number): number => {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity; // Avoid overflow for standard double precision
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = n; i > 1; i--) {
        result *= i;
    }
    return result;
};

// Custom log function to handle custom bases
const customLog = (x: number, base?: number) => {
    if (base === undefined) return Math.log(x); // natural log
    if (base <= 0 || base === 1) return NaN;
    return Math.log(x) / Math.log(base);
};


// Parses a string like "x^2" into a function that can be evaluated.
export const parseFunction = (funcStr: string): ((x: number) => number | null) => {
    const funcMap = {
        // Standard Math functions
        sin: Math.sin, cos: Math.cos, tan: Math.tan,
        asin: Math.asin, acos: Math.acos, atan: Math.atan,
        sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
        asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
        sqrt: Math.sqrt, cbrt: Math.cbrt,
        abs: Math.abs, sign: Math.sign,
        ceil: Math.ceil, floor: Math.floor, round: Math.round, trunc: Math.trunc,
        exp: Math.exp, pow: Math.pow,
        min: Math.min, max: Math.max,
        
        // Logarithms
        log: customLog,
        log10: (x: number) => customLog(x, 10),
        log2: (x: number) => customLog(x, 2),
        ln: Math.log,

        // Custom/reciprocal trig functions
        sec: (x: number) => 1 / Math.cos(x),
        csc: (x: number) => 1 / Math.sin(x),
        cot: (x: number) => 1 / Math.tan(x),
        asec: (x: number) => Math.acos(1 / x),
        acsc: (x: number) => Math.asin(1 / x),
        acot: (x: number) => Math.PI / 2 - Math.atan(x),
        sech: (x: number) => 1 / Math.cosh(x),
        csch: (x: number) => 1 / Math.sinh(x),
        coth: (x: number) => 1 / Math.tanh(x),
        
        // Aliases
        cosec: (x: number) => 1 / Math.sin(x),

        // Factorial
        fact: factorial,
        factorial: factorial,
    };

    // Whitelist of all allowed identifiers (functions, constants, variable)
    const knownIdentifiers = new Set([
        ...Object.keys(funcMap), 'pi', 'e', 'x'
    ]);

    // Extract all alphabetic identifiers from the input string
    const identifiersInUse = funcStr.toLowerCase().match(/[a-z]+/g) || [];

    // Validate every identifier against the whitelist
    for (const identifier of identifiersInUse) {
        if (!knownIdentifiers.has(identifier)) {
            throw new Error(`Unknown function or variable: "${identifier}"`);
        }
    }

    // Pre-processing the function string for evaluation
    let processedStr = funcStr
        .toLowerCase()
        .replace(/\s/g, ''); // Remove whitespace for easier parsing

    // Add implicit multiplication where it's commonly used
    // Order is important to avoid incorrect insertions.
    // Case 1: number followed by variable/function/paren, e.g., 2x -> 2*x, 2sin(x) -> 2*sin(x), 3(x) -> 3*(x)
    processedStr = processedStr.replace(/(\d)([a-z(])/g, '$1*$2');
    // Case 2: closing parenthesis followed by anything not an operator or closing paren/comma
    // e.g., (x+1)(x-1) -> (x+1)*(x-1), (x)2 -> (x)*2, (x)x -> (x)*x
    processedStr = processedStr.replace(/(\))([a-z\d(])/g, '$1*$2');
    // Case 3: variable 'x' followed by a number
    // e.g., x2 -> x*2
    processedStr = processedStr.replace(/([x])(\d)/g, '$1*$2');
    // Case 4: variable 'x' followed by a function name or another variable 'x' or an opening paren
    // e.g., xsin(x) -> x*sin(x), xx -> x*x, x(x) -> x*(x)
    processedStr = processedStr.replace(/([x])([a-z(])/g, '$1*$2');
    

    processedStr = processedStr
        .replace(/\^/g, '**') // power
        .replace(/\bpi\b/g, 'Math.PI') // constants
        .replace(/\be\b/g, 'Math.E');

    // Create a regex of all available function names to prepend the context object name.
    const funcNames = Object.keys(funcMap).join('|');
    // Ensure we match whole words only to avoid matching parts of other words
    const funcRegex = new RegExp(`\\b(${funcNames})(?=\\s*\\()`, 'g');
    
    // Replace function names with `FN.funcName`
    processedStr = processedStr.replace(funcRegex, (match) => `FN.${match}`);

    try {
        // Create a function that takes 'x' and the function map 'FN' as arguments
        const func = new Function('x', 'FN', `
            try {
                return ${processedStr};
            } catch (e) {
                return null; // Return null for invalid inputs like sqrt(-1)
            }
        `);

        // Bind the function map to the created function
        const boundFunc = (x: number) => func(x, funcMap);

        // Test the function to catch early errors (e.g., syntax errors)
        boundFunc(1);

        return boundFunc as (x: number) => number | null;
    } catch (e) {
        console.error("Function parsing error:", e);
        throw new Error("Could not parse the function. Please check the syntax.");
    }
};

// Prime Factorization
export const primeFactorize = (n: number): number[] => {
    if (!Number.isInteger(n) || n < 2) {
        throw new Error("Input must be an integer greater than 1.");
    }
    if (n > Number.MAX_SAFE_INTEGER) {
        throw new Error("Input number is too large for safe factorization.");
    }
    
    const factors: number[] = [];
    let num = n;

    while (num % 2 === 0) {
        factors.push(2);
        num /= 2;
    }

    for (let i = 3; i <= Math.sqrt(num); i += 2) {
        while (num % i === 0) {
            factors.push(i);
            num /= i;
        }
    }

    if (num > 2) {
        factors.push(num);
    }

    return factors;
};