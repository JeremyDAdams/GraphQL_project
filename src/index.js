import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { ApolloServer, gql } from 'apollo-server-express';

import schema from './schema';
import resolvers from './resolvers';
import models, { sequelize } from './models';

const app = express();

app.use(cors());


const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
    context: async () => ({
        models,
        me: await models.User.findByLogin('jadams'),
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

const createUsersWithMEssages = async () => {
    await models.User.create(
        {
            username: 'jadams',
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

