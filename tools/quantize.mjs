// 用网站自己的 palette.js + core.js 做转换，不复制、不改写任何一行算法。
// 由 make-demo.py 调用，单独跑也可以。
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const [, , pixelsPath, width, limit, outPath, distDir] = process.argv;
const DIST = distDir || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'dist');

// 原样执行站内脚本，拿到全局的 MARD 和 BeadCore
vm.runInThisContext(fs.readFileSync(path.join(DIST, 'palette.js'), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(DIST, 'core.js'), 'utf8'));

// 与 app.js 的 chosenPalette() 默认值一致：色板下拉第一项是 'core'
const palette = MARD.filter(p => p.core);
const data = new Uint8ClampedArray(fs.readFileSync(pixelsPath));
const W = Number(width);
const H = data.length / 4 / W;
const cells = BeadCore.quantize(data, palette, Number(limit));
const colors = Object.fromEntries(palette.map(p => [p.code, p.hex]));

fs.writeFileSync(outPath, JSON.stringify({ w: W, h: H, cells, colors, counts: BeadCore.counts(cells) }));
console.log(`  色板 ${palette.length} 色（MARD 基础，站内默认） · 颜色上限 ${limit}`);
console.log(`  图纸 ${W} × ${H} 格`);
