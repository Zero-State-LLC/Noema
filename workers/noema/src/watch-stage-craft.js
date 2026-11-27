/**
 * Shared procedural visual-craft primitives for NOEMA WATCH 3D stages (D8 Pass 4A/4B).
 * Zero external assets, zero post-processing passes (D6 §8).
 * Provides:
 *  - Procedural nocturnal tabletop IBL environment map via PMREMGenerator
 *  - Height-canvas -> tangent-space Sobel normalMap generator
 *  - Lightweight Fresnel rim-light shader hook (onBeforeCompile)
 *  - 5 distinct procedural PBR district floor/wall material sets + overview deck/terrain PBR
 */
import {
  BackSide,
  BoxGeometry,
  CanvasTexture,
  Color,
  Mesh,
  MeshBasicMaterial,
  PMREMGenerator,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
} from "three";

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(w, h) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx2d = typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
    if (!ctx2d) return null;
    return { canvas, ctx2d };
  } catch (e) {
    return null;
  }
}

/**
 * Procedural nocturnal tabletop studio IBL via PMREMGenerator.
 * Emulates hero-table.jpg lighting: midnight slate dome, silver starlight zenith,
 * cool cyan architectural rim cards, warm amber hearth lantern cards, and dark obsidian floor bounce.
 */
export function buildNocturnalEnvMap(renderer) {
  try {
    if (!renderer || typeof PMREMGenerator !== "function") return null;
    const pmrem = new PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envScene = new Scene();
    envScene.background = new Color(0x090e16);

    const boxGeo = new BoxGeometry(1, 1, 1);
    const mats = [];
    const addCard = (hex, intensity, px, py, pz, sx, sy, sz) => {
      const c = new Color(hex).multiplyScalar(intensity);
      const m = new MeshBasicMaterial({ color: c });
      mats.push(m);
      const mesh = new Mesh(boxGeo, m);
      mesh.position.set(px, py, pz);
      mesh.scale.set(sx, sy, sz);
      envScene.add(mesh);
    };

    // Soft nocturnal dome enclosure
    const domeMat = new MeshBasicMaterial({ color: 0x0c1320, side: BackSide });
    mats.push(domeMat);
    const dome = new Mesh(boxGeo, domeMat);
    dome.scale.set(30, 22, 30);
    envScene.add(dome);

    // Cool silver-blue starlight overhead key strip
    addCard(0xcde4ff, 2.2, -5, 9.5, 4, 10, 0.4, 7);
    // Warm amber tabletop hearth glow (left/front-warm balance matching hero-table.jpg)
    addCard(0xffaa38, 2.8, -8.5, 2.8, -3.5, 0.5, 4.5, 9);
    addCard(0xffbe66, 1.8, -3.5, 2.2, 8.5, 7, 3.2, 0.5);
    // Crisp electric-cyan signal rim card (right/rear cool contrast)
    addCard(0x3ddcff, 2.5, 9.2, 4.2, -4.8, 0.5, 5.2, 10);
    addCard(0x6adcf8, 1.35, 4.5, 6.8, -9.2, 8, 3.6, 0.5);
    // Deep violet deep-time zenith accent (very restrained)
    addCard(0x7c58d8, 0.75, 5.5, 8.2, 6.2, 5, 0.4, 5);
    // Grounded dark slate floor bounce
    addCard(0x162232, 0.85, 0, -9.5, 0, 24, 0.4, 24);

    const rt = pmrem.fromScene(envScene, 0.045);
    boxGeo.dispose();
    for (const m of mats) m.dispose();
    pmrem.dispose();

    return {
      envMap: rt.texture,
      dispose() {
        rt.dispose();
      },
    };
  } catch (e) {
    return null;
  }
}

/** Convert a 2D grayscale height canvas into a crisp tangent-space RGB normal CanvasTexture (Sobel 3x3). */
export function heightCanvasToNormalTexture(heightCanvas, strength = 2.4, repeatX = 1, repeatY = 1) {
  if (!heightCanvas) return null;
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const srcCtx = heightCanvas.getContext("2d");
  if (!srcCtx || typeof srcCtx.getImageData !== "function") return null;
  const out = makeCanvas(w, h);
  if (!out) return null;

  const src = srcCtx.getImageData(0, 0, w, h).data;
  const dstImg = out.ctx2d.createImageData(w, h);
  const dst = dstImg.data;
  const sample = (x, y) => {
    const wx = (x + w) % w;
    const wy = (y + h) % h;
    return src[(wy * w + wx) * 4] / 255;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);
      let nx = -dx * strength;
      let ny = -dy * strength;
      let nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;

      const idx = (y * w + x) * 4;
      dst[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  out.ctx2d.putImageData(dstImg, 0, 0);
  const tex = new CanvasTexture(out.canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  return tex;
}

/**
 * Lightweight Fresnel rim-light hook on MeshStandardMaterial (zero extra passes).
 * Gives dark obsidian walls, plinths, and automatons crisp silhouette separation against #0B0F15.
 */
export function applyRimGlow(mat, colorHex = 0x56c8ee, strength = 0.28, power = 3.2) {
  if (!mat || typeof mat.onBeforeCompile !== "function") return mat;
  const c = new Color(colorHex);
  mat.customProgramCacheKey = () => `noema-rim-${colorHex}-${strength.toFixed(2)}-${power.toFixed(1)}`;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uNoemaRimColor = { value: c };
    shader.uniforms.uNoemaRimStrength = { value: strength };
    shader.uniforms.uNoemaRimPower = { value: power };
    shader.fragmentShader =
      "uniform vec3 uNoemaRimColor;\nuniform float uNoemaRimStrength;\nuniform float uNoemaRimPower;\n"
      + shader.fragmentShader.replace(
        "#include <dithering_fragment>",
        `vec3 _nRimV = normalize(vViewPosition);
        float _nRim = pow(1.0 - clamp(abs(dot(normalize(normal), _nRimV)), 0.0, 1.0), uNoemaRimPower);
        gl_FragColor.rgb += uNoemaRimColor * (_nRim * uNoemaRimStrength);
        #include <dithering_fragment>`,
      );
  };
  return mat;
}

function finalizePbr(albedoCanvas, heightCanvas, roughCanvas, opts = {}) {
  const rx = opts.repeatX || 1;
  const ry = opts.repeatY || 1;
  const normalStrength = opts.normalStrength ?? 2.2;
  const map = new CanvasTexture(albedoCanvas);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;
  map.repeat.set(rx, ry);

  const normalMap = heightCanvasToNormalTexture(heightCanvas, normalStrength, rx, ry);
  const bumpMap = new CanvasTexture(heightCanvas);
  bumpMap.wrapS = bumpMap.wrapT = RepeatWrapping;
  bumpMap.repeat.set(rx, ry);

  const roughnessMap = new CanvasTexture(roughCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = RepeatWrapping;
  roughnessMap.repeat.set(rx, ry);

  return {
    map,
    normalMap,
    bump: bumpMap,
    roughnessMap,
    dispose() {
      map.dispose();
      if (normalMap) normalMap.dispose();
      bumpMap.dispose();
      roughnessMap.dispose();
    },
  };
}

/** Overview brushed obsidian-titanium deck plate PBR (albedo + normal + roughness + edge AO). */
export function makeOverviewDeckPbr() {
  const a = makeCanvas(256, 256);
  const h = makeCanvas(256, 256);
  const r = makeCanvas(256, 256);
  if (!a || !h || !r) return null;
  const ctx = a.ctx2d;
  const hctx = h.ctx2d;
  const rctx = r.ctx2d;

  ctx.fillStyle = "#b8c4d2";
  ctx.fillRect(0, 0, 256, 256);
  hctx.fillStyle = "#9e9e9e";
  hctx.fillRect(0, 0, 256, 256);
  rctx.fillStyle = "#969696"; // ~0.59 base roughness
  rctx.fillRect(0, 0, 256, 256);

  const rand = mulberry32(3141);
  const step = 64;
  for (let gy = 0; gy < 4; gy++) {
    for (let gx = 0; gx < 4; gx++) {
      const shade = 172 + ((rand() * 26) | 0);
      ctx.fillStyle = `rgb(${shade},${shade + 7},${shade + 15})`;
      ctx.fillRect(gx * step + 2, gy * step + 2, step - 4, step - 4);
      const hs = 152 + ((rand() * 34) | 0);
      hctx.fillStyle = `rgb(${hs},${hs},${hs})`;
      hctx.fillRect(gx * step + 2, gy * step + 2, step - 4, step - 4);
      // Slight per-tile wear sheen variance
      const rs = 122 + ((rand() * 54) | 0);
      rctx.fillStyle = `rgb(${rs},${rs},${rs})`;
      rctx.fillRect(gx * step + 2, gy * step + 2, step - 4, step - 4);

      // Machined corner fasteners
      ctx.fillStyle = "#52606e";
      hctx.fillStyle = "#484848";
      rctx.fillStyle = "#585858";
      for (const [rx, ry] of [[7, 7], [step - 9, 7], [7, step - 9], [step - 9, step - 9]]) {
        ctx.fillRect(gx * step + rx, gy * step + ry, 2.5, 2.5);
        hctx.fillRect(gx * step + rx, gy * step + ry, 2.5, 2.5);
        rctx.fillRect(gx * step + rx, gy * step + ry, 2.5, 2.5);
      }
    }
  }

  // Deep recessed panel seams (rough & dark AO inside seams)
  ctx.strokeStyle = "#3f4c5a";
  ctx.lineWidth = 2.2;
  hctx.strokeStyle = "#262626";
  hctx.lineWidth = 2.8;
  rctx.strokeStyle = "#dcdcdc";
  rctx.lineWidth = 2.6;
  for (let i = 0; i <= 256; i += step) {
    for (const c2 of [ctx, hctx, rctx]) {
      c2.beginPath(); c2.moveTo(i, 0); c2.lineTo(i, 256); c2.stroke();
      c2.beginPath(); c2.moveTo(0, i); c2.lineTo(256, i); c2.stroke();
    }
  }

  // Satin-machined bevel rim inset (smoother metal edge catches IBL!)
  ctx.strokeStyle = "#9eb0c2";
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, 240, 240);
  hctx.strokeStyle = "#d8d8d8";
  hctx.lineWidth = 2.5;
  hctx.strokeRect(8, 8, 240, 240);
  rctx.strokeStyle = "#4e4e4e";
  rctx.lineWidth = 3;
  rctx.strokeRect(8, 8, 240, 240);

  // Fine brushed titanium micro-streaks
  for (let i = 0; i < 480; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const len = 10 + rand() * 34;
    ctx.fillStyle = rand() > 0.5 ? "rgba(225,240,255,0.05)" : "rgba(16,22,32,0.07)";
    ctx.fillRect(x, y, len, 1);
  }

  // Subtle baked AO around perimeter edge
  const ao = ctx.createRadialGradient(128, 128, 72, 128, 128, 168);
  ao.addColorStop(0, "rgba(0,0,0,0)");
  ao.addColorStop(1, "rgba(6,10,16,0.22)");
  ctx.fillStyle = ao;
  ctx.fillRect(0, 0, 256, 256);

  return finalizePbr(a.canvas, h.canvas, r.canvas, { normalStrength: 2.3 });
}

/** Overview nocturnal obsidian-basalt planetary basin PBR (albedo + normal + roughness). */
export function makeOverviewTerrainPbr() {
  const a = makeCanvas(512, 512);
  const h = makeCanvas(512, 512);
  const r = makeCanvas(512, 512);
  if (!a || !h || !r) return null;
  const ctx = a.ctx2d;
  const hctx = h.ctx2d;
  const rctx = r.ctx2d;

  const baseGrad = ctx.createRadialGradient(256, 256, 16, 256, 256, 256);
  baseGrad.addColorStop(0, "#0c1119");
  baseGrad.addColorStop(0.26, "#101824");
  baseGrad.addColorStop(0.50, "#172231");
  baseGrad.addColorStop(0.76, "#202f43");
  baseGrad.addColorStop(1, "#111824");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  hctx.fillStyle = "#808080";
  hctx.fillRect(0, 0, 512, 512);

  // Polished dark obsidian basin floor (lower roughness) transitioning to rough matte canyon rim
  const rGrad = rctx.createRadialGradient(256, 256, 20, 256, 256, 256);
  rGrad.addColorStop(0, "#8c8c8c");
  rGrad.addColorStop(0.42, "#b4b4b4");
  rGrad.addColorStop(0.78, "#dcdcdc");
  rGrad.addColorStop(1, "#ececec");
  rctx.fillStyle = rGrad;
  rctx.fillRect(0, 0, 512, 512);

  const rand = mulberry32(9021);
  for (let i = 0; i < 84; i++) {
    const ang = rand() * Math.PI * 2;
    const dist = 56 + rand() * 184;
    const x = 256 + Math.cos(ang) * dist;
    const y = 256 + Math.sin(ang) * dist;
    const rad = 20 + rand() * 54;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const cool = rand() > 0.36;
    g.addColorStop(0, cool ? "rgba(42,62,86,0.22)" : "rgba(10,16,26,0.3)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  // Settlement basin foundation shadow
  const sink = ctx.createRadialGradient(256, 256, 12, 256, 256, 72);
  sink.addColorStop(0, "rgba(3,5,9,0.58)");
  sink.addColorStop(0.76, "rgba(6,10,16,0.34)");
  sink.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sink;
  ctx.fillRect(180, 180, 152, 152);

  // Carved basalt topographic terraces
  ctx.lineWidth = 1.15;
  hctx.lineWidth = 1.8;
  for (let rad = 22; rad <= 240; rad += 13) {
    const inBasin = rad < 62;
    ctx.strokeStyle = inBasin ? "rgba(50,72,96,0.24)" : "rgba(62,88,116,0.26)";
    hctx.strokeStyle = inBasin ? "rgba(52,52,52,0.58)" : "rgba(198,198,198,0.48)";
    ctx.beginPath();
    hctx.beginPath();
    for (let a0 = 0; a0 <= 72; a0++) {
      const th = (a0 / 72) * Math.PI * 2;
      const wob = inBasin ? 0 : Math.sin(th * 5 + rad * 0.08) * 2.8 + Math.cos(th * 3 - rad * 0.05) * 2.0;
      const px = 256 + Math.cos(th) * (rad + wob);
      const py = 256 + Math.sin(th) * (rad + wob);
      if (a0 === 0) { ctx.moveTo(px, py); hctx.moveTo(px, py); }
      else { ctx.lineTo(px, py); hctx.lineTo(px, py); }
    }
    ctx.stroke();
    hctx.stroke();
  }

  // Subtle brass cardinal survey hairlines (smooth specular metallic inlaid lines)
  ctx.lineWidth = 0.9;
  rctx.lineWidth = 1.4;
  for (let i = 0; i < 12; i++) {
    const th = (i / 12) * Math.PI * 2;
    const isCard = i % 3 === 0;
    ctx.strokeStyle = isCard ? "rgba(164,134,94,0.28)" : "rgba(56,78,104,0.18)";
    rctx.strokeStyle = isCard ? "#545454" : "#808080";
    for (const c2 of [ctx, rctx]) {
      c2.beginPath();
      c2.moveTo(256 + Math.cos(th) * 20, 256 + Math.sin(th) * 20);
      c2.lineTo(256 + Math.cos(th) * 108, 256 + Math.sin(th) * 108);
      c2.stroke();
    }
  }

  // Volcanic mineral micro-grain
  for (let i = 0; i < 4600; i++) {
    const x = (rand() * 512) | 0;
    const y = (rand() * 512) | 0;
    const v = rand();
    ctx.fillStyle = v > 0.5 ? "rgba(170,204,234,0.04)" : "rgba(0,0,0,0.095)";
    ctx.fillRect(x, y, 2, 2);
    const hv = (88 + v * 80) | 0;
    hctx.fillStyle = `rgb(${hv},${hv},${hv})`;
    hctx.fillRect(x, y, 2, 2);
  }

  return finalizePbr(a.canvas, h.canvas, r.canvas, { normalStrength: 2.0 });
}

/**
 * 5 distinct district PBR floor material presets for the 10 cutaway rooms:
 *   flagstone (Civic, Archive) | hexgrate (Generator, Relay) | diamond (Foundry, Vault)
 *   apron (Storage, Transit)   | basalt (Outer Works, Frontier Gate)
 */
export function makeDistrictFloorPbr(style) {
  const a = makeCanvas(512, 512);
  const h = makeCanvas(512, 512);
  const r = makeCanvas(512, 512);
  if (!a || !h || !r) return null;
  const ctx = a.ctx2d;
  const hctx = h.ctx2d;
  const rctx = r.ctx2d;
  const rand = mulberry32(
    style === "hexgrate" ? 6101 : style === "diamond" ? 6202 : style === "apron" ? 6303 : style === "basalt" ? 6404 : 6000,
  );

  if (style === "flagstone") {
    // Obsidian carved stone flagstones + satin brass geometric trim inlays
    ctx.fillStyle = "#a8b4c2";
    ctx.fillRect(0, 0, 512, 512);
    hctx.fillStyle = "#969696";
    hctx.fillRect(0, 0, 512, 512);
    rctx.fillStyle = "#9e9e9e";
    rctx.fillRect(0, 0, 512, 512);
    const step = 64;
    for (let gy = 0; gy < 8; gy++) {
      const off = (gy % 2) * 32;
      for (let gx = -1; gx < 9; gx++) {
        const px = gx * step + off;
        const py = gy * step;
        const sh = 158 + ((rand() * 30) | 0);
        ctx.fillStyle = `rgb(${sh},${sh + 6},${sh + 14})`;
        ctx.fillRect(px + 2, py + 2, step - 4, step - 4);
        const hs = 148 + ((rand() * 34) | 0);
        hctx.fillStyle = `rgb(${hs},${hs},${hs})`;
        hctx.fillRect(px + 2, py + 2, step - 4, step - 4);
        const rs = 112 + ((rand() * 58) | 0);
        rctx.fillStyle = `rgb(${rs},${rs},${rs})`;
        rctx.fillRect(px + 2, py + 2, step - 4, step - 4);
      }
    }
    // Recessed mortar seams + subtle inlaid brass architectural cross-lines
    ctx.strokeStyle = "#364250";
    ctx.lineWidth = 2.4;
    hctx.strokeStyle = "#222222";
    hctx.lineWidth = 3;
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
      hctx.beginPath(); hctx.moveTo(0, y); hctx.lineTo(512, y); hctx.stroke();
    }
    ctx.strokeStyle = "rgba(218,182,124,0.42)";
    ctx.lineWidth = 2;
    rctx.strokeStyle = "#3c3c3c";
    rctx.lineWidth = 3;
    for (const pos of [128, 384]) {
      for (const c2 of [ctx, rctx]) {
        c2.beginPath(); c2.moveTo(pos, 0); c2.lineTo(pos, 512); c2.stroke();
        c2.beginPath(); c2.moveTo(0, pos); c2.lineTo(512, pos); c2.stroke();
      }
    }
  } else if (style === "hexgrate") {
    // Perforated steel deck plates + recessed dark grating slots for Generator & Relay
    ctx.fillStyle = "#9aaab8";
    ctx.fillRect(0, 0, 512, 512);
    hctx.fillStyle = "#a8a8a8";
    hctx.fillRect(0, 0, 512, 512);
    rctx.fillStyle = "#767676"; // sleek machined steel
    rctx.fillRect(0, 0, 512, 512);
    const step = 64;
    for (let gy = 0; gy < 8; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        const px = gx * step;
        const py = gy * step;
        const isGrate = (gx + gy) % 2 === 1;
        const sh = isGrate ? 132 : 172 + ((rand() * 20) | 0);
        ctx.fillStyle = `rgb(${sh},${sh + 8},${sh + 16})`;
        ctx.fillRect(px + 2, py + 2, step - 4, step - 4);
        rctx.fillStyle = isGrate ? "#565656" : "#888888";
        rctx.fillRect(px + 2, py + 2, step - 4, step - 4);
        if (isGrate) {
          // Machined ventilation slots
          ctx.fillStyle = "#263240";
          hctx.fillStyle = "#1c1c1c";
          rctx.fillStyle = "#dadada";
          for (let s = 10; s < step - 8; s += 10) {
            ctx.fillRect(px + 10, py + s, step - 20, 4);
            hctx.fillRect(px + 10, py + s, step - 20, 4);
            rctx.fillRect(px + 10, py + s, step - 20, 4);
          }
        } else {
          ctx.fillStyle = "#485868";
          hctx.fillStyle = "#525252";
          for (const [rx, ry] of [[8, 8], [step - 10, 8], [8, step - 10], [step - 10, step - 10]]) {
            ctx.fillRect(px + rx, py + ry, 3, 3);
            hctx.fillRect(px + rx, py + ry, 3, 3);
          }
        }
      }
    }
    ctx.strokeStyle = "#32404e";
    ctx.lineWidth = 2.4;
    hctx.strokeStyle = "#202020";
    hctx.lineWidth = 3;
    for (let i = 0; i <= 512; i += step) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
      hctx.beginPath(); hctx.moveTo(i, 0); hctx.lineTo(i, 512); hctx.stroke();
      hctx.beginPath(); hctx.moveTo(0, i); hctx.lineTo(512, i); hctx.stroke();
    }
  } else if (style === "diamond") {
    // Heavy industrial diamond-tread steel plates with scorch/wear patina (Foundry, Vault)
    ctx.fillStyle = "#9aa4b0";
    ctx.fillRect(0, 0, 512, 512);
    hctx.fillStyle = "#888888";
    hctx.fillRect(0, 0, 512, 512);
    rctx.fillStyle = "#848484";
    rctx.fillRect(0, 0, 512, 512);
    const step = 128;
    for (let gy = 0; gy < 4; gy++) {
      for (let gx = 0; gx < 4; gx++) {
        const sh = 148 + ((rand() * 28) | 0);
        ctx.fillStyle = `rgb(${sh + 4},${sh + 2},${sh + 6})`;
        ctx.fillRect(gx * step + 3, gy * step + 3, step - 6, step - 6);
        const rs = 96 + ((rand() * 68) | 0);
        rctx.fillStyle = `rgb(${rs},${rs},${rs})`;
        rctx.fillRect(gx * step + 3, gy * step + 3, step - 6, step - 6);
      }
    }
    // Raised alternating diamond tread lugs
    ctx.fillStyle = "rgba(215,228,242,0.16)";
    hctx.fillStyle = "#dcdcdc";
    rctx.fillStyle = "#484848";
    for (let y = 12; y < 512; y += 24) {
      for (let x = 12; x < 512; x += 24) {
        const horiz = ((x / 24 + y / 24) | 0) % 2 === 0;
        const w = horiz ? 10 : 3;
        const l = horiz ? 3 : 10;
        ctx.fillRect(x - w * 0.5, y - l * 0.5, w, l);
        hctx.fillRect(x - w * 0.5, y - l * 0.5, w, l);
        rctx.fillRect(x - w * 0.5, y - l * 0.5, w, l);
      }
    }
    ctx.strokeStyle = "#303842";
    ctx.lineWidth = 3;
    hctx.strokeStyle = "#1c1c1c";
    hctx.lineWidth = 3.5;
    for (let i = 0; i <= 512; i += step) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
      hctx.beginPath(); hctx.moveTo(i, 0); hctx.lineTo(i, 512); hctx.stroke();
      hctx.beginPath(); hctx.moveTo(0, i); hctx.lineTo(512, i); hctx.stroke();
    }
  } else if (style === "apron") {
    // Ribbed cargo bay slate apron with subtle recessed lane markings (Storage, Transit)
    ctx.fillStyle = "#a6b2be";
    ctx.fillRect(0, 0, 512, 512);
    hctx.fillStyle = "#949494";
    hctx.fillRect(0, 0, 512, 512);
    rctx.fillStyle = "#a8a8a8";
    rctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 64) {
      const sh = 160 + ((rand() * 20) | 0);
      ctx.fillStyle = `rgb(${sh},${sh + 6},${sh + 12})`;
      ctx.fillRect(0, y + 2, 512, 60);
      ctx.fillStyle = "#3c4856";
      ctx.fillRect(0, y, 512, 3);
      hctx.fillStyle = "#2a2a2a";
      hctx.fillRect(0, y, 512, 4);
    }
    // Subtle machined expansion ribs + restrained muted-amber bay line
    for (let x = 0; x < 512; x += 128) {
      ctx.fillStyle = "#414e5c";
      ctx.fillRect(x, 0, 3, 512);
      hctx.fillStyle = "#2c2c2c";
      hctx.fillRect(x, 0, 4, 512);
    }
    ctx.fillStyle = "rgba(206,166,94,0.28)";
    ctx.fillRect(0, 250, 512, 12);
    rctx.fillStyle = "#626262";
    rctx.fillRect(0, 250, 512, 12);
  } else {
    // Fractured volcanic basalt slab + crisp machined survey grid (Outer Works, Frontier Gate)
    ctx.fillStyle = "#9ca8b6";
    ctx.fillRect(0, 0, 512, 512);
    hctx.fillStyle = "#8a8a8a";
    hctx.fillRect(0, 0, 512, 512);
    rctx.fillStyle = "#c4c4c4"; // chalkier matte basalt
    rctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 65; i++) {
      const x = rand() * 512;
      const y = rand() * 512;
      const rad = 24 + rand() * 68;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, rand() > 0.45 ? "rgba(210,226,244,0.12)" : "rgba(26,34,46,0.22)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      const rg = rctx.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, rand() > 0.5 ? "rgba(110,110,110,0.45)" : "rgba(235,235,235,0.4)");
      rg.addColorStop(1, "rgba(0,0,0,0)");
      rctx.fillStyle = rg;
      rctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // Fine basalt rock fissures + survey lines
    ctx.strokeStyle = "#364250";
    ctx.lineWidth = 1.6;
    hctx.strokeStyle = "#2e2e2e";
    hctx.lineWidth = 2.2;
    for (let i = 0; i <= 512; i += 128) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
      hctx.beginPath(); hctx.moveTo(i, 0); hctx.lineTo(i, 512); hctx.stroke();
      hctx.beginPath(); hctx.moveTo(0, i); hctx.lineTo(512, i); hctx.stroke();
    }
  }

  // Micro-surface grain on all 5 presets
  for (let i = 0; i < 1200; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const len = style === "basalt" ? 3 : 8 + rand() * 24;
    ctx.fillStyle = rand() > 0.5 ? "rgba(225,240,255,0.045)" : "rgba(10,16,24,0.08)";
    ctx.fillRect(x, y, len, style === "basalt" ? 3 : 1);
  }

  return finalizePbr(a.canvas, h.canvas, r.canvas, { repeatX: 2.5, repeatY: 2.2, normalStrength: 2.6 });
}

/** Upgraded fluted obsidian-basalt cutaway wall PBR with bottom-edge contact AO gradient. */
export function makeCutawayWallPbr() {
  const a = makeCanvas(512, 256);
  const h = makeCanvas(512, 256);
  const r = makeCanvas(512, 256);
  if (!a || !h || !r) return null;
  const ctx = a.ctx2d;
  const hctx = h.ctx2d;
  const rctx = r.ctx2d;

  ctx.fillStyle = "#a2aebc";
  ctx.fillRect(0, 0, 512, 256);
  hctx.fillStyle = "#888888";
  hctx.fillRect(0, 0, 512, 256);
  rctx.fillStyle = "#989898";
  rctx.fillRect(0, 0, 512, 256);

  const rand = mulberry32(8191);
  for (let y = 0; y < 256; y += 64) {
    const sh = 148 + ((rand() * 24) | 0);
    ctx.fillStyle = `rgb(${sh},${sh + 7},${sh + 15})`;
    ctx.fillRect(0, y + 2, 512, 60);
    const rs = 128 + ((rand() * 44) | 0);
    rctx.fillStyle = `rgb(${rs},${rs},${rs})`;
    rctx.fillRect(0, y + 2, 512, 60);
    ctx.fillStyle = "#364250";
    ctx.fillRect(0, y, 512, 3);
    hctx.fillStyle = "#222222";
    hctx.fillRect(0, y, 512, 4);
  }
  for (let x = 0; x <= 512; x += 128) {
    ctx.fillStyle = "#364250";
    ctx.fillRect(x, 0, 3, 256);
    hctx.fillStyle = "#222222";
    hctx.fillRect(x, 0, 4, 256);
  }
  // Vertical machined architectural fluting (smoother metal highlights)
  for (let x = 16; x < 512; x += 32) {
    ctx.fillStyle = "rgba(220,236,252,0.065)";
    ctx.fillRect(x, 8, 3, 240);
    hctx.fillStyle = "rgba(232,232,232,0.34)";
    hctx.fillRect(x, 8, 3, 240);
    rctx.fillStyle = "rgba(72,72,72,0.45)";
    rctx.fillRect(x, 8, 3, 240);
  }
  // Baked vertical wall-base & cornice ambient occlusion gradient
  const ao = ctx.createLinearGradient(0, 0, 0, 256);
  ao.addColorStop(0, "rgba(8,12,18,0.22)");
  ao.addColorStop(0.14, "rgba(0,0,0,0)");
  ao.addColorStop(0.82, "rgba(0,0,0,0)");
  ao.addColorStop(1, "rgba(5,8,14,0.42)");
  ctx.fillStyle = ao;
  ctx.fillRect(0, 0, 512, 256);

  return finalizePbr(a.canvas, h.canvas, r.canvas, { repeatX: 2, repeatY: 1, normalStrength: 2.5 });
}
