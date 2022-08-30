type contextOption = rawContextOption & {
  bgImg?: HTMLImageElement;
};
type rawContextOption = {
  width?: number;
  height?: number;
  bg?: string;
};

/** 
  baseline:
    top:文本基线在文本块的顶部。
    hanging:文本基线是悬挂基线。
    middle:文本基线在文本块的中间。
    alphabetic:文本基线是标准的字母基线。
    ideographic:文字基线是表意字基线；如果字符本身超出了 alphabetic 基线，那么 ideograhpic 基线位置在字符本身的底部。
    bottom:文本基线在文本块的底部。与 ideographic 基线的区别在于 ideographic 基线不需要考虑下行字母。
*/
type fontStyle = {
  x: number;
  y: number;
  maxWidth?: number;
  text: string;
  fill?: string;
  font?: string;
  baseline?: CanvasTextBaseline;
  align?: CanvasTextAlign;
  direction?: CanvasDirection;
  stroke?: boolean;
  type: "text";
};
type rawImageInfo = {
  image: string | HTMLImageElement;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

type imageInfo = {
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "image";
};

type eventType = "click" | "mousedown" | "mousemove" | "mouseup";
