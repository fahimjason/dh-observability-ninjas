import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';

import { BadRequestError } from '../errors/bad-request-error';
import { User } from '../models/user-sequelize';
import { validateRequest } from '../middlewares/validate-request';
import { Password } from '../services/password';
import { createTracer } from '../middlewares/custom-tracer';
import { createSpan, tracingError, getActiveParentSpan } from '../middlewares/custom-tracer';

const router = express.Router();

router.post(
    '/api/users/signin',
    createTracer('/user-signin'),
    [
        body('email')
            .isEmail()
            .withMessage('Email must be valid'),
        body('password')
            .trim()
            .notEmpty()
            .withMessage('You must supply a password')
    ],
    validateRequest,
    async (req: Request, res: Response) => {
        const span = getActiveParentSpan();
        console.log(span);

        const { email, password } = req.body;

        const existingUser = await User.findOne({
            where: {
                email
            }
        });

        const childSpan = createSpan('db-call-and-token-creation', span);

        if (!existingUser) {
            tracingError(childSpan, 'Invalid credentials');
            throw new BadRequestError('Invalid credentials');
        }

        const { password: PASSWORD, ...rest } = existingUser.dataValues;

        const passwordMatch = await Password.compare(PASSWORD, password);

        if (!passwordMatch) {
            throw new BadRequestError('Invalid credentials');
        }

        // Generate JWT
        const userJwt = jwt.sign(
            {
                id: existingUser.id,
                email: existingUser.email,
                role: existingUser.role
            },
            process.env.JWT_KEY!
        );

        childSpan.end();

        // Store it on session object
        req.session = {
            jwt: userJwt,
        };

        res.status(200).cookie('token', userJwt, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            httpOnly: true
        }).send({...rest, token: userJwt});

        span?.end();
    }
);

export { router as signinRouter };
