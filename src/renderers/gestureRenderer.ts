import type { Rect, HandKeypoint } from '../gestures/types';

const INDICATOR_COLOR = 'rgba(255, 133, 193, ';

export function renderFingertipIndicator(
  ctx: CanvasRenderingContext2D,
  leftHand: HandKeypoint[] | null,
  rightHand: HandKeypoint[] | null,
  canvasWidth: number,
  canvasHeight: number
) {
  const tips: { x: number; y: number }[] = [];
  if (leftHand) {
    tips.push({ x: leftHand[8].x * canvasWidth, y: leftHand[8].y * canvasHeight });
  }
  if (rightHand) {
    tips.push({ x: rightHand[8].x * canvasWidth, y: rightHand[8].y * canvasHeight });
  }

  for (const tip of tips) {
    // Outer halo ring
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 20, 0, Math.PI * 2);
    ctx.strokeStyle = INDICATOR_COLOR + '0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner glow dot
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = INDICATOR_COLOR + '0.9)';
    ctx.fill();
  }
}

export function renderColorRegion(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  rect: Rect,
  canvasWidth: number,
  canvasHeight: number
) {
  const { x: nx, y: ny, width: nw, height: nh } = rect;

  // Convert normalized (0-1) to pixel coords
  const x = nx * canvasWidth;
  const y = ny * canvasHeight;
  const w = nw * canvasWidth;
  const h = nh * canvasHeight;

  ctx.save();

  // Rounded rect clip path
  const r = 12;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.clip();

  // Mirror flip for color video region
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-canvasWidth, 0);
  ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);
  ctx.restore();

  // Subtle border — original colors shine through
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}
