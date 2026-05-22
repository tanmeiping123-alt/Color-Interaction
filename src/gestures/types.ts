export type GestureType = 'photo' | 'pinch';

export interface Point {
  x: number;
  y: number;
}

export interface HandKeypoint {
  x: number;
  y: number;
  z: number;
}

export interface HandKeypoints {
  landmarks: HandKeypoint[]; // 21 landmarks per hand
  handedness: 'Left' | 'Right';
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TrailPoint extends Point {
  size: number;
  timestamp: number;
  hand: 'Left' | 'Right';
}
