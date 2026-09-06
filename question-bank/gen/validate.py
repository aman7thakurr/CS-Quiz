import csv, os, glob, collections

CSVDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "csv")
HEADER = ["subject","topic","question","option_a","option_b","option_c","option_d","correct_letter","explanation","difficulty","source","tags"]
TIER = {
    "Programming in C": "S", "Data Structures": "S", "Algorithms & Complexity": "S",
    "DBMS & SQL": "S", "Operating Systems": "S", "Computer Networks": "S",
    "C++ / OOP": "A", "Java": "A", "Computer Organization & Architecture": "A",
    "Software Engineering": "A", "System Analysis & Design": "A", "Compiler & System Software": "A",
    "Digital Logic": "B", "Linux/Unix & Troubleshooting": "B",
    "Web Technologies & Internet / PHP": "B", "Discrete Mathematics for CS": "B",
    "Computer Security": "B", "Storage / RAID / Data Organization": "B",
    "Computer Fundamentals & Systems": "B",
}

problems, rows_all, per = [], [], collections.OrderedDict()
for path in sorted(glob.glob(os.path.join(CSVDIR, "*.csv"))):
    with open(path, newline="", encoding="utf-8") as f:
        rd = csv.DictReader(f)
        if rd.fieldnames != HEADER:
            problems.append(f"{os.path.basename(path)}: header mismatch {rd.fieldnames}")
        for r in rd:
            for k in HEADER:
                if k not in r:
                    problems.append(f"{os.path.basename(path)} row missing col {k}")
            r["_file"] = os.path.basename(path)
            rows_all.append(r)
    per[os.path.basename(path)] = sum(1 for r in rows_all if r["_file"] == os.path.basename(path))

for r in rows_all:
    if r["correct_letter"] not in "ABCD":
        problems.append(f"{r['_file']}: bad correct_letter {r['correct_letter']!r}")
    opts = [r[k] for k in ["option_a","option_b","option_c","option_d"]]
    if any(not o.strip() for o in opts):
        problems.append(f"{r['_file']}: empty option in q={r['question'][:40]!r}")
    if len(set(o.strip().lower() for o in opts)) != 4:
        problems.append(f"{r['_file']}: duplicate options in q={r['question'][:40]!r}")
    if not r["explanation"].strip():
        problems.append(f"{r['_file']}: missing explanation q={r['question'][:40]!r}")

print(f"TOTAL QUESTIONS: {len(rows_all)}")
print(f"FILES: {len(per)}")
easy = sum(1 for r in rows_all if r["difficulty"] == "easy")
med  = sum(1 for r in rows_all if r["difficulty"] == "medium")
hard = sum(1 for r in rows_all if r["difficulty"] == "hard")
print(f"difficulty mix: easy={easy} medium={med} hard={hard}")
for f, n in per.items():
    print(f"  {f:55s} {n}")
print("\nTop subjects by question volume:")
cnt = collections.Counter(r["subject"] for r in rows_all)
for s, n in cnt.most_common():
    print(f"  [{TIER.get(s,'?')}] {s:55s} {n}")

if problems:
    print("\nPROBLEMS:")
    for p in problems:
        print(" -", p)
else:
    print("\nVALIDATION OK: headers, options, answers, explanations all consistent.")

# coverage: unique topics
tc = collections.Counter(f"{r['subject']} :: {r['topic']}" for r in rows_all)
print(f"\nunique topic tags used: {len(tc)}")
