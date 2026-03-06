import * as THREE from 'three';
import { get } from 'svelte/store';
import { settings, type Settings } from './settings';
import { FACE_LANDMARKS_CONTOURS } from './faceConnections';

import pointsVertexShader from '../shaders/face-point.vert.glsl';
import pointsFragmentShader from '../shaders/face-point.frag.glsl';
import lineVertexShader from '../shaders/face-line.vert.glsl';
import lineFragmentShader from '../shaders/face-line.frag.glsl';


let settingsUnsubscribe: (() => void) | null = null;

function applySettingsToUniforms(s: Settings): void {
    if (!faceMesh || !faceLineMesh || !faceBoxHelper || !renderer) return;

    const {
        pointSize,
        pointColor1,
        pointColor2,
        pointSizeNoiseSpeed,
        pointSizeNoiseScale,
        pointColorNoiseSpeed,
        pointColorNoiseScale,
        lineColor1,
        backgroundColor1
    } = s;
    const faceMat = faceMesh.material as THREE.ShaderMaterial;
    faceMat.uniforms.pointSize.value = pointSize;
    faceMat.uniforms.pointColor1.value.set(pointColor1[0], pointColor1[1], pointColor1[2]);
    faceMat.uniforms.pointColor2.value.set(pointColor2[0], pointColor2[1], pointColor2[2]);
    faceMat.uniforms.pointSizeNoiseSpeed.value = pointSizeNoiseSpeed;
    faceMat.uniforms.pointSizeNoiseScale.value = pointSizeNoiseScale;
    faceMat.uniforms.pointColorNoiseSpeed.value = pointColorNoiseSpeed;
    faceMat.uniforms.pointColorNoiseScale.value = pointColorNoiseScale;

    const lineMat = faceLineMesh.material as THREE.ShaderMaterial;
    lineMat.uniforms.lineColor.value.set(lineColor1[0], lineColor1[1], lineColor1[2]);

    renderer.setClearColor(
        new THREE.Color(backgroundColor1[0], backgroundColor1[1], backgroundColor1[2])
    );
    faceBoxHelper.visible = s.showDebug;
}

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.OrthographicCamera | null = null;
let faceMesh: THREE.Points | null = null;
let faceLineMesh: THREE.LineSegments | null = null;
let faceBoxHelper: THREE.BoxHelper | null = null;
let animationFrameId: number | null = null;
let setup = false;

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

    if (!faceMesh || !faceLineMesh || !faceBoxHelper) return;

    if (data.length !== FACE_MESH_COUNT) {
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
    faceLineMesh.scale.copy(faceMesh.scale);

    faceMesh.scale.set(faceBaseScale.x * faceScale, faceBaseScale.y * faceScale, 1);
    faceLineMesh.scale.copy(faceMesh.scale);
}

function createFaceGeometries(): { pointsGeometry: THREE.BufferGeometry; lineGeometry: THREE.BufferGeometry } {
    const positionArray = new Float32Array(FACE_MESH_COUNT * 3);
    const posAttr = new THREE.BufferAttribute(positionArray, 3);

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', posAttr);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', posAttr);
    const indexArray = new Uint16Array(FACE_LANDMARKS_CONTOURS.length * 2);
    for (let i = 0; i < FACE_LANDMARKS_CONTOURS.length; i++) {
        indexArray[i * 2] = FACE_LANDMARKS_CONTOURS[i][0];
        indexArray[i * 2 + 1] = FACE_LANDMARKS_CONTOURS[i][1];
    }
    lineGeometry.setIndex(new THREE.BufferAttribute(indexArray, 1));

    return { pointsGeometry, lineGeometry };
}

function createPointsMesh(geometry: THREE.BufferGeometry, settings: Settings): THREE.Points {
    const { pointSize, pointColor1, pointColor2, pointSizeNoiseSpeed, pointSizeNoiseScale, pointColorNoiseSpeed, pointColorNoiseScale } = settings;
    const material = new THREE.ShaderMaterial({
        vertexShader: pointsVertexShader,
        fragmentShader: pointsFragmentShader,
        uniforms: {
            pointSize: { value: pointSize },
            pointColor1: { value: new THREE.Vector3(pointColor1[0], pointColor1[1], pointColor1[2]) },
            pointColor2: { value: new THREE.Vector3(pointColor2[0], pointColor2[1], pointColor2[2]) },
            pointSizeNoiseSpeed: { value: pointSizeNoiseSpeed },
            pointSizeNoiseScale: { value: pointSizeNoiseScale },
            pointColorNoiseSpeed: { value: pointColorNoiseSpeed },
            pointColorNoiseScale: { value: pointColorNoiseScale },
            time: { value: 0 },
        },
        transparent: true
    });

    return new THREE.Points(geometry, material);
}

function createLineMesh(geometry: THREE.BufferGeometry, settings: Settings): THREE.LineSegments {
    const { lineColor1 } = settings;
    const material = new THREE.ShaderMaterial({
        vertexShader: lineVertexShader,
        fragmentShader: lineFragmentShader,
        uniforms: {
            lineColor: { value: new THREE.Vector3(lineColor1[0], lineColor1[1], lineColor1[2]) },
            time: { value: 0 }
        }
    });
    return new THREE.LineSegments(geometry, material);
}

export function setupGraphics(canvas: HTMLCanvasElement): void {
    if (setup) return;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(0, 1, 0, 1, -20, 20);
    camera.position.set(0, 0, 10);

    const { pointsGeometry, lineGeometry } = createFaceGeometries();
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

    setup = true;

    function loop(): void {
        update();
        window.dispatchEvent(new CustomEvent('render-frame'));
        animationFrameId = requestAnimationFrame(loop);
    }

    loop();
}


function update() {
    if (!renderer || !scene || !camera || !faceMesh || !faceLineMesh || !faceBoxHelper) {
        return;
    }

    const t = performance.now() / 1000;
    (faceMesh.material as THREE.ShaderMaterial).uniforms.time.value = t;
    (faceLineMesh.material as THREE.ShaderMaterial).uniforms.time.value = t;

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
    scene = null;
    camera = null;
    renderer = null;
    setup = false;
}
