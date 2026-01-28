import * as sharp from 'sharp';

/**
 * Same background removal as Create (mascot generation).
 * Makes white/light pixels transparent (corners + full-image for light background).
 */
export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
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
    const edgeSize = 20;
    const cornerSamples: number[] = [];
    const sampleSize = Math.min(15, Math.floor(width / 8), Math.floor(height / 8));

    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const corners = [
          (y * width + x) * channels,
          (y * width + (width - 1 - x)) * channels,
          ((height - 1 - y) * width + x) * channels,
          ((height - 1 - y) * width + (width - 1 - x)) * channels,
        ];
        corners.forEach((idx) => {
          const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
          cornerSamples.push(brightness);
        });
      }
    }

    const avgCornerBrightness = cornerSamples.reduce((a, b) => a + b, 0) / cornerSamples.length;
    const isLikelyLightBackground = avgCornerBrightness > 200;

    for (let i = 0; i < pixels.length; i += channels) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const alphaIdx = i + 3;
      const pixelIndex = i / channels;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      const isOnEdge = x < edgeSize || x > width - edgeSize || y < edgeSize || y > height - edgeSize;
      const brightness = (r + g + b) / 3;
      const isVeryLight = r > lightThreshold && g > lightThreshold && b > lightThreshold;
      const isSimilarToBackground = isLikelyLightBackground && Math.abs(brightness - avgCornerBrightness) < 30;

      if (
        (isVeryLight && isOnEdge) ||
        (isSimilarToBackground && isOnEdge) ||
        (isVeryLight && isLikelyLightBackground)
      ) {
        pixels[alphaIdx] = 0;
      } else if (isVeryLight && !isOnEdge) {
        pixels[alphaIdx] = Math.min(pixels[alphaIdx] || 255, 150);
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
