const objectNames = {
  OBJECT_1: "curtain",
  OBJECT_2: "curtain",
  OBJECT_3: "desk",
  OBJECT_4: "bed",
  OBJECT_5: "sofa",
  OBJECT_6: "tv",
  OBJECT_8: "cabinet",
  OBJECT_9: "cabinet",
  OBJECT_10: "nightstand",
  OBJECT_11: "nightstand",
  OBJECT_13: "office chair",
  OBJECT_14: "cabinet",
  OBJECT_17: "lamp",
  OBJECT_18: "lamp",
  OBJECT_26: "trash can",
  OBJECT_32: "picture",
  OBJECT_42: "counter",
  OBJECT_44: "microwave",
  OBJECT_46: "door",
  OBJECT_47: "pillow",
  OBJECT_48: "pillow",
};

function readPointObject({ id, points }) {
  const raw = Uint8Array.from(atob(points), (character) => character.charCodeAt(0));
  const view = new DataView(raw.buffer);
  const positions = new Float32Array(raw.length / 5);
  const colors = new Uint8Array(positions.length);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  for (let offset = 0, index = 0; offset < raw.length; offset += 15, index += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      const coordinate = view.getFloat32(offset + 4 * axis, true);
      positions[index + axis] = coordinate;
      colors[index + axis] = raw[offset + 12 + axis];
      min[axis] = Math.min(min[axis], coordinate);
      max[axis] = Math.max(max[axis], coordinate);
    }
  }

  return { id, positions, colors, min, max };
}

function pointCloudBounds(objects) {
  const axes = [0, 1, 2];
  const min = axes.map((axis) => Math.min(...objects.map((object) => object.min[axis])));
  const max = axes.map((axis) => Math.max(...objects.map((object) => object.max[axis])));
  return {
    center: axes.map((axis) => (min[axis] + max[axis]) / 2),
    radius: Math.max(0.01, Math.hypot(...axes.map((axis) => max[axis] - min[axis])) / 2),
  };
}

function setupPointViewer(canvas, drawing, status, objects) {
  const objectList = document.querySelector("#geometry-objects");
  const count = document.querySelector("#geometry-count");
  const selectAll = document.querySelector("#object-select-all");
  const clearAll = document.querySelector("#object-clear-all");
  const fit = document.querySelector("#geometry-fit");
  const reset = document.querySelector("#geometry-reset");
  const zoomButtons = [...document.querySelectorAll("[data-zoom]")];
  const layer = document.createElement("canvas");
  const raster = layer.getContext("2d");
  if (!raster) throw new Error("Canvas 2D unavailable");

  const sceneBounds = pointCloudBounds(objects);
  let framing = sceneBounds;
  let visible = objects;
  let yaw;
  let pitch;
  let zoom;
  let image;
  let depthBuffer;
  let queued = false;
  let drag;

  const entries = objects.map((object) => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    const identifier = document.createElement("code");
    identifier.textContent = object.id;
    const name = objectNames[object.id];
    const caption = document.createElement("span");
    caption.append(identifier, name ? `: ${name}` : "");
    const label = document.createElement("label");
    label.append(checkbox, caption);
    objectList.append(label);
    return { checkbox, object };
  });
  for (const control of [selectAll, clearAll, reset, ...zoomButtons]) control.disabled = false;

  function draw() {
    queued = false;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.round(canvas.clientWidth * pixelRatio);
    const height = Math.round(canvas.clientHeight * pixelRatio);
    if (!width || !height) return;
    if (!image || image.width !== width || image.height !== height) {
      canvas.width = layer.width = width;
      canvas.height = layer.height = height;
      image = raster.createImageData(width, height);
      depthBuffer = new Float32Array(width * height);
    }

    drawing.clearRect(0, 0, width, height);
    if (!visible.length) return;

    const { center, radius } = framing;
    const scale = Math.min(width * 0.43, height * 0.7) * zoom / radius;
    const distance = 3.8 * radius;
    const cosineYaw = Math.cos(yaw);
    const sineYaw = Math.sin(yaw);
    const cosinePitch = Math.cos(pitch);
    const sinePitch = Math.sin(pitch);
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const [originX, originY, originZ] = center;

    function project(x, y, z) {
      const horizontal = cosineYaw * x - sineYaw * y;
      const rotated = sineYaw * x + cosineYaw * y;
      const depth = cosinePitch * rotated + sinePitch * z;
      const perspective = scale * distance / (distance - depth);
      return [
        centerX + horizontal * perspective,
        centerY - (cosinePitch * z - sinePitch * rotated) * perspective,
      ];
    }

    if (framing === sceneBounds) {
      const spacing = radius / 5;
      const span = spacing * 6;
      drawing.beginPath();
      for (let index = -6; index <= 6; index += 1) {
        const offset = index * spacing;
        drawing.moveTo(...project(offset, -span, -originZ));
        drawing.lineTo(...project(offset, span, -originZ));
        drawing.moveTo(...project(-span, offset, -originZ));
        drawing.lineTo(...project(span, offset, -originZ));
      }
      drawing.lineWidth = pixelRatio;
      drawing.strokeStyle = "#9c80c42b";
      drawing.stroke();
    }

    image.data.fill(0);
    depthBuffer.fill(-Infinity);
    const pixels = image.data;
    const dotRadius = Math.min(2, Math.floor(pixelRatio * (zoom > 1.5 ? 1.5 : 0.8)));

    for (const { positions, colors } of visible) {
      for (let index = 0; index < positions.length; index += 3) {
        const x = positions[index] - originX;
        const y = positions[index + 1] - originY;
        const z = positions[index + 2] - originZ;
        const horizontal = cosineYaw * x - sineYaw * y;
        const rotated = sineYaw * x + cosineYaw * y;
        const depth = cosinePitch * rotated + sinePitch * z;
        const perspective = scale * distance / (distance - depth);
        const screenX = Math.round(centerX + horizontal * perspective);
        const screenY = Math.round(centerY - (cosinePitch * z - sinePitch * rotated) * perspective);
        if (screenX < 0 || screenX >= width || screenY < 0 || screenY >= height) continue;

        for (let py = Math.max(0, screenY - dotRadius); py <= Math.min(height - 1, screenY + dotRadius); py += 1) {
          for (let px = Math.max(0, screenX - dotRadius); px <= Math.min(width - 1, screenX + dotRadius); px += 1) {
            const point = py * width + px;
            if (depth <= depthBuffer[point]) continue;
            depthBuffer[point] = depth;
            const pixel = point * 4;
            pixels[pixel] = colors[index];
            pixels[pixel + 1] = colors[index + 1];
            pixels[pixel + 2] = colors[index + 2];
            pixels[pixel + 3] = 255;
          }
        }
      }
    }

    raster.putImageData(image, 0, 0);
    drawing.drawImage(layer, 0, 0);
  }

  function scheduleDraw() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(draw);
  }

  function resetView() {
    framing = sceneBounds;
    yaw = -0.58;
    pitch = 0.68;
    zoom = 1;
    scheduleDraw();
  }

  function setVisibleObjects() {
    visible = entries.filter(({ checkbox }) => checkbox.checked).map(({ object }) => object);
    count.textContent = `${visible.length} / ${objects.length} shown`;
    fit.disabled = !visible.length;
    status.hidden = visible.length > 0;
    scheduleDraw();
  }

  function checkAll(checked) {
    for (const { checkbox } of entries) checkbox.checked = checked;
    setVisibleObjects();
  }

  function orbit(dx, dy) {
    yaw += dx;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch + dy));
    scheduleDraw();
  }

  function changeZoom(factor) {
    zoom = Math.max(0.4, Math.min(3.6, zoom * factor));
    scheduleDraw();
  }

  objectList.addEventListener("change", setVisibleObjects);
  selectAll.addEventListener("click", () => checkAll(true));
  clearAll.addEventListener("click", () => checkAll(false));
  fit.addEventListener("click", () => {
    framing = visible.length === objects.length ? sceneBounds : pointCloudBounds(visible);
    zoom = 1;
    scheduleDraw();
  });
  reset.addEventListener("click", resetView);
  for (const button of zoomButtons) {
    button.addEventListener("click", () => changeZoom(button.dataset.zoom === "in" ? 1.2 : 1 / 1.2));
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (drag || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({ preventScroll: true });
  });
  canvas.addEventListener("pointermove", (event) => {
    if (drag?.id !== event.pointerId) return;
    orbit((event.clientX - drag.x) * 0.009, (event.clientY - drag.y) * 0.009);
    drag.x = event.clientX;
    drag.y = event.clientY;
  });
  canvas.addEventListener("lostpointercapture", () => { drag = undefined; });
  canvas.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowLeft": orbit(-0.12, 0); break;
      case "ArrowRight": orbit(0.12, 0); break;
      case "ArrowUp": orbit(0, -0.12); break;
      case "ArrowDown": orbit(0, 0.12); break;
      case "+": case "=": changeZoom(1.2); break;
      case "-": changeZoom(1 / 1.2); break;
      default: return;
    }
    event.preventDefault();
  });

  status.textContent = "Select objects to display their point clouds.";
  resetView();
  setVisibleObjects();
  if ("ResizeObserver" in window) {
    new ResizeObserver(scheduleDraw).observe(canvas);
  } else {
    window.addEventListener("resize", scheduleDraw);
  }
}

{
  const canvas = document.querySelector("#geometry-canvas");
  const status = document.querySelector("#geometry-status");
  try {
    const drawing = canvas.getContext("2d");
    if (!drawing || !demoPointData.length) throw new Error("Point cloud unavailable");
    setupPointViewer(canvas, drawing, status, demoPointData.map(readPointObject));
  } catch (error) {
    status.textContent = "The 3D point clouds could not be loaded.";
    console.error(error);
  }
}
