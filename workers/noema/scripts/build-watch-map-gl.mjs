/**
 * Tree-shake Three.js into the MAP-only spectator chunk.
 * TEXT/PIXEL never load this file.
 */
import * as esbuild from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

await esbuild.build({
  absWorkingDir: root,
  entryPoints: ["src/watch-map-gl-stage.ts"],
  bundle: true,
  format: "esm",
  outfile: "public/assets/watch-map-gl.js",
  minify: true,
  platform: "browser",
  target: "es2022",
  treeShaking: true,
  logLevel: "info",
});
