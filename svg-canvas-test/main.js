alert(`It's new`)
function play(rects, { clear, drawRect, contextInfo, addEvent }) {
  render();
  // 点击
  watchClick();
  watchMove();
  function watchMove() {
    let path = [];
    let scale = 1;
    addEvent("touchmove", (e) => {
      catchPath(e);
      if (path.length === 2) {
        isZoom();
      }
    });
    addEvent("touchend", (e) => {
      path = [];
      rects = setScale(scale);
      scale = 1;
    });
    function isZoom() {
      const initDistance = getDistance(path[0][0], path[1][0]);
      const distance = getDistance(
        path[0][path[0].length - 1],
        path[1][path[1].length - 1]
      );
      scale = distance / initDistance;
      render(scale);
    }
    function catchPath(e) {
      for (let i = 0; i < e.touches.length; i++) {
        path[i] || (path[i] = []);
        const { clientX, clientY } = e.touches[i];
        path[i].push({
          x: clientX,
          y: clientY,
        });
      }
    }
  }
  function watchClick() {
    addEvent("click", (e) => {
      const i = catchItem(e);
      if (i !== -1) {
        const item = rects[i];
        rects.splice(i, 1);
        rects.push(item);
        render();
      }
    });
  }
  // 计算点在那个图形中
  function catchItem(e) {
    let { clientX, clientY } = e;
    clientY = clientY - contextInfo.y;
    clientX = clientX - contextInfo.x;
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
  function render(scale = 1) {
    clear();
    drawItems(scale);
    function drawItems(scale) {
      setScale(scale).forEach(drawRect);
    }
  }
  function setScale(scale) {
    return rects.map((item) => {
      const { x, y, width, height } = item;
      return {
        ...item,
        x: x - (width * (scale - 1)) / 2,
        y: y - (height * (scale - 1)) / 2,
        width: width * scale,
        height: height * scale,
      };
    });
  }
  function getDistance(p1, p2) {
    let dep = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    return dep;
  }
}
function createContext() {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  function clear() {
    let w = canvas.width;
    let h = canvas.height;
    ctx.clearRect(0, 0, w, h);
  }
  function drawRect(aRect) {
    ctx.fillStyle = aRect.fill;
    ctx.fillRect(aRect.x, aRect.y, aRect.width, aRect.height);
  }
  return {
    clear,
    drawRect,
    contextInfo: canvas.getBoundingClientRect(),
    addEvent: canvas.addEventListener,
  };
}
function createSvgContext() {
  const svg = document.getElementById("svg");
  console.log(svg);
  function clear() {
    svg.innerHTML = "";
  }
  function drawRect(aRect) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.style.fill = aRect.fill;
    rect.style.pointerEvents = "none";
    rect.setAttribute("x", aRect.x);
    rect.setAttribute("y", aRect.y);
    rect.setAttribute("width", aRect.width);
    rect.setAttribute("height", aRect.height);
    svg.appendChild(rect);
  }
  return {
    clear,
    drawRect,
    contextInfo: svg.getBoundingClientRect(),
    addEvent:svg.addEventListener,
  };
}
window.onload=function () {
  document.addEventListener('touchstart',function (event) {
    if(event.touches.length>1){
      event.preventDefault();
    }
  });
  var lastTouchEnd=0;
  document.addEventListener('touchend',function (event) {
    var now=(new Date()).getTime();
    if(now-lastTouchEnd<=300){
      event.preventDefault();
    }
    lastTouchEnd=now;
  },false);
  document.addEventListener('gesturestart', function (event) {
    event.preventDefault();
  });
}
