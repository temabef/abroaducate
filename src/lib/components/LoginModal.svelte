<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { browser } from '$app/environment';
	import { EmailVerificationService } from '$lib/services/emailVerificationService';
	import { DeviceFingerprintService } from '$lib/services/deviceFingerprintService';

	const dispatch = createEventDispatcher();

	export let show: boolean;
	export let supabase: SupabaseClient;

	// Authentication state
	let activeTab: 'google' | 'email' = 'google';
	let isSignUp = false;
	let loading = false;
	let message = '';
	let messageType: 'success' | 'error' | 'info' = 'info';

	// Form data
	let email = '';
	let password = '';
	let confirmPassword = '';

	// Email analysis
	let emailAnalysis: any = null;
	let showEmailAnalysis = false;
	let deviceFingerprint: string = '';

	// Service instances
	const emailService = new EmailVerificationService();
	const deviceService = new DeviceFingerprintService();

	function close() {
		show = false;
		dispatch('close');
	}

	async function handleGoogleLogin() {
		if (!browser) return;

		const nextPath = window.location.pathname;
		const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: redirectUrl
			}
		});
	}

	async function analyzeEmailInput() {
		if (!email || email.length < 5) {
			emailAnalysis = null;
			showEmailAnalysis = false;
			return;
		}

		try {
			emailAnalysis = await emailService.analyzeEmail(email, supabase);
			showEmailAnalysis = true;
		} catch (error) {
			console.error('Email analysis error:', error);
			emailAnalysis = null;
			showEmailAnalysis = false;
		}
	}

	async function handleEmailAuth() {
		if (!email || !password) {
			setMessage('Please fill in all fields', 'error');
			return;
		}

		if (isSignUp && password !== confirmPassword) {
			setMessage('Passwords do not match', 'error');
			return;
		}

		if (isSignUp && password.length < 8) {
			setMessage('Password must be at least 8 characters long', 'error');
			return;
		}

		loading = true;
		setMessage('', 'info');

		try {
			// Collect device fingerprint for fraud prevention
			const fingerprint = await deviceService.generateFingerprint();
			
			if (isSignUp) {
				// Check fraud prevention before allowing signup
				const analysis = await emailService.analyzeEmail(email, supabase);
				if (analysis.blocked) {
					setMessage('This email address cannot be used for registration. Please use a different email.', 'error');
					loading = false;
					return;
				}

				// Simple risk score calculation
				let riskScore = 0;
				if (analysis.isDisposable) riskScore += 50;
				if (analysis.riskLevel === 'high') riskScore += 30;
				if (analysis.riskLevel === 'medium') riskScore += 15;
				
				if (riskScore > 60) {
					setMessage('Registration temporarily blocked. Please contact support if this is an error.', 'error');
					loading = false;
					return;
				}

				// Sign up
				const { data, error } = await supabase.auth.signUp({
					email,
					password,
					options: {
						data: {
							registration_method: 'email',
							device_fingerprint: fingerprint.fingerprint,
							risk_score: riskScore,
							academic_email: analysis.isAcademic,
							email_tier: analysis.isAcademic ? analysis.bonusTier : 'basic'
						}
					}
				});

				if (error) {
					setMessage(error.message, 'error');
				} else {
					setMessage('Please check your email and click the verification link to complete registration.', 'success');
					// Log registration event
					await supabase.rpc('log_registration_event', {
						p_email_domain: email.split('@')[1],
						p_ip_address: '0.0.0.0', // IP will be detected server-side
						p_device_fingerprint: fingerprint.fingerprint,
						p_user_agent: navigator.userAgent,
						p_registration_method: 'email'
					});
				}
			} else {
				// Sign in
				const { data, error } = await supabase.auth.signInWithPassword({
					email,
					password
				});

				if (error) {
					setMessage(error.message, 'error');
				} else {
					setMessage('Login successful!', 'success');
					close();
				}
			}
		} catch (error: any) {
			setMessage(error.message || 'An unexpected error occurred', 'error');
		} finally {
			loading = false;
		}
	}

	function setMessage(msg: string, type: 'success' | 'error' | 'info') {
		message = msg;
		messageType = type;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			close();
		}
	}

	// Generate device fingerprint on mount
	onMount(async () => {
		if (browser) {
			try {
				const fingerprint = await deviceService.getFingerprint();
				deviceFingerprint = fingerprint;
			} catch (error) {
				console.error('Error generating device fingerprint:', error);
			}
		}
	});

	// Reactive email analysis
	$: if (email && activeTab === 'email') {
		analyzeEmailInput();
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
			<h2 id="modal-title">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
			<p>
				{#if isSignUp}
					Join thousands of students who have successfully applied abroad.
				{:else}
					Sign in to continue your application journey.
				{/if}
			</p>

			<!-- Tab Navigation -->
			<div class="tab-container">
				<button 
					class="tab-button"
					class:active={activeTab === 'google'}
					on:click={() => activeTab = 'google'}
				>
					<svg class="tab-icon" viewBox="0 0 24 24">
						<path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27272727,0 3.28636364,2.6909091 1.63636364,6.65454545 L5.26620003,9.76452941 Z"/>
						<path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.63636364,17.3545455 C3.28636364,21.3181818 7.27272727,24 12,24 C14.9818182,24 17.7272727,22.8909091 19.9090909,21.0181818 L16.0407269,18.0125889 Z"/>
						<path fill="#4285F4" d="M19.9090909,21.0181818 C22.0909091,19.1636364 23.4545455,16.2909091 23.4545455,12 C23.4545455,11.2909091 23.3636364,10.6363636 23.1818182,10.0909091 L12,10.0909091 L12,14.4545455 L18.4909091,14.4545455 C18.1090909,16.0181818 17.1818182,17.2727273 15.8181818,18.0909091 L19.9090909,21.0181818 Z"/>
						<path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.63636364,6.65454545 C0.590909091,8.72727273 0,11.2909091 0,12 C0,12.7090909 0.590909091,15.2727273 1.63636364,17.3545455 L5.27698177,14.2678769 Z"/>
					</svg>
					Google
				</button>
				<button 
					class="tab-button"
					class:active={activeTab === 'email'}
					on:click={() => activeTab = 'email'}
				>
					<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
						<polyline points="22,6 12,13 2,6"/>
					</svg>
					Email
				</button>
			</div>

			<!-- Tab Content -->
			<div class="tab-content">
				{#if activeTab === 'google'}
					<!-- Google OAuth Tab -->
					<div class="google-tab">
						<button class="google-login-button" on:click={handleGoogleLogin} disabled={loading}>
							<svg viewBox="0 0 48 48" class="google-icon">
								<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.63-6.63C34.61 2.94 29.67 0 24 0 14.65 0 6.64 5.37 2.65 13.06L9.69 18.5C12.18 13.9 17.65 9.5 24 9.5z"/>
								<path fill="#4285F4" d="M46.72 23.95c0-1.57-.14-3.08-.38-4.59H24v8.59h12.56c-.71 3.52-2.73 6.46-5.87 8.52l5.77 4.47c3.48-3.23 5.48-7.98 5.48-13.49z"/>
								<path fill="#FBBC04" d="M9.69 18.5c-.71 2.16-1.12 4.45-1.12 6.55s.41 4.39 1.12 6.55l-7.04 5.44C1.04 35.8 0 31.91 0 24s1.04-11.8 2.65-18.94L9.69 18.5z"/>
								<path fill="#34A853" d="M24 48c6.64 0 12.11-2.19 16.15-5.96L34.38 37.5c-2.92 2.05-6.57 3.2-10.38 3.2-6.35 0-11.82-4.4-14.31-8.9L2.65 34.94C6.64 42.63 14.65 48 24 48z"/>
								<path fill="none" d="M0 0h48v48H0z"/>
							</svg>
							Continue with Google
						</button>
						<p class="auth-note">Quick and secure - no password required</p>
					</div>
				{:else}
					<!-- Email/Password Tab -->
					<div class="email-tab">
						<form on:submit|preventDefault={handleEmailAuth} class="auth-form">
							<div class="form-group">
								<label for="email" class="form-label">Email Address</label>
								<input
									id="email"
									type="email"
									bind:value={email}
									placeholder="student@university.edu"
									class="form-input"
									class:academic={emailAnalysis?.isAcademic}
									class:warning={emailAnalysis?.riskLevel === 'high'}
									required
									disabled={loading}
								/>
								
								{#if showEmailAnalysis && emailAnalysis}
									<div class="email-analysis">
										{#if emailAnalysis.isAcademic}
											<div class="academic-bonus">
												<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
													<path d="M6 12v5c3 3 9 3 12 0v-5"/>
												</svg>
												Academic email detected! {emailAnalysis.bonusTier === 'elite' ? '🌟 Elite' : emailAnalysis.bonusTier === 'premium' ? '⭐ Premium' : '✓ Standard'} institution
											</div>
										{/if}
										
										{#if emailAnalysis.riskLevel === 'high'}
											<div class="risk-warning">
												<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
													<line x1="12" y1="9" x2="12" y2="13"/>
													<line x1="12" y1="17" x2="12.01" y2="17"/>
												</svg>
												Please use a permanent email address
											</div>
										{/if}
									</div>
								{/if}
							</div>

							<div class="form-group">
								<label for="password" class="form-label">Password</label>
								<input
									id="password"
									type="password"
									bind:value={password}
									placeholder="Enter your password"
									class="form-input"
									required
									disabled={loading}
									minlength="8"
								/>
							</div>

							{#if isSignUp}
								<div class="form-group">
									<label for="confirmPassword" class="form-label">Confirm Password</label>
									<input
										id="confirmPassword"
										type="password"
										bind:value={confirmPassword}
										placeholder="Confirm your password"
										class="form-input"
										required
										disabled={loading}
										minlength="8"
									/>
								</div>
							{/if}

							{#if message}
								<div class="message" class:success={messageType === 'success'} class:error={messageType === 'error'}>
									{message}
								</div>
							{/if}

							<button type="submit" class="submit-button" disabled={loading || (emailAnalysis?.blocked)}>
								{#if loading}
									<svg class="spinner" viewBox="0 0 24 24">
										<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
											<animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
											<animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
										</circle>
									</svg>
									{isSignUp ? 'Creating Account...' : 'Signing In...'}
								{:else}
									{isSignUp ? 'Create Account' : 'Sign In'}
								{/if}
							</button>
						</form>

						<div class="auth-switch">
							{#if isSignUp}
								Already have an account? 
								<button class="switch-button" on:click={() => isSignUp = false}>Sign In</button>
							{:else}
								New to Abroaducate? 
								<button class="switch-button" on:click={() => isSignUp = true}>Create Account</button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
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
        max-width: 500px;
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

    /* Tab Navigation */
    .tab-container {
        display: flex;
        background-color: #f8fafc;
        border-radius: 0.75rem;
        padding: 0.25rem;
        width: 100%;
        margin-bottom: 1rem;
    }

    .tab-button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border: none;
        background: transparent;
        border-radius: 0.5rem;
        font-weight: 500;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .tab-button.active {
        background-color: white;
        color: #1e293b;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .tab-button:hover:not(.active) {
        color: #475569;
    }

    .tab-icon {
        width: 1.25rem;
        height: 1.25rem;
    }

    /* Tab Content */
    .tab-content {
        width: 100%;
    }

    .google-tab,
    .email-tab {
        width: 100%;
    }

    .auth-note {
        font-size: 0.875rem;
        color: #64748b;
        margin-top: 0.5rem;
        margin-bottom: 0;
    }

    /* Form Styles */
    .auth-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        text-align: left;
    }

    .form-label {
        font-weight: 500;
        color: #374151;
        font-size: 0.875rem;
    }

    .form-input {
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: all 0.2s ease;
        width: 100%;
    }

    .form-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.academic {
        border-color: #10b981;
        background-color: #f0fdf4;
    }

    .form-input.warning {
        border-color: #f59e0b;
        background-color: #fffbeb;
    }

    .form-input:disabled {
        background-color: #f9fafb;
        cursor: not-allowed;
    }

    /* Email Analysis */
    .email-analysis {
        margin-top: 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .academic-bonus {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        color: #166534;
    }

    .risk-warning {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background-color: #fffbeb;
        border: 1px solid #fed7aa;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        color: #92400e;
    }

    .icon {
        width: 1rem;
        height: 1rem;
        flex-shrink: 0;
    }

    /* Submit Button */
    .submit-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.75rem;
        background-color: #3b82f6;
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 1rem;
        margin-top: 0.5rem;
    }

    .submit-button:hover:not(:disabled) {
        background-color: #2563eb;
        transform: translateY(-1px);
    }

    .submit-button:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
        transform: none;
    }

    .spinner {
        width: 1rem;
        height: 1rem;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    /* Messages */
    .message {
        padding: 0.75rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        width: 100%;
    }

    .message.success {
        background-color: #f0fdf4;
        color: #166534;
        border: 1px solid #bbf7d0;
    }

    .message.error {
        background-color: #fef2f2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }

    /* Auth Switch */
    .auth-switch {
        margin-top: 1rem;
        font-size: 0.875rem;
        color: #64748b;
    }

    .switch-button {
        background: none;
        border: none;
        color: #3b82f6;
        font-weight: 500;
        cursor: pointer;
        text-decoration: underline;
    }

    .switch-button:hover {
        color: #2563eb;
    }
</style>