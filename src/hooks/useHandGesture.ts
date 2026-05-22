import { useRef, useState, useCallback, useEffect } from 'react';
import { HandLandmarker, FilesetResolver, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import { smoothKeypoints, resetSmoothing } from '../gestures/smoothing';
import { detectGesture, resetDetector } from '../gestures/detector';
import type { HandKeypoint, HandKeypoints, Rect } from '../gestures/types';

export function useHandGesture(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  ready: boolean
) {
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState('');
  const [gesture, setGesture] = useState<'photo' | 'pinch' | null>(null);
  const [drawReady, setDrawReady] = useState(false);
  const [leftDrawReady, setLeftDrawReady] = useState(false);
  const [rightDrawReady, setRightDrawReady] = useState(false);
  const [photoRect, setPhotoRect] = useState<Rect | null>(null);
  const [hands, setHands] = useState<{
    left: HandKeypoints | null;
    right: HandKeypoints | null;
  }>({ left: null, right: null });
  const animFrameRef = useRef<number>(0);
  const frameSkipRef = useRef(0);
  const gestureLogRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setLoadProgress('下载 WASM...');
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        if (cancelled) return;

        setLoadProgress('加载手部模型...');
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });
        if (cancelled) return;

        landmarkerRef.current = landmarker;
        setIsLoaded(true);
        setLoadProgress('');
      } catch (e) {
        if (!cancelled) {
          console.error('MediaPipe init failed:', e);
          setLoadProgress('模型加载失败，请刷新重试');
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      landmarkerRef.current?.close();
      resetSmoothing();
      resetDetector();
    };
  }, []);

  const detect = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || !ready || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }

    // Detection at ~30fps (every 2nd frame)
    frameSkipRef.current++;
    if (frameSkipRef.current % 2 === 0) {
      const results = landmarker.detectForVideo(video, performance.now());

      let left: HandKeypoints | null = null;
      let right: HandKeypoints | null = null;

      if (results.landmarks && results.landmarks.length > 0) {
        for (let i = 0; i < results.landmarks.length; i++) {
          // Mirror X coordinate: flip for natural selfie view
          const landmarks = results.landmarks[i].map(
            (lm: NormalizedLandmark): HandKeypoint => ({
              x: 1 - lm.x,
              y: lm.y,
              z: lm.z,
            })
          );
          const handedness = results.handedness[i][0].categoryName as 'Left' | 'Right';

          const smoothed = smoothKeypoints(handedness, landmarks);
          const kp: HandKeypoints = { landmarks: smoothed, handedness };

          if (handedness === 'Left') left = kp;
          else right = kp;
        }

        setHands({ left, right });

        const result = detectGesture(left, right);
        setGesture(result.gesture);
        setPhotoRect(result.photoRect);
        setDrawReady(result.drawReady);
        setLeftDrawReady(result.leftDrawReady);
        setRightDrawReady(result.rightDrawReady);

        // Debug: log detected gestures every 2s
        if (result.gesture) {
          gestureLogRef.current[result.gesture] =
            (gestureLogRef.current[result.gesture] || 0) + 1;
          const total = Object.values(gestureLogRef.current).reduce((a, b) => a + b, 0);
          if (total % 30 === 1) {
            console.log('Gestures:', gestureLogRef.current);
          }
        }
      } else {
        setHands({ left: null, right: null });
        setGesture(null);
        setPhotoRect(null);
        resetDetector();
      }
    }

    animFrameRef.current = requestAnimationFrame(detect);
  }, [videoRef, ready]);

  useEffect(() => {
    if (isLoaded && ready) {
      detect();
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isLoaded, ready, detect]);

  return { isLoaded, loadProgress, gesture, drawReady, leftDrawReady, rightDrawReady, left: hands.left, right: hands.right, photoRect };
}
