require('dotenv').config();

import { User } from '../models/user-sequelize';
import { Team } from '../models/team';
import { TeamMember } from '../models/team-member';

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

const dbInit = async () => {
    if (!(await User.findOne({ where: { email: 'defaultuser@mail.com', role: 'admin' } }))) {
        await User.create({ email: 'defaultuser@mail.com', password: 'P@ssword123', role: 'admin' });
    }

    await Promise.all([
        User.sync({ alter: isDev || isTest }),
        Team.sync({ alter: isDev || isTest }),
        TeamMember.sync({ alter: isDev || isTest }),
    ]);
};

export default dbInit; 
