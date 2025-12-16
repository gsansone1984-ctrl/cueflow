const $ = (id) => document.getElementById(id);

/* Main */
const viewer = $("viewer");
const editor = $("editor");
const player = $("player");
const scriptEditor = $("scriptEditor");
const scrollLayer = $("scrollLayer");
const scriptPlayer = $("scriptPlayer");

/* Controls */
const speed = $("speed");
const speedVal = $("speedVal");
const size = $("size");
const sizeVal = $("sizeVal");
const align = $("align");
const clearBtn = $("clearBtn");

/* Actions */
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

/* Menu */
function openMenu(){ menuPanel.classList.remove("hidden"); menuBtn.setAttribute("aria-expanded","true"); }
function closeMenu(){ menuPanel.classList.add("hidden"); menuBtn.setAttribute("aria-expanded","false"); }
function toggleMenu(){ menuPanel.classList.contains("hidden") ? openMenu() : closeMenu(); }

/* About */
function openAbout(){ aboutModal.classList.remove("hidden"); closeMenu(); }
function closeAbout(){ aboutModal.classList.add("hidden"); }

/* Paste reliability: always focus editor on tap/click */
function focusEditor(){
  scriptEditor.focus();
}
viewer.addEventListener("pointerdown", () => { if(!playing) focusEditor(); });

/* Sync editor -> player (for scrolling mode + present) */
function syncPlayer(){
  scriptPlayer.innerHTML = scriptEditor.innerHTML || "";
  scriptPlayer.style.fontSize = `${size.value}px`;
  scriptPlayer.style.textAlign = align.value;

  if(isPresentOpen()){
    pScript.innerHTML = scriptEditor.innerHTML || "";
    pScript.style.textAlign = align.value;
  }
}

/* Scroll geometry */
function startOffset(el, pad){
  const h = el.clientHeight || 0;
  return Math.max(0, h - pad);
}
function applyTransforms(){
  const start = startOffset(viewer, 80);
  scrollLayer.style.transform = `translateY(${start - y}px)`;

  if(isPresentOpen()){
    const pStart = startOffset(pViewer, 140);
    pScrollLayer.style.transform = `translateY(${pStart - pY}px)`;
  }
}
function clampScroll(){
  const vh = viewer.clientHeight || 1;
  const start = startOffset(viewer, 80);
  const total = scriptPlayer.scrollHeight + start;
  const maxY = Math.max(0, total - vh + 60);
  y = Math.min(Math.max(y, 0), maxY);

  if(isPresentOpen()){
    const pH = pViewer.clientHeight || 1;
    const pStart = startOffset(pViewer, 140);
    const pTotal = pScript.scrollHeight + pStart;
    const pMax = Math.max(0, pTotal - pH + 120);

    const ratio = maxY === 0 ? 0 : (y / maxY);
    pY = ratio * pMax;
    pY = Math.min(Math.max(pY, 0), pMax);
  }
}
function resetScroll(){
  y = 0;
  pY = 0;
  lastTs = null;
  applyTransforms();
}

/* Play */
function pxPerSec(){ return Number(speed.value) * 6; }
function setLabels(){
  const t = playing ? "Pause" : "Play";
  playBtn.textContent = t;
  mPlayBtn.textContent = t;
  pPlayBtn.textContent = t;
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

function play(){
  if(playing) return;
  playing = true;

  // swap: editor OFF, player ON
  editor.classList.add("hidden");
  player.classList.remove("hidden");

  syncPlayer();
  setLabels();
  raf = requestAnimationFrame(tick);
}

function pause(){
  playing = false;
  if(raf) cancelAnimationFrame(raf);
  raf = null;
  lastTs = null;

  // swap back: editor ON, player OFF
  player.classList.add("hidden");
  editor.classList.remove("hidden");

  setLabels();
  focusEditor();
}

function togglePlay(){ playing ? pause() : play(); }

/* Mirror (pro = only player text / present text) */
function toggleMirror(){
  viewer.classList.toggle("mirrored");
  if(isPresentOpen()) pViewer.classList.toggle("mirrored");
}

/* Fullscreen */
async function toggleFullscreen(){
  try{
    if(!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  }catch(_){}
}

/* Present */
function openPresent(){
  syncPlayer();

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

/* Clear */
function clearAll(){
  pause();
  scriptEditor.innerHTML = "";
  scriptPlayer.innerHTML = "";
  pScript.innerHTML = "";
  resetScroll();
  closeMenu();
  closeAbout();
}

/* Formatting (works on editor) */
function exec(cmd){
  focusEditor();
  document.execCommand(cmd, false, null);
  syncPlayer();
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
}
function setTextColor(color){
  focusEditor();
  document.execCommand("foreColor", false, color);
  syncPlayer();
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
}
function setHighlight(color){
  focusEditor();
  const ok = document.execCommand("backColor", false, color);
  if(!ok) document.execCommand("hiliteColor", false, color);
  syncPlayer();
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
}

/* Bind */
speed.addEventListener("input", () => {
  speedVal.textContent = speed.value;
  if(isPresentOpen()){ pSpeed.value = speed.value; pSpeedVal.textContent = speed.value; }
});

size.addEventListener("input", () => {
  sizeVal.textContent = size.value;
  scriptEditor.style.fontSize = `${size.value}px`;
  syncPlayer();
});

align.addEventListener("change", () => {
  scriptEditor.style.textAlign = align.value;
  syncPlayer();
});

scriptEditor.addEventListener("input", () => {
  syncPlayer();
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
});

/* Buttons */
playBtn.onclick = togglePlay;
resetBtn.onclick = () => { pause(); resetScroll(); };
mirrorBtn.onclick = toggleMirror;
fullBtn.onclick = toggleFullscreen;
presentBtn.onclick = openPresent;

clearBtn.onclick = clearAll;

/* Mobile menu */
menuBtn.onclick = toggleMenu;
mPlayBtn.onclick = () => { togglePlay(); closeMenu(); };
mResetBtn.onclick = () => { pause(); resetScroll(); closeMenu(); };
mMirrorBtn.onclick = () => { toggleMirror(); closeMenu(); };
mFullBtn.onclick = () => { toggleFullscreen(); closeMenu(); };
mPresentBtn.onclick = () => { openPresent(); closeMenu(); };
mAboutBtn.onclick = openAbout;

/* About */
aboutBtn.onclick = openAbout;
aboutClose.onclick = closeAbout;
aboutModal.addEventListener("click", (e) => { if(e.target === aboutModal) closeAbout(); });

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

/* Formatting buttons */
fmtBold.onclick = () => exec("bold");
fmtItalic.onclick = () => exec("italic");
fmtUnderline.onclick = () => exec("underline");

tcYellow.onclick = () => setTextColor("#FFD400");
tcGreen.onclick = () => setTextColor("#00FF7B");
tcReset.onclick = () => setTextColor("#FFFFFF");

hlBlue.onclick = () => setHighlight("#4F7CFF");
hlPink.onclick = () => setHighlight("#FF4FD8");
hlClear.onclick = () => setHighlight("transparent");

/* Click outside menu closes it */
document.addEventListener("click", (e) => {
  if(menuPanel.classList.contains("hidden")) return;
  const inside = menuPanel.contains(e.target) || menuBtn.contains(e.target);
  if(!inside) closeMenu();
});

/* Shortcuts */
document.addEventListener("keydown", (e) => {
  const inEditor = (e.target && e.target.id) === "scriptEditor";

  if(inEditor && (e.ctrlKey || e.metaKey)){
    const k = e.key.toLowerCase();
    if(k === "b"){ e.preventDefault(); exec("bold"); }
    if(k === "i"){ e.preventDefault(); exec("italic"); }
    if(k === "u"){ e.preventDefault(); exec("underline"); }
  }

  if(e.code === "Space" && !inEditor){
    e.preventDefault();
    togglePlay();
  }
  if(e.key === "Escape"){
    closeMenu();
    closeAbout();
    if(isPresentOpen()) closePresent();
  }
});

/* Init: no saving */
window.addEventListener("load", () => {
  scriptEditor.innerHTML = "";
  scriptEditor.style.fontSize = `${size.value}px`;
  scriptEditor.style.textAlign = align.value;

  speedVal.textContent = speed.value;
  sizeVal.textContent = size.value;

  syncPlayer();
  setLabels();
  resetScroll();

  // allow immediate paste
  setTimeout(() => focusEditor(), 50);
});

window.addEventListener("resize", () => {
  requestAnimationFrame(() => { clampScroll(); applyTransforms(); });
});
