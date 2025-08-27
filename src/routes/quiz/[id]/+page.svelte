<script>
	import { enhance } from '$app/forms';
	
	export let data;
	export let form;
	
	let currentQuestionIndex = 0;
	let userAnswers = {};
	$: currentQuestion = data.questions[currentQuestionIndex];
	$: isLastQuestion = currentQuestionIndex === data.questions.length - 1;
	$: totalQuestions = data.questions.length;
	
	function selectAnswer(questionId, answer) {
		userAnswers[questionId] = answer;
		userAnswers = { ...userAnswers }; // Trigger reactivity
	}
	
	function nextQuestion() {
		if (currentQuestionIndex < data.questions.length - 1) {
			currentQuestionIndex++;
		}
	}
	
	function prevQuestion() {
		if (currentQuestionIndex > 0) {
			currentQuestionIndex--;
		}
	}
</script>

<div class="container">
	<!-- Quiz Taking Interface -->
		<div class="quiz-header">
			<h1>Quiz: {data.quiz.topic}</h1>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {((currentQuestionIndex + 1) / totalQuestions) * 100}%"></div>
			</div>
			<div class="progress-text">
				Question {currentQuestionIndex + 1} of {totalQuestions}
			</div>
		</div>

		<div class="question-container">
			{#if currentQuestion}
				<div class="question-card">
					<h2 class="question-text">{currentQuestion.questionText}</h2>
					
					<div class="options">
						{#each ['A', 'B', 'C', 'D'] as option}
							<label class="option-label" class:selected={userAnswers[currentQuestion.id] === option}>
								<input
									type="radio"
									name="question_{currentQuestion.id}"
									value={option}
									checked={userAnswers[currentQuestion.id] === option}
									on:change={() => selectAnswer(currentQuestion.id, option)}
									class="option-input"
								/>
								<span class="option-letter">{option}</span>
								<span class="option-text">{currentQuestion[`option${option}`]}</span>
							</label>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<div class="navigation">
			<div class="nav-buttons">
				<button 
					type="button" 
					on:click={prevQuestion}
					disabled={currentQuestionIndex === 0}
					class="nav-btn secondary"
				>
					← Previous
				</button>
				
				{#if !isLastQuestion}
					<button 
						type="button" 
						on:click={nextQuestion}
						class="nav-btn primary"
					>
						Next →
					</button>
				{:else}
					<form 
						method="POST" 
						action="?/submit"
					>
						<!-- Hidden inputs for all answers -->
						{#each data.questions as question}
							{#if userAnswers[question.id]}
								<input type="hidden" name="question_{question.id}" value={userAnswers[question.id]} />
							{/if}
						{/each}
						
						<button 
							type="submit" 
							class="nav-btn submit"
						>
							Submit Quiz
						</button>
					</form>
				{/if}
			</div>
		</div>
</div>

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, sans-serif;
	}

	/* Quiz Taking Styles */
	.quiz-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.quiz-header h1 {
		color: #333;
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: #e9ecef;
		border-radius: 4px;
		margin-bottom: 0.5rem;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #007bff;
		transition: width 0.3s ease;
	}

	.progress-text {
		color: #666;
		font-size: 0.9rem;
	}

	.question-container {
		margin-bottom: 2rem;
	}

	.question-card {
		background: white;
		border: 1px solid #e1e5e9;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.question-text {
		color: #333;
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 2rem;
		line-height: 1.4;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.option-label {
		display: flex;
		align-items: center;
		padding: 1rem;
		border: 2px solid #e9ecef;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		background: white;
	}

	.option-label:hover {
		border-color: #007bff;
		background: #f8f9fa;
	}

	.option-label.selected {
		border-color: #007bff;
		background: #e3f2fd;
	}

	.option-input {
		display: none;
	}

	.option-letter {
		background: #007bff;
		color: white;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		margin-right: 1rem;
		flex-shrink: 0;
	}

	.option-text {
		font-size: 1rem;
		color: #333;
		line-height: 1.4;
	}

	.navigation {
		display: flex;
		justify-content: center;
	}

	.nav-buttons {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.nav-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		display: inline-block;
	}

	.nav-btn.primary {
		background: #007bff;
		color: white;
	}

	.nav-btn.primary:hover:not(:disabled) {
		background: #0056b3;
	}

	.nav-btn.secondary {
		background: #6c757d;
		color: white;
	}

	.nav-btn.secondary:hover:not(:disabled) {
		background: #545b62;
	}

	.nav-btn.submit {
		background: #28a745;
		color: white;
	}

	.nav-btn.submit:hover:not(:disabled) {
		background: #1e7e34;
	}

	.nav-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Results Styles */
	.results-container {
		text-align: center;
	}

	.results-header {
		margin-bottom: 2rem;
	}

	.results-header h1 {
		color: #333;
		margin-bottom: 1rem;
	}

	.score-display {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.score-circle {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: #28a745;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: bold;
		font-size: 1.5rem;
	}

	.score-percentage {
		font-size: 2rem;
		font-weight: 600;
		color: #333;
	}

	.results-summary {
		text-align: left;
		margin-bottom: 2rem;
	}

	.results-summary h2 {
		color: #333;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.result-item {
		background: white;
		border: 1px solid #e1e5e9;
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1rem;
		border-left: 4px solid #e1e5e9;
	}

	.result-item.correct {
		border-left-color: #28a745;
		background: #f8fff8;
	}

	.result-item.incorrect {
		border-left-color: #dc3545;
		background: #fff8f8;
	}

	.result-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.question-number {
		font-weight: 600;
		color: #666;
	}

	.result-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.result-badge.correct {
		background: #d4edda;
		color: #155724;
	}

	.result-badge.incorrect {
		background: #f8d7da;
		color: #721c24;
	}

	.result-question {
		color: #333;
		margin-bottom: 1rem;
		font-size: 1.1rem;
	}

	.result-answers {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.answer-row {
		display: flex;
		gap: 0.75rem;
	}

	.answer-label {
		font-weight: 500;
		color: #666;
		min-width: 120px;
	}

	.answer-value {
		color: #333;
	}

	.answer-value.correct {
		color: #28a745;
		font-weight: 500;
	}

	.answer-value.incorrect {
		color: #dc3545;
		font-weight: 500;
	}

	.results-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.action-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;
		display: inline-block;
	}

	.action-btn.primary {
		background: #007bff;
		color: white;
	}

	.action-btn.primary:hover {
		background: #0056b3;
	}

	.action-btn.secondary {
		background: #6c757d;
		color: white;
	}

	.action-btn.secondary:hover {
		background: #545b62;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.nav-buttons {
			flex-direction: column;
			width: 100%;
		}

		.nav-btn {
			width: 100%;
			text-align: center;
		}

		.score-display {
			flex-direction: column;
		}

		.results-actions {
			flex-direction: column;
		}

		.action-btn {
			width: 100%;
			text-align: center;
		}
	}
</style>