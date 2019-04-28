import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript";

export default {
  input: "src/index.tsx",
  output: {
    format: "iife",
    file: __dirname + "/static/index.js",
  },
  plugins: [
    typescript(),
    resolve(),
    commonjs(),
  ]
}
