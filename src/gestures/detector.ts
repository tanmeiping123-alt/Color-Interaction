import type { HandKeypoint, HandKeypoints, Rect, Point } from './types';

// Index(8) + middle(12) tips together for draw gesture
const DRAW_ENTER = 0.20;
const DRAW_EXIT = 0.30;
const DRAW_Z_MAX = 0.12;
const DRAW_EXTEND_MIN = 0.25;

// Photo: open hand
const OPEN_ENTER = 0.72;
const OPEN_EXIT = 0.58;

const CONFIRM_FRAMES = 3;
const LOST_FRAMES = 10;
const DRAW_ARM_FRAMES = 4;
const COOLDOWN_FRAMES = 10;

const PHOTO_MAX_DRIFT = 0.06;
const MIN_RECT_NORM = 0.04;
const MAX_RECT_NORM = 0.85;

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function handScale(landmarks: HandKeypoint[]): number {
  return Math.max(0.01, distance(landmarks[0], landmarks[12]));
}

function isOpen(landmarks: HandKeypoint[], enter: boolean): boolean {
  const wrist = landmarks[0];
  const tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
  const scale = handScale(landmarks);
  const th = enter ? OPEN_ENTER : OPEN_EXIT;
  return tips.every((tip) => distance(tip, wrist) / scale > th);
}

// Index(8) and middle(12) tips close together → draw gesture
function isIndexMiddleTogether(landmarks: HandKeypoint[], enter: boolean): boolean {
  const scale = handScale(landmarks);

  const dist = distance(landmarks[8], landmarks[12]) / scale;
  const th = enter ? DRAW_ENTER : DRAW_EXIT;
  if (dist >= th) return false;

  const zDiff = Math.abs(landmarks[8].z - landmarks[12].z);
  if (zDiff > DRAW_Z_MAX) return false;

  const wrist = landmarks[0];
  if (distance(landmarks[8], wrist) / scale < DRAW_EXTEND_MIN) return false;
  if (distance(landmarks[12], wrist) / scale < DRAW_EXTEND_MIN) return false;

  return true;
}

// Debug: log raw detection values every 60 detection frames
let _dbgCounter = 0;

// ---- per-hand draw state machine ----

interface DrawHandState {
  active: boolean;
  candidate: boolean;
  confirmCount: number;
  lostCount: number;
  frameCount: number;
  cooldown: number;
}

function createDrawState(): DrawHandState {
  return { active: false, candidate: false, confirmCount: 0, lostCount: 0, frameCount: 0, cooldown: 0 };
}

const drawLeft = createDrawState();
const drawRight = createDrawState();

function updateDrawHand(st: DrawHandState, raw: boolean): boolean {
  if (st.cooldown > 0) st.cooldown--;
  if (st.cooldown > 0) raw = false;

  if (raw === st.candidate) {
    st.confirmCount++;
  } else {
    st.candidate = raw;
    st.confirmCount = 1;
  }

  if (st.confirmCount >= CONFIRM_FRAMES && st.active !== st.candidate) {
    st.active = st.candidate;
    st.lostCount = 0;
    st.frameCount = 0;
  }

  if (!raw && st.active) {
    st.lostCount++;
    if (st.lostCount >= LOST_FRAMES) {
      st.cooldown = COOLDOWN_FRAMES;
      st.active = false;
      st.lostCount = 0;
      st.frameCount = 0;
    }
  } else if (raw && st.active) {
    st.lostCount = 0;
    st.frameCount++;
  }

  return st.active && st.frameCount >= DRAW_ARM_FRAMES;
}

// ---- photo state ----

interface PhotoState {
  current: boolean;
  candidate: boolean;
  confirmCount: number;
  lostCount: number;
}

const photoSt: PhotoState = { current: false, candidate: false, confirmCount: 0, lostCount: 0 };
let lastPhotoCenter: Point | null = null;

function photoCenter(left: HandKeypoint[], right: HandKeypoint[]): Point {
  const lt = left[4]; const li = left[8];
  const rt = right[4]; const ri = right[8];
  return {
    x: (lt.x + li.x + rt.x + ri.x) / 4,
    y: (lt.y + li.y + rt.y + ri.y) / 4,
  };
}

function updatePhoto(raw: boolean): boolean {
  if (raw === photoSt.candidate) {
    photoSt.confirmCount++;
  } else {
    photoSt.candidate = raw;
    photoSt.confirmCount = 1;
  }

  if (photoSt.confirmCount >= CONFIRM_FRAMES && photoSt.current !== photoSt.candidate) {
    photoSt.current = photoSt.candidate;
    photoSt.lostCount = 0;
  }

  if (!raw && photoSt.current) {
    photoSt.lostCount++;
    if (photoSt.lostCount >= LOST_FRAMES) {
      photoSt.current = false;
      photoSt.lostCount = 0;
    }
  } else if (raw && photoSt.current) {
    photoSt.lostCount = 0;
  }

  return photoSt.current;
}

type GestureKind = 'photo' | 'pinch';

export function detectGesture(
  leftHand: HandKeypoints | null,
  rightHand: HandKeypoints | null,
  _canvasWidth?: number,
  _canvasHeight?: number
): {
  gesture: GestureKind | null;
  photoRect: Rect | null;
  drawReady: boolean;
  leftDrawReady: boolean;
  rightDrawReady: boolean;
} {
  // --- per-hand draw detection ---
  const leftRaw = leftHand ? isIndexMiddleTogether(leftHand.landmarks, !drawLeft.active) : false;
  const rightRaw = rightHand ? isIndexMiddleTogether(rightHand.landmarks, !drawRight.active) : false;
  const leftReady = updateDrawHand(drawLeft, leftRaw);
  const rightReady = updateDrawHand(drawRight, rightRaw);

  // Debug: log raw detection values every 60 frames
  _dbgCounter++;
  if (_dbgCounter % 60 === 0 && (leftHand || rightHand)) {
    const h = leftHand || rightHand;
    const s = handScale(h!.landmarks);
    const d = distance(h!.landmarks[8], h!.landmarks[12]) / s;
    console.log('[detector] scale:', s.toFixed(4),
      'idx-mid dist/scale:', d.toFixed(4),
      'ENTER th:', DRAW_ENTER,
      'zDiff:', Math.abs(h!.landmarks[8].z - h!.landmarks[12].z).toFixed(4),
      'leftRaw:', leftRaw, 'rightRaw:', rightRaw,
      'leftActive:', drawLeft.active, 'rightActive:', drawRight.active,
      'leftReady:', leftReady, 'rightReady:', rightReady);
  }

  // --- photo: both hands open ---
  let photoRaw = false;
  if (leftHand && rightHand) {
    const lo = isOpen(leftHand.landmarks, !photoSt.current);
    const ro = isOpen(rightHand.landmarks, !photoSt.current);

    if (lo && ro) {
      const center = photoCenter(leftHand.landmarks, rightHand.landmarks);
      const stable = lastPhotoCenter
        ? distance(center, lastPhotoCenter) < PHOTO_MAX_DRIFT
        : false;
      lastPhotoCenter = center;

      if (photoSt.current || stable) {
        photoRaw = true;
      }
    } else {
      lastPhotoCenter = null;
    }
  } else {
    lastPhotoCenter = null;
  }

  const photoActive = updatePhoto(photoRaw);

  // --- overall gesture ---
  const gesture: GestureKind | null = photoActive ? 'photo'
    : (leftReady || rightReady) ? 'pinch'
    : null;

  const photoRect =
    photoActive && leftHand && rightHand
      ? calcPhotoRect(leftHand.landmarks, rightHand.landmarks)
      : null;

  return {
    gesture,
    photoRect,
    drawReady: leftReady || rightReady,
    leftDrawReady: leftReady,
    rightDrawReady: rightReady,
  };
}

function calcPhotoRect(left: HandKeypoint[], right: HandKeypoint[]): Rect | null {
  const lt = left[4];
  const li = left[8];
  const rt = right[4];
  const ri = right[8];

  const minX = Math.min(lt.x, li.x, rt.x, ri.x);
  const minY = Math.min(lt.y, li.y, rt.y, ri.y);
  const maxX = Math.max(lt.x, li.x, rt.x, ri.x);
  const maxY = Math.max(lt.y, li.y, rt.y, ri.y);

  const w = maxX - minX;
  const h = maxY - minY;

  if (w < MIN_RECT_NORM || h < MIN_RECT_NORM) return null;
  if (w > MAX_RECT_NORM || h > MAX_RECT_NORM) return null;

  return { x: minX, y: minY, width: w, height: h };
}

export function resetDetector() {
  Object.assign(drawLeft, createDrawState());
  Object.assign(drawRight, createDrawState());
  photoSt.current = false;
  photoSt.candidate = false;
  photoSt.confirmCount = 0;
  photoSt.lostCount = 0;
  lastPhotoCenter = null;
}
