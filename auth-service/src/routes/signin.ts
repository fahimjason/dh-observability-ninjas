import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';

import { BadRequestError } from '../errors/bad-request-error';
import { User } from '../models/user-sequelize';
import { validateRequest } from '../middlewares/validate-request';
import { Password } from '../services/password';

const router = express.Router();

router.post(
    '/api/users/signin',
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
        const { email, password } = req.body;

        const existingUser = await User.findOne({
            where: {
                email
            }
        });

        if (!existingUser) {
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

        // Store it on session object
        req.session = {
            jwt: userJwt,
        };

        res.status(200).cookie('token', userJwt, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            httpOnly: true
        }).send({...rest, token: userJwt});
    }
);

export { router as signinRouter };
