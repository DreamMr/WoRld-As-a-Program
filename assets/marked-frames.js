const markedFrameList = document.querySelector("#marked-frame-list");
const markedFrames = document.createDocumentFragment();
const firstMarkedFrame = markedFrameList.start;
const lastMarkedFrame = Number(markedFrameList.dataset.last);

for (let frame = firstMarkedFrame; frame <= lastMarkedFrame; frame += 1) {
  const image = document.createElement("img");
  image.loading = frame === firstMarkedFrame ? "eager" : "lazy";
  image.decoding = "async";
  image.width = 1296;
  image.height = 968;
  image.alt = `Frame ${frame} with object labels`;
  image.src = `./assets/marked-frames/${frame}.jpg`;

  const item = document.createElement("li");
  item.append(image);
  markedFrames.append(item);
}

markedFrameList.append(markedFrames);
