const story = document.querySelector(".story");
const cards = [...story.querySelectorAll(".method-card, .results-card")];
const header = document.querySelector(".site-header");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

function updateStack() {
  const availableHeight = window.innerHeight - header.offsetHeight - 64;
  const fits = cards.every((card) => card.offsetHeight <= availableHeight);
  story.classList.toggle("is-stacked", fits && !motionPreference.matches);
}

updateStack();
window.addEventListener("resize", updateStack);
motionPreference.addEventListener("change", updateStack);

if ("ResizeObserver" in window) {
  const observer = new ResizeObserver(updateStack);
  for (const card of cards) observer.observe(card);
}
