require('dotenv').config();
const mockData = require('./mock-data.json');
const User = require('./models/User');
const Job = require('./models/Job');
const connectDB = require('./db/connect');

const start = async () => {
    const user = {
        name: 'Demo User',
        email: 'testUser@test.com',
        password: 'secret'
    };

    try {
        await connectDB(process.env.MONGO_URI);
        await User.create(user);
        await Job.create(mockData);

        console.log('Success !!!');
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

start();
