const $ = (id) => document.getElementById(id);

/* Main */
const viewer = $("viewer");
const scrollLayer = $("scrollLayer");
const script = $("script");

/* Controls */
const speed = $("speed");
const speedVal = $("speedVal");
const size = $("size");
const sizeVal = $("sizeVal");
const align = $("align");
const clearBtn = $("clearBtn");

/* Desktop actions */
const playBtn = $("playBtn");
const resetBtn = $("resetBtn");
const mirrorBtn = $("mirrorBtn");
const fullBtn = $("fullBtn");
const presentBtn = $("presentBtn");

/* Mobile menu */
const menuBtn = $("menuBtn");
const menuPanel = $("menuPanel");
const mPlayBtn = $("mPlayBtn");
const mResetBtn = $("mResetBtn");
const mMirrorBtn = $("mMirrorBtn");
const mFullBtn = $("mFullBtn");
const mPresentBtn = $("mPresentBtn");
const mAboutBtn = $("mAboutBtn");

/* Formatting */
const fmtBold = $("fmtBold");
const fmtItalic = $("fmtItalic");
const fmtUnderline = $("fmtUnderline");

const tcYellow = $("tcYellow");
const tcGreen = $("tcGreen");
const tcReset = $("tcReset");

const hlBlue = $("hlBlue");
const hlPink = $("hlPink");
const hlClear = $("hlClear");

/* About */
const aboutModal = $("aboutModal");
const aboutBtn = $("aboutBtn");
const aboutClose = $("aboutClose");

/* Present */
const presentOverlay = $("presentOverlay");
const pViewer = $("pViewer");
const pScrollLayer = $("pScrollLayer");
const pScript = $("pScript");

const pPlayBtn = $("pPlayBtn");
const pResetBtn = $("pResetBtn");
const pMirrorBtn = $("pMirrorBtn");
const pExitBtn = $("pExitBtn");

const pSpeed = $("pSpeed");
const pSpeedVal = $("pSpeedVal");
const pSize = $("pSize");
const pSizeVal = $("pSizeVal");

/* State */
let playing = false;
let raf = null;
let lastTs = null;
let y = 0;
let pY = 0;

function isPresentOpen(){
  return !presentOverlay.classList.contains("hidden");
}

/* Ensure editor focus works (fix paste issues) */
function focusEditor(){
  script.focus();
}
viewer.addEventListener("pointerdown", () => {
  if (!playing) focusEditor();
});

/* Menu */
function openMenu(){
  menuPanel.classList.remove("hidden");
  menuBtn.setAttribute("aria-expanded", "true");
}
function closeMenu(){
  menuPanel.classList.add("hidden");
  menuBtn.setAttribute("aria-expanded", "false");
}
function toggleMenu(){
  menuPanel.classList.contains("hidden") ? openMenu() : closeMenu();
}

/* About */
function openAbout(){
  aboutModal.classList.remove("hidden");
  closeMenu();
}
function closeAboutModal(){
  aboutModal.classList.add("hidden");
}

/* Scroll helpers */
function startOffset(el, pad){
  const h = el.clientHeight || 0;
  return Math.max(0, h - pad);
}

function applyTransforms(){
  const mainStart = startOffset(viewer, 80);
  scrollLayer.style.transform = `translateY(${mainStart - y}px)`;

  if(isPresentOpen()){
    const pStart = startOffset(pViewer, 140);
    pScrollLayer.style.transform = `translateY(${pStart - pY}px)`;
  }
}

function clampScroll(){
  const mainH = viewer.clientHeight || 1;
  const mainStart = startOffset(viewer, 80);
  const totalMain = script.scrollHeight + mainStart;
  const maxMain = Math.max(0, totalMain - mainH + 60);
  y = Math.min(Math.max(y, 0), maxMain);

  if(isPresentOpen()){
    const pH = pViewer.clientHeight || 1;
    const pStart = startOffset(pViewer, 140);
    const totalP = pScript.scrollHeight + pStart;
    const maxP = Math.max(0, totalP - pH + 120);

    const ratio = maxMain === 0 ? 0 : (y / maxMain);
    pY = ratio * maxP;
    pY = Math.min(Math.max(pY, 0), maxP);
  }
}

function resetScroll(){
  y = 0;
  pY = 0;
  lastTs = null;
  applyTransforms();
}

/* Play */
function pxPerSec(){
  return Number(speed.value) * 6;
}

function tick(ts){
  if(!playing) return;
  if(lastTs === null) lastTs = ts;

  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  y += pxPerSec() * dt;
  clampScroll();
  applyTransforms();
  raf = requestAnimationFrame(tick);
}

function setPlayLabels(){
  const label = playing ? "Pause" : "Play";
  playBtn.textContent = label;
  mPlayBtn.textContent = label;
  pPlayBtn.textContent = label;
}

function syncPresent(){
  if(isPresentOpen()){
    pScript.innerHTML = script.innerHTML || "";
    pScript.style.textAlign = align.value;
  }
}

function play(){
  if(playing) return;
  playing = true;
  script.setAttribute("contenteditable", "false");
  syncPresent();
  setPlayLabels();
  raf = requestAnimationFrame(tick);
}

function pause(){
  playing = false;
  if(raf) cancelAnimationFrame(raf);
  raf = null;
  lastTs = null;
  script.setAttribute("contenteditable", "true");
  setPlayLabels();
}

function togglePlay(){
  playing ? pause() : play();
}

/* Mirror pro (text only) */
function toggleMirror(){
  viewer.classList.toggle("mirrored");
  if(isPresentOpen()) pViewer.classList.toggle("mirrored");
}

/* Fullscreen */
async function toggleFullscreen(){
  try{
    if(!document.fullscreenElement){
      await document.documentElement.requestFullscreen();
    }else{
      await document.exitFullscreen();
    }
  }catch(_){}
}

/* Present */
function openPresent(){
  syncPresent();
  pSpeed.value = speed.value;
  pSpeedVal.textContent = pSpeed.value;

  pSize.value = Math.max(Number(size.value) + 16, 48);
  pSizeVal.textContent = pSize.value;
  pScript.style.fontSize = `${pSize.value}px`;

  presentOverlay.classList.remove("hidden");
  pViewer.classList.toggle("mirrored", viewer.classList.contains("mirrored"));

  resetScroll();
  applyTransforms();
}

function closePresent(){
  presentOverlay.classList.add("hidden");
}

/* Clear (no saving) */
function clearAll(){
  pause();
  script.innerHTML = "";
  if(isPresentOpen()) pScript.innerHTML = "";
  resetScroll();
  closeMenu();
  closeAboutModal();
}

/* Formatting */
function exec(cmd){
  focusEditor();
  document.execCommand(cmd, false, null);
  syncPresent();
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
}

function setTextColor(color){
  focusEditor();
  document.execCommand("foreColor", false, color);
  syncPresent();
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
}

function setHighlight(color){
  focusEditor();
  const ok = document.execCommand("backColor", false, color);
  if(!ok) document.execCommand("hiliteColor", false, color);
  syncPresent();
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
}

/* Bind UI */
speed.addEventListener("input", () => {
  speedVal.textContent = speed.value;
  if(isPresentOpen()){
    pSpeed.value = speed.value;
    pSpeedVal.textContent = speed.value;
  }
});

size.addEventListener("input", () => {
  sizeVal.textContent = size.value;
  script.style.fontSize = `${size.value}px`;
  if(isPresentOpen()){
    pSize.value = Math.max(Number(size.value) + 16, 48);
    pSizeVal.textContent = pSize.value;
    pScript.style.fontSize = `${pSize.value}px`;
  }
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
});

align.addEventListener("change", () => {
  script.style.textAlign = align.value;
  if(isPresentOpen()) pScript.style.textAlign = align.value;
});

clearBtn.onclick = clearAll;

fmtBold.onclick = () => exec("bold");
fmtItalic.onclick = () => exec("italic");
fmtUnderline.onclick = () => exec("underline");

tcYellow.onclick = () => setTextColor("#FFD400");
tcGreen.onclick = () => setTextColor("#00FF7B");
tcReset.onclick = () => setTextColor("#FFFFFF");

hlBlue.onclick = () => setHighlight("#4F7CFF");
hlPink.onclick = () => setHighlight("#FF4FD8");
hlClear.onclick = () => setHighlight("transparent");

/* Keep present synced while typing/pasting */
script.addEventListener("input", () => {
  syncPresent();
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
});

/* Desktop buttons */
playBtn.onclick = togglePlay;
resetBtn.onclick = () => { pause(); resetScroll(); };
mirrorBtn.onclick = toggleMirror;
fullBtn.onclick = toggleFullscreen;
presentBtn.onclick = () => { closeMenu(); openPresent(); };

/* Mobile menu buttons */
menuBtn.onclick = toggleMenu;
mPlayBtn.onclick = () => { togglePlay(); closeMenu(); };
mResetBtn.onclick = () => { pause(); resetScroll(); closeMenu(); };
mMirrorBtn.onclick = () => { toggleMirror(); closeMenu(); };
mFullBtn.onclick = () => { toggleFullscreen(); closeMenu(); };
mPresentBtn.onclick = () => { closeMenu(); openPresent(); };
mAboutBtn.onclick = openAbout;

/* About */
aboutBtn.onclick = openAbout;
aboutClose.onclick = closeAboutModal;
aboutModal.addEventListener("click", (e) => { if(e.target === aboutModal) closeAboutModal(); });

/* Present controls */
pPlayBtn.onclick = togglePlay;
pResetBtn.onclick = () => { pause(); resetScroll(); };
pMirrorBtn.onclick = toggleMirror;
pExitBtn.onclick = () => { pause(); closePresent(); };

pSpeed.addEventListener("input", () => {
  speed.value = pSpeed.value;
  speedVal.textContent = speed.value;
  pSpeedVal.textContent = pSpeed.value;
});
pSize.addEventListener("input", () => {
  pSizeVal.textContent = pSize.value;
  pScript.style.fontSize = `${pSize.value}px`;
});

/* Click outside menu closes it */
document.addEventListener("click", (e) => {
  if(menuPanel.classList.contains("hidden")) return;
  const inside = menuPanel.contains(e.target) || menuBtn.contains(e.target);
  if(!inside) closeMenu();
});

/* Keyboard shortcuts */
document.addEventListener("keydown", (e) => {
  const inEditor = (e.target && e.target.id) === "script";

  // Formatting shortcuts inside editor
  if(inEditor && (e.ctrlKey || e.metaKey)){
    const k = e.key.toLowerCase();
    if(k === "b"){ e.preventDefault(); exec("bold"); }
    if(k === "i"){ e.preventDefault(); exec("italic"); }
    if(k === "u"){ e.preventDefault(); exec("underline"); }
  }

  // Global shortcuts
  if(e.code === "Space" && !inEditor){
    e.preventDefault();
    togglePlay();
  }
  if(e.key === "Escape"){
    closeMenu();
    closeAboutModal();
    if(isPresentOpen()) closePresent();
  }
});

/* Init: empty on load, no saving */
window.addEventListener("load", () => {
  script.innerHTML = "";
  script.style.fontSize = `${size.value}px`;
  script.style.textAlign = align.value;

  speedVal.textContent = speed.value;
  sizeVal.textContent = size.value;

  setPlayLabels();
  resetScroll();

  // Important: allow immediate paste
  setTimeout(() => focusEditor(), 50);
});

window.addEventListener("resize", () => {
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
});
