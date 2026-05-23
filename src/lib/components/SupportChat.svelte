<script lang="ts">
	import { MessageSquare, X, Send, Bot, User, Loader2, ChevronDown } from 'lucide-svelte';
	import { tick } from 'svelte';

	let { supabase = null, session = null } = $props<{
		supabase?: any;
		session?: any;
	}>();

	type Message = { role: 'user' | 'assistant'; content: string };

	let open = $state(false);
	let messages = $state<Message[]>([]);
	let input = $state('');
	let loading = $state(false);
	let error = $state('');
	let messagesEl = $state<HTMLElement | null>(null);

	// Greeting shown before any messages
	const GREETING = "Hi! I'm the Abroaducate assistant. I can help you find programs, understand scholarships, or navigate the platform. What would you like to know?";

	const SUGGESTIONS = [
		'How do credits work?',
		'What countries do you cover?',
		'How do I find a scholarship?',
		'What documents do I need?'
	];

	async function scrollToBottom() {
		await tick();
		if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	async function send() {
		const text = input.trim();
		if (!text || loading) return;

		if (!session?.user) {
			error = 'Please sign in to use the support chat.';
			return;
		}

		input = '';
		error = '';
		messages = [...messages, { role: 'user', content: text }];
		loading = true;
		await scrollToBottom();

		try {
			const res = await fetch('/api/chat/support', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages })
			});

			const data = await res.json();

			if (!res.ok || data.error) {
				error = data.error || 'Something went wrong. Please try again.';
			} else {
				messages = [...messages, { role: 'assistant', content: data.reply }];
			}
		} catch {
			error = 'Connection error. Please try again.';
		} finally {
			loading = false;
			await scrollToBottom();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	function useSuggestion(s: string) {
		input = s;
		send();
	}

	function toggle() {
		open = !open;
		if (open) scrollToBottom();
	}
</script>

<!-- Floating button -->
<div class="support-chat-root">
	{#if open}
		<!-- Chat panel -->
		<div class="chat-panel" role="dialog" aria-label="Support chat">
			<!-- Header -->
			<div class="chat-header">
				<div class="chat-header-left">
					<div class="chat-avatar">
						<Bot size={16} />
					</div>
					<div>
						<div class="chat-title">Abroaducate Support</div>
						<div class="chat-subtitle">Typically replies instantly</div>
					</div>
				</div>
				<button onclick={toggle} class="chat-close" aria-label="Close chat">
					<X size={18} />
				</button>
			</div>

			<!-- Messages -->
			<div class="chat-messages" bind:this={messagesEl}>
				<!-- Greeting -->
				<div class="msg msg-assistant">
					<div class="msg-avatar"><Bot size={14} /></div>
					<div class="msg-bubble">{GREETING}</div>
				</div>

				{#each messages as msg}
					<div class="msg {msg.role === 'user' ? 'msg-user' : 'msg-assistant'}">
						{#if msg.role === 'assistant'}
							<div class="msg-avatar"><Bot size={14} /></div>
						{/if}
						<div class="msg-bubble">{msg.content}</div>
						{#if msg.role === 'user'}
							<div class="msg-avatar msg-avatar-user"><User size={14} /></div>
						{/if}
					</div>
				{/each}

				{#if loading}
					<div class="msg msg-assistant">
						<div class="msg-avatar"><Bot size={14} /></div>
						<div class="msg-bubble msg-typing">
							<span></span><span></span><span></span>
						</div>
					</div>
				{/if}

				{#if error}
					<div class="chat-error">{error}</div>
				{/if}

				<!-- Suggestions (only when no messages yet) -->
				{#if messages.length === 0 && !loading}
					<div class="suggestions">
						{#each SUGGESTIONS as s}
							<button class="suggestion-btn" onclick={() => useSuggestion(s)}>{s}</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Input -->
			<div class="chat-input-row">
				{#if !session?.user}
					<div class="chat-signin-prompt">
						<a href="/auth" class="chat-signin-link">Sign in to chat</a>
					</div>
				{:else}
					<div
						role="textbox"
						aria-label="Message input"
						aria-multiline="false"
						tabindex="0"
						contenteditable="true"
						bind:innerText={input}
						onkeydown={handleKeydown}
						data-placeholder="Ask anything about programs, scholarships…"
						class="chat-input"
						aria-disabled={loading}
					></div>
					<button onclick={send} disabled={loading || !input.trim()} class="chat-send" aria-label="Send">
						{#if loading}
							<Loader2 size={16} class="animate-spin" />
						{:else}
							<Send size={16} />
						{/if}
					</button>
				{/if}
			</div>

			<div class="chat-footer">
				AI assistant — always verify deadlines on official pages.
			</div>
		</div>
	{/if}

	<!-- Toggle button -->
	<button onclick={toggle} class="chat-toggle" aria-label="Open support chat">
		{#if open}
			<ChevronDown size={22} />
		{:else}
			<MessageSquare size={22} />
		{/if}
	</button>
</div>

<style>
	.support-chat-root {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.75rem;
	}

	/* Toggle button */
	.chat-toggle {
		width: 3.25rem;
		height: 3.25rem;
		border-radius: 50%;
		background: #0f172a;
		color: white;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 16px rgba(0,0,0,0.2);
		transition: background 0.15s, transform 0.15s;
		flex-shrink: 0;
	}
	.chat-toggle:hover { background: #1e293b; transform: scale(1.05); }

	/* Panel */
	.chat-panel {
		width: 360px;
		max-width: calc(100vw - 2rem);
		background: white;
		border-radius: 16px;
		box-shadow: 0 8px 40px rgba(0,0,0,0.15);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		max-height: 520px;
	}

	/* Header */
	.chat-header {
		background: #0f172a;
		padding: 14px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
	}
	.chat-header-left { display: flex; align-items: center; gap: 10px; }
	.chat-avatar {
		width: 32px; height: 32px;
		border-radius: 50%;
		background: rgba(255,255,255,0.15);
		display: flex; align-items: center; justify-content: center;
		color: white; flex-shrink: 0;
	}
	.chat-title { color: white; font-size: 14px; font-weight: 700; }
	.chat-subtitle { color: #94a3b8; font-size: 11px; margin-top: 1px; }
	.chat-close {
		color: #94a3b8; background: none; border: none; cursor: pointer;
		padding: 4px; border-radius: 6px; display: flex; align-items: center;
		transition: color 0.15s;
	}
	.chat-close:hover { color: white; }

	/* Messages */
	.chat-messages {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-height: 0;
	}

	.msg {
		display: flex;
		align-items: flex-end;
		gap: 8px;
	}
	.msg-user { flex-direction: row-reverse; }

	.msg-avatar {
		width: 26px; height: 26px;
		border-radius: 50%;
		background: #f1f5f9;
		color: #64748b;
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0;
	}
	.msg-avatar-user { background: #0f172a; color: white; }

	.msg-bubble {
		max-width: 78%;
		padding: 9px 13px;
		border-radius: 14px;
		font-size: 13px;
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
	}
	.msg-assistant .msg-bubble {
		background: #f8fafc;
		color: #0f172a;
		border-bottom-left-radius: 4px;
	}
	.msg-user .msg-bubble {
		background: #0f172a;
		color: white;
		border-bottom-right-radius: 4px;
	}

	/* Typing indicator */
	.msg-typing {
		display: flex; align-items: center; gap: 4px;
		padding: 12px 16px;
	}
	.msg-typing span {
		width: 6px; height: 6px;
		border-radius: 50%;
		background: #94a3b8;
		animation: bounce 1.2s infinite;
	}
	.msg-typing span:nth-child(2) { animation-delay: 0.2s; }
	.msg-typing span:nth-child(3) { animation-delay: 0.4s; }
	@keyframes bounce {
		0%, 60%, 100% { transform: translateY(0); }
		30% { transform: translateY(-5px); }
	}

	/* Error */
	.chat-error {
		font-size: 12px;
		color: #dc2626;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		padding: 8px 12px;
	}

	/* Suggestions */
	.suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 4px;
	}
	.suggestion-btn {
		font-size: 12px;
		font-weight: 600;
		color: #475569;
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		border-radius: 20px;
		padding: 5px 12px;
		cursor: pointer;
		transition: all 0.15s;
	}
	.suggestion-btn:hover { background: #e2e8f0; color: #0f172a; }

	/* Input */
	.chat-input-row {
		padding: 10px 12px;
		border-top: 1px solid #f1f5f9;
		display: flex;
		align-items: flex-end;
		gap: 8px;
		flex-shrink: 0;
	}
	.chat-input {
		flex: 1;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 10px 12px;
		font-size: 13px;
		outline: none;
		font-family: inherit;
		line-height: 1.5;
		min-height: 44px;
		max-height: 120px;
		overflow-y: auto;
		transition: border-color 0.15s;
		width: 100%;
		box-sizing: border-box;
		display: block;
		color: #0f172a;
		word-break: break-word;
		white-space: pre-wrap;
	}
	.chat-input:focus { border-color: #f97316; }
	.chat-input[aria-disabled='true'] {
		background: #f8fafc;
		pointer-events: none;
		opacity: 0.6;
	}
	.chat-input:empty::before {
		content: attr(data-placeholder);
		color: #94a3b8;
		pointer-events: none;
	}
	/* Hide scrollbar arrows completely */
	.chat-input::-webkit-scrollbar {
		display: none;
	}
	.chat-input {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.chat-send {
		width: 34px; height: 34px;
		border-radius: 8px;
		background: #0f172a;
		color: white;
		border: none;
		cursor: pointer;
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0;
		transition: background 0.15s;
	}
	.chat-send:hover:not(:disabled) { background: #1e293b; }
	.chat-send:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }

	/* Sign in prompt */
	.chat-signin-prompt {
		flex: 1;
		text-align: center;
		padding: 8px;
	}
	.chat-signin-link {
		font-size: 13px;
		font-weight: 600;
		color: #f97316;
		text-decoration: none;
	}
	.chat-signin-link:hover { text-decoration: underline; }

	/* Footer */
	.chat-footer {
		padding: 6px 16px 10px;
		font-size: 10px;
		color: #94a3b8;
		text-align: center;
		flex-shrink: 0;
	}

	@media (max-width: 480px) {
		.support-chat-root { bottom: 1rem; right: 1rem; }
		.chat-panel { width: calc(100vw - 2rem); }
	}
</style>
