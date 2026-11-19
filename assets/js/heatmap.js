/* S&P 500 heat map: sectors laid out by index weight (squarified treemap, d3-hierarchy),
   each sector filled with Voronoi cells (d3-delaunay) seeded at its companies' treemap
   centers, so bigger weight ⇒ bigger cell. Colored by today's % change.

   Zoom: scroll (or pinch) over the map to zoom toward the pointer, drag to pan, the
   −/+/Reset buttons or Esc to get back. Labels are re-fitted for the zoom level, so
   small cells show their ticker, % and price once they're big enough. When fully zoomed
   out, scrolling down passes through to the page.

   Motion ("a stick dragging through water"): the pointer leaves a short trail. Cell
   corners near the trail are pushed along the direction of travel, then spring back
   with a slight wobble. Neighboring cells share corners, so the map bends like a
   surface. The wake works in screen pixels, so it feels the same at any zoom.

   Speed: the visible map is drawn into an offscreen canvas only when the view changes.
   Each animation frame pastes it and redraws just the area the wake touches.

   Data: config.heatmapUrl, or data/heatmap.json (built by scripts/fetch_expected_moves.py). */
(function () {
  var stage = document.getElementById("heat-stage");
  var canvas = document.getElementById("heat-canvas");
  var tip = document.getElementById("heat-tip");
  var section = document.getElementById("heat");
  if (!stage || !canvas || !window.d3 || !d3.Delaunay || !d3.treemap) return;
  var esc = window.SiteUtil.esc;
  var ctx = canvas.getContext("2d");
  var still = document.createElement("canvas");        // the visible map at the current zoom
  var sctx = still.getContext("2d");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var BG = "#0c0b10";
  var LABEL_H = 18;          // sector label strip
  var GAP = 3;               // space between sectors
  var INSET = 0.94;          // resting gap between cells
  var SANS = "Inter, system-ui, sans-serif", MONO = "'JetBrains Mono', ui-monospace, monospace";
  var MAXZOOM = 12;

  // wake physics (screen pixels)
  var SIGMA = 70;            // reach of the wake around each trail point
  var LIFE = 900;            // how long a trail point lasts (ms)
  var DECAY = 320;           // how fast the push fades (ms)
  var WOBBLE = 620;          // period of the spring-back wobble (ms)
  var PUSH = 0.22;           // how far corners move per px of pointer speed
  var MAXV = 48;             // speed cap per move event
  var MAXD = 24;             // soft limit on how far any corner can be displaced

  var data = null, cells = [], sectors = [], W = 0, H = 0, dpr = 1;
  var view = { k: 1, x: 0, y: 0 };    // screen = world × k + (x, y)
  var hover = null, pointer = null, last = null, trail = [], raf = 0, tappedSym = null;
  var drag = null, suppressClick = false, repaintPending = false;

  /* ---------- color: red ← gray → green, saturating at ±3% ---------- */
  var NEU = [64, 68, 82], RED = [214, 58, 58], GRN = [34, 166, 90];
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function colorFor(cp) {
    var t = Math.pow(Math.min(1, Math.abs(cp) / 3), 0.75);
    return mix(NEU, cp < 0 ? RED : GRN, t);
  }
  function rgb(c, lift) {
    lift = lift || 0;
    return "rgb(" + Math.round(c[0] + (255 - c[0]) * lift) + "," + Math.round(c[1] + (255 - c[1]) * lift) + "," + Math.round(c[2] + (255 - c[2]) * lift) + ")";
  }
  function pct(v) { return (v > 0 ? "+" : "") + v.toFixed(2) + "%"; }

  /* ---------- view helpers ---------- */
  function sx(wx) { return wx * view.k + view.x; }
  function sy(wy) { return wy * view.k + view.y; }
  function toWorld(x, y) { return [(x - view.x) / view.k, (y - view.y) / view.k]; }
  function onScreen(c, pad) {
    pad = pad || 0;
    return sx(c.x1) >= -pad && sx(c.x0) <= W + pad && sy(c.y1) >= -pad && sy(c.y0) <= H + pad;
  }
  function clampView() {
    view.k = Math.max(1, Math.min(MAXZOOM, view.k));
    view.x = Math.min(0, Math.max(W - W * view.k, view.x));
    view.y = Math.min(0, Math.max(H - H * view.k, view.y));
  }
  function useWorld(g) { g.setTransform(dpr * view.k, 0, 0, dpr * view.k, dpr * view.x, dpr * view.y); }

  /* ---------- layout (load, resize, new data) ---------- */
  function layout() {
    var r = stage.getBoundingClientRect();
    var nw = Math.max(280, Math.floor(r.width)), nh = Math.max(320, Math.floor(r.height));
    if (nw !== W || nh !== H) view = { k: 1, x: 0, y: 0 };   // keep the zoom on a data refresh
    W = nw; H = nh;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = still.width = W * dpr;
    canvas.height = still.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";

    var bySec = {};
    data.stocks.forEach(function (s) { (bySec[s.sec] = bySec[s.sec] || []).push(s); });
    var root = d3.hierarchy({ children: Object.keys(bySec).map(function (k) { return { name: k, children: bySec[k] }; }) })
      .sum(function (d) { return d.w || 0; })
      .sort(function (a, b) { return b.value - a.value; });
    d3.treemap().size([W, H]).tile(d3.treemapSquarify.ratio(1.2))
      .paddingOuter(GAP).paddingInner(GAP).paddingTop(function (n) { return n.depth === 1 ? LABEL_H : GAP; })(root);

    cells = []; sectors = []; hover = null; trail = [];
    root.children.forEach(function (sec) {
      var leaves = sec.leaves();
      var b = [sec.x0, sec.y0 + LABEL_H, sec.x1, sec.y1];
      if (b[2] - b[0] < 4 || b[3] - b[1] < 4) return;
      var pts = leaves.map(function (l) { return [(l.x0 + l.x1) / 2, (l.y0 + l.y1) / 2]; });
      var del = d3.Delaunay.from(pts);
      var vor = del.voronoi(b);
      var wSum = 0, cpSum = 0;
      var secObj = { name: sec.data.name, x0: sec.x0, y0: sec.y0, x1: sec.x1, y1: sec.y1, b: b, del: del, cells: [] };
      leaves.forEach(function (l, i) {
        var poly = vor.cellPolygon(i);
        if (!poly) return;
        // true area centroid (shoelace) so labels sit in the visual middle of the cell
        var s = l.data, A = 0, cx = 0, cy = 0, n = poly.length - 1, minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
        for (var k = 0; k < n; k++) {
          var x0 = poly[k][0], y0 = poly[k][1], x1 = poly[k + 1][0], y1 = poly[k + 1][1], f = x0 * y1 - x1 * y0;
          A += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
          minX = Math.min(minX, x0); maxX = Math.max(maxX, x0);
          minY = Math.min(minY, y0); maxY = Math.max(maxY, y0);
        }
        if (Math.abs(A) > 1e-6) { cx /= 3 * A; cy /= 3 * A; } else { cx = (minX + maxX) / 2; cy = (minY + maxY) / 2; }
        var cell = { s: s, sec: secObj, poly: poly.slice(0, n), cx: cx, cy: cy,
                     x0: minX, y0: minY, x1: maxX, y1: maxY, w: maxX - minX, h: maxY - minY,
                     color: colorFor(s.cp), glow: 0, target: 0, label: null, labelK: 0 };
        cells.push(cell); secObj.cells[i] = cell;
        wSum += s.w; cpSum += s.w * s.cp;
      });
      secObj.cp = wSum ? cpSum / wSum : 0;
      sectors.push(secObj);
    });

    clampView();
    paintStill();
    frame();
    updateZoomUI();
  }

  /* ---------- labels: fitted for the cell's size on screen at this zoom ---------- */
  // Zoom levels are bucketed (steps of 15%) so labels are re-measured only when the
  // zoom moves into a new bucket, not on every scroll tick.
  function bucket(k) { return Math.pow(1.15, Math.round(Math.log(k) / Math.log(1.15))); }

  // biggest font where every line fits; drop price, then %, when it can't.
  // Returns the font size in world units (it's drawn under the zoom transform).
  function fitLabel(c, kb) {
    var w = c.w * kb, h = c.h * kb;
    if (Math.min(w, h) < 22) return null;
    var lines = [c.s.s, pct(c.s.cp), "$" + c.s.p.toFixed(2)];
    var start = Math.min(26, Math.min(w, h) / 3.4);
    while (lines.length) {
      var maxW = w * (lines.length === 3 ? 0.6 : 0.7), maxH = h * (lines.length === 3 ? 0.55 : 0.6);
      for (var f = start; f >= 8.5; f -= 0.5) {
        var lh = f * 1.12, wide = 0;
        for (var i = 0; i < lines.length; i++) {
          sctx.font = i ? "500 " + f * 0.72 + "px " + MONO : "700 " + f + "px " + SANS;
          wide = Math.max(wide, sctx.measureText(lines[i]).width);
        }
        if (wide <= maxW && lines.length * lh <= maxH) return { fs: f / kb, lines: lines.slice() };
      }
      lines.pop();
    }
    return null;
  }
  function ensureLabels() {
    var kb = bucket(view.k);
    cells.forEach(function (c) {
      if (c.labelK !== kb && onScreen(c, 40)) { c.label = fitLabel(c, kb); c.labelK = kb; }
    });
  }

  /* ---------- drawing ---------- */
  // the wake, measured in screen pixels and returned in world units
  function wake(wx, wy, now) {
    var x = sx(wx), y = sy(wy), dx = 0, dy = 0;
    for (var i = 0; i < trail.length; i++) {
      var p = trail[i], ex = x - p.x, ey = y - p.y, d2 = ex * ex + ey * ey;
      if (d2 > 9 * SIGMA * SIGMA) continue;
      var age = now - p.t;
      var k = Math.exp(-d2 / (2 * SIGMA * SIGMA)) * Math.exp(-age / DECAY) * Math.cos(2 * Math.PI * age / WOBBLE);
      dx += p.vx * k * PUSH; dy += p.vy * k * PUSH;
    }
    // overlapping trail points add up; ease the total toward MAXD instead of letting it run away
    var m = Math.hypot(dx, dy);
    if (m > 0.001) { var s = MAXD * Math.tanh(m / MAXD) / m; dx *= s; dy *= s; }
    return [dx / view.k, dy / view.k];
  }

  function cellPath(g, c, now, moving) {
    var k = INSET + (1 - INSET) * c.glow;            // gaps close as a cell lights up
    var off = moving ? wake(c.cx, c.cy, now) : [0, 0];
    var ccx = c.cx + off[0], ccy = c.cy + off[1];
    g.beginPath();
    for (var i = 0; i < c.poly.length; i++) {
      var vx = c.poly[i][0], vy = c.poly[i][1];
      if (moving) { var d = wake(vx, vy, now); vx += d[0]; vy += d[1]; }   // shared corners move together
      var x = ccx + (vx - ccx) * k, y = ccy + (vy - ccy) * k;
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.closePath();
    return [ccx, ccy];
  }

  function drawCell(g, c, now, moving) {           // world coordinates (zoom transform set)
    var center = cellPath(g, c, now, moving);
    g.fillStyle = rgb(c.color, 0.22 * c.glow);
    g.fill();
    if (c === hover) { g.lineWidth = 1.5 / view.k; g.strokeStyle = "rgba(255,255,255,.85)"; g.stroke(); }
    if (!c.label) return;
    g.save();
    g.clip();
    var L = c.label, lh = L.fs * 1.12, top = center[1] - (L.lines.length - 1) * lh / 2;
    g.textAlign = "center"; g.textBaseline = "middle";
    for (var i = 0; i < L.lines.length; i++) {
      g.font = i ? "500 " + L.fs * 0.72 + "px " + MONO : "700 " + L.fs + "px " + SANS;
      g.fillStyle = ["rgba(255,255,255,.96)", "rgba(255,255,255,.86)", "rgba(255,255,255,.62)"][i];
      g.fillText(L.lines[i], center[0], top + i * lh);
    }
    g.restore();
  }

  // sector names stay the same size at any zoom and stick to the left edge while panning
  function drawSectorLabels(g) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.textAlign = "left"; g.textBaseline = "alphabetic";
    g.font = "600 10.5px " + MONO;
    sectors.forEach(function (s) {
      // a fixed 17px strip sitting right on top of the sector's cells (the gap above grows with zoom)
      var x0 = sx(s.x0), x1 = sx(s.x1), y0 = sy(s.y0 + LABEL_H) - LABEL_H, stripH = LABEL_H - 1;
      if (x1 < 0 || x0 > W || y0 + stripH < 0 || y0 > H) return;
      g.fillStyle = BG;
      g.fillRect(x0, y0, x1 - x0, stripH);
      var left = Math.max(x0, 0) + 4, room = Math.min(x1, W) - left - 4;
      if (room < 40) return;
      var name = s.name.toUpperCase(), p = " " + pct(s.cp);
      while (name.length > 3 && g.measureText(name + p).width > room) name = name.slice(0, -2) + "…";
      var ty = y0 + 13;
      g.fillStyle = "rgba(255,255,255,.72)";
      g.fillText(name, left, ty);
      g.fillStyle = s.cp >= 0 ? "#5fd18f" : "#f07a7a";
      g.fillText(p, left + g.measureText(name).width, ty);
    });
  }

  // visible map → offscreen canvas (whenever the view changes)
  function paintStill() {
    ensureLabels();
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.fillStyle = BG;
    sctx.fillRect(0, 0, W, H);
    useWorld(sctx);
    cells.forEach(function (c) { if (onScreen(c, 2)) drawCell(sctx, c, 0, false); });
    drawSectorLabels(sctx);
  }

  // per frame: paste the visible map, then redraw only what the wake / glow touches
  function frame() {
    var now = performance.now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(still, 0, 0);
    var moving = trail.length > 0;
    var active = cells.filter(function (c) { return c.glow > 0.004 || c === hover; });
    if (!moving && !active.length) return;

    // dirty area (screen px): around the trail and any glowing cells
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, pad = 3 * SIGMA;
    trail.forEach(function (p) { x0 = Math.min(x0, p.x - pad); y0 = Math.min(y0, p.y - pad); x1 = Math.max(x1, p.x + pad); y1 = Math.max(y1, p.y + pad); });
    active.forEach(function (c) { x0 = Math.min(x0, sx(c.x0) - 6); y0 = Math.min(y0, sy(c.y0) - 6); x1 = Math.max(x1, sx(c.x1) + 6); y1 = Math.max(y1, sy(c.y1) + 6); });
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W, x1); y1 = Math.min(H, y1);
    if (x1 <= x0 || y1 <= y0) return;

    // Snap the repaint area to whole device pixels. A fractional edge gets anti-aliased,
    // blending the old and new drawing into a faint dark box that follows the cursor.
    var X0 = Math.floor(x0 * dpr), Y0 = Math.floor(y0 * dpr);
    var X1 = Math.ceil(x1 * dpr), Y1 = Math.ceil(y1 * dpr);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath(); ctx.rect(X0, Y0, X1 - X0, Y1 - Y0); ctx.clip();
    ctx.fillStyle = BG;
    ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    x0 = X0 / dpr; y0 = Y0 / dpr; x1 = X1 / dpr; y1 = Y1 / dpr;
    useWorld(ctx);
    var hov = null;
    cells.forEach(function (c) {
      if (sx(c.x1) < x0 - 40 || sx(c.x0) > x1 + 40 || sy(c.y1) < y0 - 40 || sy(c.y0) > y1 + 40) return;
      if (c === hover) { hov = c; return; }                 // hovered cell goes on top
      drawCell(ctx, c, now, moving);
    });
    if (hov) drawCell(ctx, hov, now, moving);
    drawSectorLabels(ctx);
    ctx.restore();
  }

  function repaint() {                                    // view changed: redraw on the next frame
    if (repaintPending) return;
    repaintPending = true;
    requestAnimationFrame(function () { repaintPending = false; paintStill(); frame(); updateZoomUI(); });
  }

  /* ---------- animation loop: runs only while something is moving ---------- */
  function tick() {
    var now = performance.now();
    trail = trail.filter(function (p) { return now - p.t < LIFE; });
    var busy = trail.length > 0;
    cells.forEach(function (c) {
      var t = 0;
      if (c === hover) t = 1;
      else if (pointer && onScreen(c, 140)) {
        var d = Math.hypot(sx(c.cx) - pointer[0], sy(c.cy) - pointer[1]);
        t = Math.max(0, 1 - d / 140) * 0.38;               // soft light around the pointer
      }
      c.target = t;
      var diff = c.target - c.glow;
      if (Math.abs(diff) > 0.004) { c.glow += diff * 0.18; busy = true; } else c.glow = c.target;
    });
    frame();
    raf = busy ? requestAnimationFrame(tick) : 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }

  /* ---------- zoom ---------- */
  function zoomAt(x, y, nk) {
    nk = Math.max(1, Math.min(MAXZOOM, nk));
    if (nk === view.k) return false;
    var w = toWorld(x, y);
    view.k = nk;
    view.x = x - w[0] * nk;
    view.y = y - w[1] * nk;
    clampView();
    trail = [];                                         // the old wake belongs to the old view
    tip.hidden = true;
    repaint();
    return true;
  }
  function resetZoom() { view = { k: 1, x: 0, y: 0 }; trail = []; repaint(); }

  var zoomUI = null;
  function buildZoomUI() {
    var bar = section.querySelector(".chart-bar");
    if (!bar || zoomUI) return;
    zoomUI = document.createElement("div");
    zoomUI.className = "heat-zoom";
    zoomUI.setAttribute("role", "group");
    zoomUI.setAttribute("aria-label", "Zoom the heat map");
    zoomUI.innerHTML =
      '<button type="button" data-z="out" aria-label="Zoom out">−</button>' +
      '<span class="heat-zoom-level mono" aria-live="polite">1×</span>' +
      '<button type="button" data-z="in" aria-label="Zoom in">+</button>' +
      '<button type="button" data-z="reset">Reset</button>';
    var legend = bar.querySelector(".heat-legend");
    bar.insertBefore(zoomUI, legend || null);
    zoomUI.addEventListener("click", function (e) {
      var b = e.target.closest("[data-z]");
      if (!b || !data) return;
      var z = b.getAttribute("data-z");
      if (z === "reset") resetZoom();
      else zoomAt(W / 2, H / 2, view.k * (z === "in" ? 1.6 : 1 / 1.6));
    });
    var note = section.querySelector(".heat-note");
    if (note) note.textContent = note.textContent.replace(/\s*$/, "") + " Scroll to zoom in, drag to move around.";
  }
  function updateZoomUI() {
    if (!zoomUI) return;
    zoomUI.querySelector(".heat-zoom-level").textContent = (Math.round(view.k * 10) / 10) + "×";
    zoomUI.querySelector('[data-z="out"]').disabled = view.k <= 1;
    zoomUI.querySelector('[data-z="reset"]').disabled = view.k <= 1;
    zoomUI.querySelector('[data-z="in"]').disabled = view.k >= MAXZOOM;
    canvas.style.touchAction = view.k > 1 ? "none" : "manipulation";   // zoomed: one-finger drag pans the map
    if (!hover) canvas.style.cursor = view.k > 1 ? "grab" : "default";
  }

  /* ---------- interaction ---------- */
  function cellAt(x, y) {                                 // screen point → cell
    var w = toWorld(x, y);
    for (var i = 0; i < sectors.length; i++) {
      var s = sectors[i], b = s.b;
      if (w[0] >= b[0] && w[0] <= b[2] && w[1] >= b[1] && w[1] <= b[3]) return s.cells[s.del.find(w[0], w[1])] || null;
    }
    return null;
  }

  function showTip(c, x, y) {
    if (!c) { tip.hidden = true; return; }
    var s = c.s;
    tip.innerHTML =
      '<div class="heat-tip-top"><strong>' + esc(s.s) + '</strong><span class="' + (s.cp >= 0 ? "up" : "down") + '">' + pct(s.cp) + "</span></div>" +
      '<div class="heat-tip-name">' + esc(s.n) + "</div>" +
      '<div class="heat-tip-row"><span>Price</span><span>$' + s.p.toFixed(2) + "</span></div>" +
      '<div class="heat-tip-row"><span>Change</span><span>' + (s.c > 0 ? "+" : "") + s.c.toFixed(2) + "</span></div>" +
      '<div class="heat-tip-row"><span>Sector</span><span>' + esc(s.sec) + "</span></div>" +
      '<div class="heat-tip-row"><span>S&amp;P weight</span><span>' + s.w.toFixed(2) + "%</span></div>";
    tip.hidden = false;
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var left = x + 16 + tw > W ? x - tw - 16 : x + 16;
    var top = Math.min(Math.max(8, y - th / 2), H - th - 8);
    tip.style.transform = "translate(" + Math.max(8, left) + "px," + top + "px)";
  }

  function localXY(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

  canvas.addEventListener("pointerdown", function (e) {
    if (!data || (e.pointerType === "mouse" && e.button !== 0)) return;
    var xy = localXY(e);
    drag = { x: xy[0], y: xy[1], vx: view.x, vy: view.y, moved: false, id: e.pointerId };
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!data) return;
    var xy = localXY(e);
    // dragging while zoomed in pans the map
    if (drag && drag.id === e.pointerId) {
      var mx = xy[0] - drag.x, my = xy[1] - drag.y;
      if (!drag.moved && Math.hypot(mx, my) > 4 && view.k > 1) {
        drag.moved = true;
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        canvas.style.cursor = "grabbing"; tip.hidden = true; hover = null; trail = [];
      }
      if (drag.moved) {
        view.x = drag.vx + mx; view.y = drag.vy + my;
        clampView(); repaint();
        return;
      }
    }
    // drop a trail point carrying the pointer's velocity (the "stick" in the water)
    if (last && !reduce) {
      var vx = xy[0] - last[0], vy = xy[1] - last[1], sp = Math.hypot(vx, vy);
      if (sp > 0.5) {
        if (sp > MAXV) { vx *= MAXV / sp; vy *= MAXV / sp; }
        trail.push({ x: xy[0], y: xy[1], vx: vx, vy: vy, t: performance.now() });
        if (trail.length > 40) trail.shift();
      }
    }
    last = pointer = xy;
    var c = cellAt(xy[0], xy[1]);
    if (c !== hover) { hover = c; canvas.style.cursor = c ? "pointer" : (view.k > 1 ? "grab" : "default"); }
    showTip(hover, xy[0], xy[1]);
    kick();
  });
  function endDrag(e) {
    if (drag && drag.moved) { suppressClick = true; updateZoomUI(); }
    drag = null;
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", function () {
    if (drag && drag.moved) return;
    pointer = last = null; hover = null; tappedSym = null; tip.hidden = true; kick();
  });
  canvas.addEventListener("click", function (e) {
    if (suppressClick) { suppressClick = false; return; }  // that was a drag, not a click
    if (!data) return;
    var xy = localXY(e), c = cellAt(xy[0], xy[1]);
    if (!c) return;
    // touch: first tap shows the details, a second tap on the same stock opens it
    if (e.pointerType === "touch" && tappedSym !== c.s.s) { tappedSym = c.s.s; showTip(c, xy[0], xy[1]); return; }
    if (window.MarketsSelect && window.MarketsSelect(c.s.s)) return;   // chart it on this page
    window.open("https://www.tradingview.com/chart/?symbol=" + encodeURIComponent(c.s.s.replace("-", ".")), "_blank", "noopener");
  });

  // scroll / pinch to zoom toward the pointer; fully zoomed out, scrolling down scrolls the page
  canvas.addEventListener("wheel", function (e) {
    if (!data) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? H : 1);
    var factor = Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018));   // ctrlKey = trackpad pinch
    if (view.k <= 1 && factor < 1) return;                     // nothing to zoom out of: let the page scroll
    e.preventDefault();
    var xy = localXY(e);
    zoomAt(xy[0], xy[1], view.k * factor);
  }, { passive: false });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && view.k > 1 && data) resetZoom();
  });

  /* ---------- data ---------- */
  function describe() {
    var s = data.stocks.slice().sort(function (a, b) { return b.cp - a.cp; });
    var up = data.stocks.filter(function (x) { return x.cp > 0; }).length;
    canvas.setAttribute("aria-label", "S&P 500 heat map: " + up + " of " + data.stocks.length + " stocks up. Biggest gainers " +
      s.slice(0, 3).map(function (x) { return x.s + " " + pct(x.cp); }).join(", ") + ". Biggest decliners " +
      s.slice(-3).reverse().map(function (x) { return x.s + " " + pct(x.cp); }).join(", ") + ".");
    var when = new Date(data.generatedAt);
    document.getElementById("heat-meta").textContent = "· " + up + " of " + data.stocks.length + " up · prices as of " +
      (isNaN(when) ? data.asOf : when.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }));
  }

  function load() {
    if (location.protocol.indexOf("http") !== 0) return Promise.resolve(null);   // needs the published site
    var url = (window.SITE && window.SITE.heatmapUrl) || "data/heatmap.json";   // config can point at another site's live data
    return fetch(url + "?t=" + Math.floor(Date.now() / 300000))
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function apply(d) {
    if (!d || !d.stocks || !d.stocks.length) return;
    var changed = !data || d.generatedAt !== data.generatedAt;
    data = d;
    section.hidden = false;
    buildZoomUI();
    if (changed) { describe(); layout(); }
  }

  load().then(apply);
  setInterval(function () { load().then(apply); }, 5 * 60000);
  // fonts arrive after the first paint: re-measure labels and repaint once they do
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
    if (!data) return;
    cells.forEach(function (c) { c.labelK = 0; });
    repaint();
  });

  var rt = 0;
  new ResizeObserver(function () {
    if (!data) return;
    clearTimeout(rt);
    rt = setTimeout(layout, 120);
  }).observe(stage);
})();
