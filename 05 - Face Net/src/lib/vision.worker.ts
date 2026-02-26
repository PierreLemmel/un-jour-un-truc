import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const TASKS_VISION_WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm';
const FACE_LANDMARKER_MODEL_URL =
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

async function createLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(TASKS_VISION_WASM_ROOT);

    const response = await fetch(vision.wasmLoaderPath);

    (0, eval)(await response.text());
    delete (vision as any).wasmLoaderPath;

    const result = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL_URL,
            delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        outputFacialTransformationMatrixes: true,
    });

    return result;
}

const faceLandmarker = await createLandmarker();

self.postMessage({
    type: 'vision-ready'
});

let isProcessing = false;


function processFrame(image: ImageBitmap) {

    const start = performance.now();

    if (isProcessing) {
        self.postMessage({
            type: 'skip-frame',
            timestamp: start
        });
        return;
    }

    isProcessing = true;

    const result = faceLandmarker.detectForVideo(image, performance.now());
    const landmarks = result?.faceLandmarks?.[0];
    const faceTransformationMatrix = result?.facialTransformationMatrixes?.[0];
    
    isProcessing = false;
    
    if (!landmarks || !faceTransformationMatrix) return;

    const data = faceTransformationMatrix.data;

    const position = {
        x: data[12],
        y: data[13],
        z: data[14],
    }

    const scale = {
        x: Math.hypot(data[0], data[1], data[2]),
        y: Math.hypot(data[4], data[5], data[6]),
        z: Math.hypot(data[8], data[9], data[10]),
    }

    self.postMessage({
        type: 'vision-result',
        values: landmarks,
        position,
        scale
    });
}

self.onmessage = async (event) => {
    const { type } = event.data;

    if (type === 'frame') {
        processFrame(event.data.image);
    }
};
