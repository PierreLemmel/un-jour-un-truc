import { FaceLandmarker, FilesetResolver, type Matrix, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import { clamp, clamp01, createKalmanFilter, distance, inverseLerp, midPoint, remap, smoothDamp, type KalmanFilterParams } from './utils';

export interface TrackingResult {
    eyePosition: {
        x: number;
        y: number;
    };
}

export interface EyeData {
    eyeX: number;
    eyeY: number;
}

export const CalibrationPoints = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'] as const;
export type CalibrationPoint = (typeof CalibrationPoints)[number];

export const FaceAngles = ['panToLeft', 'panToRight', 'tiltToUp', 'tiltToDown'] as const;
export type FaceAngle = (typeof FaceAngles)[number];

type CalibrationData = {
    [key in CalibrationPoint]: EyeData;
} & {
    [key in FaceAngle]: number;
} & {
    eyesHeight: number;
};

const CALIBRATION_STORAGE_KEY = 'les-mots-calibration';

const DEFAULT_CALIBRATION_DATA: CalibrationData = {
    panToLeft: -Math.PI / 2,
    panToRight: Math.PI / 2,
    tiltToUp: Math.PI / 2,
    tiltToDown: -Math.PI / 2,
    eyesHeight: 0.03,
    TopLeft: { eyeX: 0, eyeY: 1 },
    TopRight: { eyeX: 1, eyeY: 1 },
    BottomLeft: { eyeX: 0, eyeY: 0 },
    BottomRight: { eyeX: 1, eyeY: 0 },
};

let calibrationData: CalibrationData = structuredClone(DEFAULT_CALIBRATION_DATA);

function saveCalibrationData(): void {
    localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(calibrationData));
}

export function loadCalibrationData(): CalibrationData {
    const stored = localStorage.getItem(CALIBRATION_STORAGE_KEY);
    if (!stored) {
        calibrationData = structuredClone(DEFAULT_CALIBRATION_DATA);
        return calibrationData;
    }

    const parsed = JSON.parse(stored) as Partial<CalibrationData>;
    calibrationData = {
        ...structuredClone(DEFAULT_CALIBRATION_DATA),
        ...parsed,
    };
    return calibrationData;
}

export function getCalibrationData(): CalibrationData {
    return calibrationData;
}

let latestEyeData: EyeData | null = null;
let latestEyesHeight: number | null = null;
let latestFaceAngles:
    | {
          pan: number;
          tilt: number;
          roll: number;
      }
    | null = null;

export function updateCalibrationPoint(point: CalibrationPoint): void {
    if (!latestEyeData) return;
    calibrationData[point] = latestEyeData;
    saveCalibrationData();

    console.log("Calibration point updated", point, latestEyeData);
}

export function updateCalibrationAngle(angle: FaceAngle): void {
    if (!latestFaceAngles) return;
    const value = angle.startsWith('panTo') ? latestFaceAngles.pan : latestFaceAngles.tilt;
    calibrationData[angle] = value;
    saveCalibrationData();

    console.log("Calibration angle updated", angle, value);
}

export function updateCalibrationEyesHeight(): void {
    if (latestEyesHeight === null) return;
    calibrationData.eyesHeight = latestEyesHeight;
    saveCalibrationData();

    console.log("Calibration eyes height updated", latestEyesHeight);
}

const LANDMARK_INDICES = {
    LEFT_EYE: {
        LEFT_CORNER: 33,
        RIGHT_CORNER: 133,
        TOP: 159,
        BOTTOM: 145,
        IRIS_CENTER: 468,
    },
    RIGHT_EYE: {
        LEFT_CORNER: 362,
        RIGHT_CORNER: 263,
        TOP: 386,
        BOTTOM: 374,
        IRIS_CENTER: 473,
    },
} as const;

const eyeSmoothTime = 30;
const eyeMaxSpeed = 0.1;

let xVelRef = { value: 0 };
let yVelRef = { value: 0 };

let lastX = 0.5;
let lastY = 0.5;
let lastTime = performance.now();

const TASKS_VISION_WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm';
const FACE_LANDMARKER_MODEL_URL =
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export async function setupTracking(
    webcam: HTMLVideoElement,
    onResult: (result: TrackingResult) => void
): Promise<() => void> {
    loadCalibrationData();

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const vision = await FilesetResolver.forVisionTasks(TASKS_VISION_WASM_ROOT);

    const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL_URL,
            delegate: 'GPU',
        },
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
    });

    webcam.srcObject = stream;
    webcam.playsInline = true;
    webcam.muted = true;

    let stopped = false;

    const onLoadedData = () => {
        trackingLoop();
    };
    webcam.addEventListener('loadeddata', onLoadedData);

    function processFrame(): void {

        const result = faceLandmarker.detectForVideo(webcam, performance.now());
        const landmarks = result?.faceLandmarks?.[0];
        const faceTransformationMatrix = result?.facialTransformationMatrixes?.[0];
        if (!landmarks || !faceTransformationMatrix) return;

        onResult(processTracking(landmarks, faceTransformationMatrix));
    }

    function trackingLoop(): void {
        if (stopped) return;
        processFrame();
        requestAnimationFrame(trackingLoop);
    }

    return () => {
        stopped = true;
        webcam.removeEventListener('loadeddata', onLoadedData);
        stream.getTracks().forEach((t) => t.stop());
        faceLandmarker.close();
    };
}

function processTracking(landmarks: NormalizedLandmark[], faceTransformationMatrix: Matrix): TrackingResult {
    const now = performance.now();
    const deltaTime = now - lastTime;
    lastTime = now;

    const {
        TopLeft: { eyeX: topLeftX, eyeY: topLeftY },
        TopRight: { eyeX: topRightX, eyeY: topRightY },
        BottomLeft: { eyeX: bottomLeftX, eyeY: bottomLeftY },
        BottomRight: { eyeX: bottomRightX, eyeY: bottomRightY },
        panToLeft,
        panToRight,
        tiltToUp,
        tiltToDown,
        eyesHeight,
    } = calibrationData;

    const leftEyeHeight = Math.abs(landmarks[LANDMARK_INDICES.LEFT_EYE.TOP].y - landmarks[LANDMARK_INDICES.LEFT_EYE.BOTTOM].y);
    const rightEyeHeight = Math.abs(landmarks[LANDMARK_INDICES.RIGHT_EYE.TOP].y - landmarks[LANDMARK_INDICES.RIGHT_EYE.BOTTOM].y);
    latestEyesHeight = midPoint(leftEyeHeight, rightEyeHeight);

    const leftEyeX = inverseLerp(landmarks[LANDMARK_INDICES.LEFT_EYE.IRIS_CENTER].x, [
        landmarks[LANDMARK_INDICES.LEFT_EYE.LEFT_CORNER].x,
        landmarks[LANDMARK_INDICES.LEFT_EYE.RIGHT_CORNER].x,
    ]);

    const rightEyeX = inverseLerp(landmarks[LANDMARK_INDICES.RIGHT_EYE.IRIS_CENTER].x, [
        landmarks[LANDMARK_INDICES.RIGHT_EYE.LEFT_CORNER].x,
        landmarks[LANDMARK_INDICES.RIGHT_EYE.RIGHT_CORNER].x,
    ]);

    const eyeX = smoothDamp(latestEyeData?.eyeX ?? 0, midPoint(leftEyeX, rightEyeX), xVelRef, eyeSmoothTime, deltaTime, eyeMaxSpeed);

    const leftIrisToEyeLineY =
        landmarks[LANDMARK_INDICES.LEFT_EYE.IRIS_CENTER].y -
        ((1 - leftEyeX) * landmarks[LANDMARK_INDICES.LEFT_EYE.LEFT_CORNER].y +
            leftEyeX * landmarks[LANDMARK_INDICES.LEFT_EYE.RIGHT_CORNER].y);
    const leftEyeY = remap((4 * leftIrisToEyeLineY) / eyesHeight, [-0.5, 0.5], [0, 1]);

    const rightIrisToEyeLineY =
        landmarks[LANDMARK_INDICES.RIGHT_EYE.IRIS_CENTER].y -
        ((1 - rightEyeX) * landmarks[LANDMARK_INDICES.RIGHT_EYE.LEFT_CORNER].y +
            rightEyeX * landmarks[LANDMARK_INDICES.RIGHT_EYE.RIGHT_CORNER].y);
    const rightEyeY = remap((3 * rightIrisToEyeLineY) / eyesHeight, [-0.5, 0.5], [0, 1]);

    const eyeY = smoothDamp(latestEyeData?.eyeY ?? 0, midPoint(leftEyeY, rightEyeY), yVelRef, eyeSmoothTime, deltaTime, eyeMaxSpeed);

    latestEyeData = { eyeX, eyeY };

    const m = faceTransformationMatrix.data;
    const tilt = Math.asin(-clamp(m[9], -1, 1))
    const pan = Math.atan2(m[8], m[10])
    const roll = Math.atan2(m[1], m[5])
    latestFaceAngles = { pan, tilt, roll };

    const leftEyeTop = landmarks[LANDMARK_INDICES.LEFT_EYE.TOP];
    const leftEyeBottom = landmarks[LANDMARK_INDICES.LEFT_EYE.BOTTOM];
    const rightEyeTop = landmarks[LANDMARK_INDICES.RIGHT_EYE.TOP];
    const rightEyeBottom = landmarks[LANDMARK_INDICES.RIGHT_EYE.BOTTOM];

    const currentEyesHeight = midPoint(distance(leftEyeTop, leftEyeBottom), distance(rightEyeTop, rightEyeBottom));
    latestEyesHeight = currentEyesHeight;

    const blinkLevel =
        1 -
        remap(currentEyesHeight, [0.4 * calibrationData.eyesHeight, 0.7 * calibrationData.eyesHeight], [0, 1]);

    const xTarget = clamp01(
        0.5 +
            remap(eyeX, [midPoint(topLeftX, bottomLeftX), midPoint(topRightX, bottomRightX)], [-0.5, 0.5]) +
            remap(pan, [panToLeft, panToRight], [-0.5, 0.5])
    );

    const yTarget = clamp01(
        0.5 +
            (1 - blinkLevel) * remap(eyeY, [midPoint(topLeftY, topRightY), midPoint(bottomLeftY, bottomRightY)], [-0.5, 0.5]) +
            remap(tilt, [tiltToUp, tiltToDown], [-0.5, 0.5])
    );

    const x = smoothDamp(lastX, xTarget, xVelRef, eyeSmoothTime, deltaTime, eyeMaxSpeed);
    const y = smoothDamp(lastY, yTarget, yVelRef, eyeSmoothTime, deltaTime, eyeMaxSpeed);

    lastX = x;
    lastY = y;

    return {
        eyePosition: { x, y },
    };
}