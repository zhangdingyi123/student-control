#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/分册"
OUT="$ROOT/pdf"
TMP="$OUT/.tmp"
CSS="$ROOT/scripts/pdf-style.css"
FIX="$ROOT/scripts/fix-markdown.py"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

mkdir -p "$OUT" "$TMP"

if [ ! -x "$CHROME" ]; then
  echo "未找到 Google Chrome，无法生成 PDF" >&2
  exit 1
fi

pandoc_to_pdf() {
  local md="$1"
  local title="$2"
  local pdf="$3"
  local html="$TMP/$(basename "$pdf" .pdf).html"

  pandoc "$md" \
    -o "$html" \
    --standalone \
    --embed-resources \
    --css "$CSS" \
    --metadata title="$title" \
    --from markdown+pipe_tables+backtick_code_blocks+raw_html

  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --no-pdf-header-footer \
    --print-to-pdf="$pdf" \
    "file://$html" \
    2>/dev/null
}

convert_one() {
  local md="$1"
  local base
  base="$(basename "$md" .md)"
  local fixed="$TMP/${base}.md"
  local pdf="$OUT/${base}.pdf"

  echo "→ $base"
  python3 "$FIX" "$md" "$fixed"
  pandoc_to_pdf "$fixed" "$base" "$pdf"
}

for md in "$SRC"/*.md; do
  convert_one "$md"
done

# 合并全集
echo "→ 合并全集"
COMBINED_MD="$TMP/combined.md"
: > "$COMBINED_MD"
for md in "$SRC"/*.md; do
  fixed="$TMP/_part_$(basename "$md")"
  python3 "$FIX" "$md" "$fixed"
  echo '<div style="page-break-before:always"></div>' >> "$COMBINED_MD"
  cat "$fixed" >> "$COMBINED_MD"
  echo "" >> "$COMBINED_MD"
done

pandoc_to_pdf "$COMBINED_MD" "后端面试八股全集" "$OUT/00-后端面试八股全集.pdf"

rm -rf "$TMP"
rm -f "$OUT/_debug.html"

echo ""
echo "完成！PDF 已输出到: $OUT"
ls -lh "$OUT"/*.pdf
