import * as THREE from 'three';

import baseVertexShader from './shaders/base.vert?raw';
import tunnelFragmentShader from './shaders/tunnel.frag?raw';
import noiseGlsl from './shaders/noise.glsl?raw';
import utilsGlsl from './shaders/utils.glsl?raw';
import shapesGlsl from './shaders/shapes.glsl?raw';

const shaderChunks: Record<string, string> = {
    noise: noiseGlsl,
    utils: utilsGlsl,
    shapes: shapesGlsl,
};

function processIncludes(shader: string): string {
    return shader.replace(/#include <(\w+)>/g, (_, name) => {
        return shaderChunks[name] || `// ERROR: Unknown include <${name}>`;
    });
}

let renderer : THREE.WebGLRenderer|null = null;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

export interface ShaderUniforms {
    [key: string]: { value: any };
}

declare global {
    interface HTMLCanvasElement {
        shaderUniforms?: ShaderUniforms;
    }
}

export type TunnelUniforms = {
    uTime: { value: number };
    uResolution: { value: [number, number] };
    uColor1: { value: vec4 };
    uColor2: { value: vec4 };
    uLeavingPoint: { value: vec2 };
    uWidth: { value: number };
    uSpeed: { value: number };
    uSmoothIn: { value: number };
    uSmoothOut: { value: number };
    uSegments: { value: number };
    uOffsetAngle: { value: number };
    uBalance: { value: number };
    uFadeRadius: { value: number };
    uFadeStrength: { value: number };
    uBlinkLevel: { value: number };
    uBlinkColor: { value: vec4 };
    uBlinkMax: { value: number };
}

export type vec2 = [number, number];
export type vec3 = [number, number, number];
export type vec4 = [number, number, number, number];

const uniforms: TunnelUniforms = {
    uTime: { value: 0 },
    uResolution: { value: [1, 1] as vec2 },
    uColor1: { value: [1, 1, 1, 1] as vec4 },
    uColor2: { value: [0, 0, 0, 1] as vec4 },
    uLeavingPoint: { value: [0.5, 0.5] as vec2 },
    uWidth: { value: 70 },
    uSpeed: { value: 100 },
    uSmoothIn: { value: 0 },
    uSmoothOut: { value: 0 },
    uSegments: { value: 4 },
    uOffsetAngle: { value: 0 },
    uBalance: { value: 0.5 },
    uFadeRadius: { value: 0.1 },
    uFadeStrength: { value: 0 },
    uBlinkLevel: { value: 0 },
    uBlinkColor: { value: [1, 1, 1, 1] as vec4 },
    uBlinkMax: { value: 0.88 },
} satisfies ShaderUniforms;

type ExtractUniformValues<T extends Record<keyof T, { value: any }>> = {
    [K in keyof T]: T[K] extends { value: infer V } ? (V| ((oldVal: V) => V)) : never;
};

export type UpdateUniforms = Partial<Omit<ExtractUniformValues<TunnelUniforms>, 'uTime' | 'uResolution'>>;

export function setupGraphics(canvas: HTMLCanvasElement) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    const material = new THREE.ShaderMaterial({
        vertexShader: processIncludes(baseVertexShader),
        fragmentShader: processIncludes(tunnelFragmentShader),
        uniforms: uniforms as ShaderUniforms,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    canvas.shaderUniforms = uniforms as ShaderUniforms;
}

export function resizeGraphics(width: number, height: number) {
    if (!renderer) return;

    renderer.setSize(width, height);
    uniforms.uResolution.value = [width, height];
}

export function updateGraphics() {
    if (!renderer) return;

    uniforms.uTime.value = performance.now() / 1000;
    renderer.render(scene, camera);
}

export function updateUniforms(updates: UpdateUniforms) {
    for (const [key, value] of Object.entries(updates)) {
        if (key in uniforms && uniforms[key as keyof TunnelUniforms]) {
            const uniform = uniforms[key as keyof TunnelUniforms];
            if (typeof value === 'function') {
                uniform.value = value(uniform.value as any);
            } else {
                uniform.value = value;
            }
        }
    }
}