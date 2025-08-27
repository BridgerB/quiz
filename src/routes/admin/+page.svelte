<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import type { ActionResult } from '@sveltejs/kit';
  
  export let data: PageData;
  export let form: any;
  
  let selectedQuizzes: string[] = [];
  let showBulkActions = false;
  let editingQuiz: string | null = null;
  let editTopic = '';
  let isBackupLoading = false;
  let backupError: string | null = null;
  
  $: showBulkActions = selectedQuizzes.length > 0;
  
  function toggleQuizSelection(quizId: string) {
    if (selectedQuizzes.includes(quizId)) {
      selectedQuizzes = selectedQuizzes.filter(id => id !== quizId);
    } else {
      selectedQuizzes = [...selectedQuizzes, quizId];
    }
  }
  
  function toggleSelectAll() {
    if (selectedQuizzes.length === data.quizzes.length) {
      selectedQuizzes = [];
    } else {
      selectedQuizzes = data.quizzes.map(quiz => quiz.id);
    }
  }
  
  function startEditTopic(quizId: string, currentTopic: string) {
    editingQuiz = quizId;
    editTopic = currentTopic;
  }
  
  function cancelEdit() {
    editingQuiz = null;
    editTopic = '';
  }
  
  function formatDate(dateInput: string | Date) {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function formatScore(score: number, total: number) {
    const percentage = Math.round((score / total) * 100);
    return `${score}/${total} (${percentage}%)`;
  }
  
  function confirmDelete(quizTopic: string) {
    return confirm(`Are you sure you want to delete "${quizTopic}"? This action cannot be undone.`);
  }
  
  function confirmBulkDelete(count: number) {
    return confirm(`Are you sure you want to delete ${count} selected quiz${count > 1 ? 'es' : ''}?`);
  }
  
  function confirmClearAttempts() {
    return confirm('Are you sure you want to clear ALL quiz attempts? This action cannot be undone!');
  }
  
  function downloadBase64File(base64Data: string, filename: string, type: string) {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  function handleBackup() {
    isBackupLoading = true;
    backupError = null;

    return async ({ result }: { result: ActionResult }) => {
      isBackupLoading = false;

      if (result.type === 'failure') {
        backupError = 'Failed to create backup';
        return;
      }

      if (result.type === 'success' && result.data) {
        const data = result.data as {
          success: boolean;
          file: string;
          filename: string;
          type: string;
        };
        if (data.success) {
          downloadBase64File(data.file, data.filename, data.type);
        }
      }
    };
  }
</script>

<div class="admin-container">
  <div class="admin-header">
    <h1>🛠️ Admin Dashboard</h1>
    <p class="subtitle">Manage your quiz platform</p>
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

  <!-- System Overview -->
  <div class="stats-section">
    <h2>System Overview</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{data.stats.totalQuizzes}</div>
        <div class="stat-label">Total Quizzes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{data.stats.totalQuestions}</div>
        <div class="stat-label">Total Questions</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{data.stats.totalAttempts}</div>
        <div class="stat-label">Quiz Attempts</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">
          {data.stats.totalQuizzes > 0 ? Math.round(data.stats.totalQuestions / data.stats.totalQuizzes) : 0}
        </div>
        <div class="stat-label">Avg Questions/Quiz</div>
      </div>
    </div>
  </div>

  <!-- Quiz Management -->
  <div class="management-section">
    <div class="section-header">
      <h2>Quiz Management</h2>
      <div class="header-actions">
        {#if showBulkActions}
          <form method="POST" action="?/bulkDelete" use:enhance class="bulk-form">
            {#each selectedQuizzes as quizId}
              <input type="hidden" name="selectedQuizzes" value={quizId} />
            {/each}
            <button type="submit" class="btn danger" 
                    on:click={(e) => { if (!confirmBulkDelete(selectedQuizzes.length)) e.preventDefault(); }}>
              🗑️ Delete Selected ({selectedQuizzes.length})
            </button>
          </form>
        {/if}
      </div>
    </div>

    <div class="quiz-table-container">
      <table class="quiz-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                checked={selectedQuizzes.length === data.quizzes.length && data.quizzes.length > 0}
                on:change={toggleSelectAll}
              />
            </th>
            <th>Topic</th>
            <th>Questions</th>
            <th>Attempts</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.quizzes as quiz (quiz.id)}
            <tr>
              <td>
                <input 
                  type="checkbox" 
                  checked={selectedQuizzes.includes(quiz.id)}
                  on:change={() => toggleQuizSelection(quiz.id)}
                />
              </td>
              <td class="topic-cell">
                {#if editingQuiz === quiz.id}
                  <form method="POST" action="?/editQuizTopic" use:enhance class="edit-form">
                    <input type="hidden" name="quizId" value={quiz.id} />
                    <input 
                      type="text" 
                      name="topic" 
                      bind:value={editTopic}
                      class="edit-input"
                      maxlength="100"
                      required
                    />
                    <div class="edit-actions">
                      <button type="submit" class="btn small primary">💾 Save</button>
                      <button type="button" class="btn small secondary" on:click={cancelEdit}>❌ Cancel</button>
                    </div>
                  </form>
                {:else}
                  <span class="quiz-topic">{quiz.topic}</span>
                {/if}
              </td>
              <td>{quiz.questionCount}</td>
              <td>{quiz.attemptCount}</td>
              <td class="date-cell">{formatDate(quiz.createdAt)}</td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <a href="/quiz/{quiz.id}" class="btn small secondary">👁️ View</a>
                  <button 
                    type="button" 
                    class="btn small primary"
                    on:click={() => startEditTopic(quiz.id, quiz.topic)}
                  >
                    ✏️ Edit
                  </button>
                  <form method="POST" action="?/deleteQuiz" use:enhance class="inline-form">
                    <input type="hidden" name="quizId" value={quiz.id} />
                    <button 
                      type="submit" 
                      class="btn small danger"
                      on:click={(e) => { if (!confirmDelete(quiz.topic)) e.preventDefault(); }}
                    >
                      🗑️ Delete
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if data.quizzes.length === 0}
        <div class="empty-state">
          <p>No quizzes found. <a href="/create">Create your first quiz</a>!</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Recent Activity -->
  <div class="activity-section">
    <h2>Recent Quiz Attempts</h2>
    <div class="activity-list">
      {#each data.recentAttempts as attempt (attempt.id)}
        <a href="/quiz/results/{attempt.id}" class="activity-item activity-link">
          <div class="activity-content">
            <span class="activity-quiz">📝 {attempt.quizTopic}</span>
            <span class="activity-score">{formatScore(attempt.score, attempt.totalQuestions)}</span>
          </div>
          <div class="activity-time">{formatDate(attempt.completedAt)}</div>
        </a>
      {/each}
      
      {#if data.recentAttempts.length === 0}
        <div class="empty-activity">
          <p>No quiz attempts yet.</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Quiz Performance Stats -->
  <div class="performance-section">
    <h2>Quiz Performance</h2>
    <div class="performance-table">
      {#each data.quizStats as stat (stat.quizId)}
        <div class="performance-item">
          <div class="performance-info">
            <span class="performance-topic">{stat.quizTopic}</span>
            <span class="performance-attempts">{stat.attemptCount} attempts</span>
          </div>
          <div class="performance-score">
            <span class="score-value">{Math.round(stat.avgScore || 0)}%</span>
            <span class="score-label">avg score</span>
          </div>
        </div>
      {/each}
      
      {#if data.quizStats.length === 0}
        <div class="empty-performance">
          <p>No quiz performance data available.</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Database Backup -->
  <div class="backup-section">
    <h2>💾 Database Backup</h2>
    <div class="backup-content">
      <p class="backup-description">
        Download a complete backup of all quiz data including quizzes, questions, and attempts as CSV files in a ZIP archive.
      </p>
      
      <form method="POST" action="?/backup" use:enhance={handleBackup} class="backup-form">
        <button type="submit" disabled={isBackupLoading} class="btn primary backup-button">
          {#if isBackupLoading}
            📦 Creating Backup...
          {:else}
            💾 Download Database Backup
          {/if}
        </button>
      </form>

      {#if backupError}
        <div class="error-message">
          ❌ Error: {backupError}
        </div>
      {/if}
    </div>
  </div>

  <!-- System Maintenance -->
  <div class="maintenance-section">
    <h2>⚠️ System Maintenance</h2>
    <div class="maintenance-actions">
      <form method="POST" action="?/clearAllAttempts" use:enhance>
        <button 
          type="submit" 
          class="btn danger"
          on:click={(e) => { if (!confirmClearAttempts()) e.preventDefault(); }}
        >
          🧹 Clear All Quiz Attempts
        </button>
      </form>
      <p class="maintenance-note">
        ⚠️ Use with caution! This will permanently delete all quiz attempt data.
      </p>
    </div>
  </div>
</div>

<style>
  .admin-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  .admin-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .admin-header h1 {
    color: #333;
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #666;
    font-size: 1.1rem;
    margin: 0;
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

  .stats-section, .management-section, .activity-section, .performance-section, .backup-section, .maintenance-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .stats-section h2, .management-section h2, .activity-section h2, .performance-section h2, .backup-section h2, .maintenance-section h2 {
    color: #333;
    margin-top: 0;
    margin-bottom: 1.5rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid #e1e5e9;
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #007bff;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    color: #666;
    font-size: 1rem;
    font-weight: 500;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .quiz-table-container {
    overflow-x: auto;
  }

  .quiz-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
  }

  .quiz-table th, .quiz-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e1e5e9;
  }

  .quiz-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #333;
  }

  .topic-cell {
    max-width: 300px;
  }

  .quiz-topic {
    font-weight: 500;
    color: #333;
  }

  .date-cell {
    white-space: nowrap;
    color: #666;
    font-size: 0.9rem;
  }

  .actions-cell {
    white-space: nowrap;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    transition: all 0.2s;
  }

  .btn.small {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .btn.primary {
    background: #007bff;
    color: white;
  }

  .btn.primary:hover {
    background: #0056b3;
  }

  .btn.secondary {
    background: #6c757d;
    color: white;
  }

  .btn.secondary:hover {
    background: #545b62;
  }

  .btn.danger {
    background: #dc3545;
    color: white;
  }

  .btn.danger:hover {
    background: #c82333;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .edit-input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
  }

  .inline-form {
    display: inline;
  }

  .bulk-form {
    display: inline;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .activity-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #007bff;
  }

  .activity-link {
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
  }

  .activity-link:hover {
    background: #e9ecef;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .activity-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .activity-quiz {
    font-weight: 500;
    color: #333;
  }

  .activity-score {
    color: #666;
    font-size: 0.9rem;
  }

  .activity-time {
    color: #666;
    font-size: 0.8rem;
    white-space: nowrap;
  }

  .performance-table {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .performance-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .performance-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .performance-topic {
    font-weight: 500;
    color: #333;
  }

  .performance-attempts {
    color: #666;
    font-size: 0.9rem;
  }

  .performance-score {
    text-align: right;
  }

  .score-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: #007bff;
  }

  .score-label {
    display: block;
    color: #666;
    font-size: 0.8rem;
  }

  .maintenance-actions {
    text-align: center;
  }

  .maintenance-note {
    margin-top: 1rem;
    color: #666;
    font-size: 0.9rem;
  }

  /* Backup Section */
  .backup-content {
    text-align: center;
  }

  .backup-description {
    color: #666;
    font-size: 1rem;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .backup-form {
    margin-bottom: 1rem;
  }

  .backup-button {
    min-width: 200px;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
  }

  .error-message {
    background-color: #f8d7da;
    color: #721c24;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-top: 0.75rem;
    font-size: 0.875rem;
    border: 1px solid #f5c6cb;
  }

  .empty-state, .empty-activity, .empty-performance {
    text-align: center;
    color: #666;
    padding: 2rem;
  }

  .empty-state a {
    color: #007bff;
    text-decoration: none;
  }

  .empty-state a:hover {
    text-decoration: underline;
  }

  @media (max-width: 768px) {
    .admin-container {
      padding: 1rem;
    }

    .admin-header h1 {
      font-size: 2rem;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .section-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .quiz-table {
      font-size: 0.8rem;
    }

    .quiz-table th, .quiz-table td {
      padding: 0.5rem;
    }

    .action-buttons {
      flex-direction: column;
    }

    .activity-item {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .performance-item {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .performance-score {
      text-align: left;
    }
  }
</style>