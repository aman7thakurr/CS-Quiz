#!/usr/bin/env python3
"""Discover real DBMS/SQL MCQ page URLs on includehelp.com.

The /mcq/dbms-...-mcqs-and-answers.aspx page is a *hub* (links only).
This crawls known topic hubs and prints leaf pages that actually contain
inline questions (detected by 'Answer' + upper-alpha lists or mcqblock).
Output: prints one URL per line for leaf pages found.
"""
import re, subprocess, html, sys, time

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
BASE = "https://www.includehelp.com"

def fetch(url):
    r = subprocess.run(["curl", "-sL", "--max-time", "25", "-A", UA, url], capture_output=True, text=True)
    return r.stdout

def all_hrefs(raw):
    return re.findall(r'href="([^"]+\.aspx[^"]*)"', raw, re.I)

def looks_leaf(raw):
    body = re.sub(r'<script[\s\S]*?</script>', '', raw)
    ans = len(re.findall(r'Answer', body, re.I))
    mcq = len(re.findall(r'mcqblock', body, re.I)) + len(re.findall(r'upper-alpha', body, re.I))
    return ans >= 3 and mcq >= 3

def main():
    seeds = [
        "https://www.includehelp.com/dbms/aptitude-questions-and-answers.aspx",
        "https://www.includehelp.com/mcq/dbms-multiple-choice-questions-mcqs-and-answers.aspx",
        "https://www.includehelp.com/sql/mcq.aspx",
    ]
    found = {}
    for seed in seeds:
        raw = fetch(seed)
        hrefs = all_hrefs(raw)
        print(f"# seed {seed}: {len(hrefs)} candidate links", file=sys.stderr)
        for u in hrefs:
            if not u.startswith("http"):
                u = BASE + (u if u.startswith("/") else "/" + u)
            u = u.split("?")[0]
            if any(x in u.lower() for x in ["dbms", "sql", "relational", "database"]):
                if u in found:
                    continue
                try:
                    body = fetch(u)
                    if looks_leaf(body):
                        found[u] = True
                        print(u, flush=True)
                except Exception as ex:
                    print("# error", u, ex, file=sys.stderr)
                time.sleep(0.3)
    print(f"# done, leaf pages: {len(found)}", file=sys.stderr)

if __name__ == "__main__":
    main()
