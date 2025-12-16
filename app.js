const $ = (id) => document.getElementById(id);

/* Main elements */
const viewer = $("viewer");
const scrollLayer = $("scrollLayer");
const mirrorLayer = $("mirrorLayer");
const script = $("script");

/* Controls */
const speed = $("speed");
const size = $("size");
const align = $("align");

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

/* About */
const aboutModal = $("aboutModal");
const aboutBtn = $("aboutBtn");
const aboutClose = $("aboutClose");

/* Present mode */
const presentOverlay = $("presentOverlay");
const pViewer = $("pViewer");
const pScrollLayer = $("pScrollLayer");
const pMirrorLayer = $("pMirrorLayer");
const pScript = $("pScript");

const pPlayBtn = $("pPlayBtn");
const pResetBtn = $("pResetBtn");
const pMirrorBtn = $("pMirrorBtn");
const pExitBtn = $("pExitBtn");

const pSpeed = $("pSpeed");
const pSize = $("pSize");

/* State */
let playing = false;
let raf = null;
let lastTs = null;
let y = 0;
let pY = 0;

function isPresentOpen(){
  return !presentOverlay.classList.contains("hidden");
}

/* Utility: menu */
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

/* Utility: start offset from bottom */
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
  // Main
  const mainH = viewer.clientHeight || 1;
  const mainStart = startOffset(viewer, 80);
  const totalMain = script.scrollHeight + mainStart;
  const maxMain = Math.max(0, totalMain - mainH + 60);
  y = Math.min(Math.max(y, 0), maxMain);

  // Present
  if(isPresentOpen()){
    const pH = pViewer.clientHeight || 1;
    const pStart = startOffset(pViewer, 140);
    const totalP = pScript.scrollHeight + pStart;
    const maxP = Math.max(0, totalP - pH + 120);

    // keep present roughly aligned to main progress
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

function pxPerSec(){
  return Number(speed.value) * 6; // tuned speed
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

function play(){
  if(playing) return;
  playing = true;

  // lock editing while playing
  script.setAttribute("contenteditable", "false");

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

/* Present mode */
function openPresent(){
  // copy content and settings
  pScript.innerHTML = script.innerHTML || "";
  pSpeed.value = speed.value;
  pSize.value = Math.max(Number(size.value) + 16, 48);

  pScript.style.textAlign = align.value;
  pScript.style.fontSize = `${pSize.value}px`;

  presentOverlay.classList.remove("hidden");
  pViewer.classList.toggle("mirrored", viewer.classList.contains("mirrored"));

  resetScroll();
  applyTransforms();
}

function closePresent(){
  presentOverlay.classList.add("hidden");
}

/* About */
function openAbout(){
  aboutModal.classList.remove("hidden");
  closeMenu();
}
function closeAboutModal(){
  aboutModal.classList.add("hidden");
}

/* No saving */
function clearAll(){
  pause();
  script.innerHTML = "";
  if(isPresentOpen()) pScript.innerHTML = "";
  resetScroll();
  closeMenu();
  closeAboutModal();
}

/* Bind controls */
size.addEventListener("input", () => {
  script.style.fontSize = `${size.value}px`;
  if(isPresentOpen()){
    pSize.value = Math.max(Number(size.value) + 16, 48);
    pScript.style.fontSize = `${pSize.value}px`;
  }
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
});

align.addEventListener("change", () => {
  script.style.textAlign = align.value;
  if(isPresentOpen()) pScript.style.textAlign = align.value;
});

speed.addEventListener("input", () => {
  if(isPresentOpen()){
    pSpeed.value = speed.value;
  }
});

script.addEventListener("input", () => {
  if(isPresentOpen()){
    pScript.innerHTML = script.innerHTML || "";
  }
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
});

/* Present controls */
pSpeed.addEventListener("input", () => {
  speed.value = pSpeed.value;
});

pSize.addEventListener("input", () => {
  pScript.style.fontSize = `${pSize.value}px`;
});

/* Buttons (desktop) */
playBtn.onclick = togglePlay;
resetBtn.onclick = () => { pause(); resetScroll(); };
mirrorBtn.onclick = toggleMirror;
fullBtn.onclick = toggleFullscreen;
presentBtn.onclick = () => { closeMenu(); openPresent(); };

/* Buttons (mobile menu) */
menuBtn.onclick = toggleMenu;
mPlayBtn.onclick = () => { togglePlay(); closeMenu(); };
mResetBtn.onclick = () => { pause(); resetScroll(); closeMenu(); };
mMirrorBtn.onclick = () => { toggleMirror(); closeMenu(); };
mFullBtn.onclick = () => { toggleFullscreen(); closeMenu(); };
mPresentBtn.onclick = () => { closeMenu(); openPresent(); };
mAboutBtn.onclick = openAbout;

/* About buttons */
aboutBtn.onclick = openAbout;
aboutClose.onclick = closeAboutModal;
aboutModal.addEventListener("click", (e) => { if(e.target === aboutModal) closeAboutModal(); });

/* Present buttons */
pPlayBtn.onclick = togglePlay;
pResetBtn.onclick = () => { pause(); resetScroll(); };
pMirrorBtn.onclick = toggleMirror;
pExitBtn.onclick = () => { pause(); closePresent(); };

/* Click outside menu closes it */
document.addEventListener("click", (e) => {
  if(menuPanel.classList.contains("hidden")) return;
  const inside = menuPanel.contains(e.target) || menuBtn.contains(e.target);
  if(!inside) closeMenu();
});

/* Shortcuts */
document.addEventListener("keydown", (e) => {
  const inEditor = (e.target && e.target.id) === "script";

  if(inEditor && !playing) return;

  if(e.code === "Space"){ e.preventDefault(); togglePlay(); }
  if(e.key.toLowerCase() === "m"){ toggleMirror(); }
  if(e.key.toLowerCase() === "f"){ toggleFullscreen(); }
  if(e.key.toLowerCase() === "r"){ pause(); resetScroll(); }
  if(e.key === "Escape"){ closeMenu(); closeAboutModal(); if(isPresentOpen()) closePresent(); }
});

/* Init */
window.addEventListener("load", () => {
  // guarantee empty on load (no save)
  script.innerHTML = "";
  script.style.fontSize = `${size.value}px`;
  script.style.textAlign = align.value;

  setPlayLabels();
  resetScroll();
});

window.addEventListener("resize", () => {
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
});

