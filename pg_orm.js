const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function initPrisma() {
  const prismaDir = path.join(__dirname, '../prisma');
  const schemaPath = path.join(prismaDir, 'schema.prisma');
  const envPath = path.join(__dirname, '../.env');

  if (!fs.existsSync(prismaDir)) fs.mkdirSync(prismaDir);

  if (!fs.existsSync(schemaPath)) {
    const schema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String
}
`;
    fs.writeFileSync(schemaPath, schema);
  }

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb"\n');
  }

  try {
    const prismaBin = path.join(__dirname, '../node_modules/.bin/prisma');
    execSync(`${prismaBin} generate`, { stdio: 'inherit' });
    execSync(`${prismaBin} migrate dev --name init --skip-seed`, { stdio: 'inherit' });
    console.log('✅ Prisma initialized');
  } catch (err) {
    console.error('❌ Prisma init failed', err);
  }
}

module.exports = initPrisma;


=============================



const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { PrismaClient } = require('@prisma/client');
const initPrisma = require('./utils/initPrisma');

initPrisma();

const prisma = new PrismaClient();

const typeDefs = gql`
  type User {
    id: Int!
    email: String!
    name: String!
  }

  type Mutation {
    createUser(email: String!, name: String!): User!
  }

  type Query {
    _: Boolean
  }
`;

const resolvers = {
  Mutation: {
    createUser: (_, { email, name }) => {
      return prisma.user.create({
        data: { email, name },
      });
    },
  },
};

async function start() {
  const app = express();
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  app.listen(4000, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
}

start();
