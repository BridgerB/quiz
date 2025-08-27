<script>
	export let data;
	
	$: scorePercentage = Math.round((data.attempt.score / data.attempt.totalQuestions) * 100);
	
	function getCorrectOptionText(question) {
		switch (question.correctAnswer) {
			case 'A': return question.optionA;
			case 'B': return question.optionB;
			case 'C': return question.optionC;
			case 'D': return question.optionD;
			default: return 'Unknown';
		}
	}
</script>

<div class="container">
	<div class="results-header">
		<h1>Quiz Results</h1>
		<h2>Quiz: {data.quiz.topic}</h2>
	</div>

	<div class="score-display">
		<div class="score-circle" class:excellent={scorePercentage >= 80} class:good={scorePercentage >= 60 && scorePercentage < 80} class:needs-improvement={scorePercentage < 60}>
			<span class="score-text">{data.attempt.score}/{data.attempt.totalQuestions}</span>
		</div>
		<div class="score-details">
			<div class="score-percentage">{scorePercentage}%</div>
			<div class="score-label">
				{#if scorePercentage >= 80}
					Excellent!
				{:else if scorePercentage >= 60}
					Good Job!
				{:else}
					Keep Learning!
				{/if}
			</div>
		</div>
	</div>

	<div class="results-summary">
		<div class="summary-card">
			<h3>Quiz Summary</h3>
			<div class="summary-stats">
				<div class="stat-item">
					<span class="stat-label">Correct Answers:</span>
					<span class="stat-value correct">{data.attempt.score}</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">Incorrect Answers:</span>
					<span class="stat-value incorrect">{data.attempt.totalQuestions - data.attempt.score}</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">Total Questions:</span>
					<span class="stat-value">{data.attempt.totalQuestions}</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">Completed:</span>
					<span class="stat-value">{new Date(data.attempt.completedAt).toLocaleString()}</span>
				</div>
			</div>
		</div>

		<div class="questions-preview">
			<h3>Questions from this Quiz</h3>
			<div class="questions-list">
				{#each data.questions as question, index}
					<div class="question-preview">
						<div class="question-number">{index + 1}</div>
						<div class="question-content">
							<div class="question-text">{question.questionText}</div>
							<div class="answer-options">
								<div class="option" class:correct={question.correctAnswer === 'A'}>
									<span class="option-letter">A:</span> {question.optionA}
								</div>
								<div class="option" class:correct={question.correctAnswer === 'B'}>
									<span class="option-letter">B:</span> {question.optionB}
								</div>
								<div class="option" class:correct={question.correctAnswer === 'C'}>
									<span class="option-letter">C:</span> {question.optionC}
								</div>
								<div class="option" class:correct={question.correctAnswer === 'D'}>
									<span class="option-letter">D:</span> {question.optionD}
								</div>
							</div>
							<div class="correct-answer">
								<span class="correct-label">Correct Answer:</span> 
								<span class="correct-text">{question.correctAnswer}: {getCorrectOptionText(question)}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="actions">
		<a href="/quiz/{data.quiz.id}" class="action-btn secondary">Retake Quiz</a>
		<a href="/" class="action-btn primary">Back to Home</a>
		<a href="/create" class="action-btn primary">Create Another Quiz</a>
	</div>
</div>

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, sans-serif;
	}

	.results-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.results-header h1 {
		color: #333;
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.results-header h2 {
		color: #666;
		font-size: 1.25rem;
		font-weight: 400;
		margin: 0;
	}

	.score-display {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 3rem;
		padding: 2rem;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.score-circle {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: bold;
		font-size: 1.5rem;
		border: 4px solid;
	}

	.score-circle.excellent {
		background: #28a745;
		border-color: #1e7e34;
	}

	.score-circle.good {
		background: #ffc107;
		border-color: #e0a800;
		color: #333;
	}

	.score-circle.needs-improvement {
		background: #dc3545;
		border-color: #c82333;
	}

	.score-details {
		text-align: center;
	}

	.score-percentage {
		font-size: 3rem;
		font-weight: 600;
		color: #333;
		line-height: 1;
	}

	.score-label {
		font-size: 1.25rem;
		color: #666;
		margin-top: 0.5rem;
	}

	.results-summary {
		display: grid;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.summary-card, .questions-preview {
		background: white;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.summary-card h3, .questions-preview h3 {
		color: #333;
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-size: 1.25rem;
	}

	.summary-stats {
		display: grid;
		gap: 1rem;
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px solid #f1f3f4;
	}

	.stat-item:last-child {
		border-bottom: none;
	}

	.stat-label {
		color: #666;
		font-weight: 500;
	}

	.stat-value {
		color: #333;
		font-weight: 600;
	}

	.stat-value.correct {
		color: #28a745;
	}

	.stat-value.incorrect {
		color: #dc3545;
	}

	.questions-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.question-preview {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
		border-left: 4px solid #007bff;
	}

	.question-number {
		background: #007bff;
		color: white;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.9rem;
		flex-shrink: 0;
	}

	.question-content {
		flex: 1;
	}

	.question-text {
		color: #333;
		line-height: 1.4;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.answer-options {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.option {
		padding: 0.5rem;
		background: #fff;
		border: 1px solid #e1e5e9;
		border-radius: 6px;
		font-size: 0.9rem;
	}

	.option.correct {
		background: #d4edda;
		border-color: #28a745;
		color: #155724;
	}

	.option-letter {
		font-weight: 600;
		margin-right: 0.5rem;
	}

	.correct-answer {
		padding: 0.75rem;
		background: #f8f9fa;
		border-radius: 6px;
		border-left: 3px solid #28a745;
	}

	.correct-label {
		font-weight: 600;
		color: #28a745;
	}

	.correct-text {
		font-weight: 500;
		color: #333;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
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
		text-align: center;
		min-width: 140px;
	}

	.action-btn.primary {
		background: #007bff;
		color: white;
	}

	.action-btn.primary:hover {
		background: #0056b3;
		transform: translateY(-1px);
	}

	.action-btn.secondary {
		background: #6c757d;
		color: white;
	}

	.action-btn.secondary:hover {
		background: #545b62;
		transform: translateY(-1px);
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.score-display {
			flex-direction: column;
			gap: 1rem;
		}

		.score-circle {
			width: 100px;
			height: 100px;
			font-size: 1.25rem;
		}

		.score-percentage {
			font-size: 2.5rem;
		}

		.results-summary {
			grid-template-columns: 1fr;
		}

		.actions {
			flex-direction: column;
			align-items: stretch;
		}

		.action-btn {
			width: 100%;
		}
	}

	@media (min-width: 768px) {
		.results-summary {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>