const SLOTS = 5;
const $ = (id) => document.getElementById(id);

/* elements */
const slotsEl = $("slots");
const scriptInput = $("scriptInput");
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

const editorPanel = $("editorPanel");
const splitter = $("splitter");

const viewerWrap = $("viewerWrap");
const scrollLayer = $("scrollLayer");
const content = $("content");

const btnMirror = $("btnMirror");
const btnSiteMirror = $("btnSiteMirror");
const btnFullscreen = $("btnFullscreen");
const btnPresent = $("btnPresent");

/* mobile menu */
const btnMenu = $("btnMenu");
const mobileMenu = $("mobileMenu");
const mBtnMirror = $("mBtnMirror");
const mBtnSiteMirror = $("mBtnSiteMirror");
const mBtnFullscreen = $("mBtnFullscreen");
const mBtnPresent = $("mBtnPresent");

/* mobile view switch */
const viewSwitch = $("viewSwitch");
const btnViewEdit = $("btnViewEdit");
const btnViewPrompt = $("btnViewPrompt");

/* collapse editor (desktop) */
const btnCollapseEditor = $("btnCollapseEditor");
const collapseIcon = $("collapseIcon");

/* About */
const aboutLink = $("aboutLink");
const aboutModal = $("aboutModal");
const aboutClose = $("aboutClose");

/* present */
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

/* ------------------ state (IN MEMORY ONLY) ------------------ */
let slots = Array.from({ length: SLOTS }, () => "");
let activeSlot = 1;

let isPlaying = false;
let rafId = null;

let y = 0;
let presentY = 0;
let lastTs = null;

let isDragging = false;
let editorWidthPx = 420;

/* ------------------ helpers ------------------ */
function clamp(n, min, max){ return Math.min(Math.max(n, min), max); }
function isMobileLayout(){ return window.matchMedia("(max-width: 1024px)").matches; }

/* ------------------ mobile view mode ------------------ */
function setMobileView(mode){ // "edit" | "prompt"
  if(!isMobileLayout()) return;

  document.body.classList.toggle("mobile-view-edit", mode === "edit");
  document.body.classList.toggle("mobile-view-prompt", mode === "prompt");

  btnViewEdit?.classList.toggle("active", mode === "edit");
  btnViewPrompt?.classList.toggle("active", mode === "prompt");

  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}

function ensureMobileDefaults(){
  if(isMobileLayout()){
    if(!document.body.classList.contains("mobile-view-edit") &&
       !document.body.classList.contains("mobile-view-prompt")){
      document.body.classList.add("mobile-view-edit");
    }
    viewSwitch && (viewSwitch.style.display = "flex");
  }else{
    document.body.classList.remove("mobile-view-edit","mobile-view-prompt");
    viewSwitch && (viewSwitch.style.display = "none");
  }
}

/* ------------------ tabs ------------------ */
function renderTabs(){
  slotsEl.innerHTML = "";
  for(let i=1;i<=SLOTS;i++){
    const b = document.createElement("button");
    b.className = "tab" + (i === activeSlot ? " active" : "");
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
  slots[activeSlot - 1] = scriptInput.innerHTML || "";
}

function loadActiveHTML(){
  scriptInput.innerHTML = slots[activeSlot - 1] || "";
}

/* ------------------ sync ------------------ */
function syncTeleprompterHTML(){
  const html = scriptInput.innerHTML || "";
  content.innerHTML = html;
  presentContent.innerHTML = html;

  requestAnimationFrame(() => {
    clampScroll();
    applyScroll();
  });
}

/* ------------------ viewer height safe ------------------ */
function getMainViewerHeight(){
  const h = viewerWrap?.clientHeight || 0;
  if(h > 50) return h;
  return Math.floor(window.innerHeight * 0.60);
}
function getPresentViewerHeight(){
  const h = presentView?.clientHeight || 0;
  if(h > 50) return h;
  return Math.floor(window.innerHeight * 0.75);
}

/* ------------------ start-from-bottom offsets ------------------ */
function startOffsetMain(){
  const h = getMainViewerHeight();
  return Math.max(0, h - 70);
}
function startOffsetPresent(){
  const h = getPresentViewerHeight();
  return Math.max(0, h - 140);
}

/* ------------------ scrolling ------------------ */
function resetScroll(){
  y = 0;
  presentY = 0;
  lastTs = null;
  applyScroll();
}

function clampScroll(){
  const wrapH = getMainViewerHeight();
  const s0 = startOffsetMain();

  const total = content.scrollHeight + s0;
  const maxY = Math.max(0, total - wrapH + 40);
  y = Math.min(Math.max(y, 0), maxY);

  const pWrapH = getPresentViewerHeight();
  const ps0 = startOffsetPresent();
  const pTotal = presentContent.scrollHeight + ps0;
  const pMaxY = Math.max(0, pTotal - pWrapH + 80);

  const ratio = maxY === 0 ? 0 : (y / maxY);
  presentY = ratio * pMaxY;
  presentY = Math.min(Math.max(presentY, 0), pMaxY);
}

function applyScroll(){
  const s0 = startOffsetMain();
  const ps0 = startOffsetPresent();

  scrollLayer.style.transform = `translateY(${s0 - y}px)`;
  presentScrollLayer.style.transform = `translateY(${ps0 - presentY}px)`;
}

function speedPxPerSec(){
  return Number(speed.value) * 6;
}

function tick(ts){
  if(!isPlaying) return;

  if(lastTs === null) lastTs = ts;
  const dt = (ts - lastTs) / 1000;
  lastTs = ts;

  y += speedPxPerSec() * dt;
  clampScroll();
  applyScroll();

  rafId = requestAnimationFrame(tick);
}

/* ------------------ play ------------------ */
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
  if(isMobileLayout() && !document.body.classList.contains("mobile-view-prompt")){
    setMobileView("prompt");
  }
  isPlaying ? pause() : play();
}

/* ------------------ formatting ------------------ */
function focusEditor(){ scriptInput.focus(); }

function exec(cmd){
  focusEditor();
  document.execCommand(cmd, false, null);
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

/* ------------------ view ------------------ */
function setFont(px){
  content.style.fontSize = `${px}px`;
  presentContent.style.fontSize = `${Math.max(px, 40) + 16}px`;
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}

function setAlign(a){
  content.style.textAlign = a;
  presentContent.style.textAlign = a;
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

function openPresent(){
  persistActiveHTML();
  syncTeleprompterHTML();

  presentOverlay.classList.remove("hidden");
  presentOverlay.requestFullscreen?.().catch(()=>{});

  pSpeed.value = speed.value;
  pSpeedVal.textContent = speed.value;

  pFont.value = Math.max(Number(fontSize.value), 40) + 16;
  pFontVal.textContent = pFont.value;

  closeMobileMenu();

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

/* ------------------ collapse editor (desktop) ------------------ */
function setEditorCollapsed(collapsed){
  document.body.classList.toggle("editor-collapsed", collapsed);
  collapseIcon.textContent = collapsed ? "▶" : "◀";
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}
function toggleEditorCollapsed(){
  setEditorCollapsed(!document.body.classList.contains("editor-collapsed"));
}

/* ------------------ drag resize (desktop) ------------------ */
function getMaxEditorWidth(){
  const layout = document.getElementById("layout");
  if(!layout) return 720;
  const r = layout.getBoundingClientRect();
  const maxW = Math.min(720, r.width - 260);
  return Math.max(280, maxW);
}

function setEditorWidth(px){
  const minW = 280;
  const maxW = getMaxEditorWidth();

  editorWidthPx = clamp(px, minW, maxW);
  editorPanel.style.flexBasis = `${editorWidthPx}px`;

  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}

function startDrag(e){
  if(isMobileLayout()) return;
  if(document.body.classList.contains("editor-collapsed")) return;
  isDragging = true;
  document.body.classList.add("dragging");
  e.preventDefault();
}

function onDragMove(e){
  if(!isDragging) return;
  const layoutRect = document.getElementById("layout").getBoundingClientRect();
  const x = e.clientX - layoutRect.left;
  setEditorWidth(x);
}

function stopDrag(){
  if(!isDragging) return;
  isDragging = false;
  document.body.classList.remove("dragging");
}

/* ------------------ mobile menu ------------------ */
function openMobileMenu(){
  mobileMenu.classList.remove("hidden");
  btnMenu.setAttribute("aria-expanded", "true");
}
function closeMobileMenu(){
  mobileMenu.classList.add("hidden");
  btnMenu.setAttribute("aria-expanded", "false");
}
function toggleMobileMenu(){
  const hidden = mobileMenu.classList.contains("hidden");
  hidden ? openMobileMenu() : closeMobileMenu();
}

/* ------------------ About modal ------------------ */
function openAbout(e){
  e?.preventDefault?.();
  aboutModal.classList.remove("hidden");
  closeMobileMenu();
}
function closeAbout(){
  aboutModal.classList.add("hidden");
}

/* ------------------ clear (NO persistence) ------------------ */
function clearAll(){
  pause();
  scriptInput.innerHTML = "";
  slots = Array.from({ length: SLOTS }, () => "");
  activeSlot = 1;
  renderTabs();
  loadActiveHTML();
  syncTeleprompterHTML();
  resetScroll();
  closeMobileMenu();
  closeAbout();
  if(isMobileLayout()) setMobileView("edit");
}

/* ------------------ bindings ------------------ */
btnClear.onclick = clearAll;

scriptInput.addEventListener("input", () => {
  persistActiveHTML();
  syncTeleprompterHTML();
});

btnPlay.onclick = togglePlay;
pPlay.onclick = togglePlay;

btnReset.onclick = () => { pause(); resetScroll(); };
pReset.onclick = () => { pause(); resetScroll(); };

/* speed */
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

/* font size */
fontSize.addEventListener("input", () => {
  fontVal.textContent = fontSize.value;
  setFont(Number(fontSize.value));
  pFont.value = Math.max(Number(fontSize.value), 40) + 16;
  pFontVal.textContent = pFont.value;
});
pFont.addEventListener("input", () => {
  pFontVal.textContent = pFont.value;
  const mainPx = Math.max(Number(pFont.value) - 16, 18);
  fontSize.value = String(mainPx);
  fontVal.textContent = fontSize.value;
  setFont(mainPx);
});

/* align */
align.addEventListener("change", () => setAlign(align.value));

/* top actions */
btnMirror.onclick = () => { toggleMirror(); closeMobileMenu(); };
pMirror.onclick = toggleMirror;

btnSiteMirror.onclick = () => { toggleSiteMirror(); closeMobileMenu(); };
btnFullscreen.onclick = () => { toggleFullscreen(); closeMobileMenu(); };
btnPresent.onclick = openPresent;

/* mobile menu actions */
btnMenu.onclick = toggleMobileMenu;
mBtnMirror.onclick = () => { toggleMirror(); closeMobileMenu(); };
mBtnSiteMirror.onclick = () => { toggleSiteMirror(); closeMobileMenu(); };
mBtnFullscreen.onclick = () => { toggleFullscreen(); closeMobileMenu(); };
mBtnPresent.onclick = openPresent;

/* close menu on outside click */
document.addEventListener("click", (e) => {
  if(mobileMenu.classList.contains("hidden")) return;
  const inside = mobileMenu.contains(e.target) || btnMenu.contains(e.target);
  if(!inside) closeMobileMenu();
});

/* About */
aboutLink.onclick = openAbout;
aboutClose.onclick = closeAbout;
aboutModal.addEventListener("click", (e) => {
  if(e.target === aboutModal) closeAbout();
});

/* collapse */
btnCollapseEditor.onclick = toggleEditorCollapsed;

/* formatting */
fmtBold.onclick = () => exec("bold");
fmtItalic.onclick = () => exec("italic");
fmtUnderline.onclick = () => exec("underline");

tcYellow.onclick = () => setTextColor("#FFD400");
tcGreen.onclick = () => setTextColor("#00FF7B");
tcReset.onclick = () => setTextColor("#FFFFFF");

hlBlue.onclick = () => applyHighlight("#4F7CFF");
hlPink.onclick = () => applyHighlight("#FF4FD8");
hlClear.onclick = clearHighlight;

/* present exit */
pExit.onclick = closePresent;

/* splitter drag */
splitter?.addEventListener("mousedown", startDrag);
window.addEventListener("mousemove", onDragMove);
window.addEventListener("mouseup", stopDrag);

/* view switch */
btnViewEdit.onclick = () => setMobileView("edit");
btnViewPrompt.onclick = () => setMobileView("prompt");

/* keyboard shortcuts */
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
  if((e.key === "m" || e.key === "M") && e.shiftKey){ toggleSiteMirror(); }
  else if(e.key === "m" || e.key === "M"){ toggleMirror(); }

  if(e.key === "f" || e.key === "F"){ toggleFullscreen(); }
  if(e.key === "r" || e.key === "R"){ pause(); resetScroll(); }
  if(e.key === "Escape"){ closeMobileMenu(); closeAbout(); }
});

/* resize */
window.addEventListener("resize", () => {
  ensureMobileDefaults();

  if(!isMobileLayout() && !document.body.classList.contains("editor-collapsed")){
    setEditorWidth(editorWidthPx);
  }

  requestAnimationFrame(() => {
    clampScroll();
    applyScroll();
  });
});

/* init: always empty on load (NO saving) */
function init(){
  clearAll();

  speedVal.textContent = speed.value;
  fontVal.textContent = fontSize.value;

  setFont(Number(fontSize.value));
  setAlign(align.value);

  setEditorCollapsed(false);
  setEditorWidth(420);

  closeMobileMenu();
  closeAbout();

  ensureMobileDefaults();
  if(isMobileLayout()) setMobileView("edit");
}

init();
