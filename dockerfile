FROM node:22.14.0-alpine3.21

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /usr/src/app


COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install

COPY . .

EXPOSE 3004