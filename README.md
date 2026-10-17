# 🎯 WaveShot · 空气射击

![License](https://img.shields.io/badge/license-MIT-green) ![No-Deps](https://img.shields.io/badge/dependencies-zero-brightgreen) ![Three.js](https://img.shields.io/badge/Three.js-r128-blue) ![Play](https://img.shields.io/badge/play-double--click%20index.html-orange)

> 打开网页就能玩的 3D 波次生存射击游戏 —— 零依赖、零安装、双击即玩。

每一波你都可以说「这波稳了」，然后在第 8 波被围殴致死。🔫

## ✨ 特性

- 🔫 **4 把枪**：格洛克手枪（默认免费）/ 霰弹枪 / 突击步枪 / AWM 狙击枪（右键开镜）
- 💰 **CS 式经济**：开局 $1000，击杀 +$300，通关一波 +$500，站购买区按 <kbd>B</kbd> 买枪
- 🎯 **部位伤害**：爆头 ×4 / 躯干 ×1 / 四肢 ×0.75
- 🛡️ **装备系统**：护甲（受伤减伤 50%）+ 医疗包（回复 50 生命）
- 🌊 **无尽波次**：敌人血量、速度逐波提升，看你能撑到第几波
- 🗺️ **3 张地图**：仓库（掩体密集）/ 沙漠（开阔岩台）/ 雪原（冰柱环绕）
- 🔊 **Web Audio 合成音效**：开火、命中、换弹全是代码合成，零音频文件
- ⚙️ **设置页**：灵敏度 / 音量 / 画质 / 反转 Y 轴 / 准星颜色

## 🚀 快速开始

1. 下载或 `git clone` 本仓库
2. **双击 `index.html`**（推荐 Chrome / Edge）
3. 选地图 → 开始游戏

> 完全离线可玩，不需要网络、不需要安装任何东西。

## 🎮 操作

| 按键 | 功能 | 按键 | 功能 |
| --- | --- | --- | --- |
| 鼠标移动 | 视角 | <kbd>R</kbd> | 换弹 |
| 鼠标左键 | 射击 | <kbd>B</kbd> | 打开购买菜单 |
| 鼠标右键 | 开镜（狙击枪） | <kbd>1</kbd>~<kbd>4</kbd> | 切换武器 |
| <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> | 移动 | <kbd>Esc</kbd> | 暂停 |
| <kbd>Shift</kbd> | 冲刺 | <kbd>空格</kbd> | 跳跃 |

每波开始有 **12 秒准备时间**：站在出生点绿色圈内按 <kbd>B</kbd> 购买。

## 🔫 武器与经济

| 键位 | 武器 | 价格 | 伤害 | 弹匣 | 特点 |
| --- | --- | --- | --- | --- | --- |
| 1 | 格洛克手枪 | 免费 | 34 | 12 | 默认武器 |
| 2 | 霰弹枪 | $900 | 12 × 8 颗 | 6 | 近距离毁灭 |
| 3 | 突击步枪 | $2700 | 16 | 30 | 全自动泼水 |
| 4 | AWM 狙击枪 | $4750 | 115+ | 5 | 爆头一击必杀，伤害随波次成长 |
| 5 | 补满弹药 | $200 | - | - | 当前武器 |
| 6 | 护甲 | $650 | - | - | 受伤减伤 50%（一次性） |
| 7 | 医疗包 | $300 | - | - | 回复 50 生命 |

## 📁 项目结构

```
WaveShot/
├── index.html        主页（地图选择 / 设置 / 说明）
├── game.html         游戏页
├── settings.html     设置页
├── css/style.css     样式与 HUD
├── js/
│   ├── game.js       核心逻辑（地图 / 枪械 / 敌人 / 波次）
│   ├── shared.js     设置与地图本地存储
│   ├── main.js       主页逻辑
│   └── settings.js   设置页逻辑
└── lib/three.min.js  Three.js r128
```

## 🛠️ 技术说明

- 纯 HTML / CSS / JavaScript，唯一外部库是 Three.js（渲染）
- 射线检测命中判定 + 部位伤害（头 / 躯干 / 四肢分组打点）
- 敌人 AI：追击 + 近战，波次生成时血量速度递增
- 设置与地图选择存 localStorage，换设备不丢

## 📄 许可

[MIT License](LICENSE)

本项目使用 [Three.js](https://threejs.org/)（MIT License，Copyright © 2010-2024 three.js authors）。
