export function funDownload(content: string | object, filename: string) {
  download(preContent());
  function download(content: string) {
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
export function getItemWithPlaces(
  list: itemListType,
  places: { x: number; y: number },
  types: Array<"text" | "image" | "rect">
) {
  const keys = Object.keys(list).reverse();
  const k = keys.find((k) => {
    const { x, y, width, height, type } = list[k];
    const x2 = x + Number(width);
    const y2 = y + Number(height);
    if (
      places.x > x &&
      places.x < x2 &&
      places.y > y &&
      places.y < y2 &&
      types.indexOf(type) > -1
    ) {
      return true;
    }
  });
  return k ? list[k] : false;
}
export function cache<T, U>(fn: Function) {
  const context = {};
  return function (key: number | string, args: U): T {
    if (context[key]) {
      return context[key];
    }
    const result = fn(args);
    context[key] = result;
    return context[key];
  };
}
