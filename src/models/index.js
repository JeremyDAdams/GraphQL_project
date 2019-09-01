import Sequelize from 'sequelize';

const sequelize = new Sequelize(
    process.env.DATABASE,
    process.env.DATABASE_USER,
    process.env.DATABASE_PASSWORD,
    {
        dialect: 'postgres',
    },
);

const models = {
    User: sequelize.import('./user'),
    Message: sequelize.import('./message'),
};

Object.keys(models).forEach(key => {
    if ('associate' in models[key]) {
        models[key].associate(models);
    }
});

export { sequelize };

export default models;





let users = {
    1: {
        id: '1',
        username: 'Jeremy Adams',
        messageIds: [1],
    },
    2: {
        id: '2',
        username: 'Steve Rogers',
        messageIds: [2],
    },
};

let messages = {
    1: {
        id: '1',
        text: 'Hello World!',
        userId: '1',
    },
    2: {
        id: '2',
        text: 'Bye world',
        userId: '2',
    },
};

export default {
    users,
    messages,
};