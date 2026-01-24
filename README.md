# Mascot - AI Mascot Generator

Production-grade SaaS Figma plugin for generating AI mascots, animations, and logo packs.

## Architecture

- **Backend**: NestJS + TypeORM + BullMQ
- **Database**: PostgreSQL
- **Cache**: Redis
- **Plugin**: Figma Plugin (TypeScript + React)

## Deployment

Backend deployed on Railway with PostgreSQL and Redis.

## Getting Started

See deployment guides:
- `DEPLOYER_SUR_RAILWAY.md` - Deploy to Railway
- `INSTRUCTIONS_FINALES.md` - Complete setup guide

## Local Development

```bash
# Backend
cd backend
npm install
docker-compose up -d
npm run start:dev

# Plugin
cd figma-plugin
npm install
npm run build
```

## Documentation

- API Documentation: `/api/docs` (Swagger)
- Plugin guides in `figma-plugin/` directory
