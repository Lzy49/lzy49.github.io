const images = {};
function getImage(link) {
    return new Promise((resolve, reject) => {
        if (images[link]) {
            resolve(images[link]);
            return;
        }
        let image = new Image();
        image.src = link;
        image.onload = function () {
            images[link] = image;
            resolve(image);
        };
        image.onerror = reject;
    });
}

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
function canvas2img(canvas, option) {
    return canvas.toDataURL(option || "image/png");
}
function getItemWithPlaces(list, places, types) {
    const keys = Object.keys(list).reverse();
    for (const k of keys) {
        const { x, y, width, height, type } = list[k];
        const x2 = x + Number(width);
        const y2 = y + Number(height);
        if (places.x > x && places.x < x2 && places.y > y && places.y < y2 && types.indexOf(type) > -1) {
            console.log(list[k], places);
            return list[k];
        }
    }
    return false;
}
function cache(fn) {
    const context = {};
    return function (key, args) {
        if (context[key]) {
            return context[key];
        }
        const result = fn(args);
        context[key] = result;
        return context[key];
    };
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

function getCanvas(canvasId, { width, height }) {
    return __awaiter(this, void 0, void 0, function* () {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            canvas.width = width || DEFAULT.canvas.width;
            canvas.height = height || DEFAULT.canvas.height;
            canvas._id = new Date().getTime() + Math.round(Math.random() * 10);
            console.log(canvas._id);
            return canvas;
        }
        throw new Error("canvas 未找到");
    });
}
function getCtx(canvas) {
    const fn = cache(function (canvas) {
        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("canvas 无法获取 上下文");
        return ctx;
    });
    return fn(canvas._id, canvas);
}
function getContextInfo(canvas) {
    const fn = cache(function (canvas) {
        return canvas.getBoundingClientRect();
    });
    return fn(canvas._id, canvas);
}
function createAddEvent(canvas) {
    const canvasInfo = getContextInfo(canvas);
    return function addEvent(type, callback) {
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
    };
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
function createCavasMethods(canvas) {
    const ctx = getCtx(canvas);
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
            ctx.drawImage(result.image, result.x, result.y, result.width, result.height);
            return Object.assign(Object.assign({}, result), { type: "image" });
        });
    }
    function drawText(font) {
        drawBg();
        drawText();
        return Object.assign(Object.assign({}, font), { type: "text" });
        function drawText() {
            ctx.direction = font.direction || DEFAULT.text.direction;
            ctx.fillStyle = font.fill || DEFAULT.text.fill;
            ctx.font = font.font || DEFAULT.text.font;
            ctx.textAlign = font.align || DEFAULT.text.align;
            ctx.textBaseline = font.vertical || DEFAULT.text.vertical;
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
    function drawRect(rect) {
        ctx.fillStyle = rect.full;
        const args = [
            rect.x,
            rect.y,
            rect.width,
            rect.height,
        ];
        if (rect.stroke) {
            ctx.strokeRect(...args);
        }
        else {
            ctx.fillRect(...args);
        }
        return Object.assign(Object.assign({}, rect), { type: "rect" });
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
            clear,
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
        const canvas = yield getCanvas(canvasId, option);
        const methods = createCavasMethods(canvas);
        init();
        return Object.assign(Object.assign({ addEvent: createAddEvent(canvas) }, methods), { canvas2img: canvas2img.bind(null, canvas) });
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
        function preOption({ bg, width, height, }) {
            var _a, _b, _c, _d;
            return __awaiter(this, void 0, void 0, function* () {
                const result = { width, height };
                if (bg) {
                    result.bgImg = yield getImage(bg);
                }
                if (!width && !height) {
                    result.width = (_a = result.bgImg) === null || _a === void 0 ? void 0 : _a.width;
                    result.height = (_b = result.bgImg) === null || _b === void 0 ? void 0 : _b.height;
                }
                else if (width && !height) {
                    result.width = width;
                    result.height =
                        (width / (((_c = result.bgImg) === null || _c === void 0 ? void 0 : _c.width) || 0)) * (((_d = result.bgImg) === null || _d === void 0 ? void 0 : _d.height) || 0);
                }
                return result;
            });
        }
    });
}

export { canvas2img, createContext, funDownload, getImage, getItemWithPlaces };
