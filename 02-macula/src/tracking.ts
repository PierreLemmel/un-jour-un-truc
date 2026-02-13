import { FaceLandmarker, FilesetResolver, type Matrix, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import { clamp, clamp01, createKalmanFilter, distance, inverseLerp, midPoint, remap, type KalmanFilterParams } from "./utils";


export interface TrackingResult {
    blinkLevel: number;
    eyePosition: {
        x: number;
        y: number;
    },

}

export interface EyeData {
    eyeX: number;
    eyeY: number;
}

export const CalibrationPoints = ["TopLeft", "TopRight", "BottomLeft", "BottomRight"] as const;
export type CalibrationPoint = typeof CalibrationPoints[number];
export const FaceAngles = ["panToLeft", "panToRight", "tiltToUp", "tiltToDown"] as const;
export type FaceAngle = typeof FaceAngles[number];

type CalibrationData = {
    [key in CalibrationPoint]: EyeData;
} & {
    [key in FaceAngle]: number;
} & {
    eyesHeight: number;
};

const CALIBRATION_STORAGE_KEY = "macula-calibration";

const DEFAULT_CALIBRATION_DATA: CalibrationData = {
    panToLeft: -Math.PI / 2,
    panToRight: Math.PI / 2,
    tiltToUp: Math.PI / 2,
    tiltToDown: -Math.PI / 2,
    eyesHeight: 0.03,
    TopLeft: {
        eyeX: 0,
        eyeY: 1,
    },
    TopRight: {
        eyeX: 1,
        eyeY: 1,
    },
    BottomLeft: {
        eyeX: 0,
        eyeY: 0,
    },
    BottomRight: {
        eyeX: 1,
        eyeY: 0,
    },
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
let latestFaceAngles: {
    pan: number;
    tilt: number;
    roll: number;
} | null = null;

export function updateCalibrationPoint(point: CalibrationPoint): void {
    if (!latestEyeData) return;

    calibrationData[point] = latestEyeData;
    saveCalibrationData();

    console.log("Calibration point updated", point, latestEyeData);
}

export function updateCalibrationAngle(angle: FaceAngle): void {
    if (!latestFaceAngles) return;

    const value = angle.startsWith("panTo") ? latestFaceAngles.pan : latestFaceAngles.tilt;
    calibrationData[angle] = value;
    saveCalibrationData();

    console.log("Calibration angle updated", angle, value);
}

export function updateCalibrationEyesHeight(): void {
    if (latestEyesHeight === null) return;

    calibrationData.eyesHeight = latestEyesHeight;
    saveCalibrationData();

    console.log("Calibration eyesHeight updated", latestEyesHeight);
}


export async function setupTracking(webcam: HTMLVideoElement, onResult: (result: TrackingResult) => void) {
    loadCalibrationData();

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
	const vision = await FilesetResolver.forVisionTasks(
		"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
	);

	const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
		baseOptions: {
			modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
			delegate: "GPU"
		},
        outputFacialTransformationMatrixes: true,
		runningMode: "VIDEO"
	});
    
    webcam.srcObject = stream;
	webcam.addEventListener("loadeddata", () => {
		trackingLoop();
	});

    function processFrame() {
        const result = faceLandmarker.detectForVideo(webcam, performance.now());

        const landmarks = result?.faceLandmarks?.[0];
        const faceTransformationMatrix = result?.facialTransformationMatrixes?.[0];
        if (!landmarks || !faceTransformationMatrix) {
            return;
        }

        const trackingResult = processTracking(landmarks, faceTransformationMatrix);

        onResult(trackingResult);
    }

    function trackingLoop() {
        processFrame();
        requestAnimationFrame(trackingLoop);
    }
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



const positionFilterParams: Partial<KalmanFilterParams> = {
    processNoise: 100.0,
    measurementNoise: 100.0,
};

const xKalmanFilter = createKalmanFilter(positionFilterParams);
const yKalmanFilter = createKalmanFilter(positionFilterParams);

const angleFilterParams: Partial<KalmanFilterParams> = {
    processNoise: 100.0,
    measurementNoise: 100.0,
};

const panKalmanFilter = createKalmanFilter(angleFilterParams);
const tiltKalmanFilter = createKalmanFilter(angleFilterParams);
const rollKalmanFilter = createKalmanFilter(angleFilterParams);



function processTracking(landmarks: NormalizedLandmark[], faceTransformationMatrix: Matrix): TrackingResult {

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


    
    const leftEyeX = inverseLerp(
        landmarks[LANDMARK_INDICES.LEFT_EYE.IRIS_CENTER].x,
        [
            landmarks[LANDMARK_INDICES.LEFT_EYE.LEFT_CORNER].x,
            landmarks[LANDMARK_INDICES.LEFT_EYE.RIGHT_CORNER].x,
        ]
    );

    const rightEyeX = inverseLerp(
        landmarks[LANDMARK_INDICES.RIGHT_EYE.IRIS_CENTER].x,
        [
            landmarks[LANDMARK_INDICES.RIGHT_EYE.LEFT_CORNER].x,
            landmarks[LANDMARK_INDICES.RIGHT_EYE.RIGHT_CORNER].x
        ]
    );

    const eyeX = xKalmanFilter(midPoint(leftEyeX, rightEyeX));

    const leftIrisToEyeLineY = landmarks[LANDMARK_INDICES.LEFT_EYE.IRIS_CENTER].y - ((1 - leftEyeX) * landmarks[LANDMARK_INDICES.LEFT_EYE.LEFT_CORNER].y + leftEyeX * landmarks[LANDMARK_INDICES.LEFT_EYE.RIGHT_CORNER].y);
    const leftEyeY = remap(
        4 * leftIrisToEyeLineY / eyesHeight,
        [-0.5, 0.5],
        [0, 1]
    );


    const rightIrisToEyeLineY = landmarks[LANDMARK_INDICES.RIGHT_EYE.IRIS_CENTER].y - ((1 - rightEyeX) * landmarks[LANDMARK_INDICES.RIGHT_EYE.LEFT_CORNER].y + rightEyeX * landmarks[LANDMARK_INDICES.RIGHT_EYE.RIGHT_CORNER].y);
    const rightEyeY = remap(
        4 * rightIrisToEyeLineY / eyesHeight,
        [-0.5, 0.5],
        [0, 1]
    );


    const eyeY = yKalmanFilter(midPoint(leftEyeY, rightEyeY));

    latestEyeData = {
        eyeX,
        eyeY,
    };


    const m = faceTransformationMatrix.data;

    const tilt = tiltKalmanFilter(Math.asin(-clamp(m[9], -1, 1)));
    const pan = panKalmanFilter(Math.atan2(m[8], m[10]));
    const roll = rollKalmanFilter(Math.atan2(m[1], m[5]));

    
    latestFaceAngles = {
        pan,
        tilt,
        roll,
    };
    
    const leftEyeTop = landmarks[LANDMARK_INDICES.LEFT_EYE.TOP];
    const leftEyeBottom = landmarks[LANDMARK_INDICES.LEFT_EYE.BOTTOM];

    const rightEyeTop = landmarks[LANDMARK_INDICES.RIGHT_EYE.TOP];
    const rightEyeBottom = landmarks[LANDMARK_INDICES.RIGHT_EYE.BOTTOM];
    

    const currentEyesHeight = midPoint(
        distance(leftEyeTop, leftEyeBottom),
        distance(rightEyeTop, rightEyeBottom)
    );
    latestEyesHeight = currentEyesHeight;


    const blinkLevel = 1 - remap(
        currentEyesHeight,
        [0.4 * calibrationData.eyesHeight, 0.7 * calibrationData.eyesHeight],
        [0, 1]
    );


    const x = clamp01(
        0.5 +
        remap(
            eyeX,
            [midPoint(topLeftX, bottomLeftX), midPoint(topRightX, bottomRightX)],
            [-0.5, 0.5]
        ) +
        remap(
            pan,
            [panToLeft, panToRight],
            [-0.5, 0.5]
        )
    );
    
    const y = 1 - clamp01(
        0.5 +
        blinkLevel * remap(
            eyeY,
            [midPoint(topLeftY, topRightY), midPoint(bottomLeftY, bottomRightY)],
            [-0.5, 0.5]
        ) +
        remap(
            tilt,
            [tiltToUp, tiltToDown],
            [-0.5, 0.5]
        )
    );
    
    return {
        blinkLevel,
        eyePosition: {
            x,
            y,
        },
    };
}