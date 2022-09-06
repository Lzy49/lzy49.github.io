type contextOption = rawContextOption & {
  bgImg?: HTMLImageElement;
};
type rawContextOption = {
  width?: number;
  height?: number;
  bg?: string;
};
type rawText = {
  x: number;
  y: number;
  maxWidth?: number;
  width: number;
  height: number;
  text: string;
  fill?: string;
  font?: string;
  vertical: "middle" | "top" | "bottom";
  align?: CanvasTextAlign;
  direction?: CanvasDirection;
  stroke?: boolean;
  bg?: string;
};
type text = rawText & { type: "text" };
type rawImageInfo = {
  image: string | HTMLImageElement;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};
type rawRect = {
  x: number;
  y: number;
  height: number;
  width: number;
  full: string;
  stroke?: boolean;
};
type rect = rawRect & { type: "rect" };
type imageInfo = {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "image";
};
type resultType = (text | imageInfo | rect) & { id: number };

type eventType = "click" | "mousedown" | "mousemove" | "mouseup";

type itemListType = { [key: string]: resultType };
type canvasType = HTMLCanvasElement & { _id: number };
