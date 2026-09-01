#!/usr/bin/env python3
"""
Liquid traps that neither `shopify theme check` nor Shopify's server catches.

Each of these has actually shipped in this theme.

  1. A filter placed after image_tag's last named argument applies to the whole
     <img> tag rather than to the argument. With `escape` the markup renders as
     visible text on the page. This passed the linter and uploaded cleanly, and
     was only found because someone looked at the storefront.

  2. `startswith` is not a Liquid operator. Shopify's server rejects the file
     and the GitHub integration drops it silently — no error anywhere. Cost six
     files, including both cart templates.

  3. A filter chain cannot wrap across lines inside a {% liquid %} tag, because
     each line there is a separate statement.

Usage:
    python docs/verify-liquid.py

Exits non-zero on any finding, so it can gate a commit alongside
verify-contrast.py and `shopify theme check`.
"""

import glob
import re
import sys

TRAILING_FILTERS = ("escape", "default", "strip", "upcase", "downcase", "strip_html")

findings = []
paths = glob.glob("**/*.liquid", recursive=True)

for path in paths:
    src = open(path, encoding="utf-8").read()
    nl = "\n"

    # 1. filter after image_tag's arguments
    for m in re.finditer(r"image_tag:.*?\}\}", src, re.S):
        segment = m.group(0)
        tail = segment.rsplit(",", 1)[-1]
        hit = re.search(r"\|\s*(" + "|".join(TRAILING_FILTERS) + r")\b", tail)
        if hit:
            line = src[: m.start()].count(nl) + 1
            snippet = " ".join(tail.split())[:64]
            findings.append(
                f"{path}:{line}  `{hit.group(1)}` after image_tag's last argument "
                f"applies to the whole <img> tag  ->  {snippet}"
            )

    # 2. startswith
    for m in re.finditer(r"\bstartswith\b", src):
        line = src[: m.start()].count(nl) + 1
        findings.append(
            f"{path}:{line}  `startswith` is not a Liquid operator "
            f"(server rejects the file) — use `slice: 0, n`"
        )

    # 3. wrapped filter chain inside a liquid tag
    for m in re.finditer(r"\{%-?\s*liquid\b(.*?)-?%\}", src, re.S):
        start_line = src[: m.start()].count(nl) + 1
        for offset, raw in enumerate(m.group(1).split(nl)):
            if raw.strip().startswith("|"):
                findings.append(
                    f"{path}:{start_line + offset}  filter chain wraps inside a "
                    f"liquid tag — each line is its own statement"
                )

print(f"scanned {len(paths)} liquid files")

if findings:
    print(f"\nFAILED - {len(findings)} finding(s):\n")
    for f in findings:
        print("  " + f)
    sys.exit(1)

print("PASSED - no known Liquid traps found.")
