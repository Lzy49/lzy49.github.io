/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const images = {};
function getImage(link) {
    return new Promise((resolve, reject) => {
        if (images[link]) {
            resolve(images[link]);
            return;
        }
        resolve(downloadImg(link));
    });
}
function downloadImg(link) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.src = link;
            image.onload = function () {
                images[link] = image;
                resolve(image);
            };
            image.onerror = reject;
        });
    });
}

const DEFAULT = {
    text: {
        fill: "#000",
        align: "start",
        vertical: "middle",
        direction: "inherit",
        font: "24px ",
    },
    canvas: {
        height: 100,
        width: 100
    }
};

function createCanvas(canvasId, { width, height }) {
    let canvas;
    if (typeof canvasId === "string") {
        canvas = document.getElementById(canvasId);
    }
    else {
        canvas = canvasId;
    }
    if (canvas) {
        canvas = setCanvasInfo(canvas);
        return canvas;
    }
    throw new Error("canvas 未找到");
    function setCanvasInfo(canvas) {
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
}
function createCtx(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx)
        throw new Error("canvas 无法获取 上下文");
    return ctx;
}
function createContextInfo(canvas) {
    return canvas.getBoundingClientRect();
}
function createAPI(canvasId, option) {
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
    function addEvent(type, callback) {
        canvas.addEventListener(type, (e) => {
            const places = [];
            const withKeys = [];
            switch (type) {
                case "click":
                case "mousedown":
                case "mousemove":
                case "mouseup":
                    const event = e;
                    withKeys.push(getWithKeyboard(event));
                    places.push(getPlace(event));
                    break;
            }
            callback({ withKeys, places });
        });
        function getPlace(event) {
            return {
                y: Math.round(event.pageY - canvasInfo.y),
                x: Math.round(event.pageX - canvasInfo.x),
            };
        }
        function getWithKeyboard(e) {
            const keyName = [
                "shift",
                "ctrl",
                "alt",
                "meta",
            ];
            const keys = keyName.reduce((result, value) => {
                e[value + "Key"] && result.push(value);
                return result;
            }, []);
            return keys;
        }
    }
    function drawImage(result) {
        ctx.drawImage(result.image, result.x, result.y, result.width, result.height);
    }
    function drawText(font) {
        ctx.direction = font.direction;
        ctx.fillStyle = font.fill;
        ctx.font = font.font;
        ctx.textAlign = font.align;
        ctx.textBaseline = font.vertical;
        font.stroke ? ctx.strokeText(...font.args) : ctx.fillText(...font.args);
    }
    function drawRect(rect) {
        ctx.fillStyle = rect.full;
        if (rect.stroke) {
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }
        else {
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
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

function createCavasMethods({ drawImage: ctxDrawImage, drawText: ctxDrawText, drawRect: ctxDrawRect, clear: ctxClear, }) {
    function drawImage(imageInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let { image, width, height, x, y } = imageInfo;
            if (typeof image === "string") {
                image = yield getImage(image);
            }
            const result = {
                image,
                x: x || 0,
                y: y || 0,
                width: width || image.width,
                height: height || image.height,
            };
            ctxDrawImage(result);
            return Object.assign(Object.assign({}, result), { type: "image" });
        });
    }
    function drawText(font) {
        handleFont();
        setDefaultValue();
        const textOption = setDrawTextOption();
        drawBg();
        ctxDrawText(Object.assign(Object.assign({}, font), { args: textOption }));
        return Object.assign(Object.assign({}, font), { type: "text" });
        function setDrawTextOption() {
            const args = [font.text, font.x, font.y];
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
            return args;
        }
        function setDefaultValue() {
            font.direction = font.direction || DEFAULT.text.direction;
            font.fill = font.fill || DEFAULT.text.fill;
            font.font = font.font || DEFAULT.text.font;
            font.align = font.align || DEFAULT.text.align;
            font.vertical = font.vertical || DEFAULT.text.vertical;
        }
        function handleFont() {
            if (!font.font) {
                font.font = `${font.fontWeight || 400} ${font.fontSize || 0 * 3}px  ${font.fontFamily || "Arial"}`;
            }
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
    function drawRect(rect) {
        ctxDrawRect(rect);
        return Object.assign(Object.assign({}, rect), { type: "rect" });
    }
    function refresh() {
        ctxClear();
        for (const k in itemList) {
            const item = Object.assign({}, itemList[k]);
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
                }
            }
        }
    }
    const itemList = new Proxy({}, {
        deleteProperty(target, prop) {
            const result = delete target[prop];
            refresh();
            return result;
        },
    });
    function proxyMethods() {
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
        function collectMethodResult(target, thisArg, argumentsList) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield target(...argumentsList);
                result.id = key++;
                return (itemList[result.id] = proxyResult(result));
            });
        }
    }
    function proxyResult(result) {
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
function createContext(canvasId, rawOption) {
    return __awaiter(this, void 0, void 0, function* () {
        const option = yield preOption(rawOption);
        const api = createAPI(canvasId, option);
        const methods = createCavasMethods(api);
        init();
        return Object.assign(Object.assign({ addEvent: api.addEvent }, methods), { canvas2img: api.canvas2img });
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
        function preOption(rawContextOption) {
            return __awaiter(this, void 0, void 0, function* () {
                const result = rawContextOption;
                yield handleBg();
                handleDefine();
                return result;
                function handleDefine() {
                    if ((result === null || result === void 0 ? void 0 : result.bgImg) && (!result.height || !result.width)) {
                        const { width, height } = result.bgImg;
                        result.height = result.height || height;
                        result.width = result.width || width;
                        result.height && (result.width = (result.height / height) * width);
                        result.width && (result.height = (result.width / width) * height);
                    }
                    result.width = result.width || DEFAULT.canvas.width;
                    result.height = result.height || DEFAULT.canvas.height;
                }
                function handleBg() {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (result.bg) {
                            result.bgImg = yield getImage(result.bg);
                        }
                    });
                }
            });
        }
    });
}

function funDownload(content, filename) {
    download(preContent());
    function download(content) {
        let eleLink = document.createElement("a");
        eleLink.download = filename;
        eleLink.style.display = "none";
        eleLink.href = content;
        document.body.appendChild(eleLink);
        eleLink.click();
        document.body.removeChild(eleLink);
    }
    function preContent() {
        if (typeof content === "object") {
            content = JSON.stringify(content);
        }
        if (!content.startsWith("data:image/png;base64")) {
            const blob = new Blob([content]);
            content = URL.createObjectURL(blob);
        }
        return content;
    }
}
function getItemWithPlaces(list, places, types) {
    const keys = Object.keys(list).reverse();
    const k = keys.find((k) => {
        const { x, y, width, height, type } = list[k];
        const x2 = x + Number(width);
        const y2 = y + Number(height);
        if (places.x > x &&
            places.x < x2 &&
            places.y > y &&
            places.y < y2 &&
            types.indexOf(type) > -1) {
            return true;
        }
    });
    return k ? list[k] : false;
}

export { createContext, funDownload, getImage, getItemWithPlaces };
