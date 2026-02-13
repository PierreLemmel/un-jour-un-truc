import './style.css'
import { resizeGraphics, setupGraphics, updateGraphics, updateUniforms as updateGraphicsUniforms, type UpdateUniforms } from './graphics';
import { setupTracking, type TrackingResult, updateCalibrationAngle, updateCalibrationEyesHeight, updateCalibrationPoint } from './tracking';

function getQueryParam(name: string): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) === 'true';
}

const showControls = getQueryParam('controls');
const showWebcam = getQueryParam('webcam');
const showDebug = getQueryParam('debug');
const showCalibrationOnLoad = getQueryParam('calibration') || getQueryParam('calibrate');

const app = document.getElementById("app") as HTMLDivElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const controls = document.getElementById("controls") as HTMLDivElement;
const webcam = document.getElementById("webcam") as HTMLVideoElement;
const debugPanel = document.getElementById("debug-panel") as HTMLDivElement;
const calibrationPanel = document.getElementById("calibration-panel") as HTMLDivElement;

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
const blinkLevelSlider = document.getElementById("slider-blink-level") as HTMLInputElement;
const blinkColorPicker = document.getElementById("color-picker-blink") as HTMLInputElement;
const blinkMaxSlider = document.getElementById("slider-blink-max") as HTMLInputElement;
const resetButton = document.getElementById("reset-button") as HTMLButtonElement;
const showCalibrationButton = document.getElementById("show-calibration-button") as HTMLButtonElement;
const saveSettingsButton = document.getElementById("save-settings-button") as HTMLButtonElement;
const calibrateTopLeftButton = document.getElementById("calibrate-top-left") as HTMLButtonElement;
const calibrateTopRightButton = document.getElementById("calibrate-top-right") as HTMLButtonElement;
const calibrateBottomLeftButton = document.getElementById("calibrate-bottom-left") as HTMLButtonElement;
const calibrateBottomRightButton = document.getElementById("calibrate-bottom-right") as HTMLButtonElement;
const calibrateMiddleTopButton = document.getElementById("calibrate-middle-top") as HTMLButtonElement;
const calibrateMiddleRightButton = document.getElementById("calibrate-middle-right") as HTMLButtonElement;
const calibrateMiddleBottomButton = document.getElementById("calibrate-middle-bottom") as HTMLButtonElement;
const calibrateMiddleLeftButton = document.getElementById("calibrate-middle-left") as HTMLButtonElement;
const calibrateEyesHeightButton = document.getElementById("calibrate-eyes-height") as HTMLButtonElement;
const calibrationButtonOk = document.getElementById("calibration-button-ok") as HTMLButtonElement;

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
    blinkLevel: number;
    blinkColor: string;
    blinkMax: number;
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
        blinkLevel: parseFloat(blinkLevelSlider.value),
        blinkColor: blinkColorPicker.value,
        blinkMax: parseFloat(blinkMaxSlider.value),
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

function updateDebugPanel(data: Record<string, string | number>) {
    if (!showDebug) return;
    
    debugPanel.innerHTML = '';
    for (const [key, value] of Object.entries(data)) {
        const row = document.createElement('div');
        row.className = 'flex flex-row gap-2';
        const label = document.createElement('span');
        label.className = 'font-mono text-xs';
        label.textContent = `${key}:`;
        const valueSpan = document.createElement('span');
        valueSpan.className = 'font-mono text-xs';
        valueSpan.textContent = typeof value === 'number' ? value.toFixed(3) : value.toString();
        row.appendChild(label);
        row.appendChild(valueSpan);
        debugPanel.appendChild(row);
    }
}

function onTrackingResult(result: TrackingResult) {
    updateUniforms({
        uBlinkLevel: result.blinkLevel,
        uLeavingPoint: [result.eyePosition.x, result.eyePosition.y],
    });

    if (showDebug) {
        updateDebugPanel({
            'Blink Level': result.blinkLevel,
            'Eye X': result.eyePosition.x,
            'Eye Y': result.eyePosition.y,
        });
    }
}

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
    speed: -380,
    width: 200,
    smoothIn: 1.0,
    smoothOut: 0,
    segments: 6,
    offsetAngle: 0,
    balance: 0.85,
    fadeRadius: 0.3,
    fadeStrength: 0.88,
    color1: '#ff66ff',
    color2: '#0066ff',
    blinkLevel: 0,
    blinkColor: '#ffffff',
    blinkMax: 0.92,
};

function updateUniforms(updates: UpdateUniforms) {
    updateGraphicsUniforms(updates);
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
    blinkLevelSlider.value = DEFAULT_SETTINGS.blinkLevel.toString();
    blinkColorPicker.value = DEFAULT_SETTINGS.blinkColor;
    blinkMaxSlider.value = DEFAULT_SETTINGS.blinkMax.toString();

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
        uBlinkLevel: DEFAULT_SETTINGS.blinkLevel,
        uBlinkColor: hexToVec4(DEFAULT_SETTINGS.blinkColor),
        uBlinkMax: DEFAULT_SETTINGS.blinkMax,
    });

    localStorage.removeItem(STORAGE_KEY);
}

function setupUserInputs() {
    // canvas.addEventListener("mousemove", (event) => {
    //     const { clientX, clientY } = event;
    //     const { width, height } = canvas.getBoundingClientRect();
    //     const x = clientX / width;
    //     const y = clientY / height;
    //     updateUniforms({ uLeavingPoint: [x, 1.0 - y] });
    // });
}

function setupUserInterface() {
    function openCalibrationPanel() {
        calibrationPanel.classList.remove("hidden");
        calibrationPanel.classList.add("flex");
    }

    function closeCalibrationPanel() {
        calibrationPanel.classList.add("hidden");
        calibrationPanel.classList.remove("flex");
    }

    speedSlider.addEventListener("input", () => {
        const value = parseFloat(speedSlider.value);
        updateUniforms({ uSpeed: value });
    });

    widthSlider.addEventListener("input", () => {
        const value = parseFloat(widthSlider.value);
        updateUniforms({ uWidth: value });
    });


    smoothInSlider.addEventListener("input", () => {
        const value = parseFloat(smoothInSlider.value);
        updateUniforms({ uSmoothIn: value });
    });

    smoothOutSlider.addEventListener("input", () => {
        const value = parseFloat(smoothOutSlider.value);
        updateUniforms({ uSmoothOut: value });
    });

    segmentsSlider.addEventListener("input", () => {
        const value = parseFloat(segmentsSlider.value);
        updateUniforms({ uSegments: value });
    });

    offsetAngleSlider.addEventListener("input", () => {
        const value = parseFloat(offsetAngleSlider.value);
        updateUniforms({ uOffsetAngle: value });
    });

    balanceSlider.addEventListener("input", () => {
        const value = parseFloat(balanceSlider.value);
        updateUniforms({ uBalance: value });
    });

    fadeRadiusSlider.addEventListener("input", () => {
        const value = parseFloat(fadeRadiusSlider.value);
        updateUniforms({ uFadeRadius: value });
    });

    fadeStrengthSlider.addEventListener("input", () => {
        const value = parseFloat(fadeStrengthSlider.value);
        updateUniforms({ uFadeStrength: value });
    });

    colorPicker1.addEventListener("input", () => {
        const color = hexToVec4(colorPicker1.value);
        updateUniforms({ uColor1: color });
    });

    colorPicker2.addEventListener("input", () => {
        const color = hexToVec4(colorPicker2.value);
        updateUniforms({ uColor2: color });
    });

    blinkLevelSlider.addEventListener("input", () => {
        const value = parseFloat(blinkLevelSlider.value);
        updateUniforms({ uBlinkLevel: value });
    });

    blinkColorPicker.addEventListener("input", () => {
        const color = hexToVec4(blinkColorPicker.value);
        updateUniforms({ uBlinkColor: color });
    });

    blinkMaxSlider.addEventListener("input", () => {
        const value = parseFloat(blinkMaxSlider.value);
        updateUniforms({ uBlinkMax: value });
    });

    resetButton.addEventListener("click", () => {
        resetToDefaults();
    });

    saveSettingsButton.addEventListener("click", () => {
        saveSettings();
    });

    showCalibrationButton.addEventListener("click", () => {
        openCalibrationPanel();
    });

    calibrateTopLeftButton.addEventListener("click", () => updateCalibrationPoint("TopLeft"));
    calibrateTopRightButton.addEventListener("click", () => updateCalibrationPoint("TopRight"));
    calibrateBottomLeftButton.addEventListener("click", () => updateCalibrationPoint("BottomLeft"));
    calibrateBottomRightButton.addEventListener("click", () => updateCalibrationPoint("BottomRight"));

    calibrateMiddleTopButton.addEventListener("click", () => updateCalibrationAngle("tiltToUp"));
    calibrateMiddleRightButton.addEventListener("click", () => updateCalibrationAngle("panToRight"));
    calibrateMiddleBottomButton.addEventListener("click", () => updateCalibrationAngle("tiltToDown"));
    calibrateMiddleLeftButton.addEventListener("click", () => updateCalibrationAngle("panToLeft"));

    calibrateEyesHeightButton.addEventListener("click", () => updateCalibrationEyesHeight());

    calibrationButtonOk.addEventListener("click", () => {
        closeCalibrationPanel();
    });

    if (showCalibrationOnLoad) {
        openCalibrationPanel();
    }

    if (showControls) {
        controls.classList.remove("hidden");
        controls.classList.add("flex");
    }
    else {
        controls.classList.add("hidden");
        controls.classList.remove("flex");
    }

    if (showWebcam) {
        webcam.classList.remove("hidden");
    }
    else {
        webcam.classList.add("hidden");
    }

    if (showDebug) {
        debugPanel.classList.remove("hidden");
        debugPanel.classList.add("flex");
    }
    else {
        debugPanel.classList.add("hidden");
        debugPanel.classList.remove("flex");
    }

    new ResizeObserver((entries) => {
        for (const entry of entries) {
            const { width, height } = entry.contentRect;
            onResize(width, height);
        }
    }).observe(app);
}

function initializeSettings() {
    const savedSettings = loadSettings();
    updateUniforms({
        uSpeed: savedSettings.speed,
        uWidth: savedSettings.width,
        uSmoothIn: savedSettings.smoothIn,
        uSmoothOut: savedSettings.smoothOut,
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
        blinkLevelSlider.value = savedSettings.blinkLevel.toString();
        blinkColorPicker.value = savedSettings.blinkColor;
        blinkMaxSlider.value = savedSettings.blinkMax.toString();
    
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
            uBlinkLevel: savedSettings.blinkLevel,
            uBlinkColor: hexToVec4(savedSettings.blinkColor),
            uBlinkMax: savedSettings.blinkMax,
        });
    }
    else {
        if (canvas.shaderUniforms) {
            const uniforms = canvas.shaderUniforms;
            if (uniforms.uColor1) {
                colorPicker1.value = vec4ToHex(uniforms.uColor1.value as [number, number, number, number]);
            }
            if (uniforms.uColor2) {
                colorPicker2.value = vec4ToHex(uniforms.uColor2.value as [number, number, number, number]);
            }
            if (uniforms.uBlinkColor) {
                blinkColorPicker.value = vec4ToHex(uniforms.uBlinkColor.value as [number, number, number, number]);
            }
        }
    }
}


function onResize(width: number, height: number) {
    resizeGraphics(width, height);
}


function startRenderLoop() {
    function animate() {

        updateGraphics();
        requestAnimationFrame(animate);
    }
    
    animate();
}


setupGraphics(canvas);
setupTracking(webcam, onTrackingResult);

setupUserInputs();
setupUserInterface();

initializeSettings();

startRenderLoop();
