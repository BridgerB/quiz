<script>
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	
	export let data;

	let searchValue = data.searchQuery || '';
	let filteredQuizzes = data.quizzes || [];
	
	// Update URL without navigation when search changes
	function updateURL(searchTerm) {
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
	function filterQuizzes(searchTerm, allQuizzes) {
		if (!searchTerm || !searchTerm.trim()) {
			return allQuizzes;
		}
		
		const term = searchTerm.toLowerCase();
		return allQuizzes.filter(quiz => {
			// Search in quiz topic
			if (quiz.topic.toLowerCase().includes(term)) {
				return true;
			}
			
			// Search in questions and answers
			if (quiz.questions && quiz.questions.length > 0) {
				return quiz.questions.some(question => 
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
	
	function handleSearchInput(event) {
		searchValue = event.target.value;
		updateURL(searchValue);
		filteredQuizzes = filterQuizzes(searchValue, data.quizzes);
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
	
	// Initialize filtered quizzes when data loads
	$: filteredQuizzes = filterQuizzes(searchValue, data.quizzes);
</script>

<div class="container">
	<header class="header">
		<a href="/" class="home-link">
			<h1>Quiz Builder</h1>
		</a>
		<a href="/create" class="create-btn">Create +</a>
	</header>

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
							<button class="quiz-menu-btn" title="More options">⋮</button>
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

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.home-link {
		text-decoration: none;
		color: inherit;
	}
	
	.home-link:hover {
		opacity: 0.8;
	}

	.header h1 {
		color: #333;
		font-size: 2rem;
		font-weight: 600;
		margin: 0;
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

	.quiz-menu-btn {
		background: none;
		border: none;
		color: #666;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 1.2rem;
		line-height: 1;
	}

	.quiz-menu-btn:hover {
		background: #f8f9fa;
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
		
		.header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}
		
		.create-btn {
			text-align: center;
		}
		
		.quiz-grid {
			grid-template-columns: 1fr;
		}
		
		.search-input-group {
			max-width: none;
		}
	}
</style>