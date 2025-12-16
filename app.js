const script = document.getElementById("script");
const viewer = document.getElementById("viewer");

const speed = document.getElementById("speed");
const size = document.getElementById("size");
const align = document.getElementById("align");

const playBtn = document.getElementById("playBtn");
const resetBtn = document.getElementById("resetBtn");
const mirrorBtn = document.getElementById("mirrorBtn");
const fullBtn = document.getElementById("fullBtn");

const about = document.getElementById("about");
const aboutBtn = document.getElementById("aboutBtn");
const closeAbout = document.getElementById("closeAbout");

let playing = false;
let scrollY = 0;
let raf = null;

/* PLAY */
function tick() {
  if (!playing) return;
  scrollY += speed.value / 60;
  script.style.transform = `translateY(-${scrollY}px)`;
  raf = requestAnimationFrame(tick);
}

playBtn.onclick = () => {
  playing = !playing;
  playBtn.textContent = playing ? "Pause" : "Play";
  if (playing) tick();
};

resetBtn.onclick = () => {
  playing = false;
  playBtn.textContent = "Play";
  scrollY = 0;
  script.style.transform = "translateY(0)";
};

/* CONTROLS */
size.oninput = () => script.style.fontSize = size.value + "px";
align.onchange = () => script.style.textAlign = align.value;

/* MIRROR */
mirrorBtn.onclick = () => {
  viewer.classList.toggle("mirror");
  viewer.style.transform =
    viewer.classList.contains("mirror") ? "scaleX(-1)" : "none";
};

/* FULLSCREEN */
fullBtn.onclick = () => {
  if (!document.fullscreenElement) viewer.requestFullscreen();
  else document.exitFullscreen();
};

/* ABOUT */
aboutBtn.onclick = () => about.classList.remove("hidden");
closeAbout.onclick = () => about.classList.add("hidden");

/* NO SAVE */
window.addEventListener("load", () => {
  script.innerHTML = "";
});


