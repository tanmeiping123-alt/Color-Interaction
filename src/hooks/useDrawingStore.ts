import { useCallback } from 'react';
import { useCameraState } from '../context/CameraContext';
import type { TrailPoint } from '../gestures/types';

export function useDrawingStore() {
  const { state, dispatch } = useCameraState();

  const addPoint = useCallback(
    (point: Omit<TrailPoint, 'timestamp'>) => {
      dispatch({
        type: 'ADD_TRAIL_POINT',
        payload: { ...point, timestamp: Date.now() },
      });
    },
    [dispatch]
  );

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO_TRAIL' });
  }, [dispatch]);

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR_TRAILS' });
  }, [dispatch]);

  const exportImage = useCallback(
    (videoCanvas: HTMLCanvasElement, drawingCanvas: HTMLCanvasElement) => {
      const merged = document.createElement('canvas');
      merged.width = videoCanvas.width;
      merged.height = videoCanvas.height;
      const mCtx = merged.getContext('2d')!;
      mCtx.drawImage(videoCanvas, 0, 0);
      mCtx.drawImage(drawingCanvas, 0, 0);

      const link = document.createElement('a');
      link.download = `color-interaction-${Date.now()}.png`;
      link.href = merged.toDataURL('image/png');
      link.click();
    },
    []
  );

  return {
    trails: state.trails,
    addPoint,
    undo,
    clear,
    exportImage,
  };
}
