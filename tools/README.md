# tools

首屏「转换示意」那两张图不是手工做的图，是脚本跑出来的，跑的是网站自己的转换代码。

## 什么时候需要用

- 改了 `dist/palette.js` 的色卡
- 想换一张示例图
- 想调格数或颜色上限

## 怎么用

只重做图纸（示例图不换）：

```bash
python3 tools/make-demo.py
```

换一张示例图：

```bash
python3 tools/make-demo.py --source ~/Desktop/新图.png --nose none
```

新图的背景必须是纯色（脚本从四角向内去背，不会破坏被描边圈住的区域）。
`--nose` 是「转换后用画笔补鼻子黄色」的开关，换了图一般要关掉。

## 跑完必须做两件事

1. 脚本最后会打印该写进 `dist/index.html` 的那行文案和图片尺寸，**照着改**，
   否则页面上的颗数和颜色数就是假的
2. 打缓存指纹（**改过 js/css 就必须跑**，否则老访客会拿到新 HTML 配旧 JS）：

```bash
python3 tools/stamp-assets.py
```

3. 部署：

```bash
npx wrangler pages deploy dist --project-name=benwo-pindou --branch=main
```

## 为什么格数是 80 而不是站内默认的 48

48 格下这张示例图的胡须会断、鼻子只占 2 格，看起来像工具有缺陷，
其实只是这张图的细节太小。80 格是真实用户遇到这种图会做的选择。

## 为什么要用画笔补鼻子

鼻子的黄色在第一遍用量计数里排第 32 名、只有 2 格，
颜色上限开到 28 都选不中它。转换后用画笔刷那几格是网站本来就有的功能。
所以最终颜色数是 17 而不是 16。

## 依赖

Python 的 Pillow、Node（脚本用 `vm.runInThisContext` 原样加载
`dist/palette.js` 和 `dist/core.js`，不复制算法，色卡改了会自动跟着变）。
