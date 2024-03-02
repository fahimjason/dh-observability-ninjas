import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface UserPayload {
    id: string;
    email: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            currentUser?: UserPayload;
        }
    }
}

export const currentUser = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.cookies?.token) {
        return next()
    }

    try {
        const payload = jwt.verify(req.cookies.token, process.env.JWT_KEY!) as UserPayload;

        req.currentUser = payload;
    } catch (err) {

    }

    next();
};