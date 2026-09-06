/**
 * CBT Trainer — Scoring Engine
 *
 * Exact marking scheme for the Computer Programmer CBT:
 *   - Correct answer: +1
 *   - Wrong answer:   −0.25
 *   - Unattempted:     0
 *   - Score = (correctCount × perQuestionMark) − (wrongCount × negativeMarkPerWrong)
 */

export interface ScoringConfig {
  perQuestionMark: number;
  negativeMarkPerWrong: number;
}

export interface ScoringInput {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
}

export interface ScoringResult {
  score: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracy: number; // percentage of attempted that were correct
  totalQuestions: number;
  maxScore: number;
  formulaDisplay: string; // e.g. "60 × +1 − 20 × 0.25 = 55.00 / 100"
}

/**
 * Default exam configuration matching the real CBT
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  perQuestionMark: 1,
  negativeMarkPerWrong: 0.25,
};

/**
 * Calculate the exam score using the exact formula
 */
export function calculateScore(
  input: ScoringInput,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): ScoringResult {
  const { totalQuestions, correctCount, wrongCount } = input;
  const { perQuestionMark, negativeMarkPerWrong } = config;

  const skippedCount = totalQuestions - correctCount - wrongCount;
  const positiveMarks = correctCount * perQuestionMark;
  const negativeMarks = wrongCount * negativeMarkPerWrong;
  const score = positiveMarks - negativeMarks;
  const maxScore = totalQuestions * perQuestionMark;

  // Accuracy = correct / attempted (not total)
  const attempted = correctCount + wrongCount;
  const accuracy = attempted > 0 ? (correctCount / attempted) * 100 : 0;

  // Build formula display string
  const parts: string[] = [];
  parts.push(`${correctCount} × +${perQuestionMark}`);
  if (wrongCount > 0) {
    parts.push(`${wrongCount} × ${negativeMarkPerWrong}`);
  }
  const formulaDisplay = `${parts.join(" − ")} = ${score.toFixed(
    2
  )} / ${maxScore}`;

  return {
    score,
    correctCount,
    wrongCount,
    skippedCount,
    accuracy,
    totalQuestions,
    maxScore,
    formulaDisplay,
  };
}

/**
 * Grade an attempt server-side by comparing answers against correct answers from DB.
 * Returns the scoring input (correct/wrong counts) that can be passed to calculateScore.
 *
 * @param answerMap - { questionId: chosenIndex } from the user's attempt (shuffled indices)
 * @param correctAnswers - { questionId: correctIndex } from the database (original indices)
 * @param optionShuffleMap - { questionId: [originalIndexAtPosition0, ...] } mapping
 * @param questionIds - ordered list of all question IDs in the attempt
 */
export function gradeAttempt(
  answerMap: Record<string, number>,
  correctAnswers: Record<string, number>,
  optionShuffleMap: Record<string, number[]> | null,
  questionIds: string[]
): ScoringInput {
  let correctCount = 0;
  let wrongCount = 0;

  for (const qId of questionIds) {
    const chosenIndex = answerMap[qId];

    // Unattempted
    if (chosenIndex === undefined || chosenIndex === null) {
      continue;
    }

    const dbCorrectIndex = correctAnswers[qId];
    if (dbCorrectIndex === undefined) continue;

    // If options were shuffled, map the user's chosen index back to the original
    let actualChosenOriginalIndex = chosenIndex;
    if (optionShuffleMap && optionShuffleMap[qId]) {
      const shuffle = optionShuffleMap[qId];
      // shuffle[displayIndex] = originalIndex
      actualChosenOriginalIndex = shuffle[chosenIndex];
    }

    if (actualChosenOriginalIndex === dbCorrectIndex) {
      correctCount++;
    } else {
      wrongCount++;
    }
  }

  return {
    totalQuestions: questionIds.length,
    correctCount,
    wrongCount,
  };
}
