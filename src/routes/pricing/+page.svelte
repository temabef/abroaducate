<script lang="ts">
	import { page } from '$app/stores';
	import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
	import { analytics } from '$lib/utils/posthog';
	import { subscriptionState } from '$lib/stores/subscription';
	import { get } from 'svelte/store';

	import heroImage from '$lib/images/background-image.png';

	let { data } = $props();
	let { session, supabase } = $derived(data);

	let billingCycle = $state<'monthly' | 'annual'>('monthly');
	let showAuthModal = $state(false);
	let authMode = $state<'login' | 'signup'>('signup');
	let loading = $state(false);

	let monthlyBtnEl: HTMLButtonElement;
	let annualBtnEl: HTMLButtonElement;
	let sliderStyle = $state('');

	const prices = {
		professional: {
			monthly: 12,
			annual: 10
		},
		elite: {
			monthly: 29,
			annual: 24
		}
	};

	const noAdsLine = 'Ad-free experience on paid plans';

	async function handleUpgrade(plan: string, opts?: { trial?: boolean }) {
		// Track pricing page interaction
		analytics.trackEvent('pricing_plan_selected', {
			plan: plan,
			billing_cycle: billingCycle,
			user_id: session?.user?.id
		});

		if (plan === 'free') {
			// Handle free plan - show signup modal
			if (!session) {
				authMode = 'signup';
				showAuthModal = true;
			} else {
				// User is already logged in, redirect to dashboard
				window.location.href = '/dashboard';
			}
			return;
		}

		if (!session) {
			// For paid plans, user needs to login first
			authMode = 'login';
			showAuthModal = true;
			return;
		}

		// Handle paid plans - redirect to Stripe checkout
		try {
			loading = true;

			const response = await fetch('/api/stripe/create-checkout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					planType: plan,
					billingCycle: billingCycle,
					trial: opts?.trial === true,
					metadata: {
						source: 'pricing_page',
						cycle: billingCycle
					}
				})
			});

			const data = await response.json();

			if (data.error) {
				alert(`Error: ${data.error}`);
				return;
			}

			if (data.checkoutUrl) {
				// Track checkout redirect
				analytics.trackEvent('checkout_redirected', {
					plan: plan,
					billing_cycle: billingCycle,
					user_id: session?.user?.id
				});

				// Redirect to Stripe checkout
				window.location.href = data.checkoutUrl;
			}
		} catch (error) {
			console.error('Error creating checkout session:', error);
			alert('Failed to create checkout session. Please try again or contact support.');
		} finally {
			loading = false;
		}
	}

	const pricingPlans = [
		{
			name: 'Starter Plan',
			description: 'Discover scholarships, explore universities, and apply with confidence.',
			price: '$0',
			color: 'white',
			textColor: 'text-gray-900',
			bgColor: 'bg-white',
			button: {
				bg: 'bg-[#2C3580]',
				text: 'text-white',
				hover: 'hover:bg-[#3c4d9c]'
			},
			features: [
				'4 Documents/Month: 1 SOPs, 1 Cover Letters, 1 Personal Statement, 1 Academic CV',
				'AI Features: 1 Review, 1 Text Enhancement, 1 Word Optimization, 1 Grammar Check, 1 Plagiarism Check, 1 Tone Analysis',
				'University Matching: 50+ universities with basic matching',
				'Academic Analysis: Quick profile assessment only',
				'Application Tracking: 12 applications with basic reminders',
				'Inline Text Editing: 5 AI-powered edits per month',
				'Version History: 3 versions (cover letters only, 30-day retention)',
				'Visa Interview Simulator: 6 questions/session',
				'Community support',
				'GPT-3.5 AI Engine - Reliable and efficient AI',
				'Cold Email Generator: 5 professional emails per month',
				'Scholarship Access: Free access to all scholarship listings',
				'Email Notifications: Weekly scholarship digest - delivered every week with new opportunities!',
				'IELTS Test Prep: FREE - Full access to all practice tests (Reading, Listening, Writing, Speaking)',
				'Document Checklists: FREE - Complete application tracking and deadline management'
			]
		},
		{
			name: 'Professional Plan',
			description: 'Track applications, enhance documents, and prep for visas.',
			price: '$12',
			subText: '(monthly)',
			color: '#2C3580',
			textColor: 'text-white',
			bgColor: 'bg-[#2C3580]',
			button: {
				bg: 'bg-white',
				text: 'text-[#2C3580]',
				hover: 'hover:bg-gray-200'
			},
			features: [
				'50 Documents/Month: Flexible allocation across all document types',
				'Enhanced AI: 15 Reviews, 25 Text Enhancements, 15 Word Optimizations, 25 Grammar Checks, 10 Plagiarism Checks, 25 Tone Analyses',
				'University Matching: 500+ university recommendations (US + international)',
				'Academic Analysis: Comprehensive transcript analysis + Quick assessment',
				'Application Tracking: 1000 applications with advanced analytics',
				'Email support (48h response)',
				'Premium Email System: Application deadline reminders, daily/weekly scholarship digest, subscription alerts & personalized notifications',
				'Ad-free experience on paid plans',
				'Inline Text Editing: 50 AI-powered edits per month',
				'Version History: 50 versions (all document types, 90-day retention)',
				'GPT-4o-mini AI Engine - Advanced AI with superior quality',
				'Cold Email Generator: 50 professional emails per month',
				'Scholarship Access: Free access to all scholarship listings with personalized recommendations',
				'Visa Interview Simulator: 50 questions/session',
				'IELTS Test Prep: FREE - Full access + Future: AI feedback & analytics',
				'Document Checklists: FREE - Full access + Future: AI-powered insights & custom automations',
				'Buy Professional',
				'No charge today. Cancel anytime before trial ends.',
				'New features automatically included as we grow!'
			]
		},
		{
			name: 'Elite Plan',
			description: 'Premium AI tools and priority access to power your global operations.',
			price: '$29',
			subText: '(monthly)',
			color: 'white',
			textColor: 'text-gray-900',
			bgColor: 'bg-white',
			button: {
				bg: 'bg-[#2C3580]',
				text: 'text-white',
				hover: 'hover:bg-[#3c4d9c]'
			},
			features: [
				'UNLIMITED Documents: Generate as many documents as you need',
				'Unlimited AI: Unlimited reviews, enhancements, optimizations, grammar checks, plagiarism checks, and tone analyses',
				'University Database: 1500+ universities worldwide + priority access + new universities first',
				'Academic Analysis: Comprehensive transcript analysis + Quick assessment',
				'Priority email support (24h response)',
				'Elite Email System: All Premium features + instant deadline alerts (≤3 days), immediate notifications for critical deadlines, priority email delivery',
				'Application Tracking: Unlimited applications with premium insights dashboard',
				'Inline Text Editing: UNLIMITED AI-powered edits',
				'Version History: 100 versions (all document types, 1-year retention)',
				'Early access to new features',
				'Ad-free experience on paid plans',
				'GPT-4o AI Engine - Most advanced AI model available',
				'Cold Email Generator: 500 professional emails per month',
				'Scholarship Access: Priority access to all scholarship listings with custom alerts and personalized recommendations',
				'Visa Interview Simulator: 80+ questions/session',
				'IELTS Test Prep: FREE - Full access + Future: Premium AI feedback & detailed analytics',
				'Document Checklists: FREE - Full access + Future: AI-powered insights & custom automations',
				'New features automatically included as we grow!'
			]
		}
	];
</script>

<svelte:head>
	<title>Pricing - Abroaducate</title>
	<meta
		name="description"
		content="Choose the perfect plan for your academic application journey. From free to professional tiers."
	/>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-30">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<section id="pricing" class="bg-gray-50">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="text-center">
					<span
						class="inline-flex items-center px-4 py-1 text-xs bg-indigo-100 text-[#2C3580] rounded-full mb-4"
					>
						Pricing plan for students
					</span>
					<h2 class="text-4xl md:text-5xl text-gray-900 font-semibold">
						Flexible Plans for Every Student
					</h2>
					<p class="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
						We're starting conservative to keep prices student-friendly, but as we grow,
						<strong>your limits automatically increase at no extra cost!</strong>
					</p>
				</div>
				<!-- Enhanced Billing Cycle Toggle -->
				<div class="flex justify-center my-6 px-4">
					<div
						class="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-[#2C3580]/20 p-2 flex flex-wrap sm:flex-nowrap items-center justify-center max-w-full sm:max-w-fit w-full sm:w-auto"
					>
						<button
							onclick={() => (billingCycle = 'monthly')}
							class="px-5 sm:px-8 py-3 sm:py-4 font-semibold text-base sm:text-lg transition-all duration-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2C3580]/30 flex-1 min-w-[140px]"
							class:bg-[#2C3580]={billingCycle === 'monthly'}
							class:text-white={billingCycle === 'monthly'}
							class:bg-transparent={billingCycle !== 'monthly'}
							class:text-[#2C3580]={billingCycle !== 'monthly'}
							class:hover:bg-gray-100={billingCycle !== 'monthly'}
						>
							<div class="flex flex-col items-center text-center">
								<span class="mb-1 flex items-center gap-1 justify-center">
									💳 <span>Monthly</span>
								</span>
								<span class="text-[11px] sm:text-xs opacity-80 font-normal">Pay as you go</span>
							</div>
						</button>

						<div class="hidden sm:block mx-3 h-12 w-px bg-[#2C3580]/10"></div>

						<button
							onclick={() => (billingCycle = 'annual')}
							class="px-5 sm:px-8 py-3 sm:py-4 font-semibold text-base sm:text-lg transition-all duration-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#2C3580]/30 flex-1 min-w-[140px]"
							class:bg-[#2C3580]={billingCycle === 'annual'}
							class:text-white={billingCycle === 'annual'}
							class:bg-transparent={billingCycle !== 'annual'}
							class:text-[#2C3580]={billingCycle !== 'annual'}
							class:hover:bg-gray-100={billingCycle !== 'annual'}
						>
							<div class="flex flex-col items-center text-center">
								<div class="flex items-center justify-center gap-2 mb-1 flex-wrap">
									🎯 <span>Annual</span>
									<span
										class="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-[10px] sm:text-[11px] font-semibold px-2 py-[2px] rounded-full shadow-md whitespace-nowrap"
									>
										Save 20%
									</span>
								</div>
								<span class="text-[11px] sm:text-xs opacity-80 font-normal">Best value</span>
							</div>
						</button>
					</div>
				</div>

				<!-- Pricing Comparison Hint -->
				<div class="text-center mb-8">
					<div
						class="inline-flex items-center gap-4 bg-gradient-to-r from-indigo-100 to-indigo-100 border border-indigo-100 rounded-full px-6 py-3"
					>
						<span class="text-[#2C3580] font-medium">
							{#if billingCycle === 'annual'}
								🎉 You're saving $48/year with annual billing!
							{:else}
								💡 Switch to annual and save $48/year
							{/if}
						</span>
						{#if billingCycle === 'monthly'}
							<button
								onclick={() => (billingCycle = 'annual')}
								class="text-[#2C3580] hover:text-[#3c4d9c] font-semibold underline underline-offset-2 transition-colors"
							>
								See annual pricing →
							</button>
						{/if}
					</div>
				</div>

				<div class="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
					{#each pricingPlans as plan, i}
						<div
							class={`rounded-2xl p-8 shadow-lg border border-gray-200 flex flex-col h-full ${plan.bgColor} ${
								plan.name === 'Professional Plan' ? 'lg:scale-105 shadow-3xl' : ''
							}`}
						>
							<h3 class={`text-xl font-semibold ${plan.textColor}`}>
								{plan.name}
							</h3>

							<p class={`mt-2 text-sm ${plan.textColor}`}>{plan.description}</p>

							<div class="mt-6">
								{#if plan.name.toLowerCase() === 'elite plan'}
									<div class={`text-4xl font-bold ${plan.textColor} mb-2`}>
										${prices.elite[billingCycle]}
									</div>
								{:else if plan.name.toLowerCase() === 'professional plan'}
									<div class={`text-4xl font-bold ${plan.textColor} mb-2`}>
										${prices.professional[billingCycle]}
									</div>
								{:else}
									<span class={`text-4xl font-bold ${plan.textColor}`}>
										{plan.price}
									</span>
								{/if}

								<p class={`ml-1 ${plan.textColor}`}>
									per month{#if billingCycle === 'annual'}, billed annually{/if}
								</p>
							</div>

							<!-- <span class={`ml-1 ${plan.textColor}`}>{plan.subText}</span> -->

							<ul class="mt-6 space-y-4 text-sm flex-1">
								{#each plan.features as feature}
									<li class={`flex items-start ${plan.textColor}`}>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
										</svg>
										{feature}
									</li>
								{/each}
							</ul>
							<!-- Dynamic Button Section -->
							<div class="mt-8">
								<!-- proffesional plan btns -->
								{#if plan.name.toLowerCase() === 'professional plan'}
									<div class="grid grid-cols-1 gap-3">
										<button
											onclick={() => handleUpgrade('professional', { trial: true })}
											disabled={loading}
											class="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{loading ? 'Creating checkout...' : 'Start 3-day free trial'}
										</button>

										<button
											onclick={() => handleUpgrade('professional')}
											disabled={loading}
											class={`w-full py-3 px-4 rounded-lg font-medium ${plan.button.bg} ${plan.button.text} ${plan.button.hover} transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
										>
											{loading ? 'Creating checkout...' : 'Buy Professional'}
										</button>

										<p class="text-xs text-white text-center">
											No charge today. Cancel anytime before trial ends.
										</p>
									</div>

									<!-- elite plan btns -->
								{:else if plan.name.toLowerCase() === 'elite plan'}
									<button
										onclick={() => handleUpgrade('elite')}
										disabled={loading}
										class={`w-full py-3 px-4 rounded-lg font-medium ${plan.button.bg} ${plan.button.text} ${plan.button.hover} transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
									>
										{loading ? 'Creating checkout...' : 'Upgrade to Elite'}
									</button>

									<!-- frre plan btn -->
								{:else}
									<button
										onclick={() => handleUpgrade('free plan')}
										class={`w-full py-3 px-4 rounded-lg font-medium ${plan.button.bg} ${plan.button.text} ${plan.button.hover} transition duration-300`}
									>
										Get Started Free
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- Email System Highlight -->
		<div
			class="mt-30 max-w-5xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-[#2C3580]/20 p-6 sm:p-8"
		>
			<div class="text-center">
				<h2 class="text-3xl font-bold text-black mb-4">Smart Email Notification System</h2>
				<p class="text-black text-lg mb-6">
					Never miss a deadline again! Our intelligent email system keeps you on track with
					personalized reminders and opportunities.
				</p>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
					<div class="bg-white rounded-lg p-6 border border-black/20 text-left">
						<h3 class="font-semibold text-black mb-3 text-center">Academic Starter</h3>
						<ul class="text-sm text-black space-y-2">
							<li class="flex items-center gap-2">
								<span class="text-green-500 font-bold">✓</span>
								<span>Weekly scholarship digest</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="text-green-500 font-bold">✓</span>
								<span>New opportunities delivered weekly</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="text-green-500 font-bold">✓</span>
								<span>Curated for your profile</span>
							</li>
						</ul>
					</div>

					<div
						class="bg-white rounded-lg p-6 border border-black/20  text-left"
					>
						<h3 class="font-semibold text-black mb-3 text-center">Academic Professional</h3>
						<ul class="text-sm text-black space-y-2">
							<li class="flex items-center gap-2">
								<span class="text-green-500 font-bold">✓</span>
								<span>All Starter features</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="text-green-500 font-bold">✓</span>
								<span>Application deadline reminders</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="text-green-500 font-bold">✓</span>
								<span>Daily scholarship option</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="text-green-500 font-bold">✓</span>
								<span>Account & subscription alerts</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="text-green-500 font-bold">✓</span>
								<span>Personalized notifications</span>
							</li>
						</ul>
					</div>

					<div class="bg-white rounded-lg p-6 border border-black/20 text-left">
						<h3 class="font-semibold text-black mb-3 text-center">Academic Elite</h3>
						<ul class="text-sm text-black space-y-2">
							<li class="flex items-center gap-2">
								<span class="text-green-500 font-bold">✓</span>
								<span>All Professional features</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="text-green-500 font-bold">✓</span>
								<span>Instant alerts for critical deadlines</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="text-green-500 font-bold">✓</span>
								<span>Priority email delivery</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="text-green-500 font-bold">✓</span>
								<span>Immediate notifications (≤3 days)</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="text-green-500 font-bold">✓</span>
								<span>Custom urgency levels</span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- Feature Comparison -->
		<div class="mt-20 max-w-6xl mx-auto">
			<h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
				Complete Feature Comparison
			</h2>

			<div class="bg-white rounded-lg shadow-lg overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">Features</th>
								<th class="px-6 py-4 text-center text-sm font-semibold text-gray-900"
									>Academic Starter</th
								>
								<th class="px-6 py-4 text-center text-sm font-semibold text-gray-900"
									>Academic Professional</th
								>
								<th class="px-6 py-4 text-center text-sm font-semibold text-gray-900"
									>Academic Elite</th
								>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							<tr>
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">Documents per Month</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600">4 documents</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>50 documents</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>UNLIMITED</strong></td
								>
							</tr>
							<tr class="bg-gray-50">
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">AI Features per Month</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600">6 features</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>115 features</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>UNLIMITED</strong></td
								>
							</tr>
							<tr>
								<td class="px-6 py-4 text-sm text-gray-900 font-medium"
									>University Recommendations</td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600">50+ universities</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>500+ universities</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>1500+ universities + priority access</strong></td
								>
							</tr>
							<tr>
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">AI Model</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600">GPT-3.5</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>GPT-4o-mini</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"><strong>GPT-4o</strong></td>
							</tr>
							<tr class="bg-gray-50">
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">Inline Text Editing</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600">5 edits/month</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>50 edits/month</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>UNLIMITED</strong></td
								>
							</tr>
							<tr>
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">Version History</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									>3 versions (cover letters only)</td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>50 versions (all documents)</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>100 versions (all documents)</strong></td
								>
							</tr>
							<tr class="bg-gray-50">
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">Cold Email Generator</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>5 emails/month</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>50 emails/month</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>500 emails/month</strong></td
								>
							</tr>
							<tr>
								<td class="px-6 py-4 text-sm text-gray-900 font-medium"
									>Academic Profile Analysis</td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600">Quick Assessment Only</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>Comprehensive + Quick</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>Comprehensive + Quick</strong></td
								>
							</tr>

							<tr class="bg-gray-50">
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">Support Level</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600">Community</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600">Email (48h)</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600">Priority Email (24h)</td>
							</tr>

							<tr>
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">Application Tracking</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600">12 applications</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>1000 applications</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>Unlimited applications</strong></td
								>
							</tr>
							<tr class="bg-gray-50">
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">Ads</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600">Shown</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>Not shown (ad-free)</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>Not shown (ad-free)</strong></td
								>
							</tr>
							<tr class="bg-gray-50">
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">Growth Promise</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600">-</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>🚀 New features included</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>🚀 Auto-expanding limits</strong></td
								>
							</tr>
							<tr>
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">Visa Interview Simulator</td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600">6 questions/session</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>50 questions/session</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>80+ questions/session</strong></td
								>
							</tr>
							<tr class="bg-gray-50">
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">Scholarship Access</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"> Free Access</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong> Free Access + Personalized</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong> Priority Access + Custom Alerts</strong></td
								>
							</tr>
							<tr>
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">Email Notifications</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									>Weekly scholarship digest only</td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong
										>Application deadline reminders + Daily/Weekly scholarships + Account alerts</strong
									></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong
										>All Premium + Instant deadline alerts (≤3 days) + Priority delivery</strong
									></td
								>
							</tr>
							<tr class="bg-gray-50">
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">IELTS Test Prep</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>FREE - Full access to practice tests</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>FREE - Full access + Future: AI feedback & analytics</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong
										>FREE - Full access + Future: Premium AI feedback & detailed analytics</strong
									></td
								>
							</tr>
							<tr>
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">Document Checklists</td>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong>FREE - Complete application tracking</strong></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong
										>FREE - Full access + Future: Smart notifications & progress tracking</strong
									></td
								>
								<td class="px-6 py-4 text-sm text-center text-gray-600"
									><strong
										>FREE - Full access + Future: AI-powered insights & custom automations</strong
									></td
								>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- Free GPA Converter Highlight -->
		<div
			class="mt-20 max-w-4xl mx-auto mb-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-black/20 p-6 sm:p-8"
		>
			<div class="text-center">
				<h2 class="text-2xl font-bold text-black mb-3">
					GPA Converter - 100% FREE for Everyone!
				</h2>
				<p class="text-black text-lg mb-4">
					Convert your African university grades to US 4.0 scale completely free. No signup
					required, unlimited conversions.
				</p>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
					<div class="bg-white rounded-lg p-4 border border-gray-200">
						<div class="font-semibold text-black">50+ Countries</div>
						<div class="text-black">All African grading systems</div>
					</div>
					<div class="bg-white rounded-lg p-4 border border-gray-200">
						<div class="font-semibold text-black">Smart Assist</div>
						<div class="text-black">OCR transcript processing</div>
					</div>
					<div class="bg-white rounded-lg p-4 border border-gray-200">
						<div class="font-semibold text-black">Professional PDF</div>
						<div class="text-black">Download official transcripts</div>
					</div>
				</div>
				<a
					href="/gpa-converter"
					class="inline-block mt-4 bg-[#2C3580] text-white px-6 py-3 rounded-lg hover:bg-[#3c4d9c] transition duration-300 font-semibold"
				>
					Try GPA Converter Free →
				</a>
			</div>
		</div>

		<!-- Scholarship Highlight -->
		<div
			class="mt-8 max-w-4xl mx-auto mb-20 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-black/20 p-6 sm:p-8"
		>
			<div class="text-center">
				<h2 class="text-2xl font-bold text-black mb-3">
					Scholarship Access - 100% FREE for Everyone!
				</h2>
				<p class="text-black text-lg mb-4">
					Access our growing database of scholarships completely free with any plan. Find and apply
					for financial aid opportunities worldwide.
				</p>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
					<div class="bg-white rounded-lg p-4 border border-gray-200">
						<div class="font-semibold text-black">All Plans Include</div>
						<div class="text-black">Unlimited scholarship browsing</div>
					</div>
					<div class="bg-white rounded-lg p-4 border border-gray-200">
						<div class="font-semibold text-black">Save & Track</div>
						<div class="text-black">Mark favorites and track applications</div>
					</div>
					<div class="bg-white rounded-lg p-4 border border-gray-200">
						<div class="font-semibold text-black">Apply Directly</div>
						<div class="text-black">Easy application process</div>
					</div>
				</div>
				<a
					href="/scholarships"
					class="inline-block mt-4 bg-[#2C3580] text-white px-6 py-3 rounded-lg hover:bg-[#3c4d9c] transition duration-300 font-semibold"
				>
					Browse Scholarships →
				</a>
			</div>
		</div>
		<!-- FAQ Section -->
		<div class="mt-20 max-w-4xl mx-auto">
			<h2 class="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>

			<div class="space-y-8">
				<div class="bg-white rounded-lg p-6 shadow-sm">
					<h3 class="text-lg font-medium text-gray-900 mb-3">Can I change my plan anytime?</h3>
					<p class="text-gray-600">
						Yes! You can upgrade or downgrade your plan at any time. Changes take effect
						immediately, and we'll prorate any billing adjustments.
					</p>
				</div>

				<div class="bg-white rounded-lg p-6 shadow-sm">
					<h3 class="text-lg font-medium text-gray-900 mb-3">
						What happens if I exceed my document limit?
					</h3>
					<p class="text-gray-600">
						You'll receive a notification when approaching your limit. You can either wait for the
						next billing cycle or upgrade to a higher plan for immediate access.
					</p>
				</div>

				<div class="bg-white rounded-lg p-6 shadow-sm">
					<h3 class="text-lg font-medium text-gray-900 mb-3">What document types are included?</h3>
					<p class="text-gray-600">
						All plans include Statement of Purpose, Cover Letters, Personal Statements, and Academic
						CV generators. Each plan has different monthly limits for document generation.
					</p>
				</div>

				<div class="bg-white rounded-lg p-6 shadow-sm">
					<h3 class="text-lg font-medium text-gray-900 mb-3">Do you offer student discounts?</h3>
					<p class="text-gray-600">
						Our pricing is already student-friendly! We designed our plans specifically for
						students' budgets while providing professional-quality tools.
					</p>
				</div>

				<div class="bg-white rounded-lg p-6 shadow-sm">
					<h3 class="text-lg font-medium text-gray-900 mb-3">Is my data secure?</h3>
					<p class="text-gray-600">
						Absolutely. We use industry-standard encryption and never share your personal
						information or documents. Your privacy is our top priority.
					</p>
				</div>
			</div>
		</div>

		<!-- CTA Section -->
		<!-- <div class="mt-20 text-center">
			<h2 class="text-3xl font-bold text-gray-900 mb-4">Ready to Start Your Academic Journey?</h2>
			<p class="text-xl text-gray-600 mb-8">
				Join thousands of students who've successfully used Abroaducate for their applications.
			</p>
			<button
				onclick={() => handleUpgrade('free')}
				class="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-[#2C3580] transition duration-300"
			>
				Get Started Now
			</button>
		</div> -->

		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
			<section
				class="relative rounded-3xl overflow-hidden text-center"
				style="background-image: url('{heroImage}'); background-size: cover; background-position: center;"
			>
				<div class="relative max-w-4xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
					<h2 class="text-4xl md:text-5xl font-semibold text-white tracking-tight">
						Ready to Start Your Academic Journey?
					</h2>
					<p class="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto">
						Join thousands of students who've successfully used Abroaducate for their applications.
					</p>

					<div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
						<button
							onclick={() => handleUpgrade('free')}
							class="inline-flex items-center gap-3 bg-white text-blue-700 font-semibold px-6 py-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-105"
						>
							Get Started Now
							<span class="bg-indigo-100 text-blue-700 p-1.5 rounded-full">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.006v3.989a1 1 0 001.555.832l3.197-1.995a1 1 0 000-1.664l-3.197-1.995z"
										clip-rule="evenodd"
									/>
								</svg>
							</span>
						</button>
					</div>
				</div>
			</section>
		</div>
	</div>
</div>

<!-- Authentication Modal -->
<AuthenticationFlow bind:show={showAuthModal} {supabase} mode={authMode} returnUrl="/dashboard" />
