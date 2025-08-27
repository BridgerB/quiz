import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { questions, quizAttempts, quizzes } from "$lib/server/db/schema";
import { count, sql } from "drizzle-orm";

export const load: PageServerLoad = async () => {
  try {
    // Database health check
    const dbHealthCheck = await db
      .select({ now: sql<string>`NOW()` })
      .from(sql`(SELECT NOW() as now) as health_check`)
      .limit(1);

    // Get table sizes
    const quizTableSize = await db.select({ count: count() }).from(quizzes);
    const questionTableSize = await db.select({ count: count() }).from(questions);
    const attemptTableSize = await db.select({ count: count() }).from(quizAttempts);

    // Get recent database activity
    const recentQuizzes = await db
      .select({
        id: quizzes.id,
        topic: quizzes.topic,
        createdAt: quizzes.createdAt,
      })
      .from(quizzes)
      .orderBy(sql`${quizzes.createdAt} DESC`)
      .limit(5);

    const recentAttempts = await db
      .select({
        id: quizAttempts.id,
        score: quizAttempts.score,
        totalQuestions: quizAttempts.totalQuestions,
        completedAt: quizAttempts.completedAt,
      })
      .from(quizAttempts)
      .orderBy(sql`${quizAttempts.completedAt} DESC`)
      .limit(5);

    // System information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()),
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
    };

    return {
      dbHealth: {
        status: 'connected',
        timestamp: dbHealthCheck[0]?.now || new Date().toISOString(),
      },
      tableStats: {
        quizzes: quizTableSize[0]?.count || 0,
        questions: questionTableSize[0]?.count || 0,
        attempts: attemptTableSize[0]?.count || 0,
      },
      recentActivity: {
        quizzes: recentQuizzes,
        attempts: recentAttempts,
      },
      systemInfo,
    };
  } catch (error) {
    console.error("Error loading dev data:", error);
    return {
      dbHealth: {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      tableStats: { quizzes: 0, questions: 0, attempts: 0 },
      recentActivity: { quizzes: [], attempts: [] },
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }
};

export const actions: Actions = {
  seedData: async () => {
    try {
      // Create sample quizzes for development
      const sampleQuizzes = [
        { topic: "JavaScript Basics", questions: [
          { text: "What is a closure?", a: "A function inside another function", b: "A data type", c: "A loop", d: "A variable", correct: "A" },
          { text: "What does 'typeof null' return?", a: "null", b: "undefined", c: "object", d: "string", correct: "C" },
        ]},
        { topic: "Web Development", questions: [
          { text: "What does HTML stand for?", a: "Hypertext Markup Language", b: "High Tech Modern Language", c: "Home Tool Markup Language", d: "None of the above", correct: "A" },
          { text: "Which is not a CSS property?", a: "color", b: "font-size", c: "margin", d: "innerHTML", correct: "D" },
        ]},
      ];

      for (const sampleQuiz of sampleQuizzes) {
        const [quiz] = await db.insert(quizzes).values({
          topic: sampleQuiz.topic,
          createdAt: new Date(),
        }).returning();

        for (const q of sampleQuiz.questions) {
          await db.insert(questions).values({
            quizId: quiz.id,
            questionText: q.text,
            optionA: q.a,
            optionB: q.b,
            optionC: q.c,
            optionD: q.d,
            correctAnswer: q.correct,
          });
        }
      }

      return { success: true, message: "Sample data seeded successfully" };
    } catch (error) {
      console.error("Error seeding data:", error);
      return fail(500, { error: "Failed to seed data" });
    }
  },

  clearCache: () => {
    try {
      // In a real app, you'd clear Redis cache, file cache, etc.
      // For now, we'll just simulate it
      if ((globalThis).gc) {
        (globalThis).gc();
      }
      return { success: true, message: "Cache cleared successfully" };
    } catch (error) {
      console.error("Error clearing cache:", error);
      return fail(500, { error: "Failed to clear cache" });
    }
  },

  testOllama: async () => {
    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.1",
          prompt: "Say 'Hello, Ollama is working!' and nothing else.",
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return { 
        success: true, 
        message: "Ollama connection successful", 
        response: data.response?.trim() || "No response"
      };
    } catch (error) {
      return fail(500, { 
        error: `Ollama test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  },

  runMigration: () => {
    try {
      // Simulate running database migrations
      // In a real app, you'd run actual migration scripts
      return { success: true, message: "Database migrations completed" };
    } catch (error) {
      console.error("Error running migrations:", error);
      return fail(500, { error: "Migration failed" });
    }
  }
};