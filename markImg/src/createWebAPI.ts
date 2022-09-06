function createCanvas(canvasId, { width, height }) {
  const canvas = document.getElementById(canvasId) as canvasType;
  if (canvas) {
    setCanvasInfo();
    return canvas;
  }
  throw new Error("canvas 未找到");
  function setCanvasInfo() {
    canvas.width = width;
    canvas.height = height;
  }
}
function createCtx(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 无法获取 上下文");
  return ctx;
}
function createContextInfo(canvas: HTMLCanvasElement) {
  return canvas.getBoundingClientRect();
}
export function createAPI(canvasId, option) {
  const canvas = createCanvas(canvasId, option);
  const ctx = createCtx(canvas);
  const canvasInfo = createContextInfo(canvas);
  return {
    addEvent,
    drawImage,
    drawText,
    drawRect,
    clear,
    canvas2img
  };
  function addEvent(type: eventType, callback: Function) {
    canvas.addEventListener(type, (e) => {
      const places: { x: number; y: number }[] = [];
      const withKeys: "shift" | "ctrl" | "alt" | "meta"[] = [];
      switch (type) {
        case "click":
        case "mousedown":
        case "mousemove":
        case "mouseup":
          const event: MouseEvent = e as MouseEvent;
          withKeys.push(getWithKeyboard(event));
          places.push(getPlace(event));
          break;
        default:
          const neverValue: never = type;
      }
      callback({ withKeys, places });
    });
    function getPlace(event: MouseEvent) {
      return {
        y: Math.round(event.pageY - canvasInfo.y),
        x: Math.round(event.pageX - canvasInfo.x),
      };
    }
    function getWithKeyboard(e: MouseEvent) {
      const keyName: ["shift", "ctrl", "alt", "meta"] = [
        "shift",
        "ctrl",
        "alt",
        "meta",
      ];
      const keys = keyName.reduce((result, value) => {
        e[value + "Key"] && result.push(value);
        return result;
      }, [] as any);
      return keys;
    }
  }
  function drawImage(result) {
    console.log(result)
    ctx.drawImage(
      result.image,
      result.x,
      result.y,
      result.width,
      result.height
    );
  }
  function drawText(
    font: Required<rawText> & { args: [string, number, number] }
  ) {
    ctx.direction = font.direction;
    ctx.fillStyle = font.fill;
    ctx.font = font.font;
    ctx.textAlign = font.align;
    ctx.textBaseline = font.vertical;
    font.stroke ? ctx.strokeText(...font.args) : ctx.fillText(...font.args);
  }
  function drawRect(
    rect: rawRect & { args: [number, number, number, number] }
  ) {
    ctx.fillStyle = rect.full;
    if (rect.stroke) {
      ctx.strokeRect(...rect.args);
    } else {
      ctx.fillRect(...rect.args);
    }
  }
  function clear() {
    const { width, height } = canvasInfo;
    ctx.clearRect(0, 0, width, height);
  }
  function canvas2img(option) {
    return canvas.toDataURL(option || "image/png");
  }
}
