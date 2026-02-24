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
    });

    return result;
}

await createLandmarker();

self.postMessage({
    type: 'vision-ready'
});

self.onmessage = async (event) => {
    const { type } = event.data;

    if (type === 'frame') {
    }
};
