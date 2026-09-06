#!/usr/bin/env python3
"""Generic includehelp.com per-topic deep crawler (like harvest_dbms.py).

Usage:
  python3 harvest_generic.py <subject> <csv_filename> <hubs> <keywords>
    subject    : syllabus subject name placed in every row
    csv_filename: output file inside csv/web/
    hubs       : comma-separated hub URLs that link to per-topic MCQ leaf pages
    keywords   : pipe-separated path substrings a leaf URL MUST contain
                 (e.g. 'discrete-mathematics' or 'operating-system|os-|deadlock')

Each hub's relative hrefs resolve against the hub URL itself. Leaf pages are
detected by content (>=4 'Answer' markers + upper-alpha lists or mcqblock divs)
and parsed with includehelp_harvest.parse_page. Only 4-option, A-D-answer items
are kept. Source URL is recorded per row.
"""
import os, re, csv, subprocess, sys, time
from urllib.parse import urljoin

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(REPO, "csv", "web")
CACHE = "/tmp/ihgeneric"
os.makedirs(WEB, exist_ok=True); os.makedirs(CACHE, exist_ok=True)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
HEADER = ["subject","topic","question","option_a","option_b","option_c","option_d","correct_letter","explanation","difficulty","source","tags"]

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from includehelp_harvest import parse_page, parse_page_quemain, clean

def fetch(url, dst=None, timeout=30):
    if dst and os.path.exists(dst) and os.path.getsize(dst) > 20000:
        return True
    r = subprocess.run(["curl", "-sL", "--max-time", str(timeout), "-A", UA, url],
                       capture_output=True, text=True)
    ok = len(r.stdout) > 20000
    if ok and dst:
        open(dst, "w", encoding="utf-8", errors="ignore").write(r.stdout)
    return ok

def is_leaf(raw):
    body = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', raw, flags=re.I)
    ans = len(re.findall(r'Answer', body, re.I))
    ol = len(re.findall(r'<ol[^>]*upper-alpha', body, re.I))
    mcq = len(re.findall(r'mcqblock', body, re.I))
    qmd = len(re.findall(r'que_main_div', body, re.I))
    return ans >= 4 and (ol >= 1 or mcq >= 1 or qmd >= 1)

def topic_of(raw, url):
    m = re.search(r'<title[^>]*>(.*?)</title>', raw, re.S)
    t = clean(m.group(1)) if m else url
    t = re.sub(r'(?i)\s*(multiple.?choice questions?|mcqs?|questions? and answers?|with answers?|and answers?)\s*$', '', t)
    return (re.sub(r'\s+', ' ', t).strip() or 'General')[:90]

def collect_candidates(hub):
    dst = os.path.join(CACHE, re.sub(r'\W+', '_', hub.split('/')[-1]) + ".html")
    if not fetch(hub, dst):
        print("hub fetch fail:", hub, file=sys.stderr)
        return []
    raw = open(dst, encoding='utf-8', errors='ignore').read()
    out = []
    for href in re.findall(r'href="([^"]+)"', raw):
        if href.startswith('#') or 'javascript' in href.lower():
            continue
        a = urljoin(hub, href).split('#')[0].split('?')[0]
        if 'includehelp.com' not in a:
            continue
        if a not in out:
            out.append(a)
    return out

def main(argv):
    if len(argv) < 4:
        print(__doc__); return
    subject = argv[0]
    outname = argv[1]
    hubs = [h.strip() for h in argv[2].split(',') if h.strip()]
    kws = [k.strip() for k in argv[3].split('|') if k.strip()]
    # collect
    cands = []
    for hub in hubs:
        for c in collect_candidates(hub):
            p = c.split('includehelp.com')[1].lower()
            if not any(k.lower() in p for k in kws):
                continue
            if c not in cands:
                cands.append(c)
    print(f"candidates: {len(cands)}", file=sys.stderr)

    rows, seen_q = [], {}
    ok_pages = 0
    for idx, url in enumerate(cands):
        try:
            slug = re.sub(r'\W+', '_', url.split('/')[-1].replace('.aspx', ''))
            dst = os.path.join(CACHE, f"{idx:03d}_{slug}.html")
            if not fetch(url, dst):
                continue
            raw = open(dst, encoding='utf-8', errors='ignore').read()
            if not is_leaf(raw):
                continue
            recs = parse_page(dst, url)
            if not recs:
                recs = parse_page_quemain(dst, url)
            if not recs:
                continue
            topic = topic_of(raw, url)
            added = 0
            for r in recs:
                if r['letter'] not in ('A', 'B', 'C', 'D'):
                    continue
                if len(r['opts']) < 4:
                    continue
                qk = re.sub(r'\s+', ' ', r['q']).strip().lower()
                if qk in seen_q:
                    continue
                seen_q[qk] = 1
                rows.append({
                    "subject": subject, "topic": topic, "question": r['q'],
                    "option_a": r['opts'][0], "option_b": r['opts'][1],
                    "option_c": r['opts'][2], "option_d": r['opts'][3],
                    "correct_letter": r['letter'], "explanation": r['expl'] or "",
                    "difficulty": "medium", "source": "web:Includehelp.com " + url, "tags": "",
                })
                added += 1
            if added:
                ok_pages += 1
            print(f"{idx:3d} {topic[:48]:50s} added={added:4d}  {url}", file=sys.stderr)
            time.sleep(0.2)
        except Exception as ex:
            print(f"{idx:3d} ERROR {url}: {ex}", file=sys.stderr)
            continue
    path = os.path.join(WEB, outname)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=HEADER)
        w.writeheader()
        w.writerows(rows)
    print(f"wrote {path}: {len(rows)} rows from {ok_pages} pages", file=sys.stderr)

if __name__ == "__main__":
    main(sys.argv[1:])
