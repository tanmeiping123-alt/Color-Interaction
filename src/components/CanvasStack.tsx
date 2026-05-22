import { useRef, useCallback, useEffect } from 'react';
import { renderVideo } from '../renderers/videoRenderer';
import { renderColorRegion, renderFingertipIndicator } from '../renderers/gestureRenderer';
import { renderTrails } from '../renderers/drawingRenderer';
import { resizeCanvas, getOptimalSize } from '../utils/canvas';
import type { HandKeypoint, TrailPoint } from '../gestures/types';

// Detect mobile for resolution scaling
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (window.matchMedia('(max-width: 768px)').matches);

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  photoRect: { x: number; y: number; width: number; height: number } | null;
  trails: TrailPoint[];
  leftHand: HandKeypoint[] | null;
  rightHand: HandKeypoint[] | null;
}

export default function CanvasStack({
  videoRef,
  photoRect,
  trails,
  leftHand,
  rightHand,
}: Props) {
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const gestureCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ width: 640, height: 480 });
  const leftHandRef = useRef(leftHand);
  const rightHandRef = useRef(rightHand);
  leftHandRef.current = leftHand;
  rightHandRef.current = rightHand;

  const updateSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const { width, height } = getOptimalSize(
      container.clientWidth,
      container.clientHeight,
      isMobile
    );
    sizeRef.current = { width, height };
    [videoCanvasRef, gestureCanvasRef, drawingCanvasRef].forEach((ref) => {
      if (ref.current) resizeCanvas(ref.current, width, height);
    });
  }, []);

  useEffect(() => {
    updateSize();
    const onResize = () => updateSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateSize]);

  useEffect(() => {
    let running = true;
    const videoCanvas = videoCanvasRef.current;
    const gestureCanvas = gestureCanvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (!videoCanvas || !gestureCanvas || !drawingCanvas) return;

    function render() {
      if (!running) return;

      const { width, height } = sizeRef.current;
      const video = videoRef.current;

      if (video && video.readyState >= 2) {
        // Layer 1: Mirrored video (grayscale via CSS filter)
        const vCtx = videoCanvas!.getContext('2d')!;
        renderVideo(vCtx, video, width, height);

        // Layer 2: Color region (photo gesture) + fingertip indicator
        const gCtx = gestureCanvas!.getContext('2d')!;
        gCtx.clearRect(0, 0, width, height);
        if (photoRect) {
          renderColorRegion(gCtx, video, photoRect, width, height);
        }
        renderFingertipIndicator(gCtx, leftHandRef.current, rightHandRef.current, width, height);

        // Layer 3: Drawing trails
        const dCtx = drawingCanvas!.getContext('2d')!;
        renderTrails(dCtx, trails, width, height);
      }

      requestAnimationFrame(render);
    }

    render();
    return () => { running = false; };
  }, [videoRef, photoRect, trails]);

  return (
    <div ref={containerRef} className="canvas-stack">
      <canvas ref={videoCanvasRef} className="canvas-layer" />
      <canvas ref={gestureCanvasRef} className="canvas-layer" />
      <canvas ref={drawingCanvasRef} className="canvas-layer" />
    </div>
  );
}
