import React from 'react';
import type { Module, Palette } from './types';
import { BasicCalculator } from './components/modules/BasicCalculator';
import { PlaceholderModule } from './components/modules/PlaceholderModule';
import { GraphPlotter } from './components/modules/GraphPlotter';
import { CurrencyConverter } from './components/modules/CurrencyConverter';
import { UnitConverter } from './components/modules/UnitConverter';
import { MatrixCalculator } from './components/modules/MatrixCalculator';
import { QuadraticSolver } from './components/modules/QuadraticSolver';
import { PrimeFactorizer } from './components/modules/PrimeFactorizer';

// Using Heroicons as SVG components for better styling
const CalculatorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM8 19H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V9h2v2zm0-4H6V5h2v2zm4 8H10v-2h2v2zm0-4H10v-2h2v2zm0-4H10V9h2v2zm0-4H10V5h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm4 0h-2V9h2v2zm0-4h-2V5h2v2z"/></svg>;
const CurrencyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>;
const GraphIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const MatrixIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 14a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 14a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const StatsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;
const UnitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10m16-10v10M8 7h8m-8 10h8M9 4h6m-6 16h6" /></svg>;
const PrimeFactorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 12l10 10 10-10L12 2z" /></svg>;
const EquationIcon = () => <span className="font-bold text-lg w-6 h-6 flex items-center justify-center">Q</span>;

export enum ModuleId {
    BASIC_CALCULATOR = 'basic_calculator',
    CURRENCY_CONVERTER = 'currency_converter',
    GRAPH_PLOTTER = 'graph_plotter',
    MATRIX_CALCULATOR = 'matrix_calculator',
    UNIT_CONVERTER = 'unit_converter',
    QUADRATIC_SOLVER = 'quadratic_solver',
    PRIME_FACTORIZER = 'prime_factorizer',
}

export const MODULES: Module[] = [
    { id: ModuleId.BASIC_CALCULATOR, name: 'Basic Calculator', icon: <CalculatorIcon />, component: BasicCalculator },
    { id: ModuleId.CURRENCY_CONVERTER, name: 'Currency Converter', icon: <CurrencyIcon />, component: CurrencyConverter },
    { id: ModuleId.GRAPH_PLOTTER, name: 'Graph Plotter', icon: <GraphIcon />, component: GraphPlotter },
    { id: ModuleId.UNIT_CONVERTER, name: 'Unit Converter', icon: <UnitIcon />, component: UnitConverter },
    { id: ModuleId.MATRIX_CALCULATOR, name: 'Matrix Calculator', icon: <MatrixIcon />, component: MatrixCalculator },
    { id: ModuleId.QUADRATIC_SOLVER, name: 'Quadratic Solver', icon: <EquationIcon />, component: QuadraticSolver },
    { id: ModuleId.PRIME_FACTORIZER, name: 'Prime Factorizer', icon: <PrimeFactorIcon />, component: PrimeFactorizer },
];

export const CURRENCY_INFO: { [key: string]: string } = {
    "AED": "United Arab Emirates — UAE Dirham",
    "AFN": "Afghanistan — Afghan Afghani",
    "ALL": "Albania — Albanian Lek",
    "AMD": "Armenia — Armenian Dram",
    "ARS": "Argentina — Argentine Peso",
    "AUD": "Australia — Australian Dollar",
    "AZN": "Azerbaijan — Azerbaijani Manat",
    "BDT": "Bangladesh — Bangladeshi Taka",
    "BGN": "Bulgaria — Bulgarian Lev",
    "BHD": "Bahrain — Bahraini Dinar",
    "BND": "Brunei — Brunei Dollar",
    "BOB": "Bolivia — Bolivian Boliviano",
    "BRL": "Brazil — Brazilian Real",
    "CAD": "Canada — Canadian Dollar",
    "CHF": "Switzerland — Swiss Franc",
    "CLP": "Chile — Chilean Peso",
    "CNY": "China — Chinese Yuan",
    "COP": "Colombia — Colombian Peso",
    "CRC": "Costa Rica — Costa Rican Colón",
    "CZK": "Czech Republic — Czech Koruna",
    "DKK": "Denmark — Danish Krone",
    "DOP": "Dominican Republic — Dominican Peso",
    "DZD": "Algeria — Algerian Dinar",
    "EGP": "Egypt — Egyptian Pound",
    "EUR": "Euro Zone — Euro",
    "FJD": "Fiji — Fijian Dollar",
    "GBP": "United Kingdom — British Pound",
    "GEL": "Georgia — Georgian Lari",
    "GHS": "Ghana — Ghanaian Cedi",
    "GTQ": "Guatemala — Guatemalan Quetzal",
    "HKD": "Hong Kong — Hong Kong Dollar",
    "HNL": "Honduras — Honduran Lempira",
    "HRK": "Croatia — Croatian Kuna",
    "HUF": "Hungary — Hungarian Forint",
    "IDR": "Indonesia — Indonesian Rupiah",
    "ILS": "Israel — Israeli New Shekel",
    "INR": "India — Indian Rupee",
    "IQD": "Iraq — Iraqi Dinar",
    "IRR": "Iran — Iranian Rial",
    "ISK": "Iceland — Icelandic Króna",
    "JMD": "Jamaica — Jamaican Dollar",
    "JOD": "Jordan — Jordanian Dinar",
    "JPY": "Japan — Japanese Yen",
    "KES": "Kenya — Kenyan Shilling",
    "KGS": "Kyrgyzstan — Kyrgyzstani Som",
    "KRW": "South Korea — South Korean Won",
    "KWD": "Kuwait — Kuwaiti Dinar",
    "KZT": "Kazakhstan — Kazakhstani Tenge",
    "LAK": "Laos — Lao Kip",
    "LBP": "Lebanon — Lebanese Pound",
    "LKR": "Sri Lanka — Sri Lankan Rupee",
    "MAD": "Morocco — Moroccan Dirham",
    "MDL": "Moldova — Moldovan Leu",
    "MNT": "Mongolia — Mongolian Tögrög",
    "MUR": "Mauritius — Mauritian Rupee",
    "MXN": "Mexico — Mexican Peso",
    "MYR": "Malaysia — Malaysian Ringgit",
    "NGN": "Nigeria — Nigerian Naira",
    "NIO": "Nicaragua — Nicaraguan Córdoba",
    "NOK": "Norway — Norwegian Krone",
    "NPR": "Nepal — Nepalese Rupee",
    "NZD": "New Zealand — New Zealand Dollar",
    "OMR": "Oman — Omani Riyal",
    "PAB": "Panama — Panamanian Balboa",
    "PEN": "Peru — Peruvian Sol",
    "PHP": "Philippines — Philippine Peso",
    "PKR": "Pakistan — Pakistani Rupee",
    "PLN": "Poland — Polish Złoty",
    "PYG": "Paraguay — Paraguayan Guarani",
    "QAR": "Qatar — Qatari Riyal",
    "RON": "Romania — Romanian Leu",
    "RSD": "Serbia — Serbian Dinar",
    "RUB": "Russia — Russian Ruble",
    "SAR": "Saudi Arabia — Saudi Riyal",
    "SEK": "Sweden — Swedish Krona",
    "SGD": "Singapore — Singapore Dollar",
    "THB": "Thailand — Thai Baht",
    "TJS": "Tajikistan — Tajikistani Somoni",
    "TMT": "Turkmenistan — Turkmenistani Manat",
    "TND": "Tunisia — Tunisian Dinar",
    "TRY": "Turkey — Turkish Lira",
    "TWD": "Taiwan — New Taiwan Dollar",
    "TZS": "Tanzania — Tanzanian Shilling",
    "UAH": "Ukraine — Ukrainian Hryvnia",
    "USD": "United States — US Dollar",
    "UYU": "Uruguay — Uruguayan Peso",
    "UZS": "Uzbekistan — Uzbekistani So'm",
    "VND": "Vietnam — Vietnamese Đồng",
    "ZAR": "South Africa — South African Rand",
};

export const UNIT_DEFINITIONS = {
    Length: {
        baseUnit: 'meter',
        units: {
            meter: { name: 'Meter', symbol: 'm', toBase: 1 },
            kilometer: { name: 'Kilometer', symbol: 'km', toBase: 1000 },
            centimeter: { name: 'Centimeter', symbol: 'cm', toBase: 0.01 },
            millimeter: { name: 'Millimeter', symbol: 'mm', toBase: 0.001 },
            mile: { name: 'Mile', symbol: 'mi', toBase: 1609.34 },
            yard: { name: 'Yard', symbol: 'yd', toBase: 0.9144 },
            foot: { name: 'Foot', symbol: 'ft', toBase: 0.3048 },
            inch: { name: 'Inch', symbol: 'in', toBase: 0.0254 },
        },
    },
    Weight: {
        baseUnit: 'gram',
        units: {
            gram: { name: 'Gram', symbol: 'g', toBase: 1 },
            kilogram: { name: 'Kilogram', symbol: 'kg', toBase: 1000 },
            milligram: { name: 'Milligram', symbol: 'mg', toBase: 0.001 },
            tonne: { name: 'Metric Ton', symbol: 't', toBase: 1000000 },
            pound: { name: 'Pound', symbol: 'lb', toBase: 453.592 },
            ounce: { name: 'Ounce', symbol: 'oz', toBase: 28.3495 },
        },
    },
    Temperature: {
        baseUnit: 'celsius',
        units: {
            celsius: { name: 'Celsius', symbol: '°C', toBase: (c: number) => c, fromBase: (c: number) => c },
            fahrenheit: { name: 'Fahrenheit', symbol: '°F', toBase: (f: number) => (f - 32) * 5 / 9, fromBase: (c: number) => (c * 9 / 5) + 32 },
            kelvin: { name: 'Kelvin', symbol: 'K', toBase: (k: number) => k - 273.15, fromBase: (c: number) => c + 273.15 },
        },
    },
    Area: {
        baseUnit: 'squareMeter',
        units: {
            squareMeter: { name: 'Square Meter', symbol: 'm²', toBase: 1 },
            squareFoot: { name: 'Square Foot', symbol: 'ft²', toBase: 0.09290304 },
            squareKilometer: { name: 'Square Kilometer', symbol: 'km²', toBase: 1e6 },
            squareMile: { name: 'Square Mile', symbol: 'mi²', toBase: 2.59e6 },
            hectare: { name: 'Hectare', symbol: 'ha', toBase: 10000 },
            acre: { name: 'Acre', symbol: 'ac', toBase: 4046.86 },
        },
    },
    Volume: {
        baseUnit: 'liter',
        units: {
            liter: { name: 'Liter', symbol: 'L', toBase: 1 },
            milliliter: { name: 'Milliliter', symbol: 'mL', toBase: 0.001 },
            gallon: { name: 'Gallon (US)', symbol: 'gal', toBase: 3.78541 },
            quart: { name: 'Quart (US)', symbol: 'qt', toBase: 0.946353 },
            pint: { name: 'Pint (US)', symbol: 'pt', toBase: 0.473176 },
            cup: { name: 'Cup (US)', symbol: 'cup', toBase: 0.236588 },
            fluidOunce: { name: 'Fluid Ounce (US)', symbol: 'fl oz', toBase: 0.0295735 },
            tablespoon: { name: 'Tablespoon (US)', symbol: 'tbsp', toBase: 0.0147868 },
            teaspoon: { name: 'Teaspoon (US)', symbol: 'tsp', toBase: 0.00492892 },
        },
    },
    Speed: {
        baseUnit: 'mps',
        units: {
            mps: { name: 'Meter per second', symbol: 'm/s', toBase: 1 },
            kph: { name: 'Kilometer per hour', symbol: 'km/h', toBase: 1 / 3.6 },
            mph: { name: 'Mile per hour', symbol: 'mph', toBase: 0.44704 },
            knot: { name: 'Knot', symbol: 'kn', toBase: 0.514444 },
        },
    },
    Time: {
        baseUnit: 'second',
        units: {
            second: { name: 'Second', symbol: 's', toBase: 1 },
            minute: { name: 'Minute', symbol: 'min', toBase: 60 },
            hour: { name: 'Hour', symbol: 'hr', toBase: 3600 },
            day: { name: 'Day', symbol: 'd', toBase: 86400 },
            week: { name: 'Week', symbol: 'wk', toBase: 604800 },
        },
    },
    "Digital Storage": {
        baseUnit: 'byte',
        units: {
            byte: { name: 'Byte', symbol: 'B', toBase: 1 },
            kilobyte: { name: 'Kilobyte', symbol: 'KB', toBase: 1024 },
            megabyte: { name: 'Megabyte', symbol: 'MB', toBase: 1024 ** 2 },
            gigabyte: { name: 'Gigabyte', symbol: 'GB', toBase: 1024 ** 3 },
            terabyte: { name: 'Terabyte', symbol: 'TB', toBase: 1024 ** 4 },
            petabyte: { name: 'Petabyte', symbol: 'PB', toBase: 1024 ** 5 },
        }
    },
    Energy: {
        baseUnit: 'joule',
        units: {
            joule: { name: 'Joule', symbol: 'J', toBase: 1 },
            kilojoule: { name: 'Kilojoule', symbol: 'kJ', toBase: 1000 },
            megajoule: { name: 'Megajoule', symbol: 'MJ', toBase: 1e6 },
            kilowattHour: { name: 'Kilowatt-hour', symbol: 'kWh', toBase: 3.6e6 },
        }
    },
    Power: {
        baseUnit: 'watt',
        units: {
            watt: { name: 'Watt', symbol: 'W', toBase: 1 },
            kilowatt: { name: 'Kilowatt', symbol: 'kW', toBase: 1000 },
            horsepower: { name: 'Horsepower (mech)', symbol: 'hp', toBase: 745.7 },
        }
    },
    Pressure: {
        baseUnit: 'pascal',
        units: {
            pascal: { name: 'Pascal', symbol: 'Pa', toBase: 1 },
            kilopascal: { name: 'Kilopascal', symbol: 'kPa', toBase: 1000 },
            bar: { name: 'Bar', symbol: 'bar', toBase: 100000 },
            psi: { name: 'Pound-force/sq inch', symbol: 'psi', toBase: 6894.76 },
            atm: { name: 'Atmosphere', symbol: 'atm', toBase: 101325 },
        }
    },
    Torque: {
        baseUnit: 'newtonMeter',
        units: {
            newtonMeter: { name: 'Newton-meter', symbol: 'N·m', toBase: 1 },
            poundFoot: { name: 'Pound-foot', symbol: 'lbf·ft', toBase: 1.35582 },
        }
    }
};

export const PALETTES: Palette[] = [
    { name: 'Default', colors: { primary: '#4CAF50', accent: '#757575' } },
    { name: 'Ocean', colors: { primary: '#2196F3', accent: '#607D8B' } },
    { name: 'Sunset', colors: { primary: '#FF9800', accent: '#FF5722' } },
    { name: 'Grape', colors: { primary: '#9C27B0', accent: '#673AB7' } },
    { name: 'Crimson', colors: { primary: '#F44336', accent: '#E91E63' } },
    { name: 'Mono', colors: { primary: '#616161', accent: '#9E9E9E' } },
];