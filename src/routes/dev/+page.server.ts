import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { questions, quizAttempts, quizzes } from "$lib/server/db/schema";
import { count, sql } from "drizzle-orm";
import { ANTHROPIC_API_KEY } from "$env/static/private";

export const load: PageServerLoad = async () => {
  try {
    // Database health check
    const dbHealthCheck = await db
      .select({ now: sql<string>`NOW()` })
      .from(sql`(SELECT NOW() as now) as health_check`)
      .limit(1);

    // Get table sizes
    const quizTableSize = await db.select({ count: count() }).from(quizzes);
    const questionTableSize = await db.select({ count: count() }).from(
      questions,
    );
    const attemptTableSize = await db.select({ count: count() }).from(
      quizAttempts,
    );

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
      environment: process.env.NODE_ENV || "development",
    };

    return {
      dbHealth: {
        status: "connected",
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
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      tableStats: { quizzes: 0, questions: 0, attempts: 0 },
      recentActivity: { quizzes: [], attempts: [] },
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
        environment: process.env.NODE_ENV || "development",
      },
    };
  }
};

export const actions: Actions = {
  seedData: async () => {
    try {
      // Create sample quizzes for development
      const sampleQuizzes = [
        {
          topic: "JavaScript Basics",
          questions: [
            {
              text: "What is a closure?",
              a: "A function with access to its outer scope",
              b: "A private variable",
              c: "A loop construct",
              d: "A type of object",
              correct: "A",
            },
            {
              text: "What does 'typeof null' return?",
              a: "null",
              b: "undefined",
              c: "object",
              d: "string",
              correct: "C",
            },
            {
              text: "Which method adds elements to the end of an array?",
              a: "unshift()",
              b: "push()",
              c: "append()",
              d: "add()",
              correct: "B",
            },
            {
              text: "What is the output of '2' + 2?",
              a: "4",
              b: "22",
              c: "NaN",
              d: "TypeError",
              correct: "B",
            },
            {
              text: "How do you declare a constant in JavaScript?",
              a: "let",
              b: "var",
              c: "const",
              d: "constant",
              correct: "C",
            },
          ],
        },
        {
          topic: "Web Development",
          questions: [
            {
              text: "What does HTML stand for?",
              a: "Hypertext Markup Language",
              b: "High Tech Modern Language",
              c: "Home Tool Markup Language",
              d: "Hybrid Text Making Language",
              correct: "A",
            },
            {
              text: "Which is NOT a valid HTTP method?",
              a: "GET",
              b: "POST",
              c: "SEND",
              d: "DELETE",
              correct: "C",
            },
            {
              text: "What is the purpose of CSS Grid?",
              a: "Form validation",
              b: "Layout management",
              c: "Data storage",
              d: "Event handling",
              correct: "B",
            },
            {
              text: "Which tag is used for linking JavaScript files?",
              a: "<script>",
              b: "<javascript>",
              c: "<js>",
              d: "<link>",
              correct: "A",
            },
            {
              text: "What is the correct syntax for a CSS class selector?",
              a: "#header",
              b: ".header",
              c: "*header",
              d: "@header",
              correct: "B",
            },
          ],
        },
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

  testOllama: async () => {
    try {
      console.log(
        "Making Anthropic API request with key:",
        ANTHROPIC_API_KEY.substring(0, 8) + "...",
      );

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-opus-20240229",
          max_tokens: 100,
          messages: [
            {
              role: "user",
              content:
                "Say 'Hello, Anthropic API is working!' and nothing else.",
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Anthropic API error response:", {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText,
        });
        throw new Error(
          `Anthropic API error: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Anthropic API success response:", data);
      return {
        success: true,
        message: "Anthropic connection successful",
        response: data.messages?.[0]?.content?.[0]?.text,
      };
    } catch (error) {
      return fail(500, {
        error: `Anthropic API test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  },
};
