#!/usr/bin/env python3
"""Harvester: download Includehelp.com MCQ pages, parse Q/A/explanation, write CSV.
Usage:  python3 includehelp_harvest.py            (uses PAGES list below)
Output: <repo>/question-bank/csv/web/<slug>.csv  (import-ready, subject/topic mapped)
Source of each row is recorded in the `source` column.
NOTE: content is third-party (Includehelp.com), included for personal exam practice.
"""
import os, re, csv, html, time, subprocess, sys, unicodedata

# script lives at <repo>/question-bank/harvest/includehelp_harvest.py
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # -> <repo>/question-bank
OUT = os.path.join(REPO, "csv", "web")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

HEADER = ["subject","topic","question","option_a","option_b","option_c","option_d","correct_letter","explanation","difficulty","source","tags"]

def clean(s):
    s = re.sub(r'<br\s*/?>', ' ', s, flags=re.I)
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s)
    s = s.replace('\xa0', ' ').replace('\u200b', '')
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r'\n\s*\n+', '\n', s)
    return s.strip()

def fetch(url, dst):
    if os.path.exists(dst) and os.path.getsize(dst) > 20000:
        return True
    r = subprocess.run(["curl", "-sL", "--max-time", "30", "-A", UA, "-o", dst, url],
                       capture_output=True, text=True)
    ok = os.path.exists(dst) and os.path.getsize(dst) > 20000
    return ok

def parse_page(path, page_url):
    """Yield dicts: topic, question, options(list), answer_letter, explanation.
    Handles all includehelp.com MCQ layouts by splitting into blocks:
       a) blocks wrapped in <div class="mcqblock">
       b) blocks separated by <hr ...>
    Question wrapper may be <h3>, <p><b>, <p><strong>.
    """
    raw = open(path, encoding='utf-8', errors='ignore').read()
    raw = re.sub(r'<script[\s\S]*?</script>', ' ', raw)
    h2s = [(m.start(), clean(m.group(1))) for m in re.finditer(r'<h2[^>]*>(.*?)</h2>', raw, re.S)]
    def topic_at(pos):
        t = ""
        for p, name in h2s:
            if p < pos:
                t = name
        return t

    def code_text(pre):
        t = re.sub(r'<[^>]+>', '', pre)
        t = html.unescape(t)
        t = re.sub(r'[ \t]+\n', '\n', t)
        t = re.sub(r'\n{3,}', '\n\n', t)
        return t.strip()

    def ol_options(seg):
        m = re.search(r'<ol[^>]*list-style-type\s*:\s*["\']?\s*upper-alpha["\']?[^>]*>(.*?)</ol>', seg, re.S | re.I)
        if not m:
            return None
        return [clean(x) for x in re.findall(r'<li[^>]*>(.*?)</li>', m.group(1), re.S | re.I)]

    def block_starts(raw):
        hr = [m.start() for m in re.finditer(r'<hr\b', raw, re.I)]
        mb = [m.start() for m in re.finditer(r'<div\s+class=["\']mcqblock["\']', raw, re.I)]
        if len(mb) >= 2:
            return mb
        return hr

    def q_of(seg):
        m = re.search(r'<h[1-6][^>]*>(.*?)</h[1-6]>', seg, re.S | re.I)
        if not m:
            m = re.search(r'<p[^>]*>\s*<(?:b|strong)>(.*?)</(?:b|strong)>\s*</p>', seg, re.S | re.I)
        if not m:
            return ""
        t = clean(m.group(1))
        return re.sub(r'^\s*\d+[\.\)]\s*', '', t)

    results = []
    starts = block_starts(raw)
    if not starts:
        starts = [0]
    ends = starts[1:] + [len(raw)]
    for s, e in zip(starts, ends):
        seg = raw[s:e]
        if 'Answer' not in seg:
            continue
        opts = ol_options(seg)
        if not opts or len(opts) < 2:
            continue
        qtext = q_of(seg)
        if not qtext:
            continue
        ol_start = seg.find('<ol')
        pre_area = seg[:ol_start if ol_start != -1 else len(seg)]
        pres = re.findall(r'<pre[^>]*>(.*?)</pre>', pre_area, re.S | re.I)
        if pres:
            qtext = qtext + "\n```\n" + code_text(pres[0]) + "\n```"
        body = re.split(r'<p\s+class="btndisc"', seg, flags=re.I)[0]
        ans_hdr = re.search(r'(?:<(?:b|strong)>\s*Answer\s*:?\s*</(?:b|strong)>|<h[1-6][^>]*>\s*Answer\s*</h[1-6]>)', body, re.S | re.I)
        if not ans_hdr:
            continue
        tail = body[ans_hdr.end():]
        ex_hdr = re.search(r'(?:<(?:b|strong)>\s*Explanation\s*:?\s*</(?:b|strong)>|<h[1-6][^>]*>\s*Explanation\s*</h[1-6]>)', tail, re.S | re.I)
        if ex_hdr:
            ans_raw, ex_raw = tail[:ex_hdr.start()], tail[ex_hdr.end():]
        else:
            ans_raw, ex_raw = tail, ''
        ans = clean(ans_raw)
        la = re.match(r'^\(?([A-Ea-e])\)?\s*', ans)
        letter = la.group(1).upper() if la else ''
        results.append(dict(topic=topic_at(s), q=qtext, opts=opts,
                            letter=letter, ans_txt=ans, expl=clean(ex_raw), url=page_url))
    return results

# ---------------- subject mapping for syllabus ----------------
PAGES = [
 # (slug, page url, syllabus subject, difficulty default)
 ("programming_in_c", "https://www.includehelp.com/mcq/c-programming-language-mcqs.aspx", "Programming in C", "easy"),
 ("cpp_oop", "https://www.includehelp.com/mcq/cpp-mcqs.aspx", "C++ / OOP", "easy"),
 ("oops_concepts", "https://www.includehelp.com/mcq/oops-mcqs.aspx", "C++ / OOP", "easy"),
 ("java", "https://www.includehelp.com/mcq/java-multiple-choice-questions-mcqs.aspx", "Java", "easy"),
 ("python", "https://www.includehelp.com/mcq/python-mcqs.aspx", "Python Programming", "easy"),
 ("php", "https://www.includehelp.com/mcq/php-multiple-choice-questions-mcqs.aspx", "Web Technologies & Internet / PHP", "easy"),
 ("dsa", "https://www.includehelp.com/mcq/data-structure-and-algorithms-dsa-mcqs.aspx", "Data Structures", "easy"),
 ("algorithms", "https://www.includehelp.com/mcq/algorithms-multiple-choice-questions.aspx", "Algorithms & Complexity", "easy"),
 ("dbms", "https://www.includehelp.com/mcq/dbms-multiple-choice-questions-mcqs-and-answers.aspx", "DBMS & SQL", "easy"),
 ("mysql", "https://www.includehelp.com/mcq/mysql-mcqs.aspx", "DBMS & SQL", "easy"),
 ("tsql", "https://www.includehelp.com/mcq/transact-sql-t-sql-mcqs.aspx", "DBMS & SQL", "easy"),
 ("operating_system", "https://www.includehelp.com/mcq/operating-system-mcqs.aspx", "Operating Systems", "easy"),
 ("linux", "https://www.includehelp.com/mcq/linux-mcqs.aspx", "Linux/Unix & Troubleshooting", "easy"),
 ("computer_network", "https://www.includehelp.com/mcq/computer-network-mcqs.aspx", "Computer Networks", "easy"),
 ("ipv6", "https://www.includehelp.com/mcq/ipv6-mcqs.aspx", "Computer Networks", "easy"),
 ("computer_org", "https://www.includehelp.com/mcq/computer-organization-and-architecture-mcqs.aspx", "Computer Organization & Architecture", "easy"),
 ("digital_logic", "https://www.includehelp.com/mcq/digital-circuits-mcqs.aspx", "Digital Logic", "easy"),
 ("discrete_math", "https://www.includehelp.com/mcq/discrete-mathematics-mcqs.aspx", "Discrete Mathematics for CS", "easy"),
 ("cyber_security", "https://www.includehelp.com/mcq/cyber-security-mcqs.aspx", "Computer Security", "easy"),
 ("software_testing", "https://www.includehelp.com/mcq/software-testing-mcqs.aspx", "Software Engineering", "easy"),
 ("agile", "https://www.includehelp.com/mcq/agile-methodology-mcqs.aspx", "Software Engineering", "easy"),
 ("software_arch", "https://www.includehelp.com/mcq/software-architecture-mcqs.aspx", "Software Engineering", "easy"),
 ("computer_memory", "https://www.includehelp.com/mcq/computer-memory-mcqs.aspx", "Computer Fundamentals & Systems", "easy"),
 ("types_of_computers", "https://www.includehelp.com/mcq/types-of-computers-mcqs.aspx", "Computer Fundamentals & Systems", "easy"),
 ("internet_email", "https://www.includehelp.com/mcq/internet-and-email-mcqs.aspx", "Web Technologies & Internet / PHP", "easy"),
 ("web_js", "https://www.includehelp.com/mcq/javascript-multiple-choice-questions-mcqs.aspx", "Web Technologies & Internet / PHP", "easy"),
 ("web_html", "https://www.includehelp.com/mcq/html-multiple-choice-questions-mcqs.aspx", "Web Technologies & Internet / PHP", "easy"),
 ("web_css", "https://www.includehelp.com/mcq/css-multiple-choice-questions-mcqs.aspx", "Web Technologies & Internet / PHP", "easy"),
]

def parse_page_quemain(path, page_url):
    """Third includehelp layout: <div class="que_main_div"> blocks.

    <span class="que">N) question</span>
    <ol><li><a class="inc|cor" href=...>option</a></li> x4</ol>
    <div class="answer"><p><b>Correct answer: N<br/>answer text</b></p>
         [<p><b>Explanation:</b></p><p>expl..</p>]
    The correct option's <a> carries class "cor"; others "inc".
    """
    raw = open(path, encoding='utf-8', errors='ignore').read()
    raw = re.sub(r'<script[\s\S]*?</script>', ' ', raw)
    title = ""
    m = re.search(r'<title[^>]*>(.*?)</title>', raw, re.S)
    if m:
        title = clean(m.group(1))
    blocks = re.split(r'<div\s+class=["\']que_main_div["\']', raw)
    results = []
    for b in blocks[1:]:
        qm = re.search(r'<span\s+class=["\']que["\']>(.*?)</span>', b, re.S | re.I)
        if not qm:
            continue
        q = clean(qm.group(1))
        q = re.sub(r'^\s*\d+\s*[\)\.]\s*', '', q)
        # options as <a class="inc|cor">..</a> inside <li>
        opts, cor = [], None
        for mm in re.finditer(r'<a\s+class=["\'](inc|cor)["\'][^>]*>(.*?)</a>', b, re.S | re.I):
            opts.append(clean(mm.group(2)))
            if mm.group(1) == 'cor' and cor is None:
                cor = len(opts) - 1
        if len(opts) != 4:
            continue
        letter = chr(ord('A') + cor) if cor is not None else ''
        # explanation: from after 'Correct answer:' or an Explanation label
        expl = ''
        em = re.search(r'(?:<b>\s*Explanation\s*:?\s*</b>|<h[1-6][^>]*>\s*Explanation\s*</h[1-6]>)', b, re.S | re.I)
        if em:
            tail = b[em.end():]
            tail = re.split(r'</div>', tail)[0]
            expl = clean(tail)
        # code blocks before options belong to question
        ol_i = b.find('<ol')
        prearea = b[:ol_i if ol_i != -1 else len(b)]
        pres = re.findall(r'<pre[^>]*>(.*?)</pre>', prearea, re.S | re.I)
        if pres:
            t = re.sub(r'<[^>]+>', '', pres[0])
            q = q + "\n```\n" + clean(t) + "\n```"
        results.append(dict(topic=title, q=q, opts=opts, letter=letter,
                            ans_txt="", expl=expl, url=page_url))
    return results


def slug_topic(t):
    t = re.sub(r'\s*MCQs?\s*$', '', t or '', flags=re.I)
    return (t or "General").strip()[:80]

def main(argv):
    os.makedirs(OUT, exist_ok=True)
    os.makedirs('/tmp/ihhtml', exist_ok=True)
    total = 0
    report = []
    for slug, url, subject, diff in PAGES:
        if argv and slug not in argv:
            continue
        dst = f'/tmp/ihhtml/{slug}.html'
        if not fetch(url, dst):
            print("FETCH FAIL:", slug, url)
            report.append((slug, 0, "fetch fail"))
            continue
        recs = parse_page(dst, url)
        rows = []
        for r in recs:
            opts = r['opts']
            if len(opts) < 2:
                continue
            # letters should be A,B,C,D in listed order
            # validate answer
            letter = r['letter']
            expl = r['expl'] or (f"Answer: {r['ans_txt']}" if r['ans_txt'] else "")
            if letter and letter in 'ABCDE':
                li = ord(letter)-65
                if li < len(opts):
                    expl_final = r['expl'] or ""
                    # If site wrote the option into Answer, use explanation field only
                    row = [subject, slug_topic(r['topic']), r['q']] + (opts[:4] + ['','','',''])[:4] + [letter, expl_final, diff, "web:Includehelp.com " + url, ""]
                    rows.append(row)
        # write
        fname = slug + "_web.csv"
        path = os.path.join(OUT, fname)
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(HEADER)
            w.writerows(rows)
        total += len(rows)
        report.append((slug, len(rows), url))
        print(f"{slug:22s} rows={len(rows):5d}  {url}")
        time.sleep(0.5)
    print("TOTAL:", total)
    return report

if __name__ == "__main__":
    main(sys.argv[1:])
