/* WaveShot · 1m 网格 A* 寻路（战术地图专用；旧地图不启用，保持直线追击） */
(function (global) {
  'use strict';

  var SQRT2 = Math.SQRT2;

  /* ===== 二叉堆（按 f 升序）===== */
  function Heap() { this.a = []; }
  Heap.prototype.push = function (n) {
    var a = this.a;
    a.push(n);
    var i = a.length - 1;
    while (i > 0) {
      var p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      var t = a[p]; a[p] = a[i]; a[i] = t;
      i = p;
    }
  };
  Heap.prototype.pop = function () {
    var a = this.a;
    var top = a[0];
    var last = a.pop();
    if (a.length > 0) {
      a[0] = last;
      var i = 0;
      for (;;) {
        var l = 2 * i + 1, r = l + 1, m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        var t = a[m]; a[m] = a[i]; a[i] = t;
        i = m;
      }
    }
    return top;
  };
  Heap.prototype.size = function () { return this.a.length; };

  /* ===== 导航网格 ===== */
  function NavGrid(opts) {
    this.cell = opts.cell || 1;
    this.radius = (opts.radius == null) ? 0.55 : opts.radius;
    this.bound = opts.bound;
    this.cols = Math.ceil((2 * this.bound) / this.cell);
    this.blocked = new Uint8Array(this.cols * this.cols);

    var obs = opts.obstacles || [];
    for (var i = 0; i < obs.length; i++) {
      var b = obs[i];
      var cx0 = this.toCellIndex(b.x - b.halfX - this.radius);
      var cx1 = this.toCellIndex(b.x + b.halfX + this.radius);
      var cz0 = this.toCellIndex(b.z - b.halfZ - this.radius);
      var cz1 = this.toCellIndex(b.z + b.halfZ + this.radius);
      for (var cz = cz0; cz <= cz1; cz++) {
        for (var cx = cx0; cx <= cx1; cx++) {
          if (cx < 0 || cz < 0 || cx >= this.cols || cz >= this.cols) continue;
          var wx = this.cellCenterX(cx), wz = this.cellCenterZ(cz);
          if (Math.abs(wx - b.x) < b.halfX + this.radius &&
              Math.abs(wz - b.z) < b.halfZ + this.radius) {
            this.blocked[cz * this.cols + cx] = 1;
          }
        }
      }
    }
  }

  NavGrid.prototype.toCellIndex = function (v) {
    return Math.floor((v + this.bound) / this.cell);
  };
  NavGrid.prototype.cellCenterX = function (cx) {
    return -this.bound + (cx + 0.5) * this.cell;
  };
  NavGrid.prototype.cellCenterZ = function (cz) {
    return -this.bound + (cz + 0.5) * this.cell;
  };
  NavGrid.prototype.isBlockedCell = function (cx, cz) {
    if (cx < 0 || cz < 0 || cx >= this.cols || cz >= this.cols) return true;
    return this.blocked[cz * this.cols + cx] === 1;
  };
  NavGrid.prototype.isBlockedPoint = function (x, z) {
    return this.isBlockedCell(this.toCellIndex(x), this.toCellIndex(z));
  };

  /* 直线可视检测：0.3m 采样（不含端点，避免出生位置贴墙误判） */
  NavGrid.prototype.lineClear = function (x1, z1, x2, z2) {
    var dx = x2 - x1, dz = z2 - z1;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 0.3) return true;
    var steps = Math.ceil(dist / 0.3);
    for (var s = 1; s < steps; s++) {
      var t = s / steps;
      if (this.isBlockedPoint(x1 + dx * t, z1 + dz * t)) return false;
    }
    return true;
  };

  /* 起/终点落在障碍格时，向外找最近可走格（最多 4 圈） */
  NavGrid.prototype.snap = function (x, z) {
    var cx = this.toCellIndex(x), cz = this.toCellIndex(z);
    if (!this.isBlockedCell(cx, cz)) return { cx: cx, cz: cz };
    for (var r = 1; r <= 4; r++) {
      for (var dz = -r; dz <= r; dz++) {
        for (var dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          if (!this.isBlockedCell(cx + dx, cz + dz)) return { cx: cx + dx, cz: cz + dz };
        }
      }
    }
    return null;
  };

  /* A* 主入口：返回 [{x,z}, ...]（第一个点=起点，最后接近终点）；无解返回 null */
  NavGrid.prototype.findPath = function (x1, z1, x2, z2) {
    var s = this.snap(x1, z1);
    var e = this.snap(x2, z2);
    if (!s || !e) return null;
    if (s.cx === e.cx && s.cz === e.cz) {
      return this.smooth([{ x: x1, z: z1 }, { x: x2, z: z2 }]);
    }

    var cols = this.cols;
    var total = cols * cols;
    var g = new Float32Array(total);
    var came = new Int32Array(total);
    var closed = new Uint8Array(total);
    for (var i = 0; i < total; i++) { g[i] = Infinity; came[i] = -1; }

    var startId = s.cz * cols + s.cx;
    var endId = e.cz * cols + e.cx;
    g[startId] = 0;

    var open = new Heap();
    open.push({ id: startId, cx: s.cx, cz: s.cz, f: this.h(s.cx, s.cz, e.cx, e.cz) });

    // 8 方向；斜向必须两个正交邻格都可走（禁穿角）
    var D = [
      [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
      [1, 1, SQRT2], [1, -1, SQRT2], [-1, 1, SQRT2], [-1, -1, SQRT2]
    ];

    while (open.size() > 0) {
      var cur = open.pop();
      if (closed[cur.id]) continue;
      closed[cur.id] = 1;
      if (cur.id === endId) {
        return this.reconstruct(came, cur.id, x1, z1, x2, z2);
      }
      for (var d = 0; d < 8; d++) {
        var nx = cur.cx + D[d][0], nz = cur.cz + D[d][1];
        if (this.isBlockedCell(nx, nz)) continue;
        if (D[d][0] !== 0 && D[d][1] !== 0) {
          if (this.isBlockedCell(cur.cx + D[d][0], cur.cz) ||
              this.isBlockedCell(cur.cx, cur.cz + D[d][1])) continue;
        }
        var nid = nz * cols + nx;
        if (closed[nid]) continue;
        var ng = g[cur.id] + D[d][2];
        if (ng < g[nid]) {
          g[nid] = ng;
          came[nid] = cur.id;
          open.push({ id: nid, cx: nx, cz: nz, f: ng + this.h(nx, nz, e.cx, e.cz) });
        }
      }
    }
    return null;
  };

  /* octile 启发 */
  NavGrid.prototype.h = function (x1, z1, x2, z2) {
    var dx = Math.abs(x1 - x2), dz = Math.abs(z1 - z2);
    return (dx + dz) + (SQRT2 - 2) * Math.min(dx, dz);
  };

  NavGrid.prototype.reconstruct = function (came, endId, x1, z1, x2, z2) {
    var cols = this.cols;
    var cells = [];
    var id = endId;
    while (id >= 0) {
      cells.push({ x: this.cellCenterX(id % cols), z: this.cellCenterZ(Math.floor(id / cols)) });
      id = came[id];
    }
    cells.reverse();
    var pts = [{ x: x1, z: z1 }];
    for (var i = 0; i < cells.length; i++) pts.push(cells[i]);
    pts.push({ x: x2, z: z2 });
    return this.smooth(pts);
  };

  /* string pulling：能直达就跳过中间点 */
  NavGrid.prototype.smooth = function (pts) {
    var out = [pts[0]];
    var i = 0;
    while (i < pts.length - 1) {
      var j = pts.length - 1;
      for (; j > i + 1; j--) {
        if (this.lineClear(pts[i].x, pts[i].z, pts[j].x, pts[j].z)) break;
      }
      out.push(pts[j]);
      i = j;
    }
    return out;
  };

  global.WaveShotNav = {
    create: function (opts) { return new NavGrid(opts); }
  };
})(window);
