/**
 * Draw the mirrored video frame. Grayscale is applied via CSS filter
 * on the canvas element — no per-pixel processing needed.
 */
export function renderVideo(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number
) {
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-width, 0);
  ctx.drawImage(video, 0, 0, width, height);
  ctx.restore();
}
