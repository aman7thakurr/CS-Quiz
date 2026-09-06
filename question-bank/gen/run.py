import os, sys, glob

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

# Each gen_XX file writes its CSV on import. Sorted for deterministic order.
files = sorted(glob.glob(os.path.join(HERE, "gen_*.py")))
for f in files:
    print("=" * 70)
    print("running", os.path.basename(f))
    g = {"__file__": f}
    exec(compile(open(f, encoding="utf-8").read(), f, "exec"), g)
print("ALL SUBJECT FILES DONE")
