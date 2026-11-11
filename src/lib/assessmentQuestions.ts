export interface AssessmentQuestion {
  id: string;
  number: number;
  section: string;
  question: string;
  options: readonly [string, string, string, string];
  correctIndex: number;
}

/** Default assessment duration: 1 hour (3,600 seconds). */
export const ASSESSMENT_DURATION_SECONDS = 60 * 60;

/** Marks awarded per correct answer (no negative marking). */
export const MARKS_PER_QUESTION = 2;

export const SAMPLE_ASSESSMENT_QUESTIONS: readonly AssessmentQuestion[] = [
  {
    id: "q1",
    number: 1,
    section: "Python Programming",
    question: "Which keyword is used to make a decision in a Python program?",
    options: ["for", "if", "def", "import"],
    correctIndex: 1,
  },
  {
    id: "q2",
    number: 2,
    section: "Python Programming",
    question: "Which brackets are used to create a list in Python?",
    options: ["( )", "{ }", "[ ]", "< >"],
    correctIndex: 2,
  },
  {
    id: "q3",
    number: 3,
    section: "Python Programming",
    question: "What is the full form of OOP?",
    options: [
      "Object-Oriented Programming",
      "Open Operating Program",
      "Object Operating Process",
      "Oriented Object Program",
    ],
    correctIndex: 0,
  },
  {
    id: "q4",
    number: 4,
    section: "Python Programming",
    question: "Which keyword is used to define a function in Python?",
    options: ["function", "define", "def", "fun"],
    correctIndex: 2,
  },
  {
    id: "q5",
    number: 5,
    section: "Python Programming",
    question: "Which exception is commonly raised when a requested file does not exist?",
    options: ["TypeError", "FileNotFoundError", "NameError", "IndexError"],
    correctIndex: 1,
  },
  {
    id: "q6",
    number: 6,
    section: "Python Programming",
    question: "Which method converts a string to uppercase?",
    options: ["upper()", "lower()", "capitalize()", "titlecase()"],
    correctIndex: 0,
  },
  {
    id: "q7",
    number: 7,
    section: "Python Programming",
    question: "Which loop is commonly used when the number of repetitions is known?",
    options: ["for", "if", "try", "with"],
    correctIndex: 0,
  },
  {
    id: "q8",
    number: 8,
    section: "Python Programming",
    question: "What is a class in Python?",
    options: [
      "An instance of an object",
      "A loop",
      "A blueprint for creating objects",
      "A variable only",
    ],
    correctIndex: 2,
  },
  {
    id: "q9",
    number: 9,
    section: "Python Programming",
    question: "Which statement is used to import the math module?",
    options: ["include math", "import math", "using math", "def math"],
    correctIndex: 1,
  },
  {
    id: "q10",
    number: 10,
    section: "Python Programming",
    question: "What is the main purpose of debugging?",
    options: [
      "To find and correct errors",
      "To create variables",
      "To delete a program",
      "To print output",
    ],
    correctIndex: 0,
  },
  {
    id: "q11",
    number: 11,
    section: "Python Programming",
    question: "Which block executes when the condition of an if statement is False?",
    options: ["if", "elif", "else", "try"],
    correctIndex: 2,
  },
  {
    id: "q12",
    number: 12,
    section: "Python Programming",
    question: "Which keyword is used to define a class in Python?",
    options: ["object", "class", "new", "struct"],
    correctIndex: 1,
  },
  {
    id: "q13",
    number: 13,
    section: "Python Programming",
    question: "Which built-in function is used to find the number of elements in a list?",
    options: ["sum()", "max()", "len()", "min()"],
    correctIndex: 2,
  },
  {
    id: "q14",
    number: 14,
    section: "Python Programming",
    question: "What is an object in Python?",
    options: [
      "An instance of a class",
      "A blueprint of a class",
      "A constructor keyword",
      "A comment",
    ],
    correctIndex: 0,
  },
  {
    id: "q15",
    number: 15,
    section: "Python Programming",
    question: "Which method is used to add an element at the end of a list?",
    options: ["insert()", "add()", "append()", "extend()"],
    correctIndex: 2,
  },
  {
    id: "q16",
    number: 16,
    section: "Python Programming",
    question: "Which keyword is used to send a result back from a function?",
    options: ["print", "input", "return", "def"],
    correctIndex: 2,
  },
  {
    id: "q17",
    number: 17,
    section: "Python Programming",
    question: "What is the purpose of a constructor in a class?",
    options: [
      "To stop a program",
      "To define a loop",
      "To print only messages",
      "To initialize an object's data",
    ],
    correctIndex: 3,
  },
  {
    id: "q18",
    number: 18,
    section: "Python Programming",
    question: "Which statement automatically closes a file after its block finishes?",
    options: ["close()", "with open()", "print()", "read()"],
    correctIndex: 1,
  },
  {
    id: "q19",
    number: 19,
    section: "Python Programming",
    question: "A dictionary stores data in which form?",
    options: ["Index-value pairs", "Key-value pairs", "Only values", "Only keys"],
    correctIndex: 1,
  },
  {
    id: "q20",
    number: 20,
    section: "Python Programming",
    question: "Which operation returns the common elements from two sets?",
    options: ["Union", "Intersection", "Difference", "Addition"],
    correctIndex: 1,
  },
  {
    id: "q21",
    number: 21,
    section: "Python Programming",
    question: "What is the purpose of a project presentation?",
    options: [
      "To explain the project and its working",
      "To delete the project",
      "To avoid questions",
      "To copy another program",
    ],
    correctIndex: 0,
  },
  {
    id: "q22",
    number: 22,
    section: "Python Programming",
    question: "Which variable is accessible only inside the function where it is created?",
    options: ["Global variable", "Local variable", "Built-in variable", "Module variable"],
    correctIndex: 1,
  },
  {
    id: "q23",
    number: 23,
    section: "Python Programming",
    question: "What is the main advantage of using a with open() statement?",
    options: [
      "It makes files larger",
      "It automatically closes the file",
      "It removes all errors",
      "It changes the file name",
    ],
    correctIndex: 1,
  },
  {
    id: "q24",
    number: 24,
    section: "Python Programming",
    question: "What is the main objective of developing a mini project in Python?",
    options: [
      "To memorize Python keywords",
      "To apply programming concepts to solve a problem",
      "To avoid writing programs",
      "To learn only theory",
    ],
    correctIndex: 1,
  },
  {
    id: "q25",
    number: 25,
    section: "Python Programming",
    question:
      "Which of the following is an example of a real-world Python programming application?",
    options: [
      "Electronic Shop Billing System",
      "Opening a notebook",
      "Drawing on paper",
      "Switching off a computer",
    ],
    correctIndex: 0,
  },
];
