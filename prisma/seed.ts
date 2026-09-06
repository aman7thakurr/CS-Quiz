import { PrismaClient, Difficulty, QuestionStatus } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedSubject {
  name: string;
  slug: string;
  order: number;
  topics: string[];
}

interface SeedQuestion {
  subjectSlug: string;
  topicName?: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
  source: string;
  tags: string[];
}

const subjects: SeedSubject[] = [
  {
    name: "Computer Fundamentals & Computer Awareness",
    slug: "computer-fundamentals",
    order: 1,
    topics: [
      "Number Systems & Conversions",
      "Computer Architecture Basics",
      "Memory Types (RAM, ROM, Cache)",
      "Input/Output Devices",
      "Computer Generations",
      "Software Types (System, Application)",
      "File Systems & Storage",
    ],
  },
  {
    name: "Programming in C",
    slug: "programming-c",
    order: 2,
    topics: [
      "Data Types & Variables",
      "Operators & Expressions",
      "Control Flow (if, switch, loops)",
      "Functions & Recursion",
      "Arrays & Strings",
      "Pointers & Memory Management",
      "Structures & Unions",
      "File Handling",
      "Preprocessor Directives",
    ],
  },
  {
    name: "Programming in C++ (OOP)",
    slug: "programming-cpp",
    order: 3,
    topics: [
      "Classes & Objects",
      "Constructors & Destructors",
      "Inheritance (Single, Multiple, Multilevel)",
      "Polymorphism (Compile-time, Runtime)",
      "Encapsulation & Abstraction",
      "Operator Overloading",
      "Templates",
      "Exception Handling",
      "STL (Standard Template Library)",
    ],
  },
  {
    name: "Java Programming",
    slug: "java-programming",
    order: 4,
    topics: [
      "Java Basics & JVM",
      "OOP in Java",
      "Interfaces & Abstract Classes",
      "Exception Handling",
      "Collections Framework",
      "Multithreading",
      "I/O Streams",
      "JDBC",
      "Generics",
    ],
  },
  {
    name: "Python Programming",
    slug: "python-programming",
    order: 5,
    topics: [
      "Data Types & Variables",
      "Control Flow & Loops",
      "Functions & Lambda",
      "Lists, Tuples, Dictionaries, Sets",
      "String Operations",
      "File Handling",
      "OOP in Python",
      "Modules & Packages",
      "List Comprehensions & Generators",
    ],
  },
  {
    name: "Data Structures & Algorithms",
    slug: "data-structures-algorithms",
    order: 6,
    topics: [
      "Arrays & Linked Lists",
      "Stacks & Queues",
      "Trees (Binary, BST, AVL)",
      "Graphs (BFS, DFS)",
      "Hashing & Hash Tables",
      "Sorting Algorithms",
      "Searching Algorithms",
      "Dynamic Programming",
      "Time & Space Complexity",
      "Greedy Algorithms",
    ],
  },
  {
    name: "Database Management Systems (DBMS) & SQL",
    slug: "dbms-sql",
    order: 7,
    topics: [
      "Relational Model",
      "ER Diagrams",
      "Normalization (1NF–BCNF)",
      "SQL Queries (SELECT, JOIN, GROUP BY)",
      "Transactions & ACID Properties",
      "Concurrency Control",
      "Indexing & B-Trees",
      "Views, Triggers, Stored Procedures",
      "NoSQL Basics",
    ],
  },
  {
    name: "Operating Systems",
    slug: "operating-systems",
    order: 8,
    topics: [
      "Process Management",
      "CPU Scheduling (FCFS, SJF, Round Robin)",
      "Deadlocks",
      "Memory Management (Paging, Segmentation)",
      "Virtual Memory",
      "File Systems",
      "Disk Scheduling",
      "Threads & Synchronization",
      "Linux Basics",
    ],
  },
  {
    name: "Computer Networks & Network Security",
    slug: "computer-networks",
    order: 9,
    topics: [
      "OSI & TCP/IP Models",
      "IP Addressing & Subnetting",
      "Routing Protocols",
      "TCP vs UDP",
      "DNS, DHCP, HTTP",
      "Network Devices (Router, Switch, Hub)",
      "Firewalls & VPN",
      "Encryption (Symmetric, Asymmetric)",
      "Network Security Threats",
      "Wireless Networks",
    ],
  },
  {
    name: "Computer Organization & Architecture + Digital Logic",
    slug: "computer-organization",
    order: 10,
    topics: [
      "Boolean Algebra & Logic Gates",
      "Combinational Circuits (Adder, MUX, Decoder)",
      "Sequential Circuits (Flip-flops, Counters)",
      "CPU Architecture (ALU, CU, Registers)",
      "Instruction Cycle",
      "Pipelining",
      "Memory Hierarchy",
      "I/O Organization",
      "Number Representations (Fixed/Floating Point)",
    ],
  },
  {
    name: "Software Engineering",
    slug: "software-engineering",
    order: 11,
    topics: [
      "SDLC Models (Waterfall, Agile, Spiral)",
      "Requirements Engineering",
      "Software Design (Cohesion, Coupling)",
      "Testing (Unit, Integration, System)",
      "Software Metrics",
      "Project Management",
      "Version Control",
      "UML Diagrams",
      "Software Maintenance",
    ],
  },
  {
    name: "Web Technologies & Internet Fundamentals",
    slug: "web-technologies",
    order: 12,
    topics: [
      "HTML & HTML5",
      "CSS & Responsive Design",
      "JavaScript Fundamentals",
      "HTTP/HTTPS Protocols",
      "Web Servers (Apache, Nginx)",
      "REST APIs",
      "Cookies & Sessions",
      "PHP Basics",
      "XML & JSON",
    ],
  },
];

const questions: SeedQuestion[] = [
  // ─── Computer Fundamentals (3 questions) ──────────────
  {
    subjectSlug: "computer-fundamentals",
    topicName: "Number Systems & Conversions",
    text: "What is the decimal equivalent of the binary number **11010**?",
    options: ["24", "26", "28", "30"],
    correctIndex: 1,
    explanation:
      "11010 in binary = 1×16 + 1×8 + 0×4 + 1×2 + 0×1 = 16 + 8 + 2 = 26.",
    difficulty: Difficulty.EASY,
    source: "Seed — Computer Fundamentals basics",
    tags: ["number-systems", "binary"],
  },
  {
    subjectSlug: "computer-fundamentals",
    topicName: "Memory Types (RAM, ROM, Cache)",
    text: "Which type of memory is **volatile** and loses its contents when power is turned off?",
    options: ["ROM", "EPROM", "RAM", "EEPROM"],
    correctIndex: 2,
    explanation:
      "RAM (Random Access Memory) is volatile — its stored data is lost when power is removed. ROM and its variants retain data without power.",
    difficulty: Difficulty.EASY,
    source: "Seed — Computer Fundamentals basics",
    tags: ["memory", "volatile"],
  },
  {
    subjectSlug: "computer-fundamentals",
    topicName: "Computer Generations",
    text: "Integrated Circuits (ICs) were used in which generation of computers?",
    options: [
      "First Generation",
      "Second Generation",
      "Third Generation",
      "Fourth Generation",
    ],
    correctIndex: 2,
    explanation:
      "Third generation computers (1964–1971) used Integrated Circuits (ICs), replacing individual transistors. This dramatically reduced size and cost.",
    difficulty: Difficulty.EASY,
    source: "Seed — Computer Fundamentals basics",
    tags: ["history", "generations"],
  },

  // ─── Programming in C (4 questions, including code) ───
  {
    subjectSlug: "programming-c",
    topicName: "Pointers & Memory Management",
    text: 'What will be the output of the following C code?\n\n```c\n#include <stdio.h>\nint main() {\n    int x = 10;\n    int *p = &x;\n    *p = 20;\n    printf("%d", x);\n    return 0;\n}\n```',
    options: ["10", "20", "Address of x", "Compilation error"],
    correctIndex: 1,
    explanation:
      "The pointer `p` stores the address of `x`. Dereferencing `p` with `*p = 20` changes the value at that address, so `x` becomes 20.",
    difficulty: Difficulty.EASY,
    source: "Seed — Programming in C",
    tags: ["pointers", "code-output"],
  },
  {
    subjectSlug: "programming-c",
    topicName: "Data Types & Variables",
    text: "What is the size of `int` data type in C on a typical 64-bit system using GCC?",
    options: ["2 bytes", "4 bytes", "8 bytes", "Depends on the compiler"],
    correctIndex: 1,
    explanation:
      "On most modern 64-bit systems with GCC, `int` is 4 bytes (32 bits). However, the C standard only guarantees `int` is at least 16 bits; the actual size is implementation-defined.",
    difficulty: Difficulty.MEDIUM,
    source: "Seed — Programming in C",
    tags: ["data-types", "size"],
  },
  {
    subjectSlug: "programming-c",
    topicName: "Control Flow (if, switch, loops)",
    text: 'What will the following C code print?\n\n```c\n#include <stdio.h>\nint main() {\n    int i;\n    for (i = 0; i < 5; i++) {\n        if (i == 3)\n            break;\n    }\n    printf("%d", i);\n    return 0;\n}\n```',
    options: ["5", "3", "4", "0"],
    correctIndex: 1,
    explanation:
      "The loop increments `i` from 0 to 4. When `i == 3`, the `break` statement exits the loop immediately, so `i` retains the value 3.",
    difficulty: Difficulty.EASY,
    source: "Seed — Programming in C",
    tags: ["loops", "break", "code-output"],
  },
  {
    subjectSlug: "programming-c",
    topicName: "Functions & Recursion",
    text: "What is the output of `factorial(5)` given the following recursive function?\n\n```c\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n```",
    options: ["24", "120", "60", "720"],
    correctIndex: 1,
    explanation:
      "factorial(5) = 5 × 4 × 3 × 2 × 1 = 120. The base case returns 1 when n ≤ 1, and each recursive call multiplies n by factorial(n−1).",
    difficulty: Difficulty.MEDIUM,
    source: "Seed — Programming in C",
    tags: ["recursion", "factorial", "code-output"],
  },

  // ─── C++ (3 questions) ────────────────────────────────
  {
    subjectSlug: "programming-cpp",
    topicName: "Inheritance (Single, Multiple, Multilevel)",
    text: "In C++, which access specifier allows a derived class to access the members of the base class, but not the outside world?",
    options: ["public", "private", "protected", "friend"],
    correctIndex: 2,
    explanation:
      "`protected` members are accessible within the class itself and by derived classes, but not from outside the class hierarchy. `private` restricts access even from derived classes.",
    difficulty: Difficulty.EASY,
    source: "Seed — C++ OOP",
    tags: ["inheritance", "access-specifier"],
  },
  {
    subjectSlug: "programming-cpp",
    topicName: "Polymorphism (Compile-time, Runtime)",
    text: "Which keyword is used to declare a function in a base class that can be overridden in a derived class for runtime polymorphism?",
    options: ["static", "virtual", "inline", "friend"],
    correctIndex: 1,
    explanation:
      "The `virtual` keyword enables runtime polymorphism. When a base class function is declared `virtual`, calling it through a base class pointer invokes the derived class version if overridden.",
    difficulty: Difficulty.EASY,
    source: "Seed — C++ OOP",
    tags: ["polymorphism", "virtual"],
  },
  {
    subjectSlug: "programming-cpp",
    topicName: "Classes & Objects",
    text: 'What is the output of this C++ code?\n\n```cpp\n#include <iostream>\nusing namespace std;\nclass A {\npublic:\n    A() { cout << "C"; }\n    ~A() { cout << "D"; }\n};\nint main() {\n    A obj1, obj2;\n    return 0;\n}\n```',
    options: ["CCDD", "CDCD", "CDDC", "CCDD (in stack order)"],
    correctIndex: 0,
    explanation:
      "Two objects are created (constructor called twice: CC). Destructors are called in reverse order of construction (stack unwinding), printing DD. Output: CCDD.",
    difficulty: Difficulty.MEDIUM,
    source: "Seed — C++ OOP",
    tags: ["constructor", "destructor", "code-output"],
  },

  // ─── Java (3 questions) ───────────────────────────────
  {
    subjectSlug: "java-programming",
    topicName: "Java Basics & JVM",
    text: "Which component of JVM is responsible for converting bytecode to machine code at runtime?",
    options: ["Class Loader", "JIT Compiler", "Garbage Collector", "JRE"],
    correctIndex: 1,
    explanation:
      "The JIT (Just-In-Time) Compiler converts bytecode into native machine code at runtime, improving performance by compiling frequently executed code paths.",
    difficulty: Difficulty.MEDIUM,
    source: "Seed — Java Programming",
    tags: ["jvm", "jit"],
  },
  {
    subjectSlug: "java-programming",
    topicName: "Exception Handling",
    text: "In Java, which block is guaranteed to execute regardless of whether an exception occurs?",
    options: ["try", "catch", "finally", "throw"],
    correctIndex: 2,
    explanation:
      "The `finally` block always executes after the try-catch blocks, whether an exception was thrown or not. It is used for cleanup operations like closing resources.",
    difficulty: Difficulty.EASY,
    source: "Seed — Java Programming",
    tags: ["exceptions", "finally"],
  },
  {
    subjectSlug: "java-programming",
    topicName: "Interfaces & Abstract Classes",
    text: 'What will happen when you try to compile and run this code?\n\n```java\ninterface Printable {\n    void print();\n}\nclass Doc implements Printable {\n    public void print() {\n        System.out.println("Printing");\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Printable p = new Doc();\n        p.print();\n    }\n}\n```',
    options: [
      "Compilation error",
      'Prints "Printing"',
      "Runtime exception",
      "Prints nothing",
    ],
    correctIndex: 1,
    explanation:
      "The code compiles and runs correctly. `Doc` implements the `Printable` interface, so a `Printable` reference can point to a `Doc` object. Calling `p.print()` invokes `Doc`'s implementation.",
    difficulty: Difficulty.EASY,
    source: "Seed — Java Programming",
    tags: ["interfaces", "code-output"],
  },

  // ─── Python (3 questions) ─────────────────────────────
  {
    subjectSlug: "python-programming",
    topicName: "Lists, Tuples, Dictionaries, Sets",
    text: "What is the output of `list(range(1, 10, 3))` in Python?",
    options: [
      "[1, 3, 6, 9]",
      "[1, 4, 7]",
      "[1, 4, 7, 10]",
      "[3, 6, 9]",
    ],
    correctIndex: 1,
    explanation:
      "`range(1, 10, 3)` generates numbers starting at 1, up to (but not including) 10, with step 3: 1, 4, 7. So the list is [1, 4, 7].",
    difficulty: Difficulty.EASY,
    source: "Seed — Python Programming",
    tags: ["range", "lists"],
  },
  {
    subjectSlug: "python-programming",
    topicName: "Data Types & Variables",
    text: 'What will `type([]) == type(())` evaluate to in Python?',
    options: ["True", "False", "TypeError", "None"],
    correctIndex: 1,
    explanation:
      "`[]` is a list (`<class 'list'>`) and `()` is a tuple (`<class 'tuple'>`). Since they are different types, the comparison returns `False`.",
    difficulty: Difficulty.MEDIUM,
    source: "Seed — Python Programming",
    tags: ["types", "comparison"],
  },
  {
    subjectSlug: "python-programming",
    topicName: "List Comprehensions & Generators",
    text: "What is the output of the following Python code?\n\n```python\nresult = [x**2 for x in range(5) if x % 2 != 0]\nprint(result)\n```",
    options: ["[0, 1, 4, 9, 16]", "[1, 9]", "[1, 4, 9]", "[0, 4, 16]"],
    correctIndex: 1,
    explanation:
      "The list comprehension filters odd numbers (1, 3) from range(5) and squares them: 1²=1, 3²=9. Result: [1, 9].",
    difficulty: Difficulty.MEDIUM,
    source: "Seed — Python Programming",
    tags: ["list-comprehension", "code-output"],
  },

  // ─── Data Structures & Algorithms (3 questions) ───────
  {
    subjectSlug: "data-structures-algorithms",
    topicName: "Time & Space Complexity",
    text: "What is the **worst-case** time complexity of QuickSort?",
    options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
    correctIndex: 1,
    explanation:
      "QuickSort's worst case occurs when the pivot is always the smallest or largest element (e.g., already sorted array with first-element pivot), resulting in O(n²) comparisons.",
    difficulty: Difficulty.MEDIUM,
    source: "Seed — Data Structures & Algorithms",
    tags: ["sorting", "complexity", "quicksort"],
  },
  {
    subjectSlug: "data-structures-algorithms",
    topicName: "Stacks & Queues",
    text: "If elements A, B, C, D are pushed onto a stack in order, and two pops are performed, what is the top element?",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
    explanation:
      "Stack follows LIFO. Push order: A(bottom), B, C, D(top). First pop removes D, second pop removes C. Top element is now B.",
    difficulty: Difficulty.EASY,
    source: "Seed — Data Structures & Algorithms",
    tags: ["stack", "lifo"],
  },
  {
    subjectSlug: "data-structures-algorithms",
    topicName: "Trees (Binary, BST, AVL)",
    text: "What is the maximum number of nodes in a binary tree of height **h**?",
    options: ["2^h", "2^(h+1) − 1", "2h + 1", "h^2"],
    correctIndex: 1,
    explanation:
      "A binary tree of height h (where height of root = 0) can have at most 2^(h+1) − 1 nodes. This is a complete binary tree where every level is fully filled.",
    difficulty: Difficulty.MEDIUM,
    source: "Seed — Data Structures & Algorithms",
    tags: ["binary-tree", "nodes"],
  },

  // ─── DBMS & SQL (3 questions) ─────────────────────────
  {
    subjectSlug: "dbms-sql",
    topicName: "Normalization (1NF–BCNF)",
    text: "A relation is in **3NF** if it is in 2NF and has no:",
    options: [
      "Partial dependencies",
      "Transitive dependencies",
      "Multi-valued dependencies",
      "Functional dependencies",
    ],
    correctIndex: 1,
    explanation:
      "Third Normal Form (3NF) requires that the relation is in 2NF and every non-prime attribute is non-transitively dependent on the primary key — i.e., no transitive dependencies.",
    difficulty: Difficulty.MEDIUM,
    source: "Seed — DBMS",
    tags: ["normalization", "3nf"],
  },
  {
    subjectSlug: "dbms-sql",
    topicName: "SQL Queries (SELECT, JOIN, GROUP BY)",
    text: "Which SQL clause is used to filter groups after a `GROUP BY` operation?",
    options: ["WHERE", "HAVING", "ORDER BY", "FILTER"],
    correctIndex: 1,
    explanation:
      "`HAVING` filters groups after `GROUP BY`, while `WHERE` filters individual rows before grouping. Example: `SELECT dept, COUNT(*) FROM emp GROUP BY dept HAVING COUNT(*) > 5`.",
    difficulty: Difficulty.EASY,
    source: "Seed — DBMS & SQL",
    tags: ["sql", "having", "group-by"],
  },
  {
    subjectSlug: "dbms-sql",
    topicName: "Transactions & ACID Properties",
    text: 'Which ACID property ensures that a transaction either completes entirely or has no effect at all?',
    options: ["Atomicity", "Consistency", "Isolation", "Durability"],
    correctIndex: 0,
    explanation:
      "Atomicity guarantees that a transaction is treated as a single indivisible unit — either all operations succeed (commit) or none take effect (rollback).",
    difficulty: Difficulty.EASY,
    source: "Seed — DBMS & SQL",
    tags: ["acid", "transactions"],
  },

  // ─── Operating Systems (3 questions) ──────────────────
  {
    subjectSlug: "operating-systems",
    topicName: "Deadlocks",
    text: "Which of the following is **NOT** a necessary condition for deadlock?",
    options: [
      "Mutual Exclusion",
      "Hold and Wait",
      "Preemption",
      "Circular Wait",
    ],
    correctIndex: 2,
    explanation:
      "The four necessary conditions for deadlock are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. 'Preemption' (ability to forcibly take resources) actually prevents deadlock.",
    difficulty: Difficulty.MEDIUM,
    source: "Seed — Operating Systems",
    tags: ["deadlock", "conditions"],
  },
  {
    subjectSlug: "operating-systems",
    topicName: "CPU Scheduling (FCFS, SJF, Round Robin)",
    text: "In **Round Robin** scheduling with a time quantum of 4, if a process has a burst time of 10, how many times will it be preempted?",
    options: ["1", "2", "3", "0"],
    correctIndex: 1,
    explanation:
      "Burst time 10 with quantum 4: runs for 4 (preempted, 6 left), runs for 4 (preempted, 2 left), runs for 2 (completes). Preempted 2 times.",
    difficulty: Difficulty.MEDIUM,
    source: "Seed — Operating Systems",
    tags: ["scheduling", "round-robin"],
  },
  {
    subjectSlug: "operating-systems",
    topicName: "Memory Management (Paging, Segmentation)",
    text: "In paging, a logical address is divided into which two parts?",
    options: [
      "Segment number and offset",
      "Page number and page offset",
      "Base address and limit",
      "Frame number and displacement",
    ],
    correctIndex: 1,
    explanation:
      "In paging, the logical address is split into a page number (used to index the page table) and a page offset (displacement within that page).",
    difficulty: Difficulty.EASY,
    source: "Seed — Operating Systems",
    tags: ["paging", "virtual-memory"],
  },

  // ─── Computer Networks (2 questions) ──────────────────
  {
    subjectSlug: "computer-networks",
    topicName: "OSI & TCP/IP Models",
    text: "Which layer of the OSI model is responsible for **routing** and **logical addressing**?",
    options: [
      "Data Link Layer",
      "Network Layer",
      "Transport Layer",
      "Session Layer",
    ],
    correctIndex: 1,
    explanation:
      "The Network Layer (Layer 3) handles routing packets between networks using logical addresses (IP addresses). Routers operate at this layer.",
    difficulty: Difficulty.EASY,
    source: "Seed — Computer Networks",
    tags: ["osi", "network-layer"],
  },
  {
    subjectSlug: "computer-networks",
    topicName: "IP Addressing & Subnetting",
    text: "How many usable host addresses are available in a **/28** subnet?",
    options: ["14", "16", "30", "32"],
    correctIndex: 0,
    explanation:
      "A /28 subnet has 32 − 28 = 4 host bits → 2⁴ = 16 total addresses. Subtract 2 (network + broadcast) = 14 usable host addresses.",
    difficulty: Difficulty.MEDIUM,
    source: "Seed — Computer Networks",
    tags: ["subnetting", "cidr"],
  },

  // ─── Computer Organization & Digital Logic (2 questions)
  {
    subjectSlug: "computer-organization",
    topicName: "Boolean Algebra & Logic Gates",
    text: "What is the simplified Boolean expression for **A·B + A·B' + A'·B**?",
    options: ["A + B", "A · B", "A ⊕ B", "1"],
    correctIndex: 0,
    explanation:
      "A·B + A·B' = A·(B + B') = A·1 = A. So the expression becomes A + A'·B = A + B (by absorption law: A + A'B = A + B).",
    difficulty: Difficulty.HARD,
    source: "Seed — Digital Logic",
    tags: ["boolean-algebra", "simplification"],
  },
  {
    subjectSlug: "computer-organization",
    topicName: "CPU Architecture (ALU, CU, Registers)",
    text: "Which register in the CPU holds the address of the **next instruction** to be fetched?",
    options: [
      "Accumulator (AC)",
      "Program Counter (PC)",
      "Memory Address Register (MAR)",
      "Instruction Register (IR)",
    ],
    correctIndex: 1,
    explanation:
      "The Program Counter (PC) holds the memory address of the next instruction to be fetched. After each fetch, it is incremented (or modified by branch instructions).",
    difficulty: Difficulty.EASY,
    source: "Seed — Computer Organization",
    tags: ["cpu", "registers"],
  },

  // ─── Software Engineering (2 questions) ───────────────
  {
    subjectSlug: "software-engineering",
    topicName: "SDLC Models (Waterfall, Agile, Spiral)",
    text: "Which SDLC model is best suited for projects where requirements are **well-defined and unlikely to change**?",
    options: ["Agile", "Spiral", "Waterfall", "Prototype"],
    correctIndex: 2,
    explanation:
      "The Waterfall model is a linear, sequential approach that works best when requirements are clear, well-documented, and stable. Changes are costly once a phase is complete.",
    difficulty: Difficulty.EASY,
    source: "Seed — Software Engineering",
    tags: ["sdlc", "waterfall"],
  },
  {
    subjectSlug: "software-engineering",
    topicName: "Testing (Unit, Integration, System)",
    text: "In **black-box testing**, the tester has access to:",
    options: [
      "Source code only",
      "Source code and design documents",
      "Only the functional specification (inputs/outputs)",
      "Database schema",
    ],
    correctIndex: 2,
    explanation:
      "Black-box testing treats the software as a black box — the tester knows only the inputs and expected outputs, without any knowledge of internal code or logic.",
    difficulty: Difficulty.EASY,
    source: "Seed — Software Engineering",
    tags: ["testing", "black-box"],
  },

  // ─── Web Technologies (2 questions) ───────────────────
  {
    subjectSlug: "web-technologies",
    topicName: "HTTP/HTTPS Protocols",
    text: "Which HTTP status code indicates that the requested resource was **not found**?",
    options: ["200", "301", "403", "404"],
    correctIndex: 3,
    explanation:
      "404 Not Found indicates the server cannot find the requested resource. 200 = OK, 301 = Moved Permanently, 403 = Forbidden.",
    difficulty: Difficulty.EASY,
    source: "Seed — Web Technologies",
    tags: ["http", "status-codes"],
  },
  {
    subjectSlug: "web-technologies",
    topicName: "JavaScript Fundamentals",
    text: 'What does `typeof null` return in JavaScript?',
    options: ['"null"', '"undefined"', '"object"', '"boolean"'],
    correctIndex: 2,
    explanation:
      '`typeof null` returns `"object"` in JavaScript. This is a well-known historical bug in the language that has been retained for backward compatibility.',
    difficulty: Difficulty.MEDIUM,
    source: "Seed — Web Technologies",
    tags: ["javascript", "typeof"],
  },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clear existing data in correct order (respecting foreign keys)
  await prisma.generationLog.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.sourceDocument.deleteMany();

  console.log("  ✓ Cleared existing data\n");

  // Create subjects and topics
  const subjectMap = new Map<string, string>(); // slug → id
  const topicMap = new Map<string, string>(); // "slug:topicName" → id

  for (const sub of subjects) {
    const created = await prisma.subject.create({
      data: {
        name: sub.name,
        slug: sub.slug,
        order: sub.order,
        isActive: true,
        topics: {
          create: sub.topics.map((topicName) => ({
            name: topicName,
          })),
        },
      },
      include: { topics: true },
    });

    subjectMap.set(sub.slug, created.id);
    for (const topic of created.topics) {
      topicMap.set(`${sub.slug}:${topic.name}`, topic.id);
    }

    console.log(
      `  ✓ ${sub.name} (${created.topics.length} topics)`
    );
  }

  console.log(`\n  Total subjects: ${subjects.length}\n`);

  // Create questions
  let questionCount = 0;
  for (const q of questions) {
    const subjectId = subjectMap.get(q.subjectSlug);
    if (!subjectId) {
      console.error(`  ✗ Subject not found: ${q.subjectSlug}`);
      continue;
    }

    const topicId = q.topicName
      ? topicMap.get(`${q.subjectSlug}:${q.topicName}`)
      : undefined;

    await prisma.question.create({
      data: {
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        subjectId,
        topicId: topicId ?? null,
        difficulty: q.difficulty,
        status: QuestionStatus.ACTIVE,
        source: q.source,
        tags: q.tags,
      },
    });
    questionCount++;
  }

  console.log(`  ✓ Created ${questionCount} questions\n`);
  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
