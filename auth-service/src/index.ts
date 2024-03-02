import { app } from './app';
import { sequelize } from './db/sequelize';
import dbInit from './db/init';

dbInit();

const start = async () => {
    if (!process.env.JWT_KEY) {
        throw new Error('JWT_KEY must be defined');
    }

    if (!process.env.DB_NAME) {
        throw new Error('DB_NAME must be defined');
    }

    if (!process.env.DB_USER) {
        throw new Error('DB_USER must be defined');
    }

    if (!process.env.DB_PASSWORD) {
        throw new Error('DB_PASSWORD must be defined');
    }

    if (!process.env.DB_HOST) {
        throw new Error('DB_HOST must be defined');
    }

    try {
        sequelize.authenticate();
    } catch (err) {
        console.log(err);
    }

    app.listen(process.env.NODE_SERVICE_PORT, () => {
        console.log(`Listening on port ${process.env.NODE_SERVICE_PORT}!`);
    });
};

start();
