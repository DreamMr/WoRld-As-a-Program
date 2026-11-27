const canvas = document.querySelector("#room-scene");
const drawing = canvas.getContext("2d");

if (drawing) {
  // Synthetic geometry for the hero illustration, independent of experiment assets.
  let seed = 2179;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const points = [];
  function face(origin, edgeA, edgeB, count, color, opacity) {
    for (let index = 0; index < count; index += 1) {
      const u = random();
      const v = random();
      points.push({
        position: origin.map((coordinate, axis) => coordinate + u * edgeA[axis] + v * edgeB[axis]),
        color,
        opacity: opacity * (0.2 + 0.8 * random()),
        size: 0.45 + random() * random() * 1.4,
      });
    }
  }

  function box([x, y, z], [w, h, d], color, density = 1) {
    const opacity = 0.76;
    const sampleCount = (area) => Math.ceil(195 * area * density);
    face([x, y + h, z], [w, 0, 0], [0, 0, d], sampleCount(w * d), color, opacity);
    face([x, y, z + d], [w, 0, 0], [0, h, 0], sampleCount(w * h), color, opacity * 0.92);
    face([x + w, y, z], [0, h, 0], [0, 0, d], sampleCount(h * d), color, opacity * 0.68);
  }

  const lavender = "178, 140, 255";
  const violet = "133, 89, 240";
  const blue = "117, 156, 255";
  const silver = "199, 182, 248";

  face([-5.8, 0, -3.3], [11.6, 0, 0], [0, 0, 7.1], 4300, violet, 0.48);
  face([-5.8, 0, -3.3], [11.6, 0, 0], [0, 3.65, 0], 3600, lavender, 0.39);
  face([-5.8, 0, -3.3], [0, 0, 7.1], [0, 3.65, 0], 2450, violet, 0.33);

  // Sofa, coffee table, media console, and a window on the back wall.
  box([-4.54, 0.18, -2.32], [4.13, 0.58, 1.63], violet);
  box([-4.54, 0.56, -2.42], [4.13, 1.02, 0.35], lavender);
  box([-4.62, 0.45, -2.22], [0.34, 0.63, 1.63], lavender);
  box([-0.6, 0.45, -2.22], [0.34, 0.63, 1.63], lavender);
  for (let seat = 0; seat < 3; seat += 1) {
    box([-4.22 + seat * 1.2, 0.71, -1.97], [1.14, 0.14, 1.21], silver);
  }

  box([-0.98, 0.7, 0.62], [2.53, 0.17, 1.64], blue, 1.6);
  for (const x of [-0.88, 1.32]) {
    for (const z of [0.72, 2.0]) {
      box([x, 0, z], [0.09, 0.7, 0.09], blue, 3);
    }
  }

  box([2.65, 0.14, -2.62], [2.6, 0.77, 0.82], lavender);
  box([3.03, 0.98, -2.51], [1.98, 1.15, 0.08], violet, 1.7);
  face([-3.72, 1.72, -3.27], [3.62, 0, 0], [0, 1.53, 0], 1000, blue, 0.31);

  points.sort((a, b) => {
    const depth = ([x, , z]) => 0.42 * x + z;
    return depth(a.position) - depth(b.position);
  });

  function paint() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    drawing.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const scale = Math.min(width / 14.8, height / 5.5);
    const originX = width * 0.5;
    const originY = height * 0.63;
    const project = ([x, y, z]) => [
      originX + scale * (0.97 * x + 0.61 * z),
      originY + scale * (0.155 * x + 0.32 * z - 0.74 * y),
    ];

    function line(start, end, stroke, lineWidth = 1) {
      drawing.beginPath();
      drawing.moveTo(...project(start));
      drawing.lineTo(...project(end));
      drawing.strokeStyle = stroke;
      drawing.lineWidth = lineWidth;
      drawing.stroke();
    }

    for (let x = -6; x <= 6; x += 0.75) {
      line([x, 0, -3.34], [x, 0, 3.83], "rgba(155, 115, 247, 0.17)");
    }
    for (let z = -3.3; z < 3.9; z += 0.75) {
      line([-6, 0, z], [6.01, 0, z], "rgba(155, 115, 247, 0.17)");
    }

    const edges = [
      [[-5.8, 0, -3.3], [-5.8, 3.65, -3.3]],
      [[-5.8, 3.65, -3.3], [5.8, 3.65, -3.3]],
      [[-5.8, 3.65, -3.3], [-5.8, 3.65, 3.8]],
      [[-5.8, 0, 3.8], [-5.8, 3.65, 3.8]],
      [[5.8, 0, -3.3], [5.8, 3.65, -3.3]],
      [[-3.72, 3.25, -3.27], [-0.1, 3.25, -3.27]],
      [[-3.72, 1.72, -3.27], [-0.1, 1.72, -3.27]],
      [[-3.72, 1.72, -3.27], [-3.72, 3.25, -3.27]],
      [[-0.1, 1.72, -3.27], [-0.1, 3.25, -3.27]],
      [[-1.91, 1.72, -3.27], [-1.91, 3.25, -3.27]],
    ];

    for (const [start, end] of edges) {
      line(start, end, "rgba(183, 154, 248, 0.23)");
    }

    for (const { position, color, opacity, size } of points) {
      const [x, y, z] = position;
      const [px, py] = project(position);
      const wallFade = y > 2.2 ? 1 - 0.45 * (y - 2.2) : 1;
      const edgeFade = Math.min(1, 0.33 + 0.35 * (6 - Math.abs(x)));
      const floorFade = y === 0 && z > 1.9 ? 1 - 0.29 * (z - 1.9) : 1;
      const diameter = size * Math.min(1.15, Math.max(0.55, scale / 57));
      drawing.fillStyle = `rgba(${color}, ${opacity * wallFade * edgeFade * floorFade})`;
      drawing.fillRect(px, py, diameter, diameter);
    }

    function outline([x, y, z], [w, h, d], color, label) {
      const corners = [
        [x, y, z], [x + w, y, z], [x + w, y, z + d], [x, y, z + d],
        [x, y + h, z], [x + w, y + h, z], [x + w, y + h, z + d], [x, y + h, z + d],
      ];
      const links = [
        [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6],
        [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7],
      ];
      drawing.shadowColor = `rgba(${color}, 0.52)`;
      drawing.shadowBlur = 7;
      for (const [a, b] of links) {
        line(corners[a], corners[b], `rgba(${color}, 0.78)`, 0.95);
      }
      drawing.shadowBlur = 0;

      const [labelX, labelY] = project(corners[7]);
      drawing.font = `${scale < 34 ? 9 : 11}px monospace`;
      const labelWidth = drawing.measureText(label).width + 13;
      drawing.fillStyle = "#10101b";
      drawing.fillRect(labelX, labelY - 21, labelWidth, 18);
      drawing.strokeStyle = `rgba(${color}, 0.47)`;
      drawing.strokeRect(labelX + 0.5, labelY - 20.5, labelWidth - 1, 17);
      drawing.fillStyle = `rgb(${color})`;
      drawing.textBaseline = "middle";
      drawing.fillText(label, labelX + 6, labelY - 12);
    }

    outline([-4.75, 0, -2.53], [4.63, 1.7, 2.04], "195, 151, 255", "OBJECT_1");
    outline([-1.08, 0, 0.53], [2.73, 1.04, 1.85], "143, 177, 255", "OBJECT_2");
  }

  paint();
  if ("ResizeObserver" in window) {
    new ResizeObserver(paint).observe(canvas);
  } else {
    window.addEventListener("resize", paint);
  }
}
