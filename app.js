const $ = id => document.getElementById(id);

const scriptInput = $("scriptInput");
const content = $("content");
const btnPlay = $("btnPlay");
const btnReset = $("btnReset");
const btnClear = $("btnClear");

const btnViewEdit = $("btnViewEdit");
const btnViewPrompt = $("btnViewPrompt");

const aboutLink = $("aboutLink");
const aboutModal = $("aboutModal");
const aboutClose = $("aboutClose");

let playing = false;
let y = 0;
let raf = null;

function sync(){
  content.innerHTML = scriptInput.innerHTML;
}

function play(){
  if(playing) return;
  playing = true;
  raf = requestAnimationFrame(step);
}

function pause(){
  playing = false;
  cancelAnimationFrame(raf);
}

function step(){
  y += 0.4;
  content.style.transform = `translateY(${-y}px)`;
  if(playing) raf = requestAnimationFrame(step);
}

btnPlay.onclick = () => {
  sync();
  playing ? pause() : play();
};

btnReset.onclick = () => {
  pause();
  y = 0;
  content.style.transform = `translateY(0)`;
};

btnClear.onclick = () => {
  scriptInput.innerHTML = "";
  content.innerHTML = "";
};

aboutLink.onclick = e => {
  e.preventDefault();
  aboutModal.classList.remove("hidden");
};

aboutClose.onclick = () => {
  aboutModal.classList.add("hidden");
};

btnViewEdit.onclick = () => {
  document.body.classList.remove("mobile-prompt");
};

btnViewPrompt.onclick = () => {
  document.body.classList.add("mobile-prompt");
};

