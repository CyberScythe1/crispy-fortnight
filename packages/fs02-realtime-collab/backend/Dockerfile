FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY packages/fs02-realtime-collab/backend/package.json ./packages/fs02-realtime-collab/backend/package.json

WORKDIR /app/packages/shared
RUN npm install && npm run build

WORKDIR /app
RUN mkdir -p node_modules/@crispy-fortnight && cp -r packages/shared node_modules/@crispy-fortnight/shared

WORKDIR /app/packages/fs02-realtime-collab/backend
RUN sed -i '/"@crispy-fortnight\/shared":/d' package.json
RUN npm install

WORKDIR /app
COPY packages/fs02-realtime-collab/backend ./packages/fs02-realtime-collab/backend

EXPOSE 4002
EXPOSE 4003
CMD ["sh", "-c", "cd packages/fs02-realtime-collab/backend && npx prisma db push && npx prisma generate && npm start"]
