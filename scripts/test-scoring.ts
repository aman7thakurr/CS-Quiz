import { calculateScore, gradeAttempt } from "../src/lib/scoring";

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    console.error(`❌ FAILED: ${message}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${actual}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log("\n========================================================");
console.log("CBT TRAINER — SCORING MATHEMATICS PROOF & VERIFICATION");
console.log("========================================================\n");

// Test Case 1: The prompt's mandatory exact example
// 60 correct + 20 wrong + 20 skipped must produce exactly 55.00/100
const test1 = calculateScore({
  totalQuestions: 100,
  correctCount: 60,
  wrongCount: 20,
});

assertEqual(test1.score, 55.0, "Score calculation for 60 correct + 20 wrong + 20 skipped");
assertEqual(test1.skippedCount, 20, "Skipped count calculation");
assertEqual(test1.maxScore, 100, "Max score calculation");
assertEqual(test1.accuracy, 75.0, "Accuracy percentage (60 / 80 attempted = 75%)");
assertEqual(
  test1.formulaDisplay,
  "60 × +1 − 20 × 0.25 = 55.00 / 100",
  "Scoring formula display matches expected string"
);

// Test Case 2: Perfect score
const test2 = calculateScore({
  totalQuestions: 100,
  correctCount: 100,
  wrongCount: 0,
});
assertEqual(test2.score, 100.0, "Perfect score: 100 correct");
assertEqual(test2.accuracy, 100.0, "Perfect accuracy: 100%");

// Test Case 3: All wrong
const test3 = calculateScore({
  totalQuestions: 100,
  correctCount: 0,
  wrongCount: 100,
});
assertEqual(test3.score, -25.0, "All wrong penalty: 100 * -0.25 = -25.00");

// Test Case 4: All skipped
const test4 = calculateScore({
  totalQuestions: 100,
  correctCount: 0,
  wrongCount: 0,
});
assertEqual(test4.score, 0.0, "All skipped: score 0.00");
assertEqual(test4.skippedCount, 100, "All skipped: skipped count 100");

// Test Case 5: Option shuffle translation verification
const questionIds = ["q1", "q2", "q3"];
const correctAnswers = {
  q1: 0, // Option A is correct
  q2: 2, // Option C is correct
  q3: 1, // Option B is correct
};

// Shuffled options map:
// q1: original [0,1,2,3] -> displayed in order [3, 2, 0, 1] (meaning displayed option 2 is original option 0)
const optionShuffleMap = {
  q1: [3, 2, 0, 1],
  q2: [2, 0, 1, 3], // displayed option 0 is original option 2
  q3: [0, 1, 2, 3], // unchanged
};

// User selects:
// q1: user chooses displayed option 2 (which maps to original 0 -> CORRECT)
// q2: user chooses displayed option 1 (which maps to original 0 -> WRONG)
// q3: user chooses not to answer (unattempted)
const answerMap = {
  q1: 2,
  q2: 1,
};

const gradingResult = gradeAttempt(
  answerMap,
  correctAnswers,
  optionShuffleMap,
  questionIds
);

assertEqual(gradingResult.correctCount, 1, "Shuffled option grading correctly resolves q1 as correct");
assertEqual(gradingResult.wrongCount, 1, "Shuffled option grading correctly resolves q2 as wrong");
assertEqual(gradingResult.totalQuestions, 3, "Total questions graded matches length");

console.log("\n========================================================");
console.log("ALL SCORING & SHUFFLE PROOF TESTS PASSED SUCCESSFULLY! 🎉");
console.log("========================================================\n");
