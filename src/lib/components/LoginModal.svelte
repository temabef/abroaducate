<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { browser } from '$app/environment';

	const dispatch = createEventDispatcher();

	export let show: boolean;
	export let supabase: SupabaseClient;

	function close() {
		show = false;
		dispatch('close');
	}

	async function handleGoogleLogin() {
		if (!browser) return;

		const nextPath = window.location.pathname;
		console.log('=== LOGIN MODAL DEBUG ===');
		console.log('Current pathname:', nextPath);
		console.log('Full URL:', window.location.href);

		// Encode the next parameter directly into the redirectTo URL
		const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
		console.log('Redirect URL with next parameter:', redirectUrl);

		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: redirectUrl
			}
		});
		
		console.log('OAuth initiated with next parameter in redirect URL');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			close();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
	<div
		class="modal-overlay"
		on:click={close}
		role="button"
		tabindex="0"
		on:keydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') close();
		}}
	>
		<div
			class="modal-content"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			aria-labelledby="modal-title"
			tabindex="-1"
		>
			<button class="close-button" on:click={close} aria-label="Close modal">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
			<h2 id="modal-title">Login to Continue</h2>
			<p>Please log in to save your progress and generate your Statement of Purpose.</p>
			<button class="google-login-button" on:click={handleGoogleLogin}>
				<svg viewBox="0 0 48 48" class="google-icon">
					<path
						fill="#EA4335"
						d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.63-6.63C34.61 2.94 29.67 0 24 0 14.65 0 6.64 5.37 2.65 13.06L9.69 18.5C12.18 13.9 17.65 9.5 24 9.5z"
					></path>
					<path
						fill="#4285F4"
						d="M46.72 23.95c0-1.57-.14-3.08-.38-4.59H24v8.59h12.56c-.71 3.52-2.73 6.46-5.87 8.52l5.77 4.47c3.48-3.23 5.48-7.98 5.48-13.49z"
					></path>
					<path
						fill="#FBBC04"
						d="M9.69 18.5c-.71 2.16-1.12 4.45-1.12 6.55s.41 4.39 1.12 6.55l-7.04 5.44C1.04 35.8 0 31.91 0 24s1.04-11.8 2.65-18.94L9.69 18.5z"
					></path>
					<path
						fill="#34A853"
						d="M24 48c6.64 0 12.11-2.19 16.15-5.96L34.38 37.5c-2.92 2.05-6.57 3.2-10.38 3.2-6.35 0-11.82-4.4-14.31-8.9L2.65 34.94C6.64 42.63 14.65 48 24 48z"
					></path>
					<path fill="none" d="M0 0h48v48H0z"></path>
				</svg>
				Continue with Google
			</button>
		</div>
	</div>
{/if}

<style lang="postcss">
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background-color: white;
        padding: 2.5rem;
        border-radius: 1rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        max-width: 450px;
        width: 90%;
        text-align: center;
        position: relative;
        animation: fadeIn 0.3s ease-out;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .close-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: background-color 0.2s ease;
    }

    .close-button:hover {
        background-color: #F0F2F5;
    }

    .close-button svg {
        width: 1.5rem;
        height: 1.5rem;
        color: #64748B;
    }

    h2 {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1E293B;
        margin-bottom: 0.5rem;
    }

    p {
        font-size: 1.1rem;
        color: #475569;
        line-height: 1.6;
        margin-bottom: 1.5rem;
    }

    .google-login-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        background-color: #4285F4;
        color: white;
        padding: 0.8rem 1.5rem;
        border: none;
        border-radius: 0.5rem;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease, transform 0.1s ease;
        width: 100%;
        max-width: 280px;
    }

    .google-login-button:hover {
        background-color: #357AE8;
        transform: translateY(-1px);
    }

    .google-icon {
        width: 1.5rem;
        height: 1.5rem;
    }
</style>