# MascotForge Architecture

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Figma Plugin                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   UI (React) │  │ Plugin Code  │  │  RPC Bridge  │         │
│  │   (iframe)   │◄─┤  (TypeScript) │◄─┤  (postMessage)│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API (NestJS)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Auth API   │  │  Mascot API  │  │  Billing API │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Animation API│  │  Logo API   │  │  Credit API  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │   PostgreSQL     │  │      Redis       │
        │   (Primary DB)   │  │  (Queue/Cache)   │
        └──────────────────┘  └──────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────────┐
        │         Job Queue (BullMQ)                │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐│
        │  │ Image    │  │Animation │  │  Logo    ││
        │  │  Jobs    │  │  Jobs    │  │  Jobs    ││
        │  └──────────┘  └──────────┘  └──────────┘│
        └──────────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────────┐
        │      AI Worker Services                   │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐│
        │  │  Image   │  │ Animation│  │  Logo    ││
        │  │Generator │  │Generator │  │Generator ││
        │  │ (SDXL +  │  │ (Video + │  │ (Vector  ││
        │  │  LoRA)   │  │  Alpha)  │  │  + PNG)  ││
        │  └──────────┘  └──────────┘  └──────────┘│
        └──────────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────────┐
        │      Object Storage (S3-compatible)       │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐│
        │  │   PNG    │  │  Videos  │  │  Lottie  ││
        │  │  Images  │  │ (WebM +  │  │  Files   ││
        │  │          │  │   MOV)   │  │          ││
        │  └──────────┘  └──────────┘  └──────────┘│
        └──────────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────────┐
        │      CDN (Cloudflare)                     │
        │   Permanent URLs for all assets           │
        └──────────────────────────────────────────┘
                              │
                              ▼
        ┌──────────────────────────────────────────┐
        │      External Services                    │
        │  ┌──────────┐  ┌──────────┐              │
        │  │  Stripe  │  │  AI APIs │              │
        │  │ (Billing)│  │ (Replicate│             │
        │  │          │  │ /Together)│             │
        │  └──────────┘  └──────────┘              │
        └──────────────────────────────────────────┘
```

## Component Responsibilities

### Figma Plugin
- **UI Layer**: React-based interface in Figma's iframe panel
- **Plugin Controller**: TypeScript code running in Figma's plugin context
- **RPC Bridge**: Secure communication between UI and plugin code via `postMessage`

### Backend API (NestJS)
- **RESTful API**: TypeScript/Node.js with NestJS framework
- **Authentication**: JWT-based auth with workspace/team support
- **Credit Management**: Real-time credit tracking and validation
- **Job Orchestration**: Queue management for async AI generation tasks

### Job Queue (BullMQ + Redis)
- **Async Processing**: Non-blocking job queue for AI generation
- **Retry Logic**: Automatic retries for failed generations
- **Progress Tracking**: Real-time job status updates via WebSockets

### AI Worker Services
- **Image Generation**: SDXL-based models with LoRA for style consistency
- **Animation Generation**: Video synthesis with alpha channel support
- **Logo Generation**: Vectorization and multi-size PNG generation

### Storage & CDN
- **Object Storage**: S3-compatible (AWS S3, Cloudflare R2, or DigitalOcean Spaces)
- **CDN**: Cloudflare for global asset delivery with permanent URLs
- **Format Support**: PNG (transparent), WebM VP9 (alpha), MOV HEVC (alpha), Lottie JSON

## Data Flow Examples

### Mascot Generation Flow
1. User submits prompt in Figma plugin UI
2. Plugin sends POST /mascots to backend API
3. API validates credits, creates job, enqueues to Redis
4. AI worker picks up job, generates image via SDXL + LoRA
5. Worker uploads PNG to S3, gets CDN URL
6. Worker updates job status, notifies via WebSocket
7. Plugin receives notification, displays result in Figma canvas

### Animation Generation Flow
1. User selects mascot and action (e.g., "wave")
2. Plugin sends POST /mascots/:id/animation
3. API validates credits (24-25 credits), creates animation job
4. Worker generates sprite sequence or video with alpha
5. Worker creates both WebM VP9 and MOV HEVC versions
6. Worker uploads to S3, generates CDN URLs
7. Plugin inserts frames or embeds video link in Figma

## Technology Stack Justification

### Backend: NestJS (TypeScript/Node.js)
- **Why**: Enterprise-grade framework with excellent TypeScript support, modular architecture, built-in dependency injection, and strong ecosystem
- **Scalability**: Easy horizontal scaling, supports microservices pattern
- **Developer Experience**: Strong typing, decorators, and clear separation of concerns

### Database: PostgreSQL + Redis
- **PostgreSQL**: ACID compliance, JSON support for flexible schemas, excellent for relational data (users, workspaces, mascots)
- **Redis**: Fast in-memory storage for job queues (BullMQ), caching, and session management

### AI Models: SDXL + LoRA + Video Synthesis
- **SDXL**: High-quality image generation (1024x1024+), good prompt understanding
- **LoRA**: Lightweight fine-tuning for character consistency and style presets
- **Video/Animation**: Commercial APIs (Runway, Pika) or open-source (AnimateDiff) for sprite/video generation

### Storage: S3-compatible + Cloudflare CDN
- **S3-compatible**: Industry standard, reliable, cost-effective object storage
- **Cloudflare CDN**: Global edge network, permanent URLs, automatic optimization

### Billing: Stripe
- **Why**: Industry standard, excellent API, supports subscriptions + usage-based billing
- **Credit System**: Track usage, enforce limits, handle refunds for failed jobs

## Security Considerations

- **Authentication**: JWT tokens with refresh mechanism
- **API Keys**: Secure storage of AI provider API keys (environment variables, secrets manager)
- **Rate Limiting**: Per-user and per-workspace rate limits
- **Credit Validation**: Server-side validation before job creation
- **CDN Security**: Signed URLs or public URLs with access control

## Scalability Considerations

- **Horizontal Scaling**: Stateless API servers, worker pools can scale independently
- **Queue Management**: Multiple worker instances processing jobs in parallel
- **Caching**: Redis cache for frequently accessed data (user info, mascot metadata)
- **CDN**: Offloads bandwidth from origin servers
- **Database**: Connection pooling, read replicas for heavy read workloads
