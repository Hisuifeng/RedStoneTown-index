# -*- coding: utf-8 -*-
"""从 about/ 目录下的 .txt 文件编译红石镇时间线并生成新的 about.html。

用法:
    python build_about.py
        读取运行目录下 about/ 文件夹中所有 .txt（格式见 about/p1.txt），
        编译 about.html 中 "<section class=\"tl-section\">" 区块的时间线内容。

    python build_about.py --export
        将当前 about.html 中已有的时间线条目以 .txt 格式导出到 temp/ 文件夹。
"""

import html
import os
import re
import sys

ABOUT_DIR = "about"
TEMPLATE = "about.html"
EXPORT_DIR = "temp"
SECTION_TAG = 'class="tl-section"'
TIMELINE_OL = re.compile(r'(<ol class="timeline">)(.*?)(</ol>)', re.S)

TEXT_FIELD = 'text: "'


def read_files(directory):
    """读取 directory 下所有 .txt 文件，返回 [(文件名, 内容)]。"""
    items = []
    for name in os.listdir(directory):
        if name.lower().endswith(".txt"):
            with open(os.path.join(directory, name), "r", encoding="utf-8", newline="") as f:
                items.append((name, f.read()))
    return items


def parse_txt(content):
    """解析 .txt 内容，返回 (title, time, text)。"""
    title = None
    time = None
    text = None

    m = re.search(r'^title:\s*"(.*)"\s*$', content, re.M)
    if m:
        title = m.group(1)

    m = re.search(r'^time:\s*"(.*)"\s*$', content, re.M)
    if m:
        time = m.group(1)

    idx = content.find(TEXT_FIELD)
    if idx != -1:
        raw = content[idx + len(TEXT_FIELD):]
        # 去掉末尾的收尾引号（可能带换行）
        for suffix in ('"\n', '"'):
            if raw.endswith(suffix):
                raw = raw[: -len(suffix)]
                break
        text = raw.strip("\n")

    return title, time, text


def esc(value):
    """将文本中的特殊字符转为 HTML 实体。"""
    return html.escape(value or "", quote=False)


def time_key(time_str):
    """将 "YYYY/M/D" 时间字符串转为可比较元组，无法解析时返回 (0,0,0)。"""
    try:
        parts = [int(x) for x in (time_str or "").split("/")][:3]
        return (parts[0], parts[1], parts[2])
    except Exception:
        return (0, 0, 0)


def build_li(title, time, text, id_no, checked):
    """生成单个 <li> 条目。checked: 是否默认展示。"""
    checked_attr = " checked" if checked else ""
    lines = []
    lines.append("                <li>")
    lines.append(
        f'                    <input class="radio" id="tl{id_no}" name="tl" type="radio"{checked_attr}>'
    )
    lines.append("                    <div class=\"tl-head\">")
    lines.append(f'                        <label class="tl-label" for="tl{id_no}">{esc(title)}</label>')
    lines.append(f'                        <span class="tl-date">{esc(time)}</span>')
    lines.append("                    </div>")
    lines.append("                    <div class=\"tl-body\">")
    lines.append(f"                        <p>{esc(text)}</p>")
    lines.append("                    </div>")
    lines.append("                </li>")
    return "\n".join(lines)


def build_timeline(items):
    """将解析后的条目渲染为 <ol class="timeline"> 内部列表内容。

    items 为 [(title, time, text), ...]。按 time 降序（最新在前），
    时间线顶部始终展示最新公告（checked）。
    """
    valid = [(t, tm, tx) for (t, tm, tx) in items if t and tm and tx]
    valid.sort(key=lambda x: time_key(x[1]), reverse=True)

    entries = []
    for i, (title, time, text) in enumerate(valid):
        # 最新的（时间最大的）默认展示
        checked = i == 0
        entries.append(build_li(title, time, text, len(valid) - i, checked))

    if not entries:
        return "\n                    <li>暂无公告</li>\n"

    return "\n\n".join(entries) + "\n"


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--export":
        export_to_temp()
        return

    if not os.path.isdir(ABOUT_DIR):
        print(f"错误：未找到 {ABOUT_DIR}/ 文件夹，请在站点根目录运行本脚本。")
        sys.exit(1)

    items = read_files(ABOUT_DIR)
    if not items:
        print("错误：about/ 文件夹下没有 .txt 文件。")
        sys.exit(1)

    with open(TEMPLATE, "r", encoding="utf-8", newline="") as f:
        source = f.read()

    # 只替换时间线区块的 <ol> 内部内容
    def repl(match):
        return match.group(1) + "\n" + build_timeline(
            [parse_txt(content) for _, content in items]
        ) + "                " + match.group(3)

    new_source, count = TIMELINE_OL.subn(repl, source, count=1)
    if count == 0:
        print("错误：在 about.html 中未找到时间线 <ol class=\"timeline\"> 区块。")
        sys.exit(1)

    with open(TEMPLATE, "w", encoding="utf-8", newline="") as f:
        f.write(new_source)

    print(f"完成：已从 {len(items)} 个 .txt 文件编译并更新 {TEMPLATE}。")


def export_to_temp():
    """把当前 about.html 的时间线条目导出为 .txt 存到 temp/。"""
    with open(TEMPLATE, "r", encoding="utf-8") as f:
        source = f.read()

    block = TIMELINE_OL.search(source)
    if not block:
        print("错误：在 about.html 中未找到时间线 <ol class=\"timeline\"> 区块。")
        sys.exit(1)

    li_re = re.compile(r"<li>(.*?)</li>", re.S)
    label_re = re.compile(r'<label class="tl-label" for="tl\d+">(.*?)</label>', re.S)
    date_re = re.compile(r'<span class="tl-date">(.*?)</span>', re.S)
    body_re = re.compile(r'<div class="tl-body">\s*<p>(.*?)</p>', re.S)

    entries = li_re.findall(block.group(2))
    if not entries:
        print("提示：about.html 中没有时间线条目可导出。")
        return

    os.makedirs(EXPORT_DIR, exist_ok=True)
    total = len(entries)
    for i, li in enumerate(entries, 1):
        title = label_re.search(li)
        date = date_re.search(li)
        body = body_re.search(li)
        title = html.unescape(title.group(1)) if title else ""
        date = html.unescape(date.group(1)) if date else ""
        body = html.unescape(body.group(1)) if body else ""

        content = 'title: "%s"\ntime: "%s"\ntext: "%s"\n' % (title, date, body)
        # 页面顺序即时间倒序（最新在前），导出文件名让最新=最大编号
        path = os.path.join(EXPORT_DIR, "p%d.txt" % (total - i + 1))
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(content)
        print("导出 %s" % path)

    print(f"完成：已将 {len(entries)} 条时间线导出到 {EXPORT_DIR}/。")


if __name__ == "__main__":
    main()