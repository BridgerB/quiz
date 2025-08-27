<script>
	import { enhance } from '$app/forms';
	
	export let form;
	
	let topic = form?.topic || '';
	let isSubmitting = false;
</script>

<div class="container">
	<div class="create-header">
		<h1>Create New Quiz</h1>
		<p class="subtitle">Generate an AI-powered quiz on any topic using Claude</p>
	</div>

	<div class="create-form-section">
		<form 
			method="POST" 
			action="?/create"
			class="create-form"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					isSubmitting = false;
					update();
				};
			}}
		>
			<div class="form-group">
				<label for="topic" class="form-label">
					Quiz Topic
					<span class="required">*</span>
				</label>
				<input
					type="text"
					id="topic"
					name="topic"
					bind:value={topic}
					placeholder="e.g., Photosynthesis, Neural Networks, Ancient Rome"
					required
					maxlength="100"
					class="form-input"
					class:error={form?.error}
					disabled={isSubmitting}
				/>
				<div class="form-help">
					Enter any topic you'd like to create a quiz about. The AI will generate 5 multiple-choice questions.
				</div>
			</div>

			{#if form?.error}
				<div class="error-message">
					<div class="error-icon">⚠️</div>
					<div class="error-text">{form.error}</div>
				</div>
			{/if}

			<div class="form-actions">
				<button 
					type="submit" 
					disabled={!topic.trim() || isSubmitting}
					class="create-button"
				>
					{#if isSubmitting}
						<span class="loading-spinner"></span>
						Generating Quiz...
					{:else}
						Create Quiz
					{/if}
				</button>
				
				<a href="/" class="cancel-button">Cancel</a>
			</div>
		</form>
	</div>

	<div class="info-section">
		<h3>How it works</h3>
		<div class="info-steps">
			<div class="step">
				<div class="step-number">1</div>
				<div class="step-content">
					<h4>Enter Topic</h4>
					<p>Provide any subject you want to create a quiz about</p>
				</div>
			</div>
			<div class="step">
				<div class="step-number">2</div>
				<div class="step-content">
					<h4>AI Generation</h4>
					<p>Claude AI generates 5 educational multiple-choice questions</p>
				</div>
			</div>
			<div class="step">
				<div class="step-number">3</div>
				<div class="step-content">
					<h4>Take Quiz</h4>
					<p>Answer the questions and see your score with explanations</p>
				</div>
			</div>
		</div>
		
		<div class="tech-info">
			<h4>Technical Details</h4>
			<ul>
				<li><strong>AI Model:</strong> Claude Sonnet 4 by Anthropic</li>
				<li><strong>Format:</strong> 5 questions, 4 options each (A-D)</li>
				<li><strong>Storage:</strong> Questions saved to database for review</li>
				<li><strong>Accuracy:</strong> AI generates factual, educational content</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, sans-serif;
	}

	.create-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.create-header h1 {
		color: #333;
		font-size: 2.5rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		color: #666;
		font-size: 1.1rem;
		margin: 0;
	}

	.create-form-section {
		background: white;
		border: 1px solid #e1e5e9;
		border-radius: 12px;
		padding: 2.5rem;
		margin-bottom: 3rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.create-form {
		max-width: 500px;
		margin: 0 auto;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-label {
		display: block;
		color: #333;
		font-weight: 600;
		margin-bottom: 0.5rem;
		font-size: 1rem;
	}

	.required {
		color: #dc3545;
	}

	.form-input {
		width: 100%;
		padding: 0.875rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
		box-sizing: border-box;
	}

	.form-input:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
	}

	.form-input.error {
		border-color: #dc3545;
	}

	.form-input:disabled {
		background-color: #f8f9fa;
		cursor: not-allowed;
		opacity: 0.7;
	}

	.form-help {
		color: #666;
		font-size: 0.9rem;
		margin-top: 0.5rem;
		line-height: 1.4;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: #f8d7da;
		color: #721c24;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #f5c6cb;
		margin-bottom: 1.5rem;
	}

	.error-icon {
		font-size: 1.2rem;
		flex-shrink: 0;
	}

	.error-text {
		font-weight: 500;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		align-items: center;
	}

	.create-button {
		background: #007bff;
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 140px;
		justify-content: center;
	}

	.create-button:hover:not(:disabled) {
		background: #0056b3;
		transform: translateY(-1px);
	}

	.create-button:disabled {
		background: #6c757d;
		cursor: not-allowed;
		transform: none;
	}

	.cancel-button {
		color: #666;
		text-decoration: none;
		padding: 1rem;
		font-weight: 500;
		transition: color 0.2s;
	}

	.cancel-button:hover {
		color: #333;
		text-decoration: underline;
	}

	.info-section {
		background: #f8f9fa;
		border-radius: 12px;
		padding: 2rem;
	}

	.info-section h3 {
		color: #333;
		margin-top: 0;
		margin-bottom: 1.5rem;
		font-size: 1.25rem;
	}

	.info-steps {
		display: grid;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.step {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.step-number {
		background: #007bff;
		color: white;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		flex-shrink: 0;
	}

	.step-content h4 {
		color: #333;
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.step-content p {
		color: #666;
		margin: 0;
		line-height: 1.4;
	}

	.tech-info {
		border-top: 1px solid #dee2e6;
		padding-top: 1.5rem;
	}

	.tech-info h4 {
		color: #333;
		margin: 0 0 1rem 0;
		font-size: 1rem;
	}

	.tech-info ul {
		margin: 0;
		padding-left: 1.5rem;
		color: #666;
	}

	.tech-info li {
		margin-bottom: 0.5rem;
		line-height: 1.4;
	}

	.loading-spinner {
		display: inline-block;
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: white;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.create-header h1 {
			font-size: 2rem;
		}

		.create-form-section {
			padding: 1.5rem;
		}

		.form-actions {
			flex-direction: column;
			gap: 0.75rem;
		}

		.create-button {
			width: 100%;
		}

		.info-steps {
			gap: 1rem;
		}
	}
</style>