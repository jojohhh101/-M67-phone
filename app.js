import * as THREE from "three";

/* ------------------------------------------------------------------
   Page-level details that should work even without WebGL
   ------------------------------------------------------------------ */

document.documentElement.classList.add("js");

const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let reduceMotion = reduceMotionQuery.matches;
reduceMotionQuery.addEventListener?.("change", (event) => {
  reduceMotion = event.matches;
});

const formatClock = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const formatDate = () => {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日 星期${"日一二三四五六"[d.getDay()]}`;
};
let neuralSync = 98.4;

/* Reservation dialog ------------------------------------------------ */

const reserveDialog = document.getElementById("reserve-dialog");
const reserveForm = document.getElementById("reserve-form");
const reserveEmail = document.getElementById("reserve-email");
const reserveError = document.getElementById("reserve-error");

document.querySelectorAll("[data-reserve]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!reserveDialog || reserveDialog.open) return;
    reserveDialog.showModal();
    window.setTimeout(() => reserveEmail?.focus(), 60);
  });
});

document.querySelector("[data-close-dialog]")?.addEventListener("click", () => {
  reserveDialog?.close();
});

reserveDialog?.addEventListener("click", (event) => {
  if (event.target === reserveDialog) reserveDialog.close();
});

reserveForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const valid = reserveEmail?.value.trim() && reserveEmail.checkValidity();
  if (!valid) {
    if (reserveError) reserveError.hidden = false;
    reserveEmail?.focus();
    return;
  }
  if (reserveError) reserveError.hidden = true;

  const success = document.createElement("div");
  success.className = "reserve-success";
  success.innerHTML = "<strong>已登记。</strong><p>发布当日，我们会优先把 M67 的体验邀请发到你的邮箱。</p>";

  // Hide the form instead of replacing it. Replacing it left the dialog with
  // no form at all, so a second click on 预约 showed the old confirmation.
  reserveForm.hidden = true;
  reserveForm.after(success);
  reserveDialog?.addEventListener(
    "close",
    () => {
      success.remove();
      reserveForm.hidden = false;
      reserveForm.reset();
    },
    { once: true }
  );
  window.setTimeout(() => reserveDialog?.close(), 1800);
});

reserveEmail?.addEventListener("input", () => {
  if (reserveError && !reserveError.hidden) reserveError.hidden = true;
});

/* Scroll reveals ---------------------------------------------------- */

const revealItems = Array.from(document.querySelectorAll(".reveal"));

if (!("IntersectionObserver" in window) || reduceMotion) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -7% 0px" }
  );
  revealItems.forEach((item) => revealObserver.observe(item));
}

/* ------------------------------------------------------------------
   Screen artwork
   ------------------------------------------------------------------ */

let noisePatternCanvas = null;

function getNoisePattern() {
  if (noisePatternCanvas) return noisePatternCanvas;
  const canvas = document.createElement("canvas");
  canvas.width = 220;
  canvas.height = 220;
  const context = canvas.getContext("2d");
  const image = context.createImageData(canvas.width, canvas.height);
  let seed = 4421;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = 0; index < image.data.length; index += 4) {
    const value = 118 + Math.floor(random() * 110);
    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = Math.floor(random() * 26);
  }
  context.putImageData(image, 0, 0);
  noisePatternCanvas = canvas;
  return canvas;
}

function drawStatusIcons(context, width, scale) {
  const y = 78 * scale;
  const right = width - 46 * scale;
  context.save();
  context.strokeStyle = "rgba(248, 251, 248, 0.78)";
  context.fillStyle = "rgba(248, 251, 248, 0.78)";
  context.lineWidth = 2.2 * scale;
  context.lineCap = "round";

  // signal
  [6, 10, 14, 18].forEach((height, index) => {
    const x = right - 130 * scale + index * 9 * scale;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x, y - height * scale);
    context.stroke();
  });

  // wifi
  context.beginPath();
  context.arc(right - 74 * scale, y + 1 * scale, 16 * scale, Math.PI * 1.18, Math.PI * 1.82);
  context.stroke();
  context.beginPath();
  context.arc(right - 74 * scale, y + 1 * scale, 9 * scale, Math.PI * 1.2, Math.PI * 1.8);
  context.stroke();
  context.beginPath();
  context.arc(right - 74 * scale, y - 1 * scale, 2.3 * scale, 0, Math.PI * 2);
  context.fill();

  // battery
  context.lineWidth = 1.8 * scale;
  context.beginPath();
  context.roundRect(right - 38 * scale, y - 17 * scale, 34 * scale, 18 * scale, 4 * scale);
  context.stroke();
  context.fillRect(right - 33 * scale, y - 13 * scale, 21 * scale, 10 * scale);
  context.beginPath();
  context.roundRect(right - 1 * scale, y - 11 * scale, 3 * scale, 7 * scale, 1 * scale);
  context.fill();

  context.restore();
}

function drawWallpaper(canvas, timeStr = formatClock(), dateStr = formatDate()) {
  const width = canvas.width;
  const height = canvas.height;
  const scale = width / 900;
  const context = canvas.getContext("2d");

  context.clearRect(0, 0, width, height);

  const base = context.createLinearGradient(0, 0, width * 0.35, height);
  base.addColorStop(0, "#04060a");
  base.addColorStop(0.44, "#071018");
  base.addColorStop(1, "#030509");
  context.fillStyle = base;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalCompositeOperation = "screen";

  const glow = (x, y, radius, inner, outer = "rgba(0,0,0,0)") => {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(0.55, inner.replace(/[\d.]+\)$/, "0.12)"));
    gradient.addColorStop(1, outer);
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };

  glow(width * 0.18, height * 0.22, width * 0.72, "rgba(33, 61, 255, 0.62)");
  glow(width * 0.88, height * 0.18, width * 0.52, "rgba(85, 255, 221, 0.28)");
  glow(width * 0.72, height * 0.8, width * 0.66, "rgba(104, 64, 255, 0.36)");
  glow(width * 0.14, height * 0.83, width * 0.46, "rgba(21, 184, 166, 0.18)");
  context.restore();

  // A blurred band of liquid light crossing the display.
  context.save();
  const band = context.createLinearGradient(0, height * 0.34, width, height * 0.66);
  band.addColorStop(0, "rgba(82, 255, 226, 0)");
  band.addColorStop(0.24, "rgba(82, 255, 226, 0.52)");
  band.addColorStop(0.58, "rgba(100, 137, 255, 0.42)");
  band.addColorStop(1, "rgba(137, 87, 255, 0)");
  context.strokeStyle = band;
  context.lineWidth = width * 0.11;
  context.filter = `blur(${34 * scale}px)`;
  context.beginPath();
  context.moveTo(-width * 0.18, height * 0.62);
  context.bezierCurveTo(width * 0.25, height * 0.42, width * 0.42, height * 0.72, width * 0.7, height * 0.57);
  context.bezierCurveTo(width * 0.9, height * 0.47, width * 1.02, height * 0.5, width * 1.16, height * 0.43);
  context.stroke();
  context.restore();

  // Chrome sphere.
  const sphereX = width * 0.665;
  const sphereY = height * 0.465;
  const sphereRadius = width * 0.292;

  context.save();
  const sphereGlow = context.createRadialGradient(
    sphereX,
    sphereY,
    sphereRadius * 0.72,
    sphereX,
    sphereY,
    sphereRadius * 1.5
  );
  sphereGlow.addColorStop(0, "rgba(2, 7, 10, 0.82)");
  sphereGlow.addColorStop(0.6, "rgba(3, 9, 13, 0.3)");
  sphereGlow.addColorStop(1, "rgba(3, 9, 13, 0)");
  context.fillStyle = sphereGlow;
  context.beginPath();
  context.arc(sphereX, sphereY, sphereRadius * 1.5, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.beginPath();
  context.arc(sphereX, sphereY, sphereRadius, 0, Math.PI * 2);
  context.clip();

  const chrome = context.createRadialGradient(
    sphereX - sphereRadius * 0.4,
    sphereY - sphereRadius * 0.48,
    sphereRadius * 0.04,
    sphereX,
    sphereY,
    sphereRadius
  );
  chrome.addColorStop(0, "rgba(249, 255, 251, 0.99)");
  chrome.addColorStop(0.09, "rgba(199, 230, 226, 0.99)");
  chrome.addColorStop(0.2, "rgba(103, 143, 148, 0.98)");
  chrome.addColorStop(0.34, "rgba(23, 49, 58, 0.99)");
  chrome.addColorStop(0.52, "rgba(5, 14, 19, 1)");
  chrome.addColorStop(0.67, "rgba(2, 5, 8, 1)");
  chrome.addColorStop(0.82, "rgba(43, 81, 88, 0.7)");
  chrome.addColorStop(0.94, "rgba(137, 184, 183, 0.4)");
  chrome.addColorStop(1, "rgba(3, 7, 10, 1)");
  context.fillStyle = chrome;
  context.fillRect(sphereX - sphereRadius, sphereY - sphereRadius, sphereRadius * 2, sphereRadius * 2);

  const reflectedSky = context.createLinearGradient(
    sphereX,
    sphereY - sphereRadius * 0.7,
    sphereX,
    sphereY + sphereRadius * 0.2
  );
  reflectedSky.addColorStop(0, "rgba(176, 255, 239, 0.23)");
  reflectedSky.addColorStop(0.52, "rgba(58, 104, 255, 0.14)");
  reflectedSky.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = reflectedSky;
  context.fillRect(sphereX - sphereRadius, sphereY - sphereRadius, sphereRadius * 2, sphereRadius);

  context.strokeStyle = "rgba(186, 255, 242, 0.52)";
  context.lineWidth = 1.6 * scale;
  context.beginPath();
  context.arc(sphereX, sphereY, sphereRadius * 0.92, Math.PI * 0.92, Math.PI * 1.54);
  context.stroke();

  context.fillStyle = "rgba(255, 255, 255, 0.96)";
  context.beginPath();
  context.ellipse(
    sphereX - sphereRadius * 0.34,
    sphereY - sphereRadius * 0.44,
    sphereRadius * 0.19,
    sphereRadius * 0.1,
    -0.55,
    0,
    Math.PI * 2
  );
  context.fill();
  context.restore();
  context.restore();

  // Orbital interface ring around the chrome core.
  context.save();
  context.translate(sphereX, sphereY);
  context.rotate(-0.16);
  context.strokeStyle = "rgba(126, 255, 230, 0.2)";
  context.lineWidth = 1 * scale;
  context.setLineDash([1.4 * scale, 7 * scale]);
  context.beginPath();
  context.arc(0, 0, sphereRadius * 1.19, Math.PI * 0.58, Math.PI * 2.1);
  context.stroke();
  context.setLineDash([]);
  context.strokeStyle = "rgba(126, 255, 230, 0.3)";
  for (let index = 0; index < 24; index += 1) {
    const angle = Math.PI * 0.64 + (index / 23) * Math.PI * 1.36;
    const inner = sphereRadius * 1.17;
    const outer = sphereRadius * (index % 4 === 0 ? 1.235 : 1.205);
    context.beginPath();
    context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    context.stroke();
  }
  context.rotate(0.16);
  context.fillStyle = "rgba(174, 255, 239, 0.44)";
  context.font = `400 ${10 * scale}px "Source Code Pro", monospace`;
  context.letterSpacing = `${2 * scale}px`;
  context.fillText(`NEURAL CORE / ${neuralSync.toFixed(1)}`, -sphereRadius * 0.78, sphereRadius * 1.27);
  context.fillStyle = "rgba(174, 255, 239, 0.24)";
  context.font = `400 ${7.5 * scale}px "Source Code Pro", monospace`;
  context.fillText("M67 · UDC ACTIVE", sphereRadius * 0.18, -sphereRadius * 1.18);
  context.restore();

  // Fine light ribbon over the lower third.
  context.save();
  const line = context.createLinearGradient(width * 0.18, 0, width * 0.86, 0);
  line.addColorStop(0, "rgba(104, 255, 228, 0)");
  line.addColorStop(0.42, "rgba(127, 255, 230, 0.6)");
  line.addColorStop(1, "rgba(123, 104, 255, 0)");
  context.strokeStyle = line;
  context.lineWidth = 1.1 * scale;
  context.beginPath();
  context.moveTo(width * 0.08, height * 0.74);
  context.bezierCurveTo(width * 0.37, height * 0.61, width * 0.58, height * 0.78, width * 0.92, height * 0.61);
  context.stroke();
  context.restore();

  // Grain and vignette.
  const noise = getNoisePattern();
  if (noise) {
    context.save();
    context.globalAlpha = 0.55;
    context.fillStyle = context.createPattern(noise, "repeat");
    context.fillRect(0, 0, width, height);
    context.restore();
  }

  const vignette = context.createRadialGradient(
    width * 0.5,
    height * 0.44,
    width * 0.22,
    width * 0.5,
    height * 0.52,
    width * 0.95
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(0.7, "rgba(0, 0, 0, 0.14)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.62)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);

  // Status bar.
  context.save();
  context.fillStyle = "rgba(248, 251, 248, 0.82)";
  context.font = `500 ${24 * scale}px "Source Code Pro", "Cascadia Mono", monospace`;
  context.letterSpacing = `${1.4 * scale}px`;
  context.fillText(timeStr, 48 * scale, 83 * scale);
  context.restore();
  drawStatusIcons(context, width, scale);

  // Lock screen type.
  context.save();
  context.fillStyle = "rgba(243, 249, 245, 0.62)";
  context.font = `300 ${27 * scale}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
  context.letterSpacing = `${2.2 * scale}px`;
  context.fillText(dateStr, 47 * scale, height * 0.245);

  context.fillStyle = "rgba(249, 252, 248, 0.96)";
  context.font = `300 ${178 * scale}px "Noto Serif SC", "Songti SC", STSong, serif`;
  context.letterSpacing = `${-6 * scale}px`;
  context.fillText(timeStr, 39 * scale, height * 0.326);

  context.fillStyle = "rgba(235, 247, 243, 0.54)";
  context.font = `300 ${23 * scale}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
  context.letterSpacing = `${2 * scale}px`;
  context.fillText("上海 · 晴 18°", 48 * scale, height * 0.365);

  context.fillStyle = "rgba(167, 236, 224, 0.3)";
  context.font = `400 ${9 * scale}px "Source Code Pro", monospace`;
  context.letterSpacing = `${2.2 * scale}px`;
  context.fillText("MONOLITH OS 2.0  /  UDC ACTIVE  /  NEURAL SYNC", 48 * scale, height * 0.392);
  context.restore();

  // Bottom lock hint.
  context.save();
  context.strokeStyle = "rgba(238, 250, 245, 0.22)";
  context.lineWidth = 1 * scale;
  context.beginPath();
  context.moveTo(width * 0.5 - 22 * scale, height * 0.9);
  context.lineTo(width * 0.5 + 22 * scale, height * 0.9);
  context.stroke();

  context.fillStyle = "rgba(238, 250, 245, 0.46)";
  context.font = `300 ${17 * scale}px "Noto Sans SC", "Microsoft YaHei", sans-serif`;
  context.letterSpacing = `${4 * scale}px`;
  context.textAlign = "center";
  context.fillText("轻扫，开始", width * 0.5, height * 0.925);

  context.fillStyle = "rgba(239, 249, 245, 0.26)";
  context.font = `400 ${13 * scale}px "Source Code Pro", monospace`;
  context.letterSpacing = `${2.5 * scale}px`;
  context.fillText("M67", width * 0.5, height * 0.955);
  context.restore();
}

function drawDisplayScreen() {
  const canvas = document.getElementById("display-screen");
  if (!canvas) return;
  drawWallpaper(canvas);
}

/* ------------------------------------------------------------------
   Three / WebGL phone
   ------------------------------------------------------------------ */

const hero = document.querySelector(".hero");
const stageElement = document.getElementById("stage");
const modelElement = document.getElementById("model");
const canvas = document.getElementById("phone-canvas");
const stageControls = document.querySelector(".stage-controls");
const heroCopy = document.querySelector(".hero-copy");
const orbit = document.querySelector(".orbit");
const phoneShadow = document.querySelector(".phone-shadow");
const hud = document.getElementById("hud");
const hudLeader = document.getElementById("hud-leader");
const hudPath = document.getElementById("leader-path");
const hudDot = document.getElementById("leader-dot");
const hudKicker = document.getElementById("hud-kicker");
const hudValue = document.getElementById("hud-value");
const hudUnit = document.getElementById("hud-unit");
const hudLabel = document.getElementById("hud-label");
const viewButtons = Array.from(document.querySelectorAll("[data-view]"));
const finishButtons = Array.from(document.querySelectorAll(".finish-option"));
const finishCurrent = document.getElementById("finish-current");

const PHONE_WIDTH = 7.48;
const PHONE_HEIGHT = 16.12;
const PHONE_DEPTH = 0.76;
const PHONE_RADIUS = 1.16;
const CAMERA_CENTER = new THREE.Vector2(-2.15, 4.92);
const CAMERA_LENSES = [
  new THREE.Vector2(-2.72, 5.48),
  new THREE.Vector2(-2.72, 4.42),
  new THREE.Vector2(-1.47, 5.48),
];
const CAMERA_FLASH = new THREE.Vector2(-1.47, 4.42);

// Pitch limits, shared by the drag gesture, the keyboard and the fly-to
// tweens. They used to disagree: the bottom view aimed at -1.18 while the
// inertia clamp snapped back to -1.02, which read as a jolt at the end of
// every fly-to("bottom").
const PITCH_MIN = -1.18;
const PITCH_MAX = 0.5;

const views = {
  front: { y: 0.31, x: -0.07 },
  rear: { y: Math.PI - 0.38, x: -0.08 },
  side: { y: Math.PI / 2 + 0.2, x: 0.1 },
  bottom: { y: 0.38, x: PITCH_MIN },
};

const FINISHES = {
  obsidian: {
    label: "曜黑",
    en: "OBSIDIAN",
    swatch: "#22272a",
    cap: 0x101416,
    rail: 0x8c8f8c,
    button: 0x606263,
    rear: 0x151b1d,
    wordmark: 0xffffff,
    outline: 0xb7c2c3,
    texture: {
      base: ["#1d2326", "#101518", "#080b0d", "#040607"],
      sheen: [
        [0, "rgba(208, 238, 231, 0)"],
        [0.28, "rgba(208, 238, 231, 0.22)"],
        [0.52, "rgba(236, 251, 246, 0.32)"],
        [0.76, "rgba(151, 203, 209, 0.12)"],
        [1, "rgba(151, 203, 209, 0)"],
      ],
      shadow: "rgba(0, 0, 0, 0.5)",
      mark: "rgba(172, 185, 181, 0.4)",
      mark2: "rgba(172, 185, 181, 0.24)",
      lines: "rgba(217, 229, 225, 0.055)",
      accent: "rgba(43, 69, 255, 0.38)",
      micro: "rgba(194, 207, 203, 0.38)",
    },
  },
  lunar: {
    label: "月银",
    en: "LUNAR",
    swatch: "#d8d4c8",
    cap: 0x8c877b,
    rail: 0xb9b5a9,
    button: 0x9b968a,
    rear: 0xd8d4c8,
    wordmark: 0x3f403b,
    outline: 0x666b63,
    texture: {
      base: ["#ece8dc", "#d9d4c7", "#c4bfb2", "#b1aca0"],
      sheen: [
        [0, "rgba(255, 255, 252, 0)"],
        [0.28, "rgba(255, 255, 252, 0.42)"],
        [0.52, "rgba(255, 255, 255, 0.58)"],
        [0.76, "rgba(200, 220, 220, 0.18)"],
        [1, "rgba(200, 220, 220, 0)"],
      ],
      shadow: "rgba(21, 25, 23, 0.34)",
      mark: "rgba(74, 77, 71, 0.42)",
      mark2: "rgba(74, 77, 71, 0.25)",
      lines: "rgba(70, 74, 70, 0.045)",
      accent: "rgba(43, 69, 255, 0.3)",
      micro: "rgba(72, 77, 71, 0.42)",
    },
  },
  ion: {
    label: "电蓝",
    en: "ION",
    swatch: "#24426f",
    cap: 0x14243b,
    rail: 0x9eb4cd,
    button: 0x6f839d,
    rear: 0x1d365b,
    wordmark: 0xdbe9ff,
    outline: 0x9fc3db,
    texture: {
      base: ["#2a4e7d", "#1a3357", "#0d1e36", "#07111e"],
      sheen: [
        [0, "rgba(169, 255, 245, 0)"],
        [0.28, "rgba(169, 255, 245, 0.24)"],
        [0.52, "rgba(126, 188, 255, 0.38)"],
        [0.76, "rgba(118, 101, 255, 0.16)"],
        [1, "rgba(118, 101, 255, 0)"],
      ],
      shadow: "rgba(0, 4, 10, 0.56)",
      mark: "rgba(190, 220, 238, 0.44)",
      mark2: "rgba(190, 220, 238, 0.26)",
      lines: "rgba(193, 230, 255, 0.05)",
      accent: "rgba(84, 174, 255, 0.5)",
      micro: "rgba(202, 226, 248, 0.4)",
    },
  },
};

const state = {
  rotY: views.rear.y,
  rotX: views.rear.x,
  velocityY: 0,
  velocityX: 0,
  dragging: false,
  pointerId: null,
  lastX: 0,
  lastY: 0,
  moved: 0,
  mode: "rear",
  tween: null,
  spinLevel: 0,
  lastSpinAt: performance.now(),
  // Extra 3.4s so the first spin starts after the intro has fully settled.
  lastInteractionAt: performance.now() + 3400,
  startedAt: performance.now(),
  isStacked: false,
  ready: false,
  webgl: false,
  finish: "obsidian",
};

let renderer;
let scene;
let camera;
let phoneRig;
let phone;
let screenTexture;
let screenGlareUniforms;
let heroScreenMaterial = null;
let screenCanvasLive = null;
let lastClockMinute = -1;
let orbClock = 0;
let orbSway = 0;
let prevRotY = 0;
let bootFlashUntil = 0;
let holoMeshes = null;
let holoMaterial = null;
let holoProjector = null;
let holoReveal = 0;
let holoOn = false;
let holoApplied = false;
let envTexture;
let heroVisible = true;

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(min, max, value) {
  const t = clamp((value - min) / (max - min), 0, 1);
  return t * t * (3 - 2 * t);
}

function roundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  shape.closePath();
  return shape;
}

function circlePath(x, y, radius, clockwise = true) {
  const path = new THREE.Path();
  path.absarc(x, y, radius, 0, Math.PI * 2, clockwise);
  return path;
}

/* The UVs are normalised against the geometry's own bounding box, so shapes
   that are not centred on the origin (the L-shaped logic board) still map the
   whole texture across themselves instead of sampling a corner of it. */
function flatShapeGeometry(shape, _width, _height, curveSegments = 48) {
  const geometry = new THREE.ShapeGeometry(shape, curveSegments);
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  const sizeX = Math.max(bounds.max.x - bounds.min.x, 1e-6);
  const sizeY = Math.max(bounds.max.y - bounds.min.y, 1e-6);
  const positions = geometry.attributes.position;
  const uvs = new Float32Array(positions.count * 2);
  for (let index = 0; index < positions.count; index += 1) {
    uvs[index * 2] = (positions.getX(index) - bounds.min.x) / sizeX;
    uvs[index * 2 + 1] = (positions.getY(index) - bounds.min.y) / sizeY;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  return geometry;
}

/* A polygon with every corner rounded, used for parts that are not rectangles
   (the logic board wraps around the camera module). */
function roundedPolygonShape(points, radius = 0.16) {
  const shape = new THREE.Shape();
  const count = points.length;
  const toward = (from, to, distance) => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const length = Math.hypot(dx, dy) || 1;
    const t = Math.min(distance / length, 0.5);
    return [from[0] + dx * t, from[1] + dy * t];
  };

  for (let index = 0; index < count; index += 1) {
    const previous = points[(index - 1 + count) % count];
    const current = points[index];
    const next = points[(index + 1) % count];
    const inLength = Math.hypot(current[0] - previous[0], current[1] - previous[1]) || 1;
    const outLength = Math.hypot(next[0] - current[0], next[1] - current[1]) || 1;
    const r = Math.min(radius, inLength / 2, outLength / 2);
    const start = toward(current, previous, r);
    const end = toward(current, next, r);

    if (index === 0) shape.moveTo(start[0], start[1]);
    else shape.lineTo(start[0], start[1]);
    shape.quadraticCurveTo(current[0], current[1], end[0], end[1]);
  }
  shape.closePath();
  return shape;
}

function makeLensTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  const center = 256;

  context.clearRect(0, 0, 512, 512);
  const glass = context.createRadialGradient(206, 190, 8, center, center, 248);
  glass.addColorStop(0, "#b9fff6");
  glass.addColorStop(0.06, "#1b8098");
  glass.addColorStop(0.18, "#0b3956");
  glass.addColorStop(0.4, "#071c2d");
  glass.addColorStop(0.72, "#03080f");
  glass.addColorStop(0.93, "#000203");
  glass.addColorStop(1, "#1c4d5f");
  context.fillStyle = glass;
  context.beginPath();
  context.arc(center, center, 250, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "rgba(78, 231, 208, 0.45)";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(center, center, 177, Math.PI * 0.94, Math.PI * 1.42);
  context.stroke();

  context.strokeStyle = "rgba(87, 130, 255, 0.32)";
  context.lineWidth = 8;
  context.beginPath();
  context.arc(center, center, 207, Math.PI * 0.18, Math.PI * 0.55);
  context.stroke();

  context.strokeStyle = "rgba(202, 255, 248, 0.28)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(center, center, 120, Math.PI * 1.05, Math.PI * 1.7);
  context.stroke();

  const flare = context.createRadialGradient(186, 172, 0, 186, 172, 80);
  flare.addColorStop(0, "rgba(235, 255, 252, 0.88)");
  flare.addColorStop(0.22, "rgba(165, 255, 237, 0.45)");
  flare.addColorStop(1, "rgba(165, 255, 237, 0)");
  context.fillStyle = flare;
  context.fillRect(100, 90, 180, 180);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeWordmarkTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 1024, 256);

  context.textAlign = "center";
  context.fillStyle = "rgba(196, 202, 201, 0.8)";
  context.font = '500 54px "Source Code Pro", "Cascadia Mono", monospace';
  context.letterSpacing = "20px";
  context.fillText("MONOLITH", 512, 100);

  context.fillStyle = "rgba(142, 150, 149, 0.55)";
  context.font = '400 24px "Source Code Pro", "Cascadia Mono", monospace';
  context.letterSpacing = "7px";
  context.fillText("M67 · CERAMIC GLASS", 512, 164);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* An original "space division" roundel for the back glass. Drawn in canvas so
   it stays procedural, like every other marking on the phone. */
function makeProgramEmblemTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 512, 640);

  const cx = 256;
  const cy = 236;
  const ink = "rgba(238, 241, 238, 0.92)";

  // Orbit ring and its inner guide.
  context.strokeStyle = ink;
  context.lineWidth = 7;
  context.beginPath();
  context.arc(cx, cy, 176, 0, Math.PI * 2);
  context.stroke();
  context.lineWidth = 2;
  context.beginPath();
  context.arc(cx, cy, 148, 0, Math.PI * 2);
  context.stroke();

  // Dashed trajectory that breaks out of the ring at the top.
  context.save();
  context.lineWidth = 3;
  context.setLineDash([13, 9]);
  context.beginPath();
  context.arc(cx, cy - 12, 208, Math.PI * 1.18, Math.PI * 1.82);
  context.stroke();
  context.restore();

  // The mark: a delta with an inner chevron, climbing out of the ring.
  context.lineWidth = 10;
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(cx - 64, cy + 98);
  context.lineTo(cx, cy - 70);
  context.lineTo(cx + 64, cy + 98);
  context.closePath();
  context.stroke();

  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(cx - 29, cy + 54);
  context.lineTo(cx, cy - 8);
  context.lineTo(cx + 29, cy + 54);
  context.stroke();

  // The craft, riding the dashed line.
  context.fillStyle = ink;
  context.beginPath();
  context.arc(cx, cy - 190, 13, 0, Math.PI * 2);
  context.fill();

  context.textAlign = "center";
  context.fillStyle = "rgba(238, 241, 238, 0.7)";
  context.font = '400 24px "Source Code Pro", "Cascadia Mono", monospace';
  context.letterSpacing = "12px";
  context.fillText("SPACE DIVISION", cx, 520);
  context.font = '400 17px "Source Code Pro", "Cascadia Mono", monospace';
  context.letterSpacing = "7px";
  context.fillStyle = "rgba(238, 241, 238, 0.4)";
  context.fillText("M67 · FLIGHT UNIT 01", cx, 566);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeBackTexture(finish = FINISHES.obsidian) {
  const palette = finish.texture;
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 1280;
  const context = canvas.getContext("2d");

  const base = context.createLinearGradient(0, 0, 200, 1280);
  base.addColorStop(0, palette.base[0]);
  base.addColorStop(0.38, palette.base[1]);
  base.addColorStop(0.72, palette.base[2]);
  base.addColorStop(1, palette.base[3]);
  context.fillStyle = base;
  context.fillRect(0, 0, 640, 1280);

  // Broad diagonal light band: a physical reflection baked into the glass so
  // the flat back reads as a surface, not a silhouette.
  context.save();
  context.globalCompositeOperation = "screen";
  context.translate(370, 330);
  context.rotate(-0.48);
  context.filter = "blur(44px)";
  const sheen = context.createLinearGradient(-160, 0, 240, 0);
  palette.sheen.forEach(([offset, color]) => sheen.addColorStop(offset, color));
  context.fillStyle = sheen;
  context.fillRect(-420, -40, 760, 960);
  context.restore();

  // Camera-window shadow, still completely flush.
  context.save();
  context.filter = "blur(26px)";
  context.fillStyle = palette.shadow;
  context.beginPath();
  context.roundRect(22, 141, 236, 222, 54);
  context.fill();
  context.restore();

  // A hairline optical orbit around the flush camera array.
  context.save();
  context.strokeStyle = palette.accent;
  context.lineWidth = 1.15;
  context.beginPath();
  context.arc(140, 252, 148, -0.22, 2.28);
  context.stroke();
  for (let index = 0; index < 7; index += 1) {
    const angle = -0.12 + index * 0.35;
    const inner = 141;
    const outer = 147;
    context.beginPath();
    context.moveTo(140 + Math.cos(angle) * inner, 252 + Math.sin(angle) * inner);
    context.lineTo(140 + Math.cos(angle) * outer, 252 + Math.sin(angle) * outer);
    context.stroke();
  }
  context.restore();

  // Fine optical inscription under the lenses.
  context.save();
  context.textAlign = "center";
  context.fillStyle = palette.micro;
  context.font = '400 9px "Source Code Pro", monospace';
  context.letterSpacing = "1.8px";
  context.fillText("50MP · OIS · 1:1.6–2.5 / 14–70", 140, 392);
  context.font = '400 7px "Source Code Pro", monospace';
  context.letterSpacing = "2.4px";
  context.fillText("FLUSH OPTICS / M67", 140, 409);
  context.restore();

  // Tiny production marks near the bottom edge.
  context.save();
  context.fillStyle = palette.mark;
  context.font = '400 14px "Source Code Pro", monospace';
  context.letterSpacing = "4px";
  context.textAlign = "center";
  context.fillText("M67 · 5G · IP68", 320, 1182);
  context.font = '400 9px "Source Code Pro", monospace';
  context.fillStyle = palette.mark2;
  context.fillText("DESIGNED IN SHANGHAI · 2026", 320, 1208);
  context.restore();

  // Very fine brushed texture.
  context.save();
  context.strokeStyle = palette.lines;
  for (let index = 0; index < 72; index += 1) {
    const x = (index / 72) * 640;
    context.lineWidth = index % 3 === 0 ? 1.2 : 0.5;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + 30, 1280);
    context.stroke();
  }
  context.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function makeScreenTexture() {
  const screenCanvas = document.createElement("canvas");
  screenCanvasLive = screenCanvas;
  screenCanvas.width = 900;
  screenCanvas.height = 1956;
  drawWallpaper(screenCanvas);

  const texture = new THREE.CanvasTexture(screenCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function tickScreenClock() {
  if (!screenCanvasLive || !screenTexture) return;
  const minute = new Date().getMinutes();
  if (minute === lastClockMinute) return;
  lastClockMinute = minute;
  neuralSync = Math.min(99.9, Math.max(96.2, neuralSync + (Math.random() - 0.5) * 0.6));
  drawWallpaper(screenCanvasLive);
  screenTexture.needsUpdate = true;
}

function drawOrbHalo(time) {
  if (!phone || !phone.userData.orbCanvas) return;
  const ud = phone.userData;
  const ctx = ud.orbCanvas.getContext("2d");
  ctx.clearRect(0, 0, 256, 256);
  const pulse = 0.6 + 0.4 * Math.sin(time * 0.9);
  const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 122);
  gradient.addColorStop(0, `rgba(150, 235, 250, ${(0.10 + pulse * 0.07).toFixed(3)})`);
  gradient.addColorStop(0.55, `rgba(120, 220, 240, ${(0.05 + pulse * 0.04).toFixed(3)})`);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  ud.orbTexture.needsUpdate = true;
  ud.orbGlow.material.opacity = 0.8 + 0.2 * Math.sin(time * 0.55 + 1.2);
}

/* ---------- B. hologram state material + projector ---------- */
function buildHoloMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vW;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz;
        vN = normalize(mat3(modelMatrix) * normal);
        vV = cameraPosition - wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uReveal;
      varying vec3 vN;
      varying vec3 vV;
      varying vec3 vW;
      void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.7);
        float scan = 0.55 + 0.45 * sin(vW.y * 26.0 - uTime * 5.0);
        float flick = 0.94 + 0.06 * sin(uTime * 31.0) * sin(uTime * 17.3);
        float alpha = (fresnel * 0.8 + scan * 0.07 + 0.025) * uReveal * flick;
        vec3 col = mix(vec3(0.02, 0.42, 0.40), vec3(0.55, 0.98, 0.92), fresnel);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

function createHoloProjector() {
  const projGroup = new THREE.Group();
  const coneMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uReveal;
      varying vec2 vUv;
      void main() {
        float base = pow(vUv.y, 1.4) * 0.14;
        float bands = 0.85 + 0.15 * sin(vUv.y * 44.0 - uTime * 3.2);
        float alpha = base * bands * uReveal;
        gl_FragColor = vec4(vec3(0.05, 0.45, 0.42), alpha);
      }
    `,
  });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 4.4, 4.5, 48, 1, true), coneMaterial);
  cone.position.y = -10.45;
  projGroup.add(cone);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x1d7a72,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.035, 8, 72), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -12.72;
  projGroup.add(ring);
  projGroup.userData = { coneMaterial, ringMaterial };
  return projGroup;
}

let studioEnvCanvas = null;

function getStudioEnvCanvas() {
  if (studioEnvCanvas) return studioEnvCanvas;

  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const context = canvas.getContext("2d");

  const sky = context.createLinearGradient(0, 0, 0, 1024);
  sky.addColorStop(0, "#373d40");
  sky.addColorStop(0.22, "#555f61");
  sky.addColorStop(0.42, "#6d7778");
  sky.addColorStop(0.48, "#303638");
  sky.addColorStop(0.55, "#101315");
  sky.addColorStop(0.72, "#050607");
  sky.addColorStop(1, "#020303");
  context.fillStyle = sky;
  context.fillRect(0, 0, 2048, 1024);

  const paintSoftbox = (x, y, width, height, color, blur = 60) => {
    context.save();
    context.filter = `blur(${blur}px)`;
    const gradient = context.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(x, y, width, height);
    context.restore();
  };

  context.save();
  context.globalCompositeOperation = "screen";
  // The wide strip around x=820 is what the flat rear glass reflects in the
  // hero's three-quarter view. It creates the sheen across the whole back.
  paintSoftbox(640, 270, 360, 430, "rgba(255, 255, 251, 0.98)", 55);
  paintSoftbox(770, 210, 150, 470, "rgba(255, 255, 255, 1)", 34);
  // Additional strips keep the side profile and alternate angles alive.
  paintSoftbox(1240, -80, 230, 630, "rgba(255, 255, 250, 0.92)", 38);
  paintSoftbox(940, 40, 150, 470, "rgba(255, 246, 230, 0.7)", 42);
  paintSoftbox(1530, 180, 240, 340, "rgba(226, 239, 255, 0.66)", 48);
  paintSoftbox(270, 240, 420, 220, "rgba(220, 236, 232, 0.34)", 60);
  paintSoftbox(0, 330, 2048, 105, "rgba(240, 247, 241, 0.26)", 46);
  context.restore();

  // A darker reflection block gives the glass a defined horizon.
  context.save();
  context.filter = "blur(42px)";
  context.fillStyle = "rgba(0, 0, 0, 0.7)";
  context.fillRect(1710, 360, 300, 330);
  context.restore();

  studioEnvCanvas = canvas;
  return canvas;
}

let neutralEnvCanvas = null;

/* The same studio, desaturated. Used by the exploded view, where large metal
   parts would otherwise mirror the blue key and read as painted plastic. */
function getNeutralEnvCanvas() {
  if (neutralEnvCanvas) return neutralEnvCanvas;
  const source = getStudioEnvCanvas();
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext("2d");
  context.filter = "saturate(0.04) brightness(1.07) contrast(1.03)";
  context.drawImage(source, 0, 0);
  neutralEnvCanvas = canvas;
  return canvas;
}

function createEnvironment(rendererInstance, sceneInstance, intensity = 1.15, neutral = false) {
  const equirect = new THREE.CanvasTexture(neutral ? getNeutralEnvCanvas() : getStudioEnvCanvas());
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  equirect.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(rendererInstance);
  const environment = pmrem.fromEquirectangular(equirect).texture;
  sceneInstance.environment = environment;
  sceneInstance.environmentIntensity = intensity;
  equirect.dispose();
  pmrem.dispose();
  return environment;
}

function createBottomEdgeDetails({ rim, barrel, dark, screw }) {
  const group = new THREE.Group();
  group.position.y = -8.066;

  const portShape = roundedRectShape(1.44, 0.46, 0.18);
  portShape.holes.push(roundedRectShape(1.18, 0.29, 0.13));
  const portRim = new THREE.Mesh(flatShapeGeometry(portShape, 1.44, 0.46, 32), rim);
  portRim.rotation.x = Math.PI / 2;
  group.add(portRim);

  const accentShape = roundedRectShape(1.54, 0.56, 0.21);
  accentShape.holes.push(roundedRectShape(1.46, 0.48, 0.19));
  const portAccent = new THREE.Mesh(
    flatShapeGeometry(accentShape, 1.54, 0.56, 32),
    new THREE.MeshBasicMaterial({
      color: 0x2b45ff,
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  portAccent.rotation.x = Math.PI / 2;
  portAccent.position.y = -0.0006;
  group.add(portAccent);

  const portInterior = new THREE.Mesh(
    flatShapeGeometry(roundedRectShape(1.17, 0.285, 0.125), 1.17, 0.285, 24),
    dark
  );
  portInterior.rotation.x = Math.PI / 2;
  portInterior.position.y = -0.003;
  group.add(portInterior);

  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.028, 0.11), barrel);
  tongue.position.set(0, -0.008, 0);
  group.add(tongue);

  const holePositions = [-2.8, -2.56, -2.32, -2.08, 2.08, 2.32, 2.56, 2.8];
  holePositions.forEach((x) => {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.034, 14), dark);
    hole.rotation.x = Math.PI / 2;
    hole.position.set(x, -0.004, 0);
    group.add(hole);
  });

  const mic = new THREE.Mesh(new THREE.CircleGeometry(0.024, 12), dark);
  mic.rotation.x = Math.PI / 2;
  mic.position.set(-3.48, -0.004, 0.12);
  group.add(mic);

  [-3.48, 3.48].forEach((x) => {
    const screwHead = new THREE.Mesh(new THREE.CircleGeometry(0.055, 16), screw);
    screwHead.rotation.x = Math.PI / 2;
    screwHead.position.set(x, -0.005, -0.14);
    group.add(screwHead);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.008, 0.012), dark);
    slot.position.set(x, -0.009, -0.14);
    group.add(slot);
  });

  return group;
}

function createAntennaBands(material) {
  const group = new THREE.Group();
  [-1, 1].forEach((side) => {
    [6.55, -6.55].forEach((y) => {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.04, 0.68), material);
      band.position.set(side * 3.748, y, 0);
      group.add(band);
    });
  });
  return group;
}

function createPhone() {
  const group = new THREE.Group();
  group.rotation.order = "YXZ";

  const finishTextures = Object.fromEntries(
    Object.entries(FINISHES).map(([key, finish]) => [key, makeBackTexture(finish)])
  );

  const frameCapMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x101416,
    metalness: 0.64,
    roughness: 0.3,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.5,
  });

  const railMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x8c8f8c,
    metalness: 1,
    roughness: 0.2,
    clearcoat: 0.55,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.8,
  });

  const backGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: finishTextures.obsidian,
    metalness: 0.16,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 0.55,
    iridescence: 0.18,
    iridescenceIOR: 1.28,
    iridescenceThicknessRange: [120, 340],
    side: THREE.DoubleSide,
  });

  const frontSurroundMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x010202,
    metalness: 0.15,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.5,
  });

  const bodyShape = roundedRectShape(PHONE_WIDTH, PHONE_HEIGHT, PHONE_RADIUS);
  const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.64,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 6,
    curveSegments: 48,
    steps: 1,
  });
  bodyGeometry.center();
  const body = new THREE.Mesh(bodyGeometry, [frameCapMaterial, railMaterial]);
  group.add(body);

  // Back glass with real, flush lens apertures.
  const backShape = roundedRectShape(PHONE_WIDTH - 0.11, PHONE_HEIGHT - 0.11, PHONE_RADIUS - 0.05);
  CAMERA_LENSES.forEach((lens) => {
    backShape.holes.push(circlePath(lens.x, lens.y, 0.49));
  });
  backShape.holes.push(circlePath(CAMERA_FLASH.x, CAMERA_FLASH.y, 0.225));
  const backGeometry = flatShapeGeometry(backShape, PHONE_WIDTH, PHONE_HEIGHT);
  const backGlass = new THREE.Mesh(backGeometry, backGlassMaterial);
  backGlass.position.z = -0.381;
  group.add(backGlass);

  // Small etched outline for the flush optics window.
  const moduleOutlineShape = roundedRectShape(2.84, 2.84, 0.58);
  moduleOutlineShape.holes.push(roundedRectShape(2.72, 2.72, 0.52));
  const moduleOutline = new THREE.Mesh(
    flatShapeGeometry(moduleOutlineShape, 2.84, 2.84, 24),
    new THREE.MeshBasicMaterial({
      color: 0xb7c2c3,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  moduleOutline.position.set(CAMERA_CENTER.x, CAMERA_CENTER.y, -0.3825);
  group.add(moduleOutline);

  // Camera cavity plate and lens stack, all held below the rear surface.
  const cavityShape = roundedRectShape(2.74, 2.74, 0.52);
  const cavity = new THREE.Mesh(
    flatShapeGeometry(cavityShape, 2.74, 2.74, 24),
    new THREE.MeshPhysicalMaterial({
      color: 0x060b10,
      metalness: 0.58,
      roughness: 0.24,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 0.7,
      side: THREE.DoubleSide,
    })
  );
  cavity.position.set(CAMERA_CENTER.x, CAMERA_CENTER.y, -0.374);
  group.add(cavity);

  const lensTexture = makeLensTexture();
  const lensDiscMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: lensTexture,
    metalness: 0.15,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.2,
    side: THREE.DoubleSide,
  });

  const lensRingOuter = new THREE.MeshPhysicalMaterial({
    color: 0xaeb4b4,
    metalness: 1,
    roughness: 0.16,
    envMapIntensity: 1.65,
    side: THREE.DoubleSide,
  });

  const lensRingInner = new THREE.MeshPhysicalMaterial({
    color: 0x171b1d,
    metalness: 0.9,
    roughness: 0.25,
    side: THREE.DoubleSide,
  });

  const brightRingMaterial = new THREE.MeshBasicMaterial({
    color: 0xc6cfcc,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const barrelMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x05090c,
    metalness: 0.82,
    roughness: 0.3,
    side: THREE.DoubleSide,
    envMapIntensity: 0.8,
  });

  const threadMaterial = new THREE.MeshBasicMaterial({
    color: 0x46545a,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  CAMERA_LENSES.forEach((lens) => {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.427, 0.427, 0.12, 48, 1, true), barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(lens.x, lens.y, -0.326);
    group.add(barrel);

    const thread = new THREE.Mesh(new THREE.RingGeometry(0.378, 0.392, 64), threadMaterial);
    thread.position.set(lens.x, lens.y, -0.3846);
    group.add(thread);

    const outerRing = new THREE.Mesh(new THREE.RingGeometry(0.395, 0.482, 64), lensRingOuter);
    outerRing.position.set(lens.x, lens.y, -0.3826);
    group.add(outerRing);

    const bevelRing = new THREE.Mesh(new THREE.RingGeometry(0.447, 0.479, 64), brightRingMaterial);
    bevelRing.position.set(lens.x, lens.y, -0.3842);
    group.add(bevelRing);

    const innerRing = new THREE.Mesh(new THREE.RingGeometry(0.345, 0.398, 64), lensRingInner);
    innerRing.position.set(lens.x, lens.y, -0.3834);
    group.add(innerRing);

    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.347, 64), lensDiscMaterial);
    disc.position.set(lens.x, lens.y, -0.384);
    group.add(disc);

    const glintMaterial = new THREE.MeshBasicMaterial({
      color: 0xeafffb,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const glint = new THREE.Mesh(new THREE.CircleGeometry(0.055, 20), glintMaterial);
    glint.position.set(lens.x - 0.09, lens.y + 0.11, -0.3852);
    group.add(glint);

    const secondaryGlint = new THREE.Mesh(
      new THREE.CircleGeometry(0.018, 16),
      new THREE.MeshBasicMaterial({
        color: 0xa9fff0,
        transparent: true,
        opacity: 0.76,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    secondaryGlint.position.set(lens.x + 0.11, lens.y - 0.08, -0.3852);
    group.add(secondaryGlint);
  });

  const flashOuter = new THREE.Mesh(new THREE.RingGeometry(0.155, 0.218, 48), lensRingOuter);
  flashOuter.position.set(CAMERA_FLASH.x, CAMERA_FLASH.y, -0.3826);
  group.add(flashOuter);
  const flashBevel = new THREE.Mesh(new THREE.RingGeometry(0.19, 0.216, 48), brightRingMaterial);
  flashBevel.position.set(CAMERA_FLASH.x, CAMERA_FLASH.y, -0.3842);
  group.add(flashBevel);
  const flash = new THREE.Mesh(
    new THREE.CircleGeometry(0.152, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0xffe2ae,
      emissive: 0x4b3310,
      emissiveIntensity: 0.4,
      metalness: 0.2,
      roughness: 0.45,
      side: THREE.DoubleSide,
    })
  );
  flash.position.set(CAMERA_FLASH.x, CAMERA_FLASH.y, -0.3832);
  group.add(flash);

  const mic = new THREE.Mesh(
    new THREE.CircleGeometry(0.045, 20),
    new THREE.MeshBasicMaterial({ color: 0x020405, side: THREE.DoubleSide })
  );
  mic.position.set(CAMERA_FLASH.x + 0.02, CAMERA_FLASH.y - 0.44, -0.3832);
  group.add(mic);

  const wordmark = new THREE.Mesh(
    new THREE.PlaneGeometry(4.0, 1.0),
    new THREE.MeshBasicMaterial({
      map: makeWordmarkTexture(),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      opacity: 0.9,
    })
  );
  wordmark.position.set(0, -4.75, -0.3835);
  wordmark.rotation.y = Math.PI;
  group.add(wordmark);

  const programEmblem = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.5),
    new THREE.MeshBasicMaterial({
      map: makeProgramEmblemTexture(),
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      opacity: 0.88,
    })
  );
  programEmblem.position.set(0, -3.0, -0.3835);
  programEmblem.rotation.y = Math.PI;
  group.add(programEmblem);

  // Front display layers.
  const frontShape = roundedRectShape(PHONE_WIDTH - 0.1, PHONE_HEIGHT - 0.1, PHONE_RADIUS - 0.04);
  const frontGlass = new THREE.Mesh(flatShapeGeometry(frontShape, PHONE_WIDTH, PHONE_HEIGHT), frontSurroundMaterial);
  frontGlass.position.z = 0.381;
  group.add(frontGlass);

  const screenWidth = 7.18;
  const screenHeight = 15.62;
  const screenShape = roundedRectShape(screenWidth, screenHeight, 1.02);
  const screenGeometry = flatShapeGeometry(screenShape, screenWidth, screenHeight, 64);
  screenTexture = makeScreenTexture();
  const screenMaterial = new THREE.MeshBasicMaterial({
    map: screenTexture,
    toneMapped: false,
  });
  heroScreenMaterial = screenMaterial;
  const screen = new THREE.Mesh(screenGeometry, screenMaterial);
  screen.position.z = 0.3834;
  group.add(screen);

  const glareShape = roundedRectShape(screenWidth, screenHeight, 1.02);
  const glareGeometry = flatShapeGeometry(glareShape, screenWidth, screenHeight, 64);
  screenGlareUniforms = { uTime: { value: 0 }, uPointer: { value: new THREE.Vector2(0.5, 0.55) } };
  const glareMaterial = new THREE.ShaderMaterial({
    uniforms: screenGlareUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uPointer;
      varying vec2 vUv;
      void main() {
        float d = vUv.x * 0.82 + vUv.y * 0.38;
        float wave = sin((d * 5.2) - uTime * 0.09);
        float band = smoothstep(0.72, 1.0, wave) * 0.075;
        float edge = smoothstep(0.53, 0.92, distance(vUv, vec2(0.5))) * 0.028;
        // A soft bloom that trails the cursor, so the glass answers the hand.
        float pd = distance(vUv, uPointer);
        float glow = smoothstep(0.58, 0.0, pd) * 0.22;
        vec3 tint = mix(vec3(0.64, 0.82, 1.0), vec3(0.78, 1.0, 0.96), vUv.y);
        gl_FragColor = vec4(tint * (band + edge + glow), 1.0);
      }
    `,
  });
  const glare = new THREE.Mesh(glareGeometry, glareMaterial);
  glare.position.z = 0.3852;
  group.add(glare);

  // Living wallpaper core: a breathing halo that trails the phone's rotation.
  const orbCanvas = document.createElement("canvas");
  orbCanvas.width = 256;
  orbCanvas.height = 256;
  const orbTexture = new THREE.CanvasTexture(orbCanvas);
  orbTexture.colorSpace = THREE.SRGBColorSpace;
  const orbGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 5.4),
    new THREE.MeshBasicMaterial({
      map: orbTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  orbGlow.position.set(1.184, 0.547, 0.3858);
  group.add(orbGlow);
  group.userData.orbGlow = orbGlow;
  group.userData.orbCanvas = orbCanvas;
  group.userData.orbTexture = orbTexture;

  // Three mechanical keys — power and a split volume rocker.
  const buttonMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x606263,
    metalness: 1,
    roughness: 0.26,
    envMapIntensity: 1.55,
  });
  const volumeUp = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.64, 5, 14), buttonMaterial);
  volumeUp.position.set(-3.755, 2.72, 0);
  group.add(volumeUp);
  const volumeDown = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.64, 5, 14), buttonMaterial);
  volumeDown.position.set(-3.755, 1.87, 0);
  group.add(volumeDown);
  const power = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 1.04, 5, 14), buttonMaterial);
  power.position.set(3.755, 2.48, 0);
  group.add(power);

  const portDark = new THREE.MeshBasicMaterial({
    color: 0x020304,
    side: THREE.DoubleSide,
  });
  const portTongue = new THREE.MeshPhysicalMaterial({
    color: 0x3e4547,
    metalness: 0.85,
    roughness: 0.34,
    side: THREE.DoubleSide,
  });
  const portScrew = new THREE.MeshPhysicalMaterial({
    color: 0x747873,
    metalness: 1,
    roughness: 0.34,
  });

  group.add(
    createBottomEdgeDetails({
      rim: railMaterial,
      barrel: portTongue,
      dark: portDark,
      screw: portScrew,
    })
  );
  group.add(createAntennaBands(portDark));

  group.userData.finish = {
    cap: frameCapMaterial,
    rail: railMaterial,
    back: backGlassMaterial,
    button: buttonMaterial,
    wordmark: wordmark.material,
    outline: moduleOutline.material,
    emblem: programEmblem.material,
    textures: finishTextures,
  };

  return group;
}

function initThree() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    showWebGLFallback();
    return;
  }

  if (!renderer || !renderer.getContext()) {
    showWebGLFallback();
    return;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.14;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 1, 140);
  camera.position.set(0, 0, 40);
  camera.lookAt(0, 0, 0);

  createEnvironment(renderer, scene, 0.88);

  const hemisphere = new THREE.HemisphereLight(0xe8f3ff, 0x171714, 0.55);
  scene.add(hemisphere);

  const key = new THREE.DirectionalLight(0xfff7ec, 2.4);
  key.position.set(5, 8, 9);
  scene.add(key);

  const backKey = new THREE.DirectionalLight(0xf3f8ff, 2.1);
  backKey.position.set(4, 6, -9);
  scene.add(backKey);

  const rim = new THREE.DirectionalLight(0x9fb6e8, 0.7);
  rim.position.set(-7, -1, 5);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xffffff, 0.55);
  fill.position.set(-5, 0, -6);
  scene.add(fill);

  phone = createPhone();
  phoneRig = new THREE.Group();
  phoneRig.add(phone);
  scene.add(phoneRig);
  phone.updateMatrixWorld(true);

  holoMaterial = buildHoloMaterial();
  holoMeshes = [];
  phone.traverse((node) => {
    if (node.isMesh) holoMeshes.push([node, node.material]);
  });
  holoProjector = createHoloProjector();
  scene.add(holoProjector);

  if (!reduceMotion) {
    const bootScan = document.querySelector(".boot-scan");
    window.setTimeout(() => { if (bootScan) bootScan.classList.add("is-booting"); }, 420);
    window.setTimeout(() => { if (bootScan) bootScan.classList.remove("is-booting"); }, 2500);
    if (heroScreenMaterial) {
      heroScreenMaterial.color.setScalar(2.1);
      bootFlashUntil = performance.now() + 1200;
    }
  }

  state.webgl = true;
  hero.dataset.mode = state.mode;
  resetCameraAndLayout();
  bindThreeInteractions();
  initBlueprintDraw();
  window.setTimeout(runCountUps, 900);

  const heroObserver = new IntersectionObserver(
    (entries) => {
      heroVisible = entries[0]?.isIntersecting ?? true;
    },
    { threshold: 0.01 }
  );
  heroObserver.observe(hero);

  let firstFrame = true;
  let lastFrameTime = performance.now();
  let elapsedTime = 0;

  function renderFrame() {
    requestAnimationFrame(renderFrame);
    if (document.hidden || !heroVisible) return;

    const now = performance.now();
    const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;
    elapsedTime += delta;
    const introProgress = reduceMotion
      ? 1
      : clamp((now - state.startedAt - 120) / 1800, 0, 1);
    const easedIntro = easeOutCubic(introProgress);

    if (!state.dragging) {
      if (state.tween) {
        const tweenProgress = clamp((now - state.tween.startedAt) / state.tween.duration, 0, 1);
        const eased = easeInOutCubic(tweenProgress);
        state.rotY = THREE.MathUtils.lerp(state.tween.fromY, state.tween.toY, eased);
        state.rotX = THREE.MathUtils.lerp(state.tween.fromX, state.tween.toX, eased);
        if (tweenProgress >= 1) state.tween = null;
      } else {
        state.rotY += state.velocityY * delta * 60;
        state.rotX += state.velocityX * delta * 60;
        state.velocityY *= Math.pow(0.86, delta * 60);
        state.velocityX *= Math.pow(0.86, delta * 60);
        if (Math.abs(state.velocityY) < 0.00004) state.velocityY = 0;
        if (Math.abs(state.velocityX) < 0.00004) state.velocityX = 0;
        state.rotX = clamp(state.rotX, PITCH_MIN, PITCH_MAX);
      }
    }

    // Idle turntable: after ~2.4 s without input the phone starts a slow
    // 360° spin (about 24 s a turn), easing in and out. Any interaction hands
    // control straight back to the user.
    const idleFor = now - state.lastInteractionAt;
    const spinWanted = !reduceMotion && !state.dragging && !state.tween && idleFor > 2400;
    // Real elapsed time, not the clamped frame delta: a slow turntable has to
    // keep its rate even when frames are scarce.
    const spinStep = Math.min((now - state.lastSpinAt) / 1000, 1.5);
    state.lastSpinAt = now;
    state.spinLevel = clamp(
      state.spinLevel + (spinWanted ? spinStep / 1.7 : -spinStep / 0.55),
      0,
      1
    );
    if (state.spinLevel > 0.001 && !state.dragging && !state.tween) {
      state.rotY += state.spinLevel * 0.26 * spinStep;
      state.velocityY = 0;
      state.velocityX = 0;
    }

    const time = elapsedTime;
    const breatheY = reduceMotion ? 0 : Math.sin(time * 0.32) * 0.008;
    const breatheX = reduceMotion ? 0 : Math.sin(time * 0.39 + 0.8) * 0.008;
    const introRotation = (1 - easedIntro) * 0.42;

    phone.rotation.y = state.rotY + breatheY + introRotation;
    phone.rotation.x = state.rotX + breatheX;
    phone.scale.setScalar(0.94 + easedIntro * 0.06);
    phone.position.y = (1 - easedIntro) * -1.1 + (reduceMotion ? 0 : Math.sin(time * 0.6) * 0.035);
    phone.updateMatrixWorld(true);

    if (screenGlareUniforms) {
      screenGlareUniforms.uTime.value = reduceMotion ? 0 : time;
      glarePointer.x += (glarePointer.tx - glarePointer.x) * Math.min(delta * 6, 1);
      glarePointer.y += (glarePointer.ty - glarePointer.y) * Math.min(delta * 6, 1);
      screenGlareUniforms.uPointer.value.set(glarePointer.x, glarePointer.y);
    }

    const rotVelocity = (state.rotY - prevRotY) / Math.max(delta, 0.001);
    prevRotY = state.rotY;
    if (!reduceMotion && phone.userData.orbGlow) {
      orbClock += delta;
      if (orbClock > 0.06) {
        orbClock = 0;
        drawOrbHalo(elapsedTime);
      }
      const swayTarget = clamp(rotVelocity * 0.5, -0.4, 0.4);
      orbSway += (swayTarget - orbSway) * Math.min(delta * 3.5, 1);
      phone.userData.orbGlow.position.x = 1.184 + orbSway;
    }

    if (holoMaterial && holoProjector) {
      holoReveal += ((holoOn ? 1 : 0) - holoReveal) * Math.min(delta * (holoOn ? 2.6 : 3.4), 1);
      if (Math.abs((holoOn ? 1 : 0) - holoReveal) < 0.003) holoReveal = holoOn ? 1 : 0;
      const easedHolo = easeOutCubic(clamp(holoReveal, 0, 1));
      holoMaterial.uniforms.uReveal.value = easedHolo;
      holoMaterial.uniforms.uTime.value = reduceMotion ? 12.0 : elapsedTime;
      holoProjector.userData.coneMaterial.uniforms.uReveal.value = easedHolo;
      holoProjector.userData.coneMaterial.uniforms.uTime.value = reduceMotion ? 0 : elapsedTime;
      holoProjector.userData.ringMaterial.opacity = easedHolo * 0.55;
      holoProjector.visible = holoReveal > 0.01;
      if (holoOn && !holoApplied && holoReveal > 0.02) {
        holoMeshes.forEach(([mesh]) => { mesh.material = holoMaterial; });
        holoApplied = true;
      } else if (!holoOn && holoApplied && holoReveal < 0.02) {
        holoMeshes.forEach(([mesh, material]) => { mesh.material = material; });
        holoApplied = false;
      }
    }

    if (bootFlashUntil && heroScreenMaterial && !holoApplied) {
      const flashT = 1 - (bootFlashUntil - now) / 1200;
      if (flashT >= 1) {
        heroScreenMaterial.color.setScalar(1);
        bootFlashUntil = 0;
      } else {
        heroScreenMaterial.color.setScalar(1 + 1.1 * (1 - easeOutCubic(clamp(flashT, 0, 1))));
      }
    }

    const currentMode = resolveMode();
    if (currentMode === state.mode) {
      if (pendingMode) {
        pendingMode = null;
        window.clearTimeout(pendingModeTimer);
      }
    } else if (pendingMode !== currentMode) {
      // Wait for the rotation to settle first, so a 180° turn does not flash
      // every angle it passes through.
      pendingMode = currentMode;
      const nextMode = currentMode;
      window.clearTimeout(pendingModeTimer);
      pendingModeTimer = window.setTimeout(() => {
        pendingMode = null;
        if (state.mode === nextMode) return;
        state.mode = nextMode;
        hero.dataset.mode = nextMode;
        updateHud();
        updateViewButtons();
        updateHeroCopy(nextMode);
      }, 170);
    }

    if (heroVisible) updateHudLeader();
    if (heroVisible) updateHudRing(delta);
    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      document.body.classList.add("is-rendered");
      requestAnimationFrame(() => document.body.classList.add("is-ready"));
      window.setTimeout(() => document.body.classList.add("is-ready"), 900);
    }
  }

  renderFrame();
}

function showWebGLFallback() {
  const fallback = document.getElementById("webgl-fallback");
  if (fallback) fallback.hidden = false;
  if (canvas) canvas.style.display = "none";
  if (hud) hud.style.display = "none";
  if (hudLeader) hudLeader.style.display = "none";
  if (stageControls) stageControls.style.display = "none";
  const stageNote = document.querySelector(".stage-note");
  if (stageNote) stageNote.style.display = "none";
  state.webgl = false;
}

function resolveMode() {
  if (state.rotX < -0.62) return "bottom";
  const cosine = Math.cos(state.rotY);
  if (cosine > 0.34) return "front";
  if (cosine < -0.34) return "rear";
  return "side";
}

/* One line per view, in the same voice as the rest of the sheet. The em
   dash stays outside so the accent period never has to move. */
const heroHeadlines = {
  rear: { lead: "背面，", body: '终于<span class="flat-word">平</span>了' },
  front: { lead: "正面，", body: '没有开<span class="flat-word">孔</span>' },
  side: { lead: "侧面，", body: '薄如一<span class="flat-word">线</span>' },
  bottom: { lead: "底部，", body: '只留一<span class="flat-word">口</span>' },
};

const heroTitle = document.getElementById("hero-title");
const heroLineA = document.getElementById("hero-line-a");
const heroLineB = document.getElementById("hero-line-b");
let heroCopyTimer = 0;

function updateHeroCopy(mode) {
  const copy = heroHeadlines[mode];
  if (!copy || !heroTitle || !heroLineA || !heroLineB) return;
  if (heroLineA.textContent === copy.lead) return;

  heroTitle.classList.add("is-swapping");
  window.clearTimeout(heroCopyTimer);
  heroCopyTimer = window.setTimeout(() => {
    heroLineA.textContent = copy.lead;
    heroLineB.innerHTML = copy.body;
    // After the first draw, the underline appears immediately instead of
    // replaying its 1.1s entrance on every view change.
    heroTitle.classList.add("is-swapped");
    heroTitle.classList.remove("is-swapping");
  }, 150);
}

const hudContent = {
  front: {
    kicker: "DISPLAY / 6.7″",
    value: "6.7",
    unit: "″",
    label: "无开孔全面屏 · 屏下前摄",
    anchor: new THREE.Vector3(0, 6.35, 0.39),
  },
  rear: {
    kicker: "REAR OPTICS / FLUSH",
    value: "0.00",
    unit: "mm",
    label: "镜组与背板完全平齐",
    anchor: new THREE.Vector3(CAMERA_CENTER.x, CAMERA_CENTER.y, -0.39),
  },
  side: {
    kicker: "PROFILE / UNIBODY",
    value: "7.6",
    unit: "mm",
    label: "3 枚按键 · 无断点钛中框",
    anchor: new THREE.Vector3(-3.74, 1.6, 0),
  },
  bottom: {
    kicker: "BOTTOM EDGE / I/O",
    value: "USB-C",
    unit: "",
    label: "3.2 Gen 2 · 10 Gbps · 3 枚按键",
    anchor: new THREE.Vector3(0, -8.05, 0.18),
  },
};

function updateHud() {
  if (!hudContent[state.mode]) return;
  const content = hudContent[state.mode];
  if (hudKicker) hudKicker.textContent = content.kicker;
  if (hudValue) hudValue.textContent = content.value;
  if (hudUnit) hudUnit.textContent = content.unit;
  if (hudLabel) hudLabel.textContent = content.label;
}

function updateViewButtons() {
  viewButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.view === state.mode));
  });
}

let pendingMode = null;
let pendingModeTimer = 0;

const projectedAnchor = new THREE.Vector3();
let heroScreenRect = null;
const glarePointer = { x: 0.5, y: 0.55, tx: 0.5, ty: 0.55 };

/* Spec figures count in on load; the camera bump counts down from the old
   3.2 mm to 0.00, which is the whole story of this phone in four digits. */
function runCountUps() {
  if (reduceMotion) return;
  document.querySelectorAll(".spec-num[data-count-to]").forEach((el, index) => {
    const to = parseFloat(el.dataset.countTo);
    const from = parseFloat(el.dataset.countFrom || "0");
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const duration = 1400;
    const startAt = performance.now() + 900 + index * 130;
    const tick = () => {
      const t = clamp((performance.now() - startAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (from + (to - from) * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* The blueprint draws itself while the section is in view. */
const blueprintFigure = document.querySelector(".blueprint");
let blueprintDrawables = null;
let blueprintWipes = null;
let blueprintTexts = null;
let blueprintQueued = false;

function initBlueprintDraw() {
  if (!blueprintFigure || reduceMotion || blueprintDrawables) return;
  const svg = blueprintFigure.querySelector("svg");
  if (!svg) return;
  blueprintDrawables = [...svg.querySelectorAll("line, path, circle, rect")].filter(
    (el) => !el.closest("defs") && el.getAttribute("stroke") && !el.getAttribute("stroke-dasharray")
  );
  blueprintWipes = [...svg.querySelectorAll("rect")].filter(
    (el) => !el.closest("defs") && el.getAttribute("fill") && !el.hasAttribute("stroke") && el.getAttribute("width") !== "1400"
  );
  blueprintTexts = [...svg.querySelectorAll("text")];
  blueprintDrawables.forEach((el) => {
    let length = 100;
    try { length = el.getTotalLength(); } catch (error) { /* keep the fallback */ }
    el.dataset.length = Math.max(length, 1);
    el.style.strokeDasharray = String(Math.max(length, 1));
  });
  blueprintFigure.classList.add("is-js-draw");
  updateBlueprintDraw();
  window.addEventListener("scroll", queueBlueprintDraw, { passive: true });
  window.addEventListener("resize", queueBlueprintDraw, { passive: true });
}

function queueBlueprintDraw() {
  if (blueprintQueued) return;
  blueprintQueued = true;
  requestAnimationFrame(() => {
    blueprintQueued = false;
    updateBlueprintDraw();
  });
}

function updateBlueprintDraw() {
  if (!blueprintDrawables || !blueprintFigure) return;
  const rect = blueprintFigure.getBoundingClientRect();
  const progress = clamp(
    (window.innerHeight * 0.88 - rect.top) / Math.max(rect.height, 1),
    0,
    1
  );

  blueprintDrawables.forEach((el, index) => {
    const start = (index / blueprintDrawables.length) * 0.45;
    const local = clamp((progress - start) / 0.55, 0, 1);
    el.style.strokeDashoffset = String(Number(el.dataset.length) * (1 - local));
  });

  blueprintWipes.forEach((el, index) => {
    const start = 0.32 + (index / Math.max(blueprintWipes.length, 1)) * 0.24;
    const local = clamp((progress - start) / 0.16, 0, 1);
    el.style.clipPath = `inset(0 ${((1 - local) * 100).toFixed(1)}% 0 0)`;
  });

  blueprintTexts.forEach((el, index) => {
    const start = 0.58 + (index / Math.max(blueprintTexts.length, 1)) * 0.3;
    const local = clamp((progress - start) / 0.12, 0, 1);
    el.style.opacity = String(local);
    el.style.transform = `translateY(${((1 - local) * 8).toFixed(1)}px)`;
  });
}

window.addEventListener(
  "pointermove",
  (event) => {
    const rect = heroScreenRect;
    if (!rect) return;
    glarePointer.tx = clamp(0.5 + (event.clientX - rect.cx) / (rect.w * 1.7), 0, 1);
    glarePointer.ty = clamp(0.5 - (event.clientY - rect.cy) / (rect.h * 1.7), 0, 1);
  },
  { passive: true }
);

function updateHudLeader() {
  if (!hud || !hudLeader || !hudPath || !hudDot || !phone || !camera) return;
  if (state.isStacked || window.innerWidth <= 1240) {
    hud.classList.remove("is-visible");
    hudLeader.classList.remove("is-visible");
    return;
  }

  const content = hudContent[state.mode];
  if (!content) return;

  projectedAnchor.copy(content.anchor).applyMatrix4(phone.matrixWorld);
  projectedAnchor.project(camera);

  const stageRect = stageElement.getBoundingClientRect();
  const hudRect = hud.getBoundingClientRect();
  const anchorX = (projectedAnchor.x * 0.5 + 0.5) * stageRect.width;
  const anchorY = (-projectedAnchor.y * 0.5 + 0.5) * stageRect.height;

  const offscreen =
    projectedAnchor.z > 1 ||
    projectedAnchor.z < -1 ||
    anchorX < -40 ||
    anchorX > stageRect.width + 40 ||
    anchorY < 0 ||
    anchorY > stageRect.height;

  const hudX = hudRect.left - stageRect.left;
  const hudY = hudRect.top - stageRect.top + hudRect.height * 0.42;
  const direction = hudX >= anchorX ? 1 : -1;
  const elbowX = hudX - 26 * direction;

  hudPath.setAttribute(
    "d",
    `M ${anchorX.toFixed(1)} ${anchorY.toFixed(1)} H ${(anchorX + 22 * direction).toFixed(1)} V ${hudY.toFixed(1)} H ${elbowX.toFixed(1)} H ${hudX.toFixed(1)}`
  );
  hudDot.setAttribute("cx", anchorX.toFixed(1));
  hudDot.setAttribute("cy", anchorY.toFixed(1));

  hud.classList.toggle("is-visible", !offscreen);
  hudLeader.classList.toggle("is-visible", !offscreen);
}

/* ------------------------------------------------------------------
   Layout
   ------------------------------------------------------------------ */

function resetCameraAndLayout() {
  if (!renderer || !camera || !phoneRig) return;
  const width = stageElement.clientWidth;
  const height = stageElement.clientHeight;
  if (!width || !height) return;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  const aspect = width / height;
  const isStacked = aspect <= 1.05;
  state.isStacked = isStacked;

  const fov = THREE.MathUtils.degToRad(camera.fov);
  let phonePixelHeight;
  let centerX;
  let centerY;
  let z;

  if (isStacked) {
    const copyRect = heroCopy.getBoundingClientRect();
    const controlsRect = stageControls.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();

    let top = copyRect.bottom + (window.innerWidth <= 680 ? 28 : 32);
    let bottom = controlsRect.top - (window.innerWidth <= 680 ? 16 : 28);
    bottom = Math.min(bottom, heroRect.bottom - 12);

    let available = bottom - top;
    if (available < 300) {
      available = Math.min(300, height * 0.5);
      top = Math.max(copyRect.bottom + 12, bottom - available);
    }

    phonePixelHeight = Math.min(available, width * 1.72, height * 0.62);
    phonePixelHeight = Math.max(phonePixelHeight, 250);
    centerY = top + available / 2;
    centerX = width / 2;
    z = (PHONE_HEIGHT * height) / (2 * Math.tan(fov / 2) * phonePixelHeight);
    heroScreenRect = { cx: centerX, cy: centerY, w: phonePixelHeight * 0.5, h: phonePixelHeight };
  } else {
    z = 40;
    const visibleHeight = 2 * z * Math.tan(fov / 2);
    const visibleWidth = visibleHeight * aspect;
    phonePixelHeight = (PHONE_HEIGHT / visibleHeight) * height;
    centerX = width * 0.66;
    centerY = height * 0.5;
    heroScreenRect = { cx: centerX, cy: centerY, w: phonePixelHeight * 0.5, h: phonePixelHeight };
    phoneRig.position.x = (0.66 - 0.5) * visibleWidth;
    phoneRig.position.y = 0;
  }

  camera.position.set(0, 0, z);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  if (isStacked) {
    const visibleHeight = 2 * z * Math.tan(fov / 2);
    phoneRig.position.x = 0;
    phoneRig.position.y = -(centerY / height - 0.5) * visibleHeight;
  }

  const orbitSize = Math.min(
    Math.max(phonePixelHeight * 0.87, 280),
    isStacked ? width * 0.96 : 590
  );
  orbit.style.left = `${centerX}px`;
  orbit.style.top = `${centerY}px`;
  orbit.style.width = `${orbitSize}px`;

  const shadowTop = centerY + phonePixelHeight * 0.47;
  phoneShadow.style.left = `${centerX}px`;
  phoneShadow.style.top = `${shadowTop}px`;
  phoneShadow.style.width = `${Math.max(phonePixelHeight * 0.4, 150)}px`;

  document.body.classList.toggle("is-stacked", isStacked);
}

let resizeQueued = false;
function queueResize() {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
    resizeQueued = false;
    resetCameraAndLayout();
  });
}

/* ------------------------------------------------------------------
   View controls / gestures
   ------------------------------------------------------------------ */

function flyTo(viewName) {
  state.lastInteractionAt = performance.now();
  const target = views[viewName];
  if (!target || state.isStacked === null) return;
  let targetY = target.y;
  const fullTurn = Math.PI * 2;
  targetY += Math.round((state.rotY - targetY) / fullTurn) * fullTurn;

  state.tween = {
    fromY: state.rotY,
    toY: targetY,
    fromX: state.rotX,
    toX: target.x,
    startedAt: performance.now(),
    duration: reduceMotion ? 1 : 980,
  };
  state.velocityY = 0;
  state.velocityX = 0;
}

function bindThreeInteractions() {
  viewButtons.forEach((button) => {
    button.addEventListener("click", () => flyTo(button.dataset.view));
  });

  modelElement.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (state.dragging) return;
    state.dragging = true;
    state.lastInteractionAt = performance.now();
    state.pointerId = event.pointerId;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.moved = 0;
    state.tween = null;
    state.velocityY = 0;
    state.velocityX = 0;
    modelElement.setPointerCapture(event.pointerId);
    modelElement.classList.add("is-dragging");
  });

  modelElement.addEventListener("pointermove", (event) => {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    const dx = event.clientX - state.lastX;
    const dy = event.clientY - state.lastY;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.moved += Math.abs(dx) + Math.abs(dy);

    if (state.moved > 2) {
      state.lastInteractionAt = performance.now();
      state.rotY += dx * 0.0072;
      state.rotX = clamp(state.rotX + dy * 0.0042, PITCH_MIN, PITCH_MAX);
      state.velocityY = clamp(dx * 0.0072, -0.07, 0.07);
      state.velocityX = clamp(dy * 0.003, -0.025, 0.025);
    }
  });

  const endDrag = (event) => {
    if (!state.dragging || (event.pointerId !== undefined && event.pointerId !== state.pointerId)) return;
    state.lastInteractionAt = performance.now();
    state.dragging = false;
    state.pointerId = null;
    modelElement.classList.remove("is-dragging");
    if (modelElement.hasPointerCapture?.(event.pointerId)) {
      modelElement.releasePointerCapture(event.pointerId);
    }
  };

  modelElement.addEventListener("pointerup", endDrag);
  modelElement.addEventListener("pointercancel", endDrag);

  modelElement.addEventListener(
    "keydown",
    (event) => {
      const key = event.key;
      let handled = true;
      state.lastInteractionAt = performance.now();

      if (key === "ArrowLeft" || key === "ArrowRight") {
        state.tween = null;
        state.rotY += key === "ArrowLeft" ? -0.22 : 0.22;
        state.velocityY = 0;
        state.velocityX = 0;
      } else if (key === "ArrowUp" || key === "ArrowDown") {
        state.tween = null;
        state.rotX = clamp(state.rotX + (key === "ArrowUp" ? -0.08 : 0.08), PITCH_MIN, PITCH_MAX);
      } else if (key === "1" || key === "Home") {
        flyTo("front");
      } else if (key === "2" || key === "End") {
        flyTo("rear");
      } else if (key === "3") {
        flyTo("side");
      } else if (key === "4") {
        flyTo("bottom");
      } else if (key === " " || key === "Enter") {
        flyTo(state.mode === "front" ? "rear" : "front");
      } else {
        handled = false;
      }

      if (handled) event.preventDefault();
    },
    { passive: false }
  );
}

let finishFlashTimer = null;

function applyFinish(key, { persist = true, silent = false } = {}) {
  const finish = FINISHES[key];
  if (!finish) return;
  state.finish = key;
  document.body.dataset.finish = key;

  finishButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.finish === key));
  });
  if (finishCurrent) finishCurrent.textContent = finish.label;

  const heroFinish = phone?.userData?.finish;
  if (heroFinish) {
    if (heroFinish.textures[key]) {
      heroFinish.back.map = heroFinish.textures[key];
      heroFinish.back.needsUpdate = true;
    }
    heroFinish.back.color.set(0xffffff);
    heroFinish.cap.color.set(finish.cap);
    heroFinish.rail.color.set(finish.rail);
    heroFinish.button.color.set(finish.button);
    heroFinish.wordmark.color.set(finish.wordmark);
    heroFinish.outline.color.set(finish.outline);
    heroFinish.emblem.color.set(finish.wordmark);
  }

  const anatomyFinish = anatomyRoot?.userData?.finish;
  if (anatomyFinish) {
    anatomyFinish.cap.color.set(finish.cap);
    anatomyFinish.rail.color.set(finish.rail);
    anatomyFinish.button.color.set(finish.button);
    anatomyFinish.rear.color.set(finish.rear);
  }

  if (persist) {
    try {
      window.localStorage.setItem("m67-finish", key);
    } catch (error) {
      // Local storage is optional.
    }
  }

  if (!silent && hero) {
    window.clearTimeout(finishFlashTimer);
    hero.classList.remove("is-finish-switching");
    void hero.offsetWidth;
    hero.classList.add("is-finish-switching");
    finishFlashTimer = window.setTimeout(() => {
      hero.classList.remove("is-finish-switching");
    }, 820);
  }
}

finishButtons.forEach((button) => {
  button.addEventListener("click", () => applyFinish(button.dataset.finish));
});

const hudYawValue = document.getElementById("hud-yaw");
const hudSpinValue = document.getElementById("hud-spin");
const hudShellValue = document.getElementById("hud-shell");
const hudRotor = document.getElementById("hud-ring-rotor");
const holoButton = document.querySelector("[data-holo]");
const finishNames = { obsidian: "OBSIDIAN", lunar: "LUNAR", ion: "ION" };
let hudRingClock = 0;

function updateHudRing(delta) {
  if (!hudYawValue) return;
  hudRingClock += delta;
  if (hudRingClock < 0.12) return;
  hudRingClock = 0;
  const yawDeg = ((state.rotY * 57.29578) % 360 + 360) % 360;
  hudYawValue.textContent = `${String(Math.round(yawDeg) % 360).padStart(3, "0")}°`;
  hudSpinValue.textContent = (state.spinLevel * 0.26 * 57.29578).toFixed(1);
  hudShellValue.textContent = holoOn ? "HOLO" : finishNames[document.body.dataset.finish] || "OBSIDIAN";
  if (hudRotor && !reduceMotion) {
    hudRotor.setAttribute("transform", `rotate(${(-yawDeg / 2).toFixed(2)} 100 100)`);
  }
}

if (holoButton) {
  holoButton.addEventListener("click", () => {
    holoOn = !holoOn;
    holoButton.setAttribute("aria-pressed", String(holoOn));
    document.body.dataset.holo = holoOn ? "on" : "off";
    state.lastInteractionAt = performance.now();
  });
}

/* ------------------------------------------------------------------
   Anatomy / scroll-driven exploded view
   ------------------------------------------------------------------ */

const anatomySection = document.getElementById("anatomy");
const anatomyStage = document.getElementById("anatomy-stage");
const anatomyCanvas = document.getElementById("anatomy-canvas");
const anatomyFallback = document.getElementById("anatomy-fallback");
const anatomyAxis = document.getElementById("anatomy-axis");
const anatomyAxisLine = document.getElementById("anatomy-axis-line");
const anatomyAxisStart = document.getElementById("anatomy-axis-start");
const anatomyAxisEnd = document.getElementById("anatomy-axis-end");
// The axis caption was removed from the markup; the callouts carry the labels.
/* Callouts: a dot on the part, a leader line out of the stack and a small
   label in the margin — the way an exploded drawing annotates itself. The
   order matches the teardown order of the layers above. */
const ANATOMY_PARTS = [
  { no: "01", name: "屏幕总成" },
  { no: "02", name: "电池" },
  { no: "03", name: "主板" },
  { no: "04", name: "影像模组" },
  { no: "05", name: "无线充电板" },
  { no: "06", name: "一体后壳" },
];

const calloutLayer = document.getElementById("anatomy-callouts");
const calloutLineSvg = document.getElementById("callout-lines");
const calloutDotSvg = document.getElementById("callout-dots");
const calloutLabelBox = document.getElementById("callout-labels");
const calloutPaths = [];
const calloutDots = [];
const calloutLabels = [];
let calloutsBuilt = false;
let calloutLabelWidth = 78;

function buildCallouts() {
  if (calloutsBuilt || !calloutLineSvg || !calloutDotSvg || !calloutLabelBox) return;
  calloutsBuilt = true;
  const ns = "http://www.w3.org/2000/svg";

  ANATOMY_PARTS.forEach((part) => {
    const path = document.createElementNS(ns, "path");
    path.setAttribute("class", "callout-line");
    calloutLineSvg.appendChild(path);
    calloutPaths.push(path);

    const dot = document.createElementNS(ns, "circle");
    dot.setAttribute("class", "callout-dot");
    dot.setAttribute("r", "2.6");
    calloutDotSvg.appendChild(dot);
    calloutDots.push(dot);

    const label = document.createElement("span");
    label.className = "callout-label";
    const number = document.createElement("b");
    number.textContent = part.no;
    const name = document.createElement("i");
    name.textContent = part.name;
    label.append(number, name);
    calloutLabelBox.appendChild(label);
    calloutLabels.push(label);
  });

  requestAnimationFrame(measureCallouts);
}

/* Label widths drive the gutter on both sides, so they are measured once
   instead of every frame. */
function measureCallouts() {
  if (!calloutsBuilt) return;
  let widest = 0;
  calloutLabels.forEach((label) => {
    widest = Math.max(widest, label.offsetWidth);
  });
  if (widest > 0) calloutLabelWidth = widest;
}
const anatomyPhase = document.getElementById("anatomy-phase");
const anatomyPercent = document.getElementById("anatomy-percent");
const anatomyProgressBar = document.getElementById("anatomy-progress-bar");
const anatomyProgressElement = document.getElementById("anatomy-progress");
const anatomyCue = document.getElementById("anatomy-cue");
const anatomyOrbit = document.querySelector(".anatomy-orbit");
const anatomyHead = document.querySelector(".anatomy-head");
const anatomyLegend = document.querySelector(".anatomy-legend");

let anatomyRenderer;
let anatomyScene;
let anatomyCamera;
let anatomyRoot;
let anatomyLayers = [];
let anatomyInitialized = false;
let anatomyVisible = false;
let anatomyFirstRender = true;
let anatomyTargetProgress = 0;
let anatomyCurrentProgress = 0;
let anatomyLastFrameTime = performance.now();
let anatomyLayout = null;
let anatomyLastPhase = "";
let anatomyLastPercent = -1;

const anatomyProjection = new THREE.Vector3();

/* Dashed line from the under-display camera through the panel it looks
   through. Rebuilt every frame because both ends ride on moving layers. */
let udcAxis = null;
const udcAxisStart = new THREE.Vector3();
const udcAxisEnd = new THREE.Vector3();

/* The logic board is an L: a full-width strip along the top plus a column down
   the right side, so the camera module has somewhere to live. The texture is
   drawn against that bounding box, which means the lower-left quadrant is the
   cut-away notch and stays empty. */
function makeBoardTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 610;
  const context = canvas.getContext("2d");

  const NOTCH_X = 420;
  const NOTCH_Y = 390;
  const inNotch = (x, y) => x < NOTCH_X && y > NOTCH_Y;

  const base = context.createLinearGradient(0, 0, 620, 610);
  base.addColorStop(0, "#1c4436");
  base.addColorStop(0.55, "#14342a");
  base.addColorStop(1, "#0e2720");
  context.fillStyle = base;
  context.fillRect(0, 0, 640, 610);

  let seed = 937;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Routing: short orthogonal runs, the way copper actually travels on a PCB.
  context.save();
  context.lineCap = "square";
  for (let index = 0; index < 60; index += 1) {
    const x = 18 + random() * 604;
    const y = 18 + random() * 574;
    if (inNotch(x, y)) continue;
    const gold = random() > 0.62;
    context.strokeStyle = gold ? "rgba(196, 150, 86, 0.42)" : "rgba(112, 168, 148, 0.24)";
    context.lineWidth = gold ? 1.5 : 1;
    const runX = (random() > 0.5 ? 1 : -1) * (30 + random() * 110);
    const runY = (random() > 0.5 ? 1 : -1) * (24 + random() * 90);
    context.beginPath();
    context.moveTo(x, y);
    if (random() > 0.5) {
      context.lineTo(x + runX, y);
      context.lineTo(x + runX, y + runY);
    } else {
      context.lineTo(x, y + runY);
      context.lineTo(x + runX, y + runY);
    }
    context.stroke();
  }
  context.restore();

  // Via field around the SoC.
  context.fillStyle = "rgba(206, 168, 104, 0.6)";
  for (let index = 0; index < 90; index += 1) {
    const x = 440 + random() * 180;
    const y = 40 + random() * 300;
    context.beginPath();
    context.arc(x, y, 1.3 + random() * 1.8, 0, Math.PI * 2);
    context.fill();
  }

  // Silkscreen blocks for the shield cans, matching the 3D parts above them.
  context.strokeStyle = "rgba(214, 229, 218, 0.22)";
  context.lineWidth = 2;
  context.strokeRect(452, 60, 168, 176);
  context.strokeRect(120, 232, 116, 108);
  context.strokeRect(452, 430, 96, 132);

  context.fillStyle = "rgba(214, 229, 218, 0.34)";
  context.font = '400 12px "Source Code Pro", monospace';
  context.letterSpacing = "2.4px";
  context.fillText("SOC / LPDDR5X", 458, 252);
  context.fillText("RF / 01", 124, 356);
  context.fillText("PMIC / 02", 456, 578);

  // Board identity, top-left of the strip.
  context.textAlign = "left";
  context.fillStyle = "rgba(226, 240, 233, 0.72)";
  context.font = '500 30px "Source Code Pro", monospace';
  context.letterSpacing = "5px";
  context.fillText("M67 · X2", 30, 62);
  context.font = '400 14px "Source Code Pro", monospace';
  context.letterSpacing = "2.6px";
  context.fillStyle = "rgba(204, 224, 214, 0.4)";
  context.fillText("3 nm · 16 GB · LOGIC BOARD 04", 30, 86);

  // Under-display camera footprint, dead centre of the top edge.
  const udcX = 274;
  context.strokeStyle = "rgba(127, 255, 226, 0.34)";
  context.lineWidth = 1.4;
  context.beginPath();
  context.arc(udcX, 54, 22, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.arc(udcX, 54, 12, 0, Math.PI * 2);
  context.stroke();
  context.textAlign = "center";
  context.fillStyle = "rgba(178, 246, 233, 0.6)";
  context.font = '400 11px "Source Code Pro", monospace';
  context.letterSpacing = "3px";
  context.fillText("UDC / 32MP", udcX, 96);
  context.textAlign = "left";

  // Connector footprints along the lower edge of the strip.
  context.fillStyle = "rgba(198, 208, 198, 0.5)";
  for (let index = 0; index < 26; index += 1) {
    context.fillRect(60 + index * 11, 352, 5, 16);
  }
  context.fillStyle = "rgba(190, 200, 190, 0.34)";
  for (let index = 0; index < 18; index += 1) {
    context.fillRect(452 + index * 9, 588, 5, 12);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* Battery wrap. The label covers most of the cell, the way a real pouch cell
   is wrapped, so the typography has to survive being seen at a shallow angle
   inside the exploded stack: one big number, everything else quiet. */
function makeBatteryLabelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 440;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 512, 440);

  // Printed wrap, sitting on the silver pouch as an opaque panel.
  context.fillStyle = "rgba(11, 17, 19, 0.94)";
  context.beginPath();
  context.roundRect(3, 3, 506, 434, 16);
  context.fill();
  context.strokeStyle = "rgba(160, 200, 190, 0.16)";
  context.lineWidth = 2;
  context.stroke();

  context.textAlign = "left";

  // Thin printed rule along the top, then the cell identity.
  context.strokeStyle = "rgba(178, 226, 213, 0.26)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(30, 30);
  context.lineTo(482, 30);
  context.stroke();

  context.fillStyle = "rgba(214, 243, 234, 0.72)";
  context.font = '500 17px "Source Code Pro", monospace';
  context.letterSpacing = "7px";
  context.fillText("M67 · CELL", 30, 62);

  context.textAlign = "right";
  context.font = '400 12px "Source Code Pro", monospace';
  context.letterSpacing = "3px";
  context.fillStyle = "rgba(198, 236, 224, 0.42)";
  context.fillText("03 / BATTERY", 482, 62);
  context.textAlign = "left";

  // The one number that matters.
  context.fillStyle = "rgba(224, 250, 241, 0.94)";
  context.font = '300 118px "Noto Serif SC", STSong, serif';
  context.letterSpacing = "-6px";
  context.fillText("5,200", 26, 176);

  context.fillStyle = "rgba(178, 232, 216, 0.78)";
  context.font = '400 24px "Source Code Pro", monospace';
  context.letterSpacing = "3px";
  context.fillText("mAh", 336, 176);
  context.fillStyle = "rgba(178, 232, 216, 0.42)";
  context.font = '400 13px "Source Code Pro", monospace';
  context.letterSpacing = "2px";
  context.fillText("LI-ION POLYMER", 336, 198);

  context.strokeStyle = "rgba(167, 220, 207, 0.22)";
  context.beginPath();
  context.moveTo(30, 214);
  context.lineTo(482, 214);
  context.stroke();

  const rows = [
    ["CAPACITY", "19.6 Wh / 7.6 V"],
    ["CELLS", "2 × 2,600 mAh"],
    ["CHARGE", "80 W WIRED · 50 W WIRELESS"],
  ];
  rows.forEach(([key, value], index) => {
    const y = 248 + index * 30;
    context.fillStyle = "rgba(178, 220, 208, 0.32)";
    context.font = '400 11px "Source Code Pro", monospace';
    context.letterSpacing = "2.6px";
    context.fillText(key, 30, y);
    context.fillStyle = "rgba(214, 240, 231, 0.7)";
    context.font = '400 14px "Source Code Pro", monospace';
    context.letterSpacing = "1.4px";
    context.fillText(value, 132, y);
  });

  // Data matrix, drawn as noise so it reads as a code without faking one.
  let seed = 613;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const codeX = 30;
  const codeY = 342;
  const cell = 7;
  context.fillStyle = "rgba(206, 238, 228, 0.5)";
  for (let row = 0; row < 10; row += 1) {
    for (let column = 0; column < 10; column += 1) {
      if (random() > 0.52) context.fillRect(codeX + column * cell, codeY + row * cell, cell - 1.5, cell - 1.5);
    }
  }

  context.fillStyle = "rgba(192, 233, 221, 0.4)";
  context.font = '400 12px "Source Code Pro", monospace';
  context.letterSpacing = "2px";
  context.fillText("MONOLITH ENERGY", 132, 366);
  context.fillStyle = "rgba(192, 233, 221, 0.24)";
  context.fillText("M67-B52 · 2026 · CN", 132, 388);
  context.fillText("DO NOT PUNCTURE", 132, 410);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeRearLabelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, 512, 128);
  context.textAlign = "center";
  context.fillStyle = "rgba(214, 196, 169, 0.7)";
  context.font = '500 26px "Source Code Pro", monospace';
  context.letterSpacing = "8px";
  context.fillText("WIRELESS / 50W", 256, 60);
  context.font = '400 14px "Source Code Pro", monospace';
  context.letterSpacing = "4px";
  context.fillStyle = "rgba(214, 196, 169, 0.4)";
  context.fillText("MAGNETIC ARRAY · M67", 256, 88);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function extrudedRoundedGeometry(width, height, radius, depth, bevel = 0.025) {
  const geometry = new THREE.ExtrudeGeometry(roundedRectShape(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 32,
    steps: 1,
  });
  geometry.center();
  return geometry;
}

/* Layer stack of the exploded view.
   Positions, thicknesses and clearances are in body units (1 unit = 10 mm,
   body depth 0.76 = 7.6 mm), so the numbers below are the real millimetres
   divided by ten.

   gapScale weights the clearance between a layer and the one closer to the
   middle of the stack. The camera module belongs against the logic board
   (it is clipped over it in a real phone), while the rear glass gets its own
   corridor so the lens holes never sit behind the module in projection. */
const ANATOMY_STACK = {
  display: { baseZ: 0.31, thickness: 0.14, gapScale: 1.0, anchor: new THREE.Vector3(0, 2.2, 0.04) },
  battery: { baseZ: -0.1, thickness: 0.4, gapScale: 1.0, anchor: new THREE.Vector3(1.9, -4.3, 0.21) },
  board: { baseZ: -0.07, thickness: 0.1, gapScale: 1.0, anchor: new THREE.Vector3(2.55, 5.0, 0.17) },
  camera: { baseZ: -0.16, thickness: 0.36, gapScale: 0.72, anchor: new THREE.Vector3(-2.15, 4.92, 0.19) },
  plate: { baseZ: -0.36, thickness: 0.05, gapScale: 1.0, anchor: new THREE.Vector3(0, -5.0, 0.03) },
  frame: { baseZ: -0.05, thickness: 0.58, gapScale: 0.45, anchor: new THREE.Vector3(3.58, 1.1, 0.06) },
};

function createAnatomyPhone() {
  const root = new THREE.Group();
  root.rotation.order = "YXZ";

  const layers = [];
  const addLayer = (key) => {
    const config = ANATOMY_STACK[key];
    const group = new THREE.Group();
    group.position.z = config.baseZ;
    group.name = key;
    root.add(group);
    layers.push({
      key,
      group,
      baseZ: config.baseZ,
      thickness: config.thickness,
      gapScale: config.gapScale,
      anchor: config.anchor,
    });
    return group;
  };

  const display = addLayer("display");
  const battery = addLayer("battery");
  const board = addLayer("board");
  const cameraModule = addLayer("camera");
  const plate = addLayer("plate");
  const frame = addLayer("frame");

  const blackGlass = new THREE.MeshPhysicalMaterial({
    color: 0x020304,
    metalness: 0.2,
    roughness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    side: THREE.DoubleSide,
    envMapIntensity: 0.8,
  });

  const titaniumCap = new THREE.MeshPhysicalMaterial({
    color: 0x515654,
    metalness: 0.66,
    roughness: 0.48,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.28,
  });

  const titaniumRail = new THREE.MeshPhysicalMaterial({
    color: 0xc2c5bf,
    metalness: 0.45,
    roughness: 0.52,
    clearcoat: 0.15,
    envMapIntensity: 0.22,
  });

  const silver = new THREE.MeshPhysicalMaterial({
    color: 0xd2d7d1,
    metalness: 1,
    roughness: 0.16,
    envMapIntensity: 1.55,
  });

  const darkMetal = new THREE.MeshPhysicalMaterial({
    color: 0x252b2d,
    metalness: 0.9,
    roughness: 0.28,
    envMapIntensity: 1.1,
  });

  const copper = new THREE.MeshStandardMaterial({
    color: 0xb16a3f,
    metalness: 0.82,
    roughness: 0.36,
    envMapIntensity: 1.15,
  });

  // Flexible printed circuits: warmer and more matte than bare copper.
  const flexFilm = new THREE.MeshStandardMaterial({
    color: 0xc08a4e,
    metalness: 0.55,
    roughness: 0.55,
    side: THREE.DoubleSide,
    envMapIntensity: 0.8,
  });

  const graphite = new THREE.MeshStandardMaterial({
    color: 0x161b1c,
    metalness: 0.3,
    roughness: 0.62,
  });

  const rubber = new THREE.MeshStandardMaterial({
    color: 0x101312,
    metalness: 0.05,
    roughness: 0.85,
  });

  const aluminium = new THREE.MeshPhysicalMaterial({
    color: 0x9aa09b,
    metalness: 0.5,
    roughness: 0.5,
    clearcoat: 0.15,
    envMapIntensity: 0.28,
  });

  const plastic = new THREE.MeshPhysicalMaterial({
    color: 0xb9b6ad,
    metalness: 0,
    roughness: 0.62,
    clearcoat: 0.2,
  });

  const pcb = new THREE.MeshPhysicalMaterial({
    color: 0x17392c,
    metalness: 0.15,
    roughness: 0.55,
    clearcoat: 0.25,
  });

  const chipBlack = new THREE.MeshPhysicalMaterial({
    color: 0x070a0a,
    metalness: 0.35,
    roughness: 0.42,
  });

  const capacitorMaterial = new THREE.MeshStandardMaterial({
    color: 0xb9b8a9,
    metalness: 0.45,
    roughness: 0.5,
  });

  const shieldMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb4b9b2,
    metalness: 0.85,
    roughness: 0.44,
    clearcoat: 0.15,
    envMapIntensity: 0.8,
  });

  const connectorMaterial = new THREE.MeshStandardMaterial({
    color: 0xc0a465,
    metalness: 0.8,
    roughness: 0.3,
  });

  const rearGlass = new THREE.MeshPhysicalMaterial({
    color: 0x151b1d,
    metalness: 0.28,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.055,
    envMapIntensity: 1.2,
    iridescence: 0.16,
    iridescenceIOR: 1.26,
    iridescenceThicknessRange: [110, 320],
    side: THREE.DoubleSide,
  });

  /* 01 — Display assembly --------------------------------------------
     Cover glass, touch/OLED substrate and a copper heat shield, bonded as
     one unit. The driver IC hangs off the bottom edge and the flex tails
     fold back through the frame. */
  const copperShield = new THREE.Mesh(
    extrudedRoundedGeometry(6.94, 15.4, 0.9, 0.018, 0.005),
    copper
  );
  copperShield.position.z = -0.059;
  display.add(copperShield);

  const displaySubstrate = new THREE.Mesh(
    extrudedRoundedGeometry(7.3, 15.9, 1.1, 0.05, 0.014),
    blackGlass
  );
  displaySubstrate.position.z = -0.006;
  display.add(displaySubstrate);

  const displayPanel = new THREE.Mesh(
    flatShapeGeometry(roundedRectShape(7.18, 15.62, 1.02), 7.18, 15.62, 64),
    new THREE.MeshBasicMaterial({
      map: screenTexture,
      toneMapped: false,
    })
  );
  displayPanel.position.z = 0.038;
  display.add(displayPanel);

  const displayGlint = new THREE.Mesh(
    flatShapeGeometry(roundedRectShape(7.18, 15.62, 1.02), 7.18, 15.62, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.05,
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  displayGlint.position.z = 0.044;
  display.add(displayGlint);

  // Display driver IC, on the back of the panel below the visible area.
  const driverIc = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.03), chipBlack);
  driverIc.position.set(0, -6.72, -0.03);
  display.add(driverIc);

  [-0.66, 0.66].forEach((x) => {
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 1.1), flexFilm);
    tail.position.set(x, -7.28, -0.052);
    display.add(tail);
  });

  /* 02 — Titanium midframe -------------------------------------------
     The chassis everything else bolts to. In a real phone the frame is not
     a hollow picture frame: it has ribs, screw bosses, a gasket channel and
     the plastic antenna breaks moulded into the rail. */
  const frameShape = roundedRectShape(7.48, 16.12, 1.16);
  frameShape.holes.push(roundedRectShape(7.06, 15.7, 0.94));
  const frameGeometry = new THREE.ExtrudeGeometry(frameShape, {
    depth: 0.52,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.024,
    bevelSegments: 4,
    curveSegments: 40,
    steps: 1,
  });
  frameGeometry.center();
  const frameMesh = new THREE.Mesh(frameGeometry, [titaniumCap, titaniumRail]);
  frame.add(frameMesh);

  // Gasket channel, sitting just inside the front face.
  const gasketShape = roundedRectShape(7.04, 15.68, 0.93);
  gasketShape.holes.push(roundedRectShape(6.84, 15.48, 0.86));
  const gasket = new THREE.Mesh(flatShapeGeometry(gasketShape, 7.04, 15.68, 40), rubber);
  gasket.position.z = 0.284;
  frame.add(gasket);

  // The titanium rail is diffusion-bonded to an aluminium inner chassis; the
  // lip is what you see around the cavity once the display is off.
  const lipShape = roundedRectShape(7.34, 15.98, 1.04);
  lipShape.holes.push(roundedRectShape(7.06, 15.7, 0.94));
  const innerLip = new THREE.Mesh(flatShapeGeometry(lipShape, 7.34, 15.98, 40), aluminium);
  innerLip.position.z = 0.262;
  frame.add(innerLip);

  // Cross ribs stiffening the cavity.
  [
    [-1.2, 3.6, 3.2, 0.14],
    [-1.2, -3.9, 3.2, 0.14],
    [2.9, 0.2, 0.14, 3.4],
  ].forEach(([x, y, width, height]) => {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.09), titaniumCap);
    rib.position.set(x, y, -0.16);
    frame.add(rib);
  });

  // Screw bosses.
  [[-3.02, -6.9], [3.02, -6.9], [-3.02, 6.9], [3.02, 6.9], [-3.02, 2.0], [3.02, -2.2]].forEach(
    ([x, y]) => {
      const boss = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.12, 18), titaniumCap);
      boss.rotation.x = Math.PI / 2;
      boss.position.set(x, y, 0.2);
      frame.add(boss);
    }
  );

  // Plastic antenna breaks moulded into the rail.
  [
    [0, 7.9, 6.4, 0.16],
    [0, -7.9, 6.4, 0.16],
    [3.66, 5.2, 0.14, 1.4],
  ].forEach(([x, y, width, height]) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.2), plastic);
    strip.position.set(x, y, 0);
    frame.add(strip);
  });

  const buttonMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x9da19b,
    metalness: 1,
    roughness: 0.26,
    envMapIntensity: 1.5,
  });
  const volumeUp = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.62, 5, 14), buttonMaterial);
  volumeUp.position.set(-3.765, 2.7, 0);
  frame.add(volumeUp);
  const volumeDown = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.62, 5, 14), buttonMaterial);
  volumeDown.position.set(-3.765, 1.86, 0);
  frame.add(volumeDown);
  const power = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 1.0, 5, 14), buttonMaterial);
  power.position.set(3.765, 2.48, 0);
  frame.add(power);

  // SIM tray on the left rail, below the volume rocker.
  // Dual-SIM tray, China-market style: one nano-SIM on each face of the sled,
  // contacts facing outward, so two cards share a single cut-out in the rail.
  const simTray = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.0, 0.34), aluminium);
  simTray.position.set(-3.2, -0.4, 0);
  frame.add(simTray);
  const simCards = [];
  [1, -1].forEach((side) => {
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.78, 0.02), chipBlack);
    pocket.position.set(-3.1, -0.4, side * 0.19);
    frame.add(pocket);
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.68, 0.045), connectorMaterial);
    card.position.set(-3.1, -0.4, side * 0.235);
    frame.add(card);
    simCards.push({ mesh: card, side, base: 0.235 });
  });
  root.userData.simCards = simCards;
  const simTrayLip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.08, 0.44), titaniumCap);
  simTrayLip.position.set(-3.715, -0.4, 0);
  frame.add(simTrayLip);
  const simPin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12), graphite);
  simPin.position.set(-3.72, 0.06, 0);
  simPin.rotation.z = Math.PI / 2;
  frame.add(simPin);

  // Earpiece at the top edge; loudspeaker, haptic and charging board at the
  // bottom. They are separate parts in different corners, not one block.
  const earpiece = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.16), darkMetal);
  earpiece.position.set(0, 7.42, 0.12);
  frame.add(earpiece);

  const speakerBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.46, 0.3), darkMetal);
  speakerBox.position.set(1.95, -7.32, 0.05);
  frame.add(speakerBox);
  const speakerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 24), graphite);
  speakerMesh.rotation.x = Math.PI / 2;
  speakerMesh.position.set(1.95, -7.32, 0.21);
  frame.add(speakerMesh);

  // Taptic Engine: a wide rectangular LRA, not a capsule motor.
  const haptic = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.62, 0.34), darkMetal);
  haptic.position.set(-2.45, -6.35, 0.05);
  frame.add(haptic);
  const hapticCap = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.14, 0.03), silver);
  hapticCap.position.set(-2.45, -6.35, 0.23);
  frame.add(hapticCap);

  // Charging-port daughterboard, the last thing out in a teardown.
  const subBoard = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.56, 0.07), pcb);
  subBoard.position.set(-0.15, -7.3, 0.06);
  frame.add(subBoard);
  const subConnector = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.14, 0.05), connectorMaterial);
  subConnector.position.set(-0.15, -7.02, 0.09);
  frame.add(subConnector);
  const subBoardFlex = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 3.4), flexFilm);
  subBoardFlex.position.set(0.8, -5.4, 0.1);
  frame.add(subBoardFlex);

  const portDark = new THREE.MeshBasicMaterial({ color: 0x020304, side: THREE.DoubleSide });
  const portTongue = new THREE.MeshPhysicalMaterial({
    color: 0x3e4547,
    metalness: 0.85,
    roughness: 0.34,
    side: THREE.DoubleSide,
  });
  const portScrew = new THREE.MeshPhysicalMaterial({
    color: 0x8a8e88,
    metalness: 1,
    roughness: 0.32,
  });
  frame.add(
    createBottomEdgeDetails({
      rim: titaniumRail,
      barrel: portTongue,
      dark: portDark,
      screw: portScrew,
    })
  );
  frame.add(createAntennaBands(portDark));

  /* 03 — Battery -----------------------------------------------------
     A stepped pouch cell taking the middle and lower half of the cavity,
     with the top-right corner cut away for the charging board flex. */
  const batteryShape = roundedPolygonShape(
    [
      [-2.3, 2.15],
      [0.75, 2.15],
      [0.75, -1.55],
      [3.4, -1.55],
      [3.4, -7.0],
      [-3.4, -7.0],
      [-3.4, -1.55],
      [-2.3, -1.55],
    ],
    0.16
  );
  const batteryGeometry = new THREE.ExtrudeGeometry(batteryShape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: 32,
    steps: 1,
  });
  batteryGeometry.translate(0, 0, -0.17);
  const batteryMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x737b82,
    metalness: 0.5,
    roughness: 0.42,
    clearcoat: 0.35,
    clearcoatRoughness: 0.34,
    envMapIntensity: 0.85,
  });
  const batteryBody = new THREE.Mesh(batteryGeometry, batteryMaterial);
  battery.add(batteryBody);

  const batteryLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 4.5),
    new THREE.MeshBasicMaterial({
      map: makeBatteryLabelTexture(),
      transparent: true,
      depthWrite: false,
    })
  );
  batteryLabel.position.set(-0.35, -4.35, 0.202);
  battery.add(batteryLabel);

  // Protection circuit board across the top of the cell, plus its connector.
  const batteryBms = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.26, 0.05), chipBlack);
  batteryBms.position.set(-0.85, 1.88, 0.185);
  battery.add(batteryBms);
  const batteryConnector = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.09), connectorMaterial);
  batteryConnector.position.set(0.42, 1.86, 0.19);
  battery.add(batteryConnector);

  // Stretch-release pull tabs, the way the cell is actually removed.
  [-2.0, 1.9].forEach((x) => {
    const tab = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.6), plastic);
    tab.position.set(x, -7.06, -0.17);
    battery.add(tab);
  });
  const topTab = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.6), plastic);
  topTab.position.set(-1.0, 2.2, 0.17);
  battery.add(topTab);

  /* 04 — Logic board -------------------------------------------------
     L-shaped and double-stacked: a main PCB that wraps around the camera
     module, with a second board piggybacked over the SoC area. */
  const boardPath = [
    [-3.5, 3.45],
    [-0.72, 3.45],
    [-0.72, 6.55],
    [3.5, 6.55],
    [3.5, -1.2],
    [1.35, -1.2],
    [1.35, 2.35],
    [-2.55, 2.35],
    [-2.55, -1.4],
    [-3.5, -1.4],
  ];
  const boardShape = roundedPolygonShape(boardPath, 0.14);
  const boardGeometry = new THREE.ExtrudeGeometry(boardShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 2,
    curveSegments: 24,
    steps: 1,
  });
  boardGeometry.translate(0, 0, -0.03);
  const boardBody = new THREE.Mesh(boardGeometry, pcb);
  board.add(boardBody);

  const boardArt = new THREE.Mesh(
    flatShapeGeometry(roundedPolygonShape(boardPath.map(([x, y]) => [x * 0.975, y * 0.975]), 0.12), 0, 0, 24),
    new THREE.MeshStandardMaterial({
      map: makeBoardTexture(),
      roughness: 0.55,
      metalness: 0.08,
    })
  );
  boardArt.position.z = 0.047;
  board.add(boardArt);

  // Piggybacked second board over the SoC, as on a modern stacked mainboard.
  const upperBoard = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.1, 0.045), pcb);
  upperBoard.position.set(1.85, 4.55, 0.1);
  board.add(upperBoard);
  const boardFence = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.07, 0.12), shieldMaterial);
  boardFence.position.set(1.85, 3.52, 0.1);
  board.add(boardFence);

  // Shield cans: the large one sits on the piggybacked board, the rest on the
  // main PCB. Positions stay clear of the stacked board so nothing intersects.
  const shields = [
    [1.85, 4.6, 2.55, 1.75, 0.08, 0.11],
    [-0.25, 3.35, 0.9, 1.1, 0.09, 0.135],
    [2.95, 1.05, 0.8, 1.4, 0.1, 0.14],
    [2.55, 6.15, 1.3, 0.55, 0.09, 0.135],
  ];
  shields.forEach(([x, y, width, height, depth, centerZ]) => {
    const shield = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), shieldMaterial);
    shield.position.set(x, y, centerZ);
    board.add(shield);
  });

  const chipPositions = [
    [3.2, 3.0, 0.28, 0.24],
    [2.6, 0.6, 0.2, 0.18],
    [-0.35, 4.9, 0.3, 0.24],
    [0.55, 2.62, 0.22, 0.18],
  ];
  chipPositions.forEach(([x, y, width, height]) => {
    const chip = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.07), chipBlack);
    chip.position.set(x, y, 0.085);
    board.add(chip);
  });

  for (let index = 0; index < 9; index += 1) {
    const capacitor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.09, 12),
      capacitorMaterial
    );
    capacitor.rotation.x = Math.PI / 2;
    capacitor.position.set(0.08 + index * 0.24, 2.76, 0.09);
    board.add(capacitor);
  }

  // Board-to-board connectors around the edge: display, battery, sub-board,
  // camera. Every one of these has a matching flex on another layer.
  const boardConnectors = [
    [2.15, -0.06, 1.25, 0.16],
    [2.35, 0.32, 0.22, 0.6],
    [1.2, 6.3, 0.5, 0.12],
    [3.28, 4.2, 0.14, 0.7],
  ];
  boardConnectors.forEach(([x, y, width, height]) => {
    const connector = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.1), connectorMaterial);
    connector.position.set(x, y, 0.09);
    board.add(connector);
  });

  const boardCover = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 0.03), shieldMaterial);
  boardCover.position.set(2.42, -0.72, 0.19);
  board.add(boardCover);
  [-0.72, 0, 0.72].forEach((dx) => {
    [-0.2, 0.2].forEach((dy) => {
      const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.018, 10), silver);
      screw.rotation.x = Math.PI / 2;
      screw.position.set(2.42 + dx, -0.72 + dy, 0.205);
      board.add(screw);
    });
  });

  // Double-sided reader: a shield plate above and below the slot, each with
  // its own row of contacts, so the tray can be read from either face.
  [0.2, 0.03].forEach((z) => {
    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.18, 0.028), shieldMaterial);
    shell.position.set(-3.0, -0.4, z);
    board.add(shell);
    const contacts = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.84, 0.014), connectorMaterial);
    contacts.position.set(-3.0, -0.4, z + (z > 0.1 ? -0.02 : 0.02));
    board.add(contacts);
  });
  const simReaderWall = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.18, 0.2), shieldMaterial);
  simReaderWall.position.set(-3.38, -0.4, 0.115);
  board.add(simReaderWall);
  const simSlot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.92, 0.13), chipBlack);
  simSlot.position.set(-2.62, -0.4, 0.115);
  board.add(simSlot);

  // Under-display selfie camera: a bracket-mounted module sitting behind the
  // active area, not a punch hole. Its optical axis is drawn in the scene so
  // the relationship to the panel is unmistakable.
  const udc = new THREE.Group();
  udc.position.set(0, 6.05, 0.1);
  const udcBracket = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.94, 0.05), darkMetal);
  udcBracket.position.z = -0.06;
  udc.add(udcBracket);
  const udcScrew = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 10), silver);
  udcScrew.rotation.x = Math.PI / 2;
  udcScrew.position.set(0.38, 0.38, -0.03);
  udc.add(udcScrew);
  const udcBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.09, 32), silver);
  udcBarrel.rotation.x = Math.PI / 2;
  udc.add(udcBarrel);
  const udcLens = new THREE.Mesh(
    new THREE.CircleGeometry(0.185, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0x061a25,
      metalness: 0.35,
      roughness: 0.08,
      clearcoat: 1,
      emissive: 0x062d3a,
      emissiveIntensity: 0.2,
      side: THREE.DoubleSide,
    })
  );
  udcLens.position.z = 0.052;
  udc.add(udcLens);
  const udcRing = new THREE.Mesh(new THREE.RingGeometry(0.185, 0.215, 32), silver);
  udcRing.position.z = 0.05;
  udc.add(udcRing);
  const udcFlex = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.8), flexFilm);
  udcFlex.position.set(0.38, -0.72, 0.04);
  udc.add(udcFlex);
  board.add(udc);

  /* 05 — Camera module -----------------------------------------------
     Three barrels on an L. The lenses face the rear glass — which is the
     direction they actually look — so the sensor-side bracket and its flex
     are what you see from the front of the exploded stack. */
  const lensLocal = [
    [-0.56, 0.54],
    [-0.56, -0.5],
    [0.65, 0.54],
  ];

  const cameraFrameShape = roundedRectShape(2.66, 2.66, 0.46);
  lensLocal.forEach(([x, y]) => {
    cameraFrameShape.holes.push(circlePath(x, y, 0.355));
  });
  cameraFrameShape.holes.push(circlePath(0.65, -0.5, 0.195));
  const cameraFrameGeometry = new THREE.ExtrudeGeometry(cameraFrameShape, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 3,
    curveSegments: 40,
    steps: 1,
  });
  cameraFrameGeometry.translate(0, 0, -0.1);
  const cameraHousing = new THREE.Mesh(cameraFrameGeometry, darkMetal);
  cameraHousing.position.set(-2.15, 4.92, 0);
  cameraModule.add(cameraHousing);

  const lensTexture = makeLensTexture();
  const lensFaceMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: lensTexture,
    metalness: 0.1,
    roughness: 0.06,
    clearcoat: 1,
    side: THREE.DoubleSide,
    envMapIntensity: 1.2,
  });

  lensLocal.forEach(([x, y]) => {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.315, 0.345, 0.36, 36), darkMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(-2.15 + x, 4.92 + y, -0.02);
    cameraModule.add(barrel);

    const rim = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.35, 48), darkMetal);
    rim.position.set(-2.15 + x, 4.92 + y, -0.176);
    rim.rotation.y = Math.PI;
    cameraModule.add(rim);

    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.297, 48), lensFaceMaterial);
    lens.position.set(-2.15 + x, 4.92 + y, -0.178);
    lens.rotation.y = Math.PI;
    cameraModule.add(lens);
  });

  const cameraFlash = new THREE.Mesh(
    new THREE.CircleGeometry(0.13, 32),
    new THREE.MeshPhysicalMaterial({
      color: 0xffe1ab,
      emissive: 0x3d290d,
      emissiveIntensity: 0.4,
      metalness: 0.2,
      roughness: 0.42,
      side: THREE.DoubleSide,
    })
  );
  cameraFlash.position.set(-1.5, 4.42, -0.178);
  cameraFlash.rotation.y = Math.PI;
  cameraModule.add(cameraFlash);
  const flashRing = new THREE.Mesh(new THREE.RingGeometry(0.135, 0.18, 32), silver);
  flashRing.position.set(-1.5, 4.42, -0.176);
  flashRing.rotation.y = Math.PI;
  cameraModule.add(flashRing);

  // Sensor-side bracket, flex and board-to-board connector.
  const cameraFlex = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.4), flexFilm);
  cameraFlex.position.set(-1.05, 3.15, 0.2);
  cameraModule.add(cameraFlex);
  const cameraConnector = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 0.06), connectorMaterial);
  cameraConnector.position.set(-0.95, 2.62, 0.2);
  cameraModule.add(cameraConnector);

  /* 05 — Wireless charging / antenna plate ---------------------------- */
  const rearShape = roundedRectShape(7.37, 16.0, 1.12);
  CAMERA_LENSES.forEach((lens) => {
    rearShape.holes.push(circlePath(lens.x, lens.y, 0.49));
  });
  rearShape.holes.push(circlePath(CAMERA_FLASH.x, CAMERA_FLASH.y, 0.225));

  const rearGeometry = new THREE.ExtrudeGeometry(rearShape, {
    depth: 0.024,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.007,
    bevelSegments: 2,
    curveSegments: 48,
    steps: 1,
  });
  rearGeometry.center();
  // Bonded into the frame: one housing, so the two never separate.
  const rearPanel = new THREE.Mesh(rearGeometry, rearGlass);
  rearPanel.position.z = -0.31;
  frame.add(rearPanel);

  // The antenna / wireless-charging plate that sits under that glass.
  const chargePlateShape = roundedRectShape(5.2, 7.6, 0.9);
  const chargePlate = new THREE.Mesh(
    new THREE.ExtrudeGeometry(chargePlateShape, {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.004,
      bevelSegments: 1,
      curveSegments: 24,
      steps: 1,
    }),
    graphite
  );
  chargePlate.position.set(0, -1.7, 0.026);
  plate.add(chargePlate);

  [0.6, 1.02, 1.44].forEach((radius) => {
    const coil = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 0.05, 72), copper);
    coil.position.set(0, -1.5, 0.03);
    plate.add(coil);
  });

  // Magnet ring: sixteen separate magnets, the way MagSafe-class arrays are
  // built, instead of one solid disc.
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    const magnet = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.03, 14), aluminium);
    magnet.rotation.x = Math.PI / 2;
    magnet.position.set(Math.cos(angle) * 1.72, -1.5 + Math.sin(angle) * 1.72, 0.034);
    plate.add(magnet);
  }

  const antennaShape = roundedRectShape(7.16, 15.78, 1.0);
  antennaShape.holes.push(roundedRectShape(7.0, 15.62, 0.94));
  const antenna = new THREE.Mesh(
    flatShapeGeometry(antennaShape, 7.16, 15.78, 40),
    new THREE.MeshBasicMaterial({
      color: 0x9f613d,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  antenna.position.z = 0.028;
  plate.add(antenna);

  const rearLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.85),
    new THREE.MeshBasicMaterial({
      map: makeRearLabelTexture(),
      transparent: true,
      depthWrite: false,
    })
  );
  rearLabel.position.set(0, -5.2, 0.032);
  plate.add(rearLabel);

  const rimMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x8f9590,
    metalness: 1,
    roughness: 0.2,
  });
  CAMERA_LENSES.forEach((lens) => {
    const rim = new THREE.Mesh(new THREE.RingGeometry(0.44, 0.487, 56), rimMaterial);
    rim.position.set(lens.x, lens.y, -0.284);
    frame.add(rim);
  });

  root.userData.finish = {
    cap: titaniumCap,
    rail: titaniumRail,
    button: buttonMaterial,
    rear: rearGlass,
  };

  return { root, layers };
}

/* Offsets that keep a weighted clearance between neighbouring parts while the
   parts themselves keep their real thickness. Each layer owns the clearance
   towards the middle of the stack, which is what lets the camera module hug
   the logic board and still leave the rear glass breathing room. */
function explodeOffsets(layers, gap) {
  const offsets = new Array(layers.length).fill(0);
  const middle = Math.floor((layers.length - 1) / 2);
  const clearance = (index) => gap * (layers[index].gapScale ?? 1);

  for (let index = middle + 1; index < layers.length; index += 1) {
    offsets[index] =
      offsets[index - 1] -
      (layers[index - 1].thickness / 2 + clearance(index) + layers[index].thickness / 2);
  }
  for (let index = middle - 1; index >= 0; index -= 1) {
    offsets[index] =
      offsets[index + 1] +
      (layers[index + 1].thickness / 2 + clearance(index) + layers[index].thickness / 2);
  }
  return offsets;
}

function showAnatomyFallback() {
  if (!anatomySection) return;
  anatomyInitialized = false;
  anatomySection.classList.add("anatomy--fallback");
  if (anatomyFallback) anatomyFallback.hidden = false;
  if (anatomyCanvas) anatomyCanvas.style.display = "none";
  if (anatomyAxis) anatomyAxis.style.display = "none";
  if (calloutLayer) calloutLayer.style.display = "none";
  if (anatomyCue) anatomyCue.style.display = "none";
}

function resizeAnatomy() {
  if (!anatomyInitialized || !anatomyRenderer || !anatomyCamera) return;

  const width = anatomyStage.clientWidth;
  const height = anatomyStage.clientHeight;
  if (!width || !height) return;

  anatomyRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  anatomyRenderer.setSize(width, height, false);
  anatomyCamera.aspect = width / height;
  anatomyCamera.updateProjectionMatrix();

  const stageRect = anatomyStage.getBoundingClientRect();
  const headRect = anatomyHead.getBoundingClientRect();
  const legendRect = anatomyLegend.getBoundingClientRect();
  const narrow = width < 760 || width / height < 1.02;
  if (anatomySection) anatomySection.classList.toggle("is-narrow", narrow);

  const topBound = narrow ? Math.max(80, headRect.bottom - stageRect.top + 16) : 82;
  const bottomBound = Math.min(height - 34, legendRect.top - stageRect.top - 18);
  const available = Math.max(180, bottomBound - topBound);

  const gap = narrow ? 2.05 : 2.7;
  const yawEnd = narrow ? 1.02 : 1.15;
  const pitchEnd = narrow ? -0.24 : 0.1;

  // Measure the stack's real silhouette instead of guessing: rotate the
  // bounding box of every layer and take the extents. On a phone the tilt has
  // to grow, otherwise six layers compress into one unreadable shingle.
  const offsets = explodeOffsets(anatomyLayers, gap);
  const minZ = Math.min(...offsets.map((offset, index) => offset - anatomyLayers[index].thickness / 2));
  const maxZ = Math.max(...offsets.map((offset, index) => offset + anatomyLayers[index].thickness / 2));
  const boundsMatrix = new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(pitchEnd, yawEnd, 0, "YXZ")
  );
  const corner = new THREE.Vector3();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  [-PHONE_WIDTH / 2, PHONE_WIDTH / 2].forEach((x) => {
    [-PHONE_HEIGHT / 2, PHONE_HEIGHT / 2].forEach((y) => {
      [minZ, maxZ].forEach((z) => {
        corner.set(x, y, z).applyMatrix4(boundsMatrix);
        minX = Math.min(minX, corner.x);
        maxX = Math.max(maxX, corner.x);
        minY = Math.min(minY, corner.y);
        maxY = Math.max(maxY, corner.y);
      });
    });
  });

  const worldWidth = maxX - minX + 0.7;
  const worldHeight = maxY - minY + 0.7;

  let finalHeightPx = Math.min(available * 0.96, height * (narrow ? 0.52 : 0.73));
  let finalWidthPx = (finalHeightPx * worldWidth) / worldHeight;
  const maxWidth = width * (narrow ? 0.88 : 0.43);
  if (finalWidthPx > maxWidth) {
    finalWidthPx = maxWidth;
    finalHeightPx = (finalWidthPx * worldHeight) / worldWidth;
  }

  const centerX = width * (narrow ? 0.5 : 0.69);
  const centerY = (topBound + bottomBound) / 2;
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(anatomyCamera.fov / 2));
  const endZ = (worldHeight * height) / (2 * tanHalf * finalHeightPx);
  const startZ = endZ * 1.5;

  anatomyLayout = {
    width,
    height,
    narrow,
    centerX,
    centerY,
    gap,
    yawEnd,
    pitchEnd,
    startZ,
    endZ,
    finalHeightPx,
    finalWidthPx,
    worldWidth,
    headRight: headRect.right - stageRect.left,
  };

  measureCallouts();

  if (anatomyOrbit) {
    anatomyOrbit.style.left = `${centerX}px`;
    anatomyOrbit.style.top = `${centerY}px`;
    anatomyOrbit.style.width = `${Math.max(finalWidthPx * 1.35, 300)}px`;
  }

  updateAnatomyScene(anatomyCurrentProgress);
}

function updateAnatomyProgress() {
  if (!anatomySection) return;
  const rect = anatomySection.getBoundingClientRect();
  const travel = Math.max(anatomySection.offsetHeight - window.innerHeight, 1);
  const raw = clamp(-rect.top / travel, 0, 1);
  anatomyTargetProgress = smoothstep(0.04, 0.94, raw);
}

function setAnatomyPhase(progress) {
  let label = "整机 / ASSEMBLED";
  if (progress > 0.85) label = "同轴 / ONE AXIS";
  else if (progress > 0.58) label = "退开 / EXPANDING";
  else if (progress > 0.24) label = "靠近 / APPROACH";

  if (label !== anatomyLastPhase) {
    anatomyLastPhase = label;
    if (anatomyPhase) anatomyPhase.textContent = label;
  }

  const percent = Math.round(progress * 100);
  if (percent !== anatomyLastPercent) {
    anatomyLastPercent = percent;
    if (anatomyPercent) anatomyPercent.textContent = String(percent).padStart(3, "0");
    if (anatomyProgressElement) anatomyProgressElement.setAttribute("aria-valuenow", String(percent));
  }
}

function updateAnatomyScene(progress) {
  if (!anatomyLayout || !anatomyRoot) return;

  const eased = progress;
  const { width, height, centerX, centerY, gap, yawEnd, pitchEnd, startZ, endZ } = anatomyLayout;

  const z = THREE.MathUtils.lerp(startZ, endZ, eased);
  const yaw = THREE.MathUtils.lerp(0.33, yawEnd, eased);
  const pitch = THREE.MathUtils.lerp(-0.045, pitchEnd, eased);

  const offsets = explodeOffsets(anatomyLayers, gap);
  anatomyLayers.forEach((layer, index) => {
    layer.group.position.z = layer.baseZ + offsets[index] * eased;
  });

  const simCards = anatomyRoot.userData.simCards;
  if (simCards) {
    const spread = 0.235 + eased * 0.22;
    for (let index = 0; index < simCards.length; index += 1) {
      const entry = simCards[index];
      entry.mesh.position.z = entry.side * spread;
    }
  }

  anatomyRoot.rotation.y = yaw;
  anatomyRoot.rotation.x = pitch;
  anatomyRoot.updateMatrixWorld(true);

  anatomyCamera.position.z = z;
  const visibleHeight = 2 * z * Math.tan(THREE.MathUtils.degToRad(anatomyCamera.fov / 2));
  const visibleWidth = visibleHeight * (width / height);
  anatomyRoot.position.x = (centerX / width - 0.5) * visibleWidth;
  anatomyRoot.position.y = -(centerY / height - 0.5) * visibleHeight;
  anatomyRoot.updateMatrixWorld(true);

  if (udcAxis) {
    const boardLayer = anatomyLayers.find((layer) => layer.key === "board");
    const displayLayer = anatomyLayers.find((layer) => layer.key === "display");
    if (boardLayer && displayLayer && eased > 0.42) {
      udcAxisStart.set(0, 6.05, 0.16).applyMatrix4(boardLayer.group.matrixWorld);
      udcAxisEnd.set(0, 6.05, -0.06).applyMatrix4(displayLayer.group.matrixWorld);
      const position = udcAxis.geometry.attributes.position;
      position.setXYZ(0, udcAxisStart.x, udcAxisStart.y, udcAxisStart.z);
      position.setXYZ(1, udcAxisEnd.x, udcAxisEnd.y, udcAxisEnd.z);
      position.needsUpdate = true;
      udcAxis.computeLineDistances();
      udcAxis.visible = true;
      udcAxis.material.opacity = 0.9 * smoothstep(0.42, 0.7, eased);
    } else {
      udcAxis.visible = false;
    }
  }

  setAnatomyPhase(eased);

  if (anatomyProgressBar) {
    anatomyProgressBar.style.transform = `scaleX(${eased})`;
  }
  if (anatomyCue) {
    anatomyCue.style.opacity = String(1 - smoothstep(0.02, 0.13, eased));
  }
  anatomySection.classList.toggle("is-exploded", eased > 0.55);

  const markerOpacity = smoothstep(0.26, 0.58, eased) * (anatomyLayout.narrow ? 0 : 1);

  if (calloutsBuilt) {
    const points = anatomyLayers.map((layer) => {
      anatomyProjection.copy(layer.anchor).applyMatrix4(layer.group.matrixWorld);
      anatomyProjection.project(anatomyCamera);
      return {
        x: (anatomyProjection.x * 0.5 + 0.5) * width,
        y: (-anatomyProjection.y * 0.5 + 0.5) * height,
        visible: anatomyProjection.z > -1 && anatomyProjection.z < 1,
      };
    });

    const labelWidth = calloutLabelWidth;
    const artLeft = centerX - (anatomyLayout.finalWidthPx || 0) / 2;
    const artRight = centerX + (anatomyLayout.finalWidthPx || 0) / 2;
    const copyRight = anatomyLayout.headRight || 0;

    // The left column only exists when it genuinely fits between the body copy
    // and the stack; otherwise every callout goes to the right margin, which
    // is always wide enough for one column.
    const leftEdge = Math.max(copyRight + 16 + labelWidth, artLeft - 24);
    const leftFits = leftEdge + 8 <= artLeft;
    const rightEdge = Math.min(width - 14 - labelWidth, artRight + 22);

    const columns = { left: [], right: [] };
    points.forEach((point, index) => {
      if (!point.visible) return;
      if (leftFits && point.x < centerX) columns.left.push(index);
      else columns.right.push(index);
    });

    const visibleYs = points.filter((point) => point.visible).map((point) => point.y);
    const top = Math.max(24, Math.min(...visibleYs) - 26);
    const bottom = Math.min(height - 24, Math.max(...visibleYs) + 26);

    const place = (list) => {
      if (!list.length) return [];
      list.sort((a, b) => points[a].y - points[b].y);
      const step = list.length > 1 ? Math.min(56, (bottom - top) / (list.length - 1)) : 0;
      const span = step * (list.length - 1);
      const start = Math.max(top, Math.min((top + bottom) / 2 - span / 2, bottom - span));
      return list.map((index, rank) => ({ index, y: start + rank * step }));
    };

    const slots = [...place(columns.left), ...place(columns.right)];

    points.forEach((point, index) => {
      const path = calloutPaths[index];
      const dot = calloutDots[index];
      const label = calloutLabels[index];
      if (!path || !dot || !label) return;

      const slot = slots.find((entry) => entry.index === index);
      const opacity = slot && point.visible ? markerOpacity : 0;
      path.style.opacity = String(opacity);
      dot.style.opacity = String(opacity);
      label.style.opacity = String(opacity);
      if (!opacity) return;

      dot.setAttribute("cx", point.x.toFixed(1));
      dot.setAttribute("cy", point.y.toFixed(1));

      const isLeft = leftFits && point.x < centerX;
      const targetX = isLeft ? leftEdge : rightEdge;
      const elbow = isLeft ? targetX + 16 : targetX - 16;
      path.setAttribute(
        "d",
        `M ${point.x.toFixed(1)} ${point.y.toFixed(1)} L ${elbow.toFixed(1)} ${slot.y.toFixed(1)} H ${targetX.toFixed(1)}`
      );
      label.style.transform = isLeft
        ? `translate(${targetX.toFixed(1)}px, ${slot.y.toFixed(1)}px) translate(-100%, -50%)`
        : `translate(${targetX.toFixed(1)}px, ${slot.y.toFixed(1)}px) translate(0, -50%)`;
    });
  }

  if (anatomyAxis && anatomyAxisLine && anatomyAxisStart && anatomyAxisEnd) {
    const front = anatomyLayers[0];
    const back = anatomyLayers[anatomyLayers.length - 1];
    const start = new THREE.Vector3(
      0,
      0,
      front.group.position.z + front.thickness / 2 + 0.55
    )
      .applyMatrix4(anatomyRoot.matrixWorld)
      .project(anatomyCamera);
    const end = new THREE.Vector3(
      0,
      0,
      back.group.position.z - back.thickness / 2 - 0.55
    )
      .applyMatrix4(anatomyRoot.matrixWorld)
      .project(anatomyCamera);
    const x1 = (start.x * 0.5 + 0.5) * width;
    const y1 = (-start.y * 0.5 + 0.5) * height;
    const x2 = (end.x * 0.5 + 0.5) * width;
    const y2 = (-end.y * 0.5 + 0.5) * height;
    anatomyAxisLine.setAttribute("x1", x1.toFixed(1));
    anatomyAxisLine.setAttribute("y1", y1.toFixed(1));
    anatomyAxisLine.setAttribute("x2", x2.toFixed(1));
    anatomyAxisLine.setAttribute("y2", y2.toFixed(1));
    anatomyAxisStart.setAttribute("cx", x1.toFixed(1));
    anatomyAxisStart.setAttribute("cy", y1.toFixed(1));
    anatomyAxisEnd.setAttribute("cx", x2.toFixed(1));
    anatomyAxisEnd.setAttribute("cy", y2.toFixed(1));
    anatomyAxis.style.opacity = String(smoothstep(0.16, 0.42, eased) * 0.92);

  }
}

function anatomyFrame() {
  requestAnimationFrame(anatomyFrame);
  if (!anatomyInitialized || !anatomyVisible || document.hidden) return;

  const now = performance.now();
  const delta = Math.min((now - anatomyLastFrameTime) / 1000, 0.05);
  anatomyLastFrameTime = now;
  const mix = reduceMotion ? 1 : 1 - Math.pow(0.82, delta * 60);
  anatomyCurrentProgress += (anatomyTargetProgress - anatomyCurrentProgress) * mix;
  if (Math.abs(anatomyTargetProgress - anatomyCurrentProgress) < 0.0002) {
    anatomyCurrentProgress = anatomyTargetProgress;
  }

  updateAnatomyScene(anatomyCurrentProgress);
  anatomyRenderer.render(anatomyScene, anatomyCamera);

  if (anatomyFirstRender) {
    anatomyFirstRender = false;
    document.body.classList.add("is-anatomy-rendered");
  }
}

function initAnatomy() {
  if (!anatomySection || !anatomyStage || !anatomyCanvas) return;

  try {
    anatomyRenderer = new THREE.WebGLRenderer({
      canvas: anatomyCanvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    showAnatomyFallback();
    return;
  }

  anatomyRenderer.setClearColor(0x000000, 0);
  anatomyRenderer.outputColorSpace = THREE.SRGBColorSpace;
  anatomyRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  anatomyRenderer.toneMappingExposure = 1.08;
  anatomyRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));

  anatomyScene = new THREE.Scene();
  anatomyCamera = new THREE.PerspectiveCamera(30, 1, 1, 160);
  anatomyCamera.position.set(0, 0, 52);
  anatomyCamera.lookAt(0, 0, 0);

  createEnvironment(anatomyRenderer, anatomyScene, 1.15, true);

  const hemisphere = new THREE.HemisphereLight(0xf0f7ff, 0x212521, 0.75);
  anatomyScene.add(hemisphere);

  const key = new THREE.DirectionalLight(0xfff7ed, 2.6);
  key.position.set(6, 9, 10);
  anatomyScene.add(key);

  const rim = new THREE.DirectionalLight(0xd9e4f7, 0.6);
  rim.position.set(-8, 1, 4);
  anatomyScene.add(rim);

  const backKey = new THREE.DirectionalLight(0xffffff, 1.35);
  backKey.position.set(1, 5, -9);
  anatomyScene.add(backKey);

  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-4, -2, 7);
  anatomyScene.add(fill);

  const phone = createAnatomyPhone();
  anatomyRoot = phone.root;
  anatomyLayers = phone.layers;
  buildCallouts();
  anatomyScene.add(anatomyRoot);

  const udcGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  udcAxis = new THREE.Line(
    udcGeometry,
    new THREE.LineDashedMaterial({
      color: 0x2b45ff,
      dashSize: 0.2,
      gapSize: 0.12,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  udcAxis.visible = false;
  anatomyScene.add(udcAxis);

  anatomyInitialized = true;
  anatomyCurrentProgress = 0;
  resizeAnatomy();
  updateAnatomyProgress();
  updateAnatomyScene(0);
  anatomyCamera.position.z = anatomyLayout?.startZ || 52;
  anatomyRoot.updateMatrixWorld(true);
  anatomyRenderer.render(anatomyScene, anatomyCamera);
  document.body.classList.add("is-anatomy-rendered");

  const anatomyObserver = new IntersectionObserver(
    (entries) => {
      anatomyVisible = entries[0]?.isIntersecting ?? false;
      if (anatomyVisible) anatomyLastFrameTime = performance.now();
    },
    { rootMargin: "120px 0px", threshold: 0 }
  );
  anatomyObserver.observe(anatomySection);

  window.addEventListener("scroll", updateAnatomyProgress, { passive: true });
  window.addEventListener(
    "resize",
    () => {
      resizeAnatomy();
      updateAnatomyProgress();
    },
    { passive: true }
  );

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => resizeAnatomy());
    observer.observe(anatomyStage);
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      resizeAnatomy();
      updateAnatomyProgress();
    });
  }

  // If the section is already on screen on a restored scroll position.
  updateAnatomyProgress();
  anatomyCurrentProgress = anatomyTargetProgress;
  anatomyVisible = anatomySection.getBoundingClientRect().top < window.innerHeight;
  anatomyLastFrameTime = performance.now();
  requestAnimationFrame(anatomyFrame);
}

/* ------------------------------------------------------------------
   Boot
   ------------------------------------------------------------------ */

drawDisplayScreen();

if ("ResizeObserver" in window) {
  const resizeObserver = new ResizeObserver(queueResize);
  resizeObserver.observe(stageElement);
} else {
  window.addEventListener("resize", queueResize, { passive: true });
}

window.addEventListener("resize", queueResize, { passive: true });
window.addEventListener("orientationchange", () => window.setTimeout(queueResize, 160));

if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    queueResize();
    drawDisplayScreen();
  });
}

initThree();

if (state.webgl) {
  try {
    initAnatomy();
  } catch (error) {
    console.error("M67 anatomy view failed:", error);
    showAnatomyFallback();
  }
} else {
  showAnatomyFallback();
}

let savedFinish = "obsidian";
try {
  const stored = window.localStorage.getItem("m67-finish");
  if (stored && FINISHES[stored]) savedFinish = stored;
} catch (error) {
  // Local storage is optional.
}
applyFinish(savedFinish, { persist: false, silent: true });

// Re-measure after the entrance animation has settled; the copy and controls
// move a few pixels during the reveal.
window.setTimeout(queueResize, 1250);

// If WebGL setup failed before the hero observer was created, keep the copy
// and controls reachable and reveal the fallback.
if (!state.webgl) {
  document.body.classList.add("is-rendered", "is-ready");
}

window.setTimeout(() => document.body.classList.add("is-ready"), 600);

// Scripted-capture hook (used by the video rig): deterministic camera & state
// control for headless frame capture. Harmless in normal browsing.
window.__m67 = {
  setYaw(v) {
    state.rotY = v;
    state.velocityY = 0;
    state.lastInteractionAt = performance.now();
  },
  setPitch(v) {
    state.rotX = clamp(v, PITCH_MIN, PITCH_MAX);
    state.velocityX = 0;
    state.lastInteractionAt = performance.now();
  },
  setHolo(on) {
    if (holoButton && holoOn !== on) holoButton.click();
  },
  setFinish(key) {
    applyFinish(key, { persist: false, silent: true });
  },
};
