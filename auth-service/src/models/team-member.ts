import crypto from 'crypto';
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../db/sequelize';
import { User } from './user-sequelize';
import { Team } from './team';

interface TeamMemberAttributes {
    id: number;
    user_id: number;
    team_id: number;
    status?: string;
    token?: string | null;
    tokenExpire?: Date | null;
}

interface TeamCreationAttributes extends Optional<TeamMemberAttributes, 'id'> { }

export interface TeamMemberModel extends Model<TeamMemberAttributes, TeamCreationAttributes>, TeamMemberAttributes {
    createdAt?: Date;
    updatedAt?: Date;

    getToken: () => string; // Method to generate and hash password token
}

const TeamMember = sequelize.define<TeamMemberModel>('teammembers', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        },
    },
    team_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Team,
            key: 'id'
        },
    },
    status: {
        type: DataTypes.ENUM,
        values: ['pending', 'active'],
        defaultValue: 'pending',
        allowNull: false
    },
    token: {
        type: DataTypes.STRING
    },
    tokenExpire: {
        type: DataTypes.DATE
    }
});

// Method to generate and hash password token
// TeamMember.prototype.geToken = function () {
//     // Generate token
//     const token = crypto.randomBytes(20).toString('hex');

//     console.log(token);

//     // Hash token and set to resetPasswordToken field
//     this.token = crypto.createHash('sha256').update(token).digest('hex');

//     // Set expire
//     this.tokenExpire = new Date(Date.now() + 10 * 60 * 1000);

//     return token;
// };

// Define associations for one-to-many relationship
TeamMember.belongsTo(User, { foreignKey: 'user_id' });
TeamMember.belongsTo(Team, { foreignKey: 'team_id' });

export { TeamMember };
