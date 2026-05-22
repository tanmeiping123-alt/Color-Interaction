import { useCallback, useRef, useEffect } from 'react';
import { CameraProvider, useCameraState } from './context/CameraContext';
import { useCamera } from './hooks/useCamera';
import { useHandGesture } from './hooks/useHandGesture';
import { useDrawingStore } from './hooks/useDrawingStore';
import CanvasStack from './components/CanvasStack';
import PromptOverlay from './components/PromptOverlay';
import Toolbar from './components/Toolbar';
import { exportMergedCanvas } from './utils/export';
import type { HandKeypoints } from './gestures/types';
import './App.css';

function AppInner() {
  const { state, dispatch } = useCameraState();
  const { videoRef, ready, error, startCamera } = useCamera();
  const { isLoaded, loadProgress, gesture, leftDrawReady, rightDrawReady, left: leftHand, right: rightHand, photoRect } =
    useHandGesture(videoRef, ready);
  const drawingStore = useDrawingStore();
  const lastPointL = useRef<{ x: number; y: number; timestamp: number } | null>(null);
  const lastPointR = useRef<{ x: number; y: number; timestamp: number } | null>(null);

  // Auto-hide prompts after 8 seconds
  useEffect(() => {
    if (!state.promptVisible) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'TOGGLE_PROMPT' });
    }, 8000);
    return () => clearTimeout(timer);
  }, [state.promptVisible, dispatch]);

  // Sync gesture/hand data to context
  const prevGestureRef = useRef(gesture);
  if (prevGestureRef.current !== gesture) {
    prevGestureRef.current = gesture;
    dispatch({ type: 'SET_GESTURE', payload: gesture });
  }

  const prevPhotoRectRef = useRef(photoRect);
  if (prevPhotoRectRef.current !== photoRect) {
    prevPhotoRectRef.current = photoRect;
    dispatch({ type: 'SET_PHOTO_RECT', payload: photoRect });
  }

  // Handle drawing
  const prevLeftRef = useRef<HandKeypoints | null>(leftHand);
  const prevRightRef = useRef<HandKeypoints | null>(rightHand);
  if (
    leftHand !== prevLeftRef.current ||
    rightHand !== prevRightRef.current
  ) {
    prevLeftRef.current = leftHand;
    prevRightRef.current = rightHand;

    dispatch({
      type: 'SET_HANDS',
      payload: { left: leftHand, right: rightHand },
    });

    const emitPoint = (
      hand: HandKeypoints,
      lastRef: React.MutableRefObject<{ x: number; y: number; timestamp: number } | null>,
      handLabel: 'Left' | 'Right'
    ) => {
      const tip = hand.landmarks[8];
      const now = Date.now();
      const last = lastRef.current;
      const speed = last
        ? Math.sqrt((tip.x - last.x) ** 2 + (tip.y - last.y) ** 2) /
          Math.max(1, now - last.timestamp)
        : 0;
      const size = Math.max(2, Math.min(12, 8 - speed * 10));
      dispatch({
        type: 'ADD_TRAIL_POINT',
        payload: { x: tip.x, y: tip.y, size, timestamp: now, hand: handLabel },
      });
      lastRef.current = { x: tip.x, y: tip.y, timestamp: now };
    };

    if (leftDrawReady && leftHand) {
      emitPoint(leftHand, lastPointL, 'Left');
    } else {
      lastPointL.current = null;
    }

    if (rightDrawReady && rightHand) {
      emitPoint(rightHand, lastPointR, 'Right');
    } else {
      lastPointR.current = null;
    }
  }

  const handleSave = useCallback(() => {
    const videoCanvas = document.querySelector(
      '.canvas-stack canvas:nth-child(1)'
    ) as HTMLCanvasElement;
    const drawingCanvas = document.querySelector(
      '.canvas-stack canvas:nth-child(3)'
    ) as HTMLCanvasElement;
    if (videoCanvas && drawingCanvas) {
      exportMergedCanvas(videoCanvas, drawingCanvas);
    }
  }, []);

  if (error) {
    return (
      <div className="error-screen">
        <p>{error}</p>
        <button onClick={startCamera}>重新尝试</button>
      </div>
    );
  }

  const isModelLoading = !isLoaded && ready;

  return (
    <div className="app">
      {isModelLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>{loadProgress || '加载手势模型...'}</p>
        </div>
      )}

      <CanvasStack
        videoRef={videoRef}
        photoRect={state.photoRect}
        trails={state.trails}
        leftHand={leftHand?.landmarks ?? null}
        rightHand={rightHand?.landmarks ?? null}
      />

      <PromptOverlay visible={state.promptVisible} />

      <Toolbar
        onSave={handleSave}
        onUndo={drawingStore.undo}
        onClear={drawingStore.clear}
        canUndo={state.trails.length > 0}
        hasTrails={state.trails.length > 0}
      />
    </div>
  );
}

export default function App() {
  return (
    <CameraProvider>
      <AppInner />
    </CameraProvider>
  );
}
