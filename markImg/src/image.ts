type imagesType = {
  [key: string]: HTMLImageElement;
};
const images: imagesType = {};
export function getImage(link: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (images[link]) {
      resolve(images[link]);
      return;
    }
    resolve(downloadImg(link));
  });
}
async function downloadImg(link: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    let image = new Image();
    image.src = link;
    image.onload = function () {
      images[link] = image;
      resolve(image);
    };
    image.onerror = reject;
  });
}
