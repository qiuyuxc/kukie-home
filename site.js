"use strict";

const root = document.documentElement;
const visual = document.querySelector(".hero-visual");
const tabs = Array.from(document.querySelectorAll("[data-project-index]"));
const motionButton = document.getElementById("motion-toggle");
const themeButton = document.getElementById("theme-toggle");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const projects = [
  { name: "映屿", label: "YINGYU", icon: "icon-yingyu", category: "图片与日常", description: "给每一张图片，一个轻盈的住处。", badge: ["轻盈存放", "自在分享"], url: "https://img.kukie.cn" },
  { name: "茶馆", label: "CHAGUAN", icon: "icon-chaguan", category: "交流与相遇", description: "找个地方坐坐，把话慢慢聊开。", badge: ["坐下来吧", "慢慢聊聊"], url: "https://github.com/qiuyuxc/chaguan" },
  { name: "Tunnel Manager", label: "TUNNEL MANAGER", icon: "icon-tunnel", category: "连接与探索", description: "给隧道和服务，一个顺手的面板。", badge: ["连接起来", "自在探索"], url: "https://docs.kukie.cn" },
];

let preferences = { palette: "mono", theme: "light", paused: false };
try {
  const saved = JSON.parse(localStorage.getItem("kukie-home-appearance") || "null");
  if (saved) {
    preferences.palette = saved.palette === "green" ? "green" : "mono";
    preferences.theme = saved.theme === "dark" ? "dark" : "light";
    preferences.paused = saved.paused === true;
  }
} catch {}

class ParticleScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.index = 0;
    this.ready = false;
    this.enabled = false;
    this.visible = false;
    this.frame = 0;
    this.width = 0;
    this.height = 0;
    this.samples = [];
    this.target = [];
    this.current = [];
    this.from = [];
    this.scatter = [];
    this.pointer = null;
    this.morphStart = 0;
    this.morphing = false;
    this.drawFrame = this.drawFrame.bind(this);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    canvas.addEventListener("pointermove", event => {
      if (!finePointer.matches || !this.enabled) return;
      const rect = canvas.getBoundingClientRect();
      this.pointer = {
        x: (event.clientX - rect.left) * this.width / rect.width,
        y: (event.clientY - rect.top) * this.height / rect.height,
      };
    });
    canvas.addEventListener("pointerleave", () => { this.pointer = null; });
  }

  async initialize() {
    if (!this.context) return;
    this.samples = await Promise.all(projects.map(project => this.sampleSymbol(project.icon)));
    this.ready = true;
    this.resize();
    const extent = Math.min(this.width, this.height);
    if (this.enabled) {
      this.from = this.target.map((point, index) => {
        const angle = index * 2.399963;
        const radius = extent * (.36 + (index % 19) / 100);
        return { x: this.width / 2 + Math.cos(angle) * radius, y: this.height / 2 + Math.sin(angle) * radius };
      });
      this.morphStart = performance.now();
      this.morphing = true;
    }
    visual.classList.add("canvas-ready");
    this.syncLoop();
  }

  sampleSymbol(id) {
    return new Promise((resolve, reject) => {
      const symbol = document.getElementById(id);
      const size = 224;
      const source = '<svg xmlns="http://www.w3.org/2000/svg" width="224" height="224" viewBox="' + symbol.getAttribute("viewBox") + '" color="#000" fill="none">' + symbol.innerHTML + "</svg>";
      const picture = new Image();
      picture.onload = () => {
        try {
          const buffer = document.createElement("canvas");
          buffer.width = size;
          buffer.height = size;
          const context = buffer.getContext("2d", { willReadFrequently: true });
          context.drawImage(picture, 0, 0, size, size);
          const pixels = context.getImageData(0, 0, size, size).data;
          const points = [];
          for (let y = 2; y < size; y += 2) {
            for (let x = 2; x < size; x += 2) {
              const offset = (y * size + x) * 4;
              if (pixels[offset + 3] > 24 && pixels[offset] < 210) points.push({ x, y });
            }
          }
          if (!points.length) throw new Error("Empty project symbol");
          const xs = points.map(point => point.x);
          const ys = points.map(point => point.y);
          const minX = Math.min(...xs), maxX = Math.max(...xs);
          const minY = Math.min(...ys), maxY = Math.max(...ys);
          const span = Math.max(maxX - minX, maxY - minY);
          const normalized = points.map(point => ({
            x: (point.x - (minX + maxX) / 2) / span,
            y: (point.y - (minY + maxY) / 2) / span,
          }));
          normalized.sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x) || a.x * a.x + a.y * a.y - b.x * b.x - b.y * b.y);
          resolve(normalized);
        } catch (error) { reject(error); }
      };
      picture.onerror = reject;
      picture.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    });
  }

  resize() {
    if (!this.ready) return;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.count = window.innerWidth <= 780 ? 840 : 1180;
    const extent = Math.min(width, height);
    this.scatter = Array.from({ length: this.count }, (_, index) => {
      const angle = index * 2.399963 + Math.sin(index * .39);
      const radius = extent * (.15 + (index % 31) / 125);
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    });
    this.target = this.makeTarget(this.index);
    this.current = this.target.map(point => ({ ...point }));
    this.from = this.current.map(point => ({ ...point }));
    this.morphing = false;
    this.readColor();
    this.draw(performance.now());
    this.syncLoop();
  }

  makeTarget(index) {
    const points = this.samples[index];
    const extent = Math.min(this.width, this.height) * .72;
    return Array.from({ length: this.count }, (_, particle) => {
      const sample = points[Math.floor(particle * points.length / this.count)];
      const jitterX = Math.sin(particle * 127.1) * .003;
      const jitterY = Math.cos(particle * 311.7) * .003;
      return { x: this.width / 2 + (sample.x + jitterX) * extent, y: this.height / 2 + (sample.y + jitterY) * extent };
    });
  }

  select(index) {
    this.index = index;
    if (!this.ready) return;
    this.from = this.current.map(point => ({ ...point }));
    this.target = this.makeTarget(index);
    this.morphStart = performance.now();
    this.morphing = this.enabled;
    this.syncLoop();
  }

  readColor() {
    this.color = getComputedStyle(root).getPropertyValue("--particle").trim();
    if (this.ready && !this.enabled) this.draw(performance.now());
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.morphing = false;
      this.pointer = null;
    }
    this.syncLoop();
  }

  syncLoop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    if (!this.ready) return;
    this.draw(performance.now());
    if (this.enabled && this.visible && !document.hidden) this.frame = requestAnimationFrame(this.drawFrame);
  }

  drawFrame(now) {
    this.frame = 0;
    this.draw(now);
    if (this.enabled && this.visible && !document.hidden) this.frame = requestAnimationFrame(this.drawFrame);
  }

  draw(now) {
    if (!this.ready) return;
    const context = this.context;
    context.clearRect(0, 0, this.width, this.height);
    context.fillStyle = this.color;
    const progress = this.morphing ? Math.min(1, Math.max(0, (now - this.morphStart) / 1450)) : 1;
    const ease = progress * progress * progress * (progress * (progress * 6 - 15) + 10);
    const bend = this.morphing ? Math.sin(progress * Math.PI) * .95 : 0;
    const time = now / 1000;
    for (let index = 0; index < this.count; index++) {
      const target = this.target[index];
      const from = this.from[index];
      const scatter = this.scatter[index];
      let x = from.x + (target.x - from.x) * ease + scatter.x * bend;
      let y = from.y + (target.y - from.y) * ease + scatter.y * bend;
      if (this.enabled) {
        x += Math.sin(time * .8 + index * .41) * .65;
        y += Math.sin(time * .65 + index * .13) * .6;
      }
      if (this.pointer && progress === 1) {
        const dx = x - this.pointer.x, dy = y - this.pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 0 && distance < 48) {
          const force = (1 - distance / 48) * 13;
          x += dx / distance * force;
          y += dy / distance * force;
        }
      }
      this.current[index] = { x, y };
    }
    for (let group = 0; group < 2; group++) {
      context.globalAlpha = group ? .88 : .48;
      context.beginPath();
      for (let index = 0; index < this.count; index++) {
        if ((index % 5 === 0 ? 0 : 1) !== group) continue;
        const point = this.current[index];
        const radius = group ? .92 : 1.13;
        context.moveTo(point.x + radius, point.y);
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      }
      context.fill();
    }
    context.globalAlpha = 1;
    if (progress === 1) this.morphing = false;
  }
}

const scene = new ParticleScene(document.getElementById("particle-canvas"));
let currentProject = 0;
let visualVisible = false;
let hovered = false;
let focused = false;
let autoTimer = 0;
const headerBrand = document.getElementById("header-brand");
const siteHeader = document.querySelector(".site-header");
let brandIntroPlayed = false;
let brandIntroTimer = 0;
let brandResetTimer = 0;
headerBrand.classList.add("brand-pending");

function playBrandAssembly(replay = false) {
  if (root.dataset.motion !== "on" || document.hidden || !siteHeader.classList.contains("reveal-visible")) return;
  if (headerBrand.classList.contains("brand-playing")) return;
  brandIntroPlayed = true;
  window.clearTimeout(brandIntroTimer);
  brandIntroTimer = 0;
  headerBrand.classList.remove("brand-pending");
  headerBrand.classList.add("brand-playing", replay ? "brand-replaying" : "brand-assembling");
  brandResetTimer = window.setTimeout(() => {
    headerBrand.classList.remove("brand-playing", "brand-assembling", "brand-replaying");
    brandResetTimer = 0;
  }, replay ? 1700 : 1350);
}

function stopBrandAssembly() {
  window.clearTimeout(brandIntroTimer);
  window.clearTimeout(brandResetTimer);
  brandIntroTimer = 0;
  brandResetTimer = 0;
  headerBrand.classList.remove("brand-playing", "brand-assembling", "brand-replaying");
  if (brandIntroPlayed || root.dataset.motion !== "on") headerBrand.classList.remove("brand-pending");
  if (root.dataset.motion !== "on") brandIntroPlayed = true;
}

function scheduleBrandIntro() {
  if (brandIntroPlayed || brandIntroTimer || root.dataset.motion !== "on" || document.hidden) return;
  if (!siteHeader.classList.contains("reveal-visible")) return;
  brandIntroTimer = window.setTimeout(() => {
    brandIntroTimer = 0;
    playBrandAssembly();
  }, 100);
}

headerBrand.addEventListener("click", event => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: scene.enabled ? "smooth" : "instant" });
  if (headerBrand.classList.contains("brand-playing")) return;
  const rect = headerBrand.getBoundingClientRect();
  const x = event.detail ? event.clientX - rect.left : rect.width / 2;
  const y = event.detail ? event.clientY - rect.top : rect.height / 2;
  headerBrand.style.setProperty("--brand-event-x", Math.max(0, Math.min(rect.width, x)) + "px");
  headerBrand.style.setProperty("--brand-event-y", Math.max(0, Math.min(rect.height, y)) + "px");
  playBrandAssembly(true);
});

function savePreferences() {
  try { localStorage.setItem("kukie-home-appearance", JSON.stringify(preferences)); } catch {}
}

function scheduleAuto() {
  window.clearTimeout(autoTimer);
  if (!scene.enabled || !visualVisible || document.hidden || hovered || focused) return;
  autoTimer = window.setTimeout(() => selectProject((currentProject + 1) % projects.length, false), 6800);
}

function selectProject(index, announce = true) {
  currentProject = index;
  const project = projects[index];
  tabs.forEach((tab, position) => {
    tab.setAttribute("aria-selected", String(position === index));
    tab.tabIndex = position === index ? 0 : -1;
  });
  document.querySelector(".project-tabs").style.setProperty("--selected", index);
  document.querySelector(".project-peek").dataset.project = index;
  document.getElementById("project-display").setAttribute("aria-labelledby", "project-tab-" + index);
  document.getElementById("scene-number").textContent = String(index + 1).padStart(2, "0");
  document.getElementById("scene-label").textContent = project.label;
  document.getElementById("peek-title").textContent = project.name;
  document.getElementById("peek-description").textContent = project.description;
  document.getElementById("peek-category").textContent = project.category;
  document.getElementById("badge-symbol").setAttribute("href", "#" + project.icon);
  const badgeCopy = document.getElementById("badge-copy");
  const badgeStrong = document.createElement("strong");
  badgeStrong.textContent = project.badge[1];
  badgeCopy.replaceChildren(document.createTextNode(project.badge[0]), document.createElement("br"), badgeStrong);
  const visit = document.getElementById("project-visit");
  visit.href = project.url;
  visit.setAttribute("aria-label", "打开" + project.name + "（新窗口）");
  document.querySelector(".particle-fallback").setAttribute("viewBox", document.getElementById(project.icon).getAttribute("viewBox"));
  document.querySelector(".particle-fallback use").setAttribute("href", "#" + project.icon);
  if (announce) document.getElementById("project-status").textContent = "正在展示：" + project.name;
  scene.select(index);
  scheduleAuto();
}

function applyAppearance() {
  root.dataset.palette = preferences.palette;
  root.dataset.theme = preferences.theme;
  document.querySelectorAll("[data-palette-choice]").forEach(button => {
    const selected = button.dataset.paletteChoice === preferences.palette;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  const dark = preferences.theme === "dark";
  themeButton.setAttribute("aria-label", dark ? "切换浅色外观" : "切换深色外观");
  themeButton.querySelector("use").setAttribute("href", dark ? "#icon-sun" : "#icon-moon");
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue("--bg").trim();
  scene.readColor();
}

function applyMotion() {
  const enabled = !preferences.paused && !reducedMotion.matches;
  root.dataset.motion = enabled ? "on" : "off";
  motionButton.disabled = reducedMotion.matches;
  motionButton.setAttribute("aria-pressed", String(!enabled));
  motionButton.setAttribute("aria-label", reducedMotion.matches ? "已跟随系统减少动效" : enabled ? "暂停动效" : "播放动效");
  motionButton.querySelector("use").setAttribute("href", enabled ? "#icon-pause" : "#icon-play");
  scene.setEnabled(enabled);
  scheduleAuto();
  if (enabled) scheduleBrandIntro();
  else stopBrandAssembly();
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => selectProject(Number(tab.dataset.projectIndex)));
  tab.addEventListener("keydown", event => {
    let next = currentProject;
    if (event.key === "ArrowRight") next = (currentProject + 1) % projects.length;
    else if (event.key === "ArrowLeft") next = (currentProject + projects.length - 1) % projects.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = projects.length - 1;
    else return;
    event.preventDefault();
    selectProject(next);
    tabs[next].focus();
  });
});

document.getElementById("wander").addEventListener("click", () => {
  selectProject((currentProject + 1 + Math.floor(Math.random() * 2)) % projects.length);
  const rect = visual.getBoundingClientRect();
  if (rect.top < 0 || rect.bottom > window.innerHeight) {
    visual.scrollIntoView({ behavior: scene.enabled ? "smooth" : "instant", block: "center" });
  }
});

visual.addEventListener("pointerenter", event => {
  if (event.pointerType === "mouse") { hovered = true; scheduleAuto(); }
});
visual.addEventListener("pointerleave", () => {
  hovered = false;
  visual.style.removeProperty("--tilt-x");
  visual.style.removeProperty("--tilt-y");
  scene.pointer = null;
  scheduleAuto();
});
visual.addEventListener("pointermove", event => {
  if (!finePointer.matches || !scene.enabled) return;
  const rect = visual.getBoundingClientRect();
  visual.style.setProperty("--tilt-x", ((.5 - (event.clientY - rect.top) / rect.height) * 5).toFixed(2) + "deg");
  visual.style.setProperty("--tilt-y", (((event.clientX - rect.left) / rect.width - .5) * 5).toFixed(2) + "deg");
});
visual.addEventListener("focusin", () => { focused = true; scheduleAuto(); });
visual.addEventListener("focusout", event => { focused = visual.contains(event.relatedTarget); scheduleAuto(); });

const visibilityObserver = new IntersectionObserver(([entry]) => {
  visualVisible = entry.isIntersecting;
  scene.visible = visualVisible;
  visual.dataset.visible = String(visualVisible);
  scene.syncLoop();
  scheduleAuto();
}, { threshold: .15 });
visibilityObserver.observe(visual);
document.addEventListener("visibilitychange", () => {
  scene.syncLoop();
  scheduleAuto();
  if (document.hidden) stopBrandAssembly();
  else scheduleBrandIntro();
});

document.querySelectorAll("[data-preview-project]").forEach(element => {
  element.addEventListener("pointerenter", event => {
    if (event.pointerType === "mouse") selectProject(Number(element.dataset.previewProject), false);
  });
});
document.querySelectorAll("[data-palette-choice]").forEach(button => {
  button.addEventListener("click", () => {
    preferences.palette = button.dataset.paletteChoice;
    applyAppearance();
    savePreferences();
  });
});
themeButton.addEventListener("click", () => {
  preferences.theme = preferences.theme === "dark" ? "light" : "dark";
  applyAppearance();
  savePreferences();
});
motionButton.addEventListener("click", () => {
  preferences.paused = !preferences.paused;
  applyMotion();
  savePreferences();
});
reducedMotion.addEventListener("change", applyMotion);

document.querySelectorAll("[data-filter]").forEach(button => {
  if (button.tagName !== "BUTTON") return;
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelector(".project-layout").dataset.filter = filter;
    document.querySelectorAll(".filter-group button").forEach(option => {
      const selected = option === button;
      option.classList.toggle("selected", selected);
      option.setAttribute("aria-pressed", String(selected));
    });
    let visibleCount = 0;
    document.querySelectorAll("[data-category]").forEach(project => {
      project.hidden = filter !== "all" && project.dataset.category !== filter;
      if (!project.hidden) visibleCount++;
    });
    document.getElementById("filter-status").textContent = "显示 " + visibleCount + " 个项目";
  });
});

const details = {
  framecraft: { name: "Framecraft", category: "WEB / 创作工具", icon: "icon-framecraft", description: "把网页摊在画布上，直观地编辑组件和布局。", features: ["拖拽调整页面布局与组件", "在画布里编辑文字和样式", "把自己的想法做成可预览的页面"] },
  qiyun: { name: "栖云", category: "ANDROID / 服务器管理", icon: "icon-qiyun", description: "随时从手机连接服务器，看看状态，处理手头的小事。", features: ["保存和管理自己的服务器", "连接 SSH，查看服务器状态", "在手机上使用终端，处理日常任务"] },
};
const dialog = document.getElementById("project-dialog");
document.querySelectorAll("[data-project-detail]").forEach(button => {
  button.addEventListener("click", () => {
    const project = details[button.dataset.projectDetail];
    document.getElementById("dialog-title").textContent = project.name;
    document.getElementById("dialog-category").textContent = project.category;
    document.getElementById("dialog-description").textContent = project.description;
    document.getElementById("dialog-symbol").setAttribute("href", "#" + project.icon);
    document.getElementById("dialog-features").replaceChildren(...project.features.map(text => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }));
    dialog.showModal();
    document.body.classList.add("dialog-open");
  });
});
document.getElementById("dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));
dialog.addEventListener("click", event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const visible = entry.isIntersecting && entry.intersectionRatio >= .12;
    entry.target.classList.toggle("reveal-pending", !visible);
    entry.target.classList.toggle("reveal-visible", visible);
    if (entry.target === siteHeader) {
      if (visible) scheduleBrandIntro();
      else stopBrandAssembly();
    }
  });
}, { threshold: [0, .12], rootMargin: "-20px 0px -32px 0px" });
const revealElements = Array.from(document.querySelectorAll(".reveal"));
revealElements.forEach(element => {
  element.classList.add("reveal-managed", "reveal-pending");
  element.style.setProperty("--reveal-delay", (Number(element.dataset.revealDelay) || 0) + "ms");
});

document.getElementById("year").textContent = new Date().getFullYear();
applyAppearance();
applyMotion();
// Establish the initial pose before enabling transitions.
document.body.getBoundingClientRect();
revealElements.forEach(element => {
  element.classList.add("reveal-initialized");
  revealObserver.observe(element);
});
scene.initialize().catch(() => { visual.classList.add("canvas-unavailable"); });
