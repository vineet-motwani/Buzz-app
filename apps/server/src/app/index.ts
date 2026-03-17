import express from 'express';
import bodyParser  from 'body-parser';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import { User } from './user'
import { Tweet } from './tweet'
import { GraphqlContext } from '../interfaces';
import JWTService from '../services/jwt';
import { redisClient } from '../clients/redis';

export async function initServer() {
  const app = express();

  app.use(bodyParser.json());
  app.use(cors());

  app.get("/", (req, res) =>
    res.status(200).json({ message: "Hello from Buzz!!" })
  );

  const graphqlServer = new ApolloServer<GraphqlContext>({
    typeDefs: `
       ${User.types}
       ${Tweet.types}

        type Query {
            ${User.queries}
            ${Tweet.queries}
        }

        type Mutation {
          ${Tweet.mutations}
          ${User.mutations}
        }
    `,
    resolvers: {
      Query: {
        ...User.resolvers.queries,
        ...Tweet.resolvers.queries,
      },
      Mutation: {
        ...Tweet.resolvers.mutations,
        ...User.resolvers.mutations,
      },
      ...Tweet.resolvers.extraResolvers,
      ...User.resolvers.extraResolvers,
    },
  });

  await graphqlServer.start();

  app.use('/graphql', expressMiddleware(graphqlServer, {
        context: async ({req, res}) => {
          const userToken = req.headers.authorization?.split('Bearer ')[1];
          const user = userToken ? JWTService.decodeToken(userToken) : undefined;

          /**
           * REDIS RATE LIMITING (Claim 3):
           * Tracks the number of requests per user ID in a 1-minute window.
           * If a user exceeds 100 requests/minute, we could throw an error here.
           * For now, we increment the counter to verify usage.
           */
          if (user?.id) {
            const rateLimitKey = `RATE_LIMIT:${user.id}`;
            await redisClient.incr(rateLimitKey);
            await redisClient.expire(rateLimitKey, 60);
          }

          return { user };
        }
  }));

  return app;
}
