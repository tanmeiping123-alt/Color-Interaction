import type { HandKeypoint } from './types';

const ALPHA = 0.4;

let prevKeypoints: Record<string, { x: number; y: number }[]> = {};

export function smoothKeypoints(
  handedness: string,
  landmarks: HandKeypoint[]
): HandKeypoint[] {
  const key = handedness;
  if (!prevKeypoints[key]) {
    prevKeypoints[key] = landmarks.map((kp) => ({ x: kp.x, y: kp.y }));
    return landmarks;
  }

  const prev = prevKeypoints[key];
  const smoothed = landmarks.map((kp, i) => ({
    x: prev[i].x + ALPHA * (kp.x - prev[i].x),
    y: prev[i].y + ALPHA * (kp.y - prev[i].y),
    z: kp.z,
  }));

  prevKeypoints[key] = smoothed.map((kp) => ({ x: kp.x, y: kp.y }));
  return smoothed;
}

export function resetSmoothing() {
  prevKeypoints = {};
}
