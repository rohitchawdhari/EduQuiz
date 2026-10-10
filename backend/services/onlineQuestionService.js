const { generateQuestionsWithAI } = require("./aiQuestionService");

// Helper to decode HTML entities from OpenTDB
const decodeHTMLEntities = (text) => {
  if (!text) return "";
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&eacute;/g, "é")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
};

// Open Trivia DB Category ID mappings
const openTDBCategoryMap = {
  "Computer Science": 18,
  Computers: 18,
  Python: 18,
  Java: 18,
  "C++": 18,
  DBMS: 18,
  "Operating System": 18,
  "Computer Networks": 18,
  "Data Structures": 18,
  "General Knowledge": 9,
  Science: 17,
  Mathematics: 19,
  Aptitude: 19,
};

// Rich curated question repository across all 10 subjects
const curatedSubjectQuestions = {
  Python: [
    {
      questionText: "Which keyword is used to define a function in Python?",
      options: [
        { text: "function", isCorrect: false },
        { text: "def", isCorrect: true },
        { text: "define", isCorrect: false },
        { text: "fun", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "In Python, the 'def' keyword introduces a function definition.",
      topic: "Functions",
    },
    {
      questionText: "Which of the following is an immutable data type in Python?",
      options: [
        { text: "List", isCorrect: false },
        { text: "Tuple", isCorrect: true },
        { text: "Dictionary", isCorrect: false },
        { text: "Set", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "Tuples cannot be altered once instantiated in Python.",
      topic: "Data Types",
    },
    {
      questionText: "What will type([]) output in Python?",
      options: [
        { text: "<class 'list'>", isCorrect: true },
        { text: "<class 'array'>", isCorrect: false },
        { text: "<class 'tuple'>", isCorrect: false },
        { text: "<class 'set'>", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "Square brackets define an instance of a list.",
      topic: "Basics",
    },
    {
      questionText: "What is the result of 3 * 'ab' in Python?",
      options: [
        { text: "ababab", isCorrect: true },
        { text: "TypeError", isCorrect: false },
        { text: "3ab", isCorrect: false },
        { text: "a3b3", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "The multiplication operator on strings performs repetition.",
      topic: "Operators",
    },
    {
      questionText: "What does the *args parameter represent in a Python function definition?",
      options: [
        { text: "Keyword arguments", isCorrect: false },
        { text: "Arbitrary positional arguments", isCorrect: true },
        { text: "Pointer to memory", isCorrect: false },
        { text: "Reference passing", isCorrect: false },
      ],
      difficulty: "Medium",
      explanation: "*args collects extra positional arguments into a tuple.",
      topic: "Functions",
    },
    {
      questionText: "What is the average time complexity of key lookup in a Python dictionary?",
      options: [
        { text: "O(n)", isCorrect: false },
        { text: "O(log n)", isCorrect: false },
        { text: "O(1)", isCorrect: true },
        { text: "O(n^2)", isCorrect: false },
      ],
      difficulty: "Medium",
      explanation: "Python dictionaries use hash tables, providing average O(1) lookups.",
      topic: "Data Structures",
    },
    {
      questionText: "What does a generator function in Python return upon invocation?",
      options: [
        { text: "A complete list", isCorrect: false },
        { text: "A generator iterator", isCorrect: true },
        { text: "None", isCorrect: false },
        { text: "A coroutine promise", isCorrect: false },
      ],
      difficulty: "Medium",
      explanation: "Functions containing 'yield' return a generator iterator object.",
      topic: "Generators",
    },
    {
      questionText: "How does Python's garbage collector handle circular references?",
      options: [
        { text: "It cannot handle circular references", isCorrect: false },
        { text: "Using generational cycle-detecting garbage collection alongside reference counting", isCorrect: true },
        { text: "Pure reference counting only", isCorrect: false },
        { text: "Manual free() calls", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "CPython combines reference counting with a cyclic generational collector.",
      topic: "Memory Management",
    },
    {
      questionText: "What is the exact purpose of '__slots__' in a Python class?",
      options: [
        { text: "To permit dynamic attributes", isCorrect: false },
        { text: "To prevent creation of __dict__ and save memory per instance", isCorrect: true },
        { text: "To make instances thread-safe", isCorrect: false },
        { text: "To enforce abstract methods", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "__slots__ reserves space for a fixed set of attributes, avoiding instance __dict__.",
      topic: "OOP",
    },
  ],

  DBMS: [
    {
      questionText: "What does ACID stand for in Database Management Systems?",
      options: [
        { text: "Atomicity, Consistency, Isolation, Durability", isCorrect: true },
        { text: "Accuracy, Concurrency, Integrity, Durability", isCorrect: false },
        { text: "Access, Control, Indexing, Durability", isCorrect: false },
        { text: "Automatic, Cascading, Isolation, Data", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "ACID guarantees transactions are processed reliably.",
      topic: "Transactions",
    },
    {
      questionText: "Which SQL clause is used to filter grouped data after GROUP BY?",
      options: [
        { text: "WHERE", isCorrect: false },
        { text: "HAVING", isCorrect: true },
        { text: "FILTER", isCorrect: false },
        { text: "ORDER BY", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "HAVING filters groups created by GROUP BY, while WHERE filters individual rows.",
      topic: "SQL",
    },
    {
      questionText: "Which SQL constraint uniquely identifies each record in a database table?",
      options: [
        { text: "PRIMARY KEY", isCorrect: true },
        { text: "FOREIGN KEY", isCorrect: false },
        { text: "CHECK", isCorrect: false },
        { text: "DEFAULT", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "A Primary Key column uniquely identifies each row and cannot be null.",
      topic: "Keys",
    },
    {
      questionText: "Which normal form removes transitive functional dependencies?",
      options: [
        { text: "1NF", isCorrect: false },
        { text: "2NF", isCorrect: false },
        { text: "3NF", isCorrect: true },
        { text: "BCNF", isCorrect: false },
      ],
      difficulty: "Medium",
      explanation: "3NF requires the relation to be in 2NF and have no transitive dependencies on candidate keys.",
      topic: "Normalization",
    },
    {
      questionText: "In a B+ Tree index, where are all actual data records or data pointers stored?",
      options: [
        { text: "In all internal nodes", isCorrect: false },
        { text: "Exclusively in the leaf nodes", isCorrect: true },
        { text: "In the root node only", isCorrect: false },
        { text: "Evenly distributed throughout the tree height", isCorrect: false },
      ],
      difficulty: "Medium",
      explanation: "B+ trees store all records/pointers at the leaves, which are linked as a doubly-linked list.",
      topic: "Indexing",
    },
    {
      questionText: "In Two-Phase Locking (2PL), when does a transaction enter the Shrinking phase?",
      options: [
        { text: "When it acquires its first shared lock", isCorrect: false },
        { text: "As soon as it releases any lock", isCorrect: true },
        { text: "Only after final commit", isCorrect: false },
        { text: "When a deadlock graph cycle occurs", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "Under 2PL, once a transaction releases a single lock, it enters the shrinking phase and cannot acquire any new locks.",
      topic: "Concurrency",
    },
  ],

  "Computer Networks": [
    {
      questionText: "Which OSI model layer is responsible for packet routing across networks?",
      options: [
        { text: "Data Link Layer", isCorrect: false },
        { text: "Network Layer", isCorrect: true },
        { text: "Transport Layer", isCorrect: false },
        { text: "Session Layer", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "Layer 3 (Network Layer) manages IP addressing and logical routing.",
      topic: "OSI Model",
    },
    {
      questionText: "What is the standard port number for secure HTTPS traffic?",
      options: [
        { text: "80", isCorrect: false },
        { text: "443", isCorrect: true },
        { text: "8080", isCorrect: false },
        { text: "21", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "Port 443 is assigned for HTTPS connections encrypted with TLS/SSL.",
      topic: "Protocols",
    },
    {
      questionText: "What mechanism is used by TCP to achieve reliable connection establishment?",
      options: [
        { text: "Two-way handshake", isCorrect: false },
        { text: "Three-way handshake (SYN, SYN-ACK, ACK)", isCorrect: true },
        { text: "Four-way handshake", isCorrect: false },
        { text: "UDP Broadcast", isCorrect: false },
      ],
      difficulty: "Medium",
      explanation: "The TCP 3-way handshake synchronizes sequence numbers between endpoints.",
      topic: "TCP",
    },
    {
      questionText: "What does the ARP protocol resolve?",
      options: [
        { text: "Domain names to IP addresses", isCorrect: false },
        { text: "IP addresses to physical MAC addresses", isCorrect: true },
        { text: "MAC addresses to port numbers", isCorrect: false },
        { text: "Public IPs to Private IPs", isCorrect: false },
      ],
      difficulty: "Medium",
      explanation: "Address Resolution Protocol (ARP) translates an IP into a hardware MAC address.",
      topic: "Protocols",
    },
    {
      questionText: "Which header field in IPv6 replaces the IPv4 Time-to-Live (TTL) field?",
      options: [
        { text: "Hop Limit", isCorrect: true },
        { text: "Flow Label", isCorrect: false },
        { text: "Traffic Class", isCorrect: false },
        { text: "Next Header", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "In IPv6, TTL was renamed to 'Hop Limit' to accurately denote hop-based decrements.",
      topic: "IPv6",
    },
  ],

  "Operating System": [
    {
      questionText: "Which of the following is NOT one of Coffman's four conditions for deadlock?",
      options: [
        { text: "Mutual Exclusion", isCorrect: false },
        { text: "Hold and Wait", isCorrect: false },
        { text: "Preemption Allowed", isCorrect: true },
        { text: "Circular Wait", isCorrect: false },
      ],
      difficulty: "Medium",
      explanation: "The condition is 'No Preemption', meaning resources cannot be forcibly snatched.",
      topic: "Deadlocks",
    },
    {
      questionText: "What is the primary function of the Translation Lookaside Buffer (TLB)?",
      options: [
        { text: "Caches virtual-to-physical address translations", isCorrect: true },
        { text: "Schedules OS kernel threads", isCorrect: false },
        { text: "Stores interrupt vectors", isCorrect: false },
        { text: "Buffers filesystem writes", isCorrect: false },
      ],
      difficulty: "Medium",
      explanation: "The TLB is a high-speed hardware cache that speeds up virtual-to-physical page lookups.",
      topic: "Memory Management",
    },
    {
      questionText: "What scheduling algorithm guarantees the minimum average waiting time for a set of processes?",
      options: [
        { text: "Shortest Job First (SJF)", isCorrect: true },
        { text: "First-Come First-Served (FCFS)", isCorrect: false },
        { text: "Round Robin", isCorrect: false },
        { text: "Priority Scheduling", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "SJF is provably optimal regarding average waiting time.",
      topic: "CPU Scheduling",
    },
  ],

  "Data Structures": [
    {
      questionText: "Which data structure operates on a First-In-First-Out (FIFO) basis?",
      options: [
        { text: "Stack", isCorrect: false },
        { text: "Queue", isCorrect: true },
        { text: "Tree", isCorrect: false },
        { text: "Graph", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "Queues follow FIFO ordering.",
      topic: "Queues",
    },
    {
      questionText: "What is the worst-case time complexity of QuickSort?",
      options: [
        { text: "O(n log n)", isCorrect: false },
        { text: "O(n^2)", isCorrect: true },
        { text: "O(n)", isCorrect: false },
        { text: "O(log n)", isCorrect: false },
      ],
      difficulty: "Medium",
      explanation: "When pivot choices result in maximally unbalanced partitions, QuickSort degrades to O(n^2).",
      topic: "Sorting",
    },
    {
      questionText: "What is the maximum balance factor allowed for any node in an AVL tree?",
      options: [
        { text: "0", isCorrect: false },
        { text: "1 (between -1 and 1)", isCorrect: true },
        { text: "2", isCorrect: false },
        { text: "log(n)", isCorrect: false },
      ],
      difficulty: "Hard",
      explanation: "In an AVL tree, the height difference between left and right subtrees of any node cannot exceed 1.",
      topic: "Trees",
    },
  ],

  Java: [
    {
      questionText: "Which keyword in Java prevents a class from being subclassed?",
      options: [
        { text: "static", isCorrect: false },
        { text: "final", isCorrect: true },
        { text: "abstract", isCorrect: false },
        { text: "private", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "A 'final' class in Java cannot be extended.",
      topic: "OOP",
    },
    {
      questionText: "Where are objects allocated memory in Java runtime?",
      options: [
        { text: "Stack", isCorrect: false },
        { text: "Heap", isCorrect: true },
        { text: "Method Area", isCorrect: false },
        { text: "Register", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "Java objects are dynamically allocated in Heap memory.",
      topic: "JVM",
    },
    {
      questionText: "What is the difference between StringBuffer and StringBuilder in Java?",
      options: [
        { text: "StringBuffer is thread-safe (synchronized), StringBuilder is not", isCorrect: true },
        { text: "StringBuilder is immutable, StringBuffer is mutable", isCorrect: false },
        { text: "StringBuffer is faster than StringBuilder", isCorrect: false },
        { text: "There is no difference", isCorrect: false },
      ],
      difficulty: "Medium",
      explanation: "StringBuffer methods are synchronized for multi-threading; StringBuilder is unsynchronized and faster.",
      topic: "Strings",
    },
  ],

  "C++": [
    {
      questionText: "Which operator is used to deallocate memory in C++ that was allocated with 'new'?",
      options: [
        { text: "free", isCorrect: false },
        { text: "delete", isCorrect: true },
        { text: "remove", isCorrect: false },
        { text: "dispose", isCorrect: false },
      ],
      difficulty: "Easy",
      explanation: "'delete' deallocates memory and calls destructors for memory allocated by 'new'.",
      topic: "Memory Management",
    },
    {
      questionText: "What is a virtual function in C++ primarily used for?",
      options: [
        { text: "Compile-time polymorphism", isCorrect: false },
        { text: "Runtime polymorphism (dynamic dispatch)", isCorrect: true },
        { text: "Inline optimization", isCorrect: false },
        { text: "Memory compression", isCorrect: false },
      ],
      difficulty: "Medium",
      explanation: "Virtual functions enable late binding (runtime polymorphism) via vtables.",
      topic: "Polymorphism",
    },
  ],
};

/**
 * Fetch from Open Trivia DB REST API with HTML unescaping
 */
const fetchFromOpenTDB = async ({ categoryId, difficulty, count = 10 }) => {
  try {
    const diffParam = difficulty && difficulty !== "Mixed" ? `&difficulty=${difficulty.toLowerCase()}` : "";
    const catParam = categoryId ? `&category=${categoryId}` : "";
    const url = `https://opentdb.com/api.php?amount=${count}&type=multiple${catParam}${diffParam}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];

    const data = await res.json();
    if (data.response_code !== 0 || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((item) => {
      const correctText = decodeHTMLEntities(item.correct_answer);
      const options = [
        { text: correctText, isCorrect: true },
        ...item.incorrect_answers.map((inc) => ({
          text: decodeHTMLEntities(inc),
          isCorrect: false,
        })),
      ].sort(() => 0.5 - Math.random());

      let diff = "Medium";
      if (item.difficulty === "easy") diff = "Easy";
      if (item.difficulty === "hard") diff = "Hard";

      return {
        questionText: decodeHTMLEntities(item.question),
        options,
        difficulty: diff,
        marks: 2,
        negativeMarks: 0.5,
        explanation: `The correct answer is: ${correctText}`,
        topic: decodeHTMLEntities(item.category),
        source: "ONLINE",
      };
    });
  } catch (err) {
    // Graceful network timeout / rate-limit fallback
    return [];
  }
};

/**
 * Master Hybrid Online Question Fetcher:
 * 1. Tries Open Trivia DB API (Live online questions)
 * 2. Tries AI Generator if GEMINI_API_KEY is present
 * 3. Falls back to Curated Subject Pool
 */
const fetchOnlineQuestions = async ({ subject, difficulty = "Mixed", count = 10 }) => {
  let results = [];

  // 1. Try Live Open Trivia DB API
  const catId = openTDBCategoryMap[subject];
  if (catId) {
    const apiQuestions = await fetchFromOpenTDB({
      categoryId: catId,
      difficulty,
      count: Math.min(count * 2, 50),
    });
    if (apiQuestions.length > 0) {
      results.push(...apiQuestions);
    }
  }

  // 2. Try Gemini AI if configured and we still need more questions
  if (results.length < count && process.env.GEMINI_API_KEY) {
    const aiRes = await generateQuestionsWithAI({
      subject,
      difficulty: difficulty === "Mixed" ? "Medium" : difficulty,
      count: count - results.length,
    });
    if (aiRes.success && aiRes.questions.length > 0) {
      results.push(...aiRes.questions);
    }
  }

  // 3. Fallback to Curated Pool
  let pool = curatedSubjectQuestions[subject] || [];
  if (pool.length === 0) {
    pool = Object.values(curatedSubjectQuestions).flat();
  }

  // Filter pool by difficulty if requested
  if (difficulty && difficulty !== "Mixed") {
    const diffPool = pool.filter((q) => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    if (diffPool.length > 0) pool = diffPool;
  }

  results.push(...pool);

  // Randomize & sample
  const shuffled = [...results].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((q) => ({
    ...q,
    subject: subject || "Computer Science",
    source: "ONLINE",
  }));
};

module.exports = {
  fetchOnlineQuestions,
  curatedSubjectQuestions,
  openTDBCategoryMap,
};
