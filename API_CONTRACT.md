# MascotForge API Contract

## Base URL
```
https://api.mascotforge.com/api/v1
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```typescript
{
  email: string;
  password: string;
  name?: string;
}
```

**Response:**
```typescript
{
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    plan: "free" | "creator" | "studio" | "agency";
    creditBalance: number;
  };
}
```

#### POST /auth/login
Authenticate and get access token.

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:** Same as `/auth/register`

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```typescript
{
  refreshToken: string;
}
```

---

### Mascots

#### POST /mascots
Generate a new mascot character.

**Request Body:**
```typescript
{
  name: string;
  prompt: string;
  style: "kawaii" | "cartoon" | "flat" | "pixel" | "3d" | "match_brand";
  referenceImageUrl?: string; // For "match_brand" style
  figmaFileId?: string;
}
```

**Response:**
```typescript
{
  id: string;
  name: string;
  prompt: string;
  style: string;
  characterId: string | null; // Stable ID for consistency
  status: "pending" | "generating" | "completed" | "failed";
  fullBodyImageUrl: string | null; // CDN URL
  avatarImageUrl: string | null; // CDN URL
  squareIconUrl: string | null; // CDN URL
  referenceImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**Credit Cost:** 1 credit

#### GET /mascots
List all mascots for the authenticated user/workspace.

**Query Parameters:**
- `page?: number` (default: 1)
- `limit?: number` (default: 20, max: 100)
- `workspaceId?: string`
- `figmaFileId?: string`

**Response:**
```typescript
{
  data: MascotResponseDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### GET /mascots/:id
Get a specific mascot by ID.

**Response:** `MascotResponseDto`

#### DELETE /mascots/:id
Delete a mascot (soft delete or hard delete based on policy).

---

### Animations

#### POST /mascots/:id/animations
Generate an animation for a mascot.

**Request Body:**
```typescript
{
  action: "wave" | "celebrate" | "think" | "sleep" | "sad" | "exercise" | "backflip" | "dance" | "jump" | "idle";
  resolution?: number; // 128 | 240 | 360 | 480 | 720 (default: 360)
  figmaFileId?: string;
}
```

**Response:**
```typescript
{
  id: string;
  mascotId: string;
  action: string;
  status: "pending" | "generating" | "processing" | "completed" | "failed";
  resolution: number;
  spriteSheetUrl: string | null; // CDN URL
  webmVideoUrl: string | null; // CDN URL (VP9 with alpha)
  movVideoUrl: string | null; // CDN URL (HEVC with alpha)
  lottieUrl: string | null; // CDN URL
  frameCount: number | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
}
```

**Credit Cost:** 24-25 credits

#### POST /mascots/:id/animations/generate-default
Generate a default pack of animations (wave, celebrate, think, sleep, etc.).

**Request Body:**
```typescript
{
  resolution?: number; // 128 | 240 | 360 | 480 | 720 (default: 360)
  figmaFileId?: string;
}
```

**Response:**
```typescript
{
  jobs: AnimationJobResponseDto[];
  totalCreditsUsed: number;
}
```

**Credit Cost:** ~250 credits (10 animations × 25 credits)

#### GET /mascots/:id/animations
List all animations for a mascot.

**Response:**
```typescript
{
  data: AnimationJobResponseDto[];
}
```

#### GET /animations/:id
Get a specific animation job by ID.

**Response:** `AnimationJobResponseDto`

#### GET /animations/:id/status
Get real-time status of an animation job (for polling).

**Response:**
```typescript
{
  id: string;
  status: string;
  progress?: number; // 0-100
  errorMessage?: string;
}
```

---

### Logo Packs

#### POST /mascots/:id/logo-packs
Generate a logo pack from a mascot.

**Request Body:**
```typescript
{
  brandColors?: string[]; // Hex colors, e.g., ["#FF5733", "#33FF57"]
  figmaFileId?: string;
}
```

**Response:**
```typescript
{
  id: string;
  mascotId: string;
  status: "pending" | "generating" | "completed" | "failed";
  brandColors: string[] | null;
  sizes: Array<{
    name: string; // e.g., "favicon-16", "ios-1024", "android-512"
    width: number;
    height: number;
    url: string; // CDN URL
  }>;
  zipFileUrl: string | null; // CDN URL for downloadable ZIP
  createdAt: string;
  updatedAt: string;
}
```

**Credit Cost:** 20 credits

**Logo Sizes Generated:**
- favicon-16 (16×16)
- favicon-32 (32×32)
- favicon-48 (48×48)
- apple-touch-icon (180×180)
- android-36 (36×36)
- android-48 (48×48)
- android-72 (72×72)
- android-96 (96×96)
- android-144 (144×144)
- android-192 (192×192)
- android-512 (512×512)
- ios-1024 (1024×1024)
- generic-256 (256×256)
- generic-512 (512×512)
- generic-1024 (1024×1024)

#### GET /mascots/:id/logo-packs
List all logo packs for a mascot.

**Response:**
```typescript
{
  data: LogoPackResponseDto[];
}
```

#### GET /logo-packs/:id
Get a specific logo pack by ID.

**Response:** `LogoPackResponseDto`

#### GET /logo-packs/:id/download
Get a signed URL to download the logo pack ZIP file.

**Response:**
```typescript
{
  downloadUrl: string; // Signed URL, expires in 1 hour
}
```

---

### Credits

#### GET /credits/balance
Get current credit balance for user/workspace.

**Response:**
```typescript
{
  balance: number;
  plan: string;
  creditsLastResetAt: string | null;
  monthlyAllowance: number; // Based on plan
}
```

#### GET /credits/transactions
Get credit transaction history.

**Query Parameters:**
- `page?: number`
- `limit?: number`
- `type?: "purchase" | "subscription_grant" | "usage" | "refund" | "admin_adjustment"`

**Response:**
```typescript
{
  data: Array<{
    id: string;
    type: string;
    amount: number; // Positive for added, negative for used
    balanceAfter: number;
    status: string;
    description: string;
    createdAt: string;
  }>;
  meta: PaginationMeta;
}
```

---

### Billing

#### GET /billing/subscription
Get current subscription details.

**Response:**
```typescript
{
  plan: string;
  status: "active" | "canceled" | "past_due";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
}
```

#### POST /billing/checkout
Create a Stripe checkout session for subscription upgrade.

**Request Body:**
```typescript
{
  plan: "creator" | "studio" | "agency";
  successUrl: string;
  cancelUrl: string;
}
```

**Response:**
```typescript
{
  checkoutUrl: string; // Stripe checkout URL
}
```

#### POST /billing/webhook
Stripe webhook endpoint (handles subscription events).

**Note:** This endpoint is called by Stripe, not by clients.

---

### Workspaces

#### GET /workspaces
List workspaces the user is a member of.

**Response:**
```typescript
{
  data: Array<{
    id: string;
    name: string;
    slug: string;
    role: "owner" | "admin" | "member";
    creditBalance: number;
  }>;
}
```

#### POST /workspaces
Create a new workspace.

**Request Body:**
```typescript
{
  name: string;
}
```

**Response:**
```typescript
{
  id: string;
  name: string;
  slug: string;
  creditBalance: number;
  createdAt: string;
}
```

---

## WebSocket Events (Real-time Job Updates)

Connect to: `wss://api.mascotforge.com`

**Events:**

### `job:status`
Emitted when a job status changes.

```typescript
{
  jobId: string;
  jobType: "mascot_generation" | "animation_generation" | "logo_pack_generation";
  status: string;
  progress?: number;
  errorMessage?: string;
  result?: any; // Job-specific result data
}
```

---

## Error Responses

All errors follow this format:

```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

**Common Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient credits, plan restrictions)
- `404` - Not Found
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

---

## Rate Limiting

- Free tier: 10 requests/minute
- Creator tier: 60 requests/minute
- Studio tier: 200 requests/minute
- Agency tier: 500 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```
