# 组件 & Hook API

## Context: CameraContext

```ts
interface CameraState {
  cameraReady: boolean;
  gesture: GestureType | null;       // 'photo' | 'pinch' | 'fist' | null
  leftHand: HandKeypoints | null;
  rightHand: HandKeypoints | null;
  photoRect: Rect | null;            // 拍照手势的彩色矩形区域
  isDrawing: boolean;                // 当前是否在绘制
  trails: TrailPoint[];              // 轨迹数据
  promptVisible: boolean;
}

type CameraAction =
  | { type: 'SET_CAMERA_READY'; payload: boolean }
  | { type: 'SET_GESTURE'; payload: GestureType | null }
  | { type: 'SET_HANDS'; payload: { left: HandKeypoints | null; right: HandKeypoints | null } }
  | { type: 'SET_PHOTO_RECT'; payload: Rect | null }
  | { type: 'ADD_TRAIL_POINT'; payload: TrailPoint }
  | { type: 'UNDO_TRAIL' }
  | { type: 'CLEAR_TRAILS' }
  | { type: 'TOGGLE_PROMPT' };
```

## useCamera

```ts
function useCamera(): {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  startCamera(): Promise<void>;
  stopCamera(): void;
  error: string | null;
}
```

## useHandGesture

```ts
function useHandGesture(videoRef: React.RefObject<HTMLVideoElement>): {
  isLoaded: boolean;
  gesture: GestureType | null;
  leftHand: HandKeypoints | null;
  rightHand: HandKeypoints | null;
  photoRect: Rect | null;
}
```

## useDrawingStore

```ts
function useDrawingStore(canvasRef: React.RefObject<HTMLCanvasElement>): {
  trails: TrailPoint[];
  isDrawing: boolean;
  addPoint(point: Omit<TrailPoint, 'timestamp'>): void;
  undo(): void;
  clear(): void;
  exportImage(): void;
}
```

## CanvasStack

```ts
interface CanvasStackProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}
```

## PromptOverlay

```ts
interface PromptOverlayProps {
  currentGesture: GestureType | null;
  visible: boolean;
}
```

## Toolbar

```ts
interface ToolbarProps {
  onSave: () => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo: boolean;
  hasTrails: boolean;
}
```
