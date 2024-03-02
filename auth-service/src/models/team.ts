import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/sequelize';

interface TeamAttributes {
    id?: number;
    name: string;
    category: string;
}

interface TeamModel extends Model<TeamAttributes>, TeamAttributes {
    createdAt?: Date;
    updatedAt?: Date;
}

const Team = sequelize.define<TeamModel>('team', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    category: {
        type: DataTypes.STRING,
    }
});

export { Team };
