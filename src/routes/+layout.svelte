<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();
	
	// Helper function to check if current route matches
	const currentPath = $derived($page.url.pathname);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
	<header class="app-header">
		<div class="header-container">
			<a href="/" class="logo-link">
				<h1>Quiz Builder</h1>
			</a>
			
			<nav class="main-nav">
				<a href="/" class="nav-link" class:active={currentPath === '/'}>Home</a>
				<a href="/reports" class="nav-link" class:active={currentPath === '/reports'}>Reports</a>
				<a href="/admin" class="nav-link" class:active={currentPath.startsWith('/admin')}>Admin</a>
				<a href="/dev" class="nav-link" class:active={currentPath.startsWith('/dev')}>Dev</a>
			</nav>
		</div>
	</header>

	<main class="main-content">
		{@render children?.()}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-header {
		background: white;
		border-bottom: 1px solid #e1e5e9;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo-link {
		text-decoration: none;
		color: inherit;
		transition: opacity 0.2s;
	}
	
	.logo-link:hover {
		opacity: 0.8;
	}

	.logo-link h1 {
		color: #333;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}

	.main-nav {
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.nav-link {
		color: #666;
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.nav-link:hover {
		color: #007bff;
		background: rgba(0, 123, 255, 0.1);
	}

	.nav-link.active {
		color: #007bff;
		background: rgba(0, 123, 255, 0.1);
		font-weight: 600;
	}

	.main-content {
		flex: 1;
	}

	@media (max-width: 768px) {
		.header-container {
			padding: 1rem;
			flex-direction: column;
			gap: 1rem;
		}

		.logo-link h1 {
			font-size: 1.25rem;
		}

		.main-nav {
			gap: 1rem;
			flex-wrap: wrap;
			justify-content: center;
		}

		.nav-link {
			padding: 0.4rem 0.8rem;
			font-size: 0.9rem;
		}
	}
</style>
