<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import type { SupabaseClient } from '@supabase/supabase-js';
    import { browser } from '$app/environment';
    import { deviceFingerprintService } from '$lib/services/deviceFingerprintService';
    import { emailVerificationService, type EmailAnalysis } from '$lib/services/emailVerificationService';
    import { getBaseUrl, getEmailBaseUrl } from '$lib/config/site';

    const dispatch = createEventDispatcher();

    export let show: boolean = true;
    export let supabase: SupabaseClient;
    export let mode: 'login' | 'signup' = 'login';
    export let returnUrl: string = '/dashboard';

    // Form state
    let activeTab: 'google' | 'email' = 'google';
    let email = '';
    let password = '';
    let confirmPassword = '';
    let fullName = '';
    let agreeToTerms = false;
    
    // UI state
    let loading = false;
    let error = '';
    let success = '';
    let showPassword = false;
    let showConfirmPassword = false;
    
    // Email analysis
    let emailAnalysis: EmailAnalysis | null = null;
    let emailAnalysisLoading = false;
    
    // Device fingerprinting
    let deviceFingerprint = '';
    let riskAssessment: any = null;

    // Initialize device fingerprinting
    onMount(async () => {
        if (browser) {
            try {
                deviceFingerprint = await deviceFingerprintService.getFingerprint();
                riskAssessment = await deviceFingerprintService.checkDeviceRisk(supabase);
                
                if (riskAssessment.shouldBlock) {
                    error = 'Registration temporarily unavailable. Please try again later or contact support.';
                }
            } catch (err) {
                console.warn('Device fingerprinting failed:', err);
            }
        }
    });

    // Mark user interaction for audio fingerprinting
    function handleUserInteraction() {
        deviceFingerprintService.markUserInteraction();
    }

    function close() {
        show = false;
        dispatch('close');
    }

    function switchMode() {
        mode = mode === 'login' ? 'signup' : 'login';
        clearForm();
    }

    function clearForm() {
        email = '';
        password = '';
        confirmPassword = '';
        fullName = '';
        error = '';
        success = '';
        emailAnalysis = null;
    }

    // Email analysis on blur
    async function analyzeEmailAddress() {
        if (!email || email.length < 5) {
            emailAnalysis = null;
            return;
        }
        
        emailAnalysisLoading = true;
        try {
            emailAnalysis = await emailVerificationService.analyzeEmail(email, supabase);
            
            // Show warnings for risky emails
            if (emailAnalysis.blocked) {
                error = 'This email domain is not allowed. Please use a different email address.';
            } else if (emailAnalysis.riskLevel === 'medium') {
                error = 'Please ensure you have access to this email address for verification.';
            } else {
                error = '';
            }
        } catch (err) {
            console.error('Email analysis failed:', err);
        } finally {
            emailAnalysisLoading = false;
        }
    }

    // Google OAuth
    async function handleGoogleLogin() {
        if (!browser) return;
        
        loading = true;
        error = '';
        
        try {
            const redirectUrl = `${getBaseUrl()}/auth/callback?next=${encodeURIComponent(returnUrl)}`;
            
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: redirectUrl }
            });
        } catch (err: any) {
            error = err.message || 'Google authentication failed';
            loading = false;
        }
    }

    // Email/Password Authentication
    async function handleEmailAuth() {
        if (riskAssessment?.shouldBlock) {
            error = 'Registration temporarily unavailable. Please try again later.';
            return;
        }

        loading = true;
        error = '';

        // Validation
        if (!email || !password) {
            error = 'Please fill in all required fields';
            loading = false;
            return;
        }

        if (mode === 'signup') {
            if (!fullName.trim()) {
                error = 'Please enter your full name';
                loading = false;
                return;
            }

            if (password !== confirmPassword) {
                error = 'Passwords do not match';
                loading = false;
                return;
            }

            if (password.length < 8) {
                error = 'Password must be at least 8 characters long';
                loading = false;
                return;
            }

            if (!agreeToTerms) {
                error = 'Please agree to the Terms of Service and Privacy Policy';
                loading = false;
                return;
            }

            // Check if email should be blocked
            if (emailAnalysis?.blocked) {
                error = 'This email domain is not allowed for registration';
                loading = false;
                return;
            }

            // Additional database check for registration blocking
            try {
                const domain = email.split('@')[1];
                const { data: shouldBlock } = await supabase.rpc('should_block_registration', {
                    p_ip_address: '0.0.0.0', // IP would be detected server-side
                    p_email_domain: domain,
                    p_device_fingerprint: deviceFingerprint
                });

                if (shouldBlock) {
                    error = 'Email rate limit exceeded. Please try again later or contact support.';
                    loading = false;
                    return;
                }
            } catch (blockCheckError) {
                console.warn('Failed to check registration blocking:', blockCheckError);
                // Continue with registration if the check fails
            }
        }

        try {
            if (mode === 'signup') {
                await handleSignup();
            } else {
                await handleLogin();
            }
        } catch (err: any) {
            error = err.message || `${mode === 'signup' ? 'Registration' : 'Login'} failed`;
        } finally {
            loading = false;
        }
    }

    async function handleSignup() {
        // Log registration event for fraud detection
        try {
            await supabase.rpc('log_registration_event', {
                p_email_domain: emailAnalysis?.domain || email.split('@')[1],
                p_ip_address: '0.0.0.0', // Would be set server-side
                p_device_fingerprint: deviceFingerprint,
                p_user_agent: navigator.userAgent,
                p_registration_method: 'email'
            });
        } catch (logError) {
            console.warn('Failed to log registration event:', logError);
        }

        // Create account with Supabase's built-in email confirmation
        const { data, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    registration_method: 'email'
                },
                emailRedirectTo: `${getBaseUrl()}/auth/callback`
            }
        });

        if (signupError) throw signupError;

        if (data?.user) {
            // Store device fingerprint
            await deviceFingerprintService.storeFingerprint(supabase, data.user.id);

            // Check if email confirmation is required
            if (data.user.email_confirmed_at) {
                // User is already confirmed, auto-login
                success = 'Account created successfully! Redirecting...';
                setTimeout(() => {
                    close();
                    window.location.href = returnUrl;
                }, 1000);
            } else {
                // Email confirmation required
                success = 'Account created! Please check your email to verify your account before signing in.';
                
                // Switch to login mode after successful signup
                setTimeout(() => {
                    mode = 'login';
                    clearForm();
                }, 3000);
            }
        }
    }

    // Function to get the correct production URL
    function getProductionUrl(): string {
        return getBaseUrl();
    }

    async function handleLogin() {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) throw loginError;

        if (data?.user) {
            // Store/update device fingerprint
            await deviceFingerprintService.storeFingerprint(supabase, data.user.id);
            
            success = 'Login successful! Redirecting...';
            
            // Close modal and redirect
            setTimeout(() => {
                close();
                window.location.href = returnUrl;
            }, 1000);
        }
    }

    // Forgot password
    async function handleForgotPassword() {
        if (!email) {
            error = 'Please enter your email address first';
            return;
        }

        loading = true;
        error = '';

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${getEmailBaseUrl()}/auth/reset-password`
            });

            if (resetError) throw resetError;

            success = 'Password reset email sent! Check your inbox.';
        } catch (err: any) {
            error = err.message || 'Failed to send password reset email';
        } finally {
            loading = false;
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            close();
        }
        if (event.key === 'Enter' && activeTab === 'email') {
            handleEmailAuth();
        }
    }

    // Auto-scroll to message when it appears
    function scrollToMessage() {
        if (browser) {
            setTimeout(() => {
                const messageElement = document.getElementById('auth-message');
                if (messageElement) {
                    messageElement.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'nearest'
                    });
                }
            }, 100);
        }
    }

    // Watch for message changes and auto-scroll
    $: if ((success || error) && browser) {
        scrollToMessage();
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if show}
    <div class="modal-overlay" on:click={close} role="button" tabindex="0">
        <div class="modal-content" on:click|stopPropagation role="dialog" aria-labelledby="modal-title" tabindex="-1">
            <!-- Close Button -->
            <button class="close-button" on:click={close} aria-label="Close modal">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <!-- Header -->
            <div class="header">
                <h2 id="modal-title">
                    {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
                </h2>
                <p>
                    {mode === 'login' 
                        ? 'Sign in to access your academic application tools' 
                        : 'Join thousands of students achieving their academic goals'}
                </p>
            </div>

            <!-- Messages removed from top - will be shown after submit button -->

            <!-- Risk Warning -->
            {#if riskAssessment?.riskScore > 40 && riskAssessment?.riskScore <= 60}
                <div class="message warning">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    Additional verification may be required for your account.
                </div>
            {/if}

            <!-- Authentication Tabs -->
            <div class="auth-tabs">
                <button 
                    class="tab-button" 
                    class:active={activeTab === 'google'}
                    on:click={() => activeTab = 'google'}
                >
                    <svg viewBox="0 0 24 24" class="tab-icon">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                </button>
                <button 
                    class="tab-button" 
                    class:active={activeTab === 'email'}
                    on:click={() => activeTab = 'email'}
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" class="tab-icon">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                    Email
                </button>
            </div>

            <!-- Authentication Content -->
            <div class="auth-content">
                {#if activeTab === 'google'}
                    <!-- Google Authentication -->
                    <div class="google-auth">
                        <button 
                            class="google-login-button" 
                            on:click={handleGoogleLogin}
                            disabled={loading}
                        >
                            {#if loading}
                                <div class="spinner"></div>
                            {:else}
                                <svg viewBox="0 0 48 48" class="google-icon">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.63-6.63C34.61 2.94 29.67 0 24 0 14.65 0 6.64 5.37 2.65 13.06L9.69 18.5C12.18 13.9 17.65 9.5 24 9.5z"/>
                                    <path fill="#4285F4" d="M46.72 23.95c0-1.57-.14-3.08-.38-4.59H24v8.59h12.56c-.71 3.52-2.73 6.46-5.87 8.52l5.77 4.47c3.48-3.23 5.48-7.98 5.48-13.49z"/>
                                    <path fill="#FBBC04" d="M9.69 18.5c-.71 2.16-1.12 4.45-1.12 6.55s.41 4.39 1.12 6.55l-7.04 5.44C1.04 35.8 0 31.91 0 24s1.04-11.8 2.65-18.94L9.69 18.5z"/>
                                    <path fill="#34A853" d="M24 48c6.64 0 12.11-2.19 16.15-5.96L34.38 37.5c-2.92 2.05-6.57 3.2-10.38 3.2-6.35 0-11.82-4.4-14.31-8.9L2.65 34.94C6.64 42.63 14.65 48 24 48z"/>
                                    <path fill="none" d="M0 0h48v48H0z"/>
                                </svg>
                            {/if}
                            Continue with Google
                        </button>
                        <p class="auth-benefits">
                            ✓ Secure Google authentication<br/>
                            ✓ No need to remember passwords<br/>
                            ✓ Instant access to your account
                        </p>
                    </div>
                {:else}
                    <!-- Email Authentication -->
                    <form class="email-form" on:submit|preventDefault={handleEmailAuth}>
                        {#if mode === 'signup'}
                            <div class="form-group">
                                <label for="fullName">Full Name</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    bind:value={fullName}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                        {/if}

                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <div class="input-container">
                                <input
                                    id="email"
                                    type="email"
                                    bind:value={email}
                                    on:blur={analyzeEmailAddress}
                                    on:click={handleUserInteraction}
                                    placeholder="Enter your email"
                                    required
                                />
                                {#if emailAnalysisLoading}
                                    <div class="input-spinner"></div>
                                {:else if emailAnalysis}
                                    <div class="email-indicator" class:academic={emailAnalysis.isAcademic} class:risky={emailAnalysis.riskLevel === 'high'}>
                                        {#if emailAnalysis.isAcademic}
                                            🎓
                                        {:else if emailAnalysis.riskLevel === 'high'}
                                            ⚠️
                                        {:else}
                                            ✓
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                            {#if emailAnalysis?.isAcademic}
                                <p class="email-bonus">🎓 Academic email detected! You'll get premium features.</p>
                            {/if}
                        </div>

                        <div class="form-group">
                            <label for="password">Password</label>
                            <div class="password-input">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    bind:value={password}
                                    placeholder={mode === 'signup' ? 'Create a strong password (8+ characters)' : 'Enter your password'}
                                    required
                                />
                                <button
                                    type="button"
                                    class="password-toggle"
                                    on:click={() => showPassword = !showPassword}
                                >
                                    {#if showPassword}
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/>
                                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                                        </svg>
                                    {:else}
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                                        </svg>
                                    {/if}
                                </button>
                            </div>
                        </div>

                        {#if mode === 'signup'}
                            <div class="form-group">
                                <label for="confirmPassword">Confirm Password</label>
                                <div class="password-input">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        bind:value={confirmPassword}
                                        placeholder="Confirm your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        class="password-toggle"
                                        on:click={() => showConfirmPassword = !showConfirmPassword}
                                    >
                                        {#if showConfirmPassword}
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clip-rule="evenodd"/>
                                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                                            </svg>
                                        {:else}
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                                            </svg>
                                        {/if}
                                    </button>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" bind:checked={agreeToTerms} required />
                                    <span class="checkmark"></span>
                                    I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
                                </label>
                            </div>
                        {/if}

                        <button 
                            type="submit" 
                            class="auth-submit-button"
                            disabled={loading || (riskAssessment?.shouldBlock && mode === 'signup')}
                        >
                            {#if loading}
                                <div class="spinner"></div>
                            {/if}
                            {mode === 'signup' ? 'Create Account' : 'Sign In'}
                        </button>

                        <!-- Success/Error Messages - positioned right after submit button for immediate visibility -->
                        {#if success}
                            <div class="message success message-under-button" id="auth-message">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                </svg>
                                {success}
                            </div>
                        {/if}

                        {#if error}
                            <div class="message error message-under-button" id="auth-message">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        {/if}

                        {#if mode === 'login'}
                            <button type="button" class="forgot-password" on:click={handleForgotPassword}>
                                Forgot your password?
                            </button>
                        {/if}
                    </form>
                {/if}
            </div>

            <!-- Mode Switcher -->
            <div class="mode-switcher">
                {#if mode === 'login'}
                    <p>Don't have an account? <button class="link-button" on:click={switchMode}>Sign up here</button></p>
                {:else}
                    <p>Already have an account? <button class="link-button" on:click={switchMode}>Sign in here</button></p>
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
        backdrop-filter: blur(4px);
    }

    .modal-content {
        background-color: white;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        max-width: 480px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from { opacity: 0; transform: translateY(-30px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
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

    .header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .header h2 {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1E293B;
        margin-bottom: 0.5rem;
    }

    .header p {
        font-size: 1rem;
        color: #475569;
        line-height: 1.5;
    }

    .message {
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .message.success {
        background-color: #DCFCE7;
        color: #166534;
        border: 1px solid #BBF7D0;
    }

    .message.error {
        background-color: #FEE2E2;
        color: #DC2626;
        border: 1px solid #FECACA;
    }

    .message.warning {
        background-color: #FEF3C7;
        color: #D97706;
        border: 1px solid #FDE68A;
    }

    .message-under-button {
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        animation: slideDown 0.3s ease-out;
        border: 2px solid;
        font-weight: 600;
        line-height: 1.4;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .auth-tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        background-color: #F8FAFC;
        padding: 0.25rem;
        border-radius: 0.75rem;
    }

    .tab-button {
        flex: 1;
        padding: 0.75rem 1rem;
        border: none;
        background: transparent;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        color: #64748B;
    }

    .tab-button.active {
        background-color: white;
        color: #1E293B;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .tab-icon {
        width: 1.25rem;
        height: 1.25rem;
    }

    .auth-content {
        min-height: 200px;
    }

    .google-auth {
        text-align: center;
    }

    .google-login-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        background-color: #4285F4;
        color: white;
        padding: 0.875rem 1.5rem;
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        margin-bottom: 1rem;
    }

    .google-login-button:hover:not(:disabled) {
        background-color: #357AE8;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
    }

    .google-login-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    .google-icon {
        width: 1.25rem;
        height: 1.25rem;
    }

    .auth-benefits {
        font-size: 0.9rem;
        color: #64748B;
        line-height: 1.6;
        text-align: left;
    }

    .email-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .form-group label {
        font-weight: 500;
        color: #374151;
        font-size: 0.9rem;
    }

    .input-container {
        position: relative;
    }

    .form-group input[type="text"],
    .form-group input[type="email"] {
        padding: 0.75rem;
        border: 1px solid #D1D5DB;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: border-color 0.2s ease;
        width: 100%;
    }

    .form-group input:focus {
        outline: none;
        border-color: #3B82F6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .email-indicator {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1.2rem;
    }

    .email-indicator.academic {
        color: #059669;
    }

    .email-indicator.risky {
        color: #DC2626;
    }

    .email-bonus {
        font-size: 0.8rem;
        color: #059669;
        font-weight: 500;
    }

    .password-input {
        position: relative;
    }

    .password-input input {
        padding: 0.75rem;
        padding-right: 3rem;
        border: 1px solid #D1D5DB;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: border-color 0.2s ease;
        width: 100%;
    }

    .password-input input:focus {
        outline: none;
        border-color: #3B82F6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .password-toggle {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        color: #6B7280;
        padding: 0.25rem;
    }

    .password-toggle:hover {
        color: #374151;
    }

    .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    .checkbox-label input[type="checkbox"] {
        margin: 0;
        position: absolute;
        opacity: 0;
    }

    .checkmark {
        width: 1.2rem;
        height: 1.2rem;
        background-color: white;
        border: 2px solid #D1D5DB;
        border-radius: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
        margin-top: 0.1rem;
    }

    .checkbox-label input[type="checkbox"]:checked + .checkmark {
        background-color: #3B82F6;
        border-color: #3B82F6;
    }

    .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
        content: '✓';
        color: white;
        font-size: 0.8rem;
        font-weight: bold;
    }

    .checkbox-label a {
        color: #3B82F6;
        text-decoration: none;
    }

    .checkbox-label a:hover {
        text-decoration: underline;
    }

    .auth-submit-button {
        background-color: #3B82F6;
        color: white;
        padding: 0.875rem;
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .auth-submit-button:hover:not(:disabled) {
        background-color: #2563EB;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .auth-submit-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }

    .forgot-password {
        background: none;
        border: none;
        color: #3B82F6;
        font-size: 0.9rem;
        cursor: pointer;
        text-align: center;
        padding: 0.5rem;
        text-decoration: none;
        margin-top: 0.5rem;
    }

    .forgot-password:hover {
        text-decoration: underline;
    }

    .mode-switcher {
        text-align: center;
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid #E5E7EB;
    }

    .mode-switcher p {
        color: #6B7280;
        font-size: 0.9rem;
    }

    .link-button {
        background: none;
        border: none;
        color: #3B82F6;
        cursor: pointer;
        text-decoration: none;
        font-weight: 500;
    }

    .link-button:hover {
        text-decoration: underline;
    }

    .spinner {
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .input-spinner {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        width: 1rem;
        height: 1rem;
        border: 2px solid #E5E7EB;
        border-top: 2px solid #3B82F6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 640px) {
        .modal-content {
            padding: 1.5rem;
            margin: 1rem;
            border-radius: 0.75rem;
        }

        .header h2 {
            font-size: 1.5rem;
        }

        .auth-tabs {
            gap: 0.25rem;
        }

        .tab-button {
            padding: 0.625rem 0.75rem;
            font-size: 0.9rem;
        }
    }
</style>
