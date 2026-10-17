/* 主页逻辑：展开 / 收起游戏说明 */
(function () {
  'use strict';

  // ===== 地图选择（保存到 localStorage，游戏页读取；链接同时带上 ?map= 参数免底）=====
  const mapSelect = document.getElementById('map-select');
  const startBtn = document.querySelector('.menu-buttons a.btn.primary');

  if (mapSelect && window.GameMap) {
    let current = GameMap.load();

    function highlight() {
      const cards = mapSelect.querySelectorAll('.map-card');
      for (let i = 0; i < cards.length; i++) {
        cards[i].classList.toggle('active', cards[i].getAttribute('data-map') === current);
      }
      if (startBtn) startBtn.setAttribute('href', 'game.html?map=' + current);
    }

    function select(id) {
      current = id;
      GameMap.save(id);
      highlight();
    }

    for (let i = 0; i < GameMap.LIST.length; i++) {
      (function (m) {
        const card = document.createElement('div');
        card.className = 'map-card';
        card.setAttribute('data-map', m.id);
        card.innerHTML = '<b>' + m.name + '</b><span>' + m.desc + '</span>';
        card.addEventListener('click', function () { select(m.id); });
        mapSelect.appendChild(card);
      })(GameMap.LIST[i]);
    }
    highlight();
  }

  const btn = document.getElementById('help-btn');
  const box = document.getElementById('help-box');

  if (btn && box) {
    btn.addEventListener('click', function () {
      const hidden = box.style.display === 'none' || box.style.display === '';
      box.style.display = hidden ? 'block' : 'none';
    });
  }
})();
