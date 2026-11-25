#!/usr/bin/env python3
"""og_cards.py | one share image (1200x630) per page of cristinalilianacalin.com.

WhatsApp, Facebook, LinkedIn and X show the og:image of the exact page you share.
Before this, every page pointed to img/og-2026.jpg. This script draws a card per page
(book cover, chapter, series, Christmas) into img/og/ and points that page's
og:image / twitter:image / og:image:alt at it. Home page and 404 keep og-2026.jpg.

Usage:  python3 tools/og_cards.py <site-root>        (needs playwright + chromium)
Run it after every build, together with tools/postbuild_stats_seo.py. Idempotent.
Images are versioned by content hash (?v=...) so platforms refetch when a card changes.
"""
import hashlib, html, os, re, sys
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
SITE = 'https://cristinalilianacalin.com/'
FONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'og_fonts')

ADULT_SERIES = {
    'everything-is-on-track': ('Everything Is On Track', 'One delivery team, one promise, and everything it costs when the status says green.', '5 novels', ['the-friday-we-promised', 'approved-with-no-questions', 'the-risk-we-buried']),
    'everyone-reports-to-someone': ('Everyone Reports to Someone', 'Power at work, seen from every floor: the boss, the people who report to him, and everyone in between.', '6 novels', []),
    'the-family-that-never-shouted': ('The Family That Never Shouted', 'Polite dinners, quiet houses, and the price of always being the good one.', '5 novels', []),
    'the-love-we-misread': ('The Love We Misread', 'Love stories about the moments we read each other wrong, and what it takes to read again.', '5 novels', []),
    'the-people-we-know': ('The People We Know', 'A small town where everyone knows everyone. A mother vanishes from a warm kitchen.', '6 novels', []),
    'the-things-we-swore-we-knew': ('The Things We Swore We Knew', 'Sisters, mothers and old friends who remember the same day differently.', '4 novels', []),
}
BOOKS = {
    'the-friday-we-promised': ('The Friday We Promised', 'Everything Is On Track · Book 1', 'A warm, sharp and often funny novel about what we promise in meetings, and who pays for it.', 'light'),
    'approved-with-no-questions': ('Approved With No Questions', 'Everything Is On Track · Book 2', 'A warm, sharp and often funny novel about closed files, open doors, and who checks that the help really arrived.', 'light'),
    'the-risk-we-buried': ('The Risk We Buried', 'Everything Is On Track · Book 3', 'A warm, sharp and often funny novel about small print, rising water, and who gets told the truth first.', 'light'),
    'my-ai-filed-a-complaint-against-me': ('My AI Filed a Complaint Against Me', 'Kit vs. the Future · Book 1', 'A sharp, funny and warm story about growing up next to machines that remember everything.', 'young'),
}
SPINES = ['#173f35', '#8c1c2b', '#b8b5ef', '#4f5b55']


def cover(slug):
    return f'file://{ROOT}/img/covers/{slug}.jpg'


def cards():
    out = {}
    for slug, (title, kicker, tag, theme) in BOOKS.items():
        extra = 'Also in Romanian and as a bilingual edition' if slug == 'my-ai-filed-a-complaint-against-me' else ''
        out[f'books/{slug}/index.html'] = dict(file=f'book-{slug}', theme=theme, kicker=kicker, title=title, tag=tag, foot=extra or 'A novel by Cristina Liliana Calin', covers=[cover(slug)],
                                              alt=f'{title}, {kicker.replace(" · ", ", ")}, by Cristina Liliana Calin')
        out[f'books/{slug}/chapter-1.html'] = dict(file=f'chapter-{slug}', theme=theme, kicker='Chapter 1 · Read it here', title=title, tag=f'The full first chapter of {kicker.replace(" · ", ", ")}.', foot='A novel by Cristina Liliana Calin', covers=[cover(slug)], chapter=True,
                                                  alt=f'Read chapter 1 of {title} by Cristina Liliana Calin')
    for slug, (title, tag, n, books) in ADULT_SERIES.items():
        out[f'series/{slug}/index.html'] = dict(file=f'series-{slug}', theme='light', kicker=f'A series · {n}', title=title, tag=tag, foot='Novels by Cristina Liliana Calin', covers=[cover(b) for b in books], spines=int(n.split()[0]) if not books else 0,
                                               alt=f'{title}, a series of {n} by Cristina Liliana Calin')
    out['series/science-fiction-for-young-readers/index.html'] = dict(file='series-kit-vs-the-future', theme='young', kicker='Young readers · 10 books', title='Kit vs. the Future', tag='Funny, strange, and honest science fiction for readers who are still working out who they are.', foot='Stories for growing up', covers=[cover('my-ai-filed-a-complaint-against-me')],
                                                                       alt='Kit vs. the Future, science fiction for young readers by Cristina Liliana Calin')
    out['christmas/index.html'] = dict(file='christmas', theme='xmas', kicker='A Book for Christmas Eve', title='A printed novel, with a letter from the author inside.', tag='Order your Christmas Eve book by December 10.', foot='Cristina Liliana Calin',
                                       covers=[f'file://{ROOT}/img/covers/christmas/{s}.jpg' for s in ['the-friday-we-promised', 'approved-with-no-questions', 'the-risk-we-buried']],
                                       alt='A Book for Christmas Eve: novels by Cristina Liliana Calin with a personal letter from the author')
    out['christmas/young-readers/index.html'] = dict(file='christmas-young-readers', theme='young', kicker='A Book for Christmas Eve · Young readers', title='The best gift for a teenager doesn’t need charging.', tag='A funny novel about AI, and a personal letter from the author.', foot='Cristina Liliana Calin',
                                                     covers=[cover('my-ai-filed-a-complaint-against-me')],
                                                     alt='Christmas gift for teenagers: My AI Filed a Complaint Against Me, with a letter from the author')
    return out


CSS = """
@font-face{font-family:NR;src:url('file://@F@/Newsreader[opsz,wght].ttf')}
@font-face{font-family:NR;font-style:italic;src:url('file://@F@/Newsreader-Italic[opsz,wght].ttf')}
@font-face{font-family:DM;src:url('file://@F@/DMMono-Regular.ttf')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:NR,serif;position:relative}
.light{background:#eef0eb;color:#17201c;--acc:#173f35;--mute:#4f5b55;--dot:rgba(23,32,28,.13)}
.young{background:radial-gradient(900px 600px at 85% 30%,#1b1050,#060a1c 70%);color:#eef1ff;--acc:#5ef0d4;--mute:#aeb7e0;--dot:rgba(94,240,212,.16)}
.xmas{background:radial-gradient(900px 640px at 80% 40%,#8c1c2b,#4a0c16 75%);color:#f7f1e3;--acc:#d9b765;--mute:#efe5cf;--dot:rgba(217,183,101,.2)}
.dots{position:absolute;inset:0 0 0 640px;background-image:radial-gradient(var(--dot) 1.4px,transparent 1.6px);background-size:26px 26px}
.txt{position:absolute;left:72px;top:64px;bottom:56px;width:@TW@px;display:flex;flex-direction:column}
.brand{font-size:30px;letter-spacing:-.2px}.brand i{font-style:italic}
.kick{font-family:DM,monospace;font-size:22px;color:var(--acc);margin-top:46px;letter-spacing:.2px}
h1{font-weight:400;font-size:@FS@px;line-height:1.04;letter-spacing:-1.2px;margin-top:16px}
.tag{font-size:27px;line-height:1.3;color:var(--mute);margin-top:22px}
.foot{margin-top:auto;font-family:DM,monospace;font-size:21px;color:var(--mute);line-height:1.6}
.foot b{font-weight:400;color:inherit;display:block;color:var(--acc)}
.cv{position:absolute;box-shadow:0 22px 50px rgba(0,0,0,.35),0 4px 10px rgba(0,0,0,.2);border-radius:3px}
.young .cv{box-shadow:0 0 60px rgba(94,240,212,.25),0 22px 50px rgba(0,0,0,.6)}
.spine{position:absolute;bottom:70px;width:58px;border-radius:3px 3px 0 0}
.spine{display:flex;flex-direction:column;align-items:center;padding:16px 0 14px;box-shadow:inset -6px 0 0 rgba(0,0,0,.12),inset 3px 0 0 rgba(255,255,255,.08),0 10px 24px rgba(0,0,0,.18)}
.sp-n{font-family:DM,monospace;font-size:15px;opacity:.8;border-bottom:1px solid currentColor;padding-bottom:8px;width:60%;text-align:center}
.sp-t{writing-mode:vertical-rl;transform:rotate(180deg);font-size:23px;letter-spacing:.3px;margin:auto 0;white-space:nowrap;overflow:hidden;max-height:270px}
.sp-a{font-family:DM,monospace;font-size:11px;letter-spacing:1.5px;opacity:.75}
.shelf{position:absolute;right:46px;bottom:62px;height:10px;background:#17201c;border-radius:2px}
.ch{position:absolute;right:58px;top:52px;font-family:DM,monospace;font-size:20px;color:var(--acc);border:1.5px solid var(--acc);padding:8px 14px;border-radius:3px;background:rgba(0,0,0,.02)}
"""


def page(c):
    n = len(c.get('covers') or [])
    tw = 560 if n else 520 if c.get('spines') else 620
    t = c['title']
    fs = 66 if len(t) <= 24 else 58 if len(t) <= 34 else 52 if len(t) <= 46 else 46
    css = CSS.replace('@F@', FONTS).replace('@TW@', str(tw)).replace('@FS@', str(fs))
    art = ''
    if n == 1:
        art = f'<img class="cv" src="{c["covers"][0]}" style="left:{820 if c.get("chapter") else 790}px;top:70px;height:490px;transform:rotate(2deg)">'
    elif n == 3:
        pos = [(690, 125, -7), (875, 125, 7), (782, 82, 0)]
        for (x, y, r), src in zip(pos, [c['covers'][0], c['covers'][2], c['covers'][1]]):
            art += f'<img class="cv" src="{src}" style="left:{x}px;top:{y}px;height:430px;transform:rotate({r}deg)">'
    elif c.get('spines'):
        k = c['spines']; w = 64; gap = 8; x0 = 1200 - 70 - k * (w + gap)
        for i in range(k):
            h = [392, 368, 404, 380, 396, 372][i % 6]
            col = SPINES[i % 4]
            ink = '#f7f1e3' if i % 4 in (0, 1, 3) else '#17201c'
            art += (f'<div class="spine" style="left:{x0 + i * (w + gap)}px;height:{h}px;width:{w}px;background:{col};color:{ink}">'
                    f'<span class="sp-n">{i + 1}</span><span class="sp-t" style="font-size:{23 if len(t) <= 20 else 18}px">{html.escape(t)}</span><span class="sp-a">CALIN</span></div>')
        art += f'<div class="shelf" style="left:{x0 - 24}px"></div>'
    ch = ''
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{css}</style></head>
<body class="{c['theme']}"><div class="dots"></div>{art}{ch}
<div class="txt"><p class="brand">Cristina Liliana <i>Calin</i></p><p class="kick">{html.escape(c['kicker'])}</p>
<h1>{html.escape(t)}</h1><p class="tag">{html.escape(c['tag'])}</p>
<p class="foot"><b>{html.escape(c['foot'])}</b>cristinalilianacalin.com</p></div></body></html>"""


def set_meta(path, url, alt):
    p = os.path.join(ROOT, path)
    t = open(p, encoding='utf-8').read()
    t2 = re.sub(r'(<meta property="og:image" content=")[^"]*(")', r'\g<1>' + url + r'\2', t)
    t2 = re.sub(r'(<meta name="twitter:image" content=")[^"]*(")', r'\g<1>' + url + r'\2', t2)
    t2 = re.sub(r'(<meta property="og:image:alt" content=")[^"]*(")', lambda m: m.group(1) + html.escape(alt, quote=True) + m.group(2), t2)
    if t2 != t:
        open(p, 'w', encoding='utf-8').write(t2)
        return True
    return False


def main():
    os.makedirs(os.path.join(ROOT, 'img/og'), exist_ok=True)
    changed = 0
    with sync_playwright() as pw:
        exe = '/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None
        b = pw.chromium.launch(executable_path=exe, args=['--allow-file-access-from-files'])
        pg = b.new_page(viewport={'width': 1200, 'height': 630})
        for path, c in cards().items():
            if not os.path.exists(os.path.join(ROOT, path)):
                continue
            tmp = f'/tmp/og_{c["file"]}.html'
            open(tmp, 'w', encoding='utf-8').write(page(c))
            pg.goto('file://' + tmp); pg.wait_for_timeout(400)
            out = os.path.join(ROOT, 'img/og', c['file'] + '.jpg')
            pg.screenshot(path=out, type='jpeg', quality=86)
            v = hashlib.sha1(open(out, 'rb').read()).hexdigest()[:8]
            changed += set_meta(path, f'{SITE}img/og/{c["file"]}.jpg?v={v}', c['alt'])
        b.close()
    print(f'og cards: {len(cards())} drawn, {changed} pages updated')


if __name__ == '__main__':
    main()
