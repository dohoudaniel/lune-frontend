import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Table, Clock, CheckCircle, Loader, ArrowRight, Save,
    AlertCircle, Sparkles, Download, Upload, Calculator,
    BarChart2, Plus, Trash2, Copy, Undo, Redo
} from 'lucide-react';

import { DifficultyLevel, EvaluationResult } from '../types';

interface SpreadsheetAssessmentProps {
    skill: string;
    difficulty: DifficultyLevel;
    onComplete: (result: EvaluationResult) => void;
    onCancel?: () => void;
}

interface CellData {
    value: string;
    formula?: string;
    format?: 'text' | 'number' | 'currency' | 'percentage';
    computed?: string | number;
}

interface SpreadsheetTask {
    title: string;
    description: string;
    instructions: string[];
    initialData: CellData[][];
    expectedResults: { cell: string; value: string | number }[];
    formulasRequired: string[];
}

const COLUMN_HEADERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROW_COUNT = 15;

export const SpreadsheetAssessment: React.FC<SpreadsheetAssessmentProps> = ({
    skill,
    difficulty,
    onComplete,
    onCancel
}) => {
    const [step, setStep] = useState<'loading' | 'instructions' | 'working' | 'submitting' | 'results'>('loading');
    const [task, setTask] = useState<SpreadsheetTask | null>(null);
    const [cells, setCells] = useState<CellData[][]>([]);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [timeRemaining, setTimeRemaining] = useState(45 * 60); // 45 minutes
    const [history, setHistory] = useState<CellData[][][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [result, setResult] = useState<{ score: number; feedback: string; correctCells: number; totalCells: number } | null>(null);

    // Generate task based on difficulty
    useEffect(() => {
        const generateTask = () => {
            const tasks: Record<DifficultyLevel, SpreadsheetTask> = {
                'Beginner': {
                    title: 'Basic Sales Report',
                    description: 'Create a simple sales summary using basic formulas.',
                    instructions: [
                        'Calculate the total sales in column C',
                        'Use SUM formula to find the grand total',
                        'Calculate the average sale amount',
                        'Format numbers as currency where appropriate'
                    ],
                    initialData: [
                        [{ value: 'Product' }, { value: 'Units' }, { value: 'Price' }, { value: 'Total' }],
                        [{ value: 'Widget A' }, { value: '100', format: 'number' }, { value: '25', format: 'currency' }, { value: '', formula: '' }],
                        [{ value: 'Widget B' }, { value: '75', format: 'number' }, { value: '35', format: 'currency' }, { value: '', formula: '' }],
                        [{ value: 'Widget C' }, { value: '150', format: 'number' }, { value: '15', format: 'currency' }, { value: '', formula: '' }],
                        [{ value: 'Widget D' }, { value: '50', format: 'number' }, { value: '45', format: 'currency' }, { value: '', formula: '' }],
                        [{ value: '' }, { value: '' }, { value: 'Grand Total:' }, { value: '', formula: '' }],
                        [{ value: '' }, { value: '' }, { value: 'Average:' }, { value: '', formula: '' }],
                    ],
                    expectedResults: [
                        { cell: 'D2', value: 2500 },
                        { cell: 'D3', value: 2625 },
                        { cell: 'D4', value: 2250 },
                        { cell: 'D5', value: 2250 },
                        { cell: 'D6', value: 9625 },
                        { cell: 'D7', value: 2406.25 }
                    ],
                    formulasRequired: ['SUM', 'AVERAGE', 'multiplication']
                },
                'Mid-Level': {
                    title: 'Budget Analysis Report',
                    description: 'Analyze department budgets with variance calculations.',
                    instructions: [
                        'Calculate budget variance (Actual - Budget)',
                        'Calculate percentage variance',
                        'Use conditional formatting concepts',
                        'Create summary statistics',
                        'Identify departments over/under budget'
                    ],
                    initialData: [
                        [{ value: 'Department' }, { value: 'Budget' }, { value: 'Actual' }, { value: 'Variance' }, { value: '% Var' }, { value: 'Status' }],
                        [{ value: 'Marketing' }, { value: '50000', format: 'currency' }, { value: '52500', format: 'currency' }, { value: '' }, { value: '' }, { value: '' }],
                        [{ value: 'Sales' }, { value: '75000', format: 'currency' }, { value: '71000', format: 'currency' }, { value: '' }, { value: '' }, { value: '' }],
                        [{ value: 'Engineering' }, { value: '120000', format: 'currency' }, { value: '125000', format: 'currency' }, { value: '' }, { value: '' }, { value: '' }],
                        [{ value: 'HR' }, { value: '35000', format: 'currency' }, { value: '34500', format: 'currency' }, { value: '' }, { value: '' }, { value: '' }],
                        [{ value: 'Operations' }, { value: '65000', format: 'currency' }, { value: '68000', format: 'currency' }, { value: '' }, { value: '' }, { value: '' }],
                        [{ value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }],
                        [{ value: 'Total Budget:' }, { value: '' }, { value: 'Total Actual:' }, { value: '' }, { value: '' }, { value: '' }],
                        [{ value: 'Over Budget Count:' }, { value: '' }, { value: 'Under Budget Count:' }, { value: '' }, { value: '' }, { value: '' }],
                    ],
                    expectedResults: [
                        { cell: 'D2', value: 2500 },
                        { cell: 'D3', value: -4000 },
                        { cell: 'D4', value: 5000 },
                        { cell: 'D5', value: -500 },
                        { cell: 'D6', value: 3000 },
                        { cell: 'E2', value: '5%' },
                        { cell: 'B8', value: 345000 },
                        { cell: 'D8', value: 351000 }
                    ],
                    formulasRequired: ['SUM', 'IF', 'COUNTIF', 'percentage calculation']
                },
                'Advanced': {
                    title: 'Financial Forecasting Model',
                    description: 'Build a revenue forecast with growth projections.',
                    instructions: [
                        'Calculate year-over-year growth rates',
                        'Project next 3 years based on average growth',
                        'Use compound growth formulas',
                        'Create scenario analysis (best/worst/expected)',
                        'Calculate NPV and IRR indicators'
                    ],
                    initialData: [
                        [{ value: 'Year' }, { value: 'Revenue' }, { value: 'Growth %' }, { value: 'CAGR' }, { value: 'Projected' }],
                        [{ value: '2021' }, { value: '1000000', format: 'currency' }, { value: 'Base' }, { value: '' }, { value: '' }],
                        [{ value: '2022' }, { value: '1150000', format: 'currency' }, { value: '' }, { value: '' }, { value: '' }],
                        [{ value: '2023' }, { value: '1350000', format: 'currency' }, { value: '' }, { value: '' }, { value: '' }],
                        [{ value: '2024' }, { value: '1520000', format: 'currency' }, { value: '' }, { value: '' }, { value: '' }],
                        [{ value: '2025' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }],
                        [{ value: '2026' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }],
                        [{ value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }],
                        [{ value: 'Avg Growth:' }, { value: '' }, { value: 'Total 4yr Rev:' }, { value: '' }, { value: '' }],
                        [{ value: 'Best Case (1.5x):' }, { value: '' }, { value: 'Worst Case (0.5x):' }, { value: '' }, { value: '' }],
                    ],
                    expectedResults: [
                        { cell: 'C3', value: '15%' },
                        { cell: 'C4', value: '17.4%' },
                        { cell: 'C5', value: '12.6%' },
                        { cell: 'B9', value: '15%' }
                    ],
                    formulasRequired: ['Growth rate', 'AVERAGE', 'POWER', 'projection formulas']
                }
            };

            setTask(tasks[difficulty]);

            // Initialize cells with task data, padding to full grid
            const initialCells: CellData[][] = [];
            for (let row = 0; row < ROW_COUNT; row++) {
                initialCells[row] = [];
                for (let col = 0; col < COLUMN_HEADERS.length; col++) {
                    if (tasks[difficulty].initialData[row] && tasks[difficulty].initialData[row][col]) {
                        initialCells[row][col] = { ...tasks[difficulty].initialData[row][col] };
                    } else {
                        initialCells[row][col] = { value: '' };
                    }
                }
            }
            setCells(initialCells);
            setStep('instructions');
        };

        setTimeout(generateTask, 1000);
    }, [difficulty]);

    // Timer
    useEffect(() => {
        if (step === 'working') {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 0) {
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [step]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getCellAddress = (row: number, col: number): string => {
        return `${COLUMN_HEADERS[col]}${row + 1}`;
    };

    const parseCellAddress = (address: string): { row: number; col: number } | null => {
        const match = address.match(/^([A-H])(\d+)$/);
        if (!match) return null;
        return {
            col: COLUMN_HEADERS.indexOf(match[1]),
            row: parseInt(match[2]) - 1
        };
    };

    // Simple formula evaluation (supports basic operations)
    const evaluateFormula = useCallback((formula: string, currentCells: CellData[][]): string | number => {
        if (!formula.startsWith('=')) return formula;

        let expression = formula.slice(1).toUpperCase();

        // Handle SUM
        const sumMatch = expression.match(/SUM\(([A-H]\d+):([A-H]\d+)\)/);
        if (sumMatch) {
            const start = parseCellAddress(sumMatch[1]);
            const end = parseCellAddress(sumMatch[2]);
            if (start && end) {
                let sum = 0;
                for (let r = start.row; r <= end.row; r++) {
                    for (let c = start.col; c <= end.col; c++) {
                        const val = parseFloat(currentCells[r]?.[c]?.value || '0');
                        if (!isNaN(val)) sum += val;
                    }
                }
                return sum;
            }
        }

        // Handle AVERAGE
        const avgMatch = expression.match(/AVERAGE\(([A-H]\d+):([A-H]\d+)\)/);
        if (avgMatch) {
            const start = parseCellAddress(avgMatch[1]);
            const end = parseCellAddress(avgMatch[2]);
            if (start && end) {
                let sum = 0;
                let count = 0;
                for (let r = start.row; r <= end.row; r++) {
                    for (let c = start.col; c <= end.col; c++) {
                        const val = parseFloat(currentCells[r]?.[c]?.value || '0');
                        if (!isNaN(val)) {
                            sum += val;
                            count++;
                        }
                    }
                }
                return count > 0 ? sum / count : 0;
            }
        }

        // Handle cell references and basic math
        expression = expression.replace(/([A-H])(\d+)/g, (_, col, row) => {
            const cellRef = parseCellAddress(`${col}${row}`);
            if (cellRef) {
                return currentCells[cellRef.row]?.[cellRef.col]?.value || '0';
            }
            return '0';
        });

        try {
            // Safe eval for basic math operations
            const result = Function(`"use strict"; return (${expression})`)();
            return typeof result === 'number' ? result : expression;
        } catch {
            return '#ERROR';
        }
    }, []);

    const handleCellClick = (row: number, col: number) => {
        setSelectedCell({ row, col });
        const cell = cells[row][col];
        setEditValue(cell.formula || cell.value);
    };

    const handleCellChange = (value: string) => {
        setEditValue(value);
    };

    const handleCellBlur = () => {
        if (!selectedCell) return;

        const newCells = cells.map(row => row.map(cell => ({ ...cell })));
        const { row, col } = selectedCell;

        if (editValue.startsWith('=')) {
            newCells[row][col] = {
                ...newCells[row][col],
                formula: editValue,
                value: String(evaluateFormula(editValue, newCells)),
                computed: evaluateFormula(editValue, newCells)
            };
        } else {
            newCells[row][col] = {
                ...newCells[row][col],
                value: editValue,
                formula: undefined
            };
        }

        // Save to history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newCells);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        setCells(newCells);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!selectedCell) return;

        if (e.key === 'Enter') {
            handleCellBlur();
            // Move to next row
            if (selectedCell.row < ROW_COUNT - 1) {
                setSelectedCell({ row: selectedCell.row + 1, col: selectedCell.col });
                setEditValue(cells[selectedCell.row + 1][selectedCell.col].formula || cells[selectedCell.row + 1][selectedCell.col].value);
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            handleCellBlur();
            // Move to next column
            if (selectedCell.col < COLUMN_HEADERS.length - 1) {
                setSelectedCell({ row: selectedCell.row, col: selectedCell.col + 1 });
                setEditValue(cells[selectedCell.row][selectedCell.col + 1].formula || cells[selectedCell.row][selectedCell.col + 1].value);
            }
        } else if (e.key === 'Escape') {
            setEditValue(cells[selectedCell.row][selectedCell.col].formula || cells[selectedCell.row][selectedCell.col].value);
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setCells(history[historyIndex - 1]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setCells(history[historyIndex + 1]);
        }
    };

    const handleSubmit = () => {
        if (!task) return;
        setStep('submitting');

        setTimeout(() => {
            let correctCount = 0;
            const totalExpected = task.expectedResults.length;

            task.expectedResults.forEach(expected => {
                const cellRef = parseCellAddress(expected.cell);
                if (cellRef) {
                    const cellValue = cells[cellRef.row]?.[cellRef.col]?.value;
                    const numValue = parseFloat(cellValue || '0');
                    const expectedNum = typeof expected.value === 'number' ? expected.value : parseFloat(expected.value);

                    // Allow 1% tolerance for calculations
                    if (Math.abs(numValue - expectedNum) / expectedNum < 0.01 || cellValue === String(expected.value)) {
                        correctCount++;
                    }
                }
            });

            const score = Math.round((correctCount / totalExpected) * 100);

            setResult({
                score,
                feedback: score >= 70
                    ? `Excellent work! You correctly completed ${correctCount} out of ${totalExpected} required calculations. Your spreadsheet skills are solid.`
                    : `You completed ${correctCount} out of ${totalExpected} required calculations. Review formula syntax and calculation methods to improve.`,
                correctCells: correctCount,
                totalCells: totalExpected
            });
            setStep('results');
        }, 2000);
    };

    const handleComplete = async () => {
        if (!result) return;

        const passed = result.score >= 70;
        let txHash;

        if (passed) {
            try {
                txHash = `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            } catch (e) {
                console.error("Failed to mint", e);
            }
        }

        onComplete({
            score: result.score,
            feedback: result.feedback,
            passed,
            cheatingDetected: false,
            certificationHash: txHash
        });
    };

    const formatCellValue = (cell: CellData): string => {
        const value = cell.computed !== undefined ? cell.computed : cell.value;
        if (cell.format === 'currency' && typeof value === 'number') {
            return `$${value.toLocaleString()}`;
        }
        if (cell.format === 'percentage' && typeof value === 'number') {
            return `${value}%`;
        }
        return String(value);
    };

    if (step === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">Preparing Spreadsheet</h2>
                    <p className="text-gray-500">Loading {skill} assessment...</p>
                </div>
            </div>
        );
    }

    if (!task) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <Table className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900">{task.title}</h1>
                            <p className="text-sm text-gray-500">{difficulty} Level</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {step === 'working' && (
                            <>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleUndo}
                                        disabled={historyIndex <= 0}
                                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                                        title="Undo"
                                    >
                                        <Undo className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button
                                        onClick={handleRedo}
                                        disabled={historyIndex >= history.length - 1}
                                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                                        title="Redo"
                                    >
                                        <Redo className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>

                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    <Clock className="w-4 h-4" />
                                    <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Submit
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Formula Bar */}
                {step === 'working' && (
                    <div className="border-t border-gray-200 px-4 py-2 flex items-center gap-3 bg-gray-50">
                        <span className="text-sm font-medium text-gray-600 w-12">
                            {selectedCell ? getCellAddress(selectedCell.row, selectedCell.col) : ''}
                        </span>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={editValue}
                                onChange={(e) => handleCellChange(e.target.value)}
                                onBlur={handleCellBlur}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter value or formula (start with =)"
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calculator className="w-4 h-4" />
                            <span>Supports: +, -, *, /, SUM(), AVERAGE()</span>
                        </div>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                <AnimatePresence mode="wait">
                    {/* Instructions Step */}
                    {step === 'instructions' && (
                        <motion.div
                            key="instructions"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8"
                        >
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <BarChart2 className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
                                <p className="text-gray-600">{task.description}</p>
                            </div>

                            <div className="bg-green-50 rounded-xl p-6 mb-8">
                                <h3 className="font-bold text-green-900 mb-4">Your Tasks</h3>
                                <ul className="space-y-3">
                                    {task.instructions.map((instruction, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-green-800 text-sm font-bold flex-shrink-0">
                                                {idx + 1}
                                            </span>
                                            <span className="text-green-800">{instruction}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-8">
                                <h4 className="font-medium text-gray-700 mb-2">Formulas You May Need</h4>
                                <div className="flex flex-wrap gap-2">
                                    {task.formulasRequired.map((formula, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 font-mono">
                                            {formula}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                {onCancel && (
                                    <button
                                        onClick={onCancel}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={() => setStep('working')}
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
                                >
                                    Start Working <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Working Step - Spreadsheet */}
                    {step === 'working' && (
                        <motion.div
                            key="working"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Task Reminder */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-amber-800">Remember</h4>
                                        <p className="text-sm text-amber-700">{task.instructions[0]}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Spreadsheet Grid */}
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="w-10 h-8 border border-gray-200 bg-gray-200"></th>
                                                {COLUMN_HEADERS.map(col => (
                                                    <th key={col} className="w-28 h-8 border border-gray-200 text-center text-sm font-bold text-gray-600">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cells.slice(0, 12).map((row, rowIdx) => (
                                                <tr key={rowIdx}>
                                                    <td className="h-8 border border-gray-200 bg-gray-100 text-center text-sm font-bold text-gray-600">
                                                        {rowIdx + 1}
                                                    </td>
                                                    {row.map((cell, colIdx) => (
                                                        <td
                                                            key={colIdx}
                                                            onClick={() => handleCellClick(rowIdx, colIdx)}
                                                            className={`h-8 border border-gray-200 px-2 cursor-pointer text-sm ${selectedCell?.row === rowIdx && selectedCell?.col === colIdx
                                                                ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset'
                                                                : 'hover:bg-gray-50'
                                                                } ${cell.formula ? 'text-blue-600' : ''
                                                                } ${rowIdx === 0 ? 'font-bold bg-gray-50' : ''
                                                                }`}
                                                        >
                                                            {formatCellValue(cell)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Submitting Step */}
                    {step === 'submitting' && (
                        <motion.div
                            key="submitting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-12 text-center"
                        >
                            <Loader className="w-16 h-16 text-green-600 animate-spin mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Checking Your Work</h2>
                            <p className="text-gray-600">Validating formulas and calculations...</p>
                        </motion.div>
                    )}

                    {/* Results Step */}
                    {step === 'results' && result && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg p-8"
                        >
                            <div className={`text-center p-8 rounded-xl mb-8 ${result.score >= 70 ? 'bg-green-50' : 'bg-red-50'
                                }`}>
                                <div className={`w-24 h-24 ${result.score >= 70 ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                    <span className={`text-4xl font-bold ${result.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                        {result.score}%
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {result.score >= 70 ? 'Assessment Passed!' : 'Needs Improvement'}
                                </h2>
                                <p className="text-gray-600">
                                    {result.correctCells} of {result.totalCells} calculations correct
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 mb-8">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-green-500" />
                                    Feedback
                                </h3>
                                <p className="text-gray-700">{result.feedback}</p>
                            </div>

                            <button
                                onClick={handleComplete}
                                className="w-full px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition"
                            >
                                Continue
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default SpreadsheetAssessment;
