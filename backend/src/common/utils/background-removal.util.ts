import * as sharp from 'sharp';

/**
 * Background removal for mascot/create and poses.
 * Only removes pixels that are CONNECTED TO THE BORDER (flood fill from edges).
 * Interior light areas (eyes, white inside character) are NOT touched.
 * Use aggressive: true for pose images (gray/dark bg, larger tolerance).
 * Use eraseSemiTransparentBorder: true to remove glow/halo at edges (alpha < threshold connected to border).
 * Use eraseWhiteOutline: true to erode semi-transparent white pixels adjacent to transparent (removes white outline).
 * Use secondPass: true to remove thin strips left after first pass (better detouring).
 * Use whitenNearWhite: true to set almost-white pixels (e.g. gray-stained eye whites) to pure white (255,255,255).
 * Use fillSmallTransparentHoles: true to fill small transparent holes (e.g. eyes removed by rembg) with white.
 * Uses 8-neighbor connectivity so diagonal border pixels are also removed.
 */
const DEFAULT_BORDER_ALPHA_THRESHOLD = 120;
/** Min brightness for "near white" pixels to be whitened (only affects very light gray, e.g. eye whites). */
const WHITEN_MIN_BRIGHTNESS = 232;
/** Pixels within this distance from image edge can be treated as "white background". Interior white (eyes) is preserved. */
const BORDER_MARGIN_FOR_WHITE = 0.08; // 8% of min dimension
/** Max area (fraction of image) for a transparent region to be considered a "small hole" to fill with white. */
const FILL_HOLE_MAX_AREA_FRACTION = 0.025; // 2.5%

/** 8-neighbor offsets (4 cardinal + 4 diagonal) for fuller border connectivity. */
const NEIGHBOR_8 = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-1, -1], [-1, 1], [1, -1], [1, 1],
];

export async function removeBackground(
  imageBuffer: Buffer,
  options?: {
    aggressive?: boolean;
    eraseSemiTransparentBorder?: boolean;
    /** Alpha below this at border is removed (default 120). Use 150–180 for stronger halo removal on poses. */
    borderAlphaThreshold?: number;
    /** Erode semi-transparent white pixels next to transparent (removes white outline). */
    eraseWhiteOutline?: boolean;
    /** Second pass from transparent pixels to remove thin strips and leftover halo. */
    secondPass?: boolean;
    /** Set almost-white pixels (e.g. gray-stained eye whites) to pure white. Use for mascots. */
    whitenNearWhite?: boolean;
    /** Fill small transparent holes (e.g. eyes removed by rembg) with white. Use for mascots. */
    fillSmallTransparentHoles?: boolean;
    /** Preserve small colorful regions (e.g. confetti) that would otherwise be removed as background. Use for celebration animations. */
    preserveSmallColorfulRegions?: boolean;
  },
): Promise<Buffer> {
  const aggressive = options?.aggressive ?? false;
  const eraseSemiTransparentBorder = options?.eraseSemiTransparentBorder ?? false;
  const borderAlphaThreshold = options?.borderAlphaThreshold ?? DEFAULT_BORDER_ALPHA_THRESHOLD;
  const eraseWhiteOutline = options?.eraseWhiteOutline ?? false;
  const secondPass = options?.secondPass ?? false;
  const whitenNearWhite = options?.whitenNearWhite ?? false;
  const fillSmallTransparentHoles = options?.fillSmallTransparentHoles ?? false;
  const preserveSmallColorfulRegions = options?.preserveSmallColorfulRegions ?? false;
  try {
    let processed = sharp(imageBuffer).ensureAlpha();
    processed = processed.unflatten();

    const { data, info } = await processed
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = new Uint8ClampedArray(data);
    const width = info.width;
    const height = info.height;
    const channels = info.channels;

    const lightThreshold = 230;
    const sampleSize = Math.min(15, Math.floor(width / 8), Math.floor(height / 8));
    const cornerR: number[] = [];
    const cornerG: number[] = [];
    const cornerB: number[] = [];

    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const corners = [
          (y * width + x) * channels,
          (y * width + (width - 1 - x)) * channels,
          ((height - 1 - y) * width + x) * channels,
          ((height - 1 - y) * width + (width - 1 - x)) * channels,
        ];
        corners.forEach((idx) => {
          cornerR.push(pixels[idx]);
          cornerG.push(pixels[idx + 1]);
          cornerB.push(pixels[idx + 2]);
        });
      }
    }

    const avgR = cornerR.reduce((a, b) => a + b, 0) / cornerR.length;
    const avgG = cornerG.reduce((a, b) => a + b, 0) / cornerG.length;
    const avgB = cornerB.reduce((a, b) => a + b, 0) / cornerB.length;
    const avgBrightness = (avgR + avgG + avgB) / 3;
    const isLightBg = avgBrightness > 200;
    const isGrayBg = aggressive && avgBrightness >= 80 && avgBrightness <= 240;
    const isDarkBg = aggressive && avgBrightness < 80;
    const colorTolerance = aggressive ? 45 : 28;
    const darkTolerance = 40;
    const borderMargin = Math.max(12, Math.min(width, height) * BORDER_MARGIN_FOR_WHITE);

    const isNearBorder = (x: number, y: number): boolean =>
      x < borderMargin || x >= width - borderMargin || y < borderMargin || y >= height - borderMargin;

    const isBackgroundLike = (r: number, g: number, b: number, alpha?: number, x?: number, y?: number): boolean => {
      if (alpha !== undefined && alpha < 30) return true;
      if (eraseSemiTransparentBorder && alpha !== undefined && alpha < borderAlphaThreshold) return true;
      const brightness = (r + g + b) / 3;
      // Only treat near-white as background when pixel is near image border (preserve interior white: eyes, teeth).
      const allowWhiteAsBg = x !== undefined && y !== undefined ? isNearBorder(x, y) : true;
      if (allowWhiteAsBg && isLightBg && r >= 248 && g >= 248 && b >= 248) return true;
      if (allowWhiteAsBg && isLightBg && r > lightThreshold && g > lightThreshold && b > lightThreshold) return true;
      if (allowWhiteAsBg && isLightBg && Math.abs(brightness - avgBrightness) < colorTolerance) return true;
      if (isGrayBg && Math.abs(r - avgR) < colorTolerance && Math.abs(g - avgG) < colorTolerance && Math.abs(b - avgB) < colorTolerance) return true;
      if (isGrayBg && brightness >= 70 && brightness <= 230 && Math.abs(r - avgR) + Math.abs(g - avgG) + Math.abs(b - avgB) < 80) return true;
      if (isDarkBg && Math.abs(r - avgR) < darkTolerance && Math.abs(g - avgG) < darkTolerance && Math.abs(b - avgB) < darkTolerance) return true;
      return false;
    };

    const getIdx = (x: number, y: number) => (y * width + x) * channels;
    const visited = new Uint8Array(width * height);
    const toRemove = new Uint8Array(width * height);
    const stack: [number, number][] = [];

    for (let x = 0; x < width; x++) {
      stack.push([x, 0]);
      stack.push([x, height - 1]);
    }
    for (let y = 1; y < height - 1; y++) {
      stack.push([0, y]);
      stack.push([width - 1, y]);
    }

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const i = y * width + x;
      if (visited[i]) continue;
      visited[i] = 1;
      const idx = getIdx(x, y);
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = channels >= 4 ? pixels[idx + 3] : 255;
      if (!isBackgroundLike(r, g, b, a, x, y)) continue;
      toRemove[i] = 1;
      for (const [dx, dy] of NEIGHBOR_8) {
        stack.push([x + dx, y + dy]);
      }
    }

    // Optional: unmark small connected components that are colorful (confetti) so they are not removed
    if (preserveSmallColorfulRegions) {
      const maxConfettiPixels = Math.min(1200, Math.floor((width * height) * 0.002));
      const minSaturation = 35; // max(r,g,b)-min(r,g,b) to consider "colorful"
      const visitedCc = new Uint8Array(width * height);
      const component: number[] = [];
      const stackCc: [number, number][] = [];
      for (let sy = 0; sy < height; sy++) {
        for (let sx = 0; sx < width; sx++) {
          const si = sy * width + sx;
          if (!toRemove[si] || visitedCc[si]) continue;
          component.length = 0;
          stackCc.length = 0;
          stackCc.push([sx, sy]);
          let sumSat = 0;
          let count = 0;
          while (stackCc.length > 0) {
            const [x, y] = stackCc.pop()!;
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            const i = y * width + x;
            if (!toRemove[i] || visitedCc[i]) continue;
            visitedCc[i] = 1;
            component.push(i);
            const idx = getIdx(x, y);
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const sat = Math.max(r, g, b) - Math.min(r, g, b);
            sumSat += sat;
            count++;
            for (const [dx, dy] of NEIGHBOR_8) {
              stackCc.push([x + dx, y + dy]);
            }
          }
          if (count > 0 && count <= maxConfettiPixels && sumSat / count >= minSaturation) {
            for (const i of component) toRemove[i] = 0;
          }
        }
      }
    }

    for (let i = 0; i < pixels.length; i += channels) {
      const pixelIndex = i / channels;
      if (toRemove[pixelIndex]) {
        pixels[i + 3] = 0;
      }
    }

    // Second pass: from pixels adjacent to now-transparent, remove any remaining background-like (thin strips, leftover halo)
    if (secondPass) {
      const toRemove2 = new Uint8Array(width * height);
      const visited2 = new Uint8Array(width * height);
      const stack2: [number, number][] = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * channels;
          if (pixels[i + 3] >= 10) continue;
          for (const [dx, dy] of NEIGHBOR_8) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            stack2.push([nx, ny]);
          }
        }
      }
      while (stack2.length > 0) {
        const [x, y] = stack2.pop()!;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        const i = y * width + x;
        if (visited2[i]) continue;
        visited2[i] = 1;
        const idx = getIdx(x, y);
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const a = channels >= 4 ? pixels[idx + 3] : 255;
        if (a < 10) continue;
        if (!isBackgroundLike(r, g, b, a, x, y)) continue;
        toRemove2[i] = 1;
        for (const [dx, dy] of NEIGHBOR_8) {
          stack2.push([x + dx, y + dy]);
        }
      }
      for (let i = 0; i < pixels.length; i += channels) {
        if (toRemove2[i / channels]) pixels[i + 3] = 0;
      }
    }

    // Optional: erode only clear halo (very transparent + very white) next to transparent, to avoid cropping fur/hair.
    if (eraseWhiteOutline) {
      const getBrightness = (i: number) =>
        i >= 0 && i < pixels.length ? (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3 : 0;
      const toErode = new Uint8Array(width * height);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * channels;
          const a = pixels[i + 3];
          if (a >= 80) continue; // keep semi-transparent fur/hair (alpha 80+)
          if (a < 10) continue; // already transparent
          const brightness = getBrightness(i);
          if (brightness < 248) continue; // only very white halo
          let hasTransparentNeighbor = false;
          for (const [dx, dy] of NEIGHBOR_8) {
            const na = pixels[getIdx(x + dx, y + dy) + 3];
            if (na < 10) {
              hasTransparentNeighbor = true;
              break;
            }
          }
          if (hasTransparentNeighbor) toErode[y * width + x] = 1;
        }
      }
      for (let i = 0; i < pixels.length; i += channels) {
        if (toErode[i / channels]) pixels[i + 3] = 0;
      }
    }

    // Optional: fill small transparent holes (e.g. eyes removed by Replicate rembg) with white
    if (fillSmallTransparentHoles) {
      const transparentThreshold = 15;
      const totalPixels = width * height;
      const maxHoleArea = Math.floor(totalPixels * FILL_HOLE_MAX_AREA_FRACTION);
      const visitedHoles = new Uint8Array(width * height);
      for (let sy = 0; sy < height; sy++) {
        for (let sx = 0; sx < width; sx++) {
          const si = sy * width + sx;
          if (visitedHoles[si]) continue;
          const a = pixels[(sy * width + sx) * channels + 3];
          if (a >= transparentThreshold) continue;
          const stack: [number, number][] = [[sx, sy]];
          const component: number[] = [];
          let touchesBorder = false;
          visitedHoles[si] = 1;
          while (stack.length > 0) {
            const [x, y] = stack.pop()!;
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            const i = y * width + x;
            component.push(i);
            if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) touchesBorder = true;
            for (const [dx, dy] of NEIGHBOR_8) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
              const ni = ny * width + nx;
              if (visitedHoles[ni]) continue;
              const na = pixels[ni * channels + 3];
              if (na >= transparentThreshold) continue;
              visitedHoles[ni] = 1;
              stack.push([nx, ny]);
            }
          }
          if (!touchesBorder && component.length > 0 && component.length <= maxHoleArea) {
            for (const i of component) {
              const idx = i * channels;
              pixels[idx] = 255;
              pixels[idx + 1] = 255;
              pixels[idx + 2] = 255;
              pixels[idx + 3] = 255;
            }
          }
        }
      }
    }

    // Optional: whiten near-white pixels (fix gray stains in eyes, teeth, etc. from generation/rembg)
    if (whitenNearWhite) {
      for (let i = 0; i < pixels.length; i += channels) {
        const a = pixels[i + 3];
        if (a < 180) continue; // only opaque/semi-opaque
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const brightness = (r + g + b) / 3;
        if (brightness < WHITEN_MIN_BRIGHTNESS) continue; // only almost-white
        if (r >= 255 && g >= 255 && b >= 255) continue; // already pure white
        // Slight gray in a light area: set to pure white
        pixels[i] = 255;
        pixels[i + 1] = 255;
        pixels[i + 2] = 255;
      }
    }

    return await sharp(Buffer.from(pixels), {
      raw: { width, height, channels: 4 },
    })
      .png({ compressionLevel: 9, quality: 100, force: true })
      .toBuffer();
  } catch (error) {
    return sharp(imageBuffer)
      .ensureAlpha()
      .png({ force: true })
      .toBuffer();
  }
}
