import type { Actions } from "@sveltejs/kit";
import { fail, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { questions, quizzes } from "$lib/server/db/schema";
import { ANTHROPIC_API_KEY } from "$env/static/private";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

interface QuizQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}

async function generateQuizWithClaude(topic: string): Promise<QuizQuestion[]> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content:
          `Create a quiz about "${topic}". Generate exactly 5 multiple-choice questions with 4 options each (A, B, C, D). Only one option should be correct per question.

Format your response as valid JSON with this exact structure:
[
  {
    "questionText": "What is the question?",
    "optionA": "First option",
    "optionB": "Second option", 
    "optionC": "Third option",
    "optionD": "Fourth option",
    "correctAnswer": "A"
  }
]

Make sure:
- Questions are factually accurate and educational
- Options are plausible but only one is correct
- correctAnswer is exactly "A", "B", "C", or "D"
- Return only valid JSON, no additional text
- Generate exactly 5 questions`,
      }],
    });

    if (message.content[0].type !== "text") {
      throw new Error("Unexpected response format from Claude");
    }
    const textBlock = message.content[0];
    const responseContent = textBlock.text;
    // Parse the JSON response
    const quizData = JSON.parse(responseContent);

    // Validate the quiz data
    if (!Array.isArray(quizData) || quizData.length !== 5) {
      throw new Error("Invalid quiz format: Expected array of 5 questions");
    }

    return quizData;
  } catch (error) {
    throw new Error("Failed to generate quiz questions");
  }
}

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const topic = data.get("topic")?.toString();

    if (!topic || topic.trim().length === 0) {
      return fail(400, {
        error: "Topic is required",
        topic: topic || "",
      });
    }

    if (topic.trim().length > 100) {
      return fail(400, {
        error: "Topic must be 100 characters or less",
        topic: topic,
      });
    }

    try {
      console.log("✅ Topic validation passed, generating quiz...");
      // Generate quiz using Ollama
      const generatedQuestions = await generateQuizWithClaude(topic.trim());

      console.log("💾 Saving quiz to database...");
      // Save quiz to database
      const [newQuiz] = await db
        .insert(quizzes)
        .values({
          topic: topic.trim(),
          createdAt: new Date(),
        })
        .returning();

      // Save questions to database
      for (let i = 0; i < generatedQuestions.length; i++) {
        const question = generatedQuestions[i];

        const savedQuestion = await db
          .insert(questions)
          .values({
            quizId: newQuiz.id,
            questionText: question.questionText,
            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,
            correctAnswer: question.correctAnswer,
          })
          .returning();
      }

      // Redirect to the quiz page
      throw redirect(303, `/quiz/${newQuiz.id}`);
    } catch (error) {
      // Check if this is actually a redirect (which is expected)
      if (
        error && typeof error === "object" && "status" in error &&
        error.status === 303
      ) {
        throw error; // Re-throw redirect - this is the expected behavior
      }
      return fail(500, {
        error: error instanceof Error
          ? error.message
          : "Failed to create quiz. Please try again.",
        topic: topic,
      });
    }
  },
};
