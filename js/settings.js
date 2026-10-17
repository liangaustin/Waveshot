/* 设置页逻辑：读取 / 修改 / 保存设置 */
(function () {
  'use strict';

  const settings = GameSettings.loadSettings();

  const els = {
    sensitivity: document.getElementById('sensitivity'),
    volume: document.getElementById('volume'),
    quality: document.getElementById('quality'),
    invertY: document.getElementById('invertY'),
    crosshairColor: document.getElementById('crosshairColor'),
    sensitivityVal: document.getElementById('sensitivity-val'),
    volumeVal: document.getElementById('volume-val')
  };

  function render() {
    els.sensitivity.value = settings.sensitivity;
    els.volume.value = settings.volume;
    els.quality.value = settings.quality;
    els.invertY.checked = !!settings.invertY;
    els.crosshairColor.value = settings.crosshairColor;
    els.sensitivityVal.textContent = Number(settings.sensitivity).toFixed(4);
    els.volumeVal.textContent = Math.round(settings.volume * 100) + '%';
  }

  els.sensitivity.addEventListener('input', function () {
    settings.sensitivity = parseFloat(els.sensitivity.value);
    els.sensitivityVal.textContent = settings.sensitivity.toFixed(4);
  });

  els.volume.addEventListener('input', function () {
    settings.volume = parseFloat(els.volume.value);
    els.volumeVal.textContent = Math.round(settings.volume * 100) + '%';
  });

  els.quality.addEventListener('change', function () {
    settings.quality = els.quality.value;
  });

  els.invertY.addEventListener('change', function () {
    settings.invertY = els.invertY.checked;
  });

  els.crosshairColor.addEventListener('input', function () {
    settings.crosshairColor = els.crosshairColor.value;
  });

  document.getElementById('save-btn').addEventListener('click', function () {
    GameSettings.saveSettings(settings);
    location.href = 'index.html';
  });

  document.getElementById('back-btn').addEventListener('click', function () {
    location.href = 'index.html';
  });

  render();
})();
