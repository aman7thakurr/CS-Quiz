import csv, os, re

HEADER = ["subject","topic","question","option_a","option_b","option_c","option_d","correct_letter","explanation","difficulty","source","tags"]
SOURCE = "PGIMER CP-047 prep bank - original practice (Batch 1)"
OUTDIR = os.path.join(os.path.dirname(__file__), "..", "csv")

def slugify(subject):
    s = subject.lower()
    s = s.replace("c++", "cpp")
    s = s.replace("&", "and")
    for ch in ["/", ",", "-", "(", ")", "."]:
        s = s.replace(ch, "_")
    s = s.replace(" ", "_")
    s = re.sub(r"_+", "_", s)
    return s.strip("_")

def write(subject, rows, filename=None):
    os.makedirs(OUTDIR, exist_ok=True)
    if filename is None:
        filename = slugify(subject) + ".csv"
    path = os.path.join(OUTDIR, filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(HEADER)
        for r in rows:
            w.writerow([
                r["subject"], r["topic"], r["question"],
                r["option_a"], r["option_b"], r["option_c"], r["option_d"],
                r["correct"], r["explanation"], r["difficulty"], SOURCE,
                ";".join(r["tags"])
            ])
    print("wrote", path, "rows =", len(rows))
