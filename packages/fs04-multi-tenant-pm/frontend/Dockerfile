FROM node:20-alpine AS builder
WORKDIR /app
COPY packages/fs04-multi-tenant-pm/frontend/package*.json ./
RUN npm install --include=dev
COPY packages/fs04-multi-tenant-pm/frontend/ ./
RUN ./node_modules/.bin/vite build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["serve", "-s", "dist", "-l", "3001"]
