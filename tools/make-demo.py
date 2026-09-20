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
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
TOOLS = os.path.join(ROOT, 'tools')

GRID_WIDTH  = 80   # 站内默认是 48，但这张示例图在 48 格下胡须会断、鼻子只剩 2 格
COLOR_LIMIT = 16   # 与站内默认一致
NOSE_CODE   = 'A15'  # 鼻子的黄色排名太靠后选不中，转换后用画笔补上；换图时把 --nose 关掉
CELL, PAD, SS = 9, 10, 3   # 渲染用：格子边长 / 留白 / 超采样
RULER = 16                 # 左边和上边留给坐标标尺的宽度
GAP = 16                   # 图纸与右侧放大块之间的间距
DETAIL_SIZE = (8, 6)       # 放大示意的大小：列数、行数（取哪一块由脚本自动挑）
DETAIL_SCALE = 0.42        # 放大块占图纸宽度的比例


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


def sample_cartoon(im, gw, gh):
    """每格取出现最多的颜色，对应站内「处理模式 = 卡通（主色）」。

    和 app.js 的 sampleSource() 一致：先放大到中间尺寸，把颜色量化到 16 级再投票，
    否则抗锯齿会让每个像素自成一票，投不出主色。
    """
    scale = max(1, min(10, 4000 // max(gw, gh)))
    bw, bh = gw*scale, gh*scale
    big = im.resize((bw, bh), Image.LANCZOS)
    src = big.load()
    out = bytearray(gw*gh*4)
    for gy in range(gh):
        for gx in range(gw):
            tally = {}
            solid = 0
            for y in range(gy*scale, (gy+1)*scale):
                for x in range(gx*scale, (gx+1)*scale):
                    r, g, b, a = src[x, y]
                    if a < 128:
                        continue
                    solid += 1
                    key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
                    rec = tally.get(key)
                    if rec:
                        rec[0] += 1; rec[1] += r; rec[2] += g; rec[3] += b
                    else:
                        tally[key] = [1, r, g, b]
            o = (gy*gw + gx) * 4
            if not tally or solid < scale*scale/2:
                continue
            n, r, g, b = max(tally.values(), key=lambda v: v[0])
            out[o] = round(r/n); out[o+1] = round(g/n); out[o+2] = round(b/n); out[o+3] = 255
    return bytes(out)


def _font(px, cjk=False):
    """找字体。cjk=True 时要能画中文，否则标签会变成一排方块。"""
    latin = ('/System/Library/Fonts/Supplemental/Arial.ttf',
             '/System/Library/Fonts/Helvetica.ttc',
             '/Library/Fonts/Arial.ttf')
    chinese = ('/System/Library/Fonts/PingFang.ttc',
               '/System/Library/Fonts/Hiragino Sans GB.ttc',
               '/System/Library/Fonts/STHeiti Light.ttc')
    for path in (chinese if cjk else latin):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, px)
            except Exception:
                continue
    return ImageFont.load_default()


def _pick_detail(pattern, cw, ch):
    """自动挑一块颜色最丰富的区域来放大，换了示例图也不用手动改坐标。"""
    W, H, cells = pattern['w'], pattern['h'], pattern['cells']
    best, best_score = (0, 0), -1
    for y in range(0, H - ch + 1, 2):
        for x in range(0, W - cw + 1, 2):
            window = [cells[(y+j)*W + x+i] for j in range(ch) for i in range(cw)]
            filled = [c for c in window if c]
            if len(filled) < len(window) * 0.9:      # 别挑到有空格的边缘
                continue
            score = len(set(filled))
            if score > best_score:
                best, best_score = (x, y), score
    return best


def _pick_blank(pattern, bw_cells, bh_cells):
    """找一块足够大的空白区域安放放大块，优先靠下、靠左，不压住图案。"""
    W, H, cells = pattern['w'], pattern['h'], pattern['cells']
    need_w, need_h = int(bw_cells) + 2, int(bh_cells) + 2
    best = None
    for y in range(H - need_h, -1, -1):              # 从底部往上找
        for x in range(0, W - need_w + 1):
            if all(not cells[(y+j)*W + x+i]
                   for j in range(need_h) for i in range(need_w)):
                best = (x + 1, y + 1)
                break
        if best:
            break
    if best:
        return best
    # 整张图没有空位就压在右下角，至少不挡主体中心
    return (W - need_w + 1, H - need_h + 1)


def _callout(d, pattern, OX, OY, rgb):
    """在图纸空白处画一块放大示意，露出逐格色号。

    位置固定在左下角的透明区域。换了示例图之后如果那块不再是空的，
    调 DETAIL 或者把这个函数的调用注释掉即可。
    """
    W, H, cells, colors = pattern['w'], pattern['h'], pattern['cells'], pattern['colors']
    cw, ch = DETAIL_SIZE
    cx, cy = _pick_detail(pattern, cw, ch)
    # 放大块要占到图宽的四成左右，否则缩进首页卡片后色号就看不清了
    ZCELL = (DETAIL_SCALE * W * CELL) / cw
    pad = 3*SS
    bw_px, bh_px = cw*ZCELL*SS, ch*ZCELL*SS
    # 画在图纸右侧，垂直居中；不覆盖图案本身
    bx = OX + W*CELL*SS + GAP*SS
    by = OY + (H*CELL*SS - bh_px) / 2
    bw, bh = bw_px, bh_px

    # 先在原图上框出取自哪一块
    sx, sy = OX + cx*CELL*SS, OY + cy*CELL*SS
    d.rectangle([sx, sy, sx + cw*CELL*SS, sy + ch*CELL*SS],
                outline=(0x49, 0x2b, 0x3b, 0xcc), width=max(1, round(1.2*SS)))

    d.rectangle([bx-pad, by-pad, bx+bw+pad, by+bh+pad],
                fill=(255, 255, 255, 255), outline=(0x49, 0x2b, 0x3b, 0xdd),
                width=max(1, round(1.2*SS)))
    # 从框选区拉一条线到放大块，说明这块是从哪来的
    d.line([sx + cw*CELL*SS, sy + ch*CELL*SS/2, bx - pad, by + bh/2],
           fill=(0x49, 0x2b, 0x3b, 0x55), width=max(1, round(0.9*SS)))
    label = _font(int(10*SS), cjk=True)
    d.text((bx + bw/2, by + bh + pad + int(5*SS)), '每一格都有 MARD 色号',
           fill=(0x80, 0x5b, 0x6d), font=label, anchor='ma')

    font = _font(int(ZCELL*0.40*SS))
    for j in range(ch):
        for i in range(cw):
            gx, gy = cx + i, cy + j
            if gx >= W or gy >= H:
                continue
            code = cells[gy*W + gx]
            x = bx + i*ZCELL*SS
            y = by + j*ZCELL*SS
            if code:
                r, g, b = rgb(colors[code])
                d.rectangle([x, y, x+ZCELL*SS, y+ZCELL*SS], fill=(r, g, b))
                # 文字明暗跟随底色，和 app.js draw() 里的判断一致
                ink = (0x30, 0x24, 0x31) if (r*.299 + g*.587 + b*.114) > 145 else (255, 255, 255)
                d.text((x + ZCELL*SS/2, y + ZCELL*SS/2), code, fill=ink, font=font, anchor='mm')
            d.rectangle([x, y, x+ZCELL*SS, y+ZCELL*SS],
                        outline=(0x70, 0x44, 0x58, 0x55), width=1)


def render(pattern, out_path):
    """按 app.js 里 draw() 完全相同的网格规格渲染，另加坐标标尺和一块放大示意。

    坐标和放大镜是给首页演示用的：卡片尺寸下每格只有 5 像素，色号根本看不清，
    放大一块出来才能让访客看到「每一格都有色号」。真正下载的图纸由 app.js 的
    exportPNG() 生成，那里每一格本来就带色号。
    """
    W, H, cells, colors = pattern['w'], pattern['h'], pattern['cells'], pattern['colors']
    cw, ch = DETAIL_SIZE
    zcell = (DETAIL_SCALE * W * CELL) / cw
    side = int(cw*zcell) + GAP + PAD              # 图纸右侧留给放大块的宽度
    size = (W*CELL + RULER + PAD + side, H*CELL + RULER + PAD)
    OX, OY = RULER*SS, RULER*SS          # 网格原点（给左边和上边的标尺让位）
    img = Image.new('RGB', (size[0]*SS, size[1]*SS), (255, 255, 255))
    d = ImageDraw.Draw(img, 'RGBA')
    rgb = lambda hx: tuple(int(hx[j:j+2], 16) for j in (1, 3, 5))

    for i, code in enumerate(cells):
        if not code:
            continue
        x = OX + (i % W)*CELL*SS
        y = OY + (i // W)*CELL*SS
        d.rectangle([x, y, x+CELL*SS, y+CELL*SS], fill=rgb(colors[code]))

    MINOR, MAJOR = (0x70, 0x44, 0x58, 0x33), (0x70, 0x44, 0x58, 0xaa)
    for x in range(W+1):
        mj = x % 10 == 0
        px = OX + x*CELL*SS
        d.line([px, OY, px, OY + H*CELL*SS],
               fill=MAJOR if mj else MINOR, width=max(1, round((1.3 if mj else .6)*SS)))
    for y in range(H+1):
        mj = y % 10 == 0
        py = OY + y*CELL*SS
        d.line([OX, py, OX + W*CELL*SS, py],
               fill=MAJOR if mj else MINOR, width=max(1, round((1.3 if mj else .6)*SS)))

    # 坐标标尺：每 10 格标一个数，和粗线对齐
    font = _font(int(7.5*SS))
    TICK = (0x80, 0x5b, 0x6d, 0xff)
    for x in range(0, W+1, 10):
        d.text((OX + x*CELL*SS, OY - 3*SS), str(x if x else 1), fill=TICK, font=font, anchor='mb')
    for y in range(0, H+1, 10):
        d.text((OX - 3*SS, OY + y*CELL*SS), str(y if y else 1), fill=TICK, font=font, anchor='rm')

    _callout(d, pattern, OX, OY, rgb)

    img.resize(size, Image.LANCZOS).convert('RGB') \
       .quantize(colors=200, method=Image.MEDIANCUT).save(out_path, optimize=True)
    return size


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--source', help='换示例图时给一张新图；不给就直接用现有的 dist/demo-before.png')
    ap.add_argument('--width', type=int, default=GRID_WIDTH)
    ap.add_argument('--limit', type=int, default=COLOR_LIMIT)
    ap.add_argument('--mode', default='cartoon', choices=['cartoon', 'real'],
                    help='与站内「处理模式」对应。cartoon 每格取出现最多的颜色，线稿更利落')
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
        raw = sample_cartoon(im, gw, gh) if args.mode == 'cartoon' else im.resize((gw, gh), Image.LANCZOS).tobytes()
        open(px, 'wb').write(raw)
        subprocess.run(['node', os.path.join(TOOLS, 'quantize.mjs'),
                        px, str(gw), str(args.limit), pj, DIST], check=True)
        pattern = json.load(open(pj))

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

    top = sorted(pattern['counts'].items(), key=lambda kv: -kv[1])[:8]
    print()
    print('用量统计条（把 index.html 里 .demo-legend 的内容换成下面这段）：')
    print('  ' + ''.join(
        f'<span><i style="background:{pattern["colors"][c]}"></i>{c} <b>{n}</b></span>'
        for c, n in top) + f'<span class="more">共 {used} 色</span>')
    print()
    print('完成。index.html 里那行文案应该写：')
    print(f'  示例图纸：{pattern["w"]} × {pattern["h"]} 格 · {total} 颗豆 · {used} 种颜色。')
    print(f'  （图纸图尺寸 {size[0]}x{size[1]}，img 标签的 width/height 也要跟着改）')
    print()
    print('别忘了部署：')
    print('  npx wrangler pages deploy dist --project-name=benwo-pindou --branch=main')


if __name__ == '__main__':
    main()
