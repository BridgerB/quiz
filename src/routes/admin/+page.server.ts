import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { questions, quizAttempts, quizzes } from "$lib/server/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import JSZip from 'jszip';

type DatabaseRecord = Record<string, any>;

type BackupResult = {
  zipBuffer: Buffer;
  timestamp: string;
};

async function convertToCSV(data: DatabaseRecord[]): Promise<string> {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');
  const rows = data.map((row) => {
    return headers
      .map((header) => {
        let value = row[header];
        if (value === null || value === undefined) {
          return '';
        }
        if (Array.isArray(value)) {
          value = `"${value.join(';')}"`;
        }
        // Convert Date objects to ISO strings
        if (value instanceof Date) {
          value = value.toISOString();
        }
        if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(',');
  });
  return [headerRow, ...rows].join('\n');
}

async function backupDatabase(): Promise<BackupResult> {
  try {
    console.log('🚀 Starting database backup...\n');

    const zip = new JSZip();

    const now = new Date();
    const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const timestamp = localTime.toISOString().replace(/:/g, '-').split('.')[0];

    // Backup each table individually using schema objects
    
    // Backup quizzes table
    console.log('Backing up quizzes...');
    const quizzesData = await db.select().from(quizzes);
    const quizzesCSV = await convertToCSV(quizzesData);
    zip.file('quizzes.csv', quizzesCSV);
    console.log(`✓ Backed up ${quizzesData.length} records from quizzes`);

    // Backup questions table
    console.log('Backing up questions...');
    const questionsData = await db.select().from(questions);
    const questionsCSV = await convertToCSV(questionsData);
    zip.file('questions.csv', questionsCSV);
    console.log(`✓ Backed up ${questionsData.length} records from questions`);

    // Backup quiz_attempts table
    console.log('Backing up quiz_attempts...');
    const attemptsData = await db.select().from(quizAttempts);
    const attemptsCSV = await convertToCSV(attemptsData);
    zip.file('quiz_attempts.csv', attemptsCSV);
    console.log(`✓ Backed up ${attemptsData.length} records from quiz_attempts`);

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9
      }
    });

    console.log('\n✨ Database backup completed successfully!');
    return { zipBuffer, timestamp };
  } catch (error) {
    console.error('\n❌ Database backup failed:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : '');
    throw error;
  }
}

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
  backup: async () => {
    try {
      const { zipBuffer, timestamp } = await backupDatabase();
      const base64File = zipBuffer.toString('base64');

      return {
        success: true,
        file: base64File,
        filename: `quiz-backup-${timestamp}.zip`,
        type: 'application/zip'
      };
    } catch (err) {
      console.error('Backup failed:', err);
      return fail(500, { error: 'Failed to create backup' });
    }
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
