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

/* menu (tablet/phone) */
const btnMenu = $("btnMenu");
const mobileMenu = $("mobileMenu");
const mBtnMirror = $("mBtnMirror");
const mBtnSiteMirror = $("mBtnSiteMirror");
const mBtnFullscreen = $("mBtnFullscreen");
const mBtnPresent = $("mBtnPresent");

/* view switch */
const viewSwitch = $("viewSwitch");
const btnViewEdit = $("btnViewEdit");
const btnViewPrompt = $("btnViewPrompt");

/* collapse desktop */
const btnCollapseEditor = $("btnCollapseEditor");
const collapseIcon = $("collapseIcon");

/* About */
const aboutLink = $("aboutLink");
const aboutModal = $("aboutModal");
const aboutClose = $("aboutClose");

/* Present */
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

/* ------------------ state (NO persistence) ------------------ */
let slots = Array.from({ length: SLOTS }, () => "");
let activeSlot = 1;

let isPlaying = false;
let rafId = null;
let y = 0;
let presentY = 0;
let lastTs = null;

let isDragging = false;
let editorWidthPx = 440;

/* breakpoint aligned to CSS */
function isSmall() {
  return window.matchMedia("(max-width: 1100px)").matches;
}
function clamp(n, min, max){ return Math.min(Math.max(n, min), max); }

/* ------------------ view switch (tablet/phone) ------------------ */
function setMobileView(mode){ // "edit" | "prompt"
  if(!isSmall()) return;

  document.body.classList.toggle("mobile-view-edit", mode === "edit");
  document.body.classList.toggle("mobile-view-prompt", mode === "prompt");

  btnViewEdit?.classList.toggle("active", mode === "edit");
  btnViewPrompt?.classList.toggle("active", mode === "prompt");

  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}

function ensureMode(){
  if(isSmall()){
    if(!document.body.classList.contains("mobile-view-edit") &&
       !document.body.classList.contains("mobile-view-prompt")){
      document.body.classList.add("mobile-view-edit");
    }
  }else{
    document.body.classList.remove("mobile-view-edit","mobile-view-prompt");
  }
}

/* ------------------ tabs ------------------ */
function renderTabs(){
  slotsEl.innerHTML = "";
  for(let i=1;i<=SLOTS;i++){
    const b = document.createElement("button");
    b.className = "tab" + (i === activeSlot ? " active" : "");
    b.textContent = `Script ${i}`;
    b.type = "button";
    b.onclick = () => {
      persistActive();
      activeSlot = i;
      loadActive();
      renderTabs();
      syncPrompter();
      resetScroll();
    };
    slotsEl.appendChild(b);
  }
}

function persistActive(){
  slots[activeSlot - 1] = scriptInput.innerHTML || "";
}
function loadActive(){
  scriptInput.innerHTML = slots[activeSlot - 1] || "";
}

/* ------------------ syncing ------------------ */
function syncPrompter(){
  const html = scriptInput.innerHTML || "";
  content.innerHTML = html;
  presentContent.innerHTML = html;
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}

/* ------------------ start-from-bottom offsets ------------------ */
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

/* ------------------ scrolling ------------------ */
function resetScroll(){
  y = 0; presentY = 0; lastTs = null;
  applyScroll();
}

function clampScroll(){
  const wrapH = mainViewerH();
  const s0 = startOffsetMain();

  const total = content.scrollHeight + s0;
  const maxY = Math.max(0, total - wrapH + 40);
  y = Math.min(Math.max(y, 0), maxY);

  const pWrapH = presentViewerH();
  const ps0 = startOffsetPresent();
  const pTotal = presentContent.scrollHeight + ps0;
  const pMaxY = Math.max(0, pTotal - pWrapH + 80);

  const ratio = maxY === 0 ? 0 : (y / maxY);
  presentY = ratio * pMaxY;
  presentY = Math.min(Math.max(presentY, 0), pMaxY);
}

function applyScroll(){
  scrollLayer.style.transform = `translateY(${startOffsetMain() - y}px)`;
  presentScrollLayer.style.transform = `translateY(${startOffsetPresent() - presentY}px)`;
}

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
  if(isSmall() && !document.body.classList.contains("mobile-view-prompt")){
    setMobileView("prompt");
  }
  isPlaying ? pause() : play();
}

/* ------------------ formatting ------------------ */
function focusEditor(){ scriptInput.focus(); }

function exec(cmd){
  focusEditor();
  document.execCommand(cmd, false, null);
  persistActive();
  syncPrompter();
}
function setTextColor(color){
  focusEditor();
  document.execCommand("foreColor", false, color);
  persistActive();
  syncPrompter();
}
function applyHighlight(color){
  focusEditor();
  const ok = document.execCommand("backColor", false, color);
  if(!ok) document.execCommand("hiliteColor", false, color);
  persistActive();
  syncPrompter();
}

/* ------------------ view tools ------------------ */
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

/* ------------------ present ------------------ */
function openPresent(){
  persistActive();
  syncPrompter();

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
  if(document.fullscreenElement){
    document.exitFullscreen?.();
  }
}

/* ------------------ desktop collapse + drag resize ------------------ */
function setEditorCollapsed(collapsed){
  document.body.classList.toggle("editor-collapsed", collapsed);
  collapseIcon.textContent = collapsed ? "▶" : "◀";
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}
function toggleEditorCollapsed(){
  setEditorCollapsed(!document.body.classList.contains("editor-collapsed"));
}

function getMaxEditorWidth(){
  const layout = document.getElementById("layout");
  if(!layout) return 760;
  const r = layout.getBoundingClientRect();
  const maxW = Math.min(760, r.width - 320);
  return Math.max(320, maxW);
}
function setEditorWidth(px){
  const minW = 320;
  const maxW = getMaxEditorWidth();
  editorWidthPx = clamp(px, minW, maxW);
  editorPanel.style.flexBasis = `${editorWidthPx}px`;
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
}

function startDrag(e){
  if(isSmall()) return;
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

/* ------------------ menu + modal ------------------ */
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

function openAbout(e){
  e?.preventDefault?.();
  aboutModal.classList.remove("hidden");
  closeMobileMenu();
}
function closeAbout(){
  aboutModal.classList.add("hidden");
}

/* ------------------ clear (no saving) ------------------ */
function clearAll(){
  pause();
  scriptInput.innerHTML = "";
  slots = Array.from({ length: SLOTS }, () => "");
  activeSlot = 1;
  renderTabs();
  loadActive();
  syncPrompter();
  resetScroll();
  closeMobileMenu();
  closeAbout();
  if(isSmall()) setMobileView("edit");
}

/* ------------------ bindings ------------------ */
btnClear.onclick = clearAll;
scriptInput.addEventListener("input", () => { persistActive(); syncPrompter(); });

btnPlay.onclick = togglePlay;
btnReset.onclick = () => { pause(); resetScroll(); };

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

/* toolbar buttons */
fmtBold.onclick = () => exec("bold");
fmtItalic.onclick = () => exec("italic");
fmtUnderline.onclick = () => exec("underline");

tcYellow.onclick = () => setTextColor("#FFD400");
tcGreen.onclick = () => setTextColor("#00FF7B");
tcReset.onclick = () => setTextColor("#FFFFFF");

hlBlue.onclick = () => applyHighlight("#4F7CFF");
hlPink.onclick = () => applyHighlight("#FF4FD8");
hlClear.onclick = () => applyHighlight("transparent");

/* top actions */
btnMirror.onclick = toggleMirror;
btnSiteMirror.onclick = toggleSiteMirror;
btnFullscreen.onclick = toggleFullscreen;
btnPresent.onclick = openPresent;

/* menu */
btnMenu.onclick = toggleMobileMenu;
mBtnMirror.onclick = () => { toggleMirror(); closeMobileMenu(); };
mBtnSiteMirror.onclick = () => { toggleSiteMirror(); closeMobileMenu(); };
mBtnFullscreen.onclick = () => { toggleFullscreen(); closeMobileMenu(); };
mBtnPresent.onclick = openPresent;

document.addEventListener("click", (e) => {
  if(mobileMenu.classList.contains("hidden")) return;
  const inside = mobileMenu.contains(e.target) || btnMenu.contains(e.target);
  if(!inside) closeMobileMenu();
});

/* view switch */
btnViewEdit.onclick = () => setMobileView("edit");
btnViewPrompt.onclick = () => setMobileView("prompt");

/* collapse desktop */
btnCollapseEditor.onclick = toggleEditorCollapsed;

/* About */
aboutLink.onclick = openAbout;
aboutClose.onclick = closeAbout;
aboutModal.addEventListener("click", (e) => { if(e.target === aboutModal) closeAbout(); });

/* Present bindings */
pPlay.onclick = togglePlay;
pReset.onclick = () => { pause(); resetScroll(); };
pExit.onclick = closePresent;
pMirror.onclick = toggleMirror;

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

/* drag resize (desktop) */
splitter?.addEventListener("mousedown", startDrag);
window.addEventListener("mousemove", onDragMove);
window.addEventListener("mouseup", stopDrag);

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
  if((e.key === "m" || e.key === "M") && e.shiftKey){ toggleSiteMirror(); }
  else if(e.key === "m" || e.key === "M"){ toggleMirror(); }

  if(e.key === "f" || e.key === "F"){ toggleFullscreen(); }
  if(e.key === "r" || e.key === "R"){ pause(); resetScroll(); }
  if(e.key === "Escape"){ closeMobileMenu(); closeAbout(); }
});

/* resize */
window.addEventListener("resize", () => {
  ensureMode();
  if(!isSmall() && !document.body.classList.contains("editor-collapsed")){
    setEditorWidth(editorWidthPx);
  }
  requestAnimationFrame(() => { clampScroll(); applyScroll(); });
});

/* init */
function init(){
  // Always start empty (no saving)
  clearAll();

  speedVal.textContent = speed.value;
  fontVal.textContent = fontSize.value;

  setFont(Number(fontSize.value));
  setAlign(align.value);

  setEditorCollapsed(false);
  setEditorWidth(editorWidthPx);

  ensureMode();
  if(isSmall()) setMobileView("edit");
}

init();
