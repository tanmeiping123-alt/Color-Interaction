const TRAIL_COLOR = '#FF85C1';
const STROKE_GAP_MS = 500;

interface TrailPoint {
  x: number;
  y: number;
  size: number;
  timestamp: number;
  hand: 'Left' | 'Right';
}

function drawHandTrails(
  ctx: CanvasRenderingContext2D,
  trails: TrailPoint[],
  canvasWidth: number,
  canvasHeight: number
) {
  if (trails.length < 2) return;

  let prev = trails[0];
  ctx.beginPath();
  ctx.moveTo(prev.x * canvasWidth, prev.y * canvasHeight);

  for (let i = 1; i < trails.length; i++) {
    const curr = trails[i];
    const cx = curr.x * canvasWidth;
    const cy = curr.y * canvasHeight;

    if (curr.timestamp - prev.timestamp > STROKE_GAP_MS) {
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
    } else {
      ctx.lineWidth = curr.size;
      ctx.lineTo(cx, cy);
    }
    prev = curr;
  }

  ctx.stroke();
}

export function renderTrails(
  ctx: CanvasRenderingContext2D,
  trails: TrailPoint[],
  canvasWidth: number,
  canvasHeight: number
) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (trails.length < 2) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = 6;
  ctx.shadowColor = TRAIL_COLOR;
  ctx.strokeStyle = TRAIL_COLOR;

  // Separate by hand to prevent cross-hand stroke connections
  const leftTrails: TrailPoint[] = [];
  const rightTrails: TrailPoint[] = [];
  for (const t of trails) {
    if (t.hand === 'Left') leftTrails.push(t);
    else rightTrails.push(t);
  }

  drawHandTrails(ctx, leftTrails, canvasWidth, canvasHeight);
  drawHandTrails(ctx, rightTrails, canvasWidth, canvasHeight);

  ctx.restore();
}
