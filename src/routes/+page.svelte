<script lang="ts">
	import { goto } from '$app/navigation';
	import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
	import heroImage from '$lib/images/background-image.png';
	import studyAbroadCollage from '$lib/images/study-abroad-collage.jpg';
	import studyAbroad1 from '$lib/images/study-abroad-1.jpg';
	import studyAbroad2 from '$lib/images/study-abroad-2.jpg';
	import studyAbroad3 from '$lib/images/study-abroad-3.jpg';
	import studyAbroad4 from '$lib/images/study-abroad-4.jpg';

	import victory from '$lib/images/victory_testimonial.png';
	import mojisola from '$lib/images/mojisola_testimonial.png';
	import david from '$lib/images/david_testimonial.png';
	import chima from '$lib/images/chima_testimonial.png';
	import ayomide from '$lib/images/ayomide_testimonial.png';

	let { data } = $props();
	let { session, supabase } = $derived(data);
	let prefersReducedMotion = false;
	let activityItems: Array<{ message: string; ts: string; type: string }> = $state([]);
	let activityIdx = $state(0);
	let activityTimer: any = null;
	let activityLoading = $state(true);
	let recentScholarships: Array<{
		id: string;
		title: string;
		location?: string;
		deadline?: string;
		created_at?: string;
	}> = $state([]);
	let scholarshipIdx = $state(0);
	let scholarshipTimer: any = null;
	let scrollProgress = $state(0);

	let showAuthModal = $state(false);
	let openFAQ = $state<number | null>(null);
	let pendingDashboardRedirect = $state(false);

	function toggleFAQ(index: number) {
		openFAQ = openFAQ === index ? null : index;
	}

	// Your original FAQ content
	const faqs = [
		{
			question: 'Is Abroaducate really free to start?',
			answer:
				'Yes! Our Academic Starter plan is completely free and includes 4 documents per month, AI features, university matching, and more. You can create your first SOP, cover letter, or academic CV without paying anything. Upgrade only when you need more features.'
		},
		{
			question: 'How does Abroaducate compare to traditional consultants?',
			answer:
				'Traditional consultants charge $500-$3,000+ and often provide limited, one-time services. Abroaducate offers comprehensive, always-available AI assistance starting at $12/month. You get 24/7 access to advanced AI tools, unlimited revisions, and support for your entire application journey - not just one document.'
		},
		{
			question: 'Which countries and universities do you support?',
			answer:
				'We support 7,000+ universities across the US, UK, Canada, and Australia. Our database includes Ivy League schools, Russell Group universities, and top institutions worldwide. We also support 40+ international grading systems for accurate GPA conversion from any country.'
		},
		{
			question: 'What AI models do you use and how good are they?',
			answer:
				'We use multiple GPT models including GPT-3.5-turbo, GPT-4o-mini, and GPT-4o depending on your subscription tier. Our AI is specifically trained for academic writing and understands the nuances of different document types, application requirements, and academic fields.'
		},
		{
			question: "You mentioned you're new - should I trust you with my applications?",
			answer:
				"We're transparent about being new because we believe in honesty. However, we've spent 12+ months building 50+ features before launching. Our platform is comprehensive and production-ready. Plus, with our free tier, you can test everything risk-free before upgrading."
		},
		{
			question: 'What\'s your "Pay-As-We-Grow" promise?',
			answer:
				"As our platform grows and we add more features, your usage limits automatically increase at no extra cost. You're locking in today's prices while getting more value over time. We're starting conservative to ensure quality, but your benefits expand as we scale."
		},
		{
			question: 'Can I cancel anytime? Are there long-term commitments?',
			answer:
				"Absolutely! You can cancel anytime with no penalties or long-term commitments. We offer both monthly and annual plans (annual saves 20%), but you're never locked in. Your data remains accessible even after cancellation."
		},
		{
			question: 'How quickly can I get my first document ready?',
			answer:
				'Most students have their first document ready within 24 hours of signup. Our AI can generate a complete SOP or cover letter in minutes, then you can refine it using our enhancement tools. The speed depends on how much information you provide and your revision preferences.'
		}
	];

	function scrollToSection(sectionId: string) {
		if (typeof document !== 'undefined') {
			document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
		}
	}

	function showSignup() {
		showAuthModal = true;
	}

	function handleManageApplications() {
		if (session) {
			goto('/dashboard');
		} else {
			pendingDashboardRedirect = true;
			showAuthModal = true;
		}
	}

	function handleAuthSuccess() {
		if (pendingDashboardRedirect) {
			pendingDashboardRedirect = false;
			goto('/dashboard');
		}
	}

	function animateCounters() {
		try {
			const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-counter]'));
			if (elements.length === 0) return;
			const start = performance.now();
			const duration = 1000;
			const formatter = (num: number, el: HTMLElement) => {
				const suffix = el.dataset.suffix || '';
				const prefix = el.dataset.prefix || '';
				const useComma = el.dataset.comma === '1';
				const value = useComma ? Math.floor(num).toLocaleString() : Math.floor(num).toString();
				el.textContent = `${prefix}${value}${suffix}`;
			};
			const targets = elements.map((el) => ({ el, target: Number(el.dataset.counter || '0') }));
			targets.forEach(({ el }) => {
				el.textContent = '0';
			});
			const tick = (t: number) => {
				const p = Math.min(1, (t - start) / duration);
				const eased = 1 - Math.pow(1 - p, 3);
				targets.forEach(({ el, target }) => {
					formatter(target * eased, el);
				});
				if (p < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		} catch {}
	}

	// Observer disabled for now to rule out any visibility race
	function observeAndAnimate() {
		/* no-op */
	}

	function initialRevealAboveFold() {
		try {
			const vh = window.innerHeight || 800;
			document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
				const rect = el.getBoundingClientRect();
				if (rect.top < vh * 0.95) {
					el.classList.add('revealed');
				}
			});
		} catch {}
	}

	async function loadRecentActivity() {
		try {
			const res = await fetch('/api/recent-activity');
			if (!res.ok) return;
			const json = await res.json();
			activityItems = json.items || [];
			if (activityTimer) clearInterval(activityTimer);
			if (activityItems.length > 0) {
				activityIdx = 0;
				activityTimer = setInterval(() => {
					activityIdx = (activityIdx + 1) % activityItems.length;
				}, 6000);
			}
		} catch {}
		activityLoading = false;
	}

	async function loadRecentScholarships() {
		try {
			const { data, error } = await supabase
				.from('public_scholarships_decoded')
				.select('id, title, location, deadline, created_at, is_active')
				.eq('is_active', true)
				.order('created_at', { ascending: false })
				.limit(10);
			if (!error && data) {
				recentScholarships = data as any;
				if (scholarshipTimer) clearInterval(scholarshipTimer);
				// No rotation UI (compact pill), so no timer needed
			}
		} catch {}
	}

	function relTime(iso?: string): string {
		if (!iso) return '';
		const diff = Math.max(0, Date.now() - new Date(iso).getTime());
		const s = Math.floor(diff / 1000);
		if (s < 60) return `${s}s ago`;
		const m = Math.floor(s / 60);
		if (m < 60) return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ago`;
		const d = Math.floor(h / 24);
		return `${d}d ago`;
	}
	function recentScholarshipsAdded(hours = 24): number {
		const cutoff = Date.now() - hours * 60 * 60 * 1000;
		return recentScholarships.filter(
			(s) => s.created_at && new Date(s.created_at).getTime() >= cutoff
		).length;
	}

	function startFadeOnView() {
		try {
			const observer = new IntersectionObserver(
				(entries) => {
					for (const e of entries) {
						if (e.isIntersecting) {
							(e.target as HTMLElement).classList.add('fade-up');
							(e.target as HTMLElement).classList.add('drawn');
							observer.unobserve(e.target);
						}
					}
				},
				{ threshold: 0.08 }
			);
			document.querySelectorAll('[data-fade], [data-draw]').forEach((el) => observer.observe(el));
		} catch {}
	}

	$effect(() => {
		if (typeof window !== 'undefined') {
			document.documentElement.classList.add('js');
			prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			// Immediately reveal hero and anything above the fold
			initialRevealAboveFold();
			// Force hero visible regardless of observer timing
			const hero = document.getElementById('hero');
			if (hero) hero.classList.add('revealed');
			// Observer disabled; rely on default visible content
			loadRecentActivity();
			loadRecentScholarships();
			startFadeOnView();
			if (!prefersReducedMotion) animateCounters();

			const updateProgress = () => {
				const h = document.documentElement;
				const max = h.scrollHeight - h.clientHeight || 1;
				scrollProgress = Math.max(0, Math.min(1, window.scrollY / max));
			};
			window.addEventListener('scroll', updateProgress, { passive: true });
			updateProgress();
		}
	});
</script>

<svelte:head>
	<title>Abroaducate - Your Complete Academic Application Platform</title>
	<meta
		name="description"
		content="Generate SOPs, cover letters, track applications, find scholarships, and optimize your academic journey with AI-powered tools."
	/>
</svelte:head>

<div class="bg-white">
	<!-- Scroll progress (purely visual) -->
	<div class="progress-bar" style={`width:${scrollProgress * 100}%;`}></div>

	<!-- Hero Section -->
	<section
		id="home"
		class="relative overflow-hidden text-white py-18 px-6 min-h-screen flex items-center justify-center"
		style="background-image: url('{heroImage}'); background-size: cover; background-position: center;"
	>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.05)_1px,_transparent_0)] [background-size:40px_40px]"
		></div>

		<div
			class="absolute inset-0 bg-gradient-to-t from-[#4B31E3]/60 via-transparent to-transparent pointer-events-none z-10"
		></div>

		<div
			class="relative z-20 max-w-7xl p-2 mx-auto w-full flex flex-col items-center justify-center lg:flex-row lg:justify-between gap-12 text-center lg:text-left"
		>
			<!-- text section -->
			<div class="lg:w-1/2 flex flex-col items-center lg:items-start pt-5">
				<h1 class="text-4xl md:text-5xl text-white mb-6 leading-tight">
					Your Complete<br />
					<span
						class="bg-gradient-to-r from-blue-400 to-blue-800 bg-clip-text text-transparent grad-animate"
					>
						Academic Journey
					</span><br />
					Starts Here
				</h1>

				<p
					class="font-extralight text-md sm:text-lg text-white/80 max-w-lg mx-auto lg:mx-0 mb-6 leading-relaxed"
				>
					From exploration to acceptance - get comprehensive guidance, AI-powered tools, and expert
					support for every step of your international education journey.
				</p>

				<!-- buttons -->
				<div class="flex justify-center lg:justify-start">
					<div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
						{#if session}
							<a
								href="/dashboard"
								data-sveltekit-prefetch
								class="relative flex items-center bg-white hover:bg-[#3c4d9c] pr-4 rounded-full shadow-lg hover:shadow-xl transition duration-300 group"
							>
								<span class="text-[#2C3580] font-semibold text-sm py-4 pl-8 pr-4">
									Continue Your Journey
								</span>
								<div
									class="ml-auto w-12 h-12 flex items-center justify-center transition duration-300"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="w-5 h-5 text-[#2C3580]"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 7l5 5m0 0l-5 5m5-5H6"
										/>
									</svg>
								</div>
							</a>
						{:else}
							<button
								onclick={showSignup}
								class="relative flex items-center bg-white hover:bg-[#3c4d9c] pr-4 rounded-full shadow-lg hover:shadow-xl transition duration-300 group"
							>
								<span class="text-[#2C3580] font-semibold text-sm py-4 pl-8 pr-4">
									Get Started for Free
								</span>
								<div
									class="ml-auto w-12 h-12 flex items-center justify-center transition duration-300"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="w-5 h-5 text-[#2C3580]"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 7l5 5m0 0l-5 5m5-5H6"
										/>
									</svg>
								</div>
							</button>
						{/if}

						<button
							onclick={() => scrollToSection('journey-map')}
							class="relative flex items-center bg-transparent border-2 border-white text-white pr-4 rounded-full hover:bg-[#3c4d9c] shadow-lg hover:shadow-xl transition duration-300 group"
						>
							<span class="font-semibold text-sm py-4 pl-8 pr-4"> See How It Works </span>
							<div
								class="ml-auto w-12 h-12 flex items-center justify-center transition duration-300"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 7l5 5m0 0l-5 5m5-5H6"
									/>
								</svg>
							</div>
						</button>
					</div>
				</div>
				<div
					class="inline-flex items-center px-4 py-1.5 bg-white/10 rounded-full text-sm text-white/90"
				>
					{#if activityLoading}
						<div class="flex items-center gap-2 w-full">
							<span class="inline-block w-2 h-2 rounded-full bg-white/20 animate-pulse"></span>
							<span class="flex-1 h-3 bg-white/20 rounded animate-pulse"></span>
						</div>
					{:else if activityItems.length > 0}
						<div class="flex items-center gap-2">
							<span class="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
							<span>{activityItems[activityIdx].message}</span>
						</div>
					{:else}
						<span class="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
						Trusted by 500+ users globally
					{/if}
				</div>
			</div>

			<!-- Image Section -->
			<div class="w-full lg:w-1/2 flex justify-center relative lg:h-[550px]">
				<!-- Collage for small screens -->
				<div class="lg:hidden relative w-full h-full flex items-start justify-start">
					<img
						src={studyAbroadCollage}
						alt="Students on their academic journey"
						class="w-full max-w-xl h-full rounded-3xl object-full"
					/>
				</div>

				<!-- Three separate images for large screens -->
				<div class="hidden lg:block relative w-full max-w-screen-lg h-full">
					<!-- Left rotated image -->
					<img
						src={studyAbroad2}
						alt="Student exploring university options"
						class="absolute top-1/2 -translate-y-1/2 left-0 w-64 h-80 rounded-3xl -rotate-12 shadow-xl object-cover border border-white/20"
					/>

					<!-- Center main image -->
					<img
						src={studyAbroad1}
						alt="Student celebrating university acceptance"
						class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-80 h-[500px] rounded-3xl shadow-2xl object-cover border border-white/20"
					/>

					<!-- Right rotated image -->
					<img
						src={studyAbroad3}
						alt="Student using AI tools for document prep"
						class="absolute top-1/2 -translate-y-1/2 right-0 w-64 h-80 rounded-3xl rotate-12 shadow-xl object-cover border border-white/20"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- About Section -->
	<section
		id="about-abroaducate"
		class="relative overflow-hidden bg-[#F7F8F6] text-gray-900 py-20 px-6 lg:py-28 flex items-center justify-center"
	>
		<!-- Subtle background pattern -->
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.02)_1px,_transparent_0)] [background-size:36px_36px] z-0"
		></div>

		<div
			class="relative z-10 mx-auto w-full flex flex-col items-start justify-between gap-12 text-center lg:text-left max-w-7xl"
		>
			<!-- Top Section -->
			<div class="w-full flex flex-col justify-center items-center gap-4">
				<!-- Top heading group: Pill, subtitle, and main headline -->
				<div class="text-center">
					<div
						class="inline-flex items-center px-4 py-1.5 bg-[#d0ff5e]/30 rounded-full text-xs text-[#2C3580] font-medium"
					>
						<span class="inline-block w-2.5 h-2.5 bg-[#d0ff5e] rounded-full mr-2"></span>
						About Abroaducate
					</div>
				</div>

				<!-- Main Text Block: Wider and with a new supporting paragraph -->
				<div class="max-w-5xl text-center">
					<h1
						class="text-3xl sm:text-4xl md:text-5xl lg:text-[2.6rem] text-[#0A0A23] leading-tight"
					>
						We provide a seamless path to global education, designed to meet the needs of every
						aspiring student.
					</h1>
					<p class="mt-6 max-w-3xl mx-auto text-gray-600 text-lg">
						From AI-powered document generators to a comprehensive university database, our platform
						is built on a foundation of real data and proven success.
					</p>
				</div>
			</div>

			<!-- Bottom Section (Stats) -->
			<div
				class="w-full px-20 flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-row items-center justify-between gap-y-10 gap-x-10 lg:gap-x-16 text-center"
			>
				<div class="flex flex-col items-center">
					<span class="text-4xl md:text-5xl font-medium text-[#0A0A23]">50+</span>
					<span class="text-gray-500 text-base mt-1">Features Built & Ready</span>
				</div>
				<div class="flex flex-col items-center">
					<span class="text-4xl md:text-5xl font-medium text-[#0A0A23]">7,000+</span>
					<span class="text-gray-500 text-base mt-1">Universities Worldwide</span>
				</div>
				<div class="flex flex-col items-center">
					<span class="text-4xl md:text-5xl font-medium text-[#0A0A23]">95%</span>
					<span class="text-gray-500 text-base mt-1">Application Success Rate</span>
				</div>
				<div class="flex flex-col items-center">
					<span class="text-4xl md:text-5xl font-medium text-[#0A0A23]">24hrs</span>
					<span class="text-gray-500 text-base mt-1">From Signup to First Document</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Journey Map Section -->
	<section
		id="journey-map"
		class="relative overflow-hidden bg-[#F7F8F6] text-gray-900 py-18 px-6 lg:py-18"
	>
		<!-- Subtle dotted background like the design -->
		<div
			class="absolute inset-0 pointer-events-none opacity-30"
			style="background-image: radial-gradient(currentColor 1px, transparent 1px); background-size: 24px 24px; color: #E6E6E6;"
		></div>

		<div class="relative max-w-7xl mx-auto">
			<!-- Title + CTA (centered) -->
			<div class="text-center mb-12">
				<div
					class="inline-flex items-center justify-center space-x-2 text-xs font-medium text-[#2C3580] bg-[#F0ECFF] px-4 py-1.5 rounded-full mx-auto mb-4"
				>
					<span>● Abroaducate Features</span>
				</div>

				<h2 class="text-3xl sm:text-4xl lg:text-5xl text-gray-900 leading-tight mb-4">
					Smart Steps, Seamless Success
				</h2>

				<p class="text-lg text-gray-600 max-w-3xl mx-auto">
					From analyzing your profile to securing your visa, Abroaducate brings every stage of your
					academic journey together in one smart, seamless platform.
				</p>

				<!-- Single CTA -->
				<div class="mt-6">
					{#if session}
						<a
							href="/academic-analyzer"
							data-sveltekit-prefetch
							class="bg-[#2C3580] hover:bg-[#3c4d9c] text-white px-8 py-3 rounded-full transition duration-300 shadow-md"
						>
							Start with Profile Analysis
						</a>
					{:else}
						<button
							onclick={showSignup}
							class="bg-[#2C3580] hover:bg-[#3c4d9c] text-white px-8 py-3 rounded-full transition duration-300 shadow-md"
						>
							Begin Your Journey Today
						</button>
					{/if}
				</div>
			</div>

			<!-- Main content: image (left) + features (right) -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
				<!-- Left: Image card (spans 7/12 on large screens) -->
				<div class="lg:col-span-7">
					<!-- Decorative inner card to match screenshot -->
					<div
						class="rounded-xl bg-[#FAFBFB] p-6 flex items-center justify-center"
						style="min-height:360px;"
					>
						<!-- Replace src with your image path -->
						<img
							src={studyAbroad4}
							alt="Phone mockup"
							class="w-full max-w-xs sm:max-w-md md:max-w-md object-contain rounded-xl drop-shadow-lg"
						/>
					</div>
				</div>

				<!-- Right: Feature list (spans 5/12 on large screens) -->
				<div class="lg:col-span-5">
					<div class="relative pl-6">
						<!-- Gradient vertical line -->
						<div
							class="absolute left-0 top-0 h-3/3 w-[3px] bg-gradient-to-b from-[#2C3580] to-gray-300 rounded-full"
						></div>

						<div class="space-y-10 pt-4">
							<!-- Stage 1: Start Journey -->
							<div>
								<div>
									<h3 class="text-2xl font-semibold text-gray-900 mb-2">Start Your Journey</h3>
									<p class="text-gray-600 mb-2">
										Explore study options and understand your academic strengths.
									</p>
								</div>
							</div>
							<!-- Stage 2: Prepare Documents -->
							<div>
								<div>
									<h3 class="text-2xl font-semibold text-gray-900 mb-2">Prepare Documents</h3>
									<p class="text-gray-600 mb-2">
										Create professional and persuasive application documents with ease.
									</p>
								</div>
							</div>
							<!-- Stage 3: Find Funding -->
							<div>
								<div>
									<h3 class="text-2xl font-semibold text-gray-900 mb-2">Find Funding</h3>
									<p class="text-gray-600 mb-2">
										Access scholarships, grants, and financial planning tools.
									</p>
								</div>
							</div>
							<!-- Stage 4: Submit Applications -->
							<div>
								<div>
									<h3 class="text-2xl font-semibold text-gray-900 mb-2">Submit Applications</h3>
									<p class="text-gray-600 mb-2">
										Organize deadlines and manage every submission efficiently.
									</p>
								</div>
							</div>
							<!-- Stage 5: Next Steps -->
							<div>
								<div>
									<h3 class="text-2xl font-semibold text-gray-900 mb-2">Next Steps</h3>
									<p class="text-gray-600 mb-2">
										Prepare for admission offers and a smooth transition abroad.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
				<!-- end right -->
			</div>
			<!-- end grid -->
		</div>
		<!-- end container -->
	</section>

	<!-- Testimonials Section-->
	<section class="py-20 bg-gray-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-12">
				<span
					class="inline-flex items-center px-3 py-1 text-xs font-medium bg-[#e6f6e7] text-[#2a7f3f] rounded-full mb-4"
				>
					<span class="w-2 h-2 bg-[#2a7f3f] rounded-full mr-2"></span>
					Student Success Stories
				</span>
				<h2 class="text-3xl sm:text-4xl lg:text-5xl text-gray-900 mb-2">
					Endorsed by <span class="text-gray-900">Universities</span>,
					<span class="text-[#2C3580]">Trusted</span> by Students
				</h2>
				<p class="text-lg text-gray-600 max-w-2xl mx-auto">
					We bridge the gap between aspiring students and global institutions. Our platform
					streamlines the recruitment process for schools while offering students a clear, guided,
					and personalized roadmap to international education.
				</p>
			</div>
			<div class="relative h-auto lg:h-[90vh] overflow-hidden">
				<div
					class="absolute top-0 left-0 z-10 w-full h-32 bg-gradient-to-b from-gray-50 to-transparent pointer-events-none"
				></div>

				<div class="flex flex-col lg:flex-row gap-8">
					<!-- column 1 -->
					<div class="w-full lg:w-1/2 flex flex-col gap-8 lg:mt-6">
						<div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex-shrink-0">
							<div class="mb-4 flex items-center space-x-3">
								<img
									src={victory}
									alt="Victory Testimonial"
									class="w-10 h-10 aspect-square rounded-full object-cover"
								/>

								<div>
									<h3 class="font-semibold text-gray-900 flex items-center">
										Victory Olorunfemi - Nigeria
										<span
											class="ml-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-3 w-3 text-white"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M5 13l4 4L19 7"
												/></svg
											>
										</span>
									</h3>
									<p class="text-sm text-gray-500">
										Applying for PhD Programs in Europe, USA and Canada
									</p>
								</div>
							</div>
							<p class="text-gray-700 text-sm">
								What I love most about the platform is the scholarship matcher. It seems so easy to
								use! I no longer have to randomly search for schools. Now, I just use the platform,
								pick a few options, and go with it. The Abroaducate team did a really great job, and
								I honestly pray they get more exposure.
							</p>
						</div>

						<div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex-shrink-0">
							<div class="mb-4 flex items-center space-x-3">
								<img
									src={chima}
									alt="chima Testimonial"
									class="w-10 h-10 aspect-square rounded-full object-cover"
								/>

								<div>
									<h3 class="font-semibold text-gray-900 flex items-center">
										Chima Okwuokei - Nigeria
										<span
											class="ml-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-3 w-3 text-white"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M5 13l4 4L19 7"
												/></svg
											>
										</span>
									</h3>
									<p class="text-sm text-gray-500">
										Applying for Masters & PhD Programs in Europe, USA and Canada
									</p>
								</div>
							</div>
							<p class="text-gray-700 text-sm">
								Before now, I had no idea what Abroaducate was. When I first came across it, it felt
								like a goldmine! The scholarship content is so well organized, and they offer so
								many free services to support your study abroad journey. I highly recommend this
								platform to anyone interested in studying abroad!
							</p>
						</div>
					</div>

					<!-- column 2 -->
					<div class="w-full lg:w-1/2 flex flex-col gap-8">
						<div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex-shrink-0">
							<div class="mb-4 flex items-center space-x-3">
								<img
									src={mojisola}
									alt="Mojisola_Testimonial"
									class="w-10 h-10 aspect-square rounded-full object-cover"
								/>
								<div>
									<h3 class="font-semibold text-gray-900 flex items-center">
										Mojisola Abosede - Nigeria
										<span
											class="ml-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-3 w-3 text-white"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M5 13l4 4L19 7"
												/></svg
											>
										</span>
									</h3>
									<p class="text-sm text-gray-500">Applying to schools in UK and US</p>
								</div>
							</div>
							<p class="text-gray-700 text-sm">
								Attending Abroaducate’s webinar was such an eye-opener. I gained so much clarity and
								felt more confident about taking the next steps in my study abroad plans.
							</p>
						</div>

						<div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex-shrink-0">
							<div class="mb-4 flex items-center space-x-3">
								<img
									src={ayomide}
									alt="Ayo"
									class="w-10 h-10 aspect-square rounded-full object-cover"
								/>
								<div>
									<h3 class="font-semibold text-gray-900 flex items-center">
										Ayomide Ojo - Nigeria
										<span
											class="ml-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-3 w-3 text-white"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M5 13l4 4L19 7"
												/></svg
											>
										</span>
									</h3>
									<p class="text-sm text-gray-500">Applying to Graduate Programs</p>
								</div>
							</div>
							<p class="text-gray-700 text-sm">
								Abroaducate made my whole study-abroad process so much easier. I used it to check my
								GPA, find schools that actually fit my profile, and even get a proper draft for my
								SOP. It saved me a lot of stress and time. I still double-checked everything myself,
								but it gave me a solid head start. Definitely worth trying.
							</p>
						</div>

						<div class="bg-white rounded-xl p-6 shadow-lg border border-gray-100 flex-shrink-0">
							<div class="mb-4 flex items-center space-x-3">
								<img src={david} class="w-10 h-10 rounded-full object-cover" />
								<div>
									<h3 class="font-semibold text-gray-900 flex items-center">
										David Daniel - Nigeria
										<span
											class="ml-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="h-3 w-3 text-white"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="3"
													d="M5 13l4 4L19 7"
												/></svg
											>
										</span>
									</h3>
									<p class="text-sm text-gray-500">Applying for Graduate Programs</p>
								</div>
							</div>
							<p class="text-gray-700 text-sm">
								The scholarship-matching feature is amazing — it quickly finds opportunities that
								fit my field, country, and funding needs. Abroaducate has made my application
								journey more organized and confident.
							</p>
						</div>
					</div>
				</div>

				<div
					class="absolute bottom-0 left-0 z-10 w-full h-32 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"
				></div>
			</div>
		</div>
	</section>

	<!-- FAQ Section -->
	<section class="bg-gray-50/50 antialiased">
		<div class="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
			<div class="text-center">
				<!-- Pill Tag -->
				<div
					class="inline-flex items-center gap-2 bg-lime-100 text-lime-800 text-sm px-4 py-1 rounded-full mb-4"
				>
					<span class="w-2 h-2 bg-lime-500 rounded-full"></span>
					Frequently asked question
				</div>

				<!-- Main Heading -->
				<h1 class="text-3xl sm:text-4xl lg:text-5xl tracking-tight text-gray-900">
					Before You <span class="text-[#2C3580]">Ask...</span>
				</h1>

				<!-- Subheading -->
				<p class="mt-6 max-w-2xl mx-auto text-lg text-gray-500">
					We've answered the most common questions so you can spend less time worrying and more time
					building your future.
				</p>

				<!-- Call-to-Action Link (styled as a button) -->
				<div class="mt-8 flex justify-center">
					<a
						href="/contact"
						class="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base rounded-full shadow-sm text-white bg-[#2C3580] hover:bg-[#3c4d9c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3c4d9c]"
					>
						Can't find your answer?
						<!-- Paper Plane Icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 -rotate-45"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
							/>
						</svg>
					</a>
				</div>
			</div>

			<!-- FAQ Grid -->
			<div class="mt-20">
				<!-- `items-start` prevents grid items from stretching -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
					{#each faqs as faq, index}
						<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
							<button onclick={() => toggleFAQ(index)} class="w-full text-left focus:outline-none">
								<div class="flex items-center justify-between gap-4">
									<h3 class="text-lg text-gray-900">{faq.question}</h3>
									<!-- Plus Icon -->
									<span
										class="text-3xl text-gray-400 font-light {openFAQ === index
											? 'transform rotate-45'
											: ''} transition-transform duration-300 flex-shrink-0"
									>
										+
									</span>
								</div>
							</button>

							<!-- Answer Panel -->
							{#if openFAQ === index}
								<div class="mt-4 text-gray-600 transition-all duration-300">
									<p>{faq.answer}</p>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-20">
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
					{#if session}
						<a
							href="/dashboard"
							class="inline-flex items-center gap-3 bg-white text-[#2C3580] font-semibold px-6 py-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-105"
						>
							Go to Your Dashboard
							<span class="bg-indigo-100 text-[#2C3580] p-1.5 rounded-full">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 transform -rotate-45"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M14 5l7 7m0 0l-7 7m7-7H3"
									/>
								</svg>
							</span>
						</a>
					{:else}
						<button
							onclick={showSignup}
							class="inline-flex items-center gap-3 bg-white text-[#2C3580] font-semibold px-6 py-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-105"
						>
							Get Started
							<span class="bg-indigo-100 text-[#2C3580] p-1.5 rounded-full">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 transform -rotate-45"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M14 5l7 7m0 0l-7 7m7-7H3"
									/>
								</svg>
							</span>
						</button>
					{/if}

					<a
						href="/pricing"
						class="inline-flex items-center gap-3 border-2 border-white/50 text-white font-semibold px-6 py-3 rounded-full transition-colors duration-300 hover:bg-white/10"
					>
						View Pricing
						<span class="bg-white/20 text-white p-1.5 rounded-full">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 transform -rotate-45"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								stroke-width="2"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
							</svg>
						</span>
					</a>
				</div>
			</div>
		</section>
	</div>

	<footer class="bg-[#1D245A] text-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 pb-14 pt-18">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
				<div>
					<div class="flex items-center space-x-3 mb-4">
						<img src="/logo-icon.svg" alt="Abroaducate" class="w-8 h-8" />
						<h3 class="text-2xl">Abroaducate</h3>
					</div>
					<p class="text-white">Your complete academic application platform powered by AI.</p>
				</div>

				<div class="md:border-l md:border-dashed md:border-white/20 md:pl-8">
					<h4 class="mb-4 tracking-wider text-white/40">PLATFORM</h4>
					<ul class="space-y-3 text-white">
						<li><a href="/blog" class="hover:text-white transition">Blog</a></li>
						<li><a href="/sop" class="hover:text-white transition">SOP Generator</a></li>
						<li>
							<a href="/universities" class="hover:text-white transition">University Search</a>
						</li>
						<li><a href="/scholarships" class="hover:text-white transition">Scholarships</a></li>
						<li><a href="/test-prep" class="hover:text-white transition">Test Prep</a></li>
						<li><a href="/academic-cv" class="hover:text-white transition">Academic CV</a></li>
					</ul>
				</div>

				<div class="md:border-l md:border-dashed md:border-white/20 md:pl-8">
					<h4 class="text-white/40 mb-4 tracking-wider">TOOLS & SUPPORT</h4>
					<ul class="space-y-3 text-white">
						<li><a href="/gpa-converter" class="hover:text-white transition">GPA Converter</a></li>
						<li>
							<a href="/visa-interview-practice" class="hover:text-white transition"
								>Visa Interview</a
							>
						</li>
						<li><a href="/pricing" class="hover:text-white transition">Pricing</a></li>
						<li><a href="/contact" class="hover:text-white transition">Contact Support</a></li>
						<li>
							<button
								class="hover:text-white transition bg-transparent border-none p-0 cursor-pointer text-left"
								onclick={handleManageApplications}
							>
								Dashboard
							</button>
						</li>
					</ul>
				</div>

				<div class="md:border-l md:border-dashed md:border-white/20 md:pl-8">
					<h4 class="text-white/40 mb-4 tracking-wider">CONNECT & FOLLOW</h4>
					<ul class="space-y-3 text-white">
						<li><a href="/privacy" class="hover:text-white transition">Privacy Policy</a></li>
						<li><a href="/terms" class="hover:text-white transition">Terms of Service</a></li>
						<li><a href="/cookies" class="hover:text-white transition">Cookie Policy</a></li>
					</ul>

					<h4 class="text-white/40 mt-6 mb-4 tracking-wider">SOCIALS</h4>
					<div class="flex items-center space-x-4">
						<!-- X (formerly Twitter) -->
						<a
							href="https://x.com/abroaducate"
							target="_blank"
							class="text-white hover:text-white transition"
							aria-label="Follow us on X"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path
									d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.26l-5.356-7.003-6.127 7.003H1.47l7.73-8.834L1 2.25h7.19l4.817 6.348L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.623H5.117l11.966 15.147Z"
								/>
							</svg>
						</a>

						<!-- LinkedIn -->
						<a
							href="https://linkedin.com/company/abroaducate"
							target="_blank"
							class="text-white hover:text-white transition"
							aria-label="Follow us on LinkedIn"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path
									fill-rule="evenodd"
									d="M19 0h-14C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM8 19H5V8h3v11zm-1.5-12.27c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76S8.25 4 8.25 4.97 7.47 6.73 6.5 6.73zM19 19h-3v-5.6c0-3.37-4-3.11-4 0V19h-3V8h3v1.77C13.4 7.18 19 7 19 12.25V19z"
									clip-rule="evenodd"
								/>
							</svg>
						</a>

						<!-- Facebook -->
						<a
							href="https://facebook.com/abroaducate"
							target="_blank"
							class="text-white hover:text-white transition"
							aria-label="Follow us on Facebook"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path
									d="M22.675 0h-21.35C.595 0 0 .595 0 1.326v21.348C0 23.405.595 24 1.325 24h11.495V14.708h-3.13v-3.622h3.13V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.311h3.587l-.467 3.622h-3.12V24h6.116C23.405 24 24 23.405 24 22.674V1.326C24 .595 23.405 0 22.675 0z"
								/>
							</svg>
						</a>

						<!-- Instagram -->
						<a
							href="https://instagram.com/abroaducate"
							target="_blank"
							class="text-white hover:text-white transition"
							aria-label="Follow us on Instagram"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path
									d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm4.25 3A5.75 5.75 0 1 1 6.25 12 5.75 5.75 0 0 1 12 6.5Zm0 1.5a4.25 4.25 0 1 0 4.25 4.25A4.25 4.25 0 0 0 12 8Zm5.25-.75a1.25 1.25 0 1 1 1.25-1.25 1.25 1.25 0 0 1-1.25 1.25Z"
								/>
							</svg>
						</a>

						<!-- YouTube -->
						<a
							href="https://youtube.com/@saheedkolawole"
							target="_blank"
							class="text-white hover:text-white transition"
							aria-label="Subscribe on YouTube"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path
									d="M23.498 6.186a2.97 2.97 0 0 0-2.09-2.1C19.56 3.5 12 3.5 12 3.5s-7.56 0-9.408.586a2.97 2.97 0 0 0-2.09 2.1A31.385 31.385 0 0 0 .5 12a31.385 31.385 0 0 0 .002 5.814 2.97 2.97 0 0 0 2.09 2.1C4.44 20.5 12 20.5 12 20.5s7.56 0 9.408-.586a2.97 2.97 0 0 0 2.09-2.1A31.385 31.385 0 0 0 23.5 12a31.385 31.385 0 0 0-.002-5.814ZM9.75 15.02V8.98l6 3.02-6 3.02Z"
								/>
							</svg>
						</a>

						<!-- Email -->
						<a
							href="mailto:support@abroaducate.com"
							class="text-white hover:text-white transition"
							aria-label="Send us an email"
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path
									d="M1.5 4.5h21a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75h-21A.75.75 0 0 1 .75 18.75V5.25a.75.75 0 0 1 .75-.75Zm10.5 8.318 9.144-5.743H3.356l8.644 5.743Zm-9.75 5.682h19.5V7.724l-9.75 6.48-9.75-6.48V18.5Z"
								/>
							</svg>
						</a>
					</div>
				</div>
			</div>

			<div
				class="border-t border-dashed border-white/20 mt-12 pt-8 pb-8 text-center text-white text-sm"
			>
				<p>&copy; {new Date().getFullYear()} Abroaducate. All rights reserved.</p>
			</div>
		</div>
	</footer>
</div>

<!-- Authentication Modal -->
<AuthenticationFlow bind:show={showAuthModal} {supabase} mode="signup" returnUrl="/dashboard" />

<style>
	/* Default: visible for SSR/no-JS. When JS boots, we add .js to <html> and then animate */
	.reveal {
		opacity: 1;
		transform: none;
		transition:
			opacity 300ms ease,
			transform 300ms ease;
	}
	/* Disable hide-on-load to avoid any flicker; we only add subtle transition */
	:global(html.js) .reveal {
		opacity: 1;
		transform: none;
	}
	/* Revealed state (new class) */
	:global(.revealed) {
		opacity: 1;
		transform: none;
	}
	/* Ensure hero never hides due to reveal class */
	#hero {
		opacity: 1 !important;
		transform: none !important;
	}
	/* Non-blocking enhancements */
	.fade-up {
		animation: fadeUp 420ms ease forwards;
	}
	@keyframes fadeUp {
		from {
			transform: translateY(6px);
			opacity: 0.98;
		}
		to {
			transform: none;
			opacity: 1;
		}
	}
	.grad-animate {
		background-size: 200% 200%;
		animation: gradShift 6s ease infinite;
	}
	@keyframes gradShift {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
	/* Journey line: base is always visible; animated overlay draws in */
	.line-base,
	.line-anim {
		position: absolute;
		left: 0;
		right: 0;
		height: 6px;
		border-radius: 9999px;
	}
	.line-base {
		background: linear-gradient(90deg, #93c5fd, #86efac, #c4b5fd);
		opacity: 0.7;
	}
	.line-anim {
		background: linear-gradient(90deg, #93c5fd, #86efac, #c4b5fd);
		width: 0%;
		opacity: 1;
		transition: width 800ms ease;
	}
	:global(.drawn) .line-anim {
		width: 100%;
	}
	@media (prefers-reduced-motion: reduce) {
		.reveal,
		:global(html.js) .reveal {
			opacity: 1;
			transform: none;
			transition: none;
		}
		.fade-up,
		.grad-animate {
			animation: none;
		}
	}
	/* Scroll progress bar */
	.progress-bar {
		position: fixed;
		top: 0;
		left: 0;
		height: 3px;
		background: linear-gradient(90deg, #3b82f6, #a855f7);
		z-index: 9999;
		transform-origin: 0 0;
	}
	/* Button/Card hovers */
	.hover-elevate {
		transition:
			transform 160ms ease,
			box-shadow 160ms ease;
	}
	.hover-elevate:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 20px rgba(2, 6, 23, 0.12);
	}
	/* .link-underline declared when needed */
</style>
