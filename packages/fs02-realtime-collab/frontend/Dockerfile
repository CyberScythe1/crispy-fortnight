FROM node:20-alpine AS builder
WORKDIR /app
COPY packages/fs02-realtime-collab/frontend/package*.json ./
RUN npm install --include=dev
COPY packages/fs02-realtime-collab/frontend/ ./
RUN ./node_modules/.bin/vite build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14
COPY --from=builder /app/dist ./dist
EXPOSE 3002
CMD ["serve", "-s", "dist", "-l", "3002"]
