import './style.css';
import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { clamp, moveTowards, percentage, quadraticInterpolation, scoreCalculation } from './utils';
import * as Tone from "tone";


const video = document.getElementById("webcam") as HTMLVideoElement;

let faceLandmarker: FaceLandmarker;
let lastVideoTime = -1;

async function init() {
	const vision = await FilesetResolver.forVisionTasks(
		"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
	);

	faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
		baseOptions: {
			modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
			delegate: "GPU"
		},
		outputFaceBlendshapes: true,
		runningMode: "VIDEO"
	});

  	startWebcam();
}

async function startWebcam() {
	const stream = await navigator.mediaDevices.getUserMedia({ video: true });
	video.srcObject = stream;
	video.addEventListener("loadeddata", () => {
		detectionLoop();
		videoLoop();
	});
}

function detectionLoop() {
	if (video.currentTime !== lastVideoTime) {
		lastVideoTime = video.currentTime;
		const result = faceLandmarker.detectForVideo(video, performance.now());

		if (result.faceBlendshapes && result.faceBlendshapes[0]) {
			updateTarget(result);
		}
	}
	requestAnimationFrame(detectionLoop);
}

function videoLoop() {
	updateContent();
	requestAnimationFrame(videoLoop);
}

const showDebug = import.meta.env.VITE_SHOW_DEBUG !== "false";

const flower = document.getElementById("flower") as HTMLVideoElement;

const mouthPuckerValue = document.getElementById("mouth-pucker-value") as HTMLDivElement;
const jawOpenValue = document.getElementById("jaw-open-value") as HTMLDivElement;
const scoreValue = document.getElementById("score-value") as HTMLDivElement;
const detectionFpsValue = document.getElementById("detection-fps") as HTMLDivElement;
const contentFpsValue = document.getElementById("content-fps") as HTMLDivElement;

let playerLpf: Tone.Filter;
let player: Tone.Player;
let hum: Tone.Oscillator;
let humLpf: Tone.Filter;
async function startSynth() {
	await Tone.start();
	
	playerLpf = new Tone.Filter({
		frequency: 200,
		type: "lowpass",
		rolloff: -24,
		Q: 1,
	}).toDestination();

	player = new Tone.Player({
		url: "shout.mp3",
		autostart: true,
		loop: true
	}).connect(playerLpf);


	humLpf = new Tone.Filter({
		frequency: 400,
		type: "lowpass",
		rolloff: -24,
		Q: 1,
	}).toDestination();
	
	hum = new Tone.Oscillator({
		frequency: 110,
		type: "triangle",
		volume: -100
	}).connect(humLpf);
	
	const vibrato = new Tone.LFO({
		frequency: 4,
		min: 108,
		max: 112
	}).connect(hum.frequency);
	
	hum.start();
	vibrato.start();
}



startSynth();

let detectionFps = 0;
let detectionFpsCounter = 0;
let detectionFpsLastSecond = 0;

let contentFps = 0;
let contentFpsCounter = 0;
let contentFpsLastSecond = 0;

if (!showDebug) {
	document.getElementById("debug-info")?.classList.add("hidden");
}

let currentScore = 0;
let targetScore = 0;

function updateTarget(result: FaceLandmarkerResult) {
	if (result.faceBlendshapes.length === 0) {
		return;
	}

	const { categories } = result.faceBlendshapes[0];

	const jawOpen = categories[25].score;
	const mouthPucker = categories[38].score;

	targetScore = scoreCalculation(jawOpen, mouthPucker);

	if (showDebug) {
		jawOpenValue.textContent = `Jaw open: ${percentage(jawOpen)}`;
		mouthPuckerValue.textContent = `Mouth pucker: ${percentage(mouthPucker)}`;
		scoreValue.textContent = `Score: ${percentage(targetScore)}`;
		detectionFpsValue.textContent = `Detection FPS: ${detectionFps}`;
		contentFpsValue.textContent = `Content FPS: ${contentFps}`;
	}

	detectionFpsCounter++;
	const currentSecond = Math.floor(performance.now() / 1000);
	if (currentSecond !== detectionFpsLastSecond) {
		detectionFpsLastSecond = currentSecond;
		detectionFps = detectionFpsCounter;
		detectionFpsCounter = 0;
	}
}

const maxSpeed = 0.25;

let lastTime = 0;

const offsetAmplitude = 0.08;
const offsetSpeed = 40;
function updateContent() {

	const currentTime = performance.now();
	const deltaTime = currentTime - lastTime;
	lastTime = currentTime;

	const maxDelta = maxSpeed * deltaTime;

	currentScore = moveTowards(currentScore, targetScore, maxDelta);

	const videoProgress = clamp(currentScore + offsetAmplitude * (Math.sin(offsetSpeed * currentTime / 1000) - 1) / 2, 0, 1);
	flower.currentTime = videoProgress * flower.duration;

	player.volume.value = Math.min(0, -60 + currentScore * 150);
	playerLpf.frequency.value = quadraticInterpolation(currentScore, 200, 6000);

	hum.volume.value = Math.min(-15, -50 + currentScore * 120);

	contentFpsCounter++;
	const currentSecond = Math.floor(performance.now() / 1000);
	if (currentSecond !== contentFpsLastSecond) {
		contentFpsLastSecond = currentSecond;
		contentFps = contentFpsCounter;
		contentFpsCounter = 0;
	}
}

init();