#!/usr/bin/env python3
"""Examveda.com practice-series harvester (curl-accessible, Q&A inline).

Layout: per question => <div class="question-main">Q</div>, 4 <p> blocks with
<label>A. </label><input radio/><label>option</label>, a hidden
<input id="answer_<id>" value="N"> (1-based correct), and an answer_container
with "Answer: Option X" + "Solution: ...".

Usage:
  python3 examveda_harvest.py os                          # Operating Systems
  python3 examveda_harvest.py ds                          # Data Structures
  python3 examveda_harvest.py series <subject> <outfile> <hub_url> <path_prefix>
      # crawl every practice series linked under path_prefix on the hub page,
      # e.g. path_prefix 'c-program' -> all /c-program/practice-mcq-... series
"""
import os, re, csv, html, subprocess, sys, time

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(REPO, "csv", "web")
CACHE = "/tmp/ivexam"
os.makedirs(WEB, exist_ok=True); os.makedirs(CACHE, exist_ok=True)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
HEADER = ["subject","topic","question","option_a","option_b","option_c","option_d","correct_letter","explanation","difficulty","source","tags"]

def clean(s):
    s = re.sub(r'<br\s*/?>', ' ', s, flags=re.I)
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s).replace('\xa0', ' ')
    s = re.sub(r'[ \t]+', ' ', s)
    return s.strip()

def fetch(url):
    r = subprocess.run(["curl", "-sL", "--max-time", "25", "-A", UA, url], capture_output=True, text=True)
    return r.stdout if len(r.stdout) > 20000 else ""

def page_nums(raw):
    return {int(m.group(1)) for m in re.finditer(r'\?page=(\d+)', raw)}

def parse_page(raw, url):
    body = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', raw, flags=re.I)
    chunks = body.split('<div class="question-main">')
    out = []
    for ch in chunks[1:]:
        qtext = clean(ch.split('</div>')[0])
        if not qtext:
            continue
        opts = {}
        pat = re.compile(r'<label[^>]*>\s*([A-D])\.\s*</label>\s*<input[^>]*>\s*<label[^>]*>([\s\S]*?)</label>')
        for mm in pat.finditer(ch):
            opts[mm.group(1)] = clean(mm.group(2))
        if len(opts) != 4 or not all(k in opts for k in 'ABCD'):
            continue
        am = re.search(r'id="answer_\d+"\s+value="(\d)"', ch)
        if am:
            letter = chr(ord('A') + int(am.group(1)) - 1)
        else:
            cm = re.search(r'Answer:.*?Option\s+([A-D])', ch)
            if not cm:
                continue
            letter = cm.group(1)
        if letter not in opts:
            continue
        expl = ''
        si = ch.find('Solution:')
        if si != -1:
            tail = ch[si + len('Solution:'):]
            expl = clean(tail.split('<div class="question-')[0])[:900]
        out.append({"question": qtext, "opts": [opts[k] for k in 'ABCD'],
                    "letter": letter, "expl": expl, "url": url})
    return out

def crawl(base, max_pages=14):
    p1 = fetch(base)
    if not p1:
        return []
    nums = sorted([1] + [p for p in page_nums(p1) if 1 < p <= max_pages])
    recs = []
    for p in nums:
        url = base if p == 1 else base + f"?page={p}"
        raw = fetch(url)
        if raw:
            r = parse_page(raw, url)
            recs += r
            print(f"    page {p}: {len(r)} q", file=sys.stderr)
        time.sleep(0.3)
    return recs

def topic_label_from_series(url):
    seg = [s for s in url.split('/') if 'practice-mcq' in s]
    if not seg:
        return "Miscellaneous"
    lab = seg[0].replace('practice-mcq-question-on-', '').replace('-', ' ').strip()
    lab = re.sub(r'\s+', ' ', lab).strip()
    return lab[:80] or "Miscellaneous"

def series_urls(hub_url, path_prefix):
    raw = fetch(hub_url)
    if not raw:
        return []
    pat = re.compile(r'href="(https://www\.examveda\.com/' + re.escape(path_prefix) + r'/[^"]*practice-mcq[^"]*)"')
    return list(dict.fromkeys(pat.findall(raw)))

def write_csv(path, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(HEADER)
        for r in rows:
            w.writerow([r["subject"], r["topic"], r["question"], r["opts"][0],
                        r["opts"][1], r["opts"][2], r["opts"][3], r["letter"],
                        r["expl"], "medium", "web:Examveda.com " + r["url"], ""])

def run_subject(subject, series, outfile):
    rows, seen = [], {}
    for url in series:
        recs = crawl(url)
        topic = topic_label_from_series(url)
        for r in recs:
            qk = re.sub(r'\s+', ' ', r["question"]).strip().lower()
            if qk in seen:
                continue
            seen[qk] = 1
            r["subject"] = subject
            r["topic"] = topic
            rows.append(r)
        print(f"  {topic}: {len(recs)} raw, cumulative {len(rows)}", file=sys.stderr)
    write_csv(os.path.join(WEB, outfile), rows)
    print(f"wrote {outfile}: {len(rows)} rows", file=sys.stderr)
    return len(rows)

def do_os():
    url = "https://www.examveda.com/computer-fundamentals/practice-mcq-question-on-operating-system/"
    recs = crawl(url)
    rows = []
    for r in recs:
        r["subject"] = "Operating Systems"
        r["topic"] = "Operating System (Examveda)"
        rows.append(r)
    write_csv(os.path.join(WEB, "os_web_examveda.csv"), rows)
    print("OS done:", len(rows), file=sys.stderr)

def do_ds():
    hub = "https://www.examveda.com/mcq-question-on-data-structure/"
    series = series_urls(hub, "data-structure")
    print(f"DS series: {len(series)}", file=sys.stderr)
    run_subject("Data Structures", series, "ds_web_examveda.csv")

def do_series(subject, outfile, hub, prefix):
    series = series_urls(hub, prefix)
    print(f"series found: {len(series)}", file=sys.stderr)
    run_subject(subject, series, outfile)

def main():
    a = sys.argv[1:]
    if a and a[0] == 'os':
        do_os()
    elif a and a[0] == 'ds':
        do_ds()
    elif a and a[0] == 'series' and len(a) >= 5:
        do_series(a[1], a[2], a[3], a[4])
    else:
        print(__doc__)

if __name__ == "__main__":
    main()
