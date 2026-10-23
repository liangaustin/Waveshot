/* WaveShot · 战术禁区三张新地图（赤沙回廊 / 青庭圣所 / 白港中庭）
 * 只定义地图，不依赖 shared.js；依赖全局 THREE 与 window.WaveShotTex。
 */
(function (global) {
  'use strict';

  var Tex = global.WaveShotTex;

  /* ===== 地图构建工具箱（每张图各自一份，材质按图隔离）===== */
  function makeKit(api) {
    var T = api.THREE;
    var kit = {};

    /* --- 材质：注册进 MATS 供 addBox 按 kind 取 --- */
    kit.material = function (key, opts) {
      opts = opts || {};
      var m = new T.MeshStandardMaterial({
        color: opts.color != null ? opts.color : 0xffffff,
        map: opts.tex || null,
        bumpMap: opts.bump || null,
        bumpScale: opts.bumpScale != null ? opts.bumpScale : 0.03,
        roughness: opts.roughness != null ? opts.roughness : 0.9,
        metalness: opts.metalness != null ? opts.metalness : 0.05
      });
      api.addMaterial(key, m);
      return m;
    };

    /* --- 装饰盒：UV 按世界尺寸缩放，进场景但默认不挡子弹 --- */
    kit.decoBox = function (x, y, z, w, h, d, matKey, shadows) {
      var geo = new T.BoxGeometry(w, h, d);
      var tile = api.tileFor(matKey);
      if (tile) api.scaleUV(geo, w, h, d, tile);
      var mesh = new T.Mesh(geo, api.mat(matKey));
      mesh.position.set(x, y, z);
      api.deco(mesh, shadows);
      return mesh;
    };

    /* --- 实体盒：可碰撞 + 挡子弹（走 api.box 全套）--- */
    kit.solidBox = function (x, z, w, h, d, matKey) {
      return api.box(x, z, w, h, d, matKey);
    };

    /* --- 四面围墙（与旧图公式一致）--- */
    kit.perimeter = function (b, kind, h, t) {
      api.box(0, -(b + 1), b * 2 + 8, h, t, kind);
      api.box(0, b + 1, b * 2 + 8, h, t, kind);
      api.box(-(b + 1), 0, t, h, b * 2 + 8, kind);
      api.box(b + 1, 0, t, h, b * 2 + 8, kind);
    };

    /* --- 接触阴影（假阴影贴片）--- */
    kit.contact = function (x, z, rx, rz) {
      if (!Tex.shadowBlob) return;
      var geo = new T.PlaneGeometry(rx * 2, rz * 2);
      var mesh = new T.Mesh(geo, new T.MeshBasicMaterial({
        map: Tex.shadowBlob(), transparent: true, opacity: 0.55,
        depthWrite: false
      }));
      mesh.renderOrder = 3;
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, 0.014, z);
      api.deco(mesh, false);
      return mesh;
    };

    /* --- 地面污渍 --- */
    kit.stain = function (x, z, sx, sz, rot) {
      if (!Tex.stain) return;
      var geo = new T.PlaneGeometry(sx, sz);
      var mesh = new T.Mesh(geo, new T.MeshBasicMaterial({
        map: Tex.stain(), transparent: true, opacity: 0.8,
        depthWrite: false
      }));
      mesh.renderOrder = 2;
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = rot || 0;
      mesh.position.set(x, 0.012, z);
      api.deco(mesh, false);
      return mesh;
    };

    /* --- 天空渐变球 --- */
    kit.sky = function (colors) {
      if (!Tex.sky) return;
      var geo = new T.SphereGeometry(140, 24, 16);
      var mesh = new T.Mesh(geo, new T.MeshBasicMaterial({
        map: Tex.sky(colors), side: T.BackSide,
        fog: false, depthWrite: false
      }));
      mesh.renderOrder = -10;
      mesh.frustumCulled = false;
      api.deco(mesh, false);
      return mesh;
    };

    /* --- 地面换贴图（clone 一份设置 repeat，不影响墙体共享贴图）--- */
    kit.ground = function (tex, repeat) {
      if (!tex) return;
      var t = tex.clone();
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.repeat.set(repeat, repeat);
      t.needsUpdate = true;
      api.ground.material.map = t;
      api.ground.material.color.set(0xffffff);
      api.ground.material.needsUpdate = true;
    };

    /* --- 木箱（实体 + 接触阴影）--- */
    kit.crate = function (x, z, w, h, d, kind) {
      api.box(x, z, w, h, d, kind || 'crate');
      kit.contact(x, z, w * 0.72, d * 0.72);
    };

    /* --- 油桶（实体 + 挡子弹）--- */
    kit.barrel = function (x, z, matKey) {
      var geo = new T.CylinderGeometry(0.42, 0.42, 1.15, 14);
      var mesh = new T.Mesh(geo, api.mat(matKey || 'metal'));
      mesh.position.set(x, 0.575, z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      api.solid(mesh);
      api.obstacle({ x: x, z: z, halfX: 0.45, halfZ: 0.45 });
      kit.contact(x, z, 0.55, 0.55);
      return mesh;
    };

    /* --- 石柱（实体 + 挡子弹）--- */
    kit.column = function (x, z, r, h, matKey) {
      var geo = new T.CylinderGeometry(r, r * 1.12, h, 12);
      var mesh = new T.Mesh(geo, api.mat(matKey || 'pillar'));
      mesh.position.set(x, h / 2, z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      api.solid(mesh);
      api.obstacle({ x: x, z: z, halfX: r + 0.12, halfZ: r + 0.12 });
      kit.contact(x, z, r * 1.9, r * 1.9);
      return mesh;
    };

    /* --- 门楣（装饰，不挡子弹）--- */
    kit.archTop = function (x, y, z, w, h, d, matKey) {
      var mesh = kit.decoBox(x, y, z, w, h, d, matKey, true);
      return mesh;
    };

    /* --- 条幅/旗帜（双面布料）--- */
    kit.banner = function (x, y, z, w, h, rotY, tex) {
      var geo = new T.PlaneGeometry(w, h);
      var mat = new T.MeshStandardMaterial({
        map: tex, side: T.DoubleSide, roughness: 0.95,
        transparent: true, alphaTest: 0.05
      });
      var mesh = new T.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.rotation.y = rotY || 0;
      api.deco(mesh, false);
      return mesh;
    };

    /* --- 路灯（杆 + 头 + 点光）--- */
    kit.lamp = function (x, z, matKey) {
      var pole = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 3.6, 8), api.mat(matKey || 'metal'));
      pole.position.set(x, 1.8, z);
      pole.castShadow = true;
      api.deco(pole, true);
      var head = new T.Mesh(new T.BoxGeometry(0.5, 0.18, 0.5), api.mat(matKey || 'metal'));
      head.position.set(x, 3.62, z);
      api.deco(head, false);
      var bulb = new T.Mesh(new T.SphereGeometry(0.14, 8, 6),
        new T.MeshStandardMaterial({ color: 0xffe9b0, emissive: 0xffc76a, emissiveIntensity: 0.9 }));
      bulb.position.set(x, 3.5, z);
      api.deco(bulb, false);
      api.obstacle({ x: x, z: z, halfX: 0.18, halfZ: 0.18 });
      var light = new T.PointLight(0xffd9a0, 0.75, 16, 2);
      light.position.set(x, 3.5, z);
      api.light(light);
      kit.contact(x, z, 0.4, 0.4);
      return pole;
    };

    /* --- 花坛（池壁实体 + 绿植装饰）--- */
    kit.planter = function (x, z, w, d, matKey) {
      api.box(x, z, w, 0.75, d, matKey || 'pillar');
      var n = Math.max(3, Math.round(w * d * 0.9));
      for (var i = 0; i < n; i++) {
        var gx = x + (Math.random() - 0.5) * (w - 0.6);
        var gz = z + (Math.random() - 0.5) * (d - 0.6);
        var bush = new T.Mesh(new T.SphereGeometry(0.28 + Math.random() * 0.22, 8, 6),
          new T.MeshStandardMaterial({ color: 0x3f7a3a, roughness: 1 }));
        bush.position.set(gx, 0.88, gz);
        bush.scale.y = 0.72;
        api.deco(bush, true);
      }
      kit.contact(x, z, w * 0.7, d * 0.7);
    };

    /* --- 沙袋堆（每袋实体挡子弹 + 一个总体 AABB）--- */
    kit.sandbags = function (x, z, w, d, rotY, matKey) {
      var mat = api.mat(matKey || 'cloth');
      var bagGeo = new T.BoxGeometry(0.78, 0.34, 0.5);
      var rows = 2;
      for (var r = 0; r < rows; r++) {
        var count = Math.max(2, Math.round(w / 0.8));
        for (var i = 0; i < count; i++) {
          var lx = -w / 2 + 0.45 + i * 0.8;
          var lz = (r % 2) * 0.26 - 0.13;
          var cos = Math.cos(rotY || 0), sin = Math.sin(rotY || 0);
          var mesh = new T.Mesh(bagGeo, mat);
          mesh.position.set(x + lx * cos - lz * sin, 0.19 + r * 0.32, z + lx * sin + lz * cos);
          mesh.rotation.y = (rotY || 0) + (Math.random() - 0.5) * 0.2;
          mesh.castShadow = true; mesh.receiveShadow = true;
          api.solid(mesh);
        }
      }
      var hw = Math.abs(Math.cos(rotY || 0)) * w / 2 + Math.abs(Math.sin(rotY || 0)) * d / 2;
      var hd = Math.abs(Math.sin(rotY || 0)) * w / 2 + Math.abs(Math.cos(rotY || 0)) * d / 2;
      api.obstacle({ x: x, z: z, halfX: hw, halfZ: hd });
      kit.contact(x, z, hw * 1.3, hd * 1.3);
    };

    /* --- 市集摊位（台面实体 + 立柱 + 帆布顶，帆布不挡子弹）--- */
    kit.stall = function (x, z, rotY, matKey) {
      var cos = Math.cos(rotY || 0), sin = Math.sin(rotY || 0);
      var counter = kit.decoBox(x, 0.55, z, 3.2, 1.1, 1.1, matKey || 'crate', true);
      counter.rotation.y = rotY || 0;
      // 台面走实体（挡子弹 + 碰撞）
      api.obstacle({ x: x, z: z, halfX: 1.6 + 0.1, halfZ: 0.65 + 0.1 });
      for (var i = -1; i <= 1; i += 2) {
        for (var j = -1; j <= 1; j += 2) {
          var px = i * 1.45, pz = j * 0.5;
          var pole = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 2.3, 6), api.mat('metal'));
          pole.position.set(x + px * cos - pz * sin, 1.15, z + px * sin + pz * cos);
          pole.castShadow = true;
          api.solid(pole);
        }
      }
      var canopy = kit.decoBox(x, 2.32, z, 3.5, 0.1, 1.7, 'cloth', true);
      canopy.rotation.y = rotY || 0;
      kit.contact(x, z, 1.9, 1.0);
    };

    /* --- 集装箱（金属大箱，实体挡子弹）--- */
    kit.container = function (x, z, w, h, d, rotY, matKey) {
      var geo = new T.BoxGeometry(w, h, d);
      var tile = api.tileFor(matKey || 'metal');
      if (tile) api.scaleUV(geo, w, h, d, tile);
      var mesh = new T.Mesh(geo, api.mat(matKey || 'metal'));
      mesh.position.set(x, h / 2, z);
      mesh.rotation.y = rotY || 0;
      mesh.castShadow = true; mesh.receiveShadow = true;
      api.solid(mesh);
      var cos = Math.abs(Math.cos(rotY || 0)), sin = Math.abs(Math.sin(rotY || 0));
      api.obstacle({
        x: x, z: z,
        halfX: (w * cos + d * sin) / 2,
        halfZ: (w * sin + d * cos) / 2
      });
      kit.contact(x, z, w * 0.62, d * 0.62);
      return mesh;
    };

    /* --- 沿墙管线（装饰）--- */
    kit.pipe = function (x, y, z, len, rotY, matKey) {
      var geo = new T.CylinderGeometry(0.09, 0.09, len, 8);
      var mesh = new T.Mesh(geo, api.mat(matKey || 'metal'));
      mesh.position.set(x, y, z);
      mesh.rotation.z = Math.PI / 2;
      mesh.rotation.y = rotY || 0;
      api.deco(mesh, true);
      return mesh;
    };

    /* --- 喷泉（盆 + 水面 + 中心柱，全部挡子弹）--- */
    kit.fountain = function (x, z, r) {
      var basin = new T.Mesh(new T.CylinderGeometry(r, r + 0.18, 0.85, 20), api.mat('wall2'));
      basin.position.set(x, 0.425, z);
      basin.castShadow = true; basin.receiveShadow = true;
      api.solid(basin);
      var water = new T.Mesh(new T.CylinderGeometry(r - 0.35, r - 0.35, 0.08, 20),
        new T.MeshStandardMaterial({
          color: 0x3f7f9f, roughness: 0.18, metalness: 0.25,
          transparent: true, opacity: 0.88
        }));
      water.position.set(x, 0.82, z);
      api.deco(water, false);
      var stem = new T.Mesh(new T.CylinderGeometry(0.32, 0.42, 1.5, 12), api.mat('pillar'));
      stem.position.set(x, 1.45, z);
      stem.castShadow = true; stem.receiveShadow = true;
      api.solid(stem);
      var bowl = new T.Mesh(new T.CylinderGeometry(0.85, 0.35, 0.35, 14), api.mat('pillar'));
      bowl.position.set(x, 2.25, z);
      bowl.castShadow = true; bowl.receiveShadow = true;
      api.solid(bowl);
      api.obstacle({ x: x, z: z, halfX: r + 0.25, halfZ: r + 0.25 });
      kit.contact(x, z, r * 1.45, r * 1.45);
    };

    /* --- 雕像/纪念碑 --- */
    kit.statue = function (x, z, matKey) {
      api.box(x, z, 1.7, 0.6, 1.7, matKey || 'pillar');
      var body = new T.Mesh(new T.CylinderGeometry(0.34, 0.5, 1.9, 10), api.mat(matKey || 'pillar'));
      body.position.set(x, 1.55, z);
      body.castShadow = true; body.receiveShadow = true;
      api.solid(body);
      var head = new T.Mesh(new T.SphereGeometry(0.32, 10, 8), api.mat(matKey || 'pillar'));
      head.position.set(x, 2.72, z);
      head.castShadow = true;
      api.solid(head);
      api.obstacle({ x: x, z: z, halfX: 0.95, halfZ: 0.95 });
      kit.contact(x, z, 1.35, 1.35);
    };

    /* --- 随机碎石（纯装饰，不挡路）--- */
    kit.rubble = function (cx, cz, spread, n, matKey) {
      for (var i = 0; i < n; i++) {
        var s = 0.12 + Math.random() * 0.3;
        var mesh = new T.Mesh(new T.BoxGeometry(s, s * 0.6, s * (0.6 + Math.random() * 0.8)), api.mat(matKey || 'wall2'));
        mesh.position.set(cx + (Math.random() - 0.5) * spread, s * 0.3, cz + (Math.random() - 0.5) * spread);
        mesh.rotation.y = Math.random() * Math.PI;
        api.deco(mesh, true);
      }
    };

    return kit;
  }

  /* ============================================================
   * 地图 1：赤沙回廊 redsand —— 砂岩旧城 · 三路交火
   * ========================================================== */
  function buildRedsand(box, b, api) {
    var kit = makeKit(api);

    // 材质
    kit.material('wall', {
      tex: Tex.sandstone({ base: '#c8a26a', mortar: '#a8814f', rows: 8, cols: 6 }),
      bump: Tex.sandstone({ base: '#c8a26a', mortar: '#a8814f', rows: 8, cols: 6 }),
      roughness: 0.92
    });
    kit.material('wall2', {
      tex: Tex.sandstone({ base: '#9c7448', mortar: '#7c5a38', rows: 6, cols: 5 }),
      bump: Tex.sandstone({ base: '#9c7448', mortar: '#7c5a38', rows: 6, cols: 5 }),
      roughness: 0.95
    });
    kit.material('crate', { tex: Tex.wood({ base: '#8a5f34' }), roughness: 0.88 });
    kit.material('pillar', {
      tex: Tex.sandstone({ base: '#b08c58', mortar: '#8e6c40', rows: 10, cols: 3 }),
      roughness: 0.9
    });
    kit.material('metal', { tex: Tex.metal({ base: '#4c4238' }), roughness: 0.62, metalness: 0.45 });
    kit.material('cloth', { tex: Tex.cloth({ base: '#a33228' }), roughness: 0.95 });

    // 天空与地面
    kit.sky({ top: '#4a7fae', mid: '#c8b48e', bottom: '#e8cf9c' });
    kit.ground(Tex.sand({ base: '#c9a86e' }), 36);

    // 围墙
    kit.perimeter(b, 'wall', 5, 3);

    // 南侧低墙（±10,12），中央留通道；购买区 (0,20) r5.5 保持空旷
    box(-10, 12, 6, 1.2, 1.2, 'wall2');
    box(10, 12, 6, 1.2, 1.2, 'wall2');

    // 中路双门：x=±4.2, z=-1，墙 1.2×5.5×5.2，中间约 7m 通道 + 门楣
    box(-4.2, -1, 1.2, 5.5, 5.2, 'wall');
    box(4.2, -1, 1.2, 5.5, 5.2, 'wall');
    kit.archTop(0, 5.9, -1, 9.6, 1.1, 5.4, 'wall2');

    // 东侧长 A：x=13 两段墙，中间留入口
    box(13, -12, 1.2, 4.5, 14, 'wall');
    box(13, 7, 1.2, 4.5, 12, 'wall');
    // 内部 3 组木箱/沙袋
    kit.crate(16.2, -13, 2.2, 1.6, 1.6);
    kit.crate(16.2, -10.6, 1.4, 1.1, 1.4);
    kit.sandbags(16.4, -2, 2.4, 1.1, 0, 'cloth');
    kit.crate(16.2, 5.5, 2.2, 1.6, 1.6);

    // 西侧 B 通道：x=-13 类似分段
    box(-13, -12, 1.2, 4.5, 14, 'wall');
    box(-13, 7, 1.2, 4.5, 12, 'wall');
    kit.crate(-16.2, -13, 2.2, 1.6, 1.6);
    kit.barrel(-16, -9.5, 'metal');
    kit.barrel(-15.1, -10.2, 'metal');
    kit.crate(-16.2, 5.5, 2.2, 1.6, 1.6);
    kit.sandbags(-16.4, -1, 2.4, 1.1, 0, 'cloth');

    // 北侧包点：(±8,-20) 低墙，(±20,-23) 粗柱，中央木箱
    box(-8, -20, 6, 1.3, 1.3, 'wall2');
    box(8, -20, 6, 1.3, 1.3, 'wall2');
    kit.column(-20, -23, 1.15, 5.2, 'pillar');
    kit.column(20, -23, 1.15, 5.2, 'pillar');
    kit.crate(0, -23, 2.6, 1.8, 1.8);
    kit.crate(0, -20.6, 1.5, 1.1, 1.3);

    // 中部零散木箱/油桶（避开购买区）
    kit.crate(-6.5, -7, 1.8, 1.3, 1.8);
    kit.barrel(6.5, -7, 'metal');
    kit.crate(5.8, -8.3, 1.2, 0.9, 1.2);
    kit.barrel(-5.5, 2, 'metal');

    // 装饰：四面粉金条幅、路灯、污渍、碎石
    var bannerTex = Tex.banner({ base: '#a33228', accent: '#e8c44a' });
    kit.banner(-8, 3.2, b - 1.35, 2.2, 3.6, 0, bannerTex);
    kit.banner(8, 3.2, b - 1.35, 2.2, 3.6, 0, bannerTex);
    kit.banner(-8, 3.2, -(b - 1.35), 2.2, 3.6, Math.PI, bannerTex);
    kit.banner(8, 3.2, -(b - 1.35), 2.2, 3.6, Math.PI, bannerTex);
    kit.lamp(0, -12, 'metal');
    kit.lamp(-19, 2, 'metal');
    kit.lamp(19, 2, 'metal');
    kit.stain(-4, -14, 5, 3.4, 0.4);
    kit.stain(7, 4, 4.2, 3, 1.2);
    kit.stain(-12, -4, 3.6, 2.8, 0.2);
    kit.rubble(0, -26, 30, 26, 'wall2');
    kit.rubble(-18, -18, 16, 12, 'wall2');
    kit.rubble(18, -18, 16, 12, 'wall2');
  }

  /* ============================================================
   * 地图 2：青庭圣所 jadecourt —— 青石庭院 · 三路围攻
   * ========================================================== */
  function buildJadecourt(box, b, api) {
    var kit = makeKit(api);

    kit.material('wall', {
      tex: Tex.stone({ base: '#8a9a8e', mortar: '#5f6d64', rows: 5 }),
      bump: Tex.stone({ base: '#8a9a8e', mortar: '#5f6d64', rows: 5 }),
      roughness: 0.9
    });
    kit.material('wall2', {
      tex: Tex.stone({ base: '#5c6e66', mortar: '#42504a', rows: 4 }),
      bump: Tex.stone({ base: '#5c6e66', mortar: '#42504a', rows: 4 }),
      roughness: 0.92
    });
    kit.material('crate', { tex: Tex.wood({ base: '#7c6244' }), roughness: 0.9 });
    kit.material('pillar', {
      tex: Tex.stone({ base: '#a8b5a8', mortar: '#7e8c80', rows: 8 }),
      roughness: 0.85
    });
    kit.material('metal', { tex: Tex.metal({ base: '#3d4650' }), roughness: 0.6, metalness: 0.42 });
    kit.material('cloth', { tex: Tex.cloth({ base: '#2f6b5e' }), roughness: 0.95 });

    kit.sky({ top: '#3c657a', mid: '#9fbec4', bottom: '#d8d2bc' });
    kit.ground(Tex.tile({ base: '#93a49a', grout: '#66756c', cells: 6 }), 30);

    kit.perimeter(b, 'wall', 5, 3);

    // 南侧：(±9,10) 低墙，(±20,14) 木箱；购买区 (0,18) 空旷
    box(-9, 10, 5, 1.2, 1.2, 'wall2');
    box(9, 10, 5, 1.2, 1.2, 'wall2');
    kit.crate(-20, 14, 2, 1.5, 2);
    kit.crate(20, 14, 2, 1.5, 2);

    // 中央喷泉（实体障碍）
    kit.fountain(0, 0, 3.1);

    // 四根柱子 (±9,±9)
    kit.column(-9, -9, 0.55, 5.2, 'pillar');
    kit.column(9, -9, 0.55, 5.2, 'pillar');
    kit.column(-9, 9, 0.55, 5.2, 'pillar');
    kit.column(9, 9, 0.55, 5.2, 'pillar');

    // 两座花坛 (±5.8, 4.4)
    kit.planter(-5.8, 4.4, 3, 2.2, 'wall2');
    kit.planter(5.8, 4.4, 3, 2.2, 'wall2');

    // 三路隔墙：x=±14 两段，中间留口
    box(-14, -12, 1.2, 4.5, 12, 'wall');
    box(-14, 7, 1.2, 4.5, 10, 'wall');
    box(14, -12, 1.2, 4.5, 12, 'wall');
    box(14, 7, 1.2, 4.5, 10, 'wall');

    // 北侧圣所：(±6,-21) 柱，(0,-22) 雕像，(0,-16) 木箱
    kit.column(-6, -21, 0.6, 5.4, 'pillar');
    kit.column(6, -21, 0.6, 5.4, 'pillar');
    kit.statue(0, -22, 'pillar');
    kit.crate(0, -16, 2, 1.5, 2);

    // 装饰：青绿条幅、路灯、水渍、碎石
    var bannerTex = Tex.banner({ base: '#2f6b5e', accent: '#b9d8c2' });
    kit.banner(-10, 3.2, b - 1.35, 2.2, 3.6, 0, bannerTex);
    kit.banner(10, 3.2, b - 1.35, 2.2, 3.6, 0, bannerTex);
    kit.banner(0, 3.2, -(b - 1.35), 2.6, 3.8, Math.PI, bannerTex);
    kit.lamp(-4, -10, 'metal');
    kit.lamp(4, -10, 'metal');
    kit.lamp(0, 10, 'metal');
    kit.stain(2, -5, 5.5, 4, 0.3);
    kit.stain(-7, -14, 4, 3, 1.1);
    kit.stain(9, 11, 3.6, 3, 0.6);
    kit.rubble(0, -26, 26, 20, 'wall2');
    kit.rubble(-18, -16, 14, 10, 'wall2');
    kit.rubble(18, -16, 14, 10, 'wall2');
  }

  /* ============================================================
   * 地图 3：白港中庭 whiteharbor —— 白灰市集 · 中庭争夺
   * ========================================================== */
  function buildWhiteharbor(box, b, api) {
    var kit = makeKit(api);

    kit.material('wall', {
      tex: Tex.plaster({ base: '#d8d5cc' }),
      bump: Tex.plaster({ base: '#d8d5cc' }),
      roughness: 0.92
    });
    kit.material('wall2', {
      tex: Tex.concrete({ base: '#b9bcb6' }),
      bump: Tex.concrete({ base: '#b9bcb6' }),
      roughness: 0.94
    });
    kit.material('crate', { tex: Tex.wood({ base: '#8a6a42' }), roughness: 0.88 });
    kit.material('pillar', {
      tex: Tex.concrete({ base: '#c6c8c0' }),
      roughness: 0.88
    });
    kit.material('metal', { tex: Tex.metal({ base: '#5c7186' }), roughness: 0.58, metalness: 0.5 });
    kit.material('cloth', { tex: Tex.cloth({ base: '#2e4a6b' }), roughness: 0.95 });

    kit.sky({ top: '#3f7fae', mid: '#bcd8e8', bottom: '#eef0e8' });
    kit.ground(Tex.concrete({ base: '#b9bcb6' }), 30);

    kit.perimeter(b, 'wall', 5, 3);

    // 南侧：两个市集摊位 (±10,11)；(±21,16) 木箱；购买区 (0,21) r6 空旷
    kit.stall(-10, 11, 0, 'crate');
    kit.stall(10, 11, 0, 'crate');
    kit.crate(-21, 16, 2, 1.5, 2);
    kit.crate(21, 16, 2, 1.5, 2);

    // 中央干涸喷泉 (0,-2)
    kit.fountain(0, -2, 3.4);

    // 花坛 (±8,5)，柱子 (±11,-11)
    kit.planter(-8, 5, 3, 2.2, 'wall2');
    kit.planter(8, 5, 3, 2.2, 'wall2');
    kit.column(-11, -11, 0.55, 5, 'pillar');
    kit.column(11, -11, 0.55, 5, 'pillar');

    // 左右通道隔墙：x=±16 两段
    box(-16, -8, 1.2, 4.5, 16, 'wall');
    box(-16, 12, 1.2, 4.5, 10, 'wall');
    box(16, -8, 1.2, 4.5, 16, 'wall');
    box(16, 12, 1.2, 4.5, 10, 'wall');

    // 四个集装箱
    kit.container(-23, -15, 7, 2.8, 3.2, 0, 'metal');
    kit.container(23, -15, 7, 2.8, 3.2, 0, 'metal');
    kit.container(-24, 5, 6, 2.8, 3, 0, 'metal');
    kit.container(24, 5, 6, 2.8, 3, 0, 'metal');

    // 摊位 (±10,-10)，木箱 (0,8)、(±20,13)，油桶、沙袋
    kit.stall(-10, -10, 0, 'crate');
    kit.stall(10, -10, 0, 'crate');
    kit.crate(0, 8, 2, 1.5, 2);
    kit.crate(-20, 13, 1.8, 1.3, 1.8);
    kit.crate(20, 13, 1.8, 1.3, 1.8);
    kit.barrel(-13.5, -3, 'metal');
    kit.barrel(13.5, -3, 'metal');
    kit.sandbags(-13.6, -6, 2.2, 1.1, 0, 'cloth');
    kit.sandbags(13.6, -6, 2.2, 1.1, 0, 'cloth');

    // 装饰：沿墙管线、路灯、条幅、污渍、碎石
    kit.pipe(-21, 3.4, -20, 10, 0, 'metal');
    kit.pipe(21, 3.4, -20, 10, 0, 'metal');
    kit.pipe(0, 3.2, -(b - 1.2), 12, Math.PI / 2, 'metal');
    kit.lamp(0, -14, 'metal');
    kit.lamp(-12, 2, 'metal');
    kit.lamp(12, 2, 'metal');
    var bannerTex = Tex.banner({ base: '#2e4a6b', accent: '#d8e2ee' });
    kit.banner(-9, 3.3, -(b - 1.35), 2.2, 3.6, Math.PI, bannerTex);
    kit.banner(9, 3.3, -(b - 1.35), 2.2, 3.6, Math.PI, bannerTex);
    kit.stain(-5, -8, 5, 3.6, 0.5);
    kit.stain(6, -14, 4.2, 3, 1.4);
    kit.stain(11, 6, 3.4, 2.6, 0.2);
    kit.rubble(0, -28, 34, 26, 'wall2');
    kit.rubble(-20, -20, 16, 12, 'wall2');
    kit.rubble(20, -20, 16, 12, 'wall2');
  }

  /* ===== 地图定义 ===== */
  var MAPS = {
    redsand: {
      name: '赤沙回廊',
      desc: '砂岩旧城 · 三路交火',
      category: 'tactical',
      enemyStyle: 'zombie',
      nav: true,
      blockBullets: true,
      showGrid: false,
      bound: 30,
      spawn: { x: 0, z: 20 },
      buyRadius: 5.5,
      bg: 0xc8b48e, fogNear: 42, fogFar: 150,
      ground: 0xc9a86e, gridA: 0xb08c58, gridB: 0x9c7448,
      wall: 0xc8a26a, crate: 0x8a5f34, pillar: 0xb08c58,
      sun: 0xffe9c0, sunPower: 1.2, sunPos: { x: 22, y: 34, z: 12 },
      ambient: 0xc8a980, sky: 0xe8cf9c, bounce: 0x6b5638,
      uvTiles: { wall: 4.5, wall2: 4.5, crate: 1.6, pillar: 3.0, metal: 2.0, cloth: 1.2 },
      zombiePalette: { skin: '#7f8a68', shirt: '#5b3f30', pants: '#39342e' },
      spawnPoints: [
        { x: -24, z: -26 }, { x: 0, z: -26 }, { x: 22, z: -25 },
        { x: -25, z: -8 }, { x: 25, z: -8 }
      ],
      build: buildRedsand
    },
    jadecourt: {
      name: '青庭圣所',
      desc: '青石庭院 · 三路围攻',
      category: 'tactical',
      enemyStyle: 'zombie',
      nav: true,
      blockBullets: true,
      showGrid: false,
      bound: 28,
      spawn: { x: 0, z: 18 },
      buyRadius: 5.5,
      bg: 0x9fbec4, fogNear: 36, fogFar: 135,
      ground: 0x93a49a, gridA: 0x8a9a8e, gridB: 0x5f6d64,
      wall: 0x8a9a8e, crate: 0x7c6244, pillar: 0xa8b5a8,
      sun: 0xeaf2f6, sunPower: 1.0, sunPos: { x: -18, y: 32, z: -14 },
      ambient: 0x9db4b8, sky: 0xd8d2bc, bounce: 0x3a4a48,
      uvTiles: { wall: 4.5, wall2: 4.5, crate: 1.6, pillar: 3.0, metal: 2.0, cloth: 1.2 },
      zombiePalette: { skin: '#76836c', shirt: '#3d4a48', pants: '#2d3333' },
      spawnPoints: [
        { x: -20, z: -24 }, { x: 0, z: -25 }, { x: 20, z: -24 },
        { x: -25, z: -2 }, { x: 25, z: -2 }
      ],
      build: buildJadecourt
    },
    whiteharbor: {
      name: '白港中庭',
      desc: '白灰市集 · 中庭争夺',
      category: 'tactical',
      enemyStyle: 'zombie',
      nav: true,
      blockBullets: true,
      showGrid: false,
      bound: 32,
      spawn: { x: 0, z: 21 },
      buyRadius: 6,
      bg: 0xbcd8e8, fogNear: 44, fogFar: 165,
      ground: 0xb9bcb6, gridA: 0xc6c8c0, gridB: 0x9a9d97,
      wall: 0xd8d5cc, crate: 0x8a6a42, pillar: 0xc6c8c0,
      sun: 0xf6faff, sunPower: 1.1, sunPos: { x: 16, y: 36, z: -18 },
      ambient: 0xc4d2dc, sky: 0xeef0e8, bounce: 0x5a6672,
      uvTiles: { wall: 4.5, wall2: 4.5, crate: 1.6, pillar: 3.0, metal: 2.0, cloth: 1.2 },
      zombiePalette: { skin: '#7c8578', shirt: '#374a5a', pants: '#2c3138' },
      spawnPoints: [
        { x: -26, z: -26 }, { x: 0, z: -28 }, { x: 26, z: -26 },
        { x: -28, z: 0 }, { x: 28, z: 0 }
      ],
      build: buildWhiteharbor
    }
  };

  global.WaveShotMapsExtra = MAPS;
})(window);
