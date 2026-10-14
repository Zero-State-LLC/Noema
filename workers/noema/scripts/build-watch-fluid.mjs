/** Two chunks: native TEXT/PIXEL first, Three.js only when MAP is selected.
 * Three.js is the existing MIT dependency; notices and full license ship in public/assets.
 */
import * as esbuild from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const [entry, outfile] of [
  ["src/watch-fluid-map.js", "public/assets/watch-fluid-map.js"],
  ["src/watch-fluid.js", "public/assets/watch-fluid.js"],
]) {
  await esbuild.build({
    absWorkingDir: root, entryPoints: [entry], outfile,
    bundle: true, format: "esm", minify: true, platform: "browser",
    target: "es2022", treeShaking: true, external: ["/assets/*"],
    plugins: [{
      name: "glsl-whitespace",
      setup(build) {
        // Share one Three.js source entry with OrbitControls so shader modules
        // can be normalized before bundling rather than patching bundle text.
        build.onResolve({ filter: /^three$/ }, () => ({
          path: join(root, "node_modules/three/src/Three.js"),
        }));
        build.onLoad({ filter: /\/three\/src\/renderers\/shaders\/.*\.glsl\.js$/ }, async ({ path }) => ({
          // GLSL ignores this indentation and trailing whitespace. Normalize it
          // in the bundle without changing the dependency or shader operations.
          contents: (await readFile(path, "utf8")).replace(/[ \t]+$/gm, "").replace(/^ +(?=\t)/gm, ""),
          loader: "js",
        }));
      },
    }],
    logLevel: "info", legalComments: "linked",
  });
}
