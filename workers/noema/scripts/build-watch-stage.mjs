/**
 * WATCH Chamber stage split build pipeline (Noema-Specs specify/watch-single-3d-stage.md D5).
 * Builds three budgeted ES module chunks so Three.js is downloaded ONCE and shared
 * between the World Overview (watch-stage.js) and Full-Screen Place View (watch-room-stage.js):
 *   1. public/assets/three-vendor.js     (<= 150 KiB gzip)
 *   2. public/assets/watch-stage.js      (<= 40 KiB gzip)
 *   3. public/assets/watch-room-stage.js (<= 120 KiB gzip)
 * Three.js is the existing MIT devDependency; its license ships as public/assets/THREE-LICENSE.txt.
 */
import * as esbuild from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Exact tree-shaken Three.js exports shared by watch-stage-client.js & watch-room-stage-client.js.
const VENDOR_ENTRY = `
export {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  FogExp2,
  Group,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Raycaster,
  RepeatWrapping,
  RingGeometry,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
export { OrbitControls } from "three/addons/controls/OrbitControls.js";
export { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
`;

// 1. Build shared Three.js vendor chunk (minified, tree-shaken, GLSL comment-stripped).
await esbuild.build({
  absWorkingDir: root,
  stdin: {
    contents: VENDOR_ENTRY,
    resolveDir: root,
    sourcefile: "three-vendor-entry.js",
    loader: "js",
  },
  outfile: "public/assets/three-vendor.js",
  bundle: true,
  format: "esm",
  minify: true,
  platform: "browser",
  target: "es2022",
  treeShaking: true,
  plugins: [{
    name: "three-single-source",
    setup(build) {
      // OrbitControls and CSS2DRenderer import "three"; resolve it to the same
      // source entry so the vendor chunk carries one copy of each class.
      build.onResolve({ filter: /^three$/ }, () => ({
        path: join(root, "node_modules/three/src/Three.js"),
      }));
      build.onLoad({ filter: /[\\/]three[\\/]src[\\/]renderers[\\/]shaders[\\/].*\.glsl\.js$/ }, async ({ path }) => {
        const src = await readFile(path, "utf8");
        // Strip comments, indentation, and blank lines inside GLSL template strings
        // while preserving newlines so preprocessor directives (#define, #include, #if) stay valid.
        const contents = src.replace(/`([\s\S]*?)`/g, (_, glsl) => {
          const compact = glsl
            .replace(/\/\*[\s\S]*?\*\//g, " ")
            .replace(/\/\/[^\n]*/g, "")
            .replace(/^[ \t]+|[ \t]+$/gm, "")
            .replace(/[ \t]{2,}/g, " ")
            .replace(/\n{2,}/g, "\n");
          return "`" + compact + "`";
        });
        return { contents, loader: "js" };
      });
    },
  }],
  banner: {
    js: "/*! NOEMA WATCH shared Three.js vendor chunk (MIT, Copyright 2010-2026 three.js authors); see /assets/THREE-LICENSE.txt */",
  },
  logLevel: "info",
  legalComments: "none",
});

const vendorBuf = await readFile(join(root, "public/assets/three-vendor.js"));
const vendorVersion = createHash("sha256").update(vendorBuf).digest("hex").slice(0, 12);
const vendorExternalPath = `./three-vendor.js?v=${vendorVersion}`;

function externalThreeVendorPlugin() {
  return {
    name: "external-three-vendor",
    setup(build) {
      build.onResolve(
        { filter: /^(?:three|three\/addons\/controls\/OrbitControls\.js|three\/addons\/renderers\/CSS2DRenderer\.js)$/ },
        () => ({ path: vendorExternalPath, external: true }),
      );
    },
  };
}

// 2. Build World Overview stage chunk referencing the shared vendor chunk.
await esbuild.build({
  absWorkingDir: root,
  entryPoints: ["src/watch-stage-client.js"],
  outfile: "public/assets/watch-stage.js",
  bundle: true,
  format: "esm",
  minify: true,
  platform: "browser",
  target: "es2022",
  treeShaking: true,
  plugins: [externalThreeVendorPlugin()],
  banner: {
    js: "/*! NOEMA WATCH Chamber stage. Bundles three.js (MIT, Copyright 2010-2026 three.js authors); see /assets/THREE-LICENSE.txt */",
  },
  logLevel: "info",
  legalComments: "none",
});

// 3. Build Full-Screen Place View cutaway room diorama chunk referencing the shared vendor chunk.
await esbuild.build({
  absWorkingDir: root,
  entryPoints: ["src/watch-room-stage-client.js"],
  outfile: "public/assets/watch-room-stage.js",
  bundle: true,
  format: "esm",
  minify: true,
  platform: "browser",
  target: "es2022",
  treeShaking: true,
  plugins: [externalThreeVendorPlugin()],
  banner: {
    js: "/*! NOEMA WATCH Room stage. Uses three-vendor.js (MIT, Copyright 2010-2026 three.js authors); see /assets/THREE-LICENSE.txt */",
  },
  logLevel: "info",
  legalComments: "none",
});

const stageBuf = await readFile(join(root, "public/assets/watch-stage.js"));
const stageVersion = createHash("sha256").update(stageBuf).digest("hex").slice(0, 12);

const roomBuf = await readFile(join(root, "public/assets/watch-room-stage.js"));
const roomVersion = createHash("sha256").update(roomBuf).digest("hex").slice(0, 12);

// 4. Write deterministic content-hash version manifest.
await writeFile(
  join(root, "src/watch-stage-version.ts"),
  `/** Generated by scripts/build-watch-stage.mjs: sha256 content hashes of public/assets/*.js. Do not edit. */\n`
    + `export const VENDOR_VERSION = "${vendorVersion}";\n`
    + `export const STAGE_VERSION = "${stageVersion}";\n`
    + `export const ROOM_STAGE_VERSION = "${roomVersion}";\n`,
);

const vendorGz = gzipSync(vendorBuf, { level: 9 }).length;
const stageGz = gzipSync(stageBuf, { level: 9 }).length;
const roomGz = gzipSync(roomBuf, { level: 9 }).length;

console.log(`three-vendor.js     v=${vendorVersion} raw=${vendorBuf.length} gzip9=${vendorGz} (budget <= 153600)`);
console.log(`watch-stage.js      v=${stageVersion} raw=${stageBuf.length} gzip9=${stageGz} (budget <= 40960)`);
console.log(`watch-room-stage.js v=${roomVersion} raw=${roomBuf.length} gzip9=${roomGz} (budget <= 122880)`);
