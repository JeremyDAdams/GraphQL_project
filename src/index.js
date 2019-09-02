import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { ApolloServer, gql } from 'apollo-server-express';

import schema from './schema';
import resolvers from './resolvers';
import models, { sequelize } from './models';
import { getMaxListeners } from 'cluster';

const app = express();

app.use(cors());


const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
    formatError: error => {
        // remove the internal sequelize error message
        // leave only the important validation error
        const message = error.message
            .replace('SequelizeValidationError: ','')
            .replace('Validation error: ','');

        return {
            ...error,
            message,
        };
    },

    context: async () => ({
        models,
        me: await models.User.findByLogin('jadams'),
        secret: process.env.SECRET,
    }),
});

server.applyMiddleware({ app, path: '/graphql' });

const eraseDatabaseOnSync = true;

sequelize.sync({ force: eraseDatabaseOnSync }).then(async () => {
    if (eraseDatabaseOnSync) {
        createUsersWithMessages();
    }

    app.listen({ port: 8000 }, () => {
        console.log('Apollo Server on http://localhost:8000/graphql');
    });
});

const createUsersWithMessages = async () => {
    await models.User.create(
        {
            username: 'jadams',
            email: 'jadams@gmail.com',
            password: 'notpassword',
            messages: [
                {
                    text: 'Excellent potential new employee',
                },
            ],
        },
        {
            include: [models.Message],
        },
    );

    await models.User.create(
        {
            username: 'srogers',
            email: 'srogers@avengers.org',
            password: 'peggycarter',
            messages: [
                {
                    text: 'Has a shield'
                },
                {
                    text: 'Accomplished time traveler',
                },
            ],
        },
        {
            include: [models.Message],
        },
    );
};

