# AI Model & Provider Recommendations for MascotForge

## Overview

This document outlines recommended AI models and providers for achieving Masko-level quality in mascot generation, animations, and logo packs.

## 1. Image Generation (Mascots)

### 🏆 Primary Recommendation: Google Imagen 4 (via Vertex AI)

**Why Imagen 4:**
- **Superior quality**: Best-in-class prompt understanding and image coherence
- **Native character consistency**: Built-in support for maintaining character identity across generations
- **Excellent style handling**: Handles kawaii, cartoon, 3D, flat, pixel art styles naturally
- **Fast generation**: Optimized inference pipeline
- **Enterprise-grade**: Google Cloud infrastructure, reliable and scalable
- **Perfect for mascots**: Designed for character generation use cases

**Provider: Google Cloud Vertex AI**
- API: `https://cloud.google.com/vertex-ai`
- Model: `imagegeneration@006` (Imagen 4)
- Pros: 
  - Highest quality output
  - Native character consistency features
  - Excellent prompt following
  - Reliable Google Cloud infrastructure
  - Built-in safety filters
- Cons: 
  - Requires Google Cloud account setup
  - Slightly higher cost than SDXL
  - Less fine-tuning control than open-source models
- Cost: ~$0.01-0.02 per image (1024×1024)
- Setup: Requires Google Cloud project + Vertex AI API enabled

**Implementation:**
```typescript
import { VertexAI } from '@google-cloud/vertexai';

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: 'us-central1',
});

const model = 'imagegeneration@006';

async function generateMascotWithImagen4(
  prompt: string,
  style: string,
  brandColors?: { primary?: string; secondary?: string },
  negativePrompt?: string
) {
  const fullPrompt = buildPrompt(prompt, style, brandColors, negativePrompt);
  
  const response = await vertexAI.preview.getGenerativeModel({ model }).generateContent({
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: 0.4,
      topK: 32,
      topP: 1,
      maxOutputTokens: 1024,
    },
  });

  const imageData = response.response.candidates[0].content.parts[0].inlineData.data;
  return Buffer.from(imageData, 'base64');
}

function buildPrompt(
  prompt: string,
  style: string,
  brandColors?: { primary?: string; secondary?: string },
  negativePrompt?: string
): string {
  let fullPrompt = `${prompt}, ${style} style, mascot character, transparent background, high quality, professional`;
  
  if (brandColors?.primary) {
    fullPrompt += `, primary color: ${brandColors.primary}`;
  }
  if (brandColors?.secondary) {
    fullPrompt += `, secondary color: ${brandColors.secondary}`;
  }
  
  if (negativePrompt) {
    fullPrompt += `, avoid: ${negativePrompt}`;
  }
  
  return fullPrompt;
}
```

### Alternative: Stable Diffusion XL (SDXL) + LoRA

**Why SDXL (Budget Option):**
- High-quality 1024×1024+ output resolution
- Excellent prompt understanding
- Strong community support and fine-tuning resources
- **Cost-effective**: ~5-10x cheaper than Imagen 4
- Full control with LoRA fine-tuning

**Providers:**
1. **Replicate** (Recommended for SDXL)
   - API: `https://replicate.com`
   - Models: `stability-ai/sdxl`, `stability-ai/sdxl-base`
   - Pros: Simple API, pay-per-use, no infrastructure management
   - Cons: Slightly higher latency, variable pricing
   - Cost: ~$0.002-0.004 per image

2. **Together AI**
   - API: `https://together.ai`
   - Models: SDXL variants
   - Pros: Competitive pricing, fast inference
   - Cons: Less established than Replicate
   - Cost: ~$0.001-0.003 per image

3. **Self-hosted** (Advanced)
   - Use `stabilityai/stable-diffusion-xl-base-1.0` on GPU instances
   - Pros: Full control, potentially lower costs at scale
   - Cons: Infrastructure management, scaling complexity
   - Cost: ~$0.0005-0.001 per image (at scale)

### Character Consistency Strategy

**LoRA (Low-Rank Adaptation) Fine-tuning:**
- Train LoRA adapters for each character using the initial mascot generation
- Store LoRA weights in object storage
- Use same LoRA + seed for consistent character generation across poses

**Implementation:**
```typescript
// Pseudo-code for consistent character generation
async function generateConsistentMascot(
  characterId: string,
  prompt: string,
  style: MascotStyle
) {
  const lora = await loadCharacterLoRA(characterId);
  const seed = getCharacterSeed(characterId);
  
  return await replicate.run('stability-ai/sdxl', {
    input: {
      prompt: `${prompt}, ${style} style`,
      lora: lora.url,
      seed: seed,
      num_outputs: 1,
      aspect_ratio: '1:1',
      output_format: 'png',
    },
  });
}
```

### Style Presets Implementation

**Kawaii Style:**
- Prompt suffix: `kawaii, cute, chibi, big eyes, pastel colors, soft shading`
- Optional LoRA: Use community LoRA like `kawaii-diffusion`

**Cartoon Style:**
- Prompt suffix: `cartoon style, 2D illustration, vibrant colors, clean lines`
- Optional LoRA: `cartoon-diffusion` or similar

**Flat Style:**
- Prompt suffix: `flat design, minimal, vector style, no shadows, solid colors`

**Pixel Style:**
- Prompt suffix: `pixel art, 8-bit, retro game style, low resolution`
- Post-process: Downscale and pixelate if needed

**3D Style:**
- Prompt suffix: `3D render, Blender, C4D, octane render, high detail`
- Consider using specialized 3D models or post-processing

**Match Brand Style:**
- Use ControlNet with reference image
- Or use IP-Adapter for style transfer
- Provider: Replicate has `lllyasviel/controlnet` models

### Recommended Model Configuration

```typescript
const STYLE_PROMPTS = {
  kawaii: 'kawaii, cute, chibi, big eyes, pastel colors, soft shading, mascot character',
  cartoon: 'cartoon style, 2D illustration, vibrant colors, clean lines, mascot character',
  flat: 'flat design, minimal, vector style, no shadows, solid colors, mascot character',
  pixel: 'pixel art, 8-bit, retro game style, low resolution, mascot character',
  '3d': '3D render, Blender, C4D, octane render, high detail, mascot character',
  match_brand: 'mascot character, match reference style', // + ControlNet/IP-Adapter
};
```

---

## 2. Animation Generation

### Option A: Video Generation (Recommended for Quality)

**Primary Recommendation: AnimateDiff + ControlNet**

**Providers:**
1. **Runway ML** (Best Quality)
   - API: `https://runwayml.com`
   - Model: Gen-2 or Gen-3
   - Pros: Excellent video quality, alpha channel support
   - Cons: Higher cost, slower generation
   - Cost: ~$0.05-0.10 per second of video

2. **Pika Labs** (Alternative)
   - API: `https://pika.art` (if available)
   - Pros: Good quality, competitive pricing
   - Cons: Less established API

3. **Self-hosted AnimateDiff**
   - Model: `guoyww/animatediff-motion-adapter-v1-5-2`
   - Pros: Full control, lower cost at scale
   - Cons: Complex setup, requires video expertise
   - Cost: ~$0.01-0.02 per second (at scale)

**Implementation Strategy:**
```typescript
// Generate animation frames using AnimateDiff
async function generateAnimation(
  mascotImageUrl: string,
  action: AnimationAction,
  resolution: number
) {
  // Use ControlNet to maintain character consistency
  const frames = await runway.generate({
    image: mascotImageUrl,
    prompt: `${action} animation, transparent background`,
    duration: 2, // 2 seconds
    fps: 12,
    resolution: resolution,
    alpha: true, // Request alpha channel
  });
  
  // Convert to WebM VP9 and MOV HEVC with alpha
  return await processVideoWithAlpha(frames);
}
```

### Option B: Sprite Sheet Generation (Faster, Lower Cost)

**Approach:**
1. Generate individual frames using SDXL with pose variations
2. Use ControlNet pose detection or manual pose descriptions
3. Assemble into sprite sheet

**Providers:**
- Same as image generation (Replicate, Together AI)
- Generate 12-24 frames per animation
- Cost: ~$0.03-0.10 per animation (12-24 frames)

**Implementation:**
```typescript
async function generateSpriteSheet(
  mascotImageUrl: string,
  action: AnimationAction,
  frameCount: number = 12
) {
  const posePrompts = getPosePromptsForAction(action, frameCount);
  
  const frames = await Promise.all(
    posePrompts.map((prompt, index) =>
      generateFrame(mascotImageUrl, prompt, index)
    )
  );
  
  return await assembleSpriteSheet(frames);
}
```

### Video Format Conversion (Alpha Channel)

**WebM VP9 with Alpha:**
- Use `ffmpeg` with `libvpx-vp9` codec
- Command: `ffmpeg -i input.mov -c:v libvpx-vp9 -pix_fmt yuva420p output.webm`

**MOV HEVC with Alpha:**
- Use `ffmpeg` with `hevc_videotoolbox` (macOS) or `libx265`
- Command: `ffmpeg -i input.mov -c:v hevc_videotoolbox -alpha_mode 1 output.mov`

**Recommended Library:** `fluent-ffmpeg` for Node.js

---

## 3. Logo & Icon Pack Generation

### Approach: Vectorization + Multi-size Generation

**Step 1: Generate Base Logo**
- Use SDXL with logo-specific prompts
- Or extract/refine from mascot base image
- Prompt: `logo design, minimalist, scalable, vector style, ${mascotDescription}`

**Step 2: Vectorization (Optional)**
- Use `potrace` or `autotrace` to convert PNG to SVG
- Or use AI vectorization: `vectorizer.ai` API
- Pros: True scalability
- Cons: May lose detail, additional cost

**Step 3: Multi-size Generation**
- Use `sharp` (Node.js) to resize and optimize
- Generate all required sizes from base high-res image
- Apply appropriate optimizations per size

**Implementation:**
```typescript
import sharp from 'sharp';

async function generateLogoPack(
  mascotImageUrl: string,
  brandColors: string[]
) {
  // Download base image
  const baseImage = await downloadImage(mascotImageUrl);
  
  // Generate logo variants (if needed)
  const logoVariants = await generateLogoVariants(baseImage, brandColors);
  
  // Define sizes
  const sizes = [
    { name: 'favicon-16', width: 16, height: 16 },
    { name: 'favicon-32', width: 32, height: 32 },
    { name: 'ios-1024', width: 1024, height: 1024 },
    // ... more sizes
  ];
  
  // Generate all sizes
  const logos = await Promise.all(
    sizes.map(async ({ name, width, height }) => {
      const buffer = await sharp(baseImage)
        .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      
      const url = await uploadToS3(buffer, `logos/${name}.png`);
      
      return { name, width, height, url };
    })
  );
  
  // Create ZIP file
  const zipUrl = await createZipFile(logos);
  
  return { sizes: logos, zipFileUrl: zipUrl };
}
```

**Recommended Tools:**
- **sharp**: Fast image processing in Node.js
- **jimp**: Alternative image processing library
- **archiver**: Create ZIP files
- **potrace**: Vectorization (if needed)

---

## 4. Cost Estimates

### Per-User Monthly Costs (at scale, 1000 users)

**Image Generation (Imagen 4):**
- Average: 10 mascots/user/month (4 variations each = 40 images)
- Cost: 40 × $0.015 = $0.60/user/month
- Total: $600/month

**Image Generation (SDXL - Budget Option):**
- Average: 10 mascots/user/month (4 variations each = 40 images)
- Cost: 40 × $0.003 = $0.12/user/month
- Total: $120/month

**Animation Generation:**
- Average: 2 animations/user/month
- Cost: 2 × $0.50 = $1.00/user/month (sprite sheet approach)
- Total: $1,000/month

**Logo Packs:**
- Average: 1 logo pack/user/month
- Cost: 1 × $0.01 = $0.01/user/month (mostly processing, minimal AI)
- Total: $10/month

**Total AI Costs:** ~$1,040/month for 1000 users
**Per User:** ~$1.04/month

### Infrastructure Costs (Separate)
- Compute (workers): ~$200-500/month
- Storage (S3): ~$50-100/month
- CDN (Cloudflare): ~$20-50/month
- Database: ~$50-100/month

---

## 5. Implementation Priority

### Phase 1 (MVP):
1. ✅ SDXL via Replicate for image generation
2. ✅ Sprite sheet approach for animations (12 frames)
3. ✅ Sharp-based logo pack generation

### Phase 2 (Quality Improvements):
1. LoRA fine-tuning for character consistency
2. AnimateDiff or Runway for video animations
3. Vectorization for logos

### Phase 3 (Scale Optimization):
1. Self-hosted SDXL on GPU instances
2. Batch processing optimizations
3. Caching and CDN optimization

---

## 6. API Integration Examples

### Replicate SDXL Example
```typescript
import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

async function generateMascot(prompt: string, style: string) {
  const output = await replicate.run(
    'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
    {
      input: {
        prompt: `${prompt}, ${style} style, mascot character, transparent background`,
        num_outputs: 1,
        aspect_ratio: '1:1',
        output_format: 'png',
      },
    }
  );
  
  return output[0]; // URL to generated image
}
```

### Runway Video Example
```typescript
// Note: Runway API may vary, check latest documentation
async function generateAnimationVideo(imageUrl: string, action: string) {
  const response = await fetch('https://api.runwayml.com/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: imageUrl,
      prompt: `${action} animation`,
      duration: 2,
      fps: 12,
      alpha: true,
    }),
  });
  
  return await response.json();
}
```

---

## 7. Quality Assurance

### Testing Checklist:
- [ ] Character consistency across multiple generations
- [ ] Animation smoothness and frame rate
- [ ] Logo clarity at small sizes (16×16, 32×32)
- [ ] Alpha channel quality in videos
- [ ] CDN delivery speed and reliability
- [ ] Credit deduction accuracy
- [ ] Error handling and retry logic

### Monitoring:
- Track generation success rates
- Monitor API latency and costs
- Log failed generations for debugging
- Alert on credit balance issues

---

## Conclusion

Start with **Replicate + SDXL** for images, **sprite sheet approach** for animations, and **sharp-based processing** for logos. This provides a solid MVP that can achieve Masko-level quality while keeping costs manageable. As you scale, consider self-hosting and more advanced models for cost optimization.
