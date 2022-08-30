import { createContext, funDownload } from "../lib/myCanvas.esm.js";
createUpButton();
function createUpButton() {
  let upBgButton = document.getElementById("bg");
  upBgButton.addEventListener("change", (e) => {
    if (!e.target.files[0]) {
      return;
    }
    let reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    reader.onload = function (theFile) {
      init(theFile.target.result);
    };
  });
}
async function init(bg) {
  const ctx = await createContext("canvas", { bg, width: 400, height: 500 });
  let number = 1;
  ctx.addEvent("click", (e) => {
    ctx.drawText({
      text: number++,
      x: e[0].x,
      y: e[0].y,
      align:'center',
      baseline:'middle'
    });
  });
  downloadBtn.addEventListener("click", () => {
    const items = ctx.itemList.filter((item) => {
      if (item.type === "text") {
        return item;
      }
    });
    funDownload(ctx.canvas2img(), new Date().toUTCString() + ".png");
    funDownload(items, new Date().toUTCString() + ".json");
  });
  document.body.addEventListener("keydown",(e)=>{
    const keyName = ['shift', 'ctrl', 'alt', 'meta'];
    const keys = keyName.reduce((result, value, key, arr) => {
      result += e[value + 'Key'] ? ' ' + value : '';
      return result;
    }, '');
    console.log(keys)
    console.log(e)
  })
}
