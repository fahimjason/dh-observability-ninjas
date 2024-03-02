import express from 'express';
import 'express-async-errors';
import cookieSession from 'cookie-session';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

import { currentUserRouter } from './routes/current-user';
import { signinRouter } from './routes/signin';
import { signoutRouter } from './routes/signout';
import { signupRouter } from './routes/signup';
import { teamsRouter } from './routes/teams';
import { teamsMembersRouter } from './routes/team-members';
import { errorHandler } from './middlewares/error-handler';
import { NotFoundError } from './errors/not-found-error';

import tracer from '../tracer';
tracer('auth-service');

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use(cookieParser());
app.use(
    cookieSession({
        signed: false,
        secure: process.env.NODE_ENV != 'test'
    })
);

app.use(currentUserRouter);
app.use(signinRouter);
app.use(signoutRouter);
app.use(signupRouter);
app.use(teamsRouter);
app.use(teamsMembersRouter);

app.all('*', async (req, res, next) => {
    throw new NotFoundError();
});

app.use(errorHandler);

export { app };
