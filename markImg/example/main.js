import {
  createContext,
  funDownload,
  getItemWithPlaces,
} from "../lib/myCanvas.esm.js";
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
  const defaultItem = {
    width: 30,
    height: 30,
  };
  const ctx = await createContext("canvas", { bg, width: 500 });
  let number = 1;
  let item = null;
  ctx.addEvent("click", async ({ withKeys, places }) => {
    if (withKeys.length > 0 && withKeys[0][0] === "meta") {
      item = getItemWithPlaces(ctx.itemList, places[0], ["text"]);
    } else {
      item = await ctx.drawText({
        text: number++,
        x: places[0].x - defaultItem.width / 2,
        y: places[0].y - defaultItem.height / 2,
        align: "center",
        vertical: "middle",
        width: defaultItem.width,
        height: defaultItem.height,
        bg: "rgba(0,0,0,0.2)",
      });
      console.log(item);
    }
    workStation();
  });
  let canMove = false;
  let lastPlaces = {};
  ctx.addEvent("mousedown", ({ withKeys, places }) => {
    if (withKeys.length > 0 && withKeys[0][0] === "meta") {
      item = getItemWithPlaces(ctx.itemList, places[0], ["text"]);
      canMove = true;
    }
  });
  ctx.addEvent("mousemove", ({ withKeys, places }) => {
    if (canMove) {
      if (lastPlaces.x) {
        item.x = item.x + places[0].x - lastPlaces.x;
        item.y = item.y + places[0].y - lastPlaces.y;
      }
      lastPlaces = places[0];
    }
  });
  ctx.addEvent("mouseup", () => {
    canMove = false;
    lastPlaces = {};
  });
  downloadBtn.addEventListener("click", () => {
    const result = [];
    for (const i in ctx.itemList) {
      const item = ctx.itemList[i];
      if (item.type === "text") {
        result.push(item);
      }
    }
    funDownload(ctx.canvas2img(), new Date().toUTCString() + ".png");
    // funDownload(result, new Date().toUTCString() + ".json");
  });
  const widthInput = document.getElementById("width");
  const heightInput = document.getElementById("height");
  function workStation() {
    if (!item) {
      document.getElementById("workStation").style.display = "none";
      return;
    }
    document.getElementById("workStation").style.display = "block";
    document.querySelector("#title span").innerText = item.text;
    widthInput.value = item.width;
    heightInput.value = item.height;
  }
  widthInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      item.width = widthInput.value;
      defaultItem.width = item.width;
    }
  });
  heightInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      item.height = heightInput.value;
      defaultItem.height = item.height;
    }
  });
  document.getElementById("set").addEventListener("click", () => {
    item.height = heightInput.value;
    item.width = widthInput.value;
    defaultItem.height = item.height;
    defaultItem.width = item.width;
  });
  document.getElementById("delete").addEventListener("click", () => {
    delete ctx.itemList[item.id];
    item = null;
    workStation();
  });
  const file = document.getElementById("file");
  file.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) {
      var reader = new FileReader();
      reader.readAsText(f, "gbk"); //gbk编码
      reader.onload = async function () {
        const res = JSON.parse(this.result);
        console.log(res);
        for (const v of res) {
          await ctx.drawText(v);
        }
      };
    }
  });
}