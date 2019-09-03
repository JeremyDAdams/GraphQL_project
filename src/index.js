import 'dotenv/config';
import cors from 'cors';
import uuidv4 from 'uuid/v4';
import jwt from 'jsonwebtoken';
import express from 'express';
import {
    ApolloServer,
    AuthenticationError,
    gql,
} from 'apollo-server-express';

import schema from './schema';
import resolvers from './resolvers';
import models, { sequelize } from './models';
import { getMaxListeners } from 'cluster';
import http from 'http';
import DataLoader from 'dataloader';
import loaders from './loaders';

const dotenv = require('dotenv');

const app = express();

app.use(cors());

const getMe = async req => {
    const token = req.headers['x-token'];

    if (token) {
        try {
            return await jwt.verify(token, process.env.SECRET);
        } catch (e) {
            throw new AuthenticationError(
                'Your session expired. Please sign in again.',
            );
        }
    }
};

const userLoader = new DataLoader(keys => batchUsers(keys, models));

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
    context: async ({ req, connection }) => {
        if (connection) {
            return {
                models,
                loaders: {
                    user: new DataLoader(keys =>
                        loaders.user.batchUsers(keys, models),
                    ),
                },
            };
        }
    
        if (req) {
            const me = await getMe(req);

            return {
                models,
                me,
                secret: process.env.SECRET,
                loaders: {
                    user: new DataLoader(keys =>
                        loaders.user.batchUsers(keys, models),
                    ),
                },            
            };
        }
    },
});

server.applyMiddleware({ app, path: '/graphql' });

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const isTest = !!process.env.TEST_DATABASE;
const isProduction = !!process.env.DATABASE_URL;
const port = process.env.PORT || 8000;

sequelize.sync({ force: isTest || isProduction }).then(async () => {
    if (isTest || isProduction) {
        createUsersWithMessages(new Date());
    }

    httpServer.listen({ port }, () => {
        console.log(`Apollo Server on http://localhost:${port}/graphql`);
    });
});

const createUsersWithMessages = async date => {
    await models.User.create(
        {
            username: 'jadams',
            email: 'jadams@gmail.com',
            password: 'notpassword',
            role: 'ADMIN',
            messages: [
                {
                    text: 'Excellent potential new employee',
                    createdAt: date.setSeconds(date.getSeconds() + 1),
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
                    text: 'Has a shield',
                    createdAt: date.setSeconds(date.getSeconds() + 1),
                },
                {
                    text: 'Accomplished time traveler',
                    createdAt: date.setSeconds(date.getSeconds() + 1),
                },
            ],
        },
        {
            include: [models.Message],
        },
    );
};

