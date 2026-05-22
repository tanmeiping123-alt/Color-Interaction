import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { GestureType, HandKeypoints, Rect, TrailPoint } from '../gestures/types';

const MAX_TRAILS = 5000;

export interface CameraState {
  cameraReady: boolean;
  gesture: GestureType | null;
  leftHand: HandKeypoints | null;
  rightHand: HandKeypoints | null;
  photoRect: Rect | null;
  trails: TrailPoint[];
  promptVisible: boolean;
}

const initialState: CameraState = {
  cameraReady: false,
  gesture: null,
  leftHand: null,
  rightHand: null,
  photoRect: null,
  trails: [],
  promptVisible: true,
};

export type CameraAction =
  | { type: 'SET_CAMERA_READY'; payload: boolean }
  | { type: 'SET_GESTURE'; payload: GestureType | null }
  | { type: 'SET_HANDS'; payload: { left: HandKeypoints | null; right: HandKeypoints | null } }
  | { type: 'SET_PHOTO_RECT'; payload: Rect | null }
  | { type: 'ADD_TRAIL_POINT'; payload: TrailPoint }
  | { type: 'UNDO_TRAIL' }
  | { type: 'CLEAR_TRAILS' }
  | { type: 'TOGGLE_PROMPT' };

function cameraReducer(state: CameraState, action: CameraAction): CameraState {
  switch (action.type) {
    case 'SET_CAMERA_READY':
      return { ...state, cameraReady: action.payload };
    case 'SET_GESTURE':
      return { ...state, gesture: action.payload };
    case 'SET_HANDS':
      return { ...state, leftHand: action.payload.left, rightHand: action.payload.right };
    case 'SET_PHOTO_RECT':
      return { ...state, photoRect: action.payload };
    case 'ADD_TRAIL_POINT': {
      const trails = [...state.trails, action.payload];
      if (trails.length > MAX_TRAILS) {
        return { ...state, trails: trails.slice(-MAX_TRAILS) };
      }
      return { ...state, trails };
    }
    case 'UNDO_TRAIL':
      return { ...state, trails: state.trails.slice(0, -1) };
    case 'CLEAR_TRAILS':
      return { ...state, trails: [] };
    case 'TOGGLE_PROMPT':
      return { ...state, promptVisible: !state.promptVisible };
    default:
      return state;
  }
}

const CameraCtx = createContext<{
  state: CameraState;
  dispatch: Dispatch<CameraAction>;
} | null>(null);

export function CameraProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cameraReducer, initialState);
  return <CameraCtx.Provider value={{ state, dispatch }}>{children}</CameraCtx.Provider>;
}

export function useCameraState() {
  const ctx = useContext(CameraCtx);
  if (!ctx) throw new Error('useCameraState must be used within CameraProvider');
  return ctx;
}
