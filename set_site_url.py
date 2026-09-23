# -*- coding: utf-8 -*-
"""将站点中的 __SITE_URL__ 占位符替换为真实的公开地址。

用法:
    py set_site_url.py https://example.com
    py set_site_url.py https://user.github.io/RedStoneTown-index

    传入的基础地址可带或不带结尾斜杠，脚本会自动规范化。
    替换范围：index / about / gallery / regulations / department / 404、
    sitemap.xml 与 robots.txt 中的 __SITE_URL__ 占位符。
"""

import sys

MARKER = "__SITE_URL__"
FILES = [
    "index.html",
    "about.html",
    "gallery.html",
    "regulations.html",
    "department.html",
    "404.html",
    "sitemap.xml",
    "robots.txt",
]


def normalize(base):
    base = base.strip().rstrip("/")
    if not base.startswith(("http://", "https://")):
        raise SystemExit("错误：请传入以 http(s):// 开头的完整地址。")
    return base


def main():
    if len(sys.argv) != 2:
        print("用法: py set_site_url.py https://example.com")
        sys.exit(1)

    base = normalize(sys.argv[1])
    replaced = 0

    for name in FILES:
        try:
            with open(name, "r", encoding="utf-8", newline="") as f:
                content = f.read()
        except FileNotFoundError:
            print(f"跳过：未找到 {name}")
            continue

        if MARKER not in content:
            print(f"跳过：{name} 中没有占位符")
            continue

        new_content = content.replace(MARKER, base)
        with open(name, "w", encoding="utf-8", newline="") as f:
            f.write(new_content)

        count = content.count(MARKER)
        replaced += count
        print(f"已替换 {name}（{count} 处）")

    print(f"完成：共替换 {replaced} 处 __SITE_URL__ -> {base}")


if __name__ == "__main__":
    main()