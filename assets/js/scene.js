/* The scene: an eclipse seen down a telescope.
   A displaced sphere with three brass instruments around it, a warm corona on
   the limb and a field of stars in front.
   The composition is a study of the reference we were pointed at: the same
   palette moves, the same instrument motif — but every number below was set
   here, and the light/dark reading is ours. (See DESIGN.md, Texture.)

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
  renderer.toneMappingExposure = 1;

  /* ---------- palette from the CSS tokens ---------- */

  function token(name, fallback) {
    var value = getComputedStyle(root).getPropertyValue(name).trim();
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback;
  }

  function srgb(hex) {
    var h = hex.replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return new THREE.Color(
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255
    );
  }

  var glowColour = new THREE.Color(1, 0.75, 0.5);
  var coreColour = new THREE.Color(1, 0.94, 0.8);
  var fogColour = new THREE.Color(0.031, 0.051, 0.086);
  var light = false;

  /* ---------- the frame ---------- */

  var FOV = 39;
  var MOON_R = 2.22;
  /* The plane the corona is painted on, in moon radii: twelve world units,
     the size the reference uses. The ring lands on the silhouette because the
     plane is fixed and the rim is measured, not guessed. */
  var CORONA_K = 6 / MOON_R;
  var CORONA_Z = -0.1;
  var MOON_Z = 0.18;

  /* Where the moon sits: its diameter as a share of the viewport height, and
     its centre as a share of the viewport. Wide screens get the whole
     instrument stack; narrow ones get the moon alone, in the gap beside the
     headline, clear of the eyebrow above it and the lede below.
     Mirrored in probe-fit.mjs and in .still-eclipse. */
  var WIDE = { size: 0.45, x: 0.775, y: 0.455 };
  var NARROW = { size: 0.165, x: 0.9, y: 0.235 };

  var view = { w: 1, h: 1, dpr: 1 };
  var fit = { size: WIDE.size, x: WIDE.x, y: WIDE.y, dist: 15, rim: 0.37, world: { w: 6, h: 6 } };
  var halfTan = Math.tan((FOV * Math.PI) / 360);
  var drift = { x: 0, y: 0 };

  var camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 180);
  // No lookAt: the camera stays square to the world and the moon is placed by
  // offsetting it the other way. A sphere projects to a circle from anywhere,
  // so the anchor is exact at every aspect.
  camera.rotation.set(0, 0, 0);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(fogColour, 0.006);

  /* ---------- environment ---------- */

  /* A studio, built in memory: a dark room with six lit panels — warm above and
     to the left, cool to the right, faint behind and in front. Pre-filtered, it
     becomes the environment map: what picks the moon's body up off the floor and
     puts a sheen on the brass. No image to fetch, nothing to load. */
  function studio() {
    var room = new THREE.Scene();
    room.add(new THREE.Mesh(
      new THREE.BoxGeometry(12, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x05070b, side: THREE.BackSide })
    ));

    function panel(width, height, x, y, z, rx, ry, colour, power) {
      var lamp = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshStandardMaterial({ color: 0x000000, emissive: colour, emissiveIntensity: power })
      );
      lamp.position.set(x, y, z);
      lamp.rotation.set(rx, ry, 0);
      room.add(lamp);
    }

    panel(8, 8, 0, 5.9, 0, Math.PI / 2, 0, 0xfff4e6, 8.6);      // overhead
    panel(5, 6, -5.9, 0.6, 1, 0, Math.PI / 2, 0xffe8d2, 6.3);    // the warm wall
    panel(4, 5, 5.9, -0.4, 1, 0, -Math.PI / 2, 0xd2e2ff, 5.5);    // the cold one
    panel(8, 8, 0, -5.9, 0, -Math.PI / 2, 0, 0x9aa2ad, 7);      // the floor
    panel(7, 7, 0, 0, -5.9, 0, 0, 0xb9c2cd, 5.5);                 // behind
    panel(7, 7, 0, 0, 5.9, 0, Math.PI, 0xd6cfc4, 7);            // in front
    return room;
  }

  try {
    var pmrem = new THREE.PMREMGenerator(renderer);
    var room = studio();
    scene.environment = pmrem.fromScene(room, 0.02).texture;
    scene.environmentIntensity = 0.65;
    pmrem.dispose();

    // The room was scaffolding: it only ever existed to be photographed.
    room.traverse(function (node) {
      if (node.geometry) node.geometry.dispose();
      if (node.material) node.material.dispose();
    });
  } catch (err) {
    // Older three builds without PMREM still render; they just lose the sheen.
  }

  /* ---------- the light ---------- */

  var hemi = new THREE.HemisphereLight(0x8aa5ca, 0x090908, 0.35);
  scene.add(hemi);

  // Warm and in front, off the upper right: the near face picks up a gradient.
  var key = new THREE.DirectionalLight(0xf4b77c, 3);
  key.position.set(7, 4, 8);
  scene.add(key);

  // Cool and from the far left, behind the terminator: the left limb keeps an
  // edge without the face being lit from both sides.
  var fill = new THREE.DirectionalLight(0x8eaac8, 1.6);
  fill.position.set(-8, 3, -2);
  scene.add(fill);

  // A lamp inside the sphere: the moon's own surface can never see it, so it
  // only catches the instruments, and it falls off hard across the rings.
  var lamp = new THREE.PointLight(0xf6b77b, 42, 24, 2);
  lamp.position.set(0, 0, 2);
  scene.add(lamp);

  /* ---------- materials ---------- */

  function metal(colour, metalness, roughness) {
    return new THREE.MeshStandardMaterial({
      color: colour,
      metalness: metalness,
      roughness: roughness,
      envMapIntensity: 0.12,
      // The instruments step back while the page is read; the opacity is
      // driven by the stage, and depth is written only while they are solid.
      transparent: true
    });
  }

  var bronze = metal(0x8a6039, 0.82, 0.5);
  var graphite = metal(0x20252c, 0.82, 0.35);
  var steel = metal(0x807e77, 0.82, 0.46);

  var moonMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0c10,
    roughness: 0.98,
    metalness: 0.08
  });

  /* ---------- the moon ---------- */

  // Twenty-three basins on a low-discrepancy spread; a bowl, and the raised
  // lip that catches the light. Sub-percent of the radius, so the silhouette
  // stays round and the relief only shows where the limb turns away.
  function craters() {
    var list = [];
    for (var i = 0; i < 23; i++) {
      var dir = new THREE.Vector3(
        Math.sin(27.3 * i),
        Math.cos(9.2 * i),
        Math.sin(15.7 * i)
      ).normalize();
      list.push({ dir: dir, width: 0.045 + (i % 5) * 0.021 });
    }
    return list;
  }

  function moonGeometry(list, widthSegments, heightSegments) {
    var geometry = new THREE.SphereGeometry(MOON_R, widthSegments, heightSegments);
    var position = geometry.attributes.position;
    var point = new THREE.Vector3();
    for (var i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i).normalize();
      var height = 0;
      for (var j = 0; j < list.length; j++) {
        var crater = list[j];
        var d = point.distanceTo(crater.dir);
        // A bowl, and the raised lip around it.
        var bowl = d / crater.width;
        var lip = (d - crater.width) / (crater.width * 0.22);
        height -= 0.018 * Math.exp(-bowl * bowl * bowl * bowl);
        height += 0.004 * Math.exp(-lip * lip);
      }
      point.multiplyScalar(MOON_R + height);
      position.setXYZ(i, point.x, point.y, point.z);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  var moonShape = craters();
  var moonMesh = new THREE.Mesh(moonGeometry(moonShape, 112, 72), moonMaterial);
  moonMesh.position.z = MOON_Z;
  var instruments = new THREE.Group();
  instruments.add(moonMesh);
  scene.add(instruments);

  /* ---------- the corona ---------- */

  var coronaMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uRim: { value: 0.37 },
      uGlow: { value: 1 },
      uSpread: { value: 1 },
      uDay: { value: 0 },
      uTime: { value: 0 },
      uWarm: { value: glowColour },
      uCore: { value: coreColour }
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
      "uniform float uSpread;",
      "uniform float uDay;",
      "uniform float uTime;",
      "uniform vec3 uWarm;",
      "uniform vec3 uCore;",
      "",
      "void main() {",
      "  vec2 p = (vUv - 0.5) * 2.0;",
      "  float r = length(p);",
      "  float a = atan(p.y, p.x);",
      "  float rim = uRim;",
      "",
      "  // Long streamers at thirty-seven spokes, breathing slowly; a hot hairline",
      "  // on the limb; a wide floor; and the diamond ring where the light wins.",
      "  float rays = pow(0.5 + 0.5 * sin(a * 37.0 + sin(a * 13.0) * 1.3 + uTime * 0.07), 4.0);",
      "  float halo = exp(-max(r - rim, 0.0) * 10.0) * (0.3 + rays * 0.16) * uSpread;",
      "  // The hairline widens on paper: behind the sphere only what falls outside",
      "  // the silhouette shows, and a one-pixel sliver will not read as a rim.",
      "  float fine = exp(-abs(r - rim) * mix(170.0, 90.0, uDay));",
      "  float outer = exp(-max(r - rim, 0.0) * 5.0) * 0.05 * uSpread;",
      "  float cutoff = smoothstep(rim - 0.014, rim + 0.008, r);",
      "  float diamond = exp(-pow((a + 0.46) * 13.0, 2.0)) * exp(-abs(r - rim) * 40.0) * 0.22;",
      // By day the glow steps back and the hairline on the limb does the work:
      // paper cannot hold an additive halo, and a painted one reads as a smudge.
      "  float strength = (halo * mix(1.0, 0.05, uDay) + fine * mix(0.16, 0.95, uDay) + outer * mix(1.0, 0.03, uDay) + diamond * mix(1.0, 0.18, uDay)) * cutoff;",
      "",
      "  strength *= 1.0 - smoothstep(0.75, 1.0, r);",
      "  strength *= uGlow;",
      "  float alpha = clamp(strength, 0.0, 0.95);",
      "  vec3 colour = mix(uWarm, uCore, fine * 0.3);",
      "  // Night adds light to the field; paper gets paint, premultiplied, because",
      "  // an additive ring on cream is neither predictable nor legible.",
      "  if (uDay > 0.5) {",
      "    gl_FragColor = vec4(colour * alpha, alpha);",
      "  } else {",
      "    gl_FragColor = vec4(colour, alpha);",
      "  }",
      "}"
    ].join("\n")
  });

  var corona = new THREE.Mesh(
    new THREE.PlaneGeometry(2 * CORONA_K * MOON_R, 2 * CORONA_K * MOON_R),
    coronaMaterial
  );
  corona.position.z = CORONA_Z;
  instruments.add(corona);

  /* ---------- the instruments ---------- */

  var tickGeometry = new THREE.BoxGeometry(0.009, 0.05, 0.009);
  var ringGeometry = new THREE.TorusGeometry(2.72, 0.04, 18, 192);
  var hairGeometry = new THREE.TorusGeometry(2.82, 0.011, 10, 160);
  var pivot = new THREE.Object3D();

  function tickRing(material, radius, count, every) {
    var mesh = new THREE.InstancedMesh(tickGeometry, material, count);
    for (var i = 0; i < count; i++) {
      var t = (i / count) * Math.PI * 2;
      pivot.position.set(radius * Math.cos(t), radius * Math.sin(t), 0);
      pivot.rotation.set(0, 0, t - Math.PI / 2);
      pivot.scale.set(1, i % every ? 0.65 : 1.6, 1);
      pivot.updateMatrix();
      mesh.setMatrixAt(i, pivot.matrix);
    }
    return mesh;
  }

  var ringGroups = [];
  for (var r = 0; r < 3; r++) {
    var group = new THREE.Group();
    var ring = new THREE.Mesh(ringGeometry, r === 1 ? steel : bronze);
    group.add(ring);
    group.add(new THREE.Mesh(hairGeometry, graphite));
    group.add(tickRing(steel, 2.81, 80, 5));
    group.position.z = (r - 1) * 0.16;
    group.rotation.set(0.7 + 0.38 * r, 0.22 + 0.28 * r, 0);
    instruments.add(group);
    ringGroups.push(group);
  }

  // Three booms across the stack, and a pearl where each one lands.
  var boomGeometry = new THREE.CylinderGeometry(0.013, 0.013, 1, 14);
  var pearlGeometry = new THREE.SphereGeometry(0.062, 16, 10);
  var booms = [];
  var from = new THREE.Vector3();
  var to = new THREE.Vector3();
  var along = new THREE.Vector3();
  var up = new THREE.Vector3(0, 1, 0);
  for (var m = 0; m < 3; m++) {
    var angle = (m * Math.PI * 2) / 3;
    var boom = new THREE.Mesh(boomGeometry, bronze);
    instruments.add(boom);
    booms.push({ mesh: boom, angle: angle });

    ringGroups.forEach(function (ringGroup) {
      var pearl = new THREE.Mesh(pearlGeometry, steel);
      pearl.position.set(2.72 * Math.cos(angle), 2.72 * Math.sin(angle), 0);
      ringGroup.add(pearl);
    });
  }

  /* ---------- stars ---------- */

  function starSprite() {
    var size = 32;
    var sprite = document.createElement("canvas");
    sprite.width = sprite.height = size;
    var ctx = sprite.getContext("2d");
    if (!ctx) return null;
    var gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.2, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.25)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    var texture = new THREE.CanvasTexture(sprite);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // A spiral tube threaded through the camera's path: dense at the eye, sparse
  // at the far end, so the pointer sweeps a field with real depth in it.
  function starField(count) {
    var positions = new Float32Array(count * 3);
    var colours = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var angle = 2.39996 * i;
      var radius = 5 + 38 * Math.sqrt(((73 * i) % 997) / 997);
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = 14 - ((137 * i) % 1200) / 10;
      var warm = i % 7 === 0;
      colours[i * 3] = warm ? 0.9 : 0.65;
      colours[i * 3 + 1] = warm ? 0.59 : 0.75;
      colours[i * 3 + 2] = warm ? 0.35 : 0.9;
    }
    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
    return geometry;
  }

  var starMaterial = new THREE.PointsMaterial({
    map: starSprite(),
    size: 0.065,
    alphaTest: 0.005,
    vertexColors: true,
    transparent: true,
    opacity: 0.82,
    sizeAttenuation: true,
    depthWrite: false
  });

  var stars = new THREE.Points(starField(2350), starMaterial);
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

    // The limb, in plane-uv units. The sphere's silhouette is set by the
    // tangent from the camera, not by the radius itself.
    fit.rim = (MOON_R * fit.dist / Math.sqrt(fit.dist * fit.dist - MOON_R * MOON_R)) / (CORONA_K * MOON_R);

    camera.aspect = aspect;
    camera.near = Math.max(0.05, fit.dist - MOON_R * 2);
    camera.far = fit.dist + 140;
    camera.updateProjectionMatrix();

    // The instruments belong to the wide composition. In the narrow one the moon
    // is a corner mark and the rings would be cropped by the frame and cross the
    // headline — so they go, rather than shrink into noise.
    var room = portrait < 0.5;
    ringGroups.forEach(function (group) { group.visible = room; });
    booms.forEach(function (boom) { boom.mesh.visible = room; });

    // Small screens put type where the halo would spread. Keep the rim, pull the
    // halo in: at that size the wide glow is a bright field behind the headline.
    coronaMaterial.uniforms.uSpread.value = mix(1, 0.4, portrait);
    stars.visible = !light;

    renderer.setPixelRatio(view.dpr);
  }

  /* ---------- the acts ---------- */

  /* The page hands over one stage value: 0 while the opening holds, 1 once the
     work chapter reaches the focus line, 2 for about, 3 for contact. Every move
     below is a smoothstep window on it, so the shot is never caught between two
     keyframes: the scroll is the only clock, and scrolling back retraces the
     same shapes. The windows are the reference's grammar (unfold, release,
     alignment), spaced to our chapters. */
  var stageValue = 0;
  var stageTarget = 0;

  function acts(t) {
    return {
      // Opening -> work: the stack opens into rings seen square on, the body
      // lets go of its light, and the whole instrument steps back into the
      // page's right margin. The opening frame holds through the first third
      // of the crossing, then the move finishes as the work chapter arrives.
      unfold: smoothstep(t, 0.28, 0.95),
      release: smoothstep(t, 0.40, 1.00),
      // The instrument steps back before it is under the reading copy, not after.
      dim: smoothstep(t, 0.30, 0.70),
      // Work -> about: the rings turn edge-on, a lens held at the page's edge.
      edgeOn: smoothstep(t, 1.45, 1.95),
      // About -> contact: the stack turns back into the opening frame, and the
      // body returns only once its chapter owns the screen. The corona waits
      // for the silhouette, so totality arrives as a ring, not a flash.
      restore: smoothstep(t, 2.70, 2.95),
      back: smoothstep(t, 2.80, 3.00),
      glow: smoothstep(t, 2.86, 3.00)
    };
  }

  function fadeInstruments(opacity) {
    var materials = [bronze, graphite, steel];
    for (var i = 0; i < materials.length; i++) {
      materials[i].opacity = opacity;
      // A half-faded ring that still writes depth cuts the ones behind it: the
      // instrument would read as broken rather than faint.
      materials[i].depthWrite = opacity > 0.995;
    }
  }

  function apply() {
    var a = acts(stageValue);

    // The body is what leaves; the instrument is what stays. Scaling the moon
    // rather than the group keeps the rings at their measured size while the
    // disc goes, and keeps the corona's rim tied to the silhouette.
    var moonScale = mix(mix(1, 0.001, a.release), 1, a.back);
    var instrumentScale = mix(mix(1, 0.64, a.unfold), 0.58, a.edgeOn);
    instrumentScale = mix(instrumentScale, 1, a.restore);

    instruments.scale.setScalar(instrumentScale);
    moonMesh.scale.setScalar(moonScale);
    moonMesh.visible = moonScale > 0.004;
    corona.visible = moonMesh.visible;

    // In plane-uv units the silhouette follows the body, because the plane and
    // the sphere scale together with the group.
    coronaMaterial.uniforms.uRim.value = fit.rim * moonScale;
    // No halo without a body; and at the end it arrives only once the rim is
    // back at full size, so totality is a ring, not a flash.
    coronaMaterial.uniforms.uGlow.value = mix(1 - a.release, 1, a.glow);

    var shade = mix(1, 0.42, a.dim);
    shade = mix(shade, 0.5, a.edgeOn);
    fadeInstruments(mix(shade, 1, a.restore));

    var breath = Math.sin(time * 0.11) * 0.045 * a.unfold * (1 - a.restore);
    // The instrument keeps a slow swing while it is only scenery: the rings
    // are never a still image on a page that is being read.
    var sway = Math.sin(time * 0.09) * 0.18 * a.unfold * (1 - a.restore);

    ringGroups.forEach(function (group, i) {
      var openingX = 0.7 + 0.38 * i;
      var openingY = 0.22 + 0.28 * i;
      var openingZ = (i - 1) * 0.16;

      var tiltX = mix(mix(openingX, 0.05, a.unfold), 1.34, a.edgeOn);
      var tiltY = mix(mix(openingY, 0, a.unfold), 0.1, a.edgeOn);
      // The closing frame is the opening frame: the instrument comes back the
      // way it left, so the page ends where it began.
      tiltX = mix(tiltX, openingX, a.restore);
      tiltY = mix(tiltY, openingY, a.restore);

      // The spacing along the axis is what turns three rings into a tunnel and
      // then into a lens: the spread is the depth of the stack, not its size.
      var spread = mix(mix(openingZ, (i - 1) * 2.4, a.unfold), (i - 1) * 0.34, a.edgeOn);
      spread = mix(spread, openingZ, a.restore);

      group.rotation.x = tiltX + (i % 2 ? -breath : breath);
      group.rotation.y = tiltY + sway;
      group.position.z = spread;
    });

    var w = fit.world.w;
    var h = fit.world.h;
    var ax = fit.x + drift.x;
    var ay = fit.y + drift.y;
    camera.position.set(-(ax - 0.5) * w, (ay - 0.5) * h, fit.dist);

    // The booms span the outer rings, so they have to follow the group's
    // matrices rather than a fixed angle.
    instruments.updateMatrixWorld();
    booms.forEach(function (boom) {
      var angle = boom.angle;
      from.set(2.72 * Math.cos(angle), 2.72 * Math.sin(angle), 0).applyMatrix4(ringGroups[0].matrix);
      to.set(2.72 * Math.cos(angle), 2.72 * Math.sin(angle), 0).applyMatrix4(ringGroups[2].matrix);
      along.subVectors(to, from);
      boom.mesh.position.copy(from).add(to).multiplyScalar(0.5);
      boom.mesh.scale.y = along.length();
      boom.mesh.quaternion.setFromUnitVectors(up, along.normalize());
    });
  }

  function applyTheme() {
    light = root.getAttribute("data-theme") === "light";
    glowColour.copy(srgb(token("--scene-glow", light ? "#8a5426" : "#ffbf80")));
    coreColour.copy(srgb(token("--scene-core", light ? "#6b3c1a" : "#fff0cc")));
    fogColour.copy(srgb(token("--scene-body", light ? "#121824" : "#0e121b")));
    scene.fog.color.copy(fogColour);

    coronaMaterial.uniforms.uDay.value = light ? 1 : 0;
    coronaMaterial.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;

    // Paper gets a darker moon: the same body lifted by a warm lamp reads as a
    // brown stain on cream, so by day the lights step back and the ring does the
    // work. One table, so the two themes cannot drift apart.
    var rig = light
      ? { key: 0.9, fill: 0.5, hemi: 0.7, lamp: 12 }
      : { key: 3, fill: 1.6, hemi: 0.35, lamp: 42 };
    key.intensity = rig.key;
    fill.intensity = rig.fill;
    hemi.intensity = rig.hemi;
    lamp.intensity = rig.lamp;

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
    stageValue = stageTarget;
    pointer.set(0, 0);
    drift.x = 0;
    drift.y = 0;
    stars.rotation.set(0, 0, 0);
    ringGroups.forEach(function (group, i) {
      group.rotation.z = 0;
    });
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
    // The field answers the pointer; the instrument keeps its mark.
    stars.rotation.y = pointer.x * 0.04;
    stars.rotation.x = -pointer.y * 0.03;
    ringGroups.forEach(function (group, i) {
      group.rotation.z = time * 0.012 * (i % 2 ? -1 : 1);
    });
    // A slow breath, small enough that the layout never has to move for it.
    drift.x = Math.sin(time * 0.17) * 0.006;
    drift.y = Math.cos(time * 0.13) * 0.004;

    // The scroll is the clock, but the camera arrives a beat late: the same
    // exponential catch-up the reference uses, so a flick does not snap.
    stageValue += (stageTarget - stageValue) * (1 - Math.exp(-7 * dt));

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
    stageTarget = event.detail.stage || 0;
    if (!running) {
      stageValue = stageTarget;
      apply();
      paint();
    }
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
    starMaterial.size = 0.065 * dpr;
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
