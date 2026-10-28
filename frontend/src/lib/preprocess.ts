/**
 * Shared Preprocessing Pipeline for Browser / TF.js Inference.
 * Matches ml/data/preprocess.py in Python exactly:
 * 1. Polarity check (dark background, white ink)
 * 2. Tight crop to stroke bounding box (> 30)
 * 3. Aspect-ratio preserving padding to square with 15% margin
 * 4. Resizing to 64x64
 * 5. Normalization in [0.0, 1.0]
 */

export function preprocessCanvasToFloat32Array(
  canvas: HTMLCanvasElement,
  targetSize = 64,
  marginRatio = 0.15
): Float32Array {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new Float32Array(targetSize * targetSize);
  }

  const { width, height } = canvas;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Convert to grayscale & check polarity
  let sumBrightness = 0;
  const totalPixels = width * height;
  const gray = new Uint8Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const val = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    gray[i] = val;
    sumBrightness += val;
  }

  const isLightBackground = sumBrightness / totalPixels > 127;
  if (isLightBackground) {
    for (let i = 0; i < totalPixels; i++) {
      gray[i] = 255 - gray[i];
    }
  }

  // 2. Find bounding box of ink pixels (> 30)
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (gray[y * width + x] > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return new Float32Array(targetSize * targetSize);
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const maxSide = Math.max(cropW, cropH);
  const pad = Math.max(2, Math.floor(maxSide * marginRatio));
  const squareSide = maxSide + pad * 2;

  // Offscreen canvas for aspect-ratio padding and high quality resize
  const offscreen = document.createElement('canvas');
  offscreen.width = squareSide;
  offscreen.height = squareSide;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) {
    return new Float32Array(targetSize * targetSize);
  }

  offCtx.fillStyle = '#000000';
  offCtx.fillRect(0, 0, squareSide, squareSide);

  // Copy cropped region centered
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  const cropCtx = cropCanvas.getContext('2d');
  if (cropCtx) {
    cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  }

  const offsetX = Math.floor((squareSide - cropW) / 2);
  const offsetY = Math.floor((squareSide - cropH) / 2);
  offCtx.drawImage(cropCanvas, offsetX, offsetY);

  // Resize to targetSize x targetSize
  const outCanvas = document.createElement('canvas');
  outCanvas.width = targetSize;
  outCanvas.height = targetSize;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) {
    return new Float32Array(targetSize * targetSize);
  }

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(offscreen, 0, 0, squareSide, squareSide, 0, 0, targetSize, targetSize);

  const finalData = outCtx.getImageData(0, 0, targetSize, targetSize).data;
  const out = new Float32Array(targetSize * targetSize);
  for (let i = 0; i < targetSize * targetSize; i++) {
    const val = finalData[i * 4]; // Grayscale from black/white canvas
    out[i] = val / 255.0;
  }

  return out;
}
