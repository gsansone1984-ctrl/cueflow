const SLOTS = 5;
const LS_KEY = "cueflow_slots_v3_html";

const $ = (id) => document.getElementById(id);

const slotsEl = $("slots");
const scriptInput = $("scriptInput");
const btnSave = $("btnSave");
const btnClear = $("btnClear");

const fmtBold = $("fmtBold");
const fmtItalic = $("fmtItalic");
const fmtUnderline = $("fmtUnderline");

const tcYellow = $("tcYellow");
const tcGreen = $("tcGreen");
const tcReset = $("tcReset");

const hlBlue = $("hlBlue");
const hlPink = $("hlPink");
const hlClear = $("hlClear");

const btnPlay = $("btnPlay");
const btnReset = $("btnReset");
const speed = $("speed");
const speedVal = $("speedVal");
const fontSize = $("fontSize");
const fontVal = $("fontVal");
const align = $("align");

const viewerWrap = $("viewerWrap");
const viewer = $("viewer");
const scrollLayer = $("scrollLayer");
const content = $("content");

const btnFullscreen = $("btnFullscreen");
const btnMirror = $("btnMirror");
const btnPresent = $("btnPresent");

const presentOverlay = $("presentOverlay");
const presentView = $("presentView");
const presentScrollLayer = $("presentScrollLayer");
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

// scroll offsets
let y = 0;
let presentY = 0;
let lastTs = null;

/* ---------- storage ---------- */
function initSlots(){
  const base = {};
  for(let i=1;i<=SLOTS;i++) base[i] = "";
  return base;
}

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

function saveSlots(){
  localStorage.setItem(LS_KEY, JSON.stringify(slots));
}

/* ---------- tabs ---------- */
function renderTabs(){
  slotsEl.innerHTML = "";
  for(let i=1;i<=SLOTS;i++){
    const b = document.createElement("button");
    b.className = "tab" + (i===activeSlot ? " active" : "");
    b.textContent = `Script ${i}`;
    b.onclick = () => {
      persistActiveHTML();
      activeSlot = i;
      loadActiveHTML();
      renderTabs();
      syncTeleprompterHTML();
      resetScroll();
    };
    slotsEl.appendChild(b);
  }
}

function persistActiveHTML(){
  slots[activeSlot] = scriptInput.innerHTML || "";
  saveSlots();
}

function loadActiveHTML(){
  scriptInput.innerHTML = slots[activeSlot] || "";
}

/* ---------- sync ---------- */
function syncTeleprompterHTML(){
  const html = scriptInput.innerHTML || "";
  content.innerHTML = html;
  presentContent.innerHTML = html;
  requestAnimationFrame(() => {
    clampScroll();
    applyScroll();
  });
}

/* ---------- scrolling ---------- */
function resetScroll(){
  y = 0;
  presentY = 0;
  lastTs = null;
  applyScroll();
}

function clampScroll(){
  const h = content.scrollHeight;
  const wrapH = viewer.clientHeight;
  const maxY = Math.max(0, h - wrapH + 40);
  y = Math.min(Math.max(y, 0), maxY);

  const ph = presentContent.scrollHeight;
  const pWrapH = presentView.clientHeight;
  const pMaxY = Math.max(0, ph - pWrapH + 80);

  const ratio = maxY === 0 ? 0 : (y / maxY);
  presentY = ratio * pMaxY;
  presentY = Math.min(Math.max(presentY, 0), pMaxY);
}

function applyScroll(){
  // NEW: apply translate to scroll layers, not the text nodes
  scrollLayer.style.transform = `translateY(${-y}px)`;
  presentScrollLayer.style.transform = `translateY(${-presentY}px)`;
}

function speedPxPerSec(){
  return Number(speed.value) * 6;
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

/* ---------- formatting helpers ---------- */
function focusEditor(){ scriptInput.focus(); }

function exec(cmd, value=null){
  focusEditor();
  document.execCommand(cmd, false, value);
  persistActiveHTML();
  syncTeleprompterHTML();
}

function setTextColor(color){
  focusEditor();
  document.execCommand("foreColor", false, color);
  persistActiveHTML();
  syncTeleprompterHTML();
}

function applyHighlight(color){
  focusEditor();
  const ok = document.execCommand("backColor", false, color);
  if(!ok) document.execCommand("hiliteColor", false, color);
  persistActiveHTML();
  syncTeleprompterHTML();
}

function clearHighlight(){
  applyHighlight("transparent");
}

/* ---------- view settings ---------- */
function setFont(px){
  content.style.fontSize = `${px}px`;
  presentContent.style.fontSize = `${Math.max(px, 40) + 16}px`;
}

function setAlign(a){
  content.style.textAlign = a;
  presentContent.style.textAlign = a;
}

function toggleMirror(){
  // NEW: mirror via wrapper classes only
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
  persistActiveHTML();
  syncTeleprompterHTML();

  presentOverlay.classList.remove("hidden");
  presentOverlay.requestFullscreen?.().catch(()=>{});

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

/* ---------- bindings ---------- */
btnSave.onclick = () => persistActiveHTML();
btnClear.onclick = () => {
  scriptInput.innerHTML = "";
  persistActiveHTML();
  syncTeleprompterHTML();
  resetScroll();
};

scriptInput.addEventListener("input", () => {
  persistActiveHTML();
  syncTeleprompterHTML();
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
  pFont.value = Math.max(Number(fontSize.value), 40) + 16;
  pFontVal.textContent = pFont.value;
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
});

pFont.addEventListener("input", () => {
  pFontVal.textContent = pFont.value;
  const mainPx = Math.max(Number(pFont.value) - 16, 18);
  fontSize.value = String(mainPx);
  fontVal.textContent = fontSize.value;
  setFont(mainPx);
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
});

align.addEventListener("change", () => setAlign(align.value));

btnFullscreen.onclick = toggleFullscreen;
btnMirror.onclick = toggleMirror;
pMirror.onclick = toggleMirror;

btnPresent.onclick = openPresent;
pExit.onclick = closePresent;

/* formatting buttons */
fmtBold.onclick = () => exec("bold");
fmtItalic.onclick = () => exec("italic");
fmtUnderline.onclick = () => exec("underline");

tcYellow.onclick = () => setTextColor("#ffd400");
tcGreen.onclick = () => setTextColor("#00ff7b");
tcReset.onclick = () => setTextColor("#ffffff");

hlBlue.onclick = () => applyHighlight("#4f7cff");
hlPink.onclick = () => applyHighlight("#ff4fd8");
hlClear.onclick = () => clearHighlight();

/* shortcuts */
document.addEventListener("keydown", (e) => {
  const inEditor = (e.target && e.target.id) === "scriptInput";

  if(inEditor && (e.ctrlKey || e.metaKey)){
    const k = e.key.toLowerCase();
    if(k === "b"){ e.preventDefault(); exec("bold"); }
    if(k === "i"){ e.preventDefault(); exec("italic"); }
    if(k === "u"){ e.preventDefault(); exec("underline"); }
    return;
  }

  if(inEditor) return;

  if(e.code === "Space"){ e.preventDefault(); togglePlay(); }
  if(e.key === "f" || e.key === "F"){ toggleFullscreen(); }
  if(e.key === "m" || e.key === "M"){ toggleMirror(); }
  if(e.key === "r" || e.key === "R"){ pause(); resetScroll(); }

  if(e.key === "ArrowUp"){ speed.value = String(Math.min(200, Number(speed.value)+5)); speed.dispatchEvent(new Event("input")); }
  if(e.key === "ArrowDown"){ speed.value = String(Math.max(5, Number(speed.value)-5)); speed.dispatchEvent(new Event("input")); }
  if(e.key === "+"){ fontSize.value = String(Math.min(72, Number(fontSize.value)+2)); fontSize.dispatchEvent(new Event("input")); }
  if(e.key === "-"){ fontSize.value = String(Math.max(18, Number(fontSize.value)-2)); fontSize.dispatchEvent(new Event("input")); }
});

/* init */
renderTabs();
loadActiveHTML();
syncTeleprompterHTML();

speedVal.textContent = speed.value;
fontVal.textContent = fontSize.value;
setFont(Number(fontSize.value));
setAlign(align.value);
resetScroll();
