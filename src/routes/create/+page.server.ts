import type { Actions } from "@sveltejs/kit";
import { fail, redirect } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { questions, quizzes } from "$lib/server/db/schema";

interface OllamaResponse {
  response: string;
  done: boolean;
}

interface QuizQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
}

async function generateQuizWithOllama(topic: string): Promise<QuizQuestion[]> {
  console.log(`🚀 Starting quiz generation for topic: "${topic}"`);

  const prompt =
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
- Generate exactly 5 questions

Topic: ${topic}`;

  try {
    console.log("📡 Making request to Ollama API...");
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3.1",
        prompt: prompt,
        stream: false,
      }),
    });

    console.log(`📥 Ollama API response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data: OllamaResponse = await response.json();
    console.log(
      "🎯 Raw Ollama response received, length:",
      data.response.length,
    );
    console.log(
      "📝 First 200 chars of response:",
      data.response.substring(0, 200),
    );

    // Clean up the response - remove any markdown formatting
    let cleanedResponse = data.response.trim();
    console.log("🧹 Cleaned response length:", cleanedResponse.length);

    // Remove code blocks if present
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, "").replace(
      /```\n?/g,
      "",
    );
    console.log(
      "🔧 After removing code blocks:",
      cleanedResponse.substring(0, 200),
    );

    // Try to extract JSON if there's extra text
    const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      console.log("✅ Found JSON array match");
      cleanedResponse = jsonMatch[0];
    } else {
      console.log("⚠️ No JSON array pattern found");
    }

    console.log(
      "🎭 Final cleaned response for parsing:",
      cleanedResponse.substring(0, 300),
    );

    // Parse the JSON response
    const quizData = JSON.parse(cleanedResponse);
    console.log(
      "✅ JSON parsed successfully, questions count:",
      quizData.length,
    );

    // Validate the structure
    if (!Array.isArray(quizData) || quizData.length !== 5) {
      console.log(
        "❌ Validation failed: Expected 5 questions, got:",
        quizData.length,
      );
      throw new Error("Invalid quiz format: Expected array of 5 questions");
    }

    // Validate each question
    for (let i = 0; i < quizData.length; i++) {
      const question = quizData[i];
      console.log(`🔍 Validating question ${i + 1}:`, {
        hasQuestionText: !!question.questionText,
        hasOptionA: !!question.optionA,
        hasOptionB: !!question.optionB,
        hasOptionC: !!question.optionC,
        hasOptionD: !!question.optionD,
        correctAnswer: question.correctAnswer,
      });

      if (
        !question.questionText || !question.optionA || !question.optionB ||
        !question.optionC || !question.optionD || !question.correctAnswer
      ) {
        console.log(
          `❌ Question ${i + 1} validation failed: Missing required fields`,
        );
        throw new Error("Invalid question format: Missing required fields");
      }

      if (!["A", "B", "C", "D"].includes(question.correctAnswer)) {
        console.log(
          `❌ Question ${i + 1} validation failed: Invalid correct answer:`,
          question.correctAnswer,
        );
        throw new Error("Invalid correctAnswer: Must be A, B, C, or D");
      }
    }

    console.log("🎉 All questions validated successfully");
    return quizData;
  } catch (error) {
    console.error("💥 Error generating quiz with Ollama:", error);
    throw new Error(
      `Failed to generate quiz: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

export const actions: Actions = {
  create: async ({ request }) => {
    console.log("🎬 Starting quiz creation action");

    const data = await request.formData();
    const topic = data.get("topic")?.toString();
    console.log("📝 Received topic:", topic);

    if (!topic || topic.trim().length === 0) {
      console.log("❌ Validation failed: Empty topic");
      return fail(400, {
        error: "Topic is required",
        topic: topic || "",
      });
    }

    if (topic.trim().length > 100) {
      console.log("❌ Validation failed: Topic too long");
      return fail(400, {
        error: "Topic must be 100 characters or less",
        topic: topic,
      });
    }

    try {
      console.log("✅ Topic validation passed, generating quiz...");
      // Generate quiz using Ollama
      const generatedQuestions = await generateQuizWithOllama(topic.trim());

      console.log("💾 Saving quiz to database...");
      // Save quiz to database
      const [newQuiz] = await db
        .insert(quizzes)
        .values({
          topic: topic.trim(),
          createdAt: new Date(),
        })
        .returning();

      console.log("✅ Quiz saved with ID:", newQuiz.id);

      // Save questions to database
      console.log("💾 Saving questions to database...");
      for (let i = 0; i < generatedQuestions.length; i++) {
        const question = generatedQuestions[i];
        console.log(`💾 Saving question ${i + 1}...`);

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

        console.log(`✅ Question ${i + 1} saved with ID:`, savedQuestion[0].id);
      }

      console.log(
        "🎉 All questions saved successfully! Redirecting to quiz...",
      );
      console.log("🔄 Redirecting to:", `/quiz/${newQuiz.id}`);

      // Redirect to the quiz page
      throw redirect(303, `/quiz/${newQuiz.id}`);
    } catch (error) {
      // Check if this is actually a redirect (which is expected)
      if (
        error && typeof error === "object" && "status" in error &&
        error.status === 303
      ) {
        console.log("✅ Quiz created successfully! Redirecting...");
        throw error; // Re-throw redirect - this is the expected behavior
      }

      // Only log actual errors
      console.error("💥 Error in create action:", error);
      console.error("📋 Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
      });

      console.log("❌ Returning error to user");
      return fail(500, {
        error: error instanceof Error
          ? error.message
          : "Failed to create quiz. Please try again.",
        topic: topic,
      });
    }
  },
};
