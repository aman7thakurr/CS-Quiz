# PGIMER CP/047 — Computer Programmer : Practice Question Bank

Target: PGI Satellite Centre, Sangrur | Group B | CBT: 100 MCQs, 100 min, 100 marks | English | **+1 correct, −0.25 wrong, 0 unattempted**

**~13,955 usable questions total**, in two parts:

1. **Batch 1 – 296 original questions** (the 19 per-subject CSVs below), written fresh from your syllabus.
2. **Web harvest – 13,659 questions** in `csv/web/*_web.csv`, collected from public practice-MCQ pages on **Includehelp.com** and **Examveda.com** (both free, readable online), every row carrying its source URL. Deep-crawl work so far: **DBMS & SQL** 1,283 Qs (68 topic pages) · **Data Structures** 1,507 Qs (19 Examveda topic series) · **Java** 1,800 Qs (24 Examveda series) · **C++/OOP** 1,288 Qs (18 Examveda series + Includehelp) · **Programming in C** 1,088 Qs (13 Examveda series + Includehelp) · **Discrete Maths** 642 Qs (49 pages) · **Computer Networks** 380+70 Qs (Examveda series + aptitude sets) · **Operating Systems** 99 Qs (Examveda). Newer Examveda series: Python (26 series, ~1.6k Qs), PHP (15), HTML (9), CSS (9), JavaScript (12) into Web Technologies.

All files match the import template of the CBT Trainer app (`subject, topic, question, option_a..d, correct_letter, explanation, difficulty, source, tags`) and can be dropped into the app's **Import** page directly. Run the validation script first if you like: `python3 gen/validate.py`.

## ⚠️ Read this before using the web-harvested questions

- Content is **third-party** (Includehelp.com and Examveda.com public pages). It is gathered for your personal practice, **not** copies of actual PGIMER papers and **not** endorsed by PGI.
- Answers come from the source sites and **can contain errors** — verify suspicious items (your app lets you deactivate/flag questions).
- **Explanation coverage varies by source**: Includehelp rows usually carry an explanation; many Examveda rows (notably Data Structures & the OS series) have an empty explanation. Review / fill them in the app if you want explanations on every practice question.
- `difficulty` on harvested rows is an **unrated default = medium**; re-tag in the app if you want difficulty-filtered tests.
- Only questions that fit the strict 4-option / single-answer / A–D format were kept. Two-option True/False-style questions were dropped, so some pages (e.g. Python) yielded fewer rows than their raw count.
- Duplicates were removed *within* the harvested set; small overlap with Batch 1 is possible.

## Web harvest summary (csv/web)

| Syllabus subject | Questions |
|---|---|
| Web Technologies & Internet / PHP | 2,945 |
| Java | 1,893 |
| Python Programming | 1,581 |
| Data Structures | 1,533 |
| C++ / OOP | 1,489 |
| DBMS & SQL | 1,283 |
| Programming in C | 1,225 |
| Discrete Mathematics for CS | 642 |
| Computer Networks | 526 |
| Operating Systems | 166 |
| Software Engineering | 90 |
| Computer Fundamentals & Systems | 64 |
| Algorithms & Complexity | 52 |
| Computer Security | 50 |
| Linux/Unix & Troubleshooting | 45 |
| Digital Logic | 42 |
| Computer Organization & Architecture | 33 |
| **Total** | **13,659** |

### Data Structures topic coverage (ds_web_examveda.csv — Examveda, 19 series)

Introduction (100) · miscellaneous (98) · searching (96) · graph algorithms DFS/BFS/Dijkstra (96) · arrays (95) · dynamic programming (95) · linked lists (94) · BST / B-tree (93) · sorting (92) · stacks (91) · trees (91) · hashing (91) · advanced trees AVL/red-black (91) · heaps (90) · graphs (90) · string matching (66) · applications (60) · queues (45) · standard libraries (45). **Note:** these rows come from Examveda and frequently have no explanation text — treat as volume practice and cross-check tricky answers.

### Discrete Mathematics deep-crawl topic coverage (discrete_math_web.csv)

Sets (introduction/types/operations/algebra/multisets) · relations (representation, partial order) · functions (types, identity/composition, mathematical & algorithm functions) · logic (propositions, logical operations, conditional/biconditional, tautologies, predicate logic, normal forms) · counting (basic principles, permutation/combination, pigeonhole & recurrence) · recurrence relations (linear, particular/total solution, generating functions) · graphs (basics, types, isomorphic/regular/bipartite, representation, planar) · trees (introduction, binary trees, traversal, BST) · groups/semigroups/subgroups/normal subgroups · Boolean algebra & expressions & canonical forms & K-maps · posets, lattices, Hasse diagrams · probability · logic gates.

### DBMS & SQL deep-crawl topic coverage (dbms_sql_web.csv)

PL/SQL (129) · RAID (58) · Storage System (51) · Indexing (40) · Transact-SQL (38) · Schedules & serializability (34) · DBMS Architecture (29) · DBMS Language/DDL (29) · Query-processing internals (~80 across selection/evaluation/nested-loop/merge-join pages) · File organization & storage (~60: heap/sequential/cluster/indexed/B+ files) · Locking & concurrency (~60: lock-based, validation, timestamp, multiple granularity, 2PL) · Transaction & states & recovery/checkpoint (52) · MySQL (24) · Normalization (21) · Data models (21) · Integrity constraints (20) · Inference rules (20) · Relational algebra & calculus & joins (~56) · Decomposition algorithms (26) · Deadlock (18) · Functional dependency & keys & ER-mapping · Dynamic/static hashing (31) · Database buffer & catalog (34) · Failure classification + log-based recovery.

Deep-crawl files (newest first): **python_examveda_web.csv 1,581** (26 series) · **php_web_examveda.csv 668** · **js_web_examveda.csv 801** · **html_web_examveda.csv 608** · **css_web_examveda.csv 497** · **java_examveda_web.csv 1,800** (24 series: data types, declaration/access, arrays, strings, operators, constructors/methods, flow control, overriding/overloading, interfaces/abstract, inheritance, exceptions, threads, I/O, regex, event handling, collections, serialization/networking, autoboxing, generics, beans/JDBC, servlets, session/JSP, lifecycle/annotations, misc) · **cpp_examveda_web.csv 1,288** (18 series: intro, variables/types, operators, control flow, functions, arrays/strings, pointers/references, structs/unions, OOP, classes/objects, constructors/destructors, inheritance, polymorphism, file handling, exceptions, STL, multithreading, misc) · **c_web_examveda.csv 1,088** (13 series: misc, fundamentals, arrays/strings, operators/expressions, control structures, functions, pointers, preprocessor, struct/union, file I/O, storage class, memory allocation, stdlib) · **ds_web_examveda.csv 1,507** · **computer_networks_examveda_web.csv 380** (basics, tcp/ip, subnetting, ip routing, IPv6, NAT, VLANs, STP, wireless, WAN, internetworking, security, EIGRP/OSPF, misc) · **dbms_sql_web.csv 1,283** · **discrete_math_web.csv 642** · **computer_networks_deep_web.csv 70** · **os_web_examveda.csv 99**.
Per-page files also include (previously harvested): programming_in_c_web 140 · cpp_oop_web 136 · php_web 133 · java_web 93 · web_css_web 85 · web_js_web 66 · oops_concepts_web 65 · operating_system_web 67 · web_html_web 62 · computer_network_web 59 · algorithms_web 52 · cyber_security_web 50 · internet_email_web 46 · linux_web 45 · software_arch_web 43 · digital_logic_web 42 · computer_memory_web 41 · software_testing_web 34 · computer_org_web 33 · dsa_web 26 · types_of_computers_web 23 · ipv6_web 17 · agile_web 13 · python_web 10.

**Reproduce / extend:**
- `python3 includehelp_harvest.py` (edit the `PAGES` list) — page-list harvester. Parser handles Includehelp's `<h3>`, `<p><b>`, `<div class="mcqblock">` **and** `<div class="que_main_div">` (correct-option = `class="cor"`) layouts.
- `python3 harvest_dbms.py` — crawls the DBMS hub's ~70 per-topic pages → `csv/web/dbms_sql_web.csv`.
- `python3 harvest_generic.py "<subject>" <out.csv> "<hub1,hub2>" "<kw1|kw2>"` — generic per-topic crawler (used for Discrete Maths & Networking).
- `python3 examveda_harvest.py os|ds` — Examveda crawler shortcuts (OS & Data Structures).
- `python3 examveda_harvest.py series "<subject>" <out.csv> "<hub_url>" "<path-prefix>"` — crawl all practice series under a hub prefix (used for C, C++, Java, Networking, Data Structures).
- Always finish with `python3 summarize_web.py` to re-validate, cross-file de-duplicate and print per-subject totals.

## Files (one CSV per subject)

| # | Tier | Subject | File | Qs |
|---|------|---------|------|----|
| 1 | **S** | Programming in C | `programming_in_c.csv` | 13 |
| 2 | **S** | Data Structures | `data_structures.csv` | 15 |
| 3 | **S** | Algorithms & Complexity | `algorithms_and_complexity.csv` | 16 |
| 4 | **S** | DBMS & SQL | `dbms_and_sql.csv` | 20 |
| 5 | **S** | Operating Systems | `operating_systems.csv` | 20 |
| 6 | **S** | Computer Networks | `computer_networks.csv` | 20 |
| 7 | A | C++ / OOP | `cpp_oop.csv` | 16 |
| 8 | A | Java | `java.csv` | 16 |
| 9 | A | Computer Organization & Architecture | `computer_organization_and_architecture.csv` | 18 |
| 10 | B | Digital Logic | `digital_logic.csv` | 15 |
| 11 | A | Software Engineering | `software_engineering.csv` | 16 |
| 12 | A | System Analysis & Design | `system_analysis_and_design.csv` | 14 |
| 13 | A | Compiler & System Software | `compiler_and_system_software.csv` | 15 |
| 14 | B | Linux/Unix & Troubleshooting | `linux_unix_and_troubleshooting.csv` | 14 |
| 15 | B | Web Technologies & Internet / PHP | `web_technologies_and_internet_php.csv` | 14 |
| 16 | B | Discrete Mathematics for CS | `discrete_mathematics_for_cs.csv` | 14 |
| 17 | B | Computer Security | `computer_security.csv` | 14 |
| 18 | B | Storage / RAID / Data Organization | `storage_raid_data_organization.csv` | 12 |
| 19 | B | Computer Fundamentals & Systems | `computer_fundamentals_and_systems.csv` | 14 |

## CSV columns (app-import compatible)

```
subject, topic, question, option_a, option_b, option_c, option_d,
correct_letter (A–D), explanation, difficulty (easy|medium|hard),
source, tags (semicolon-separated)
```

Notes for import tools:
- Some code-tracing questions contain **multi-line code inside the question field** (properly quoted CSV — normal CSV readers handle them).
- `source` = `PGIMER CP-047 prep bank - original practice (Batch 1)` on every row — useful for filtering/future batches.
- Difficulty mix: **easy 201 · medium 95 · hard 0** (a hard-tier batch is planned next).
- Question flavour follows the real paper's emphasis: code/output tracing, SQL result sets, scheduling Gantt-style calculations, normalization, transactions, subnetting, complexity analysis, DS behaviour, protocol/architecture and scenario MCQs.

## Topic coverage highlights (S-tier, the "must master" core)

- **C:** sizeof/char, integer division & precedence tracing, switch fall-through, recursion, strings/null terminator, pointer arithmetic, array-to-pointer decay in functions, calloc vs malloc, union memory layout, static locals, macro pitfalls (SQR), file modes, bit set masks.
- **DS:** stack/queue properties, circular queue reuse, O(1) delete-without-predecessor, tree traversals, BST in-order, min-heap find-min O(1), hash collisions, sparse-graph representation, BFS=queue, stack for postfix, AVL balance rule, heap-based priority queue, hash average O(1), array random access.
- **Algorithms:** growth-rate ordering, doubling-loop O(log n), harmonic-series nested loops O(n log n), binary search, quicksort worst case, non-in-place merge sort, stability, divide & conquer, Kruskal greedy, memoized Fibonacci O(n), Dijkstra vs negative weights, Prim, topological sort DAG rule, Master-theorem recurrence, triangular loops O(n²), auxiliary space.
- **DBMS/SQL:** candidate key minimality, weak entities, BCNF rule, FD transitivity, DROP vs DELETE vs TRUNCATE, GROUP BY + HAVING, cross join row math, self join meaning, IN subqueries, DISTINCT + ORDER BY output, AVG ignoring NULL, ACID atomicity, lost updates, 2PL, non-repeatable reads, write-ahead logging, B+ tree leaves, 2NF partial dependency, intersection, views.
- **OS:** process state transitions, threads vs processes, FCFS average-wait calculation, SJF starvation, Round-Robin completion order, binary semaphore, producer-consumer `full` semaphore, Coffman conditions, Banker's safe state, logical vs physical address, paging fragmentation, FIFO Belady anomaly, page fault, TLB, chmod 755/640, SSTF starvation, shared memory IPC, fork syscall, privileged instructions, context switch.
- **Networks:** OSI layer roles, TCP/IP app layer, MAC(48)/IPv4(32) bits, /28 usable hosts, /26 mask, loopback, ARP vs DNS vs DHCP, UDP use cases, TCP handshake, port 443, HTTP 404/301/5xx semantics, switch vs router, IPv6 128-bit, CRC, flow vs congestion control, firewall, star topology, OSPF, GET safety.

## How it was built (regenerate/extend easily)

- Authoring scripts: `gen/` folder — one `gen_XX_<subject>.py` per subject; `_common.py` defines header/source/slugify; `run.py` regenerates all CSVs; `validate.py` re-checks structure (headers, 4 unique options, valid `correct_letter`, non-empty explanations) and prints coverage stats.
- To extend: add rows to a subject file (or add a new file), run `python3 gen/run.py`, re-run `python3 gen/validate.py`.

## Honest caveats

- These are **original practice MCQs written from the syllabus**, not recollections of actual PGIMER questions. Some stem/topic weightings are the author's judgement — treat as exam-style practice, not a leak/prediction.
- Everything here targets the CS core; per your own syllabus note, general GK/English/aptitude are intentionally excluded.
- AI-model answers are only as good as their source; every question carries an explanation so wrong answers double as learning, and the app lets you deactivate/flag any question.

## Next harvest batches (say "continue" to get more)

1. **Thinnest subjects vs syllabus weight** — Computer Org & Arch (33), Linux/Unix (45), Digital Logic (42), Algorithms (52), plus Storage/RAID (own subject), Compiler & System Software, System Analysis & Design. Best source: Sanfoundry chapters (COA/Linux/Digital-Logic/Compiler) via the page-fetch route.
2. **Hard-tier original set** (~120 Qs) to balance difficulty of the original bank.
3. Deduplication across source sites already runs on every `summarize_web.py` pass (exact normalized text); watch for near-duplicate (paraphrased) items when importing multiple language-series files.
