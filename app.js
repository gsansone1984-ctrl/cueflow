const SLOTS = 5;
const LS_KEY = "cueflow_slots_v1";

const $ = (id) => document.getElementById(id);

const slotsEl = $("slots");
const scriptInput = $("scriptInput");
const btnSave = $("btnSave");
const btnClear = $("btnClear");

const btnPlay = $("btnPlay");
const btnReset = $("btnReset");
const speed = $("speed");
const speedVal = $("speedVal");
const fontSize = $("fontSize");
const fontVal = $("fontVal");
const align = $("align");

const viewerWrap = $("viewerWrap");
const viewer = $("viewer");
const content = $("content");

const btnFullscreen = $("btnFullscreen");
const btnMirror = $("btnMirror");
const btnPresent = $("btnPresent");

const presentOverlay = $("presentOverlay");
const presentView = $("presentView");
const presentContent = $("presentContent");
const pPlay = $("pPlay");
const pReset = $("pReset");
const pExit = $("pExit");
const pSpeed = $("pSpeed");
const pSpeedVal = $("pSpeedVal");
const pFont = $("pFont");
const pFontVal = $("pFontVal");
const pMirror = $("pMirror");

let slots = loadSlots();
let activeSlot = 1;

let isPlaying = false;
let rafId = null;

// Scroll state
let y = 0; // current scroll offset in px
let lastTs = null;

function loadSlots(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return initSlots();
    const data = JSON.parse(raw);
    if(!data || typeof data !== "object") return initSlots();
    return { ...initSlots(), ...data };
  }catch{
    return initSlots();
  }
}

function initSlots(){
  const base = {};
  for(let i=1;i<=SLOTS;i++) base[i] = "";
  return base;
}

function saveSlots(){
  localStorage.setItem(LS_KEY, JSON.stringify(slots));
}

function renderTabs(){
  slotsEl.innerHTML = "";
  for(let i=1;i<=SLOTS;i++){
    const b = document.createElement("button");
    b.className = "tab" + (i===activeSlot ? " active" : "");
    b.textContent = `Script ${i}`;
    b.onclick = () => {
      persistActiveText();
      activeSlot = i;
      loadActiveText();
      renderTabs();
      syncTeleprompterText();
      resetScroll();
    };
    slotsEl.appendChild(b);
  }
}

function persistActiveText(){
  slots[activeSlot] = scriptInput.value || "";
  saveSlots();
}

function loadActiveText(){
  scriptInput.value = slots[activeSlot] || "";
}

function syncTeleprompterText(){
  const t = scriptInput.value || "";
  content.textContent = t;
  presentContent.textContent = t;
  // Recompute bounds
  requestAnimationFrame(() => {
    clampScroll();
    applyScroll();
  });
}

function resetScroll(){
  y = 0;
  lastTs = null;
  applyScroll();
}

function clampScroll(){
  const h = content.scrollHeight;
  const wrapH = viewer.clientHeight;
  const maxY = Math.max(0, h - wrapH + 40);
  if(y > maxY) y = maxY;
  if(y < 0) y = 0;

  const ph = presentContent.scrollHeight;
  const pWrapH = presentView.clientHeight;
  const pMaxY = Math.max(0, ph - pWrapH + 80);
  // Keep present in sync with y (same ratio)
  const ratio = maxY === 0 ? 0 : (y / maxY);
  presentY = ratio * pMaxY;
  if(presentY < 0) presentY = 0;
  if(presentY > pMaxY) presentY = pMaxY;
}

let presentY = 0;

function applyScroll(){
  content.style.transform = `translateY(${-y}px)`;
  presentContent.style.transform = `translateY(${-presentY}px)`;
}

function speedPxPerSec(){
  // speed slider is "reading speed" proxy; map to px/s
  const v = Number(speed.value);
  return v * 6; // 60 -> 360 px/s
}

function tick(ts){
  if(!isPlaying) return;
  if(lastTs == null) lastTs = ts;
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  y += speedPxPerSec() * dt;
  clampScroll();
  applyScroll();

  rafId = requestAnimationFrame(tick);
}

function play(){
  if(isPlaying) return;
  isPlaying = true;
  btnPlay.textContent = "Pause";
  pPlay.textContent = "Pause";
  rafId = requestAnimationFrame(tick);
}

function pause(){
  isPlaying = false;
  btnPlay.textContent = "Play";
  pPlay.textContent = "Play";
  if(rafId) cancelAnimationFrame(rafId);
  rafId = null;
  lastTs = null;
}

function togglePlay(){
  isPlaying ? pause() : play();
}

function setFont(px){
  content.style.fontSize = `${px}px`;
  presentContent.style.fontSize = `${Math.max(px, 40) + 16}px`;
}

function setAlign(a){
  content.style.textAlign = a;
  presentContent.style.textAlign = a;
}

function toggleMirror(){
  viewerWrap.classList.toggle("mirrored");
  presentOverlay.classList.toggle("mirroredPresent");
}

function toggleFullscreen(){
  const el = document.documentElement;
  if(!document.fullscreenElement){
    el.requestFullscreen?.();
  }else{
    document.exitFullscreen?.();
  }
}

function openPresent(){
  persistActiveText();
  syncTeleprompterText();
  presentOverlay.classList.remove("hidden");
  // Try fullscreen for best experience (optional)
  presentOverlay.requestFullscreen?.().catch(()=>{});
  // Sync present controls
  pSpeed.value = speed.value;
  pSpeedVal.textContent = speed.value;
  pFont.value = Math.max(Number(fontSize.value), 40) + 16;
  pFontVal.textContent = pFont.value;
  requestAnimationFrame(() => {
    clampScroll();
    applyScroll();
  });
}

function closePresent(){
  presentOverlay.classList.add("hidden");
  if(document.fullscreenElement){
    document.exitFullscreen?.();
  }
}

// UI bindings
btnSave.onclick = () => { persistActiveText(); };
btnClear.onclick = () => {
  scriptInput.value = "";
  persistActiveText();
  syncTeleprompterText();
  resetScroll();
};

scriptInput.addEventListener("input", () => {
  syncTeleprompterText();
});

btnPlay.onclick = togglePlay;
pPlay.onclick = togglePlay;

btnReset.onclick = () => { pause(); resetScroll(); };
pReset.onclick = () => { pause(); resetScroll(); };

speed.addEventListener("input", () => {
  speedVal.textContent = speed.value;
  pSpeed.value = speed.value;
  pSpeedVal.textContent = speed.value;
});

pSpeed.addEventListener("input", () => {
  speed.value = pSpeed.value;
  speedVal.textContent = speed.value;
  pSpeedVal.textContent = pSpeed.value;
});

fontSize.addEventListener("input", () => {
  fontVal.textContent = fontSize.value;
  setFont(Number(fontSize.value));
  // keep present in sync
  pFont.value = Math.max(Number(fontSize.value), 40) + 16;
  pFontVal.textContent = pFont.value;
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
});

pFont.addEventListener("input", () => {
  pFontVal.textContent = pFont.value;
  // reflect to main font (reverse mapping)
  const mainPx = Math.max(Number(pFont.value) - 16, 18);
  fontSize.value = String(mainPx);
  fontVal.textContent = fontSize.value;
  setFont(mainPx);
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
});

align.addEventListener("change", () => {
  setAlign(align.value);
});

btnFullscreen.onclick = toggleFullscreen;
btnMirror.onclick = toggleMirror;
pMirror.onclick = toggleMirror;

btnPresent.onclick = openPresent;
pExit.onclick = closePresent;

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
  const inText = tag === "textarea" || tag === "input";

  if(e.code === "Space" && !inText){
    e.preventDefault();
    togglePlay();
  }
  if(e.key === "f" || e.key === "F"){ toggleFullscreen(); }
  if(e.key === "m" || e.key === "M"){ toggleMirror(); }
  if(e.key === "r" || e.key === "R"){ pause(); resetScroll(); }

  if(e.key === "ArrowUp"){ speed.value = String(Math.min(200, Number(speed.value)+5)); speed.dispatchEvent(new Event("input")); }
  if(e.key === "ArrowDown"){ speed.value = String(Math.max(5, Number(speed.value)-5)); speed.dispatchEvent(new Event("input")); }
  if(e.key === "+"){ fontSize.value = String(Math.min(72, Number(fontSize.value)+2)); fontSize.dispatchEvent(new Event("input")); }
  if(e.key === "-"){ fontSize.value = String(Math.max(18, Number(fontSize.value)-2)); fontSize.dispatchEvent(new Event("input")); }
});

// Init
renderTabs();
loadActiveText();
syncTeleprompterText();
speedVal.textContent = speed.value;
fontVal.textContent = fontSize.value;
setFont(Number(fontSize.value));
setAlign(align.value);
resetScroll();
