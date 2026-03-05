import * as THREE from 'three';
import { get } from 'svelte/store';
import { settings, type Settings } from './settings';
import vertexShader from '../shaders/face.vert?raw';
import fragmentShader from '../shaders/face.frag?raw';

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.OrthographicCamera | null = null;
let faceMesh: THREE.Points | null = null;
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
let faceScale = 1;

export function setCameraSize(cw: number, ch: number): void {
    const max = Math.max(cw, ch);
    faceBaseScale.set(cw / max, ch / max, 1);
}

export function updateFaceMeshPoints(data: Point3[]): void {
    
    if (!faceMesh || !faceBoxHelper) return;

    if (data.length !== FACE_MESH_COUNT) {
        console.error(`Received data length does not match FACE_MESH_COUNT (${data.length} !== ${FACE_MESH_COUNT})`);
        return;
    }

    const { mirrorCam } = get(settings);
    positions = data;

    const { geometry } = faceMesh;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    
    for (let i = 0; i < positions.length; i++) {
        posAttr.array[i * 3] = (mirrorCam ? 1 - positions[i].x : positions[i].x) - 0.5;
        posAttr.array[i * 3 + 1] = positions[i].y - 0.5;
        posAttr.array[i * 3 + 2] = positions[i].z;
    }
    posAttr.needsUpdate = true;

    geometry.computeBoundingBox();
    faceBoxHelper.update();

    const {
        x: xMin,
        y: yMin,
    } = geometry.boundingBox!.min;
    const {
        x: xMax,
        y: yMax,
    } = geometry.boundingBox!.max;


    faceMesh.scale.set(faceBaseScale.x * faceScale, faceBaseScale.y * faceScale, faceBaseScale.z * faceScale);
}


function createPointsMesh(settings: Settings): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positionArray = new Float32Array(FACE_MESH_COUNT * 3);

    geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));


    const { pointSize, pointColor1, pointColor2 } = settings;
    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            pointSize: { value: pointSize },
            pointColor1: { value: new THREE.Vector3(pointColor1[0], pointColor1[1], pointColor1[2]) },
            pointColor2: { value: new THREE.Vector3(pointColor2[0], pointColor2[1], pointColor2[2]) },
        },
        transparent: true,
        depthWrite: false,
    });

    return new THREE.Points(geometry, material);
}

export function setupGraphics(canvas: HTMLCanvasElement): void {
    if (setup) return;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(0, 1, 0, 1, -20, 20);
    camera.position.set(0, 0, 10);

    faceMesh = createPointsMesh(get(settings));
    faceMesh.position.set(0, 0, 0);
    scene.add(faceMesh);

    faceBoxHelper = new THREE.BoxHelper(faceMesh, 0xff00ff);
    faceBoxHelper.visible = true;
    scene.add(faceBoxHelper);

    setup = true;

    function loop(): void {
        update();
        window.dispatchEvent(new CustomEvent('render-frame'));
        animationFrameId = requestAnimationFrame(loop);
    }

    loop();
}


function update() {
    if (!renderer || !scene || !camera ||  !faceMesh || !faceBoxHelper) {
        return;
    }

    const {
        pointSize,
        pointColor1,
        pointColor2,
        backgroundColor1,
        showDebug
    } = get(settings);

    const faceMat = faceMesh.material as THREE.ShaderMaterial;
    faceMat.uniforms.pointSize.value = pointSize;
    faceMat.uniforms.pointColor1.value.set(pointColor1[0], pointColor1[1], pointColor1[2]);
    faceMat.uniforms.pointColor2.value.set(pointColor2[0], pointColor2[1], pointColor2[2]);

    renderer.setClearColor(
        new THREE.Color(backgroundColor1[0], backgroundColor1[1], backgroundColor1[2])
    );

    faceBoxHelper.visible = showDebug;

    renderer.render(scene, camera);
}

export function resizeGraphics(gw: number, gh: number): void {

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
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (faceMesh) {
        faceMesh.geometry.dispose();
        (faceMesh.material as THREE.Material).dispose();
        faceMesh = null;
    }
    scene = null;
    camera = null;
    renderer = null;
    setup = false;
}
