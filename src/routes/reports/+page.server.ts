import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { quizAttempts, quizzes } from "$lib/server/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";

export const load: PageServerLoad = async () => {
  console.log("🔍 Loading reports data...");
  try {
    // Quiz creation trends over time
    const quizTrends = await db
      .select({
        date: sql<string>`DATE(${quizzes.createdAt})`,
        count: count(),
      })
      .from(quizzes)
      .groupBy(sql`DATE(${quizzes.createdAt})`)
      .orderBy(sql`DATE(${quizzes.createdAt})`);

    // Score distribution across all attempts - simplified approach
    const allAttempts = await db
      .select({
        score: quizAttempts.score,
        totalQuestions: quizAttempts.totalQuestions,
      })
      .from(quizAttempts);

    // Process score distribution in JavaScript to avoid complex SQL
    const scoreRanges = {
      "90-100%": 0,
      "80-89%": 0,
      "70-79%": 0,
      "60-69%": 0,
      "50-59%": 0,
      "Below 50%": 0,
    };

    allAttempts.forEach((attempt) => {
      const percentage = (attempt.score / attempt.totalQuestions) * 100;
      if (percentage >= 90) scoreRanges["90-100%"]++;
      else if (percentage >= 80) scoreRanges["80-89%"]++;
      else if (percentage >= 70) scoreRanges["70-79%"]++;
      else if (percentage >= 60) scoreRanges["60-69%"]++;
      else if (percentage >= 50) scoreRanges["50-59%"]++;
      else scoreRanges["Below 50%"]++;
    });

    const scoreDistribution = Object.entries(scoreRanges).map((
      [range, count],
    ) => ({
      scoreRange: range,
      count,
    }));

    // Most popular quiz topics (by attempt count)
    const popularTopics = await db
      .select({
        topic: quizzes.topic,
        attemptCount: count(quizAttempts.id),
      })
      .from(quizzes)
      .leftJoin(quizAttempts, eq(quizzes.id, quizAttempts.quizId))
      .groupBy(quizzes.topic)
      .orderBy(desc(count(quizAttempts.id)))
      .limit(10);

    // Daily quiz attempts over time - simplified approach
    const dailyAttemptsRaw = await db
      .select({
        date: sql<string>`DATE(${quizAttempts.completedAt})`,
        score: quizAttempts.score,
        totalQuestions: quizAttempts.totalQuestions,
      })
      .from(quizAttempts)
      .orderBy(sql`DATE(${quizAttempts.completedAt})`);

    // Group by date in JavaScript
    const dailyData: Record<string, { count: number; totalScore: number; attempts: number[] }> = {};
    dailyAttemptsRaw.forEach((attempt) => {
      const date = attempt.date;
      if (!dailyData[date]) {
        dailyData[date] = { count: 0, totalScore: 0, attempts: [] };
      }
      dailyData[date].count++;
      dailyData[date].attempts.push(
        (attempt.score / attempt.totalQuestions) * 100,
      );
    });

    const dailyAttempts = Object.entries(dailyData).map(([date, data]) => ({
      date,
      count: data.count,
      avgScore: data.attempts.length > 0
        ? data.attempts.reduce((a: number, b: number) => a + b, 0) / data.attempts.length
        : 0,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Overall statistics
    const totalQuizzes = await db.select({ count: count() }).from(quizzes);
    const totalAttempts = await db.select({ count: count() }).from(
      quizAttempts,
    );
    // Calculate average score in JavaScript from allAttempts data
    const avgScore = allAttempts.length > 0
      ? allAttempts.reduce(
        (sum, attempt) =>
          sum + ((attempt.score / attempt.totalQuestions) * 100),
        0,
      ) / allAttempts.length
      : 0;

    console.log("📊 Database query results:");
    console.log("Total quizzes:", totalQuizzes);
    console.log("Total attempts:", totalAttempts);
    console.log("Average score:", avgScore);
    console.log("Quiz trends:", quizTrends);
    console.log("Score distribution:", scoreDistribution);
    console.log("Popular topics:", popularTopics);
    console.log("Daily attempts:", dailyAttempts);

    // If no attempts exist, provide sample data for better UX
    const hasAttempts = totalAttempts[0]?.count > 0;

    return {
      stats: {
        totalQuizzes: totalQuizzes[0]?.count || 0,
        totalAttempts: totalAttempts[0]?.count || 0,
        averageScore: Math.round(avgScore || 0),
      },
      charts: {
        quizTrends: quizTrends.length > 0 ? quizTrends : [
          {
            date: new Date().toISOString().split("T")[0],
            count: totalQuizzes[0]?.count || 0,
          },
        ],
        scoreDistribution: hasAttempts ? scoreDistribution : [
          { scoreRange: "No attempts yet", count: 0 },
        ],
        popularTopics: popularTopics.length > 0 ? popularTopics : [
          { topic: "No attempts yet", attemptCount: 0 },
        ],
        dailyAttempts: hasAttempts ? dailyAttempts : [
          {
            date: new Date().toISOString().split("T")[0],
            count: 0,
            avgScore: 0,
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error loading reports data:", error);
    return {
      stats: {
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
      },
      charts: {
        quizTrends: [],
        scoreDistribution: [],
        popularTopics: [],
        dailyAttempts: [],
      },
    };
  }
};
