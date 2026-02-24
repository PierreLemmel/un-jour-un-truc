import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";


const TASKS_VISION_WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm';
const FACE_LANDMARKER_MODEL_URL =
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';



async function createLandmarker() {

    const vision = await FilesetResolver.forVisionTasks(TASKS_VISION_WASM_ROOT);

    const response = await fetch(vision.wasmLoaderPath);

    // Dirty hack found from https://github.com/google-ai-edge/mediapipe/issues/5257

    // Use indirect eval to execute the script in the global scope.
    // This is required for the library to find the ModuleFactory.
    (0, eval)(await response.text());
    // FIX: Cast to 'any' to bypass TS2790 strict check
    // delete wasmLoaderPath to trick FaceLandmarker.createFromOptions into thinking it doesn't need to load the script
    delete (vision as any).wasmLoaderPath;

    const result = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL_URL,
            delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        outputFaceBlendshapes: true,
    });

    return result;
}

const faceLandmarker = await createLandmarker();

self.postMessage({
    type: 'tracking-ready'
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
    const blendshapes = result?.faceBlendshapes?.[0];
    
    isProcessing = false;
    
    if (!blendshapes) return;
    
    const browInnerUp = blendshapes.categories[3].score;
    const browOuterUpLeft = blendshapes.categories[4].score;
    const browOuterUpRight = blendshapes.categories[5].score;

    const browScore = Math.max(browInnerUp, browOuterUpLeft, browOuterUpRight);

    self.postMessage({
        type: 'tracking-result',
        value: browScore
    });
}

self.onmessage = async (event) => {

    const { type, timestamp } = event.data;

    if (type === 'frame') {
        processFrame(event.data.image);
    }

}