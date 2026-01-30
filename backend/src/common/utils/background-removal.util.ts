import * as sharp from 'sharp';

/**
 * Background removal for mascot/create and poses.
 * Only removes pixels that are CONNECTED TO THE BORDER (flood fill from edges).
 * Interior light areas (eyes, white inside character) are NOT touched.
 * Use aggressive: true for pose images (gray/dark bg, larger tolerance).
 * Use eraseSemiTransparentBorder: true to remove glow/halo at edges (alpha < threshold connected to border).
 * Use eraseWhiteOutline: true to erode semi-transparent white pixels adjacent to transparent (removes white outline).
 * Use secondPass: true to remove thin strips left after first pass (better detouring).
 * Uses 8-neighbor connectivity so diagonal border pixels are also removed.
 */
const DEFAULT_BORDER_ALPHA_THRESHOLD = 120;

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
  },
): Promise<Buffer> {
  const aggressive = options?.aggressive ?? false;
  const eraseSemiTransparentBorder = options?.eraseSemiTransparentBorder ?? false;
  const borderAlphaThreshold = options?.borderAlphaThreshold ?? DEFAULT_BORDER_ALPHA_THRESHOLD;
  const eraseWhiteOutline = options?.eraseWhiteOutline ?? false;
  const secondPass = options?.secondPass ?? false;
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

    const isBackgroundLike = (r: number, g: number, b: number, alpha?: number): boolean => {
      if (alpha !== undefined && alpha < 30) return true;
      if (eraseSemiTransparentBorder && alpha !== undefined && alpha < borderAlphaThreshold) return true;
      // Remove near-white at border only when background is actually light (avoids cropping white/cream fur).
      if (isLightBg && r >= 248 && g >= 248 && b >= 248) return true;
      const brightness = (r + g + b) / 3;
      if (isLightBg && r > lightThreshold && g > lightThreshold && b > lightThreshold) return true;
      if (isLightBg && Math.abs(brightness - avgBrightness) < colorTolerance) return true;
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
      if (!isBackgroundLike(r, g, b, a)) continue;
      toRemove[i] = 1;
      for (const [dx, dy] of NEIGHBOR_8) {
        stack.push([x + dx, y + dy]);
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
        if (!isBackgroundLike(r, g, b, a)) continue;
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
