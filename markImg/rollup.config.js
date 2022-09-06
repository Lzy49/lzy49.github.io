import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
export default {
  input: "./src/index.ts", // 入口
  output: [
    // 出口
    {
      format: "es",
      file: "lib/myCanvas.esm.js",
    },
  ],
  plugins: [
    typescript(), // 编译ts
    commonjs(),
  ],
};
