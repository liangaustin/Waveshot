/* WaveShot · 程序化贴图（全部 Canvas 2D 生成，零外部资源） */
(function (global) {
  'use strict';

  var cache = {};

  function make(size) {
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    return c;
  }

  function toTex(canvas, clamp) {
    var t = new THREE.CanvasTexture(canvas);
    if (clamp) {
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    } else {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }
    t.anisotropy = 4;
    return t;
  }

  function cached(name, opts, build) {
    var key = name + ':' + JSON.stringify(opts || {});
    if (!cache[key]) cache[key] = build();
    return cache[key];
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function shade(hex, k) {
    // k > 1 变亮，k < 1 变暗
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.round(((n >> 16) & 255) * k));
    var g = Math.min(255, Math.round(((n >> 8) & 255) * k));
    var b = Math.min(255, Math.round((n & 255) * k));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function speckle(ctx, size, n, rmin, rmax, color, amin, amax) {
    for (var i = 0; i < n; i++) {
      ctx.globalAlpha = rand(amin, amax);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, rand(rmin, rmax), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ===== 砂岩砖墙（赤沙回廊）=====
  function sandstone(opts) {
    opts = opts || {};
    return cached('sandstone', opts, function () {
      var base = opts.base || '#c8a26a';
      var mortar = opts.mortar || '#a8814f';
      var rows = opts.rows || 8, cols = opts.cols || 6;
      var size = 512;
      var c = make(size), ctx = c.getContext('2d');
      ctx.fillStyle = mortar;
      ctx.fillRect(0, 0, size, size);
      var bh = size / rows, bw = size / cols;
      for (var r = 0; r < rows; r++) {
        var off = (r % 2) * bw / 2;
        for (var i = -1; i <= cols; i++) {
          var x = i * bw + off + 3, y = r * bh + 3;
          ctx.fillStyle = shade(base, rand(0.88, 1.08));
          ctx.fillRect(x, y, bw - 6, bh - 6);
          // 砖面风化
          ctx.globalAlpha = 0.12;
          ctx.fillStyle = shade(base, 0.7);
          ctx.fillRect(x, y + bh - 12, bw - 6, 6);
          ctx.globalAlpha = 1;
        }
      }
      speckle(ctx, size, 500, 0.5, 2.2, shade(base, 0.72), 0.06, 0.2);
      speckle(ctx, size, 180, 0.5, 1.6, '#fff', 0.04, 0.12);
      return toTex(c);
    });
  }

  // ===== 青石/石块（青庭圣所）=====
  function stone(opts) {
    opts = opts || {};
    return cached('stone', opts, function () {
      var base = opts.base || '#8a9a8e';
      var mortar = opts.mortar || '#5f6d64';
      var rows = opts.rows || 5;
      var size = 512;
      var c = make(size), ctx = c.getContext('2d');
      ctx.fillStyle = mortar;
      ctx.fillRect(0, 0, size, size);
      var bh = size / rows;
      for (var r = 0; r < rows; r++) {
        var x = -rand(0, 60);
        while (x < size) {
          var w = rand(size / 3, size / 1.8);
          ctx.fillStyle = shade(base, rand(0.85, 1.1));
          ctx.fillRect(x + 4, r * bh + 4, w - 8, bh - 8);
          x += w;
        }
      }
      speckle(ctx, size, 600, 0.5, 2.5, shade(base, 0.75), 0.05, 0.16);
      speckle(ctx, size, 200, 0.5, 1.5, shade(base, 1.25), 0.05, 0.14);
      return toTex(c);
    });
  }

  // ===== 沙地（赤沙地面）=====
  function sand(opts) {
    opts = opts || {};
    return cached('sand', opts, function () {
      var base = opts.base || '#c9a86e';
      var size = 512;
      var c = make(size), ctx = c.getContext('2d');
      var g = ctx.createLinearGradient(0, 0, 0, size);
      g.addColorStop(0, shade(base, 1.05));
      g.addColorStop(1, shade(base, 0.92));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      // 风纹
      ctx.strokeStyle = shade(base, 1.12);
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.25;
      for (var i = 0; i < 14; i++) {
        var y = Math.random() * size;
        ctx.beginPath();
        for (var x = 0; x <= size; x += 16) {
          var yy = y + Math.sin(x / 60 + i) * 8;
          if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      speckle(ctx, size, 400, 1, 3, shade(base, 0.72), 0.1, 0.3);
      speckle(ctx, size, 150, 1, 2.5, shade(base, 1.3), 0.1, 0.25);
      return toTex(c);
    });
  }

  // ===== 混凝土（白港地面/浅墙）=====
  function concrete(opts) {
    opts = opts || {};
    return cached('concrete', opts, function () {
      var base = opts.base || '#b9bcb6';
      var size = 512;
      var c = make(size), ctx = c.getContext('2d');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, size, size);
      speckle(ctx, size, 900, 0.5, 2, shade(base, 0.85), 0.08, 0.2);
      speckle(ctx, size, 350, 0.5, 1.6, shade(base, 1.12), 0.06, 0.16);
      // 细裂纹
      ctx.strokeStyle = shade(base, 0.7);
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;
      for (var i = 0; i < 5; i++) {
        var x = Math.random() * size, y = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (var s = 0; s < 6; s++) {
          x += rand(-40, 40); y += rand(-40, 40);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      return toTex(c);
    });
  }

  // ===== 白灰泥墙（白港墙体）=====
  function plaster(opts) {
    opts = opts || {};
    return cached('plaster', opts, function () {
      var base = opts.base || '#d8d5cc';
      var size = 512;
      var c = make(size), ctx = c.getContext('2d');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, size, size);
      // 掉皮斑块
      for (var i = 0; i < 12; i++) {
        ctx.globalAlpha = rand(0.08, 0.2);
        ctx.fillStyle = shade(base, rand(0.72, 0.9));
        ctx.beginPath();
        var x = Math.random() * size, y = Math.random() * size, r = rand(12, 55);
        for (var a = 0; a < Math.PI * 2; a += 0.6) {
          var rr = r * rand(0.6, 1.3);
          var px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
          if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // 裂缝
      ctx.strokeStyle = shade(base, 0.62);
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.45;
      for (var j = 0; j < 6; j++) {
        var cx = Math.random() * size, cy = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        for (var s = 0; s < 5; s++) {
          cx += rand(-35, 35); cy += rand(-35, 35);
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      speckle(ctx, size, 500, 0.5, 1.8, shade(base, 0.88), 0.05, 0.14);
      return toTex(c);
    });
  }

  // ===== 金属（集装箱/管道/油桶/闸门）=====
  function metal(opts) {
    opts = opts || {};
    return cached('metal', opts, function () {
      var base = opts.base || '#5c7186';
      var size = 512;
      var c = make(size), ctx = c.getContext('2d');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, size, size);
      // 竖向条纹/瓦楞
      for (var x = 0; x < size; x += 32) {
        var g = ctx.createLinearGradient(x, 0, x + 32, 0);
        g.addColorStop(0, shade(base, 0.82));
        g.addColorStop(0.5, shade(base, 1.12));
        g.addColorStop(1, shade(base, 0.85));
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, 32, size);
      }
      // 刮痕
      ctx.strokeStyle = shade(base, 1.25);
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1;
      for (var i = 0; i < 30; i++) {
        var sx = Math.random() * size, sy = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + rand(-60, 60), sy + rand(-8, 8));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // 锈斑
      for (var j = 0; j < 10; j++) {
        ctx.globalAlpha = rand(0.08, 0.2);
        ctx.fillStyle = '#7a4a2a';
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, rand(8, 30), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return toTex(c);
    });
  }

  // ===== 木板（木箱）=====
  function wood(opts) {
    opts = opts || {};
    return cached('wood', opts, function () {
      var base = opts.base || '#8a5f34';
      var size = 512;
      var c = make(size), ctx = c.getContext('2d');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, size, size);
      var plank = size / 4;
      for (var p = 0; p < 4; p++) {
        ctx.fillStyle = shade(base, rand(0.88, 1.1));
        ctx.fillRect(0, p * plank, size, plank - 4);
        // 木纹
        ctx.strokeStyle = shade(base, 0.72);
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.5;
        for (var g = 0; g < 5; g++) {
          var y = p * plank + rand(6, plank - 10);
          ctx.beginPath();
          for (var x = 0; x <= size; x += 24) {
            var yy = y + Math.sin(x / 40 + g * 2) * 3;
            if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // 钉子
        ctx.fillStyle = '#3c3c3c';
        ctx.beginPath();
        ctx.arc(14, p * plank + plank / 2, 3.5, 0, Math.PI * 2);
        ctx.arc(size - 14, p * plank + plank / 2, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      return toTex(c);
    });
  }

  // ===== 方砖地面（青庭）=====
  function tile(opts) {
    opts = opts || {};
    return cached('tile', opts, function () {
      var base = opts.base || '#93a49a';
      var grout = opts.grout || '#66756c';
      var cells = opts.cells || 6;
      var size = 512;
      var c = make(size), ctx = c.getContext('2d');
      ctx.fillStyle = grout;
      ctx.fillRect(0, 0, size, size);
      var cs = size / cells;
      for (var r = 0; r < cells; r++) {
        for (var i = 0; i < cells; i++) {
          ctx.fillStyle = shade(base, rand(0.9, 1.08));
          ctx.fillRect(i * cs + 3, r * cs + 3, cs - 6, cs - 6);
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = shade(base, 0.7);
          ctx.fillRect(i * cs + 3, r * cs + cs - 10, cs - 6, 7);
          ctx.globalAlpha = 1;
        }
      }
      speckle(ctx, size, 450, 0.5, 2, shade(base, 0.78), 0.06, 0.16);
      return toTex(c);
    });
  }

  // ===== 帆布/衣物/沙袋 =====
  function cloth(opts) {
    opts = opts || {};
    return cached('cloth', opts, function () {
      var base = opts.base || '#6b7a5c';
      var size = 256;
      var c = make(size), ctx = c.getContext('2d');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, size, size);
      // 织纹
      ctx.strokeStyle = shade(base, 1.15);
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1;
      for (var x = 0; x < size; x += 4) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
      }
      ctx.strokeStyle = shade(base, 0.82);
      for (var y = 0; y < size; y += 4) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      speckle(ctx, size, 260, 0.5, 2, shade(base, 0.72), 0.08, 0.2);
      return toTex(c);
    });
  }

  // ===== 僵尸皮肤（尸斑/血管/伤口）=====
  function skin(opts) {
    opts = opts || {};
    return cached('skin', opts, function () {
      var base = opts.base || '#7f8a68';
      var size = 256;
      var c = make(size), ctx = c.getContext('2d');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, size, size);
      // 尸斑
      for (var i = 0; i < 14; i++) {
        ctx.globalAlpha = rand(0.1, 0.26);
        ctx.fillStyle = shade(base, rand(0.62, 0.82));
        ctx.beginPath();
        ctx.ellipse(Math.random() * size, Math.random() * size, rand(8, 30), rand(6, 22), Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // 血管
      ctx.strokeStyle = shade(base, 0.55);
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.35;
      for (var j = 0; j < 8; j++) {
        var x = Math.random() * size, y = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (var s = 0; s < 4; s++) {
          x += rand(-22, 22); y += rand(-22, 22);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // 伤口
      for (var k = 0; k < 5; k++) {
        ctx.fillStyle = 'rgba(90,30,28,0.5)';
        ctx.beginPath();
        ctx.ellipse(Math.random() * size, Math.random() * size, rand(4, 12), rand(3, 8), Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      speckle(ctx, size, 220, 0.5, 1.6, shade(base, 1.18), 0.05, 0.14);
      return toTex(c);
    });
  }

  // ===== 血迹贴片（透明）=====
  function blood() {
    return cached('blood', null, function () {
      var size = 128;
      var c = make(size), ctx = c.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      for (var i = 0; i < 9; i++) {
        ctx.fillStyle = 'rgba(' + Math.round(rand(70, 110)) + ',14,12,' + rand(0.35, 0.8) + ')';
        ctx.beginPath();
        ctx.ellipse(rand(20, 108), rand(20, 108), rand(6, 26), rand(5, 18), Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      return toTex(c, true);
    });
  }

  // ===== 假接触阴影（径向渐变圆）=====
  function shadowBlob() {
    return cached('shadowBlob', null, function () {
      var size = 128;
      var c = make(size), ctx = c.getContext('2d');
      var g = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(0,0,0,0.42)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      return toTex(c, true);
    });
  }

  // ===== 地面污渍 =====
  function stain() {
    return cached('stain', null, function () {
      var size = 128;
      var c = make(size), ctx = c.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      for (var i = 0; i < 7; i++) {
        ctx.fillStyle = 'rgba(30,26,20,' + rand(0.1, 0.28) + ')';
        ctx.beginPath();
        ctx.ellipse(rand(24, 104), rand(24, 104), rand(10, 34), rand(8, 26), Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      return toTex(c, true);
    });
  }

  // ===== 天空渐变球 =====
  function sky(opts) {
    opts = opts || {};
    return cached('sky', opts, function () {
      var c = document.createElement('canvas');
      c.width = 8; c.height = 256;
      var ctx = c.getContext('2d');
      var g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, opts.top || '#4a7fae');
      g.addColorStop(0.55, opts.mid || '#c8b48e');
      g.addColorStop(1, opts.bottom || '#e8cf9c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 8, 256);
      return toTex(c, true);
    });
  }

  // ===== 条幅/旗帜 =====
  function banner(opts) {
    opts = opts || {};
    return cached('banner', opts, function () {
      var base = opts.base || '#a33228';
      var accent = opts.accent || '#e8c44a';
      var size = 128;
      var c = document.createElement('canvas');
      c.width = 64; c.height = 256;
      var ctx = c.getContext('2d');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, 64, 256);
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, 64, 10);
      ctx.fillRect(0, 246, 64, 10);
      // 中央纹样
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(16, 100, 32, 56);
      ctx.fillRect(8, 112, 48, 32);
      ctx.globalAlpha = 1;
      // 布纹
      speckle(ctx, size, 90, 0.5, 1.6, shade(base, 0.8), 0.08, 0.2);
      return toTex(c, true);
    });
  }

  global.WaveShotTex = {
    sandstone: sandstone,
    stone: stone,
    sand: sand,
    concrete: concrete,
    plaster: plaster,
    metal: metal,
    wood: wood,
    tile: tile,
    cloth: cloth,
    skin: skin,
    blood: blood,
    shadowBlob: shadowBlob,
    stain: stain,
    sky: sky,
    banner: banner
  };
})(window);
