# Imagen 4 Setup Guide

## Overview

Imagen 4 is Google's latest image generation model, offering superior quality and native character consistency. This guide explains how to set it up for Mascot.

## Prerequisites

1. **Google Cloud Account**
   - Sign up at https://cloud.google.com
   - Create a new project or use an existing one

2. **Enable APIs**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to "APIs & Services" > "Library"
   - Enable "Vertex AI API"

3. **Service Account**
   - Go to "IAM & Admin" > "Service Accounts"
   - Create a new service account (e.g., "mascot-imagen4")
   - Grant role: "Vertex AI User"
   - Create and download a JSON key file

## Installation

```bash
cd backend
npm install @google-cloud/vertexai
```

## Configuration

Add these environment variables to your `.env` file or Railway:

### Option 1: Service Account JSON File (Local Development)

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GOOGLE_CLOUD_LOCATION=us-central1
```

### Option 2: Base64 Encoded Credentials (Production/Railway)

1. Encode your service account JSON file:
```bash
cat service-account-key.json | base64
```

2. Add to environment variables:
```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CREDENTIALS=<base64-encoded-json>
GOOGLE_CLOUD_LOCATION=us-central1
```

## Pricing

- **Imagen 4**: ~$0.01-0.02 per image (1024×1024)
- **4 variations**: ~$0.04-0.08 per generation
- **Monthly estimate** (1000 users, 10 mascots/user): ~$600/month

Compare to SDXL (~$0.003/image): Imagen 4 is ~5-7x more expensive but offers significantly better quality.

## Testing

Once configured, test the service:

```bash
# In your backend
curl -X POST http://localhost:3000/api/v1/mascots \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Mascot",
    "prompt": "A friendly robot mascot",
    "style": "kawaii",
    "numVariations": 1
  }'
```

## Fallback to SDXL

If Imagen 4 is not configured, the system will:
1. Log a warning
2. Return an error to the user
3. You can implement SDXL fallback in `mascot-generation.processor.ts`

To add SDXL fallback, see `MODEL_RECOMMENDATIONS.md` for Replicate integration.

## Troubleshooting

### Error: "Imagen 4 service not initialized"
- Check `GOOGLE_CLOUD_PROJECT_ID` is set
- Verify credentials are correct
- Ensure Vertex AI API is enabled

### Error: "Permission denied"
- Check service account has "Vertex AI User" role
- Verify project billing is enabled

### High latency
- Consider using `us-central1` or `us-east1` regions
- Check Google Cloud status page

## Alternative: SDXL (Budget Option)

If cost is a concern, you can use SDXL via Replicate instead:

1. Set `REPLICATE_API_TOKEN` environment variable
2. Modify `mascot-generation.processor.ts` to use Replicate instead of Imagen 4
3. See `MODEL_RECOMMENDATIONS.md` for SDXL implementation
