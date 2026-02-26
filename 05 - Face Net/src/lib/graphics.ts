import * as THREE from 'three';
import { get } from 'svelte/store';
import { settings, type Settings } from './settings';
import vertexShader from '../shaders/face.vert?raw';
import fragmentShader from '../shaders/face.frag?raw';

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.OrthographicCamera | null = null;
let pointsMesh: THREE.Points | null = null;
let animationFrameId: number | null = null;
let setup = false;

let gameWidth = 0;
let gameHeight = 0;

export type Point3 = {
    x: number;
    y: number;
    z: number;
};

let positions: Point3[] = [];

let cameraWidth = 640;
let cameraHeight = 480;

export function setCameraSize(width: number, height: number): void {
    cameraWidth = width;
    cameraHeight = height;
}

export function updateGraphicsData(data: Point3[]): void {
    positions = data;
}

let lastPositionCount = -1;

function createPointsMesh(s: Settings): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positionArray = new Float32Array(positions.length * 3);
    for (let i = 0; i < positions.length; i++) {
        positionArray[i * 3] = positions[i].x;
        positionArray[i * 3 + 1] = 1 - positions[i].y;
        positionArray[i * 3 + 2] = positions[i].z;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    geometry.computeBoundingSphere();

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            pointSize: { value: s.pointSize },
            pointColor1: { value: new THREE.Vector3(s.pointColor1[0], s.pointColor1[1], s.pointColor1[2]) },
            pointColor2: { value: new THREE.Vector3(s.pointColor2[0], s.pointColor2[1], s.pointColor2[2]) },
        },
        transparent: true,
        depthWrite: false,
    });

    return new THREE.Points(geometry, material);
}

function updatePointsMesh(mesh: THREE.Points, s: Settings): void {
    const geometry = mesh.geometry;
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    if (posAttr.count === positions.length) {
        for (let i = 0; i < positions.length; i++) {
            posAttr.array[i * 3] = positions[i].x;
            posAttr.array[i * 3 + 1] = 1 - positions[i].y;
            posAttr.array[i * 3 + 2] = positions[i].z;
        }
        posAttr.needsUpdate = true;
    }

    const mat = mesh.material as THREE.ShaderMaterial;
    mat.uniforms.pointSize.value = s.pointSize;
    mat.uniforms.pointColor1.value.set(s.pointColor1[0], s.pointColor1[1], s.pointColor1[2]);
    mat.uniforms.pointColor2.value.set(s.pointColor2[0], s.pointColor2[1], s.pointColor2[2]);
}

export function setupGraphics(canvas: HTMLCanvasElement): void {
    if (setup) return;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(0, 1, 1, 0, -20, 20);
    camera.position.z = 10;
    camera.scale.set(1, 1, 1);

    setup = true;

    function loop(): void {
        if (!renderer || !scene || !camera || gameWidth <= 0 || gameHeight <= 0) {
            animationFrameId = requestAnimationFrame(loop);
            return;
        }

        const s = get(settings);

        if (positions.length > 0) {
            if (!pointsMesh || lastPositionCount !== positions.length) {
                if (pointsMesh) {
                    scene.remove(pointsMesh);
                    pointsMesh.geometry.dispose();
                    (pointsMesh.material as THREE.Material).dispose();
                }
                pointsMesh = createPointsMesh(s);
                scene.add(pointsMesh);
                lastPositionCount = positions.length;
            } else {
                updatePointsMesh(pointsMesh, s);
            }
        } else if (pointsMesh) {
            scene.remove(pointsMesh);
            pointsMesh.geometry.dispose();
            (pointsMesh.material as THREE.Material).dispose();
            pointsMesh = null;
            lastPositionCount = -1;
        }

        renderer.setClearColor(
            new THREE.Color(s.backgroundColor1[0], s.backgroundColor1[1], s.backgroundColor1[2]),
            s.backgroundColor1[3]
        );
        renderer.render(scene, camera);

        window.dispatchEvent(new CustomEvent('render-frame'));
        animationFrameId = requestAnimationFrame(loop);
    }

    loop();
}

export function resizeGraphics(w: number, h: number): void {
    gameWidth = w;
    gameHeight = h;

    if (renderer && camera) {
        renderer.setSize(w, h);
        camera.left = 0;
        camera.right = 1;
        camera.top = 0;
        camera.bottom = 1;
        camera.updateProjectionMatrix();
    }
}

export function disposeGraphics(): void {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (pointsMesh) {
        pointsMesh.geometry.dispose();
        (pointsMesh.material as THREE.Material).dispose();
        pointsMesh = null;
    }
    scene = null;
    camera = null;
    renderer = null;
    setup = false;
}
