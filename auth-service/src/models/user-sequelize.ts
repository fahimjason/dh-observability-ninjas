import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/sequelize';
import { Password } from '../services/password';

interface UserAttributes {
    id?: number;
    email: string;
    password: string;
    role?: string;
    status?: string;
}

interface UserModel extends Model<UserAttributes>, UserAttributes {
    createdAt?: Date;
    updatedAt?: Date;
}

const User = sequelize.define<UserModel>('user', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM,
        values: ['user', 'admin'],
        defaultValue: 'user'
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            const hashedPassword = await Password.toHash(user.password);
            user.password = hashedPassword;
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const hashedPassword = await Password.toHash(user.password);
                user.password = hashedPassword;
            }
        },
    },
    // defaultScope: {
    //     attributes: { exclude: ['password'] },
    // },
    scopes: {
        withPassword: {
            attributes: { include: ['password'] },
        },
    },
});

export { User };
