/* WaveShot · 空气射击 - 核心游戏逻辑 */
(function () {
  'use strict';

  // ===== 设置 =====
  const settings = GameSettings.loadSettings();

  // ===== 地图定义（3 张地图：各自独立调色板、掩体布局、出生点与购买区）=====
  // box(x, z, 宽, 高, 深, 材质)：材质可选 'wall' / 'crate' / 'pillar'
  const MAP_DEFS = {
    warehouse: {
      name: '仓库',
      desc: '工业仓库 · 掩体密集',
      bg: 0x10151e, fogNear: 30, fogFar: 95,
      ground: 0x2b333f, gridA: 0x3c4856, gridB: 0x232c37,
      wall: 0x4b5768, crate: 0x7a5230, pillar: 0x5a6778,
      sun: 0xfff2dd, sunPower: 1.0, ambient: 0x8899bb, sky: 0xbfd4ff, bounce: 0x2a2018,
      bound: 25, spawn: { x: 0, z: 0 }, buyRadius: 6.5,
      build: function (box, b) {
        box(0, -(b + 1), b * 2 + 8, 5, 3, 'wall');
        box(0, b + 1, b * 2 + 8, 5, 3, 'wall');
        box(-(b + 1), 0, 3, 5, b * 2 + 8, 'wall');
        box(b + 1, 0, 3, 5, b * 2 + 8, 'wall');

        box(-12, -12, 3, 2.2, 3, 'crate');
        box(12, -12, 3, 2.2, 3, 'crate');
        box(-12, 12, 3, 2.2, 3, 'crate');
        box(12, 12, 3, 2.2, 3, 'crate');
        box(0, -6, 6, 2.6, 1.5, 'crate');
        box(-7, 7, 1.6, 3.4, 1.6, 'pillar');
        box(7, 7, 1.6, 3.4, 1.6, 'pillar');
        box(-3, 2, 4, 1.6, 1.2, 'crate');
        box(3, -2, 4, 1.6, 1.2, 'crate');
        box(0, 16, 2.2, 2.4, 2.2, 'pillar');
        box(16, 0, 2.2, 2.4, 2.2, 'pillar');
        box(-16, 0, 2.2, 2.4, 2.2, 'pillar');
        box(8, -17, 3, 1.8, 1.5, 'crate');
        box(-8, -17, 3, 1.8, 1.5, 'crate');
      }
    },
    dust: {
      name: '沙漠',
      desc: '开阔沙地 · 四角岩台',
      bg: 0x2a2419, fogNear: 36, fogFar: 115,
      ground: 0x8a7248, gridA: 0xa08a5c, gridB: 0x6f5c3a,
      wall: 0x9c8452, crate: 0x7a5230, pillar: 0x6b5a3c,
      sun: 0xffe9b0, sunPower: 1.15, ambient: 0xa89878, sky: 0xd8c090, bounce: 0x3a2f1c,
      bound: 28, spawn: { x: 0, z: 0 }, buyRadius: 7,
      build: function (box, b) {
        box(0, -(b + 1), b * 2 + 8, 5, 3, 'wall');
        box(0, b + 1, b * 2 + 8, 5, 3, 'wall');
        box(-(b + 1), 0, 3, 5, b * 2 + 8, 'wall');
        box(b + 1, 0, 3, 5, b * 2 + 8, 'wall');

        box(-13, -13, 7, 3.2, 7, 'pillar');
        box(13, -13, 7, 3.2, 7, 'pillar');
        box(-13, 13, 7, 3.2, 7, 'pillar');
        box(13, 13, 7, 3.2, 7, 'pillar');
        box(0, -20, 9, 1.6, 2.5, 'crate');
        box(0, 20, 9, 1.6, 2.5, 'crate');
        box(-20, 0, 2.5, 1.6, 9, 'crate');
        box(20, 0, 2.5, 1.6, 9, 'crate');
        box(-8, 6, 2.2, 4, 2.2, 'pillar');
        box(8, -6, 2.2, 4, 2.2, 'pillar');
        box(6, 8, 3, 1.4, 3, 'crate');
        box(-6, -8, 3, 1.4, 3, 'crate');
      }
    },
    snow: {
      name: '雪原',
      desc: '雪地旷野 · 冰柱环绕',
      bg: 0x9db4c6, fogNear: 26, fogFar: 100,
      ground: 0xc3d2df, gridA: 0xa2b4c5, gridB: 0x8296aa,
      wall: 0x8ea9bf, crate: 0x6f5a44, pillar: 0xbfe2f2,
      sun: 0xf0f6ff, sunPower: 1.05, ambient: 0xa8c0d8, sky: 0xe8f4ff, bounce: 0x6a7f94,
      bound: 26, spawn: { x: 0, z: 0 }, buyRadius: 6.5,
      build: function (box, b) {
        box(0, -(b + 1), b * 2 + 8, 5, 3, 'wall');
        box(0, b + 1, b * 2 + 8, 5, 3, 'wall');
        box(-(b + 1), 0, 3, 5, b * 2 + 8, 'wall');
        box(b + 1, 0, 3, 5, b * 2 + 8, 'wall');

        box(-11, -11, 6, 1.8, 2, 'crate');
        box(11, 11, 6, 1.8, 2, 'crate');
        box(-11, 11, 2, 1.8, 6, 'crate');
        box(11, -11, 2, 1.8, 6, 'crate');
        box(-8, 0, 1.6, 5, 1.6, 'pillar');
        box(8, 0, 1.6, 5, 1.6, 'pillar');
        box(0, -8, 1.6, 5, 1.6, 'pillar');
        box(0, 8, 1.6, 5, 1.6, 'pillar');
        box(-17, 0, 2.5, 3, 10, 'pillar');
        box(17, 0, 2.5, 3, 10, 'pillar');
        box(0, 17, 10, 3, 2.5, 'pillar');
        box(0, -17, 10, 3, 2.5, 'pillar');
        box(-8, -17, 4, 1.5, 3, 'crate');
        box(8, 17, 4, 1.5, 3, 'crate');
      }
    }
  };

  // 合并战术禁区新图（maps-extra.js）
  if (window.WaveShotMapsExtra) {
    Object.assign(MAP_DEFS, window.WaveShotMapsExtra);
  }

  // 优先读 URL 参数（?map=dust），防止 file:// 下 localStorage 失效导致换图不生效
  const urlMap = (location.search.match(/[?&]map=([A-Za-z0-9_-]+)/) || [])[1];
  const mapId = (urlMap && MAP_DEFS[urlMap]) ? urlMap
    : ((window.GameMap && GameMap.load) ? GameMap.load() : 'warehouse');
  const MAP = MAP_DEFS[mapId] || MAP_DEFS.warehouse;

  // ===== DOM 引用 =====
  const $ = function (id) { return document.getElementById(id); };
  const healthFill = $('health-fill');
  const healthText = $('health-text');
  const waveText = $('wave-text');
  const scoreText = $('score-text');
  const killsText = $('kills-text');
  const weaponName = $('weapon-name');
  const ammoText = $('ammo-text');
  const hitmarker = $('hitmarker');
  const damageFlash = $('damage-flash');
  const overlay = $('overlay');
  const overlayTitle = $('overlay-title');
  const overlaySub = $('overlay-sub');
  const gameOverEl = $('game-over');
  const finalScore = $('final-score');
  const finalKills = $('final-kills');
  const crosshair = $('crosshair');
  crosshair.style.setProperty('--cc', settings.crosshairColor);
  const moneyText = $('money-text');
  const slotEls = [$('slot-0'), $('slot-1'), $('slot-2'), $('slot-3')];
  const buyMenu = $('buy-menu');
  const buyStatus = $('buy-status');
  const buyMoneyEl = $('buy-money');
  const buyItems = [$('buy-0'), $('buy-1'), $('buy-2'), $('buy-3')];
  const buyAmmoBtn = $('buy-ammo');
  const buyArmorBtn = $('buy-armor');
  const buyMedBtn = $('buy-med');
  const armorFill = $('armor-fill');
  const armorText = $('armor-text');
  const buyTimerText = $('buy-timer');
  const toastEl = $('toast');
  const scopeEl = $('scope');
  const mapNameEl = $('map-name');
  mapNameEl.textContent = '地图：' + MAP.name + ' · ' + MAP.desc;
  const pauseMenu = $('pause-menu');
  const pauseWaveEl = $('pause-wave');
  const pauseScoreEl = $('pause-score');
  const pauseSensVal = $('pause-sens-val');
  const pauseSens = $('pause-sensitivity');
  const resumeBtn = $('resume-btn');
  const pauseExitBtn = $('pause-exit-btn');
  const pauseTip = $('pause-tip');

  // ===== 渲染器 / 场景 / 相机 =====
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(MAP.bg);
  scene.fog = new THREE.Fog(MAP.bg, MAP.fogNear, MAP.fogFar);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  const renderer = new THREE.WebGLRenderer({ antialias: settings.quality !== 'low' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.quality === 'high' ? 2 : 1));
  renderer.shadowMap.enabled = settings.quality !== 'low';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // ===== 光照（颜色随地图变化）=====
  scene.add(new THREE.AmbientLight(MAP.ambient, 0.55));
  scene.add(new THREE.HemisphereLight(MAP.sky, MAP.bounce, 0.45));
  const sun = new THREE.DirectionalLight(MAP.sun, MAP.sunPower);
  const sunPos = MAP.sunPos || { x: 20, y: 32, z: 14 };
  sun.position.set(sunPos.x, sunPos.y, sunPos.z);
  sun.castShadow = settings.quality !== 'low';
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
  sun.shadow.camera.far = 140;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  // ===== 地面 / 场景物件 =====
  const sceneSolids = [];
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
    new THREE.MeshStandardMaterial({ color: MAP.ground, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  sceneSolids.push(ground);

  const grid = new THREE.GridHelper(140, 48, MAP.gridA, MAP.gridB);
  grid.position.y = 0.02;
  scene.add(grid);
  if (MAP.showGrid === false) grid.visible = false;

  const obstacles = [];
  const matWall = new THREE.MeshStandardMaterial({ color: MAP.wall, roughness: 0.85 });
  const matCrate = new THREE.MeshStandardMaterial({ color: MAP.crate, roughness: 0.9 });
  const matPillar = new THREE.MeshStandardMaterial({ color: MAP.pillar, roughness: 0.7, metalness: 0.2 });
  const MATS = { wall: matWall, crate: matCrate, pillar: matPillar };

  function scaleBoxUV(geo, w, h, d, tile) {
    if (!tile || !geo.attributes || !geo.attributes.uv) return;
    const uv = geo.attributes.uv;
    // BoxGeometry 面顺序 px,nx,py,ny,pz,nz，每面 4 个顶点
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) {
      const su = dims[f][0] / tile;
      const sv = dims[f][1] / tile;
      for (let v = 0; v < 4; v++) {
        const i = f * 4 + v;
        uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
      }
    }
    uv.needsUpdate = true;
  }

  function addBox(x, z, w, h, d, kind) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const tile = MAP.uvTiles ? MAP.uvTiles[kind] : 0;
    if (tile) scaleBoxUV(geo, w, h, d, tile);
    const m = new THREE.Mesh(geo, MATS[kind] || matWall);
    m.position.set(x, h / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    sceneSolids.push(m);
    obstacles.push({ x: x, z: z, halfX: w / 2, halfZ: d / 2 });
    return m;
  }

  // ===== 地图构建 API（新图用；旧图 build(box, b) 忽略第三参）=====
  const mapApi = {
    THREE: THREE, scene: scene, ground: ground, grid: grid, sun: sun,
    box: addBox,
    scaleUV: scaleBoxUV,
    tileFor: function (kind) { return (MAP.uvTiles && MAP.uvTiles[kind]) || 0; },
    deco: function (mesh, shadows) {
      if (shadows !== false) { mesh.castShadow = true; mesh.receiveShadow = true; }
      scene.add(mesh);
      return mesh;
    },
    solid: function (mesh) {
      mesh.castShadow = true; mesh.receiveShadow = true;
      scene.add(mesh);
      sceneSolids.push(mesh);
      return mesh;
    },
    obstacle: function (o) { obstacles.push(o); },
    addMaterial: function (k, m) { MATS[k] = m; },
    mat: function (k) { return MATS[k] || matWall; },
    light: function (l) { scene.add(l); }
  };

  // ===== 按当前地图生成掩体 =====
  MAP.build(addBox, MAP.bound, mapApi);

  // ===== 寻路网格（仅战术图启用；旧图保持直线追击）=====
  const navGrid = (MAP.nav && window.WaveShotNav)
    ? window.WaveShotNav.create({ bound: MAP.bound, obstacles: obstacles, radius: 0.55, cell: 1 })
    : null;

  // ===== 购买区（每波准备时间内站在圈内才能买枪）=====
  const buyRing = new THREE.Mesh(
    new THREE.RingGeometry(MAP.buyRadius - 0.3, MAP.buyRadius, 64),
    new THREE.MeshBasicMaterial({ color: 0x3ddc5f, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
  );
  buyRing.rotation.x = -Math.PI / 2;
  buyRing.position.set(MAP.spawn.x, 0.03, MAP.spawn.z);
  scene.add(buyRing);

  const buyPad = new THREE.Mesh(
    new THREE.CircleGeometry(MAP.buyRadius, 48),
    new THREE.MeshBasicMaterial({ color: 0x3ddc5f, transparent: true, opacity: 0.06, depthWrite: false })
  );
  buyPad.rotation.x = -Math.PI / 2;
  buyPad.position.set(MAP.spawn.x, 0.025, MAP.spawn.z);
  scene.add(buyPad);

  // ===== 武器定义（4 把枪：手枪默认拥有，其余需要购买）=====
  const WEAPONS = {
    pistol:  { name: '格洛克手枪', slot: '手枪',  price: 0,    damage: 34,  fireRate: 0.28,  mag: 12, reserve: 60,  reload: 1.2, auto: false, spread: 0.012,  pellets: 1, recoil: 0.018, length: 0.5,  zoom: 0 },
    shotgun: { name: '霰弹枪',     slot: '霰弹枪', price: 900,  damage: 12,  fireRate: 0.9,   mag: 6,  reserve: 36,  reload: 2.4, auto: false, spread: 0.060,  pellets: 8, recoil: 0.055, length: 0.85, zoom: 0 },
    rifle:   { name: '突击步枪',   slot: '步枪',  price: 2700, damage: 16,  fireRate: 0.095, mag: 30, reserve: 120, reload: 1.8, auto: true,  spread: 0.020,  pellets: 1, recoil: 0.011, length: 0.9,  zoom: 0 },
    sniper:  { name: 'AWM 狙击枪', slot: '狙击枪', price: 4750, damage: 115, fireRate: 1.35,  mag: 5,  reserve: 25,  reload: 3.0, auto: false, spread: 0.0008, pellets: 1, recoil: 0.075, length: 1.15, zoom: 32 }
  };
  const weaponKeys = ['pistol', 'shotgun', 'rifle', 'sniper'];

  // ===== 经济：开局资金 / 击杀奖励 / 通关奖励 / 补弹价格 / 准备时间 =====
  const START_MONEY = 1000;
  const KILL_REWARD = 300;
  const WAVE_BONUS = 500;
  const AMMO_COST = 200;
  const BUY_TIME = 12;
  const ARMOR_COST = 650;          // 护甲：一次性购买，受伤减伤 50%
  const MEDKIT_COST = 300;         // 医疗包：回复 50 HP，可重复购买
  const ARMOR_ABSORB = 0.5;

  // ===== 部位伤害倍率（爆头 / 躯干 / 四肢，参照 CS）=====
  const HIT_MULT = { head: 4, body: 1, limb: 0.75 };

  const player = {
    x: MAP.spawn.x, z: MAP.spawn.z, y: 0, vy: 0,
    yaw: 0, pitch: 0,
    health: 100, maxHealth: 100, armor: false, speed: 6.5, radius: 0.45, eye: 1.7, onGround: true,
    weaponIndex: 0, cooldown: 0, reloading: false, reloadTimer: 0,
    money: START_MONEY,
    owned: {}, ammo: {}, reserve: {}
  };
  for (let i = 0; i < weaponKeys.length; i++) {
    const k = weaponKeys[i];
    player.owned[k] = (k === 'pistol');
    player.ammo[k] = WEAPONS[k].mag;
    player.reserve[k] = WEAPONS[k].reserve;
  }

  function currentKey() { return weaponKeys[player.weaponIndex]; }
  function currentWeapon() { return WEAPONS[currentKey()]; }

  // ===== 第一人称枪械模型 =====
  const gunGroup = new THREE.Group();
  camera.add(gunGroup);
  const gunMeshes = {};
  const gunMuzzles = {};

  const gunMetal = new THREE.MeshStandardMaterial({ color: 0x23272e, roughness: 0.35, metalness: 0.7 });
  const gunDark = new THREE.MeshStandardMaterial({ color: 0x0d0f12, roughness: 0.5, metalness: 0.5 });
  const gunWood = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.8 });

  function gBox(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

  function buildGuns() {
    for (let i = 0; i < weaponKeys.length; i++) {
      const k = weaponKeys[i];
      const w = WEAPONS[k];
      const g = new THREE.Group();
      const len = w.length;

      const body = gBox(0.07, 0.1, len, gunMetal);
      body.position.set(0, 0, -len / 2 + 0.05);
      g.add(body);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len * 0.5, 12), gunDark);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -len * 0.72);
      g.add(barrel);

      const grip = gBox(0.06, 0.16, 0.07, gunDark);
      grip.position.set(0, -0.12, -len * 0.35);
      grip.rotation.x = 0.3;
      g.add(grip);

      const mag = gBox(0.05, 0.14, 0.06, gunMetal);
      mag.position.set(0, -0.12, -len * 0.25);
      mag.rotation.x = -0.15;
      g.add(mag);

      if (k === 'rifle') {
        const stock = gBox(0.06, 0.09, 0.24, gunWood);
        stock.position.set(0, -0.02, 0.14);
        g.add(stock);
        const sight = gBox(0.03, 0.05, 0.06, gunDark);
        sight.position.set(0, 0.08, -len * 0.6);
        g.add(sight);
      }
      if (k === 'shotgun') {
        const pump = gBox(0.08, 0.08, 0.2, gunWood);
        pump.position.set(0, -0.03, -len * 0.6);
        g.add(pump);
      }
      if (k === 'pistol') {
        const sight = gBox(0.02, 0.03, 0.05, gunDark);
        sight.position.set(0, 0.07, -len * 0.6);
        g.add(sight);
      }
      if (k === 'sniper') {
        const stock = gBox(0.06, 0.12, 0.3, gunWood);
        stock.position.set(0, -0.02, 0.16);
        g.add(stock);
        const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 14), gunDark);
        scope.rotation.x = Math.PI / 2;
        scope.position.set(0, 0.09, -len * 0.45);
        g.add(scope);
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.032, 14), gunMetal);
        lens.position.set(0, 0.09, -len * 0.57);
        lens.rotation.y = Math.PI;
        g.add(lens);
        const bolt = gBox(0.05, 0.04, 0.09, gunMetal);
        bolt.position.set(0.05, 0.03, -len * 0.28);
        g.add(bolt);
        const bipodL = gBox(0.03, 0.16, 0.03, gunDark);
        bipodL.position.set(-0.06, -0.14, -len * 0.8);
        bipodL.rotation.z = 0.35;
        g.add(bipodL);
        const bipodR = gBox(0.03, 0.16, 0.03, gunDark);
        bipodR.position.set(0.06, -0.14, -len * 0.8);
        bipodR.rotation.z = -0.35;
        g.add(bipodR);
      }

      const muzzleObj = new THREE.Object3D();
      muzzleObj.position.set(0, 0.02, -len);
      g.add(muzzleObj);

      const flashCanvas = document.createElement('canvas');
      flashCanvas.width = 64; flashCanvas.height = 64;
      const fctx = flashCanvas.getContext('2d');
      const grad = fctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      grad.addColorStop(0, '#fff6c0');
      grad.addColorStop(0.4, '#ffb020');
      grad.addColorStop(1, 'rgba(255,80,0,0)');
      fctx.fillStyle = grad;
      fctx.fillRect(0, 0, 64, 64);
      const flashTex = new THREE.CanvasTexture(flashCanvas);
      const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex, blending: THREE.AdditiveBlending, depthTest: false }));
      flash.scale.set(0.55, 0.55, 1);
      flash.visible = false;
      muzzleObj.add(flash);

      const light = new THREE.PointLight(0xffa040, 0, 8, 2);
      muzzleObj.add(light);

      g.visible = (k === 'pistol');
      gunGroup.add(g);
      gunMeshes[k] = g;
      gunMuzzles[k] = { flash: flash, light: light };
    }
    gunGroup.position.set(0.27, -0.25, -0.45);
  }
  buildGuns();

  let flashUntil = 0;
  function hideAllFlashes() {
    for (let i = 0; i < weaponKeys.length; i++) {
      const k = weaponKeys[i];
      gunMuzzles[k].flash.visible = false;
      gunMuzzles[k].light.intensity = 0;
    }
  }

  // ===== 敌人 =====
  const enemies = [];
  const enemyParts = [];

  function makeHealthBar(depthTest) {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 8;
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: depthTest === true, transparent: true }));
    sprite.scale.set(0.9, 0.11, 1);
    function set(frac) {
      const c = canvas.getContext('2d');
      c.clearRect(0, 0, 64, 8);
      c.fillStyle = 'rgba(0,0,0,0.6)';
      c.fillRect(0, 0, 64, 8);
      c.fillStyle = frac > 0.5 ? '#3ddc5f' : frac > 0.25 ? '#ffb020' : '#ff4b3a';
      c.fillRect(1, 1, 62 * Math.max(0, Math.min(1, frac)), 6);
      tex.needsUpdate = true;
    }
    set(1);
    return { sprite: sprite, set: set };
  }

  const enemyBodyMat = new THREE.MeshStandardMaterial({ color: 0x9a3b3b, roughness: 0.8 });
  const enemyLimbMat = new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.7 });
  const enemyVisorMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0x660000, emissiveIntensity: 0.8 });

  // 敌人风格：像素方块（旧图）/ 写实僵尸（战术图）
  const ENEMY_STYLE = MAP.enemyStyle || 'pixel';

  function Enemy(x, z, hp, speed) {
    this.x = x; this.z = z;
    this.hp = hp; this.maxHp = hp;
    this.speed = speed;
    this.radius = 0.55;
    this.attackRange = 2.1;
    this.attackCd = 0;
    this.dead = false;
    this.removed = false;
    this.flash = 0;
    this.walkT = Math.random() * 6.28;
    this.deathT = 0;
    this.deadTime = 1.0;
    this.navTimer = 0;
    this.navPath = null;
    this.navIndex = 0;

    // 写实僵尸：整体交给 enemies-extra.js 拼装（它自己负责 enemies.push）
    if (ENEMY_STYLE === 'zombie' && window.WaveShotEnemies) {
      window.WaveShotEnemies.create(this, {
        THREE: THREE, scene: scene, enemies: enemies, enemyParts: enemyParts,
        makeHealthBar: makeHealthBar,
        palette: MAP.zombiePalette
      });
      return;
    }

    this.group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.5), enemyBodyMat);
    body.position.y = 1.15;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), enemyLimbMat);
    head.position.y = 1.95;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.06), enemyVisorMat);
    visor.position.set(0, 1.95, 0.21);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.22), enemyLimbMat);
    legL.position.set(-0.18, 0.4, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.22), enemyLimbMat);
    legR.position.set(0.18, 0.4, 0);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.18), enemyBodyMat);
    armL.position.set(-0.5, 1.2, 0);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.18), enemyBodyMat);
    armR.position.set(0.5, 1.2, 0);

    const parts = [body, head, visor, legL, legR, armL, armR];
    for (let i = 0; i < parts.length; i++) {
      parts[i].castShadow = true;
      parts[i].userData.enemy = this;
      this.group.add(parts[i]);
      enemyParts.push(parts[i]);
    }
    this.parts = parts;
    // 部位 → 伤害倍率映射（打点判定用）
    body.userData.hit = 'body'; head.userData.hit = 'head'; visor.userData.hit = 'head';
    legL.userData.hit = 'limb'; legR.userData.hit = 'limb'; armL.userData.hit = 'limb'; armR.userData.hit = 'limb';

    this.healthBar = makeHealthBar();
    this.healthBar.sprite.position.set(0, 2.35, 0);
    this.group.add(this.healthBar.sprite);

    this.group.position.set(x, 0, z);
    scene.add(this.group);
    enemies.push(this);
  }

  Enemy.prototype.update = function (dt) {
    if (this.dead) return;
    const dx = player.x - this.x;
    const dz = player.z - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz) || 0.0001;

    if (this.attackCd > 0) this.attackCd -= dt;

    // 有寻路网格时必须看得见玩家才能近战（不隔墙抓人）
    const canAttack = dist <= this.attackRange &&
      (!navGrid || navGrid.lineClear(this.x, this.z, player.x, player.z));

    if (!canAttack) {
      let tx = player.x, tz = player.z;
      if (navGrid) {
        this.navTimer -= dt;
        if (!this.navPath || this.navTimer <= 0) {
          this.navPath = navGrid.findPath(this.x, this.z, player.x, player.z);
          this.navIndex = 0;
          this.navTimer = 0.6 + Math.random() * 0.35;
        }
        if (this.navPath && this.navPath.length) {
          // 距当前路点 < 0.55m 切下一个；路径耗尽则直接朝玩家
          while (this.navIndex < this.navPath.length &&
                 Math.hypot(this.navPath[this.navIndex].x - this.x,
                            this.navPath[this.navIndex].z - this.z) < 0.55) {
            this.navIndex++;
          }
          if (this.navIndex < this.navPath.length) {
            tx = this.navPath[this.navIndex].x;
            tz = this.navPath[this.navIndex].z;
          }
        }
      }
      const mdx = tx - this.x, mdz = tz - this.z;
      const mdist = Math.sqrt(mdx * mdx + mdz * mdz) || 0.0001;
      this.x += (mdx / mdist) * this.speed * dt;
      this.z += (mdz / mdist) * this.speed * dt;
      resolveCollisions(this);
      this.walkT += dt * (this.speed + 1);
    } else if (this.attackCd <= 0) {
      this.attackCd = 1.0;
      damagePlayer(8 + Math.round(this.maxHp * 0.06));
    }

    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt);
    const bob = Math.abs(Math.sin(this.walkT * 2)) * 0.08;
    this.group.position.set(this.x, bob, this.z);
    this.group.lookAt(player.x, bob, player.z);
    // 受击闪烁叠在 baseScale 上（旧敌人无 baseScale 即 1）
    const s = (this.baseScale || 1) * (1 + Math.max(0, this.flash) * 1.2);
    this.group.scale.set(s, s, s);

    // 写实僵尸关节摆动
    if (this.anim) {
      const swing = Math.sin(this.walkT * 1.7);
      this.anim.armL.rotation.x = swing * 0.55;
      this.anim.armR.rotation.x = -swing * 0.55;
      this.anim.legL.rotation.x = -swing * 0.5;
      this.anim.legR.rotation.x = swing * 0.5;
    }
  };

  Enemy.prototype.takeDamage = function (dmg) {
    if (this.dead) return;
    this.hp -= dmg;
    this.healthBar.set(this.hp / this.maxHp);
    this.flash = 0.12;
    if (this.hp <= 0) this.die();
  };

  Enemy.prototype.die = function () {
    if (this.dead) return;
    this.dead = true;
    this.hp = 0;
    score += 100;
    killCount += 1;
    waveLeft -= 1;
    player.money += KILL_REWARD;
    playSound('death');
    for (let i = 0; i < this.parts.length; i++) {
      const idx = enemyParts.indexOf(this.parts[i]);
      if (idx >= 0) enemyParts.splice(idx, 1);
    }
  };

  Enemy.prototype.updateDead = function (dt) {
    this.deathT += dt;
    const k = Math.min(1, this.deathT / 0.5);
    this.group.rotation.x = k * (Math.PI / 2);
    this.healthBar.sprite.visible = false;
    if (this.deathT > this.deadTime && !this.removed) {
      scene.remove(this.group);
      this.removed = true;
    }
  };

  // 碰撞：把对象（player / enemy，含 x、z、radius）限制在场地内并绕开掩体
  function resolveCollisions(o) {
    const r = o.radius;
    const BOUND = MAP.bound;
    if (o.x < -BOUND + r) o.x = -BOUND + r;
    if (o.x > BOUND - r) o.x = BOUND - r;
    if (o.z < -BOUND + r) o.z = -BOUND + r;
    if (o.z > BOUND - r) o.z = BOUND - r;
    for (let i = 0; i < obstacles.length; i++) {
      const b = obstacles[i];
      const dx = o.x - b.x;
      const dz = o.z - b.z;
      const minX = b.halfX + r;
      const minZ = b.halfZ + r;
      if (Math.abs(dx) < minX && Math.abs(dz) < minZ) {
        const penX = minX - Math.abs(dx);
        const penZ = minZ - Math.abs(dz);
        if (penX < penZ) {
          o.x = b.x + (dx > 0 ? 1 : -1) * minX;
        } else {
          o.z = b.z + (dz > 0 ? 1 : -1) * minZ;
        }
      }
    }
  }

  function separateEnemies() {
    for (let i = 0; i < enemies.length; i++) {
      const a = enemies[i];
      if (a.dead) continue;
      for (let j = i + 1; j < enemies.length; j++) {
        const b = enemies[j];
        if (b.dead) continue;
        const dx = b.x - a.x, dz = b.z - a.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        const min = a.radius + b.radius;
        if (d > 0.0001 && d < min) {
          const push = (min - d) / 2;
          const nx = dx / d, nz = dz / d;
          a.x -= nx * push; a.z -= nz * push;
          b.x += nx * push; b.z += nz * push;
        }
      }
    }
  }

  // ===== 射击 =====
  const raycaster = new THREE.Raycaster();
  let recoilKick = 0;
  let recoilAnim = 0;
  let hitTimer = 0;

  function tryFire() {
    const w = currentWeapon();
    const k = currentKey();
    if (state !== 'playing') return;
    if (player.reloading) return;
    if (player.cooldown > 0) return;
    if (player.ammo[k] <= 0) {
      playSound('empty');
      startReload();
      return;
    }
    fireShot(w, k);
  }

  function fireShot(w, k) {
    player.ammo[k] -= 1;
    player.cooldown = w.fireRate;
    recoilKick += w.recoil;
    recoilAnim = 1;

    const m = gunMuzzles[k];
    m.flash.visible = true;
    m.light.intensity = 6;
    flashUntil = performance.now() + 45;

    playSound(k);

    const origin = new THREE.Vector3();
    camera.getWorldPosition(origin);
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    // 狙击枪伤害随波次增长，保证任何波次都是一枪一个（AWM 特色）
    const dmg = (k === 'sniper') ? Math.max(w.damage, waveEnemyHp(Math.max(1, wave))) : w.damage;
    for (let i = 0; i < w.pellets; i++) {
      const dir = forward.clone();
      dir.x += (Math.random() - 0.5) * 2 * w.spread;
      dir.y += (Math.random() - 0.5) * 2 * w.spread;
      dir.z += (Math.random() - 0.5) * 2 * w.spread;
      dir.normalize();
      shootRay(origin, dir, dmg);
    }
    updateHUD();
  }

  function hitEnemyPart(hit, dmg, dir) {
    const enemy = hit.object.userData.enemy;
    // 部位伤害倍率：爆头 x4 / 躯干 x1 / 四肢 x0.75
    const part = hit.object.userData.hit || 'body';
    const mult = HIT_MULT[part] || 1;
    const dealt = Math.round(dmg * mult);
    showHitmarker(part === 'head');
    const nrm = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : dir.clone().negate();
    spawnImpact(hit.point, nrm);
    playSound('hit');
    if (enemy) enemy.takeDamage(dealt);
  }

  function shootRay(origin, dir, dmg) {
    raycaster.set(origin, dir);
    raycaster.far = 160;
    const hits = raycaster.intersectObjects(enemyParts, false);

    // 新图：子弹会被墙/实体掩体挡住（旧图保持原穿墙行为，不动）
    if (MAP.blockBullets) {
      const sceneHits = raycaster.intersectObjects(sceneSolids, false);
      if (hits.length > 0 && (!sceneHits.length || hits[0].distance < sceneHits[0].distance)) {
        hitEnemyPart(hits[0], dmg, dir);
        return;
      }
      if (sceneHits.length > 0) {
        const sHit = sceneHits[0];
        const nrm = sHit.face ? sHit.face.normal.clone().transformDirection(sHit.object.matrixWorld) : dir.clone().negate();
        spawnImpact(sHit.point, nrm);
      }
      return;
    }

    if (hits.length > 0) {
      hitEnemyPart(hits[0], dmg, dir);
      return;
    }
    const sceneHits = raycaster.intersectObjects(sceneSolids, false);
    if (sceneHits.length > 0) {
      const sHit = sceneHits[0];
      const nrm = sHit.face ? sHit.face.normal.clone().transformDirection(sHit.object.matrixWorld) : dir.clone().negate();
      spawnImpact(sHit.point, nrm);
    }
  }

  function spawnImpact(point, normal) {
    const mat = new THREE.SpriteMaterial({ color: 0xffc040, blending: THREE.AdditiveBlending, depthWrite: false });
    const s = new THREE.Sprite(mat);
    s.position.copy(point).addScaledVector(normal, 0.04);
    s.scale.set(0.35, 0.35, 0.35);
    scene.add(s);
    const start = performance.now();
    function tick() {
      const t = (performance.now() - start) / 160;
      if (t >= 1) { scene.remove(s); mat.dispose(); return; }
      s.scale.setScalar(0.35 * (1 - t));
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function showHitmarker(headshot) {
    hitmarker.classList.add('show');
    hitmarker.classList.toggle('head', !!headshot);
    hitTimer = 0.12;
  }

  function startReload() {
    const k = currentKey();
    const w = currentWeapon();
    if (player.reloading) return;
    if (player.ammo[k] >= w.mag) return;
    if (player.reserve[k] <= 0) return;
    player.reloading = true;
    player.reloadTimer = w.reload;
    playSound('reload');
    updateHUD();
  }

  function finishReload() {
    const k = currentKey();
    const w = currentWeapon();
    const need = w.mag - player.ammo[k];
    const take = Math.min(need, player.reserve[k]);
    player.ammo[k] += take;
    player.reserve[k] -= take;
    player.reloading = false;
    updateHUD();
  }

  function switchWeapon(i, silent) {
    if (i < 0 || i >= weaponKeys.length) return;
    const k = weaponKeys[i];
    if (!player.owned[k]) {
      playSound('deny');
      toast('未拥有 ' + WEAPONS[k].name + ' · 准备时间内按 B 购买');
      return;
    }
    if (player.weaponIndex === i) return;
    player.weaponIndex = i;
    player.reloading = false;
    player.cooldown = 0.15;
    for (let j = 0; j < weaponKeys.length; j++) {
      gunMeshes[weaponKeys[j]].visible = (j === i);
    }
    hideAllFlashes();
    if (!WEAPONS[k].zoom) setAim(false);
    if (!silent) playSound('switch');
    updateHUD();
  }

  // 数字键：购买菜单开着就买东西，否则切枪
  function selectSlot(i) {
    if (buyOpen) buyWeapon(weaponKeys[i]);
    else switchWeapon(i);
  }

  // ===== 瞄准镜（只有狙击枪能开镜）=====
  const BASE_FOV = 75;
  let aiming = false;

  function setAim(v) {
    if (aiming === v) return;
    aiming = v;
    if (scopeEl) scopeEl.classList.toggle('hidden', !aiming);
    if (v) playSound('zoom');
  }
  function toggleAim() {
    if (state !== 'playing' || buyOpen) return;
    if (!currentWeapon().zoom) return;
    setAim(!aiming);
  }

  // ===== 购买系统（CS 式：准备时间内站在绿色购买区按 B 买枪）=====
  let buyOpen = false;
  let buyTime = 0;
  let toastTimer = 0;
  let hudAcc = 0;

  function inBuyZone() {
    const dx = player.x - MAP.spawn.x;
    const dz = player.z - MAP.spawn.z;
    return Math.sqrt(dx * dx + dz * dz) <= MAP.buyRadius;
  }
  function canBuy() { return state === 'playing' && buyTime > 0 && inBuyZone(); }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.add('hidden'); }, 1500);
  }

  function openBuy() {
    if (buyOpen || state !== 'playing') return;
    buyOpen = true;
    buyMenu.classList.remove('hidden');
    // 打开菜单时主动释放鼠标锁：菜单期间不暂停，Esc 只关菜单不触发暂停
    if (document.pointerLockElement) document.exitPointerLock();
    updateBuyMenu();
  }

  function closeBuy(relock) {
    if (!buyOpen) return;
    buyOpen = false;
    buyMenu.classList.add('hidden');
    // 关菜单后重新锁定鼠标（需要用户手势；失败则提示点击画面继续，不打断游戏）
    if (relock && state === 'playing' && !document.pointerLockElement) {
      try {
        const p = renderer.domElement.requestPointerLock();
        if (p && p.catch) p.catch(function () {
          if (state === 'playing' && !document.pointerLockElement) showPause();
        });
      } catch (e) {
        if (state === 'playing' && !document.pointerLockElement) showPause();
      }
    }
  }

  function toggleBuy() {
    if (state !== 'playing') return;
    if (buyOpen) closeBuy(true);
    else openBuy();
  }

  function buyWeapon(k) {
    const w = WEAPONS[k];
    if (!buyOpen) return;
    if (!canBuy()) {
      playSound('deny');
      toast(buyTime > 0 ? '请先回到绿色购买区' : '只能在每波准备时间内购买');
      return;
    }
    if (player.owned[k]) {
      playSound('deny');
      toast(w.name + ' 已拥有');
      return;
    }
    if (player.money < w.price) {
      playSound('deny');
      toast('资金不足：' + w.name + ' 需要 $' + w.price);
      return;
    }
    player.money -= w.price;
    player.owned[k] = true;
    player.ammo[k] = w.mag;
    player.reserve[k] = w.reserve;
    switchWeapon(weaponKeys.indexOf(k), true);
    playSound('buy');
    toast('已装备 ' + w.name + '（' + w.mag + ' / ' + w.reserve + '）');
    updateBuyMenu();
    updateHUD();
  }

  function buyAmmo() {
    if (!buyOpen) return;
    if (!canBuy()) {
      playSound('deny');
      toast(buyTime > 0 ? '请先回到绿色购买区' : '只能在每波准备时间内购买');
      return;
    }
    const k = currentKey();
    const w = WEAPONS[k];
    if (player.ammo[k] >= w.mag && player.reserve[k] >= w.reserve) {
      playSound('deny');
      toast(w.name + ' 弹药已满');
      return;
    }
    if (player.money < AMMO_COST) {
      playSound('deny');
      toast('资金不足：补弹需要 $' + AMMO_COST);
      return;
    }
    player.money -= AMMO_COST;
    player.ammo[k] = w.mag;
    player.reserve[k] = w.reserve;
    playSound('buy');
    toast('已补满 ' + w.name + ' 弹药');
    updateBuyMenu();
    updateHUD();
  }

  function updateBuyMenu() {
    const ready = canBuy();
    for (let i = 0; i < weaponKeys.length; i++) {
      const el = buyItems[i];
      if (!el) continue;
      const k = weaponKeys[i];
      const w = WEAPONS[k];
      const own = player.owned[k];
      const afford = player.money >= w.price;
      el.className = 'buy-item' + (own ? ' owned' : (afford && ready ? ' can' : ' locked'));
      el.querySelector('.bi-name').textContent = w.slot + ' · ' + w.name;
      el.querySelector('.bi-price').textContent = own ? '已拥有' : '$' + w.price;
    }
    if (buyAmmoBtn) {
      const k2 = currentKey();
      const w2 = WEAPONS[k2];
      const full = player.ammo[k2] >= w2.mag && player.reserve[k2] >= w2.reserve;
      buyAmmoBtn.className = 'buy-item ammo' + (full ? ' owned' : (player.money >= AMMO_COST && ready ? ' can' : ' locked'));
      buyAmmoBtn.querySelector('.bi-price').textContent = full ? '已满' : '$' + AMMO_COST;
    }
    if (buyArmorBtn) {
      const has = player.armor;
      buyArmorBtn.className = 'buy-item' + (has ? ' owned' : (player.money >= ARMOR_COST && ready ? ' can' : ' locked'));
      buyArmorBtn.querySelector('.bi-price').textContent = has ? '已拥有' : '$' + ARMOR_COST;
    }
    if (buyMedBtn) {
      const fullHp = player.health >= player.maxHealth;
      buyMedBtn.className = 'buy-item' + (fullHp ? ' owned' : (player.money >= MEDKIT_COST && ready ? ' can' : ' locked'));
      buyMedBtn.querySelector('.bi-price').textContent = fullHp ? '已满' : '$' + MEDKIT_COST;
    }
    if (buyMoneyEl) buyMoneyEl.textContent = '$' + player.money;
    if (buyStatus) {
      buyStatus.textContent = !ready
        ? (buyTime > 0 ? '请先回到绿色购买区' : '非准备时间 · 无法购买')
        : '准备时间剩余 ' + Math.ceil(buyTime) + ' 秒 · 按数字键购买';
    }
  }

  function updateHUD() {
    const p = Math.max(0, player.health);
    healthFill.style.width = p + '%';
    healthText.textContent = Math.ceil(p);
    healthFill.style.background = p > 50
      ? 'linear-gradient(90deg,#2fd36b,#4be07a)'
      : p > 25
        ? 'linear-gradient(90deg,#ff9f1a,#ffb020)'
        : 'linear-gradient(90deg,#ff4b3a,#ff6a55)';
    // 护甲条：拥有时满格亮起，没有时置灰
    if (armorFill) armorFill.style.width = player.armor ? '100%' : '0%';
    if (armorText) armorText.textContent = player.armor ? '护甲已装备' : '无护甲';
    scoreText.textContent = score;
    killsText.textContent = killCount;
    waveText.textContent = '第 ' + Math.max(1, wave) + ' 波';
    const k = currentKey();
    const w = currentWeapon();
    weaponName.textContent = w.name;
    ammoText.textContent = player.ammo[k] + ' / ' + player.reserve[k] + (player.reloading ? ' · 换弹中' : '');
    moneyText.textContent = '$' + player.money;
    for (let i = 0; i < weaponKeys.length; i++) {
      const el = slotEls[i];
      if (!el) continue;
      el.className = 'slot' + (i === player.weaponIndex ? ' active' : '') + (player.owned[weaponKeys[i]] ? '' : ' locked');
    }
    buyTimerText.textContent = buyTime > 0 ? '购买时间 ' + Math.ceil(buyTime) + 's' : '';
    if (buyOpen) updateBuyMenu();
  }

  function damagePlayer(dmg) {
    if (state === 'over') return;
    // 护甲减伤 50%（CS 式一次性护甲）
    const taken = player.armor ? dmg * (1 - ARMOR_ABSORB) : dmg;
    player.health = Math.max(0, player.health - taken);
    damageFlash.classList.add('show');
    setTimeout(function () { damageFlash.classList.remove('show'); }, 200);
    playSound('hurt');
    updateHUD();
    if (player.health <= 0) endGame();
  }

  // ===== 购买：护甲（一次性）/ 医疗包（回血，可重复）=====
  function buyArmor() {
    if (!buyOpen) return;
    if (!canBuy()) {
      playSound('deny');
      toast(buyTime > 0 ? '请先回到绿色购买区' : '只能在每波准备时间内购买');
      return;
    }
    if (player.armor) {
      playSound('deny');
      toast('护甲已拥有');
      return;
    }
    if (player.money < ARMOR_COST) {
      playSound('deny');
      toast('资金不足：护甲需要 $' + ARMOR_COST);
      return;
    }
    player.money -= ARMOR_COST;
    player.armor = true;
    playSound('buy');
    toast('已购买护甲 · 受伤减伤 50%');
    updateBuyMenu();
    updateHUD();
  }

  function buyMedkit() {
    if (!buyOpen) return;
    if (!canBuy()) {
      playSound('deny');
      toast(buyTime > 0 ? '请先回到绿色购买区' : '只能在每波准备时间内购买');
      return;
    }
    if (player.health >= player.maxHealth) {
      playSound('deny');
      toast('生命值已满');
      return;
    }
    if (player.money < MEDKIT_COST) {
      playSound('deny');
      toast('资金不足：医疗包需要 $' + MEDKIT_COST);
      return;
    }
    player.money -= MEDKIT_COST;
    player.health = Math.min(player.maxHealth, player.health + 50);
    playSound('buy');
    toast('已使用医疗包 · +50 生命');
    updateBuyMenu();
    updateHUD();
  }

  // ===== 音效（Web Audio 程序化生成，无需音频文件）=====
  let actx = null;
  function ac() {
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) actx = new AC();
    }
    if (actx && actx.state === 'suspended') actx.resume();
    return actx;
  }
  function noiseBurst(dur, freq, vol) {
    const c = ac();
    if (!c || settings.volume <= 0) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.value = vol * settings.volume;
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start();
  }
  function tone(freq, dur, vol, type, slideTo) {
    const c = ac();
    if (!c || settings.volume <= 0) return;
    const o = c.createOscillator();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol * settings.volume, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  }
  function playSound(name) {
    switch (name) {
      case 'pistol': noiseBurst(0.10, 2200, 0.9); break;
      case 'rifle': noiseBurst(0.09, 1900, 0.7); break;
      case 'shotgun': noiseBurst(0.24, 900, 1.0); break;
      case 'reload':
        tone(500, 0.07, 0.4, 'square');
        setTimeout(function () { tone(360, 0.07, 0.4, 'square'); }, 130);
        break;
      case 'empty': tone(180, 0.06, 0.5, 'square'); break;
      case 'hurt': tone(160, 0.25, 0.7, 'sawtooth', 80); break;
      case 'death': noiseBurst(0.3, 420, 0.6); tone(220, 0.3, 0.4, 'square', 70); break;
      case 'hit': tone(1300, 0.04, 0.28, 'square'); break;
      case 'switch': tone(700, 0.05, 0.25, 'square', 950); break;
      case 'sniper': noiseBurst(0.34, 760, 1.1); tone(140, 0.22, 0.35, 'sawtooth', 60); break;
      case 'buy': tone(880, 0.08, 0.35, 'triangle'); tone(1320, 0.1, 0.3, 'triangle'); break;
      case 'deny': tone(180, 0.12, 0.35, 'sawtooth', 120); break;
      case 'zoom': tone(520, 0.05, 0.2, 'sine', 880); break;
      case 'wave':
        tone(440, 0.14, 0.4, 'sine');
        setTimeout(function () { tone(660, 0.2, 0.4, 'sine'); }, 150);
        break;
    }
  }

  // ===== 游戏状态 =====
  let state = 'menu'; // menu | playing | paused | over
  let pauseStartT = 0;
  let wave = 0;
  let waveLeft = 0;
  let waveDelay = 0;
  let score = 0;
  let killCount = 0;

  function showOverlay(title, sub) {
    overlayTitle.textContent = title;
    overlaySub.textContent = sub;
    overlay.classList.remove('hidden');
  }
  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function showPause() {
    state = 'paused';
    pauseStartT = performance.now();
    // 清空按键/开火状态，防止恢复后卡键
    for (const k in keys) keys[k] = false;
    mouseDown = false;
    closeBuy(false);
    setAim(false);
    if (pauseWaveEl) pauseWaveEl.textContent = Math.max(1, wave);
    if (pauseScoreEl) pauseScoreEl.textContent = score;
    if (pauseSens) pauseSens.value = settings.sensitivity;
    if (pauseSensVal) pauseSensVal.textContent = Number(settings.sensitivity).toFixed(4);
    if (pauseTip) pauseTip.textContent = '点击“继续游戏”或按 Esc 回到战斗 · 退出将返回主页';
    hideOverlay();
    if (pauseMenu) pauseMenu.classList.remove('hidden');
  }

  function hidePause() {
    if (pauseMenu) pauseMenu.classList.add('hidden');
  }

  function startWave(n) {
    wave = n;
    waveLeft = 0;
    waveDelay = 0;
    buyTime = BUY_TIME;
    closeBuy(true);
    updateHUD();
    playSound('wave');
    showOverlay('第 ' + n + ' 波', '准备时间 ' + BUY_TIME + ' 秒 · 站在绿色购买区按 B 买枪');
    setTimeout(function () {
      if (state === 'playing') hideOverlay();
    }, 1800);
  }

  // 准备时间结束后才真正刷怪
  function waveEnemyHp(n) { return 40 + (n - 1) * 18; }

  function spawnWave(n) {
    const count = 2 + n * 2;
    const hp = waveEnemyHp(n);
    const speed = 2.6 + (n - 1) * 0.5;
    waveLeft = count;
    for (let i = 0; i < count; i++) spawnEnemy(hp, speed);
    updateHUD();
  }

  function spawnEnemy(hp, speed) {
    // 战术图：从地图远端/三路预设刷怪点进场
    if (MAP.spawnPoints && MAP.spawnPoints.length) {
      const pts = MAP.spawnPoints;
      let p = null;
      for (let i = 0; i < 40; i++) {
        const cand = pts[Math.floor(Math.random() * pts.length)];
        if (Math.hypot(cand.x - player.x, cand.z - player.z) > 12 &&
            (!navGrid || !navGrid.isBlockedPoint(cand.x, cand.z))) {
          p = cand;
          break;
        }
      }
      if (!p) {
        // 兜底：取最后一个候选并向中心收一点，避免生成在喷泉/墙里
        const last = pts[pts.length - 1];
        p = { x: last.x * 0.85, z: last.z * 0.85 };
      }
      new Enemy(p.x, p.z, hp, speed);
      return;
    }
    let x = 0, z = 0, tries = 0;
    do {
      const ang = Math.random() * Math.PI * 2;
      const r = MAP.bound - 8 + Math.random() * 6;
      x = Math.cos(ang) * r;
      z = Math.sin(ang) * r;
      tries++;
    } while (Math.hypot(x - player.x, z - player.z) < 12 && tries < 30);
    new Enemy(x, z, hp, speed);
  }

  function endGame() {
    state = 'over';
    closeBuy(false);
    setAim(false);
    hidePause();
    if (document.pointerLockElement) document.exitPointerLock();
    finalScore.textContent = score;
    finalKills.textContent = killCount;
    gameOverEl.classList.remove('hidden');
    hideOverlay();
  }

  // ===== 输入 =====
  const keys = {};
  let mouseDown = false;
  let pointerLocked = false;

  function requestLock() {
    try {
      const p = renderer.domElement.requestPointerLock();
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* 忽略 */ }
  }

  // 暂停中恢复鼠标锁：Chrome 按 Esc 后有短暂冷却，失败要提示重试而不是崩
  function tryResume() {
    if (state !== 'paused') return;
    function failed() {
      if (state === 'paused' && pauseTip) {
        pauseTip.textContent = '浏览器暂时拒绝锁定鼠标，请稍候再点一次';
      }
    }
    try {
      const p = renderer.domElement.requestPointerLock();
      if (p && p.catch) p.catch(failed);
    } catch (e) { failed(); }
  }

  window.addEventListener('keydown', function (e) {
    // 暂停时屏蔽 B/1~4/R 等全部游戏输入；再次按 Esc 尝试恢复鼠标锁
    if (state === 'paused') {
      if (e.code === 'Escape' && performance.now() - pauseStartT > 350) tryResume();
      return;
    }
    keys[e.code] = true;
    if (e.code === 'KeyR') startReload();
    if (e.code === 'KeyB') toggleBuy();
    // Esc：只负责关购买菜单（重新锁定鼠标继续游戏）；菜单未开时由浏览器退出鼠标锁 → 暂停
    if (e.code === 'Escape' && buyOpen) closeBuy(true);
    if (e.code === 'Digit1' || e.code === 'Numpad1') selectSlot(0);
    if (e.code === 'Digit2' || e.code === 'Numpad2') selectSlot(1);
    if (e.code === 'Digit3' || e.code === 'Numpad3') selectSlot(2);
    if (e.code === 'Digit4' || e.code === 'Numpad4') selectSlot(3);
    if (e.code === 'Digit5' && buyOpen) buyAmmo();
    if (e.code === 'Digit6' && buyOpen) buyArmor();
    if (e.code === 'Digit7' && buyOpen) buyMedkit();
    if (e.code === 'Space') e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });

  document.addEventListener('mousemove', function (e) {
    if (!pointerLocked) return;
    const sens = settings.sensitivity * (aiming ? 0.4 : 1);
    player.yaw -= e.movementX * sens;
    player.pitch -= e.movementY * sens * (settings.invertY ? -1 : 1);
    const lim = Math.PI / 2 - 0.02;
    if (player.pitch > lim) player.pitch = lim;
    if (player.pitch < -lim) player.pitch = -lim;
  });

  // 购买菜单支持鼠标点击购买（打开菜单时鼠标锁已释放）
  for (let bi = 0; bi < buyItems.length; bi++) {
    (function (idx) {
      if (buyItems[idx]) buyItems[idx].addEventListener('click', function () { buyWeapon(weaponKeys[idx]); });
    })(bi);
  }
  if (buyAmmoBtn) buyAmmoBtn.addEventListener('click', buyAmmo);
  if (buyArmorBtn) buyArmorBtn.addEventListener('click', buyArmor);
  if (buyMedBtn) buyMedBtn.addEventListener('click', buyMedkit);

  // ===== 暂停面板：继续 / 灵敏度 / 退出 =====
  if (resumeBtn) resumeBtn.addEventListener('click', tryResume);
  if (pauseExitBtn) pauseExitBtn.addEventListener('click', function () {
    GameSettings.saveSettings(settings);
    location.href = 'index.html';
  });
  if (pauseSens) {
    pauseSens.value = settings.sensitivity;
    pauseSens.addEventListener('input', function () {
      settings.sensitivity = parseFloat(pauseSens.value);
      if (pauseSensVal) pauseSensVal.textContent = Number(settings.sensitivity).toFixed(4);
    });
    pauseSens.addEventListener('change', function () {
      GameSettings.saveSettings(settings);
    });
  }

  document.addEventListener('mousedown', function (e) {
    if (e.button === 0) {
      mouseDown = true;
      if (pointerLocked && state === 'playing' && !buyOpen) tryFire();
    } else if (e.button === 2) {
      toggleAim();
    }
  });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('mouseup', function (e) {
    if (e.button === 0) mouseDown = false;
  });

  function onStartClick() {
    if (buyOpen) return;
    // 暂停面板期间点击画面不恢复鼠标锁，避免点面板空白误继续
    if (state === 'paused') return;
    if (state === 'menu' || (state === 'playing' && !pointerLocked)) requestLock();
  }
  renderer.domElement.addEventListener('click', onStartClick);
  overlay.addEventListener('click', onStartClick);

  document.addEventListener('pointerlockchange', function () {
    pointerLocked = (document.pointerLockElement === renderer.domElement);
    if (pointerLocked) {
      ac();
      hideOverlay();
      hidePause();
      if (state === 'menu') {
        state = 'playing';
        if (wave === 0) startWave(1);
      } else if (state === 'paused') {
        state = 'playing';
      }
    } else if (state === 'playing' && !buyOpen) {
      // 菜单打开时的主动释放鼠标锁不算暂停
      showPause();
    }
  });

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.getElementById('restart-btn').addEventListener('click', function () { location.reload(); });
  document.getElementById('map-btn').addEventListener('click', function () { location.href = 'index.html'; });
  document.getElementById('menu-btn').addEventListener('click', function () { location.href = 'index.html'; });

  // ===== 更新逻辑 =====
  function updatePlayer(dt) {
    let mx = 0, mz = 0;
    if (keys['KeyW'] || keys['ArrowUp']) mz -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) mz += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
    const sprint = (keys['ShiftLeft'] || keys['ShiftRight']) ? 1.5 : 1;
    const sp = player.speed * sprint;
    if (mx !== 0 || mz !== 0) {
      const len = Math.sqrt(mx * mx + mz * mz);
      const nx = mx / len, nz = mz / len;
      const sinY = Math.sin(player.yaw), cosY = Math.cos(player.yaw);
      player.x += (nx * cosY + nz * sinY) * sp * dt;
      player.z += (nz * cosY - nx * sinY) * sp * dt;
      resolveCollisions(player);
    }
    if (keys['Space'] && player.onGround) {
      player.vy = 8.5;
      player.onGround = false;
    }
    player.vy -= 25 * dt;
    player.y += player.vy * dt;
    if (player.y <= 0) { player.y = 0; player.vy = 0; player.onGround = true; }
  }

  function updateShooting(dt) {
    if (player.cooldown > 0) player.cooldown -= dt;
    const w = currentWeapon();
    if (w.auto && mouseDown && !buyOpen) tryFire();
    if (player.reloading) {
      player.reloadTimer -= dt;
      if (player.reloadTimer <= 0) finishReload();
    }
  }

  function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.dead) {
        e.updateDead(dt);
        if (e.removed) enemies.splice(i, 1);
      } else {
        e.update(dt);
      }
    }
    separateEnemies();
  }

  function updateWaves(dt) {
    if (state !== 'playing') return;

    // 准备时间：倒计时结束后刷怪
    if (buyTime > 0) {
      buyTime -= dt;
      if (buyTime <= 0) {
        buyTime = 0;
        closeBuy(true);
        if (state === 'playing') hideOverlay();
        spawnWave(wave);
      }
      // HUD/菜单刷新降频到 10Hz，避免每帧写 DOM
      hudAcc += dt;
      if (hudAcc >= 0.1) { hudAcc = 0; updateHUD(); }
      return;
    }

    if (wave <= 0 || waveLeft > 0) return;
    let alive = false;
    for (let i = 0; i < enemies.length; i++) {
      if (!enemies[i].dead) { alive = true; break; }
    }
    if (!alive) {
      waveDelay += dt;
      if (waveDelay > 2.5) {
        waveDelay = 0;
        player.money += WAVE_BONUS;
        toast('第 ' + wave + ' 波清空 · 奖励 $' + WAVE_BONUS);
        startWave(wave + 1);
      }
    }
  }

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());
    const t = performance.now();

    if (state === 'playing') {
      updatePlayer(dt);
      updateShooting(dt);
      updateEnemies(dt);
      updateWaves(dt);
    }

    recoilKick *= Math.pow(0.0006, dt);
    if (recoilKick < 0.0001) recoilKick = 0;
    recoilAnim = Math.max(0, recoilAnim - dt * 6);
    gunGroup.position.z = -0.45 + recoilAnim * 0.12;
    gunGroup.position.y = -0.25 + recoilAnim * 0.05;
    gunGroup.rotation.x = recoilAnim * 0.3;

    // 狙击镜视角过渡（开镜时隐藏手中枪械与准星）
    const targetFov = aiming ? WEAPONS[currentKey()].zoom : BASE_FOV;
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 10);
      if (Math.abs(camera.fov - targetFov) < 0.05) camera.fov = targetFov;
      camera.updateProjectionMatrix();
    }
    gunGroup.visible = !aiming;
    crosshair.classList.toggle('hidden', aiming);

    // 购买区：准备时间内闪烁提示
    buyRing.material.opacity = buyTime > 0 ? 0.35 + Math.abs(Math.sin(t / 320)) * 0.5 : 0.18;

    if (flashUntil && t > flashUntil) {
      flashUntil = 0;
      hideAllFlashes();
    }
    if (hitTimer > 0) {
      hitTimer -= dt;
      if (hitTimer <= 0) hitmarker.classList.remove('show');
    }

    camera.position.set(player.x, player.y + player.eye, player.z);
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch + recoilKick;

    renderer.render(scene, camera);
  }

  // ===== 初始化 =====
  updateHUD();
  showOverlay(MAP.name + ' · WaveShot', '点击画面开始游戏 · 每波准备时间内按 B 购买武器');
  animate();
})();
