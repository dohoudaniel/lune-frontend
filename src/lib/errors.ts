import type { VercelResponse } from '@vercel/node';

export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(statusCode: number, message: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Handle errors and send appropriate response
 */
export const handleError = (error: unknown, res: VercelResponse): void => {
    console.error('API Error:', error);

    if (error instanceof ApiError) {
        res.status(error.statusCode).json({
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
        return;
    }

    if (error instanceof Error) {
        res.status(500).json({
            error: error.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
        return;
    }

    res.status(500).json({ error: 'Internal Server Error' });
};

/**
 * Send success response
 */
export const sendSuccess = <T>(res: VercelResponse, data: T, statusCode = 200): void => {
    res.status(statusCode).json(data);
};

/**
 * Send created response
 */
export const sendCreated = <T>(res: VercelResponse, data: T): void => {
    sendSuccess(res, data, 201);
};
