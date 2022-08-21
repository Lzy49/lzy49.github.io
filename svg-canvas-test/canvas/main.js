const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let scale = 1;
const rects = [
  {
    x: 75,
    y: 75,
    width: 100,
    height: 100,
    fill: "rgba(155,155,250,.9)",
  },
  {
    x: 125,
    y: 125,
    width: 100,
    height: 100,
    fill: "rgba(250,155,155,.9)",
  },
];
render();
// 点击
canvas.addEventListener("click", (e) => {
  const i = catchItem(e);
  if (i !== -1) {
    const item = rects[i];
    rects.splice(i, 1);
    rects.push(item);
    render();
  }
});
let path = [];
const threshold = 10;
canvas.addEventListener("touchmove", (e) => {
  for (let i = 0; i < e.touches.length; i++) {
    path[i] || (path[i] = []);
    const { clientX, clientY } = e.touches[i];
    path[i].push({
      x: clientX,
      y: clientY,
    });
  }
  if (path.length === 2) {
    const initDistance = getDistance(
      {
        x: path[0][0].clientX,
        y: path[0][0].clientY,
      },
      {
        x: path[1][0].clientX,
        y: path[1][0].clientY,
      }
    );
    const distance = getDistance(
      {
        x: path[0][path.length].clientX,
        y: path[0][path.length].clientY,
      },
      {
        x: path[1][path.length].clientX,
        y: path[1][path.length].clientY,
      }
    );
    scale = initDistance / distance
    return;
  }
  if (path.length === 1) {
    // 移动
    return;
  }
});
canvas.addEventListener("touchend", (e) => {
  path = [];
});
