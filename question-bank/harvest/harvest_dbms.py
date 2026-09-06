#!/usr/bin/env python3
"""DBMS & SQL deep crawler for Includehelp.com.

The /mcq/dbms-... page is a HUB that lists per-topic DBMS MCQ pages.
This script:
  1. fetches the hub page(s),
  2. collects candidate hrefs, resolving each against the hub's own URL
     (relative hrefs like 'dbms-normalization-mcqs.aspx' belong to /mcq/),
  3. leaf-checks each candidate (must contain real inline questions),
  4. parses leaves with includehelp_harvest.parse_page,
  5. writes one combined CSV  csv/web/dbms_sql_web.csv  (subject 'DBMS & SQL').
Every row carries its page URL in `source`.
"""
import os, re, csv, html, subprocess, sys, time
from urllib.parse import urljoin

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # question-bank
WEB = os.path.join(REPO, "csv", "web")
CACHE = "/tmp/ihdbms"
os.makedirs(WEB, exist_ok=True)
os.makedirs(CACHE, exist_ok=True)

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
HEADER = ["subject","topic","question","option_a","option_b","option_c","option_d","correct_letter","explanation","difficulty","source","tags"]

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from includehelp_harvest import parse_page, clean  # reuse parser

HUBS = [
    "https://www.includehelp.com/mcq/dbms-multiple-choice-questions-mcqs-and-answers.aspx",
    "https://www.includehelp.com/dbms/aptitude-questions-and-answers.aspx",
]
EXCLUDE = ["sqlite", "hsqldb", "sqlalchemy", "oracle", "mongodb", "nosql", "redis",
           "couchdb", "mariadb", "cassandra", "dynamodb", "db2", "neo4j", "memcached",
           "ims-db", "indexeddb", "couchbase", "sql-server-misc"]

def fetch(url, dst=None, timeout=30):
    if dst and os.path.exists(dst) and os.path.getsize(dst) > 20000:
        return True
    r = subprocess.run(["curl", "-sL", "--max-time", str(timeout), "-A", UA, url],
                       capture_output=True, text=True)
    ok = len(r.stdout) > 20000
    if ok and dst:
        open(dst, "w", encoding="utf-8", errors="ignore").write(r.stdout)
    return ok

def body_text(raw):
    t = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', raw, flags=re.I)
    t = re.sub(r'<[^>]+>', ' ', t)
    return html.unescape(t)

def is_leaf(raw):
    stripped = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', raw, flags=re.I)
    ans = len(re.findall(r'\bAnswer\b', body_text(stripped), re.I))
    ol = len(re.findall(r'<ol[^>]*upper-alpha', stripped, re.I))
    mcq = len(re.findall(r'mcqblock', stripped, re.I))
    return ans >= 4 and (ol >= 1 or mcq >= 1)

def slug_topic_from_title(raw, url):
    m = re.search(r'<title[^>]*>(.*?)</title>', raw, re.S)
    title = clean(m.group(1)) if m else url
    title = re.sub(r'(?i)\s*(multiple.?choice questions?|mcqs?|questions? and answers?|with answers?|and answers?)\s*$', '', title)
    title = re.sub(r'\s+', ' ', title).strip()
    return (title or 'General')[:90]

def main():
    seen = {}
    leaves = []
    for h_i, hub in enumerate(HUBS):
        hubdst = os.path.join(CACHE, f"hub_{h_i}.html")
        if not fetch(hub, hubdst):
            print("hub fetch failed:", hub, file=sys.stderr)
            continue
        raw = open(hubdst, encoding='utf-8', errors='ignore').read()
        for href in re.findall(r'href="([^"]+)"', raw):
            if href.startswith('#') or 'javascript' in href.lower():
                continue
            absu = urljoin(hub, href).split('#')[0].split('?')[0]
            if 'includehelp.com' not in absu:
                continue
            p = absu.split('includehelp.com')[1].lower()
            if not any(k in p for k in ['dbms', 'sql', 'relational', 'rdbms']):
                continue
            if any(x in p for x in EXCLUDE):
                continue
            if absu in seen:
                continue
            seen[absu] = True
            leaves.append(absu)
    print(f"candidates: {len(leaves)}", file=sys.stderr)

    rows, page_stats, seen_q = [], [], {}
    for idx, url in enumerate(leaves):
        try:
            slug = re.sub(r'\W+', '_', url.split('/')[-1].replace('.aspx', ''))
            dst = os.path.join(CACHE, f"{idx:03d}_{slug}.html")
            if not fetch(url, dst):
                page_stats.append((url, 0, 'fetch-fail'))
                continue
            raw = open(dst, encoding='utf-8', errors='ignore').read()
            if not is_leaf(raw):
                page_stats.append((url, 0, 'not-leaf'))
                continue
            recs = parse_page(dst, url)
            if not recs:
                page_stats.append((url, 0, 'parsed-0'))
                continue
            topic = slug_topic_from_title(raw, url)
            n_added = 0
            for r in recs:
                letter = r['letter']
                if letter not in ('A', 'B', 'C', 'D'):
                    continue
                if len(r['opts']) < 4:  # keep only full 4-option items
                    continue
                qk = re.sub(r'\s+', ' ', r['q']).strip().lower()
                if qk in seen_q:
                    continue
                seen_q[qk] = True
                rows.append({
                    "subject": "DBMS & SQL",
                    "topic": topic,
                    "question": r['q'],
                    "option_a": r['opts'][0], "option_b": r['opts'][1],
                    "option_c": r['opts'][2], "option_d": r['opts'][3],
                    "correct_letter": letter,
                    "explanation": r['expl'] or "",
                    "difficulty": "medium",
                    "source": "web:Includehelp.com " + url,
                    "tags": "",
                })
                n_added += 1
            page_stats.append((url, n_added, 'ok'))
            print(f"{idx:3d} {topic[:45]:47s} added={n_added:4d}  {url}", file=sys.stderr)
            time.sleep(0.25)
        except Exception as ex:
            page_stats.append((url, 0, 'error:' + str(ex)[:40]))
            print(f"{idx:3d} ERROR {url}: {ex}", file=sys.stderr)
            continue

    out = os.path.join(WEB, "dbms_sql_web.csv")
    # merge with any existing file content is NOT done here (summarize handles dedupe)
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=HEADER)
        w.writeheader()
        w.writerows(rows)
    n_ok = sum(1 for s in page_stats if s[1])
    print(f"\nwrote {out}: {len(rows)} rows from {n_ok} leaf pages", file=sys.stderr)

if __name__ == "__main__":
    main()
