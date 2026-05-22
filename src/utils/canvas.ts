export function resizeCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) {
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

export function getOptimalSize(
  containerWidth: number,
  containerHeight: number,
  mobile = false
): { width: number; height: number } {
  const maxW = mobile ? 640 : 1280;
  const maxH = mobile ? 480 : 720;

  let w = containerWidth;
  let h = containerHeight;

  if (w > maxW) {
    h = h * (maxW / w);
    w = maxW;
  }
  if (h > maxH) {
    w = w * (maxH / h);
    h = maxH;
  }

  return { width: Math.floor(w), height: Math.floor(h) };
}
