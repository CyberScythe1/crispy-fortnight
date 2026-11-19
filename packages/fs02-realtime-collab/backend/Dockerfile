FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY packages/shared ./packages/shared
COPY packages/fs02-realtime-collab/backend/package.json ./packages/fs02-realtime-collab/backend/package.json
COPY packages/fs02-realtime-collab/backend/prisma ./packages/fs02-realtime-collab/backend/prisma

# Build shared package
WORKDIR /app/packages/shared
RUN npm install --no-workspaces && npm run build

# Install backend deps (remove workspace reference, don't use workspaces)
WORKDIR /app/packages/fs02-realtime-collab/backend
RUN sed -i '/"@crispy-fortnight\/shared":/d' package.json
RUN npm install --no-workspaces

# Link shared package manually
RUN cd /app && mkdir -p node_modules/@crispy-fortnight/shared && \
    ln -sf /app/packages/shared/package.json /app/node_modules/@crispy-fortnight/shared/package.json && \
    ln -sf /app/packages/shared/dist /app/node_modules/@crispy-fortnight/shared/dist

# Copy backend source
WORKDIR /app
COPY packages/fs02-realtime-collab/backend/src ./packages/fs02-realtime-collab/backend/src

EXPOSE 4002
EXPOSE 4003
CMD ["sh", "-c", "cd packages/fs02-realtime-collab/backend && npx prisma db push && npx prisma generate && npm start"]
