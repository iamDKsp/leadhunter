import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export interface AuthRequest extends Request {
    user?: { userId: string };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log(`[AUTH] ${req.method} ${req.url} - Token: ${token ? 'Present' : 'Missing'}`);

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        console.log(`[AUTH] Valid token for user: ${decoded.userId}`);
        next();
    } catch (err) {
        console.log(`[AUTH] Invalid or expired token: ${err instanceof Error ? err.message : String(err)}`);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
