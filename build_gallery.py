# -*- coding: utf-8 -*-
"""从 gallery.txt 编译图廊的滚动轨道，并将其写回 gallery.html。

用法:
    python build_gallery.py
        读取运行目录下 gallery.txt（格式见文件顶部注释），
        更新 gallery.html 中 "<!-- gallery:start -->" 到
        "<!-- gallery:end -->" 之间的图廊区块。
"""

import html
import os
import re
import sys

TEMPLATE = "gallery.html"
SOURCE = "gallery.txt"
TRACK_START = "<!-- gallery:start -->"
TRACK_END = "<!-- gallery:end -->"
GALLERY_BLOCK = re.compile(
    r"(" + re.escape(TRACK_START) + r")(.*?)(" + re.escape(TRACK_END) + r")", re.S
)

FIELD_RE = re.compile(r'^([A-Za-z_]+):\s*"?([^"\n]*)"?\s*$')


def read_source(path):
    """解析 gallery.txt，返回轨道列表 [[{src,alt,cap}, ...], ...]。"""
    with open(path, "r", encoding="utf-8", newline="") as f:
        lines = f.read().splitlines()

    tracks = []
    current = None
    img = None

    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        if line == "[track]":
            current = []
            tracks.append(current)
            img = None
            continue

        if line == "[img]":
            img = {}
            current.append(img)
            continue

        m = FIELD_RE.match(line)
        if m and current is not None and img is not None:
            key = m.group(1).lower()
            if key in ("src", "alt", "cap"):
                img[key] = m.group(2)

    # 只保留包含图片的轨道
    tracks = [t for t in tracks if t]
    return tracks


def esc(value):
    return html.escape(value or "", quote=False)


def build_card(card):
    src = esc(card.get("src", ""))
    alt = esc(card.get("alt", ""))
    cap = esc(card.get("cap", ""))
    return (
        "                            <figure class=\"gallery-card\">\n"
        f"                                <img src=\"{src}\" alt=\"{alt}\">\n"
        f"                                <figcaption>{cap}</figcaption>\n"
        "                            </figure>"
    )


def build_run(cards):
    """生成一个 gallery-run（一屏卡片）。"""
    inner = "\n".join(build_card(c) for c in cards)
    return (
        "                        <div class=\"gallery-run\">\n"
        f"{inner}\n"
        "                        </div>"
    )


def build_track(cards, index):
    """生成一条轨道，包含两遍 run 以便无缝滚动。"""
    cls = "gallery-a" if index == 0 else "gallery-b"
    run_html = "\n".join(build_run(cards) for _ in range(2))
    return (
        f"                <div class=\"gallery-track {cls}\">\n"
        "                    <div class=\"gallery-inner\">\n"
        f"{run_html}\n"
        "                    </div>\n"
        "                </div>"
    )


def build_band(tracks):
    """把轨道列表渲染为整块图廊 HTML（不含注释）。"""
    if not tracks:
        return (
            "                <p>（尚无图片，请先在 gallery.txt 中添加 [img]。）</p>"
        )
    return "\n\n".join(build_track(t, i) for i, t in enumerate(tracks))


def main():
    if not os.path.isfile(SOURCE):
        print(f"错误：未找到 {SOURCE}/，请在站点根目录运行本脚本。")
        sys.exit(1)

    tracks = read_source(SOURCE)
    if not tracks:
        print(f"错误：{SOURCE} 中没有解析到任何 [track] 轨道。")
        sys.exit(1)

    with open(TEMPLATE, "r", encoding="utf-8", newline="") as f:
        source = f.read()

    band = build_band(tracks)

    def repl(match):
        return match.group(1) + "\n" + band + "\n" + match.group(3)

    new_source, count = GALLERY_BLOCK.subn(repl, source, count=1)
    if count == 0:
        print(f"错误：在 {TEMPLATE} 中未找到图廊区块注释（{TRACK_START}）。")
        sys.exit(1)

    with open(TEMPLATE, "w", encoding="utf-8", newline="") as f:
        f.write(new_source)

    print(
        f"完成：已从 {SOURCE} 编译 {len(tracks)} 条轨道并更新 {TEMPLATE}。"
    )


if __name__ == "__main__":
    main()