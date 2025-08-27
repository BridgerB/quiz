import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { questions, quizAttempts, quizzes } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ params }) => {
  const attemptId = params.id;

  if (!attemptId) {
    throw new Error("Attempt ID is required");
  }

  try {
    // Get quiz attempt details
    const attempt = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.id, attemptId))
      .limit(1);

    if (attempt.length === 0) {
      throw new Error("Quiz attempt not found");
    }

    // Get quiz details
    const quiz = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.id, attempt[0].quizId))
      .limit(1);

    if (quiz.length === 0) {
      throw new Error("Quiz not found");
    }

    // Get all questions for this quiz
    const quizQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.quizId, attempt[0].quizId))
      .orderBy(questions.questionText);

    // For this simple version, we'll just show the score
    // In a full implementation, you'd store individual answers in the database
    return {
      attempt: attempt[0],
      quiz: quiz[0],
      questions: quizQuestions,
    };
  } catch (error) {
    console.error("Error loading quiz results:", error);
    throw new Error("Failed to load quiz results");
  }
};
