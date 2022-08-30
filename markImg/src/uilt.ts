export function funDownload(content: string | object, filename: string) {
  download(preContent());
  function download(content:string) {
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
export function canvas2img(canvas, option) {
  return canvas.toDataURL(option || "image/png");
}
