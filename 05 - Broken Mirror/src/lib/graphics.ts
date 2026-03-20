import * as THREE from 'three';
import { get } from 'svelte/store';
import { settings, type Settings } from './settings';
import { FACE_LANDMARKS_CONTOURS } from './faceConnections';
import { LIP_TRIANGLES, LEFT_EYE_TRIANGLES, RIGHT_EYE_TRIANGLES, LEFT_EYEBROW_TRIANGLES, RIGHT_EYEBROW_TRIANGLES, FACE_TRIANGLES } from './faceTriangles';

import pointsVertexShader from '../shaders/face-point.vert.glsl';
import pointsFragmentShader from '../shaders/face-point.frag.glsl';
import lineVertexShader from '../shaders/face-line.vert.glsl';
import lineFragmentShader from '../shaders/face-line.frag.glsl';
import triangleVertexShader from '../shaders/face-triangle.vert.glsl';
import triangleFragmentShader from '../shaders/face-triangle.frag.glsl';


let settingsUnsubscribe: (() => void) | null = null;

function applySettingsToUniforms(s: Settings): void {
    if (!faceMesh || !faceLineMesh || !faceTriangleMesh || !faceBoxHelper || !renderer) return;
    faceTriangleMesh.visible = s.showMesh;

    const {
        pointSize,
        pointColor1,
        pointColor2,
        pointSizeNoiseSpeed,
        pointSizeNoiseScale,
        pointColorNoiseSpeed,
        pointColorNoiseScale,
        lineColor1,
        surfaceColor1,
        surfaceColor2,
        faceMeshMaster,
        faceLinesMaster,
        facePointsMaster,
        backgroundColor1
    } = s;
    const faceMat = faceMesh.material as THREE.ShaderMaterial;
    faceMat.uniforms.master.value = facePointsMaster;
    faceMat.uniforms.pointSize.value = pointSize;
    faceMat.uniforms.pointColor1.value.copy(pointColor1);
    faceMat.uniforms.pointColor2.value.copy(pointColor2);
    faceMat.uniforms.pointSizeNoiseSpeed.value = pointSizeNoiseSpeed;
    faceMat.uniforms.pointSizeNoiseScale.value = pointSizeNoiseScale;
    faceMat.uniforms.pointColorNoiseSpeed.value = pointColorNoiseSpeed;
    faceMat.uniforms.pointColorNoiseScale.value = pointColorNoiseScale;

    const lineMat = faceLineMesh.material as THREE.ShaderMaterial;
    lineMat.uniforms.master.value = faceLinesMaster;
    lineMat.uniforms.lineColor.value.copy(lineColor1);

    const triangleMaterials = faceTriangleMesh.material as THREE.ShaderMaterial[];
    triangleMaterials[0].uniforms.color.value.copy(surfaceColor1);
    triangleMaterials[1].uniforms.color.value.copy(surfaceColor2);

    for (const mat of triangleMaterials) {
        mat.uniforms.master.value = faceMeshMaster;
        mat.wireframe = s.showDebug;
    }

    renderer.setClearColor(new THREE.Color(backgroundColor1.x, backgroundColor1.y, backgroundColor1.z));
    faceBoxHelper.visible = s.showDebug;
    faceMesh.visible = s.showPoints;
    faceLineMesh.visible = s.showFaceLines;
}

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.OrthographicCamera | null = null;
let faceMesh: THREE.Points | null = null;
let faceLineMesh: THREE.LineSegments | null = null;
let faceTriangleMesh: THREE.Mesh | null = null;
let faceBoxHelper: THREE.BoxHelper | null = null;
let animationFrameId: number | null = null;
let setup = false;

let isPointerDown = false;
let lastPointerX = 0;
let lastPointerY = 0;
let cameraAngle = 0;
let cameraControlsCanvas: HTMLCanvasElement | null = null;
let cameraControlHandlers: {
    pointerdown: (e: PointerEvent) => void;
    pointermove: (e: PointerEvent) => void;
    pointerup: (e: PointerEvent) => void;
    pointercancel: (e: PointerEvent) => void;
    wheel: (e: WheelEvent) => void;
} | null = null;
const ROTATION_SENSITIVITY = 0.005;
const ZOOM_SENSITIVITY = 0.002;

let zoom = 1;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;

const FACE_MESH_COUNT = 478;

export type Point3 = {
    x: number;
    y: number;
    z: number;
};

let positions: Point3[] = [];

let faceBaseScale = new THREE.Vector3(1, 1, 1);

let gameWidth = 0;
let gameHeight = 0;

export function setCameraSize(cw: number, ch: number): void {
    const max = Math.max(cw, ch);
    faceBaseScale.set(cw / max, ch / max, 1);
}

export function updateFaceMeshPoints(data: Point3[]): void {
    
    if (!(gameWidth > 0 && gameHeight > 0)) return;

    if (!faceMesh || !faceLineMesh || !faceTriangleMesh || !faceBoxHelper) return;

    if (data.length < FACE_MESH_COUNT) {
        console.error(`Received data length does not match FACE_MESH_COUNT (${data.length} !== ${FACE_MESH_COUNT})`);
        return;
    }

    const { mirrorCam, faceProportion, faceOffset } = get(settings);
    positions = data;

    const pointsGeometry = faceMesh.geometry;
    const posAttr = pointsGeometry.getAttribute('position') as THREE.BufferAttribute;
    
    for (let i = 0; i < positions.length; i++) {
        posAttr.array[i * 3] = (mirrorCam ? 1 - positions[i].x : positions[i].x) - 0.5;
        posAttr.array[i * 3 + 1] = positions[i].y - 0.5;
        posAttr.array[i * 3 + 2] = positions[i].z;
    }
    posAttr.needsUpdate = true;

    pointsGeometry.computeBoundingBox();
    faceBoxHelper.update();

    const {
        x: xMin,
        y: yMin,
    } = pointsGeometry.boundingBox!.min;
    const {
        x: xMax,
        y: yMax,
    } = pointsGeometry.boundingBox!.max;


    const scaleX = (xMax - xMin) > 0 ? (gameWidth / Math.max(gameWidth, gameHeight)) * (faceProportion / 100) / (xMax - xMin) : 0;
    const scaleY = (yMax - yMin) > 0 ? (gameHeight / Math.max(gameWidth, gameHeight)) * (faceProportion / 100) / (yMax - yMin) : 0;
    const faceScale = Math.min(scaleX, scaleY);
    
    const xCenter = (xMax + xMin) / 2;
    const yCenter = (yMax + yMin) / 2;

    faceMesh.position.set(-xCenter * faceScale, -yCenter * faceScale + faceOffset, 0);
    faceLineMesh.position.copy(faceMesh.position);
    faceTriangleMesh.position.copy(faceMesh.position);

    faceMesh.scale.set(faceBaseScale.x * faceScale, faceBaseScale.y * faceScale, 1);
    faceLineMesh.scale.copy(faceMesh.scale);
    faceTriangleMesh.scale.copy(faceMesh.scale);
}

function createFaceGeometries(): {
    pointsGeometry: THREE.BufferGeometry;
    lineGeometry: THREE.BufferGeometry;
    triangleGeometry: THREE.BufferGeometry;
} {
    const positionArray = new Float32Array(FACE_MESH_COUNT * 3);
    const posAttr = new THREE.BufferAttribute(positionArray, 3);

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', posAttr);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', posAttr);
    const lineIndexArray = new Uint16Array(FACE_LANDMARKS_CONTOURS.length * 2);
    for (let i = 0; i < FACE_LANDMARKS_CONTOURS.length; i++) {
        lineIndexArray[i * 2] = FACE_LANDMARKS_CONTOURS[i][0];
        lineIndexArray[i * 2 + 1] = FACE_LANDMARKS_CONTOURS[i][1];
    }
    lineGeometry.setIndex(new THREE.BufferAttribute(lineIndexArray, 1));

    const triangleGeometry = new THREE.BufferGeometry();
    triangleGeometry.setAttribute('position', posAttr);
    const triCount = LIP_TRIANGLES.length + LEFT_EYE_TRIANGLES.length + RIGHT_EYE_TRIANGLES.length + LEFT_EYEBROW_TRIANGLES.length + RIGHT_EYEBROW_TRIANGLES.length + FACE_TRIANGLES.length;
    
    const triangleIndexArray = new Uint16Array(triCount * 3);

    let i = 0;
    function addTriangles(triangles: [number, number, number][], materialIndex: number) {
        triangleGeometry.addGroup(i, 3 * triangles.length, materialIndex);

        for (const triangle of triangles) {
            triangleIndexArray[i++] = triangle[0];
            triangleIndexArray[i++] = triangle[1];
            triangleIndexArray[i++] = triangle[2];
        }
    }
    
    addTriangles(FACE_TRIANGLES, 0);
    addTriangles(LIP_TRIANGLES, 1);
    addTriangles(LEFT_EYE_TRIANGLES, 1);
    addTriangles(RIGHT_EYE_TRIANGLES, 1);
    addTriangles(LEFT_EYEBROW_TRIANGLES, 1);
    addTriangles(RIGHT_EYEBROW_TRIANGLES, 1);
    
    triangleGeometry.setIndex(new THREE.BufferAttribute(triangleIndexArray, 1));

    return { pointsGeometry, lineGeometry, triangleGeometry };
}

function createPointsMesh(geometry: THREE.BufferGeometry, settings: Settings): THREE.Points {
    const { pointSize, pointColor1, pointColor2, pointSizeNoiseSpeed, pointSizeNoiseScale, pointColorNoiseSpeed, pointColorNoiseScale, facePointsMaster } = settings;
    const material = new THREE.ShaderMaterial({
        vertexShader: pointsVertexShader,
        fragmentShader: pointsFragmentShader,
        uniforms: {
            master: { value: facePointsMaster },
            pointSize: { value: pointSize },
            pointColor1: { value: pointColor1.clone() },
            pointColor2: { value: pointColor2.clone() },
            pointSizeNoiseSpeed: { value: pointSizeNoiseSpeed },
            pointSizeNoiseScale: { value: pointSizeNoiseScale },
            pointColorNoiseSpeed: { value: pointColorNoiseSpeed },
            pointColorNoiseScale: { value: pointColorNoiseScale },
            time: { value: 0 },
        },
        transparent: true
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    return points;
}

function createLineMesh(geometry: THREE.BufferGeometry, settings: Settings): THREE.LineSegments {
    const { lineColor1 } = settings;
    const material = new THREE.ShaderMaterial({
        vertexShader: lineVertexShader,
        fragmentShader: lineFragmentShader,
        uniforms: {
            master: { value: settings.faceLinesMaster },
            lineColor: { value: lineColor1.clone() },
            time: { value: 0 }
        },
        transparent: true
    });

    const lines = new THREE.LineSegments(geometry, material);
    lines.frustumCulled = false;
    return lines;
}

function createTriangleMesh(geometry: THREE.BufferGeometry, settings: Settings): THREE.Mesh {
    const { surfaceColor1, surfaceColor2 } = settings;

    function createMaterial(color: THREE.Vector3): THREE.ShaderMaterial {
        return new THREE.ShaderMaterial({
            vertexShader: triangleVertexShader,
            fragmentShader: triangleFragmentShader,
            uniforms: {
                master: { value: settings.faceMeshMaster },
                color: { value: color.clone() },
                time: { value: 0 }
            },
            transparent: true,
            wireframe: settings.showDebug
        });
    }

    const materials = [
        createMaterial(surfaceColor1),
        createMaterial(surfaceColor2),
    ];
    
    const mesh = new THREE.Mesh(geometry, materials);
    mesh.frustumCulled = false;
    return mesh;
}

function setupCameraControls(canvas: HTMLCanvasElement): void {
    cameraControlsCanvas = canvas;

    const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        isPointerDown = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
        const index = raycastPoint(e.clientX, e.clientY);
        
        window.dispatchEvent(new CustomEvent("point-hover", { detail: { index } }));

        if (!isPointerDown || !camera) return;
        const dx = e.clientX - lastPointerX;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        cameraAngle -= dx * ROTATION_SENSITIVITY;

        camera.position.set(CAMERA_DISTANCE * Math.sin(cameraAngle), 0, CAMERA_DISTANCE * Math.cos(cameraAngle));
        camera.lookAt(0, 0, 0);
    };

    const onPointerUp = (e: PointerEvent) => {
        if (e.button !== 0) return;
        isPointerDown = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const onWheel = (e: WheelEvent) => {
        if (!camera) return;
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);
        zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));

        window.dispatchEvent(new CustomEvent('zoom-changed', { detail: { zoom } }));
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
    };

    cameraControlHandlers = {
        pointerdown: onPointerDown,
        pointermove: onPointerMove,
        pointerup: onPointerUp,
        pointercancel: onPointerUp,
        wheel: onWheel
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
}

function removeCameraControls(): void {
    if (!cameraControlsCanvas || !cameraControlHandlers) return;
    const h = cameraControlHandlers;
    cameraControlsCanvas.removeEventListener('pointerdown', h.pointerdown);
    cameraControlsCanvas.removeEventListener('pointermove', h.pointermove);
    cameraControlsCanvas.removeEventListener('pointerup', h.pointerup);
    cameraControlsCanvas.removeEventListener('pointercancel', h.pointercancel);
    cameraControlsCanvas.removeEventListener('wheel', h.wheel);
    cameraControlsCanvas = null;
    cameraControlHandlers = null;
}

const CAMERA_DISTANCE = 10;

let raycaster: THREE.Raycaster | null = null;
let mouseNDC: THREE.Vector2 | null = null;

function raycastPoint(clientX: number, clientY: number): number | null {

    if (!camera || !faceMesh || !cameraControlsCanvas) return null;
    const rect = cameraControlsCanvas.getBoundingClientRect();
    if (!raycaster) raycaster = new THREE.Raycaster();
    if (!mouseNDC) mouseNDC = new THREE.Vector2();
    mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouseNDC, camera);
    const intersects = raycaster.intersectObject(faceMesh);

    const { pointSize } = get(settings);
    let minDistance = Infinity;
    let minIndex = null;
    for (const intersect of intersects) {
        const distance = intersect.distanceToRay!;
        if (distance < minDistance) {
            minDistance = distance;
            minIndex = intersect.index!;
        }
    }
    
    if (minDistance < pointSize) {
        return minIndex;
    }
    return null;
}

export function setupGraphics(canvas: HTMLCanvasElement): void {
    if (setup) return;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(0, 1, 0, 1, 0.1, 1000);
    camera.position.set(0, 0, CAMERA_DISTANCE);

    const { pointsGeometry, lineGeometry, triangleGeometry } = createFaceGeometries();
    faceTriangleMesh = createTriangleMesh(triangleGeometry, get(settings));
    faceTriangleMesh.position.set(0, 0, 0);
    scene.add(faceTriangleMesh);

    faceMesh = createPointsMesh(pointsGeometry, get(settings));
    faceMesh.position.set(0, 0, 0);
    scene.add(faceMesh);

    faceLineMesh = createLineMesh(lineGeometry, get(settings));
    faceLineMesh.position.set(0, 0, 0);
    scene.add(faceLineMesh);

    faceBoxHelper = new THREE.BoxHelper(faceMesh, 0xff00ff);
    faceBoxHelper.visible = true;
    scene.add(faceBoxHelper);

    settingsUnsubscribe = settings.subscribe((s) => applySettingsToUniforms(s));
    applySettingsToUniforms(get(settings));

    setupCameraControls(canvas);

    setup = true;

    function loop(): void {
        update();
        window.dispatchEvent(new CustomEvent('render-frame'));
        animationFrameId = requestAnimationFrame(loop);
    }

    loop();
}


function update() {
    if (!renderer || !scene || !camera || !faceMesh || !faceLineMesh || !faceTriangleMesh || !faceBoxHelper) {
        return;
    }

    const t = performance.now() / 1000;
    (faceMesh.material as THREE.ShaderMaterial).uniforms.time.value = t;
    (faceLineMesh.material as THREE.ShaderMaterial).uniforms.time.value = t;
    for (const mat of faceTriangleMesh.material as THREE.ShaderMaterial[]) {
        mat.uniforms.time.value = t;
    }

    renderer.render(scene, camera);
}

export function resizeGraphics(gw: number, gh: number): void {
    gameWidth = gw;
    gameHeight = gh;

    const max = Math.max(gw, gh);

    const xScale = gw / max;
    const yScale = gh / max;

    if (renderer && camera) {
        renderer.setSize(gw, gh);
        camera.left = -0.5 * xScale;
        camera.right = 0.5 * xScale;
        camera.top = -0.5 * yScale;
        camera.bottom = 0.5 * yScale;
        camera.updateProjectionMatrix();
    }
}

export function disposeGraphics(): void {
    removeCameraControls();
    settingsUnsubscribe?.();
    settingsUnsubscribe = null;
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (faceMesh) {
        faceMesh.geometry.dispose();
        (faceMesh.material as THREE.Material).dispose();
        faceMesh = null;
    }
    if (faceLineMesh) {
        faceLineMesh.geometry.dispose();
        (faceLineMesh.material as THREE.Material).dispose();
        faceLineMesh = null;
    }
    if (faceTriangleMesh) {
        faceTriangleMesh.geometry.dispose();
        for (const mat of faceTriangleMesh.material as THREE.ShaderMaterial[]) {
            mat.dispose();
        }
        faceTriangleMesh = null;
    }
    scene = null;
    camera = null;
    renderer = null;
    raycaster = null;
    mouseNDC = null;
    setup = false;
}
