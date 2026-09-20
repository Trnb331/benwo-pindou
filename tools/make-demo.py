#!/usr/bin/env python3
"""重新生成首屏「转换示意」的两张图。

用法：
  # 只重做图纸（色卡或参数变了，示例图不换）
  python3 tools/make-demo.py

  # 换一张示例图（自动去背 + 压平颜色 + 转换 + 渲染）
  python3 tools/make-demo.py --source ~/Desktop/新图.png

改完一定要同步修改 index.html 里那行文案的数字，脚本会把该填的数字打出来。
生成完记得部署：npx wrangler pages deploy dist --project-name=benwo-pindou --branch=main
"""
import argparse, json, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
TOOLS = os.path.join(ROOT, 'tools')

GRID_WIDTH  = 80   # 站内默认是 48，但这张示例图在 48 格下胡须会断、鼻子只剩 2 格
COLOR_LIMIT = 16   # 与站内默认一致
NOSE_CODE   = 'A15'  # 鼻子的黄色排名太靠后选不中，转换后用画笔补上；换图时把 --nose 关掉
CELL, PAD, SS = 9, 10, 3   # 渲染用：格子边长 / 留白 / 超采样


def prepare(source_path, out_path):
    """去背 + 压平颜色。背景必须是纯色，只从四角向内填充，不会破坏被描边圈住的区域。"""
    im = Image.open(source_path).convert('RGB')
    w, h = im.size
    SENT = (255, 0, 255)
    work = im.copy()
    for corner in [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]:
        ImageDraw.floodfill(work, corner, SENT, thresh=18)
    wp = work.load()
    alpha = Image.new('L', (w, h), 255); ap = alpha.load()
    for y in range(h):
        for x in range(w):
            if wp[x, y] == SENT:
                ap[x, y] = 0

    # 找出真正的平涂色（跳过抗锯齿灰阶），再把每个像素吸附过去
    ip = im.load()
    import collections
    cnt = collections.Counter()
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if ap[x, y]:
                cnt[ip[x, y]] += 1
    flats = []
    for col, _ in cnt.most_common(400):
        if all(sum((a-b)**2 for a, b in zip(col, m)) > 3000 for m in flats):
            flats.append(col)
        if len(flats) >= 4:
            break
    print('  平涂色:', ' '.join('#%02X%02X%02X' % c for c in flats))

    clean = Image.new('RGB', (w, h)); cp = clean.load()
    cache = {}
    for y in range(h):
        for x in range(w):
            c = ip[x, y]
            v = cache.get(c)
            if v is None:
                v = min(flats, key=lambda f: sum((f[i]-c[i])**2 for i in range(3)))
                cache[c] = v
            cp[x, y] = v
    clean.putalpha(alpha)

    crop = clean.crop(clean.getbbox())
    cw, ch = crop.size
    m = int(max(cw, ch) * 0.04)
    canvas = Image.new('RGBA', (cw + m*2, ch + m*2), (255, 255, 255, 0))
    canvas.paste(crop, (m, m), crop)
    canvas = canvas.resize((640, round(640 * canvas.height / canvas.width)), Image.LANCZOS)
    canvas.quantize(colors=32, method=Image.FASTOCTREE).save(out_path, optimize=True)
    print('  示例原图:', canvas.size)


def render(pattern, out_path):
    """按 app.js 里 draw() 完全相同的网格规格渲染。"""
    W, H, cells, colors = pattern['w'], pattern['h'], pattern['cells'], pattern['colors']
    size = (W*CELL + PAD*2, H*CELL + PAD*2)
    img = Image.new('RGB', (size[0]*SS, size[1]*SS), (255, 255, 255))
    d = ImageDraw.Draw(img, 'RGBA')
    for i, code in enumerate(cells):
        if not code:
            continue
        x = PAD*SS + (i % W)*CELL*SS
        y = PAD*SS + (i // W)*CELL*SS
        hx = colors[code]
        d.rectangle([x, y, x+CELL*SS, y+CELL*SS],
                    fill=tuple(int(hx[j:j+2], 16) for j in (1, 3, 5)))
    MINOR, MAJOR = (0x70, 0x44, 0x58, 0x33), (0x70, 0x44, 0x58, 0xaa)
    for x in range(W+1):
        mj = x % 10 == 0
        px = PAD*SS + x*CELL*SS
        d.line([px, PAD*SS, px, PAD*SS + H*CELL*SS],
               fill=MAJOR if mj else MINOR, width=max(1, round((1.3 if mj else .6)*SS)))
    for y in range(H+1):
        mj = y % 10 == 0
        py = PAD*SS + y*CELL*SS
        d.line([PAD*SS, py, PAD*SS + W*CELL*SS, py],
               fill=MAJOR if mj else MINOR, width=max(1, round((1.3 if mj else .6)*SS)))
    img.resize(size, Image.LANCZOS).convert('RGB') \
       .quantize(colors=128, method=Image.MEDIANCUT).save(out_path, optimize=True)
    return size


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', help='换示例图时给一张新图；不给就直接用现有的 dist/demo-before.png')
    ap.add_argument('--width', type=int, default=GRID_WIDTH)
    ap.add_argument('--limit', type=int, default=COLOR_LIMIT)
    ap.add_argument('--nose', default=NOSE_CODE,
                    help='转换后用画笔补黄色的色号；换图后通常要改成 none')
    args = ap.parse_args()

    before = os.path.join(DIST, 'demo-before.png')
    after = os.path.join(DIST, 'demo-after.png')

    if args.source:
        print('[1/3] 去背并压平颜色')
        prepare(args.source, before)
    else:
        print('[1/3] 沿用现有 dist/demo-before.png')

    print('[2/3] 用网站自己的 core.js 转换')
    im = Image.open(before).convert('RGBA')
    gw = args.width
    gh = round(gw * im.height / im.width)
    with tempfile.TemporaryDirectory() as tmp:
        px = os.path.join(tmp, 'pixels.bin')
        pj = os.path.join(tmp, 'pattern.json')
        open(px, 'wb').write(im.resize((gw, gh), Image.LANCZOS).tobytes())
        subprocess.run(['node', os.path.join(TOOLS, 'quantize.mjs'),
                        px, str(gw), str(args.limit), pj, DIST], check=True)
        pattern = json.load(open(pj))
        raw = im.resize((gw, gh), Image.LANCZOS).tobytes()

    if args.nose and args.nose.lower() != 'none':
        painted = 0
        for i in range(len(pattern['cells'])):
            r, g, b, a = raw[i*4], raw[i*4+1], raw[i*4+2], raw[i*4+3]
            if a >= 128 and r > 190 and g > 160 and b < 150:
                pattern['cells'][i] = args.nose
                painted += 1
        if painted:
            # 色号的 hex 从站内色卡里取，保证和网站一致
            pattern['colors'].setdefault(args.nose, pattern['colors'].get(args.nose))
            counts = {}
            for c in pattern['cells']:
                if c:
                    counts[c] = counts.get(c, 0) + 1
            pattern['counts'] = counts
            print(f'  画笔补色 {painted} 格 -> {args.nose}')

    print('[3/3] 渲染图纸')
    size = render(pattern, after)
    total = sum(pattern['counts'].values())
    used = len(pattern['counts'])

    print()
    print('完成。index.html 里那行文案应该写：')
    print(f'  示例图纸：{pattern["w"]} × {pattern["h"]} 格 · {total} 颗豆 · {used} 种颜色。')
    print(f'  （图纸图尺寸 {size[0]}x{size[1]}，img 标签的 width/height 也要跟着改）')
    print()
    print('别忘了部署：')
    print('  npx wrangler pages deploy dist --project-name=benwo-pindou --branch=main')


if __name__ == '__main__':
    main()
