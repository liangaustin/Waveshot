/* 主页逻辑：分类选图 / 地图卡片 / 游戏说明 */
(function () {
  'use strict';

  // ===== 地图选择：分类 + 卡片（localStorage 记忆，?map= 优先由游戏页处理）=====
  const mapSelect = document.getElementById('map-select');
  const catBox = document.getElementById('map-categories');
  const hint = document.getElementById('map-hint');
  const startBtn = document.querySelector('.menu-buttons a.btn.primary');

  if (mapSelect && window.GameMap) {
    let current = GameMap.load();

    // 当前分类 = 当前地图所属分类
    let activeCat = 'pixel';
    for (let i = 0; i < GameMap.LIST.length; i++) {
      if (GameMap.LIST[i].id === current) activeCat = GameMap.LIST[i].category || 'pixel';
    }

    function catInfo(id) {
      for (let i = 0; i < GameMap.CATEGORIES.length; i++) {
        if (GameMap.CATEGORIES[i].id === id) return GameMap.CATEGORIES[i];
      }
      return GameMap.CATEGORIES[0];
    }

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

    function renderCats() {
      if (!catBox) return;
      catBox.innerHTML = '';
      for (let i = 0; i < GameMap.CATEGORIES.length; i++) {
        (function (c) {
          const btn = document.createElement('button');
          btn.className = 'cat-btn' + (c.id === activeCat ? ' active' : '');
          btn.textContent = c.name;
          btn.addEventListener('click', function () {
            if (activeCat === c.id) return;
            activeCat = c.id;
            renderCats();
            renderCards();
            // 切分类自动选中该分类第一张图
            for (let j = 0; j < GameMap.LIST.length; j++) {
              if ((GameMap.LIST[j].category || 'pixel') === activeCat) {
                select(GameMap.LIST[j].id);
                break;
              }
            }
          });
          catBox.appendChild(btn);
        })(GameMap.CATEGORIES[i]);
      }
      if (hint) hint.textContent = catInfo(activeCat).desc;
    }

    function renderCards() {
      mapSelect.innerHTML = '';
      for (let i = 0; i < GameMap.LIST.length; i++) {
        (function (m) {
          if ((m.category || 'pixel') !== activeCat) return;
          const card = document.createElement('div');
          card.className = 'map-card';
          card.setAttribute('data-map', m.id);
          card.innerHTML =
            (m.badge ? '<span class="map-badge">' + m.badge + '</span>' : '') +
            '<b>' + m.name + '</b><span>' + m.desc + '</span>';
          card.addEventListener('click', function () { select(m.id); });
          mapSelect.appendChild(card);
        })(GameMap.LIST[i]);
      }
      highlight();
    }

    renderCats();
    renderCards();
    highlight();
  } else if (hint && window.GameMap) {
    hint.textContent = GameMap.CATEGORIES[0].desc;
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
