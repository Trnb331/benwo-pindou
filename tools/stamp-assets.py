#!/usr/bin/env python3
"""给 index.html 里引用的 js/css 加内容指纹，解决缓存不一致。

Cloudflare Pages 给 index.html 的是 max-age=0，给 js/css 的是 max-age=14400。
也就是说部署后 4 小时内，老访客会拿到**新的 HTML 配旧的 JS**，页面会坏。
加上 ?v=<内容哈希> 后，文件一变链接就变，浏览器必然重新下载。

每次改完 dist 里的 js/css，部署前跑一次：
    python3 tools/stamp-assets.py
"""
import hashlib
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
INDEX = os.path.join(DIST, 'index.html')

html = open(INDEX, encoding='utf-8').read()
changed = []


def stamp(match):
    attr, path = match.group(1), match.group(2)
    full = os.path.join(DIST, path.lstrip('/'))
    if not os.path.exists(full):
        return match.group(0)
    digest = hashlib.md5(open(full, 'rb').read()).hexdigest()[:8]
    changed.append(f'{path} -> v={digest}')
    return f'{attr}="{path}?v={digest}"'


html = re.sub(r'(src|href)="(/[^"?]+\.(?:js|css))(?:\?v=[0-9a-f]+)?"', stamp, html)
open(INDEX, 'w', encoding='utf-8').write(html)
for line in changed:
    print(' ', line)
print(f'已为 {len(changed)} 个文件打指纹')
