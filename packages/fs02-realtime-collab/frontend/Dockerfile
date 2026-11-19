FROM node:20-alpine AS builder
WORKDIR /app
COPY packages/fs02-realtime-collab/frontend/package*.json ./
RUN npm install --include=dev
COPY packages/fs02-realtime-collab/frontend/ ./
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_PM_URL
ARG VITE_COLLAB_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_PM_URL=$VITE_PM_URL
ENV VITE_COLLAB_URL=$VITE_COLLAB_URL
RUN ./node_modules/.bin/vite build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14
COPY --from=builder /app/dist ./dist
EXPOSE 3002
CMD ["serve", "-s", "dist", "-l", "3002"]
