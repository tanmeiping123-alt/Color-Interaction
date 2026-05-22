export function exportMergedCanvas(
  videoCanvas: HTMLCanvasElement,
  drawingCanvas: HTMLCanvasElement
) {
  const merged = document.createElement('canvas');
  merged.width = videoCanvas.width;
  merged.height = videoCanvas.height;
  const ctx = merged.getContext('2d')!;
  ctx.drawImage(videoCanvas, 0, 0);
  ctx.drawImage(drawingCanvas, 0, 0);

  const link = document.createElement('a');
  link.download = `color-interaction-${Date.now()}.png`;
  link.href = merged.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
