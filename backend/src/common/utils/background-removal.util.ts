import * as sharp from 'sharp';

/**
 * Background removal for mascot/create and poses.
 * Only removes pixels that are CONNECTED TO THE BORDER (flood fill from edges).
 * Interior light areas (eyes, white inside character) are NOT touched.
 * Use aggressive: true for pose images (gray/dark bg, larger tolerance).
 * Use eraseSemiTransparentBorder: true to remove glow/halo at edges (alpha < threshold connected to border).
 * Use eraseWhiteOutline: true to erode semi-transparent white pixels adjacent to transparent (removes white outline).
 */
const DEFAULT_BORDER_ALPHA_THRESHOLD = 120;

export async function removeBackground(
  imageBuffer: Buffer,
  options?: {
    aggressive?: boolean;
    eraseSemiTransparentBorder?: boolean;
    /** Alpha below this at border is removed (default 120). Use 160–180 for stronger halo removal. */
    borderAlphaThreshold?: number;
    /** Erode semi-transparent white pixels next to transparent (removes white outline). */
    eraseWhiteOutline?: boolean;
  },
): Promise<Buffer> {
  const aggressive = options?.aggressive ?? false;
  const eraseSemiTransparentBorder = options?.eraseSemiTransparentBorder ?? false;
  const borderAlphaThreshold = options?.borderAlphaThreshold ?? DEFAULT_BORDER_ALPHA_THRESHOLD;
  const eraseWhiteOutline = options?.eraseWhiteOutline ?? false;
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
      // Always remove near-white at border (fixes white outline even when corners aren't white).
      if (r >= 248 && g >= 248 && b >= 248) return true;
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
      stack.push([x - 1, y]);
      stack.push([x + 1, y]);
      stack.push([x, y - 1]);
      stack.push([x, y + 1]);
    }

    for (let i = 0; i < pixels.length; i += channels) {
      const pixelIndex = i / channels;
      if (toRemove[pixelIndex]) {
        pixels[i + 3] = 0;
      }
    }

    // Optional: erode semi-transparent white pixels adjacent to transparent (removes white outline).
    if (eraseWhiteOutline) {
      const getA = (i: number) => (i >= 0 && i < pixels.length ? pixels[i + 3] : 255);
      const getBrightness = (i: number) =>
        i >= 0 && i < pixels.length ? (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3 : 0;
      for (let pass = 0; pass < 2; pass++) {
        const toErode = new Uint8Array(width * height);
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * channels;
            const a = pixels[i + 3];
            if (a < 10 || a > 215) continue;
            const brightness = getBrightness(i);
            if (brightness < 230) continue;
            const idx = y * width + x;
            const hasTransparentNeighbor =
              pixels[getIdx(x - 1, y) + 3] < 10 ||
              pixels[getIdx(x + 1, y) + 3] < 10 ||
              pixels[getIdx(x, y - 1) + 3] < 10 ||
              pixels[getIdx(x, y + 1) + 3] < 10;
            if (hasTransparentNeighbor) toErode[idx] = 1;
          }
        }
        for (let i = 0; i < pixels.length; i += channels) {
          if (toErode[i / channels]) pixels[i + 3] = 0;
        }
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
