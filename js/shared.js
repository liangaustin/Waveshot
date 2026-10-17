/* 共享模块：设置的读取与保存（基于 localStorage） */
(function (global) {
  'use strict';

  const DEFAULTS = {
    sensitivity: 0.0022,   // 鼠标灵敏度
    volume: 0.7,           // 音量 0~1
    invertY: false,        // 是否反转 Y 轴
    quality: 'high',       // 画质 low | medium | high
    crosshairColor: '#00ff88'
  };

  const KEY = 'fps3d_settings';

  function loadSettings() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return Object.assign({}, DEFAULTS);
      return Object.assign({}, DEFAULTS, JSON.parse(raw));
    } catch (e) {
      return Object.assign({}, DEFAULTS);
    }
  }

  function saveSettings(s) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {
      /* 忽略存储异常（隐私模式等） */
    }
  }

  /* 地图列表（id 需与 js/game.js 中的 MAP_DEFS 对应） */
  const MAP_LIST = [
    { id: 'warehouse', name: '仓库', desc: '工业仓库 · 掩体密集' },
    { id: 'dust', name: '沙漠', desc: '开阔沙地 · 四角岩台' },
    { id: 'snow', name: '雪原', desc: '雪地旷野 · 冰柱环绕' }
  ];

  const MAP_KEY = 'fps3d_map';

  function loadMap() {
    try {
      const id = localStorage.getItem(MAP_KEY);
      for (let i = 0; i < MAP_LIST.length; i++) {
        if (MAP_LIST[i].id === id) return id;
      }
    } catch (e) { /* 忽略 */ }
    return MAP_LIST[0].id;
  }

  function saveMap(id) {
    try {
      localStorage.setItem(MAP_KEY, id);
    } catch (e) { /* 忽略 */ }
  }

  global.GameMap = {
    LIST: MAP_LIST,
    load: loadMap,
    save: saveMap
  };

  global.GameSettings = {
    DEFAULTS: DEFAULTS,
    loadSettings: loadSettings,
    saveSettings: saveSettings
  };
})(window);
