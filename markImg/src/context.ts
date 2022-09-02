import { getImage } from "./image";
import { canvas2img, cache } from "./uilt";
import { DEFAULT } from "./shared";
export async function getCanvas(
  canvasId: string,
  { width, height }: contextOption
): Promise<canvasType> {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement & {
    _id: number;
  };
  if (canvas) {
    canvas.width = width || DEFAULT.canvas.width;
    canvas.height = height || DEFAULT.canvas.height;
    canvas._id = new Date().getTime() + Math.round(Math.random() * 10);
    console.log(canvas._id);
    return canvas;
  }
  throw new Error("canvas 未找到");
}
export function getCtx(canvas: canvasType) {
  const fn = cache(function (canvas: canvasType) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 无法获取 上下文");
    return ctx;
  });
  return fn<CanvasRenderingContext2D, canvasType>(canvas._id, canvas);
}
export function getContextInfo(canvas: canvasType) {
  const fn = cache(function (canvas: canvasType) {
    return canvas.getBoundingClientRect();
  });
  return fn<DOMRect, canvasType>(canvas._id, canvas);
}
export function createAddEvent(canvas: canvasType) {
  const canvasInfo = getContextInfo(canvas);
  return function addEvent(type: eventType, callback: Function) {
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
  };
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
export function createCavasMethods(canvas: canvasType) {
  const ctx = getCtx(canvas);
  async function drawImage(imageInfo: rawImageInfo): Promise<imageInfo> {
    let { image, width, height, x, y } = imageInfo;
    if (typeof image === "string") {
      image = await getImage(image);
    }
    const result = {
      image,
      x: x || 0,
      y: y || 0,
      width: width || image.width,
      height: height || image.height,
    };
    ctx.drawImage(
      result.image,
      result.x,
      result.y,
      result.width,
      result.height
    );
    return { ...result, type: "image" };
  }
  function drawText(font: rawText): text {
    drawBg();
    drawText();
    return {
      ...font,
      type: "text",
    };
    function drawText() {
      ctx.direction = font.direction || DEFAULT.text.direction;
      ctx.fillStyle = font.fill || DEFAULT.text.fill;
      ctx.font = font.font || DEFAULT.text.font;
      ctx.textAlign = font.align || DEFAULT.text.align;
      ctx.textBaseline = font.vertical || DEFAULT.text.vertical;
      const args: [string, number, number] = [font.text, font.x, font.y];
      switch (font.vertical) {
        case "middle":
          args[2] = font.y + Math.round(font.height / 2);
          break;
        case "bottom":
          args[2] = font.y + font.height;
          break;
      }
      switch (font.align) {
        case "center":
          args[1] = font.x + Math.round(font.width / 2);
          break;
      }
      font.stroke ? ctx.strokeText(...args) : ctx.fillText(...args);
    }
    function drawBg() {
      if (font.bg) {
        drawRect({
          x: font.x,
          y: font.y,
          width: font.width,
          height: font.height,
          full: font.bg,
        });
      }
    }
  }
  function drawRect(rect: rawRect): rect {
    ctx.fillStyle = rect.full;
    const args: [number, number, number, number] = [
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    ];
    if (rect.stroke) {
      ctx.strokeRect(...args);
    } else {
      ctx.fillRect(...args);
    }
    return { ...rect, type: "rect" };
  }
  function clear() {
    const { width, height } = getContextInfo(canvas);
    ctx.clearRect(0, 0, width, height);
  }

  function refresh() {
    clear();
    for (const k in itemList) {
      const item = itemList[k];
      if (item) {
        switch (item.type) {
          case "text":
            drawText(item);
            break;
          case "rect":
            drawRect(item);
            break;
          case "image":
            drawImage(item);
            break;
          default:
            const neverValue: never = item;
        }
      }
    }
  }
  const itemList: itemListType = new Proxy(
    {},
    {
      deleteProperty(target, prop) {
        const result = delete target[prop];
        refresh();
        return result;
      },
    }
  );
  function proxyMethods(): {
    drawText: typeof drawText;
    drawImage: typeof drawImage;
    drawRect: typeof drawRect;
    clear: typeof clear;
    refresh: typeof refresh;
    itemList: itemListType;
  } {
    let key = 0;
    const handler = {
      apply: collectMethodResult,
    };
    return {
      clear,
      refresh,
      itemList,
      drawText: new Proxy(drawText, handler),
      drawImage: new Proxy(drawImage, handler),
      drawRect: new Proxy(drawRect, handler),
    };
    async function collectMethodResult(
      target: any,
      thisArg: any,
      argumentsList: any
    ) {
      const result = await target(...argumentsList);
      result.id = key++;
      return (itemList[result.id] = proxyResult(result));
    }
  }

  function proxyResult(result): resultType {
    // 执行一下更新 当然要用 Promise 做 event
    const handler = {
      set(target, key, value) {
        Promise.resolve().then(() => {
          refresh();
        });
        return Reflect.set(target, key, value);
      },
    };
    return new Proxy(result, handler);
  }

  return proxyMethods();
}
export async function createContext(
  canvasId: string,
  rawOption: rawContextOption
) {
  const option = await preOption(rawOption);
  const canvas = await getCanvas(canvasId, option);
  const methods = createCavasMethods(canvas);
  init();
  return {
    addEvent: createAddEvent(canvas),
    ...methods,
    canvas2img: canvas2img.bind(null, canvas),
  };
  function init() {
    if (option.bgImg) {
      methods.drawImage({
        image: option.bgImg,
        x: 0,
        y: 0,
        width: option.width,
        height: option.height,
      });
    }
  }

  async function preOption({
    bg,
    width,
    height,
  }: rawContextOption): Promise<contextOption> {
    const result: contextOption = { width, height };
    if (bg) {
      result.bgImg = await getImage(bg);
    }
    if (!width && !height) {
      result.width = result.bgImg?.width;
      result.height = result.bgImg?.height;
    } else if (width && !height) {
      result.width = width;
      result.height =
        (width / (result.bgImg?.width || 0)) * (result.bgImg?.height || 0);
    }
    return result;
  }
}
