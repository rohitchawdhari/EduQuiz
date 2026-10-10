/**
 * EduQuiz - Advanced / Hard Difficulty Question Banks
 * University examination and Tier-1 placement diagnostic level questions
 */

const hardQuestionsPool = {
  DBMS: [
    {
      questionText: "Under Strict Two-Phase Locking (Strict 2PL), when are exclusive locks (X-locks) released?",
      options: [
        { text: "At the end of the transaction after commit or abort", isCorrect: true },
        { text: "Immediately after the write operation completes", isCorrect: false },
        { text: "During the shrinking phase of the transaction", isCorrect: false },
        { text: "When the next transaction requests a shared lock", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Strict 2PL requires that all exclusive locks held by a transaction be released only after the transaction commits or aborts, preventing cascading aborts.",
      topic: "Concurrency Control",
    },
    {
      questionText: "What is the minimum number of keys in a non-root internal node of a B+ Tree of order m?",
      options: [
        { text: "ceil(m/2) - 1", isCorrect: true },
        { text: "floor(m/2)", isCorrect: false },
        { text: "m / 2", isCorrect: false },
        { text: "m - 1", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "In a B+ tree of order m, every non-root node must contain at least ceil(m/2) child pointers, which corresponds to ceil(m/2) - 1 keys.",
      topic: "Indexing",
    },
    {
      questionText: "Which schedule equivalence condition is polynomial-time verifiable, whereas the other is NP-complete?",
      options: [
        { text: "Conflict serializability is polynomial; View serializability is NP-complete", isCorrect: true },
        { text: "View serializability is polynomial; Conflict serializability is NP-complete", isCorrect: false },
        { text: "Both are polynomial-time verifiable via precedence graph", isCorrect: false },
        { text: "Both are NP-complete problems", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Conflict serializability is checked in O(V + E) time via cycle detection in a precedence graph. Testing view serializability is NP-complete.",
      topic: "Serializability",
    },
    {
      questionText: "In the ARIES recovery algorithm, which phase scans the log forward from the oldest uncheckpointed dirty page to reconstruct state?",
      options: [
        { text: "Analysis Phase", isCorrect: false },
        { text: "Redo Phase", isCorrect: true },
        { text: "Undo Phase", isCorrect: false },
        { text: "Check-pointing Phase", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "The Redo phase scans forward from the smallest RecLSN in the dirty page table to repeat history and restore the database to the crash state.",
      topic: "Crash Recovery",
    },
    {
      questionText: "What is the primary trade-off of using a clustered index versus an unclustered secondary index in RDBMS?",
      options: [
        { text: "Faster range scans at the expense of slower insert/update operations that may trigger page splits", isCorrect: true },
        { text: "Lower disk space consumption with zero write performance impact", isCorrect: false },
        { text: "Elimination of foreign key constraints", isCorrect: false },
        { text: "Guaranteed O(1) hash lookup for all arbitrary columns", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "A clustered index physically sorts table rows on disk. While range scans are exceptionally fast, writes may cause costly leaf page splits.",
      topic: "Indexing",
    },
    {
      questionText: "In relational decomposition, which property ensures that no spurious tuples are generated upon natural join?",
      options: [
        { text: "Dependency Preservation", isCorrect: false },
        { text: "Lossless-Join Property", isCorrect: true },
        { text: "Multivalued Closure", isCorrect: false },
        { text: "Referential Equivalence", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Lossless join decomposition ensures that R1 ⨝ R2 = R, meaning the natural join of the decomposed relations yields the original relation without extra tuples.",
      topic: "Normalization",
    },
  ],

  "Operating System": [
    {
      questionText: "What is the theoretical maximum number of page faults that can occur for a single instruction in an architecture supporting indirect addressing across page boundaries?",
      options: [
        { text: "Multiple page faults equal to instruction fetch + indirect address pages + operand pages", isCorrect: true },
        { text: "Strictly 1 page fault per instruction", isCorrect: false },
        { text: "Strictly 2 page faults (code page and data page)", isCorrect: false },
        { text: "Zero if TLB has an entry", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "An instruction crossing a page boundary can cause 2 faults on fetch, additional faults reading indirect pointers across page boundaries, and further faults accessing multi-byte operands.",
      topic: "Virtual Memory",
    },
    {
      questionText: "Which synchronization primitive avoids priority inversion through the Priority Ceiling Protocol?",
      options: [
        { text: "Mutex with priority ceiling locks", isCorrect: true },
        { text: "Standard counting semaphore", isCorrect: false },
        { text: "Spinlock without interrupts disabled", isCorrect: false },
        { text: "Non-reentrant condition variable", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Under the Priority Ceiling Protocol, each resource is assigned a ceiling equal to the highest priority task that can lock it, preventing unbounded priority inversion and deadlocks.",
      topic: "Synchronization",
    },
    {
      questionText: "In Banker's Algorithm, if the state is in a 'Safe State', which of the following is strictly guaranteed?",
      options: [
        { text: "No deadlock can occur if future requests follow the safe sequence", isCorrect: true },
        { text: "CPU utilization is guaranteed to be 100%", isCorrect: false },
        { text: "All processes will finish in minimum possible turnaround time", isCorrect: false },
        { text: "Starvation is completely eliminated for all priority levels", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "A safe state guarantees the existence of at least one safe execution sequence P1...Pn such that all processes can obtain required resources without deadlock.",
      topic: "Deadlocks",
    },
    {
      questionText: "What distinguishes the Linux Completely Fair Scheduler (CFS) from traditional multi-level feedback queue schedulers?",
      options: [
        { text: "It uses a red-black tree indexed by virtual runtime (vruntime) instead of fixed priority arrays", isCorrect: true },
        { text: "It uses a round-robin circular linked list with 1-second quantum", isCorrect: false },
        { text: "It evaluates shortest job first using exponential smoothing", isCorrect: false },
        { text: "It runs entirely in userspace without timer interrupts", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "CFS models an 'ideal multi-tasking CPU' using a self-balancing red-black tree ordered by each task's accumulated virtual runtime (vruntime).",
      topic: "CPU Scheduling",
    },
    {
      questionText: "What condition causes 'Thrashing' in a demand-paged virtual memory system?",
      options: [
        { text: "Sum of working set sizes of all active processes exceeds available physical memory frames", isCorrect: true },
        { text: "CPU utilization reaches 100% due to compute-bound tasks", isCorrect: false },
        { text: "A process accesses memory sequentially without jumping", isCorrect: false },
        { text: "TLB miss rate drops below 1%", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Thrashing occurs when total memory demand (Σ WSS_i) > total frames, causing the OS to spend more time swapping pages in and out than executing instructions.",
      topic: "Virtual Memory",
    },
  ],

  "Computer Networks": [
    {
      questionText: "In TCP congestion control, how is the congestion window (cwnd) updated during the Congestion Avoidance phase upon receiving an ACK?",
      options: [
        { text: "cwnd = cwnd + 1 / cwnd per received ACK (additive increase of ~1 MSS per RTT)", isCorrect: true },
        { text: "cwnd = cwnd * 2 per received ACK", isCorrect: false },
        { text: "cwnd is halved on every ACK", isCorrect: false },
        { text: "cwnd remains strictly constant throughout the connection", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "During congestion avoidance, TCP increases cwnd additively: cwnd += 1/cwnd for each ACK, resulting in an increase of approximately 1 MSS per Round Trip Time.",
      topic: "Transport Layer",
    },
    {
      questionText: "What prevents count-to-infinity routing loops in Border Gateway Protocol (BGP)?",
      options: [
        { text: "AS-Path attribute: routers reject updates containing their own Autonomous System number", isCorrect: true },
        { text: "Split Horizon with Poison Reverse on internal Ethernet links", isCorrect: false },
        { text: "Dijkstra shortest path algorithm recomputed every 30 seconds", isCorrect: false },
        { text: "Hop count limit fixed strictly at 15 hops", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "BGP is a path-vector protocol. Each BGP route advertisement contains the complete sequence of AS numbers (AS-PATH). A router immediately discards an update if its own AS is in the path.",
      topic: "Routing",
    },
    {
      questionText: "In the TLS 1.3 handshake, how many round trips (RTT) are required before application data can be transmitted in a full handshake?",
      options: [
        { text: "1 RTT (compared to 2 RTT in TLS 1.2)", isCorrect: true },
        { text: "2 RTT", isCorrect: false },
        { text: "3 RTT", isCorrect: false },
        { text: "0 RTT is mandatory for all initial connections", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "TLS 1.3 combines key share and cipher negotiation into the ClientHello, reducing the standard handshake to 1-RTT (and 0-RTT for resumed connections via PSK).",
      topic: "Network Security",
    },
    {
      questionText: "Which IP header field prevents packets from circulating indefinitely in a routing loop across routers?",
      options: [
        { text: "Time to Live (TTL)", isCorrect: true },
        { text: "Differentiated Services Code Point (DSCP)", isCorrect: false },
        { text: "Fragment Offset", isCorrect: false },
        { text: "Total Length", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Every router decrements the TTL field by 1. When TTL reaches 0, the packet is discarded and an ICMP Time Exceeded message is sent back to the source.",
      topic: "Network Layer",
    },
  ],

  "Data Structures and Algorithms": [
    {
      questionText: "What is the worst-case time complexity of searching an element in an AVL tree with n nodes?",
      options: [
        { text: "O(log n)", isCorrect: true },
        { text: "O(n)", isCorrect: false },
        { text: "O(n log n)", isCorrect: false },
        { text: "O(1)", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "An AVL tree maintains height balance (balance factor between -1 and +1). Its maximum height is bounded by ~1.44 log2(n), guaranteeing strict O(log n) worst-case search.",
      topic: "Trees",
    },
    {
      questionText: "What is the amortized time complexity of the 'extract-min' operation in a Fibonacci Heap containing n nodes?",
      options: [
        { text: "O(log n)", isCorrect: true },
        { text: "O(1)", isCorrect: false },
        { text: "O(n)", isCorrect: false },
        { text: "O(log log n)", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Fibonacci heaps achieve O(1) amortized for insert, decrease-key, and find-min, but extract-min consolidates root trees, yielding O(log n) amortized.",
      topic: "Heaps",
    },
    {
      questionText: "What is the minimum number of comparisons needed in the worst case to find both the maximum and minimum elements in an unsorted array of size n (even)?",
      options: [
        { text: "3n/2 - 2 comparisons", isCorrect: true },
        { text: "2n - 2 comparisons", isCorrect: false },
        { text: "n - 1 comparisons", isCorrect: false },
        { text: "n comparisons", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "By comparing elements in pairs (n/2 comparisons), comparing the larger with max (n/2 - 1) and the smaller with min (n/2 - 1), the total is n/2 + 2(n/2 - 1) = 3n/2 - 2.",
      topic: "Algorithm Analysis",
    },
    {
      questionText: "Which algorithm finds the single-source shortest path in a directed graph with negative edge weights, provided no negative-weight cycles are reachable?",
      options: [
        { text: "Bellman-Ford Algorithm", isCorrect: true },
        { text: "Dijkstra's Algorithm with Fibonacci Heap", isCorrect: false },
        { text: "Prim's Algorithm", isCorrect: false },
        { text: "Kruskal's Algorithm", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Dijkstra fails with negative edges because visited nodes are finalized greedily. Bellman-Ford relaxes all |V|-1 times, correctly handling negative weights in O(V * E).",
      topic: "Graphs",
    },
  ],

  Python: [
    {
      questionText: "How does Python's Global Interpreter Lock (GIL) affect multithreaded CPU-bound programs on multi-core processors?",
      options: [
        { text: "It serializes bytecode execution across threads, preventing true parallel speedup for CPU-bound tasks in CPython", isCorrect: true },
        { text: "It doubles execution speed by automatically vectorizing CPU instructions", isCorrect: false },
        { text: "It converts multithreading into asynchronous greenlets automatically", isCorrect: false },
        { text: "It has no impact; CPython threads run on multiple cores with full parallelism", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "The CPython GIL allows only one OS thread to hold the Python interpreter lock at any moment, meaning CPU-bound multithreading does not achieve multi-core acceleration.",
      topic: "Concurrency",
    },
    {
      questionText: "What is the Method Resolution Order (MRO) algorithm employed by Python 3 for multiple inheritance?",
      options: [
        { text: "C3 Linearization Algorithm", isCorrect: true },
        { text: "Depth-First Search with Left-to-Right traversal", isCorrect: false },
        { text: "Breadth-First Search with topological sorting", isCorrect: false },
        { text: "Dijkstra shortest inheritance path", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Python 3 uses C3 Linearization to compute MRO, ensuring monotonicity and respecting local precedence order across multiple base classes.",
      topic: "OOP",
    },
    {
      questionText: "In Python memory management, which object category uses 'freelists' to avoid memory reallocation overhead?",
      options: [
        { text: "Small integers (-5 to 256), floats, and empty tuples", isCorrect: true },
        { text: "Arbitrary numpy arrays larger than 10MB", isCorrect: false },
        { text: "Custom metaclass instances", isCorrect: false },
        { text: "Open socket file descriptors", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "CPython pre-allocates an array of small integer objects (-5 to 256) and maintains dedicated freelists for floats, frames, and tuples to optimize memory reuse.",
      topic: "Memory Model",
    },
    {
      questionText: "What is the return value of `sys.getrefcount(x)` for an object `x` with zero active variables referencing it other than the function call itself?",
      options: [
        { text: "1 or higher (the argument passing itself creates a temporary reference)", isCorrect: true },
        { text: "Strictly 0", isCorrect: false },
        { text: "None", isCorrect: false },
        { text: "-1", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "`sys.getrefcount(x)` always returns one count higher than expected because passing `x` into `getrefcount` creates an additional temporary reference.",
      topic: "Internals",
    },
  ],

  Java: [
    {
      questionText: "In the HotSpot JVM, what is the role of the 'Survivor Spaces' (S0 and S1) within the Young Generation?",
      options: [
        { text: "They act as copy targets during minor GC: live objects alternate between S0/S1 until aging into the Old Generation", isCorrect: true },
        { text: "They store class metadata and JIT compiled machine code", isCorrect: false },
        { text: "They hold thread execution stacks and program counters", isCorrect: false },
        { text: "They cache direct native memory allocated via ByteBuffer.allocateDirect", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Minor GC copies surviving objects from Eden to one Survivor space. Objects alternate between S0 and S1, incrementing age until crossing the tenuring threshold to Old Gen.",
      topic: "JVM Architecture",
    },
    {
      questionText: "What guarantee does the `volatile` keyword provide under the Java Memory Model (JMM)?",
      options: [
        { text: "Visibility across threads (flushes writes to main memory) and establishes a happens-before relationship, but not mutual exclusion atomicity", isCorrect: true },
        { text: "Full atomicity for compound operations like count++ without locking", isCorrect: false },
        { text: "Deadlock prevention across concurrent synchronized blocks", isCorrect: false },
        { text: "Prevents garbage collection of the referenced instance", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "`volatile` ensures reads/writes go directly to main memory and prevents instruction reordering. However, non-atomic compound operations (like i++) still require synchronization or atomic classes.",
      topic: "Multithreading",
    },
    {
      questionText: "In Java 8+, how does `HashMap` handle high hash collisions in a single bucket when the bucket threshold exceeds 8 elements?",
      options: [
        { text: "Converts the linked list into a balanced red-black tree (TreeNode)", isCorrect: true },
        { text: "Doubles the bucket size and throws a HashCollisionException", isCorrect: false },
        { text: "Switches to quadratic probing automatically", isCorrect: false },
        { text: "Evicts the oldest inserted key using LRU eviction", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "When a bucket's linked list length reaches TREEIFY_THRESHOLD (8) and the table capacity is at least 64, Java 8 converts the bin to a red-black tree, reducing collision lookup from O(n) to O(log n).",
      topic: "Collections",
    },
  ],

  "Quantitative Aptitude": [
    {
      questionText: "A vessel contains a mixture of milk and water in the ratio 7:5. When 9 litres of mixture are drawn off and the vessel is filled with water, the ratio of milk to water becomes 7:9. How many litres of milk were contained by the vessel initially?",
      options: [
        { text: "21 litres", isCorrect: true },
        { text: "28 litres", isCorrect: false },
        { text: "35 litres", isCorrect: false },
        { text: "14 litres", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Let milk = 7x, water = 5x. Milk drawn = 7/12 * 9 = 21/4. Water drawn = 5/12 * 9 = 15/4. (7x - 21/4) / (5x - 15/4 + 9) = 7/9 => Solving yields x = 3. Initial milk = 7 * 3 = 21 litres.",
      topic: "Mixtures and Alligations",
    },
    {
      questionText: "In how many different ways can the letters of the word 'CORPORATION' be arranged so that the vowels always come together?",
      options: [
        { text: "50400", isCorrect: true },
        { text: "2880", isCorrect: false },
        { text: "14400", isCorrect: false },
        { text: "120960", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Vowels: O, O, A, I, O (5 vowels: 3 O's). Consonants: C, R, P, R, T, N (6 consonants: 2 R's). Group vowels as 1 unit: 7 items with 2 R's = 7! / 2! = 2520. Vowels arrangement: 5! / 3! = 20. Total = 2520 * 20 = 50,400.",
      topic: "Permutations and Combinations",
    },
    {
      questionText: "A sum of ₹12,000 deposited at compound interest becomes double after 5 years. What will be the amount after 20 years?",
      options: [
        { text: "₹1,92,000", isCorrect: true },
        { text: "₹96,000", isCorrect: false },
        { text: "₹1,20,000", isCorrect: false },
        { text: "₹2,40,000", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Doubling period = 5 years. 20 years = 4 doubling periods. Amount = 12000 * 2^4 = 12000 * 16 = ₹1,92,000.",
      topic: "Compound Interest",
    },
    {
      questionText: "Two trains of equal lengths take 10 seconds and 15 seconds respectively to cross a telegraph post. If the length of each train is 120 metres, in what time (in seconds) will they cross each other traveling in opposite directions?",
      options: [
        { text: "12 seconds", isCorrect: true },
        { text: "10 seconds", isCorrect: false },
        { text: "15 seconds", isCorrect: false },
        { text: "8 seconds", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Speed 1 = 120 / 10 = 12 m/s. Speed 2 = 120 / 15 = 8 m/s. Relative speed = 12 + 8 = 20 m/s. Total distance = 120 + 120 = 240 m. Time = 240 / 20 = 12 seconds.",
      topic: "Time, Speed and Distance",
    },
  ],

  "Logical Reasoning": [
    {
      questionText: "Statements: Some mangoes are apples. All apples are bananas. No banana is a cherry. Conclusions: (I) No apple is a cherry. (II) Some mangoes are bananas. Which conclusion follows?",
      options: [
        { text: "Both (I) and (II) follow", isCorrect: true },
        { text: "Only (I) follows", isCorrect: false },
        { text: "Only (II) follows", isCorrect: false },
        { text: "Neither follows", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Since all apples are inside bananas, and no banana is cherry, no apple can ever be cherry (I follows). Since some mangoes are apples and all apples are bananas, those mangoes are bananas (II follows).",
      topic: "Syllogisms",
    },
    {
      questionText: "At what time between 4 and 5 o'clock will the hands of a clock be at right angles (90 degrees) for the first time?",
      options: [
        { text: "5 5/11 minutes past 4", isCorrect: true },
        { text: "38 2/11 minutes past 4", isCorrect: false },
        { text: "10 minutes past 4", isCorrect: false },
        { text: "15 5/11 minutes past 4", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Angle = |30H - 5.5M| = 90. For H=4: 30(4) - 5.5M = 90 => 120 - 5.5M = 90 => 5.5M = 30 => M = 60/11 = 5 5/11 minutes past 4.",
      topic: "Clocks and Calendars",
    },
  ],

  "Verbal Ability": [
    {
      questionText: "Choose the option that correctly rectifies the grammatical error: 'Each of the students who have registered must submit their identification cards.'",
      options: [
        { text: "Each of the students who has registered must submit his or her identification card.", isCorrect: true },
        { text: "Each of the student who have registered must submit their identification cards.", isCorrect: false },
        { text: "Every students who has registered must submit their card.", isCorrect: false },
        { text: "All of the student who has registered must submit his cards.", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "'Each' is a singular subject requiring singular verb and pronoun agreement ('has registered' and 'his or her identification card').",
      topic: "Grammar & Error Spotting",
    },
  ],

  "Placement Programming Logic": [
    {
      questionText: "Predict the output of the C expression: `int a = 5; int b = a++ + ++a; printf(\"%d\", b);` (assuming standard sequence points in C99+ compiler)?",
      options: [
        { text: "Undefined Behavior due to multiple modifications of 'a' without an intervening sequence point", isCorrect: true },
        { text: "12", isCorrect: false },
        { text: "11", isCorrect: false },
        { text: "13", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Modifying the same scalar object 'a' more than once in an unsequenced expression invokes Undefined Behavior (UB) according to the ISO C standard.",
      topic: "Output Prediction",
    },
    {
      questionText: "What will the following bitwise trick compute: `x & (-x)` in two's complement arithmetic?",
      options: [
        { text: "Isolates the lowest set bit (rightmost 1) of x", isCorrect: true },
        { text: "Clears the lowest set bit of x", isCorrect: false },
        { text: "Checks if x is a power of 2", isCorrect: false },
        { text: "Reverses all bits of x", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "In two's complement, -x = (~x + 1). ANDing x with -x leaves only the lowest set bit (rightmost 1) intact.",
      topic: "Bit Manipulation",
    },
  ],
};

module.exports = hardQuestionsPool;
