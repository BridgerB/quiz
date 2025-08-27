import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { questions, quizAttempts, quizzes } from "$lib/server/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";

export const load: PageServerLoad = async () => {
  try {
    // Get all quizzes with attempt counts
    const allQuizzes = await db
      .select({
        id: quizzes.id,
        topic: quizzes.topic,
        createdAt: quizzes.createdAt,
        attemptCount: count(quizAttempts.id),
      })
      .from(quizzes)
      .leftJoin(quizAttempts, eq(quizzes.id, quizAttempts.quizId))
      .groupBy(quizzes.id, quizzes.topic, quizzes.createdAt)
      .orderBy(desc(quizzes.createdAt));

    // Get question counts for each quiz
    const questionCounts = await db
      .select({
        quizId: questions.quizId,
        questionCount: count(),
      })
      .from(questions)
      .groupBy(questions.quizId);

    // Merge question counts with quiz data
    const quizzesWithCounts = allQuizzes.map((quiz) => ({
      ...quiz,
      questionCount: questionCounts.find((qc) =>
        qc.quizId === quiz.id
      )?.questionCount || 0,
    }));

    // System statistics
    const totalQuizzes = await db.select({ count: count() }).from(quizzes);
    const totalQuestions = await db.select({ count: count() }).from(questions);
    const totalAttempts = await db.select({ count: count() }).from(
      quizAttempts,
    );

    // Recent activity - last 10 attempts
    const recentAttempts = await db
      .select({
        id: quizAttempts.id,
        score: quizAttempts.score,
        totalQuestions: quizAttempts.totalQuestions,
        completedAt: quizAttempts.completedAt,
        quizTopic: quizzes.topic,
      })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .orderBy(desc(quizAttempts.completedAt))
      .limit(10);

    // Average scores by quiz
    const quizStats = await db
      .select({
        quizId: quizAttempts.quizId,
        quizTopic: quizzes.topic,
        avgScore: sql<
          number
        >`AVG((${quizAttempts.score}::float / ${quizAttempts.totalQuestions}) * 100)`,
        attemptCount: count(),
      })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .groupBy(quizAttempts.quizId, quizzes.topic)
      .orderBy(desc(count()));

    return {
      quizzes: quizzesWithCounts,
      stats: {
        totalQuizzes: totalQuizzes[0]?.count || 0,
        totalQuestions: totalQuestions[0]?.count || 0,
        totalAttempts: totalAttempts[0]?.count || 0,
      },
      recentAttempts,
      quizStats,
    };
  } catch (error) {
    console.error("Error loading admin data:", error);
    return {
      quizzes: [],
      stats: { totalQuizzes: 0, totalQuestions: 0, totalAttempts: 0 },
      recentAttempts: [],
      quizStats: [],
    };
  }
};

export const actions: Actions = {
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

  editQuizTopic: async ({ request }) => {
    const data = await request.formData();
    const quizId = data.get("quizId")?.toString();
    const newTopic = data.get("topic")?.toString();

    if (!quizId || !newTopic) {
      return fail(400, { error: "Quiz ID and topic are required" });
    }

    if (newTopic.trim().length === 0 || newTopic.trim().length > 100) {
      return fail(400, { error: "Topic must be between 1 and 100 characters" });
    }

    try {
      await db
        .update(quizzes)
        .set({ topic: newTopic.trim() })
        .where(eq(quizzes.id, quizId));

      return { success: true, message: "Quiz topic updated successfully" };
    } catch (error) {
      console.error("Error updating quiz topic:", error);
      return fail(500, { error: "Failed to update quiz topic" });
    }
  },

  bulkDelete: async ({ request }) => {
    const data = await request.formData();
    const quizIds = data.getAll("selectedQuizzes").map((id) => id.toString());

    if (quizIds.length === 0) {
      return fail(400, { error: "No quizzes selected" });
    }

    try {
      // Delete in order: attempts, questions, quizzes
      for (const quizId of quizIds) {
        await db.delete(quizAttempts).where(eq(quizAttempts.quizId, quizId));
        await db.delete(questions).where(eq(questions.quizId, quizId));
        await db.delete(quizzes).where(eq(quizzes.id, quizId));
      }

      return {
        success: true,
        message: `Successfully deleted ${quizIds.length} quiz${
          quizIds.length > 1 ? "es" : ""
        }`,
      };
    } catch (error) {
      console.error("Error bulk deleting quizzes:", error);
      return fail(500, { error: "Failed to delete selected quizzes" });
    }
  },

  clearAllAttempts: async () => {
    try {
      await db.delete(quizAttempts);
      return {
        success: true,
        message: "All quiz attempts cleared successfully",
      };
    } catch (error) {
      console.error("Error clearing attempts:", error);
      return fail(500, { error: "Failed to clear quiz attempts" });
    }
  },
};
