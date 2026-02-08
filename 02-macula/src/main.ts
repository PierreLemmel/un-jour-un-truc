import './style.css'
import { getUniforms, resizeGraphics, setupGraphics, updateGraphics, updateUniforms as updateGraphicsUniforms, type UpdateUniforms } from './graphics';

const showDebug = import.meta.env.VITE_SHOW_DEBUG !== "false";
const showControls = import.meta.env.VITE_SHOW_CONTROLS !== "false";

const app = document.getElementById("app") as HTMLDivElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const debugInfo = document.getElementById("debug-info") as HTMLDivElement;
const controls = document.getElementById("controls") as HTMLDivElement;

interface Settings {
    speed: number;
    width: number;
    smoothIn: number;
    smoothOut: number;
    segments: number;
    offsetAngle: number;
    balance: number;
    fadeRadius: number;
    fadeStrength: number;
    color1: string;
    color2: string;
}

const STORAGE_KEY = 'macula-settings';

function saveSettings(): void {
    const settings: Settings = {
        speed: parseFloat(speedSlider.value),
        width: parseFloat(widthSlider.value),
        smoothIn: parseFloat(smoothInSlider.value),
        smoothOut: parseFloat(smoothOutSlider.value),
        segments: parseFloat(segmentsSlider.value),
        offsetAngle: parseFloat(offsetAngleSlider.value),
        balance: parseFloat(balanceSlider.value),
        fadeRadius: parseFloat(fadeRadiusSlider.value),
        fadeStrength: parseFloat(fadeStrengthSlider.value),
        color1: colorPicker1.value,
        color2: colorPicker2.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function loadSettings(): Settings {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(stored) as Partial<Settings>;
    return {
        ...DEFAULT_SETTINGS,
        ...parsed,
    };
}

setupGraphics(canvas);

const speedSlider = document.getElementById("slider-speed") as HTMLInputElement;
const widthSlider = document.getElementById("slider-width") as HTMLInputElement;
const smoothInSlider = document.getElementById("slider-smooth-in") as HTMLInputElement;
const smoothOutSlider = document.getElementById("slider-smooth-out") as HTMLInputElement;
const segmentsSlider = document.getElementById("slider-segments") as HTMLInputElement;
const offsetAngleSlider = document.getElementById("slider-offset-angle") as HTMLInputElement;
const balanceSlider = document.getElementById("slider-balance") as HTMLInputElement;
const fadeRadiusSlider = document.getElementById("slider-fade-radius") as HTMLInputElement;
const fadeStrengthSlider = document.getElementById("slider-fade-strength") as HTMLInputElement;
const colorPicker1 = document.getElementById("color-picker-1") as HTMLInputElement;
const colorPicker2 = document.getElementById("color-picker-2") as HTMLInputElement;
const resetButton = document.getElementById("reset-button") as HTMLButtonElement;

function hexToVec4(hex: string): [number, number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, 1];
}

function vec4ToHex(vec4: [number, number, number, number]): string {
    const r = Math.round(vec4[0] * 255).toString(16).padStart(2, '0');
    const g = Math.round(vec4[1] * 255).toString(16).padStart(2, '0');
    const b = Math.round(vec4[2] * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

const DEFAULT_SETTINGS: Settings = {
    speed: -350,
    width: 200,
    smoothIn: 1.0,
    smoothOut: 0,
    segments: 6,
    offsetAngle: 0,
    balance: 0.85,
    fadeRadius: 0.3,
    fadeStrength: 1,
    color1: '#ff66ff',
    color2: '#0066ff',
};

function updateUniforms(updates: UpdateUniforms) {
    updateGraphicsUniforms(updates);
    if (showDebug) {
        const lines = Object.entries(getUniforms())
            .filter(([key]) => !(key === 'uTime'))//, || key === 'uResolution'))
            .map(([key, value]) => `${key}: ${value}`);
        setDebug(...lines);
    }
}

function resetToDefaults(): void {
    speedSlider.value = DEFAULT_SETTINGS.speed.toString();
    widthSlider.value = DEFAULT_SETTINGS.width.toString();
    smoothInSlider.value = DEFAULT_SETTINGS.smoothIn.toString();
    smoothOutSlider.value = DEFAULT_SETTINGS.smoothOut.toString();
    segmentsSlider.value = DEFAULT_SETTINGS.segments.toString();
    offsetAngleSlider.value = DEFAULT_SETTINGS.offsetAngle.toString();
    balanceSlider.value = DEFAULT_SETTINGS.balance.toString();
    fadeRadiusSlider.value = DEFAULT_SETTINGS.fadeRadius.toString();
    fadeStrengthSlider.value = DEFAULT_SETTINGS.fadeStrength.toString();
    colorPicker1.value = DEFAULT_SETTINGS.color1;
    colorPicker2.value = DEFAULT_SETTINGS.color2;

    updateUniforms({
        uLeavingPoint: [0.5, 0.5],
        uSpeed: DEFAULT_SETTINGS.speed,
        uWidth: DEFAULT_SETTINGS.width,
        uSmoothIn: DEFAULT_SETTINGS.smoothIn,
        uSmoothOut: DEFAULT_SETTINGS.smoothOut,
        uSegments: DEFAULT_SETTINGS.segments,
        uOffsetAngle: DEFAULT_SETTINGS.offsetAngle,
        uBalance: DEFAULT_SETTINGS.balance,
        uFadeRadius: DEFAULT_SETTINGS.fadeRadius,
        uFadeStrength: DEFAULT_SETTINGS.fadeStrength,
        uColor1: hexToVec4(DEFAULT_SETTINGS.color1),
        uColor2: hexToVec4(DEFAULT_SETTINGS.color2),
    });

    localStorage.removeItem(STORAGE_KEY);
}

canvas.addEventListener("mousemove", (event) => {
    const { clientX, clientY } = event;
    const { width, height } = canvas.getBoundingClientRect();
    const x = clientX / width;
    const y = clientY / height;
    updateUniforms({ uLeavingPoint: [x, 1.0 - y] });
    saveSettings();
});

speedSlider.addEventListener("input", () => {
    const value = parseFloat(speedSlider.value);
    updateUniforms({ uSpeed: value });
    saveSettings();
});

widthSlider.addEventListener("input", () => {
    const value = parseFloat(widthSlider.value);
    updateUniforms({ uWidth: value });
    saveSettings();
});


smoothInSlider.addEventListener("input", () => {
    const value = parseFloat(smoothInSlider.value);
    updateUniforms({ uSmoothIn: value });
    saveSettings();
});

smoothOutSlider.addEventListener("input", () => {
    const value = parseFloat(smoothOutSlider.value);
    updateUniforms({ uSmoothOut: value });
    saveSettings();
});

segmentsSlider.addEventListener("input", () => {
    const value = parseFloat(segmentsSlider.value);
    updateUniforms({ uSegments: value });
    saveSettings();
});

offsetAngleSlider.addEventListener("input", () => {
    const value = parseFloat(offsetAngleSlider.value);
    updateUniforms({ uOffsetAngle: value });
    saveSettings();
});

balanceSlider.addEventListener("input", () => {
    const value = parseFloat(balanceSlider.value);
    updateUniforms({ uBalance: value });
    saveSettings();
});

fadeRadiusSlider.addEventListener("input", () => {
    const value = parseFloat(fadeRadiusSlider.value);
    updateUniforms({ uFadeRadius: value });
    saveSettings();
});

fadeStrengthSlider.addEventListener("input", () => {
    const value = parseFloat(fadeStrengthSlider.value);
    updateUniforms({ uFadeStrength: value });
    saveSettings();
});

const savedSettings = loadSettings();
updateUniforms({
    uSpeed: savedSettings.speed,
    uWidth: savedSettings.width,
    uSmoothIn: savedSettings.smoothIn,
    uSmoothOut: savedSettings.smoothOut,
    uSegments: savedSettings.segments,
    uOffsetAngle: savedSettings.offsetAngle,
    uBalance: savedSettings.balance,
    uFadeRadius: savedSettings.fadeRadius,
    uFadeStrength: savedSettings.fadeStrength,
    uColor1: hexToVec4(savedSettings.color1),
    uColor2: hexToVec4(savedSettings.color2),
});

if (savedSettings) {
    speedSlider.value = savedSettings.speed.toString();
    widthSlider.value = savedSettings.width.toString();

    smoothInSlider.value = savedSettings.smoothIn.toString();
    smoothOutSlider.value = savedSettings.smoothOut.toString();
    segmentsSlider.value = savedSettings.segments.toString();
    offsetAngleSlider.value = savedSettings.offsetAngle.toString();
    balanceSlider.value = savedSettings.balance.toString();
    fadeRadiusSlider.value = savedSettings.fadeRadius.toString();
    fadeStrengthSlider.value = savedSettings.fadeStrength.toString();

    colorPicker1.value = savedSettings.color1;
    colorPicker2.value = savedSettings.color2;

    updateUniforms({
        uSpeed: savedSettings.speed,
        uWidth: savedSettings.width,
        uSmoothIn: savedSettings.smoothIn,
        uSmoothOut: savedSettings.smoothOut,
        uSegments: savedSettings.segments,
        uOffsetAngle: savedSettings.offsetAngle,
        uBalance: savedSettings.balance,
        uFadeRadius: savedSettings.fadeRadius,
        uFadeStrength: savedSettings.fadeStrength,
        uColor1: hexToVec4(savedSettings.color1),
        uColor2: hexToVec4(savedSettings.color2),
    });
} else {
    if (canvas.shaderUniforms) {
        const uniforms = canvas.shaderUniforms;
        if (uniforms.uColor1) {
            colorPicker1.value = vec4ToHex(uniforms.uColor1.value as [number, number, number, number]);
        }
        if (uniforms.uColor2) {
            colorPicker2.value = vec4ToHex(uniforms.uColor2.value as [number, number, number, number]);
        }
    }
}

colorPicker1.addEventListener("input", () => {
    const color = hexToVec4(colorPicker1.value);
    updateUniforms({ uColor1: color });
    saveSettings();
});

colorPicker2.addEventListener("input", () => {
    const color = hexToVec4(colorPicker2.value);
    updateUniforms({ uColor2: color });
    saveSettings();
});

resetButton.addEventListener("click", () => {
    resetToDefaults();
});

function setDebug(...lines: string[]) {
    debugInfo.innerHTML = "";
    lines.forEach(line => {
        const div = document.createElement("div");
        div.textContent = line;
        debugInfo.appendChild(div);
    });
}

if (showDebug) {
    debugInfo.classList.remove("hidden");
    debugInfo.classList.add("flex");
}
else {
    debugInfo.classList.add("hidden");
    debugInfo.classList.remove("flex");
}

if (showControls) {
    controls.classList.remove("hidden");
    controls.classList.add("flex");
}
else {
    controls.classList.add("hidden");
    controls.classList.remove("flex");
}


function onResize(width: number, height: number) {
    resizeGraphics(width, height);
}



new ResizeObserver((entries) => {
    for (const entry of entries) {
        const { width, height } = entry.contentRect;
        onResize(width, height);
    }
}).observe(app);

function animate() {

    updateGraphics();
    requestAnimationFrame(animate);
}

animate();