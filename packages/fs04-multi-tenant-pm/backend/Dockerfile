FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY packages/fs04-multi-tenant-pm/backend/package.json ./packages/fs04-multi-tenant-pm/backend/package.json

WORKDIR /app/packages/shared
RUN npm install && npm run build

WORKDIR /app
RUN mkdir -p node_modules/@crispy-fortnight && cp -r packages/shared node_modules/@crispy-fortnight/shared

WORKDIR /app/packages/fs04-multi-tenant-pm/backend
RUN sed -i '/"@crispy-fortnight\/shared":/d' package.json
RUN npm install

WORKDIR /app
COPY packages/fs04-multi-tenant-pm/backend ./packages/fs04-multi-tenant-pm/backend

EXPOSE 4001
CMD ["sh", "-c", "cd packages/fs04-multi-tenant-pm/backend && npx prisma migrate deploy && npx prisma generate && npm start"]
