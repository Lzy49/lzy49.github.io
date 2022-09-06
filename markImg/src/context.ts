import { getImage } from "./image";
import { DEFAULT } from "./constants";
import { createAPI } from "./createWebAPI";
function createCavasMethods({
  drawImage: ctxDrawImage,
  drawText: ctxDrawText,
  drawRect: ctxDrawRect,
  clear: ctxClear,
}) {
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
    ctxDrawImage(result);
    return { ...result, type: "image" };
  }
  function drawText(font: rawText): text {
    font.direction = font.direction || DEFAULT.text.direction;
    font.fill = font.fill || DEFAULT.text.fill;
    font.font = font.font || DEFAULT.text.font;
    font.align = font.align || DEFAULT.text.align;
    font.vertical = font.vertical || DEFAULT.text.vertical;
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
    drawBg();
    ctxDrawText({ ...font, args });
    return {
      ...font,
      type: "text",
    };
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
    const args = [rect.x, rect.y, rect.width, rect.height];
    ctxDrawRect({ ...rect, args });
    return { ...rect, type: "rect" };
  }
  function refresh() {
    ctxClear();
    for (const k in itemList) {
      const item = { ...itemList[k] };
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
    clear: typeof ctxClear;
    refresh: typeof refresh;
    itemList: itemListType;
  } {
    let key = 0;
    const handler = {
      apply: collectMethodResult,
    };
    return {
      clear: ctxClear,
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
        debugger;
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
  const api = createAPI(canvasId, option);
  const methods = createCavasMethods(api);
  init();
  return {
    addEvent: api.addEvent,
    ...methods,
    canvas2img: api.canvas2img,
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

  async function preOption(
    rawContextOption: rawContextOption
  ): Promise<contextOption> {
    const result: contextOption = rawContextOption;
    await handleBg();
    handleDefine();
    return result;
    function handleDefine() {
      if (result?.bgImg && (!result.height || !result.width)) {
        const { width, height } = result.bgImg;
        result.height = result.height || height;
        result.width = result.width || width;
        result.height && (result.width = (result.height / height) * width);
        result.width && (result.height = (result.width / width) * height);
      }
      result.width = result.width || DEFAULT.canvas.width;
      result.height = result.height || DEFAULT.canvas.height;
    }
    async function handleBg() {
      if (result.bg) {
        result.bgImg = await getImage(result.bg);
      }
    }
  }
}
