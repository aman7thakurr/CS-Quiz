#!/usr/bin/env python3
"""Normalize + QA the harvested web CSVs in question-bank/csv/web.
- rewrites each file: sets difficulty='medium' (unrated default), tags added
- reports row counts, issues (empty options/answers, !=4 options, dup questions)
- prints per-subject totals after grouping by subject column
"""
import csv, os, glob, re, collections

WEB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "csv", "web")
HEADER = ["subject","topic","question","option_a","option_b","option_c","option_d","correct_letter","explanation","difficulty","source","tags"]

def norm_dup(s):
    return re.sub(r"\s+", " ", s).strip().lower()

allrows, bysubj = [], collections.Counter()
problems, dupseen = [], {}
perfile = {}
for path in sorted(glob.glob(os.path.join(WEB, "*.csv"))):
    with open(path, newline="", encoding="utf-8") as f:
        rd = list(csv.DictReader(f))
    kept = []
    for r in rd:
        opts = [r[k].strip() for k in ["option_a","option_b","option_c","option_d"]]
        if any(not o for o in opts):
            problems.append(f"{os.path.basename(path)}: empty option :: {r['question'][:50]}")
            continue
        if len(set(o.lower() for o in opts)) != 4:
            problems.append(f"{os.path.basename(path)}: duplicate options :: {r['question'][:50]}")
            continue
        if r["correct_letter"] not in "ABCD":
            problems.append(f"{os.path.basename(path)}: bad letter {r['correct_letter']!r} :: {r['question'][:50]}")
            continue
        r["difficulty"] = "medium"  # unrated default for harvested items
        r["tags"] = (r.get("tags") or "") + ("" if not r.get("tags") else "") 
        nd = norm_dup(r["question"])
        if nd in dupseen:
            problems.append(f"{os.path.basename(path)}: DUPLICATE of {dupseen[nd]} :: {r['question'][:50]}")
            continue
        dupseen[nd] = os.path.basename(path)
        kept.append(r)
        allrows.append(r)
        bysubj[r["subject"]] += 1
    perfile[os.path.basename(path)] = len(kept)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=HEADER)
        w.writeheader()
        w.writerows(kept)

print(f"FILES with rows: {sum(1 for v in perfile.values() if v)} of {len(perfile)}")
print(f"TOTAL harvested questions kept: {len(allrows)}")
print("\nper file:")
for k, v in sorted(perfile.items()):
    print(f"  {k:45s} {v}")
print("\nper subject:")
for s, v in bysubj.most_common():
    print(f"  {s:55s} {v}")
print("\nproblems:")
for p in problems:
    print(" -", p)
print("problem count:", len(problems))
