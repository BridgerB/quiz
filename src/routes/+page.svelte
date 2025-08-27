<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	
	interface Question {
		id: string;
		quizId: string;
		questionText: string;
		optionA: string;
		optionB: string;
		optionC: string;
		optionD: string;
		correctAnswer: string;
	}
	
	interface Quiz {
		id: string;
		topic: string;
		createdAt: string;
		questions?: Question[];
	}
	
	interface PageData {
		quizzes: Quiz[];
		searchQuery: string;
	}
	
	export let data: PageData;
	export let form: any;

	let searchValue = data.searchQuery || '';
	let filteredQuizzes = data.quizzes || [];
	
	// Update URL without navigation when search changes
	function updateURL(searchTerm: string) {
		if (!browser) return;
		
		const url = new URL($page.url);
		if (searchTerm && searchTerm.trim()) {
			url.searchParams.set('search', searchTerm.trim());
		} else {
			url.searchParams.delete('search');
		}
		window.history.replaceState({}, '', url.toString());
	}
	
	// Filter quizzes on client side - search all content
	function filterQuizzes(searchTerm: string, allQuizzes: Quiz[]): Quiz[] {
		if (!searchTerm || !searchTerm.trim()) {
			return allQuizzes;
		}
		
		const term = searchTerm.toLowerCase();
		return allQuizzes.filter((quiz: Quiz) => {
			// Search in quiz topic
			if (quiz.topic.toLowerCase().includes(term)) {
				return true;
			}
			
			// Search in questions and answers
			if (quiz.questions && quiz.questions.length > 0) {
				return quiz.questions.some((question: Question) => 
					question.questionText.toLowerCase().includes(term) ||
					question.optionA.toLowerCase().includes(term) ||
					question.optionB.toLowerCase().includes(term) ||
					question.optionC.toLowerCase().includes(term) ||
					question.optionD.toLowerCase().includes(term)
				);
			}
			
			return false;
		});
	}
	
	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchValue = target.value;
		updateURL(searchValue);
		filteredQuizzes = filterQuizzes(searchValue, data.quizzes);
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
	
	function confirmDelete(quizTopic: string) {
		return confirm(`Are you sure you want to delete the quiz "${quizTopic}"? This action cannot be undone.`);
	}
	
	// Initialize filtered quizzes when data loads
	$: filteredQuizzes = filterQuizzes(searchValue, data.quizzes);
</script>

<div class="container">
	<div class="page-header">
		<div class="page-header-spacer"></div>
		<a href="/create" class="create-btn">Create +</a>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="alert success">
			✅ {form.message}
		</div>
	{/if}
	
	{#if form?.error}
		<div class="alert error">
			❌ {form.error}
		</div>
	{/if}

	<div class="search-section">
		<div class="search-input-group">
			<input
				type="text"
				name="search"
				placeholder="Search quizzes by topic, questions, or answers..."
				bind:value={searchValue}
				class="search-input"
				on:input={handleSearchInput}
				autocomplete="off"
			/>
		</div>
		
		{#if searchValue}
			<div class="search-results-info">
				<p>Showing results for: <strong>{searchValue}</strong></p>
				<button class="clear-search" on:click={() => searchValue = ''}>Clear search</button>
			</div>
		{/if}
	</div>

	<div class="quizzes-section">
		{#if filteredQuizzes.length > 0}
			<div class="quiz-grid">
				{#each filteredQuizzes as quiz}
					<div class="quiz-card">
						<div class="quiz-card-header">
							<h3 class="quiz-topic">{quiz.topic}</h3>
							<span class="quiz-date">{formatDate(quiz.createdAt)}</span>
						</div>
						
						<div class="quiz-card-body">
							<p class="quiz-description">
								Test your knowledge about {quiz.topic.toLowerCase()}
							</p>
						</div>
						
						<div class="quiz-card-footer">
							<a href="/quiz/{quiz.id}" class="take-quiz-btn">Take Quiz</a>
							<form method="POST" action="?/deleteQuiz" use:enhance class="delete-form">
								<input type="hidden" name="quizId" value={quiz.id} />
								<button 
									type="submit" 
									class="delete-btn" 
									title="Delete quiz"
									on:click={(e) => { if (!confirmDelete(quiz.topic)) e.preventDefault(); }}
								>
									🗑️
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				{#if searchValue}
					<div class="empty-icon">🔍</div>
					<h3>No quizzes found</h3>
					<p>No quizzes match your search for "{searchValue}"</p>
					<button class="clear-search-btn" on:click={() => searchValue = ''}>Clear search</button>
				{:else}
					<div class="empty-icon">📝</div>
					<h3>No quizzes yet</h3>
					<p>Get started by creating your first quiz!</p>
					<a href="/create" class="create-first-quiz-btn">Create Your First Quiz</a>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, sans-serif;
	}

	.page-header {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.page-header-spacer {
		flex: 1;
	}

	.create-btn {
		background: #007bff;
		color: white;
		text-decoration: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.create-btn:hover {
		background: #0056b3;
	}

	.alert {
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		font-weight: 500;
	}

	.alert.success {
		background: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.alert.error {
		background: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.search-section {
		margin-bottom: 2rem;
	}

	.search-input-group {
		max-width: 600px;
		margin-bottom: 1rem;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.search-input:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
	}

	.search-results-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: #666;
	}

	.clear-search {
		color: #007bff;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		text-decoration: underline;
	}

	.clear-search:hover {
		color: #0056b3;
	}

	.quiz-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.quiz-card {
		background: white;
		border: 1px solid #e1e5e9;
		border-radius: 12px;
		padding: 1.5rem;
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.quiz-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		border-color: #007bff;
	}

	.quiz-card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.quiz-topic {
		color: #333;
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		line-height: 1.3;
	}

	.quiz-date {
		color: #666;
		font-size: 0.85rem;
		white-space: nowrap;
	}

	.quiz-card-body {
		margin-bottom: 1.5rem;
	}

	.quiz-description {
		color: #666;
		line-height: 1.5;
		margin: 0;
	}

	.quiz-card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.take-quiz-btn {
		background: #28a745;
		color: white;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.take-quiz-btn:hover {
		background: #1e7e34;
	}

	.delete-form {
		display: inline;
	}

	.delete-btn {
		background: none;
		border: none;
		color: #dc3545;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 1.1rem;
		line-height: 1;
		transition: all 0.2s ease;
	}

	.delete-btn:hover {
		background: #f8f9fa;
		transform: scale(1.1);
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #666;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-state h3 {
		color: #333;
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		margin-bottom: 2rem;
		line-height: 1.5;
	}

	.clear-search-btn,
	.create-first-quiz-btn {
		background: #007bff;
		color: white;
		text-decoration: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 500;
		display: inline-block;
		transition: background-color 0.2s;
		border: none;
		cursor: pointer;
	}

	.clear-search-btn:hover,
	.create-first-quiz-btn:hover {
		background: #0056b3;
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}
		
		.quiz-grid {
			grid-template-columns: 1fr;
		}
		
		.search-input-group {
			max-width: none;
		}
	}
</style>