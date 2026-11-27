function attachScrubber(player) {
  const screen = player.querySelector(".frame-screen");
  const video = screen.querySelector("video");
  const status = screen.querySelector(".frame-status");
  const slider = player.querySelector("input");
  const counter = player.querySelector("output");
  const frameRate = Number(player.dataset.fps);
  const frameCount = Number(player.dataset.frames);
  let frame = 1;
  let scheduled = false;

  function showFrame() {
    scheduled = false;
    if (video.seeking || slider.disabled) return;
    // Seek just inside the frame interval to avoid rounding onto the previous frame.
    const time = (frame - 1 + 0.2) / frameRate;
    if (Math.abs(video.currentTime - time) > 0.001) video.currentTime = time;
  }

  function scheduleSeek() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(showFrame);
  }

  function setFrame(value) {
    const nextFrame = Math.min(frameCount, Math.max(1, value));
    if (nextFrame === frame) return false;
    frame = nextFrame;
    slider.value = frame;
    counter.value = `${frame} / ${frameCount}`;
    scheduleSeek();
    return true;
  }

  function enable() {
    slider.disabled = false;
    scheduleSeek();
  }

  function fail() {
    slider.disabled = true;
    status.textContent = "The video could not be loaded.";
    status.hidden = false;
  }

  video.addEventListener("loadedmetadata", enable);
  video.addEventListener("seeked", scheduleSeek);
  video.addEventListener("error", fail);
  if (video.error) fail();
  else if (video.readyState >= 1) enable();

  slider.addEventListener("input", () => setFrame(slider.valueAsNumber));
  screen.addEventListener("click", () => screen.focus({ preventScroll: true }));
  screen.addEventListener("wheel", (event) => {
    if (document.activeElement !== screen || slider.disabled || event.ctrlKey || event.shiftKey || !event.deltaY) return;
    const pixels = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    const step = Math.max(1, Math.round(Math.abs(pixels) / 16)) * Math.sign(pixels);
    if (setFrame(frame + step)) event.preventDefault();
  }, { passive: false });

  screen.addEventListener("keydown", (event) => {
    if (slider.disabled) return;
    let requested;
    switch (event.key) {
      case "ArrowLeft": requested = frame - 1; break;
      case "ArrowRight": requested = frame + 1; break;
      case "Home": requested = 1; break;
      case "End": requested = frameCount; break;
      default: return;
    }
    event.preventDefault();
    setFrame(requested);
  });
}

document.querySelectorAll(".frame-player").forEach(attachScrubber);
