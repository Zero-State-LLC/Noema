/**
 * WATCH Chamber stage chunk (Noema-Specs specify/watch-single-3d-stage.md).
 * One lazy ES module, loaded only when the spectator picks 3D. Budget D5:
 * at most 160 KiB gzip (test/watch-stage.test.ts). Three.js is the existing
 * MIT devDependency; its license ships as public/assets/THREE-LICENSE.txt.
 */
import * as esbuild from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
await esbuild.build({
  absWorkingDir: root, entryPoints: ["src/watch-stage-client.js"], outfile: "public/assets/watch-stage.js",
  bundle: true, format: "esm", minify: true, platform: "browser",
  target: "es2022", treeShaking: true,
  plugins: [{
    name: "three-single-source",
    setup(build) {
      // OrbitControls and CSS2DRenderer import "three"; resolve it to the same
      // source entry so the chunk carries one copy of each class.
      build.onResolve({ filter: /^three$/ }, () => ({ path: join(root, "node_modules/three/src/Three.js") }));
      build.onLoad({ filter: /\/three\/src\/renderers\/shaders\/.*\.glsl\.js$/ }, async ({ path }) => ({
        // GLSL ignores indentation and trailing whitespace; strip it from the bundle.
        contents: (await readFile(path, "utf8")).replace(/[ \t]+$/gm, "").replace(/^ +(?=\t)/gm, ""),
        loader: "js",
      }));
    },
  }],
  banner: { js: "/*! NOEMA WATCH Chamber stage. Bundles three.js (MIT, Copyright 2010-2026 three.js authors); see /assets/THREE-LICENSE.txt */" },
  logLevel: "info", legalComments: "none",
});
