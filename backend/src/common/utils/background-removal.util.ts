import * as sharp from 'sharp';

/**
 * Background removal for mascot/create and poses.
 * Only removes pixels that are CONNECTED TO THE BORDER (flood fill from edges).
 * Interior light areas (eyes, white inside character) are NOT touched.
 * Use aggressive: true for pose images (gray bg, larger edge tolerance).
 */
export async function removeBackground(
  imageBuffer: Buffer,
  options?: { aggressive?: boolean },
): Promise<Buffer> {
  const aggressive = options?.aggressive ?? false;
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
    const colorTolerance = aggressive ? 45 : 28;

    const isBackgroundLike = (r: number, g: number, b: number): boolean => {
      const brightness = (r + g + b) / 3;
      if (isLightBg && r > lightThreshold && g > lightThreshold && b > lightThreshold) return true;
      if (isLightBg && Math.abs(brightness - avgBrightness) < colorTolerance) return true;
      if (isGrayBg && Math.abs(r - avgR) < colorTolerance && Math.abs(g - avgG) < colorTolerance && Math.abs(b - avgB) < colorTolerance) return true;
      if (isGrayBg && brightness >= 70 && brightness <= 230 && Math.abs(r - avgR) + Math.abs(g - avgG) + Math.abs(b - avgB) < 80) return true;
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
      if (!isBackgroundLike(r, g, b)) continue;
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
