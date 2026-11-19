# Crispy Fortnight - Capstone Projects Monorepo

This repository contains two capstone projects for the Full-Stack Development track:

## Projects

### Project Management Platform
A Jira-like product where each company gets its own isolated workspace with boards, sprints, and billing.

**Tech Stack:** React 18, Node.js/Express, PostgreSQL, Prisma, Redis, Socket.io, Stripe

### Collaborative Workspace (Notion/Figma Style)
Several people edit the same document or canvas at once, see each other's cursors, and never lose changes.

**Tech Stack:** React 18, Node.js/Express, PostgreSQL, Prisma, Redis, Yjs/Automerge, WebRTC

## Monorepo Structure

```
crispy-fortnight/
├── packages/
│   ├── fs04-multi-tenant-pm/     # Project Management Platform
│   │   ├── backend/              # Express.js API
│   │   ├── frontend/             # React 18 + Vite
│   │   └── e2e/                  # Playwright tests
│   ├── fs02-realtime-collab/     # Collaborative Workspace
│   │   ├── backend/              # Express.js API + WebSocket
│   │   ├── frontend/             # React 18 + Vite + Yjs
│   │   └── e2e/                  # Playwright tests
│   └── shared/                   # Shared types, utilities, configs
├── docker-compose.yml            # Local development
├── docker-compose.prod.yml       # Production
├── turbo.json                    # Turborepo config
└── package.json                  # Root workspace
```

## Development

```bash
# Install dependencies
npm install

# Start all services locally
docker-compose up -d

# Run development servers
npm run dev

# Run tests
npm run test          # Unit tests
npm run test:e2e      # E2E tests

# Build for production
npm run build
```

## Deployment

Each package has its own Dockerfile and can be deployed independently. Production deployment uses `docker-compose.prod.yml`.

## Commit Convention

Follows Conventional Commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks
