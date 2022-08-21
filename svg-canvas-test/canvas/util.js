// 计算点在那个图形中
function catchItem(e) {
  let { clientX, clientY } = e;
  clientY = clientY - canvas.offsetTop;
  clientX = clientX - canvas.offsetLeft;
  for (let i = rects.length - 1; i >= 0; i--) {
    const item = rects[i];
    const { x, y, width, height } = item;
    if (clientX - x > 0 && clientX - x < width) {
      if (clientY - y > 0 && clientY - y < height) {
        return i;
      }
    }
  }
  return -1;
}
// 更新
const render = () => {
  clearCanvas();
  drawItems();
};
function drawItems() {
  rects.forEach(({ x, y, width, height, fill }) => {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, width * scale, height * scale);
  });
}

function clearCanvas() {
  let w = canvas.width;
  let h = canvas.height;
  ctx.clearRect(0, 0, w, h);
}

function getDistance(p1, p2) {
  let dep = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  return dep;
}
