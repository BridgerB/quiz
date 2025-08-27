import type { Actions } from "@sveltejs/kit";
import { fail } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { questions, quizAttempts, quizzes } from "$lib/server/db/schema";
import { desc, eq, or } from "drizzle-orm";

export const load = async ({ url }: { url: URL }) => {
  const searchQuery = url.searchParams.get("search") || "";

  try {
    // Get all quizzes with their questions for client-side filtering
    const allQuizzes = await db
      .select({
        id: quizzes.id,
        topic: quizzes.topic,
        createdAt: quizzes.createdAt,
      })
      .from(quizzes)
      .orderBy(desc(quizzes.createdAt))
      .limit(50); // Increase limit for better search results

    // Get all questions for these quizzes
    let allQuestions: typeof questions.$inferSelect[] = [];
    if (allQuizzes.length > 0) {
      const quizIds = allQuizzes.map((q) => q.id);
      allQuestions = await db
        .select()
        .from(questions)
        .where(
          or(...quizIds.map((id) => eq(questions.quizId, id))),
        );
    }

    // Attach questions to quizzes
    const quizzesWithQuestions = allQuizzes.map((quiz) => ({
      ...quiz,
      questions: allQuestions.filter((q) => q.quizId === quiz.id),
    }));

    return {
      quizzes: quizzesWithQuestions,
      searchQuery,
    };
  } catch (error) {
    console.error("Error loading quizzes:", error);
    return {
      quizzes: [],
      searchQuery,
    };
  }
};

export const actions: Actions = {
  search: async ({ request }: { request: Request }) => {
    const data = await request.formData();
    const searchTerm = data.get("search")?.toString() || "";

    // The search will be handled by the load function via URL params
    // This action can be used for more complex search logic if needed
    return {
      success: true,
      searchTerm,
    };
  },

  deleteQuiz: async ({ request }) => {
    const data = await request.formData();
    const quizId = data.get("quizId")?.toString();

    if (!quizId) {
      return fail(400, { error: "Quiz ID is required" });
    }

    try {
      // Delete in order: attempts, questions, quiz
      await db.delete(quizAttempts).where(eq(quizAttempts.quizId, quizId));
      await db.delete(questions).where(eq(questions.quizId, quizId));
      await db.delete(quizzes).where(eq(quizzes.id, quizId));

      return { success: true, message: "Quiz deleted successfully" };
    } catch (error) {
      console.error("Error deleting quiz:", error);
      return fail(500, { error: "Failed to delete quiz" });
    }
  },
};
