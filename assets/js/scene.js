/* The scene: a three-dimensional eclipse behind the home page.
   A real sphere, not a painted disc. Its surface is pushed in and out into
   craters and maria, dusted with a canvas-made albedo, and lit by two warm
   sources — one in front of the upper-right shoulder, one grazing the far limb
   — so the near face carries a gradient, the silhouette never dissolves, and
   the corona taking over outside it reads as depth rather than as a glow drawn
   on top. Stars sit far behind in the same frustum: the pointer sweeps them
   against the moon, and the eye reads the distance between the two.

   three.js is vendored in assets/vendor/three (MIT). The page never depends on
   this file: if WebGL is missing, refused, or fails to paint, the CSS still
   eclipse stays on screen instead. */
import * as THREE from "../vendor/three/three.module.min.js";

(function () {
  "use strict";

  var host = document.querySelector(".scene");
  if (!host) return;

  var stillEl = host.querySelector(".still-eclipse");

  var root = document.documentElement;
  var hoverQuery = window.matchMedia("(hover: hover)");

  function motionOff() {
    return root.getAttribute("data-motion") === "off";
  }

  function clamp(value, lo, hi) {
    return value < lo ? lo : value > hi ? hi : value;
  }

  /* GLSL's smoothstep, so this file and probe-fit.mjs can be read the same
     way: the layout numbers below are the contract between them. */
  function smoothstep(x, lo, hi) {
    var t = clamp((x - lo) / (hi - lo), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function mix(a, b, t) {
    return a + (b - a) * t;
  }

  /* ---------- renderer ---------- */

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
  } catch (err) {
    return; // no WebGL: the still eclipse stays
  }

  var canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.insertBefore(canvas, host.firstChild);
  renderer.setClearColor(0x000000, 0);
  // Filmic, like a photograph of a very bright thing: the corona rolls off
  // instead of clipping, and the moon's dark side keeps its detail.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  /* ---------- palette from the CSS tokens ---------- */

  function token(name, fallback) {
    var value = getComputedStyle(root).getPropertyValue(name).trim();
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback;
  }

  function srgb(hex, target) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return target.set(
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255
    );
  }

  var glowColor = new THREE.Vector3(0.847, 0.647, 0.475);
  var coreColor = new THREE.Vector3(0.929, 0.902, 0.851);
  var light = false;

  /* ---------- the frame ---------- */

  var FOV = 38;
  var MOON_R = 1;
  /* The plane the corona is painted on, in moon radii. Wide enough that the
     glow has decayed to nothing long before the plane's own edge could show. */
  var CORONA_K = 20;
  var CORONA_Z = -0.004;

  /* Where the moon sits: its diameter as a share of the viewport height, and
     its centre as a share of the viewport. Wide screens have the right column
     to themselves; narrow ones get the gap beside the headline, clear of the
     eyebrow above it and the lede below. Mirrored in probe-fit.mjs. */
  var WIDE = { size: 0.30, x: 0.775, y: 0.44 };
  var NARROW = { size: 0.165, x: 0.875, y: 0.225 };

  var view = { w: 1, h: 1, dpr: 1 };
  var fit = { size: WIDE.size, x: WIDE.x, y: WIDE.y, dist: 10, world: { w: 6, h: 6 } };
  var halfTan = Math.tan((FOV * Math.PI) / 360);
  var drift = { x: 0, y: 0 };

  var camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 300);
  // No lookAt: the camera stays square to the world and the moon is placed by
  // offsetting it the other way. A sphere projects to a circle from anywhere,
  // so the anchor is exact at every aspect.
  camera.rotation.set(0, 0, 0);

  var scene = new THREE.Scene();

  /* ---------- the moon ---------- */

  // Low-discrepancy directions, so the pattern never lines up into rows, with
  // every seventh basin wide enough to read as maria.
  function craterField(count) {
    var craters = [];
    for (var i = 0; i < count; i++) {
      var y = 1 - (2 * i + 1) / count;
      var ring = Math.sqrt(Math.max(0, 1 - y * y));
      var angle = i * 2.39996323; // the golden angle
      var wide = i % 7 === 0;
      craters.push({
        dir: new THREE.Vector3(Math.cos(angle) * ring, y, Math.sin(angle) * ring),
        width: wide ? 0.46 : 0.06 + (i % 5) * 0.030,
        depth: wide ? 0.024 : 0.012 + (i % 3) * 0.008,
        rim: wide ? 0.05 : 0.42
      });
    }
    return craters;
  }

  function moonGeometry(craters, w, h) {
    var geometry = new THREE.SphereGeometry(MOON_R, w, h);
    var position = geometry.attributes.position;
    var point = new THREE.Vector3();
    for (var i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i).normalize();
      var height = 0;
      for (var j = 0; j < craters.length; j++) {
        var crater = craters[j];
        var d = point.distanceTo(crater.dir);
        // A bowl, and the raised lip around it.
        var bowl = d / crater.width;
        var lip = (d - crater.width) / (crater.width * 0.5);
        height -= crater.depth * Math.exp(-bowl * bowl * bowl);
        height += crater.depth * crater.rim * Math.exp(-lip * lip);
      }
      var radius = MOON_R + height;
      position.setXYZ(i, point.x * radius, point.y * radius, point.z * radius);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  /* ---------- the moon's markings ---------- */

  // A value-noise lattice, periodic in u, so the sphere's UV seam never shows.
  function lattice(n, seed) {
    var grid = new Float32Array(n * n);
    for (var i = 0; i < grid.length; i++) {
      var h = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
      grid[i] = h - Math.floor(h);
    }
    return grid;
  }

  function sample(n, grid, x, y) {
    var fx = x * n;
    var fy = y * n;
    var x0 = Math.floor(fx);
    var y0 = Math.floor(fy);
    var tx = fx - x0;
    var ty = fy - y0;
    var x1 = (((x0 + 1) % n) + n) % n;
    var xa = ((x0 % n) + n) % n;
    var ya = clamp(y0, 0, n - 1);
    var yb = clamp(y0 + 1, 0, n - 1);
    tx = tx * tx * (3 - 2 * tx);
    ty = ty * ty * (3 - 2 * ty);
    var top = mix(grid[ya * n + xa], grid[ya * n + x1], tx);
    var bottom = mix(grid[yb * n + xa], grid[yb * n + x1], tx);
    return mix(top, bottom, ty);
  }

  function surfaceTexture(size) {
    var surface = document.createElement("canvas");
    surface.width = surface.height = size;
    var ctx = surface.getContext("2d");
    if (!ctx) return null;

    var octaves = [3, 6, 12, 24, 48];
    var grids = octaves.map(function (n) { return lattice(n, n * 7 + 1); });
    var image = ctx.createImageData(size, size);

    for (var y = 0; y < size; y++) {
      var v = y / size;
      for (var x = 0; x < size; x++) {
        var u = x / size;
        var noise = 0;
        var weight = 0;
        var amplitude = 1;
        for (var o = 0; o < octaves.length; o++) {
          noise += amplitude * sample(octaves[o], grids[o], u, v);
          weight += amplitude;
          amplitude *= 0.55;
        }
        noise /= weight;
        // The darkest part of the widest octave, softened into maria.
        var maria = smoothstep(sample(octaves[0], grids[0], u, v), 0.42, 0.66);
        var value = (0.80 + noise * 0.50) * mix(1, 0.50, maria);
        var i = (y * size + x) * 4;
        image.data[i] = clamp(value * 0.36, 0, 1) * 255;
        image.data[i + 1] = clamp(value * 0.31, 0, 1) * 255;
        image.data[i + 2] = clamp(value * 0.25, 0, 1) * 255;
        image.data[i + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);

    var texture = new THREE.CanvasTexture(surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  var narrow = view.w < 760;
  var craterCount = 26;
  var craters = craterField(craterCount);
  var moonTexture = surfaceTexture(narrow ? 320 : 512);
  var moonMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.93,
    metalness: 0.0,
    // Earthshine, in effect: the markings hold their shape on the dark face
    // without a front light ever lifting the disc out of the paper.
    emissive: new THREE.Color(0x2a241d),
    emissiveIntensity: 0.55
  });
  if (moonTexture) {
    moonMaterial.map = moonTexture;
    moonMaterial.emissiveMap = moonTexture;
  }

  var moonMesh = new THREE.Mesh(
    moonGeometry(craters, narrow ? 80 : 128, narrow ? 56 : 84),
    moonMaterial
  );
  var moon = new THREE.Group();
  moon.add(moonMesh);
  moon.rotation.y = 0.4;
  scene.add(moon);

  /* ---------- the light ---------- */

  // The warm source sits in front of the moon and off to the upper right, so
  // the near face carries a gradient — bright at the shoulder, falling away
  // across the maria — instead of being a disc with a painted edge. The albedo
  // is dark enough that this never becomes a lit ball.
  var key = new THREE.DirectionalLight(0xffd0a4, 0.95);
  key.position.set(5.5, 4.2, 2.8);
  scene.add(key);

  // A second graze from the far shoulder, behind the terminator: the left limb
  // keeps an edge without the face being lit from both sides.
  var rim = new THREE.DirectionalLight(0xd8b895, 0.55);
  rim.position.set(-6.0, 1.5, -3.5);
  scene.add(rim);

  var ambient = new THREE.AmbientLight(0x2c2620, 0.34);
  scene.add(ambient);

  /* ---------- the corona ---------- */

  var coronaMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uRim: { value: MOON_R / CORONA_K },
      uGlow: { value: 1 },
      uDay: { value: 0 },
      uTime: { value: 0 },
      uWarm: { value: glowColor },
      uCore: { value: coreColor }
    },
    vertexShader: [
      "varying vec2 vUv;",
      "void main() {",
      "  vUv = uv;",
      "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
      "}"
    ].join("\n"),
    // Written in moon radii out from the limb, so the ring lands on the
    // silhouette at any camera distance.
    fragmentShader: [
      "precision highp float;",
      "varying vec2 vUv;",
      "uniform float uRim;",
      "uniform float uGlow;",
      "uniform float uDay;",
      "uniform float uTime;",
      "uniform vec3 uWarm;",
      "uniform vec3 uCore;",
      "",
      "void main() {",
      "  vec2 p = (vUv - 0.5) * 2.0;",
      "  float r = length(p);",
      "  float angle = atan(p.y, p.x);",
      "",
      "  // Distance outward from the limb, in moon radii.",
      "  float d = r / uRim - 1.0;",
      "  float out_ = max(d, 0.0);",
      "",
      "  // The corona is not even: long streamers, and a brighter quarter where",
      "  // the light is winning. It turns, slowly, because a still corona looks",
      "  // printed.",
      "  float streamer = 0.78 + 0.22 * sin(angle * 7.0 + sin(angle * 2.7) * 1.3 + uTime * 0.05);",
      "  float quarter = 0.84 + 0.36 * max(0.0, dot(normalize(p + 1e-5), vec2(0.60, 0.80)));",
      "",
      "  float ring = exp(-out_ * 20.0) * 1.25;",
      "  float halo = exp(-out_ * 1.05) * 0.26;",
      "  float veil = exp(-out_ * 0.50) * 0.14;",
      "  // Paper does not want a copper veil: by day the wide falloff is damped",
      "  // hard, while the ring — the eclipse itself — stays.",
      "  float strength = (ring + (halo * mix(1.0, 0.5, uDay) + veil * mix(1.0, 0.3, uDay)) * streamer) * quarter;",
      "",
      "  // Nothing inside the limb: the moon owns those pixels, and a plane",
      "  // fighting the sphere at the silhouette only ever looks like an artefact.",
      "  strength *= smoothstep(-0.02, 0.012, d);",
      "  strength *= 1.0 - smoothstep(0.75, 0.98, r);",
      "",
      "  float alpha = clamp(strength * uGlow, 0.0, 0.95);",
      "  // The hottest part of the ring is chalk at night and copper ink on",
      "  // paper: one token, read as light in one theme and as pigment in the",
      "  // other.",
      "  vec3 colour = mix(uWarm, uCore, clamp(ring * 0.92, 0.0, 0.96));",
      "  colour = mix(colour, uWarm, uDay * 0.55);",
      "  gl_FragColor = vec4(colour * alpha, alpha);",
      "}"
    ].join("\n")
  });

  var corona = new THREE.Mesh(
    new THREE.PlaneGeometry(2 * CORONA_K, 2 * CORONA_K),
    coronaMaterial
  );
  corona.position.z = CORONA_Z;
  scene.add(corona);

  /* ---------- stars ---------- */

  function starSprite() {
    var size = 32;
    var sprite = document.createElement("canvas");
    sprite.width = sprite.height = size;
    var ctx = sprite.getContext("2d");
    if (!ctx) return null;
    var gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.22, "rgba(255,255,255,0.86)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0.22)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    var texture = new THREE.CanvasTexture(sprite);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  var STAR_Z = 62;

  function starField(count, spread) {
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var tint = new THREE.Color();
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var radius = Math.sqrt(Math.random()) * spread;
      positions[i * 3] = Math.cos(a) * radius * 1.7;
      positions[i * 3 + 1] = Math.sin(a) * radius;
      positions[i * 3 + 2] = -STAR_Z - Math.random() * 8;
      // Mostly warm, a few cold, like the field the glow belongs to.
      tint.setHSL(Math.random() < 0.8 ? 0.09 : 0.58, 0.10 + Math.random() * 0.25, 0.6 + Math.random() * 0.34);
      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }

  var starMaterial = new THREE.PointsMaterial({
    map: starSprite(),
    size: 2.4,
    // Device pixels, so a star is a star at every viewport and pixel ratio.
    sizeAttenuation: false,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    opacity: 0.9
  });

  var starCount = view.w < 760 ? 420 : 1100;
  var stars = new THREE.Points(starField(starCount, 26), starMaterial);
  scene.add(stars);

  /* ---------- layout ---------- */

  function layout(w, h) {
    var aspect = w / h;
    var portrait = 1 - smoothstep(aspect, 0.70, 1.05);
    fit.size = mix(WIDE.size, NARROW.size, portrait);
    fit.x = mix(WIDE.x, NARROW.x, portrait);
    fit.y = mix(WIDE.y, NARROW.y, portrait);

    // Far enough back that the sphere spans the share of the frame we want.
    fit.dist = MOON_R / (halfTan * fit.size);
    var world = 2 * halfTan * fit.dist;
    fit.world.h = world;
    fit.world.w = world * aspect;

    camera.aspect = aspect;
    camera.near = Math.max(0.05, fit.dist - MOON_R * 2);
    camera.far = fit.dist + STAR_Z + 40;
    camera.updateProjectionMatrix();

    // The limb, in plane-uv units. The sphere's silhouette is set by the
    // tangent from the camera, not by the radius itself.
    fit.rim = (MOON_R * fit.dist / Math.sqrt(fit.dist * fit.dist - MOON_R * MOON_R)) * (1 / (CORONA_K * MOON_R));
  }

  /* ---------- scroll and theme ---------- */

  var progress = 0;
  var moonScale = 1;

  function apply() {
    // The ring softens and the moon draws back a hair as the page is read, so
    // the chapters below are never lit by a bright thing behind the words. By
    // day the wide haze is damped inside the shader instead — see uDay.
    var depart = smoothstep(progress, 0.40, 0.92);
    moonScale = mix(1, 0.92, depart);

    moon.scale.setScalar(moonScale);
    coronaMaterial.uniforms.uRim.value = fit.rim * moonScale;
    coronaMaterial.uniforms.uGlow.value = mix(1, 0.42, depart);

    var w = fit.world.w;
    var h = fit.world.h;
    var ax = fit.x + drift.x;
    var ay = fit.y + drift.y;
    camera.position.set(-(ax - 0.5) * w, (ay - 0.5) * h, fit.dist);
  }

  function applyTheme() {
    light = root.getAttribute("data-theme") === "light";
    srgb(token("--scene-glow", light ? "#8a5426" : "#d8a579"), glowColor);
    srgb(token("--scene-core", light ? "#6b3c1a" : "#ede6d9"), coreColor);
    coronaMaterial.uniforms.uDay.value = light ? 1 : 0;

    // Paper gets a flatter, darker moon: the same body lifted by a warm
    // key light reads as a brown stain on cream, so by day the light steps
    // back and the ring does the work.
    key.intensity = light ? 0.5 : 0.95;
    rim.intensity = light ? 0.45 : 0.55;
    moonMaterial.emissiveIntensity = light ? 0.3 : 0.42;

    // Stars are a night thing. On paper they would be grit.
    stars.visible = !light;
  }

  /* ---------- painting ---------- */

  var time = 0;
  var pointer = new THREE.Vector2(0, 0);
  var pointerTarget = new THREE.Vector2(0, 0);

  function paint() {
    renderer.render(scene, camera);
  }

  function still() {
    time = 0;
    pointer.set(0, 0);
    drift.x = 0;
    drift.y = 0;
    moon.rotation.y = 0.4;
    stars.rotation.set(0, 0, 0);
    coronaMaterial.uniforms.uTime.value = 0;
    apply();
    paint();
  }

  /* ---------- loop ---------- */

  var frameId = 0;
  var running = false;
  var lastFrame = 0;

  function tick(now) {
    frameId = requestAnimationFrame(tick);
    if (!lastFrame) lastFrame = now;
    var dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;
    time += dt;

    pointer.lerp(pointerTarget, 1 - Math.pow(0.0025, dt));
    // The field answers the pointer; the moon keeps its mark on the page.
    stars.rotation.y = pointer.x * 0.04;
    stars.rotation.x = -pointer.y * 0.03;
    moon.rotation.y = 0.4 + time * 0.006;
    // A slow breath, small enough that the layout never has to move for it.
    drift.x = Math.sin(time * 0.17) * 0.006;
    drift.y = Math.cos(time * 0.13) * 0.004;

    coronaMaterial.uniforms.uTime.value = time;

    apply();
    paint();
  }

  function start() {
    if (running) return;
    running = true;
    lastFrame = 0; // drop the paused interval
    frameId = requestAnimationFrame(tick);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(frameId);
  }

  function sync() {
    if (motionOff() || document.hidden) {
      stop();
      if (motionOff() && !document.hidden) still();
    } else {
      start();
    }
  }

  /* ---------- events ---------- */

  document.addEventListener("journey", function (event) {
    progress = event.detail.progress;
    apply();
    if (!running) paint();
  });

  document.addEventListener("themechange", function () {
    applyTheme();
    apply();
    // Paint rather than wait for the next tick: a paused or throttled loop
    // would otherwise leave the canvas in the previous palette.
    paint();
  });

  document.addEventListener("motionchange", sync);
  document.addEventListener("visibilitychange", sync);

  canvas.addEventListener("webglcontextlost", function (event) {
    event.preventDefault();
    stop();
    host.classList.remove("is-ready");
    if (stillEl) stillEl.style.display = "";
    canvas.remove();
  });

  var resizePending = false;
  function size() {
    var w = host.clientWidth || window.innerWidth;
    var h = host.clientHeight || window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, w < 760 ? 1.5 : 1.75);
    view.w = w;
    view.h = h;
    view.dpr = dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    starMaterial.size = 2.4 * dpr;
    layout(w, h);
    apply();
  }

  window.addEventListener("resize", function () {
    if (resizePending) return;
    resizePending = true;
    requestAnimationFrame(function () {
      size();
      if (!running) paint();
      resizePending = false;
    });
  }, { passive: true });

  if (hoverQuery.matches) {
    window.addEventListener("pointermove", function (event) {
      pointerTarget.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1)
      );
    }, { passive: true });
  }

  /* ---------- boot: paint, then prove it painted ---------- */

  applyTheme();
  size();

  try {
    paint();

    // The moon's own pixels, at the anchor the layout just handed us. An
    // opaque disc there means the sphere, the light and the tone mapping all
    // came out the far side.
    var gl = renderer.getContext();
    var box = 8;
    var pixels = new Uint8Array(box * box * 4);
    gl.readPixels(
      Math.max(0, Math.round(fit.x * view.w * view.dpr) - box / 2),
      Math.max(0, Math.round((1 - fit.y) * view.h * view.dpr) - box / 2),
      box, box, gl.RGBA, gl.UNSIGNED_BYTE, pixels
    );

    var painted = false;
    for (var i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 200) { painted = true; break; }
    }
    if (!painted) {
      canvas.remove();
      return; // nothing solid: leave the still eclipse up
    }
  } catch (err) {
    canvas.remove();
    return;
  }

  host.classList.add("is-ready");

  // The fade out is a CSS transition, and a background or throttled tab may
  // never advance one; the stand-in must not linger over a live scene. Either
  // signal is enough: the transition's own end, or the clock. If neither runs,
  // the still stays up — which is the right way round, since the still is also
  // what a visitor without WebGL sees.
  var drop = function () { if (stillEl) stillEl.style.display = "none"; };
  canvas.addEventListener("transitionend", function (e) {
    if (e.propertyName === "opacity") drop();
  });
  window.setTimeout(drop, 1100);

  if (motionOff() || document.hidden) {
    still();
  } else {
    start();
  }
})();
