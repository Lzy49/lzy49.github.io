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

const DEFAULT = {
    text: {
        fill: "#000",
        align: "start",
        baseline: "ideographic",
        direction: "inherit",
        font: "24px ",
    },
};
function getCanvas(canvasId, { width, height }) {
    return __awaiter(this, void 0, void 0, function* () {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            canvas.width = width || 0;
            canvas.height = height || 0;
            return canvas;
        }
        throw new Error("canvas 未找到");
    });
}
function getCtx(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx)
        throw new Error("canvas 无法获取 上下文");
    return ctx;
}
function getContextInfo(canvas) {
    return canvas.getBoundingClientRect();
}
function createAddEvent(canvas) {
    const canvasInfo = getContextInfo(canvas);
    return function addEvent(type, callback) {
        canvas.addEventListener(type, (e) => {
            const places = [];
            switch (type) {
                case "click":
                case "mousedown":
                case "mousemove":
                case "mouseup":
                    const event = e;
                    const keyName = [
                        "shift",
                        "ctrl",
                        "alt",
                        "meta",
                    ];
                    keyName.reduce((result, value, key, arr) => {
                        e[value + "Key"] && result.push(value);
                        return result;
                    }, []);
                    places.push({
                        y: event.pageY - canvasInfo.y,
                        x: event.pageX - canvasInfo.x,
                    });
                    break;
            }
            callback(places);
        });
    };
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
        return __awaiter(this, void 0, void 0, function* () {
            ctx.direction = font.direction || DEFAULT.text.direction;
            ctx.fillStyle = font.fill || DEFAULT.text.fill;
            ctx.font = font.font || DEFAULT.text.font;
            ctx.textAlign = font.align || DEFAULT.text.align;
            ctx.textBaseline = font.baseline || DEFAULT.text.baseline;
            draw();
            return Object.assign(Object.assign({}, font), { type: "text" });
            function draw() {
                const args = [
                    font.text,
                    font.x,
                    font.y,
                    font.maxWidth,
                ];
                font.stroke ? ctx.strokeText(...args) : ctx.fillText(...args);
            }
        });
    }
    function proxyMethods(methods) {
        const itemList = [];
        const handler = {
            apply: function (target, thisArg, argumentsList) {
                return __awaiter(this, void 0, void 0, function* () {
                    const result = yield target(...argumentsList);
                    itemList.push(result);
                    return result;
                });
            },
        };
        const result = { itemList };
        for (let key in methods) {
            result[key] = new Proxy(methods[key], handler);
        }
        return result;
    }
    return proxyMethods({
        drawImage,
        drawText,
    });
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
            var _a, _b;
            return __awaiter(this, void 0, void 0, function* () {
                const result = { width, height };
                if (bg) {
                    result.bgImg = yield getImage(bg);
                }
                if (!width && !height) {
                    result.width = (_a = result.bgImg) === null || _a === void 0 ? void 0 : _a.width;
                    result.height = (_b = result.bgImg) === null || _b === void 0 ? void 0 : _b.height;
                }
                return result;
            });
        }
    });
}

export { canvas2img, createContext, funDownload, getImage };
