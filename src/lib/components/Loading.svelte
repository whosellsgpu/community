<!--
	Loading placeholder: a soft, blurred outline of the page that gently pulses
	while data arrives, instead of a spinner. Shaped like a forum page (title,
	topic cards, discussion rows) so the layout doesn't jump when content
	lands. Still for visitors who prefer reduced motion.
-->
<div class="skeleton" role="status" aria-live="polite" aria-label="Loading">
	<div class="block title"></div>
	<div class="block line"></div>
	<div class="cards">
		<div class="block card"></div>
		<div class="block card"></div>
		<div class="block card"></div>
	</div>
	{#each [0, 1, 2, 3] as row (row)}
		<div class="row">
			<div class="block avatar"></div>
			<div class="lines">
				<div class="block line wide"></div>
				<div class="block line short"></div>
			</div>
		</div>
	{/each}
	<span class="sr-only">Loading…</span>
</div>

<style>
	.skeleton {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding-block: 8px 24px;
		filter: blur(6px);
		animation: pulse 1.6s ease-in-out infinite;
		pointer-events: none;
		user-select: none;
	}
	.block {
		position: relative;
		overflow: hidden;
		border-radius: 10px;
		background: var(--color-fd-muted);
	}
	/* A slow light sweep across each block. */
	.block::after {
		content: '';
		position: absolute;
		inset: 0;
		transform: translateX(-100%);
		background: linear-gradient(
			90deg,
			transparent,
			color-mix(in srgb, var(--color-fd-foreground) 8%, transparent),
			transparent
		);
		animation: sweep 1.6s ease-in-out infinite;
	}
	.title {
		width: min(320px, 60%);
		height: 30px;
	}
	.line {
		width: min(560px, 85%);
		height: 14px;
	}
	.line.wide {
		width: 70%;
	}
	.line.short {
		width: 35%;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
		margin-block: 12px;
	}
	.card {
		height: 84px;
		border-radius: 14px;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px;
		border-radius: 14px;
		border: 1px solid var(--color-fd-border);
	}
	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 999px;
		flex-shrink: 0;
	}
	.lines {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 8px;
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 0.55;
		}
		50% {
			opacity: 1;
		}
	}
	@keyframes sweep {
		to {
			transform: translateX(100%);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.skeleton,
		.block::after {
			animation: none;
		}
	}
</style>
