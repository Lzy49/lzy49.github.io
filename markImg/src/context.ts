import { getImage } from "./image";
import { canvas2img } from "./uilt";
const DEFAULT = {
  text: {
    fill: "#000",
    align: "start" as CanvasTextAlign,
    baseline: "ideographic" as CanvasTextBaseline,
    direction: "inherit" as CanvasDirection,
    font: "24px ",
  },
};
export async function getCanvas(
  canvasId: string,
  { width, height }: contextOption
): Promise<HTMLCanvasElement> {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (canvas) {
    canvas.width = width || 0;
    canvas.height = height || 0;
    return canvas;
  }
  throw new Error("canvas 未找到");
}
export function getCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 无法获取 上下文");
  return ctx;
}
export function getContextInfo(canvas: HTMLCanvasElement) {
  return canvas.getBoundingClientRect();
}
export function createAddEvent(canvas: HTMLCanvasElement) {
  const canvasInfo = getContextInfo(canvas);
  return function addEvent(type: eventType, callback: Function) {
    canvas.addEventListener(type, (e) => {
      const places: { x: number; y: number }[] = [];
      const keys: "shift" | "ctrl" | "alt" | "meta"[] = [];
      switch (type) {
        case "click":
        case "mousedown":
        case "mousemove":
        case "mouseup":
          const event: MouseEvent = e as MouseEvent;
          const keyName: ["shift", "ctrl", "alt", "meta"] = [
            "shift",
            "ctrl",
            "alt",
            "meta",
          ];
          const keys = keyName.reduce((result, value, key, arr) => {
            e[value + "Key"] && result.push(value);
            return result;
          }, [] as any);
          places.push({
            y: event.pageY - canvasInfo.y,
            x: event.pageX - canvasInfo.x,
          });
          break;
        default:
          const neverValue: never = type;
      }
      callback(places);
    });
  };
}
export function createCavasMethods(canvas: HTMLCanvasElement) {
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
  async function drawText(font: fontStyle): Promise<fontStyle> {
    ctx.direction = font.direction || DEFAULT.text.direction;
    ctx.fillStyle = font.fill || DEFAULT.text.fill;
    ctx.font = font.font || DEFAULT.text.font;
    ctx.textAlign = font.align || DEFAULT.text.align;
    ctx.textBaseline = font.baseline || DEFAULT.text.baseline;
    draw();
    return {
      ...font,
      type: "text",
    };
    function draw() {
      const args: [string, number, number, number?] = [
        font.text,
        font.x,
        font.y,
        font.maxWidth,
      ];
      font.stroke ? ctx.strokeText(...args) : ctx.fillText(...args);
    }
  }
  type resultType = {
    drawText: typeof drawText;
    drawImage: typeof drawImage;
    itemList: imageInfo | fontStyle[];
  };
  function proxyMethods(methods): resultType {
    const itemList: fontStyle[] = [];
    const handler = {
      apply: async function (target, thisArg, argumentsList) {
        const result = await target(...argumentsList);
        itemList.push(result);
        // 执行一下更新 当然要用 Promise 做 event
        return result;
      },
    };
    const result: Partial<resultType> = { itemList };
    for (let key in methods) {
      result[key] = new Proxy(methods[key], handler);
    }
    return result as resultType;
  }
  return proxyMethods({
    drawImage,
    drawText,
  });
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
    }
    return result;
  }
}
