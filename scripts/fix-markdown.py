#!/usr/bin/env python3
"""在表格前补空行，确保 pandoc 正确解析 pipe table。"""

import re
import sys


def is_table_row(line: str) -> bool:
    s = line.strip()
    return bool(s) and s.startswith("|") and s.count("|") >= 2


def fix_markdown_tables(text: str) -> str:
    lines = text.splitlines()
    out: list[str] = []
    for line in lines:
        if is_table_row(line) and out:
            prev = out[-1].strip()
            if prev and not is_table_row(out[-1]):
                out.append("")
        out.append(line)
    return "\n".join(out) + ("\n" if text.endswith("\n") else "")


def main() -> None:
    if len(sys.argv) != 3:
        print(f"用法: {sys.argv[0]} <输入.md> <输出.md>", file=sys.stderr)
        sys.exit(1)
    src = open(sys.argv[1], encoding="utf-8").read()
    dst = fix_markdown_tables(src)
    open(sys.argv[2], "w", encoding="utf-8").write(dst)


if __name__ == "__main__":
    main()
