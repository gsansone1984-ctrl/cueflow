const $ = (id) => document.getElementById(id);

/* top actions */
const btnMode = $("btnMode");
const btnResetTop = $("btnReset");
const btnMirror = $("btnMirror");
const btnSiteMirror = $("btnSiteMirror");
const btnFullscreen = $("btnFullscreen");
const btnPresent = $("btnPresent");

/* menu */
const btnMenu = $("btnMenu");
const mobileMenu = $("mobileMenu");
const mBtnMode = $("mBtnMode");
const mBtnReset = $("mBtnReset");
const mBtnMirror = $("mBtnMirror");
const mBtnSiteMirror = $("mBtnSiteMirror");
const mBtnFullscreen = $("mBtnFullscreen");
const mBtnPresent = $("mBtnPresent");

/* controls */
const speed = $("speed");
const speedVal = $("speedVal");
const fontSize = $("fontSize");
const fontVal = $("fontVal");
const align = $("align");
const btnClear = $("btnClear");

/* formatting */
const fmtBold = $("fmtBold");
const fmtItalic = $("fmtItalic");
const fmtUnderline = $("fmtUnderline");
const tcYellow = $("tcYellow");
const tcGreen = $("tcGreen");
const tcReset = $("tcReset");
const hlBlue = $("hlBlue");
const hlPink = $("hlPink");
const hlClear = $("hlClear");

/* viewer */
const viewerWrap = $("viewerWrap");
const scrollLayer = $("scrollLayer");
const script = $("script");

/* About */
const aboutLink = $("aboutLink");
const aboutModal = $("aboutModal");
const aboutClose = $("aboutClose");

/* Present */
const presentOverlay = $("presentOverlay");
const presentView = $("presentView");
const presentScrollLayer = $("presentScrollLayer");
const presentScript = $("presentScript");
const pMode = $("pMode");
const pReset = $("pReset");
const pExit = $("pExit");
const pSpeed = $("pSpeed");
const pSpeedVal = $("pSpeedVal");
const pFont = $("pFont");
const pFontVal = $("pFontVal");
const pMirror = $("pMirror");

/* state */
let isPlaying = false;
let rafId = null;
let y = 0;
let presentY = 0;
let lastTs = null;

function clamp(n, min, max){ return Math.min(Math.max(n, min), max); }

/* -------- menu -------- */
function openMobileMenu(){
  mobileMenu.classList.remove("hidden");
  btnMenu.setAttribute("aria-expanded", "true");
}
function closeMobileMenu(){
  mobileMenu.classList.add("hidden");
  btnMenu.setAttribute("aria-expanded", "false");
}
function toggleMobileMenu(){
  mobileMenu.classList.contains("hidden") ? openMobileMenu() : closeMobileMenu();
}

/* -------- about -------- */
function openAbout(e){
  e?.preventDefault?.();
  aboutModal.classList.remove("hidden");
  closeMobileMenu();
}
function closeAbout(){
  aboutModal.classList.add("hidden");
}

/* -------- sync to present -------- */
function syncPresent(){
  presentScript.innerHTML = script.innerHTML || "";
}

/* -------- scrolling offsets (start from bottom) -------- */
function mainViewerH(){
  const h = viewerWrap?.clientHeight || 0;
  return h > 50 ? h : Math.floor(window.innerHeight * 0.6);
}
function presentViewerH(){
  const h = presentView?.clientHeight || 0;
  return h > 50 ? h : Math.floor(window.innerHeight * 0.75);
}
function startOffsetMain(){ return Math.max(0, mainViewerH() - 70); }
function startOffsetPresent(){ return Math.max(0, presentViewerH() - 140); }

/* -------- scrolling -------- */
function resetScroll(){
  y = 0; presentY = 0; lastTs = null;
  applyScroll();
}
function clampScroll(){
  const wrapH = mainViewerH();
  const s0 = startOffsetMain();

  const total = script.scrollHeight + s0;
  const maxY = Math.max(0, total - wrapH + 40);
  y = Math.min(Math.max(y, 0), maxY);

  const pWrapH = presentViewerH();
  const ps0 = startOffsetPresent();
  const pTotal = presentScript.scrollHeight + ps0;
  const pMaxY = Math.max(0, pTotal - pWrapH + 80);

  const ratio = maxY === 0 ? 0 : (y / maxY);
  presentY = ratio * pMaxY;
  presentY = Math.min(Math.max(presentY, 0), pMaxY);
}
function applyScroll(){
  scrollLayer.style.transform = `translateY(${startOffsetMain() - y}px)`;
  presentScrollLayer.style.transform = `translateY(${startOffsetPresent() - presentY}px)`;
}

/* -------- play/pause -------- */
function pxPerSec(){ return Number(speed.value) * 6; }

function tick(ts){
  if(!isPlaying) return;
  if(lastTs === null) lastTs = ts;
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  y += pxPerSec() * dt;
  clampScroll();
  applyScroll();
  rafId = requestAnimationFrame(tick);
}

function setModeLabels(){
  const label = isPlaying ? "Pause" : "Play";
  btnMode.textContent = label;
  mBtnMode.textContent = label;
  pMode.textContent = label;
}

function play(){
  if(isPlaying) return;
  isPlaying = true;
  // lock editing while playing
  script.setAttribute("contenteditable", "false");
  script.classList.add("locked");

  syncPresent();
  setModeLabels();
  rafId = requestAnimationFrame(tick);
}

function pause(){
  isPlaying = false;
  if(rafId) cancelAnimationFrame(rafId);
  rafId = null;
  lastTs = null;

  // unlock editing
  script.setAttribute("contenteditable", "true");
  script.classList.remove("locked");

  setModeLabels();
}

function togglePlay(){
  isPlaying ? pause() : play();
}

/* -------- formatting -------- */
function focusScript(){ script.focus(); }

function exec(cmd){
  focusScript();
  document.execCommand(cmd, false, null);
  syncPresent();
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}
function setTextColor(color){
  focusScript();
  document.execCommand("foreColor", false, color);
  syncPresent();
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}
function applyHighlight(color){
  focusScript();
  const ok = document.execCommand("backColor", false, color);
  if(!ok) document.execCommand("hiliteColor", false, color);
  syncPresent();
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}

/* -------- view tools -------- */
function setFont(px){
  script.style.fontSize = `${px}px`;
  presentScript.style.fontSize = `${Math.max(px, 40) + 16}px`;
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}
function setAlign(a){
  script.style.textAlign = a;
  presentScript.style.textAlign = a;
}
function toggleMirror(){
  viewerWrap.classList.toggle("mirrored");
  presentOverlay.classList.toggle("mirroredPresent");
}
function toggleSiteMirror(){
  document.body.classList.toggle("site-mirrored");
}
function toggleFullscreen(){
  if(!document.fullscreenElement){
    document.documentElement.requestFullscreen?.();
  }else{
    document.exitFullscreen?.();
  }
}

/* -------- present -------- */
function openPresent(){
  syncPresent();
  presentOverlay.classList.remove("hidden");
  presentOverlay.requestFullscreen?.().catch(()=>{});

  pSpeed.value = speed.value;
  pSpeedVal.textContent = speed.value;

  pFont.value = Math.max(Number(fontSize.value), 40) + 16;
  pFontVal.textContent = pFont.value;

  closeMobileMenu();
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}
function closePresent(){
  presentOverlay.classList.add("hidden");
  if(document.fullscreenElement) document.exitFullscreen?.();
}

/* -------- clear (no saving) -------- */
function clearAll(){
  pause();
  script.innerHTML = "";
  syncPresent();
  resetScroll();
  closeMobileMenu();
  closeAbout();
}

/* -------- bindings -------- */
btnMode.onclick = togglePlay;
mBtnMode.onclick = () => { togglePlay(); closeMobileMenu(); };
pMode.onclick = togglePlay;

btnResetTop.onclick = () => { pause(); resetScroll(); };
mBtnReset.onclick = () => { pause(); resetScroll(); closeMobileMenu(); };
pReset.onclick = () => { pause(); resetScroll(); };

btnMirror.onclick = toggleMirror;
btnSiteMirror.onclick = toggleSiteMirror;
btnFullscreen.onclick = toggleFullscreen;
btnPresent.onclick = openPresent;

mBtnMirror.onclick = () => { toggleMirror(); closeMobileMenu(); };
mBtnSiteMirror.onclick = () => { toggleSiteMirror(); closeMobileMenu(); };
mBtnFullscreen.onclick = () => { toggleFullscreen(); closeMobileMenu(); };
mBtnPresent.onclick = openPresent;

btnMenu.onclick = toggleMobileMenu;
document.addEventListener("click", (e) => {
  if(mobileMenu.classList.contains("hidden")) return;
  const inside = mobileMenu.contains(e.target) || btnMenu.contains(e.target);
  if(!inside) closeMobileMenu();
});

btnClear.onclick = clearAll;

speed.addEventListener("input", () => {
  speedVal.textContent = speed.value;
  pSpeed.value = speed.value;
  pSpeedVal.textContent = speed.value;
});
fontSize.addEventListener("input", () => {
  fontVal.textContent = fontSize.value;
  setFont(Number(fontSize.value));
  pFont.value = Math.max(Number(fontSize.value), 40) + 16;
  pFontVal.textContent = pFont.value;
});
align.addEventListener("change", () => setAlign(align.value));

pSpeed.addEventListener("input", () => {
  speed.value = pSpeed.value;
  speedVal.textContent = speed.value;
  pSpeedVal.textContent = pSpeed.value;
});
pFont.addEventListener("input", () => {
  pFontVal.textContent = pFont.value;
  const mainPx = Math.max(Number(pFont.value) - 16, 18);
  fontSize.value = String(mainPx);
  fontVal.textContent = fontSize.value;
  setFont(mainPx);
});

fmtBold.onclick = () => exec("bold");
fmtItalic.onclick = () => exec("italic");
fmtUnderline.onclick = () => exec("underline");
tcYellow.onclick = () => setTextColor("#FFD400");
tcGreen.onclick = () => setTextColor("#00FF7B");
tcReset.onclick = () => setTextColor("#FFFFFF");
hlBlue.onclick = () => applyHighlight("#4F7CFF");
hlPink.onclick = () => applyHighlight("#FF4FD8");
hlClear.onclick = () => applyHighlight("transparent");

script.addEventListener("input", () => {
  syncPresent();
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
});

/* shortcuts */
document.addEventListener("keydown", (e) => {
  const inScript = (e.target && e.target.id) === "script";

  if(inScript && (e.ctrlKey || e.metaKey)){
    const k = e.key.toLowerCase();
    if(k === "b"){ e.preventDefault(); exec("bold"); }
    if(k === "i"){ e.preventDefault(); exec("italic"); }
    if(k === "u"){ e.preventDefault(); exec("underline"); }
    return;
  }
  if(inScript && !isPlaying) return;

  if(e.code === "Space"){ e.preventDefault(); togglePlay(); }
  if((e.key === "m" || e.key === "M") && e.shiftKey){ toggleSiteMirror(); }
  else if(e.key === "m" || e.key === "M"){ toggleMirror(); }
  if(e.key === "f" || e.key === "F"){ toggleFullscreen(); }
  if(e.key === "r" || e.key === "R"){ pause(); resetScroll(); }
  if(e.key === "Escape"){ closeMobileMenu(); closeAbout(); }
});

aboutLink.onclick = openAbout;
aboutClose.onclick = closeAbout;
aboutModal.addEventListener("click", (e) => { if(e.target === aboutModal) closeAbout(); });

pExit.onclick = closePresent;
pMirror.onclick = toggleMirror;

window.addEventListener("resize", () => {
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
});

/* init */
function init(){
  // start empty (no saving)
  clearAll();

  speedVal.textContent = speed.value;
  fontVal.textContent = fontSize.value;

  setFont(Number(fontSize.value));
  setAlign(align.value);

  setModeLabels();
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}
init();

