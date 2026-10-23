/**
 * enemies-extra.js — 写实僵尸（半写实风格化，非 3A 照片级）
 * 暴露 window.WaveShotEnemies.create(enemy, ctx)
 * ctx: { THREE, scene, enemies, enemyParts, makeHealthBar, palette }
 *
 * 约定：
 * - 几何用共享单位几何 + mesh.scale，材质按 palette 模块级缓存（同图僵尸共享）；
 * - 命中部件写 userData.enemy / userData.hit，并 push 进 enemyParts 与 enemy.parts；
 * - 血迹/贴花不进命中部件；眼睛、血迹、小破布不开投影；
 * - create 负责 enemies.push(enemy)（Enemy 构造函数会提前 return）；
 * - enemy.anim = { armL, armR, legL, legR } 供 game.js 的 Enemy.update 摆动。
 */
(function (global) {
  'use strict';

  // ===== 共享几何（模块级，一次性）=====
  var GEO = null;
  function geos() {
    if (!GEO) {
      var T = global.THREE;
      GEO = {
        box: new T.BoxGeometry(1, 1, 1),
        sphere: new T.SphereGeometry(0.5, 12, 10),
        plane: new T.PlaneGeometry(1, 1)
      };
    }
    return GEO;
  }

  // ===== 共享材质（按 palette 缓存，每张图一套）=====
  var MATS_CACHE = {};
  function getMats(palette) {
    var T = global.THREE;
    palette = palette || {};
    var key = [palette.skin, palette.shirt, palette.pants].join('|');
    if (MATS_CACHE[key]) return MATS_CACHE[key];

    var Tex = global.WaveShotTex || null;
    var skinTex = Tex ? Tex.skin({ base: palette.skin || '#7f8a68' }) : null;
    var shirtTex = Tex ? Tex.cloth({ base: palette.shirt || '#5b3f30' }) : null;
    var pantsTex = Tex ? Tex.cloth({ base: palette.pants || '#39342e' }) : null;
    var bloodTex = Tex ? Tex.blood() : null;

    function clothMat(tex, base) {
      return new T.MeshStandardMaterial(
        tex ? { map: tex, bumpMap: tex, bumpScale: 0.02, roughness: 0.95 }
            : { color: base, roughness: 0.95 });
    }

    var M = {
      skin: new T.MeshStandardMaterial(
        skinTex ? { map: skinTex, bumpMap: skinTex, bumpScale: 0.03, roughness: 0.92 }
                : { color: palette.skin || 0x7f8a68, roughness: 0.92 }),
      shirt: clothMat(shirtTex, palette.shirt || 0x5b3f30),
      pants: clothMat(pantsTex, palette.pants || 0x39342e),
      bone: new T.MeshStandardMaterial({ color: 0xd8d0b4, roughness: 0.55 }),
      hair: new T.MeshStandardMaterial({ color: 0x241e1a, roughness: 0.95 }),
      eye: new T.MeshStandardMaterial({
        color: 0xffb020, emissive: 0xff7b10, emissiveIntensity: 1.3, roughness: 0.35
      }),
      mouth: new T.MeshStandardMaterial({ color: 0x3a1612, roughness: 0.9 }),
      pack: new T.MeshStandardMaterial({ color: 0x2e3626, roughness: 0.9 }),
      rag: new T.MeshStandardMaterial({ color: 0x4a4238, roughness: 1 }),
      tear: new T.MeshStandardMaterial({ color: 0x1b1815, roughness: 1 }),
      blood: new T.MeshStandardMaterial(
        bloodTex ? { map: bloodTex, transparent: true, depthWrite: false, roughness: 0.7 }
                 : { color: 0x5e1210, transparent: true, depthWrite: false, roughness: 0.7 })
    };
    MATS_CACHE[key] = M;
    return M;
  }

  // ===== 拼装 =====
  function create(enemy, ctx) {
    var THREE = ctx.THREE;
    var g = geos();
    var M = getMats(ctx.palette);
    var group = new THREE.Group();
    var parts = [];

    // 命中部件：登记 + 入数组
    function hit(parent, geo, mat, x, y, z, sx, sy, sz, type, shadow) {
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      m.userData.enemy = enemy;
      m.userData.hit = type;
      if (shadow) m.castShadow = true;
      parent.add(m);
      parts.push(m);
      ctx.enemyParts.push(m);
      return m;
    }
    // 装饰（不进命中部件）
    function deco(parent, geo, mat, x, y, z, sx, sy, sz, shadow) {
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.scale.set(sx, sy, sz);
      if (shadow) m.castShadow = true;
      parent.add(m);
      return m;
    }
    function box(parent, mat, x, y, z, sx, sy, sz, type, shadow) {
      return hit(parent, g.box, mat, x, y, z, sx, sy, sz, type, shadow);
    }
    function ball(parent, mat, x, y, z, r, type, shadow) {
      return hit(parent, g.sphere, mat, x, y, z, r * 2, r * 2, r * 2, type, shadow);
    }

    // --- 躯干核心 ---
    box(group, M.pants, 0, 1.00, 0, 0.40, 0.26, 0.28, 'body', true);   // 骨盆
    box(group, M.shirt, 0, 1.33, 0, 0.52, 0.52, 0.32, 'body', true);   // 躯干
    box(group, M.skin, 0, 1.66, 0, 0.14, 0.14, 0.14, 'body', false);   // 脖子

    // --- 头部 ---
    ball(group, M.skin, 0, 1.86, 0, 0.21, 'head', true);               // 头
    box(group, M.skin, 0, 1.72, 0.10, 0.26, 0.10, 0.22, 'head', true); // 下颚
    box(group, M.mouth, 0, 1.735, 0.215, 0.16, 0.035, 0.02, 'head', false); // 嘴
    ball(group, M.eye, -0.085, 1.885, 0.185, 0.032, 'head', false);    // 发光眼
    ball(group, M.eye, 0.085, 1.885, 0.185, 0.032, 'head', false);
    box(group, M.hair, 0, 1.985, -0.03, 0.36, 0.16, 0.36, 'head', true); // 头发

    // --- 手臂（肩关节组 → 上臂 → 肘组 → 前臂/手）---
    function buildArm(side) { // side: -1 左 / +1 右
      var arm = new THREE.Group();
      arm.position.set(side * 0.38, 1.52, 0);
      group.add(arm);

      ball(group, M.skin, side * 0.34, 1.52, 0, 0.11, 'limb', true);          // 肩球
      box(group, M.shirt, side * 0.36, 1.545, 0, 0.22, 0.14, 0.26, 'limb', true); // 肩甲

      box(arm, M.skin, 0, -0.24, 0, 0.15, 0.42, 0.15, 'limb', true);          // 上臂

      var elbow = new THREE.Group();
      elbow.position.y = -0.46;
      arm.add(elbow);
      ball(elbow, M.skin, 0, 0, 0, 0.085, 'limb', false);                     // 肘
      // 一侧小臂用骨材质，破败感
      var foreMat = (side === 1) ? M.bone : M.skin;
      box(elbow, foreMat, 0, -0.22, 0, 0.13, 0.40, 0.13, 'limb', true);       // 前臂
      box(elbow, M.skin, 0, -0.44, 0.02, 0.13, 0.16, 0.10, 'limb', false);    // 手
      return arm;
    }
    var armL = buildArm(-1);
    var armR = buildArm(1);

    // --- 腿（髋关节组 → 大腿 → 膝组 → 小腿/脚）---
    function buildLeg(side) {
      var leg = new THREE.Group();
      leg.position.set(side * 0.15, 0.98, 0);
      group.add(leg);

      box(leg, M.pants, 0, -0.23, 0, 0.19, 0.46, 0.20, 'limb', true);         // 大腿

      var knee = new THREE.Group();
      knee.position.y = -0.46;
      leg.add(knee);
      ball(knee, M.pants, 0, 0, 0, 0.095, 'limb', false);                     // 膝
      box(knee, M.pants, 0, -0.22, 0, 0.16, 0.42, 0.17, 'limb', true);        // 小腿
      box(knee, M.tear, 0, -0.06, 0.10, 0.16, 0.16, 0.06, 'limb', false);     // 护膝
      box(knee, M.tear, 0, -0.44, 0.05, 0.18, 0.12, 0.30, 'limb', true);      // 靴子
      return leg;
    }
    var legL = buildLeg(-1);
    var legR = buildLeg(1);

    // --- 背包 / 破布 / 破口 / 血迹 ---
    box(group, M.pack, 0, 1.36, -0.30, 0.36, 0.44, 0.18, 'body', true);       // 战术背包
    box(group, M.rag, -0.12, 0.82, 0.16, 0.12, 0.26, 0.02, 'body', false);    // 腰部破布 ×3
    box(group, M.rag, 0, 0.80, 0.17, 0.12, 0.26, 0.02, 'body', false);
    box(group, M.rag, 0.12, 0.83, 0.16, 0.12, 0.26, 0.02, 'body', false);
    deco(group, g.box, M.tear, -0.14, 1.22, 0.163, 0.14, 0.18, 0.01, false);  // 衣服破口
    deco(group, g.plane, M.blood, 0.10, 1.35, 0.166, 0.30, 0.25, 1, false);   // 胸口血迹
    deco(group, g.plane, M.blood, 0.05, 1.82, 0.203, 0.16, 0.18, 1, false);   // 脸部血迹

    // --- 血条（墙后遮挡）---
    enemy.healthBar = ctx.makeHealthBar(true);
    enemy.healthBar.sprite.position.set(0, 2.45, 0);
    group.add(enemy.healthBar.sprite);

    // --- 落位 ---
    enemy.baseScale = 0.93 + Math.random() * 0.14;
    group.scale.set(enemy.baseScale, enemy.baseScale, enemy.baseScale);
    group.position.set(enemy.x, 0, enemy.z);
    enemy.group = group;
    enemy.parts = parts;
    enemy.anim = { armL: armL, armR: armR, legL: legL, legR: legR };

    ctx.scene.add(group);
    ctx.enemies.push(enemy);
  }

  global.WaveShotEnemies = { create: create };
})(window);
