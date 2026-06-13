<script lang="ts">
	import { Wrench, CreditCard, User, FileText, GraduationCap, MessageSquare, Mail, Clock, ChevronDown, CheckCircle2, ArrowLeft } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';

	let { data } = $props();

	let formData = $state({
		name: '',
		email: '',
		category: 'general',
		subject: '',
		message: '',
		priority: 'normal'
	});

	let submitting = $state(false);
	let submitted = $state(false);
	let error = $state('');
	let nameError = $state('');
	let emailError = $state('');
	let messageError = $state('');
	let turnstileToken = $state('');
	let turnstileDiv: HTMLElement | null = null;
	let turnstileLoaded = $state(false);
	let turnstileRetries = 0;
	const MAX_RETRIES = 3;

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	// Global callback for Turnstile
	if (typeof window !== 'undefined') {
		(window as any).onTurnstileSuccess = (token: string) => {
			turnstileToken = token;
			turnstileLoaded = true;
		};
		(window as any).onTurnstileError = () => {
			error = 'Security check failed. Please refresh and try again.';
			tryRenderTurnstile(); // Retry on error
		};
	}

	function tryRenderTurnstile() {
		if (turnstileRetries >= MAX_RETRIES) {
			console.error('Turnstile failed to load after maximum retries');
			return;
		}

		if ((window as any).turnstile && turnstileDiv) {
			try {
				// Clear any existing widget first
				turnstileDiv.innerHTML = '';
				
				(window as any).turnstile.render('#turnstile-widget', {
					sitekey: PUBLIC_TURNSTILE_SITE_KEY,
					callback: 'onTurnstileSuccess',
					'error-callback': 'onTurnstileError',
					theme: 'light'
				});
				console.log('Turnstile widget rendered successfully');
			} catch (err) {
				console.error('Error rendering Turnstile:', err);
				turnstileRetries++;
				// Retry after a short delay
				setTimeout(tryRenderTurnstile, 1000);
			}
		} else {
			turnstileRetries++;
			// Wait for Turnstile API to be ready
			setTimeout(tryRenderTurnstile, 500);
		}
	}

	onMount(() => {
		// Check if Turnstile script is already loaded
		const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
		
		if (existingScript) {
			// Script already exists, try to render widget
			console.log('Turnstile script already loaded, attempting render');
			setTimeout(tryRenderTurnstile, 100);
			return;
		}

		// Load Turnstile script if not already present
		const script = document.createElement('script');
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
		script.async = true;
		script.defer = true;
		
		// Callback when script loads
		(window as any).onTurnstileLoad = () => {
			console.log('Turnstile script loaded');
			setTimeout(tryRenderTurnstile, 100);
		};

		script.onerror = () => {
			console.error('Failed to load Turnstile script');
			error = 'Failed to load security check. Please refresh the page.';
		};

		document.head.appendChild(script);
	});

	function validateName() { nameError = formData.name.trim().length < 2 ? 'Full name is required.' : ''; }
	function validateEmail() { emailError = !formData.email ? 'Email is required.' : !emailRegex.test(formData.email) ? 'Invalid email format.' : ''; }
	function validateMessage() { messageError = formData.message.trim().length < 10 ? 'Message must be at least 10 characters.' : ''; }

	async function handleSubmit(e: Event) {
		e.preventDefault();
		validateName(); validateEmail(); validateMessage();
		if (nameError || emailError || messageError) { error = 'Please fix the errors above.'; return; }
		
		// Require Turnstile token
		if (!turnstileToken) {
			error = 'Please complete the security check.';
			return;
		}

		submitting = true;
		error = '';
		try {
			const res = await fetch('/api/contact-support', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...formData, turnstileToken })
			});
			if (res.ok) {
				submitted = true;
				formData = { name: '', email: '', category: 'general', subject: '', message: '', priority: 'normal' };
				turnstileToken = '';
				turnstileLoaded = false;
				// Reset Turnstile widget
				if (typeof (window as any).turnstile !== 'undefined') {
					try {
						(window as any).turnstile.reset('#turnstile-widget');
					} catch (e) {
						console.error('Error resetting Turnstile:', e);
						// Re-render if reset fails
						tryRenderTurnstile();
					}
				}
				window.scrollTo({ top: 0, behavior: 'smooth' });
			} else {
				const j = await res.json().catch(() => ({}));
				throw new Error(j.error || 'Failed to send message');
			}
		} catch (err: any) {
			error = err.message || 'Failed to send. Please email hello@abroaducate.com directly.';
		} finally {
			submitting = false;
		}
	}

	const categories = [
		{ value: 'technical', label: 'Technical Issue', desc: 'Login problems, bugs, feature not working', icon: Wrench },
		{ value: 'billing', label: 'Billing & Credits', desc: 'Payment issues, credit packs, refunds', icon: CreditCard },
		{ value: 'account', label: 'Account Support', desc: 'Profile settings, data, account deletion', icon: User },
		{ value: 'documents', label: 'Document Help', desc: 'SOP generation, editing, formatting', icon: FileText },
		{ value: 'universities', label: 'Program Questions', desc: 'Programs, scholarships, deadlines', icon: GraduationCap },
		{ value: 'general', label: 'General Inquiry', desc: 'Features, partnerships, feedback', icon: MessageSquare }
	];

	const faqs = [
		{ q: 'How quickly will you respond?', a: 'We aim to respond within 24–48 hours. Billing and technical issues get priority.' },
		{ q: 'I\'m having trouble logging in. What should I do?', a: 'Try resetting your password using the "Forgot Password" link. If that doesn\'t work, contact us with your registered email.' },
		{ q: 'How do credits work?', a: 'Every new account gets 3 free credits. Credits are spent on AI-powered features like strategy generation and document creation. Browsing programs and scholarships is always free. Top up by buying a credit pack from the Pricing page.' },
		{ q: 'My AI-generated document seems off. Can you help?', a: 'Try being more specific in your inputs. If you\'re still having issues, send us your inputs and we\'ll help.' },
		{ q: 'Is my personal information secure?', a: 'Yes. We use industry-standard encryption and never share your personal information. You can export or delete your data anytime.' }
	];

	let openFAQ = $state<number | null>(null);
</script>

<svelte:head>
	<title>Contact & Support — Abroaducate</title>
	<meta name="description" content="Get help with your study abroad applications. Contact our support team for technical issues, billing questions, and guidance." />
</svelte:head>

<div class="min-h-screen bg-slate-50 pt-20 pb-16">
	<!-- Page header -->
	<div class="bg-white border-b border-slate-200">
		<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
			<a href="/dashboard" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6">
				<ArrowLeft size={15} /> Back to Dashboard
			</a>
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
					<Mail size={24} strokeWidth={2} />
				</div>
				<div>
					<h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Contact & Support</h1>
					<p class="text-slate-500 mt-1">We're here to help. We respond within 24–48 hours.</p>
				</div>
			</div>
		</div>
	</div>

	<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

			<!-- Form -->
			<div class="lg:col-span-2">
				<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">

					{#if submitted}
						<div class="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
							<CheckCircle2 size={20} class="text-emerald-600 flex-shrink-0 mt-0.5" />
							<div>
								<p class="font-bold text-emerald-900">Message sent</p>
								<p class="text-emerald-700 text-sm mt-0.5">We'll get back to you within 24–48 hours. Check your email for a confirmation.</p>
							</div>
						</div>
					{/if}

					{#if error}
						<div class="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
							<p class="text-rose-700 text-sm">{error}</p>
						</div>
					{/if}

					<form onsubmit={handleSubmit} class="space-y-6">
						<!-- Category -->
						<div>
							<p class="block text-sm font-semibold text-slate-700 mb-3">What can we help you with?</p>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
								{#each categories as cat}
									<label class="cursor-pointer">
										<input type="radio" bind:group={formData.category} value={cat.value} class="sr-only" />
										<div class="flex items-start gap-3 border rounded-xl p-3.5 transition-all {formData.category === cat.value ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}">
											<div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 {formData.category === cat.value ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}">
												<cat.icon size={16} />
											</div>
											<div>
												<div class="font-semibold text-slate-900 text-sm">{cat.label}</div>
												<div class="text-xs text-slate-500 mt-0.5">{cat.desc}</div>
											</div>
										</div>
									</label>
								{/each}
							</div>
						</div>

						<!-- Name + Email -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label for="name" class="block text-sm font-semibold text-slate-700 mb-1.5">Full name <span class="text-rose-500">*</span></label>
								<input type="text" id="name" bind:value={formData.name} oninput={validateName} placeholder="Your full name"
									class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 {nameError ? 'border-rose-400' : ''}" />
								{#if nameError}<p class="text-rose-600 text-xs mt-1">{nameError}</p>{/if}
							</div>
							<div>
								<label for="email" class="block text-sm font-semibold text-slate-700 mb-1.5">Email <span class="text-rose-500">*</span></label>
								<input type="email" id="email" bind:value={formData.email} oninput={validateEmail} placeholder="your@email.com"
									class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 {emailError ? 'border-rose-400' : ''}" />
								{#if emailError}<p class="text-rose-600 text-xs mt-1">{emailError}</p>{/if}
							</div>
						</div>

						<!-- Subject + Priority -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label for="subject" class="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
								<input type="text" id="subject" bind:value={formData.subject} placeholder="Brief summary"
									class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
							</div>
							<div>
								<label for="priority" class="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
								<select id="priority" bind:value={formData.priority}
									class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white">
									<option value="low">Low — General inquiry</option>
									<option value="normal">Normal — Standard support</option>
									<option value="high">High — Urgent issue</option>
									<option value="critical">Critical — Blocking issue</option>
								</select>
							</div>
						</div>

						<!-- Message -->
						<div>
							<label for="message" class="block text-sm font-semibold text-slate-700 mb-1.5">Message <span class="text-rose-500">*</span></label>
							<textarea id="message" bind:value={formData.message} oninput={validateMessage} rows="5"
								placeholder="Describe your issue or question in detail. Include any error messages or steps you've already tried."
								class="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-y {messageError ? 'border-rose-400' : ''}"></textarea>
							{#if messageError}<p class="text-rose-600 text-xs mt-1">{messageError}</p>{/if}
						</div>

						<!-- Turnstile CAPTCHA -->
						<div>
							<label class="block text-sm font-semibold text-slate-700 mb-2">Security check <span class="text-rose-500">*</span></label>
							<div 
								bind:this={turnstileDiv}
								id="turnstile-widget"
							></div>
							{#if !turnstileToken}
								<p class="text-xs text-slate-500 mt-2">Complete the security check to enable the submit button.</p>
							{/if}
						</div>

						<button type="submit" disabled={submitting || !turnstileToken}
							class="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
							{#if submitting}
								<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
								Sending…
							{:else}
								Send message
							{/if}
						</button>
					</form>
				</div>
			</div>

			<!-- Sidebar -->
			<div class="space-y-5">
				<!-- Direct contact -->
				<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
					<h3 class="font-bold text-slate-900 mb-4">Direct contact</h3>
					<div class="space-y-4">
						<div class="flex items-start gap-3">
							<div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
								<Mail size={16} />
							</div>
							<div>
								<p class="text-xs text-slate-500 mb-0.5">Email</p>
								<a href="mailto:hello@abroaducate.com" class="text-sm font-semibold text-orange-600 hover:underline">hello@abroaducate.com</a>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
								<Clock size={16} />
							</div>
							<div>
								<p class="text-xs text-slate-500 mb-0.5">Response time</p>
								<p class="text-sm font-semibold text-slate-900">24–48 hours</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Book a call -->
				<div class="bg-orange-50 border border-orange-200 rounded-2xl p-6">
					<h3 class="font-bold text-slate-900 mb-2">Book a free call</h3>
					<p class="text-sm text-slate-600 mb-4">30-minute consultation — I'll review your profile and tell you exactly which programs and scholarships to target.</p>
					<a href="/book-a-call" class="block text-center w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 transition-colors text-sm">
						Book a free call
					</a>
				</div>

				<!-- Tips -->
				<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
					<h3 class="font-bold text-slate-900 mb-3">Before you contact us</h3>
					<ul class="space-y-2">
						{#each ['Check the FAQ below for common solutions', 'Try refreshing the page or clearing your browser cache', 'Include screenshots or error messages', 'Mention your account email for faster help'] as tip}
							<li class="flex items-start gap-2 text-sm text-slate-600">
								<span class="text-slate-300 mt-0.5 flex-shrink-0">—</span>{tip}
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>

		<!-- FAQ -->
		<div class="mt-12">
			<h2 class="text-2xl font-extrabold text-slate-900 mb-6">Frequently asked questions</h2>
			<div class="space-y-2 max-w-3xl">
				{#each faqs as faq, i}
					<div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
						<button class="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
							onclick={() => openFAQ = openFAQ === i ? null : i}>
							<span class="font-semibold text-slate-900 text-sm">{faq.q}</span>
							<ChevronDown size={16} class="text-slate-400 flex-shrink-0 transition-transform {openFAQ === i ? 'rotate-180' : ''}" />
						</button>
						{#if openFAQ === i}
							<div class="px-6 pb-4">
								<p class="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
