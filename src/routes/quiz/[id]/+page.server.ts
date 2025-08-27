import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { quizzes, questions, quizAttempts } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const quizId = params.id;
	
	if (!quizId) {
		throw new Error('Quiz ID is required');
	}

	try {
		// Get quiz details
		const quiz = await db
			.select()
			.from(quizzes)
			.where(eq(quizzes.id, quizId))
			.limit(1);
			
		if (quiz.length === 0) {
			throw new Error('Quiz not found');
		}

		// Get questions for this quiz
		const quizQuestions = await db
			.select()
			.from(questions)
			.where(eq(questions.quizId, quizId))
			.orderBy(questions.questionText); // Simple ordering

		if (quizQuestions.length === 0) {
			throw new Error('No questions found for this quiz');
		}

		return {
			quiz: quiz[0],
			questions: quizQuestions
		};
	} catch (error) {
		console.error('Error loading quiz:', error);
		throw new Error('Failed to load quiz');
	}
};

export const actions: Actions = {
	submit: async ({ request, params }) => {
		const quizId = params.id;
		
		if (!quizId) {
			return fail(400, { error: 'Quiz ID is required' });
		}

		const data = await request.formData();
		
		try {
			// Get all questions for scoring
			const quizQuestions = await db
				.select()
				.from(questions)
				.where(eq(questions.quizId, quizId));

			if (quizQuestions.length === 0) {
				return fail(404, { error: 'Quiz not found' });
			}

			// Calculate score
			let correctAnswers = 0;
			const userAnswers: { [key: string]: string } = {};
			const results: Array<{
				questionId: string;
				questionText: string;
				userAnswer: string;
				correctAnswer: string;
				isCorrect: boolean;
				options: { A: string; B: string; C: string; D: string };
			}> = [];

			for (const question of quizQuestions) {
				const userAnswer = data.get(`question_${question.id}`)?.toString();
				userAnswers[question.id] = userAnswer || '';
				
				const isCorrect = userAnswer === question.correctAnswer;
				if (isCorrect) {
					correctAnswers++;
				}

				results.push({
					questionId: question.id,
					questionText: question.questionText,
					userAnswer: userAnswer || 'Not answered',
					correctAnswer: question.correctAnswer,
					isCorrect,
					options: {
						A: question.optionA,
						B: question.optionB,
						C: question.optionC,
						D: question.optionD
					}
				});
			}

			// Save quiz attempt
			await db
				.insert(quizAttempts)
				.values({
					quizId: quizId,
					score: correctAnswers,
					totalQuestions: quizQuestions.length,
					completedAt: new Date()
				});

			return {
				success: true,
				score: correctAnswers,
				totalQuestions: quizQuestions.length,
				results: results
			};

		} catch (error) {
			console.error('Error submitting quiz:', error);
			return fail(500, { 
				error: 'Failed to submit quiz. Please try again.' 
			});
		}
	}
};