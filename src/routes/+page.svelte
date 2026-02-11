<script lang="ts">
	import { goto } from '$app/navigation';
	import victory from '$lib/images/victory_testimonial.png';
	import mojisola from '$lib/images/mojisola_testimonial.png';
	import david from '$lib/images/david_testimonial.png';
	import chima from '$lib/images/chima_testimonial.png';
	import ayomide from '$lib/images/ayomide_testimonial.png';

	import heroIllustration from '$lib/images/illustrations/hero-study-abroad.png';
	import step1Illustration from '$lib/images/illustrations/step-1-explore.png';
	import step2Illustration from '$lib/images/illustrations/step-2-plan.png';
	import step3Illustration from '$lib/images/illustrations/step-3-reward.png';
	import benefitMatchingIllustration from '$lib/images/illustrations/benefit-matching.png';
	import benefitDocumentsIllustration from '$lib/images/illustrations/benefit-documents.png';
	import benefitSupportIllustration from '$lib/images/illustrations/benefit-support.png';
	import ctaRoadmapIllustration from '$lib/images/illustrations/cta-roadmap.png';

	let { data } = $props();
	let { session } = $derived(data);
	
	let openFAQ = $state<number | null>(null);
	let finderLocation = $state('');
	let finderLevel = $state<'bachelors' | 'masters' | 'phd' | 'graduate' | ''>('');
	let finderField = $state('');

	function toggleFAQ(index: number) {
		openFAQ = openFAQ === index ? null : index;
	}

	function goToUniversityFinder() {
		const params = new URLSearchParams();
		if (finderLocation.trim()) params.set('country', finderLocation.trim());
		if (finderLevel) params.set('degree_level', finderLevel);
		if (finderField.trim()) params.set('field', finderField.trim());
		params.set('autosearch', '1');
		goto(`/universities?${params.toString()}`);
	}

	function goToPlan() {
		// Plan requires login; send anonymous users to signup with a return path.
		if (session?.user) {
			goto('/plan');
		} else {
			goto('/auth?signup=true&source=home&next=/plan');
		}
	}

	const faqs = [
		{
			question: 'What is Abroaducate?',
			answer: "Abroaducate is your AI-powered study abroad planner. Get a ranked shortlist (scholarships + universities), step-by-step application guidance, and a timeline so you know what to do next."
		},
		{
			question: 'Is Abroaducate really free to start?',
			answer: 'Yes. You can browse scholarships and universities for free, and generate a basic plan preview. Upgrade only when you want the full Strategy Pack (full ranking + explanations + timelines/reminders).'
		},
		{
			question: 'How does the Strategy Pack work?',
			answer: "In about 60 seconds, you tell us your degree level, field, GPA range, and preferred countries. We generate your Strategy Pack: ranked scholarships, a safety/target/reach university plan, and a simple timeline of next steps."
		},
		{
			question: 'What documents can you help me create?',
			answer: 'We offer AI-powered generation for Statement of Purpose (SOP), Cover Letters, Personal Statements, and Academic CVs. Free users get 4 documents per month. Professional plan ($12/mo) includes 50 documents monthly, while Elite plan ($29/mo) offers unlimited document generation.'
		},
		{
			question: 'Which countries and universities do you support?',
			answer: 'We support 1,500+ universities across the US, UK, Canada, Australia, Germany, and other major study abroad destinations. Our database includes top-tier institutions and tracks 500+ scholarship opportunities. We also support 40+ international grading systems for GPA conversion.'
		},
		{
			question: 'Do you offer test preparation?',
			answer: 'Yes! We provide completely free IELTS test preparation including Reading, Listening, Writing, and Speaking practice tests. All users get unlimited access to test prep materials regardless of subscription plan.'
		},
		{
			question: 'How is this different from traditional consultants?',
			answer: 'Traditional consultants charge $500-$3,000+ for limited, one-time services. Abroaducate gives you 24/7 AI assistance, comprehensive tools, personalized guidance, and continuous support starting at just $12/month. Our free tier lets you test everything before upgrading.'
		},
		{
			question: 'Can I track my application progress?',
			answer: 'Absolutely! Our platform includes application tracking, document checklists, deadline management, and progress monitoring. You can manage multiple university applications and scholarship deadlines all in one place.'
		}
	];

	// Popular study destinations (Unsplash; container has fallback gradient if image fails)
	const popularCountries = [
		{ name: 'United States', slug: 'united-states', code: 'US', image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&h=600&fit=crop' },
		{ name: 'United Kingdom', slug: 'united-kingdom', code: 'UK', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop' },
		{ name: 'Canada', slug: 'canada', code: 'CA', image: 'https://images.unsplash.com/photo-1519832979-6fa011b87667?w=800&h=600&fit=crop' },
		{ name: 'Australia', slug: 'australia', code: 'AU', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop' },
		{ name: 'Germany', slug: 'germany', code: 'DE', image: 'https://images.unsplash.com/photo-1560930950-5cc20e80e392?w=800&h=600&fit=crop' },
		{ name: 'Netherlands', slug: 'netherlands', code: 'NL', image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=600&fit=crop' }
	];

	// Popular fields of study
	const popularFields = [
		'Computer Science', 'Business Administration', 'Engineering',
		'Data Science', 'Medicine', 'Psychology',
		'Law', 'Economics', 'Biology',
		'Architecture', 'Marketing', 'Finance'
	];

</script>

<svelte:head>
	<title>Abroaducate - Your AI Study Abroad Guide</title>
	<meta
		name="description"
		content="Get your Strategy Pack: a ranked shortlist of scholarships and universities, step-by-step application guidance, and a timeline of what to do next. Free to start."
	/>
</svelte:head>

<!-- HERO SECTION -->
<section class="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white pt-24 pb-16 px-6">
	<div class="pointer-events-none absolute inset-0">
		<div class="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl"></div>
		<div class="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl"></div>
	</div>
	<div class="max-w-7xl mx-auto">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
			<!-- Left: Text Content -->
			<div class="text-center lg:text-left">
				<div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
					<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
					Ranked shortlist + timeline — free to start
				</div>
				<h1 class="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
					Get your study abroad plan in minutes
				</h1>
				<p class="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
					Start with a free Plan (our quick diagnostic), then get your Strategy Pack: a ranked shortlist (scholarships + universities), step-by-step guidance, and a simple timeline—built from your profile.
				</p>

				<!-- Primary CTA -->
				<div class="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start mb-6">
					<a
						href="/diagnostic"
						class="inline-flex items-center justify-center bg-[#2C3580] hover:bg-[#3c4d9c] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-indigo-900/10 transition-all duration-300 transform hover:scale-[1.02]"
					>
						Get my free plan
					</a>
					<button
						type="button"
						onclick={goToPlan}
						class="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-[#2C3580] font-semibold text-lg px-8 py-4 rounded-xl border-2 border-[#2C3580] transition-all duration-300"
					>
						Open Strategy Pack
					</button>
				</div>
				<div class="text-sm text-slate-600">
					Already exploring? <a href="/scholarships" class="font-semibold text-[#2C3580] hover:underline">Browse scholarships</a>.
				</div>

				<!-- University/Program Finder (Studee-style, adapted to Abroaducate) -->
				<form
					class="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur"
					onsubmit={(e) => { e.preventDefault(); goToUniversityFinder(); }}
				>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
						<div>
							<label for="finder-location" class="block text-xs font-semibold text-slate-600 mb-1">Destination</label>
							<input
								id="finder-location"
								type="text"
								bind:value={finderLocation}
								placeholder="e.g., United States"
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C3580]/30"
							/>
						</div>
						<div>
							<label for="finder-level" class="block text-xs font-semibold text-slate-600 mb-1">Level</label>
							<select
								id="finder-level"
								bind:value={finderLevel}
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C3580]/30"
							>
								<option value="">All levels</option>
								<option value="bachelors">Bachelor's</option>
								<option value="masters">Master's</option>
								<option value="phd">PhD</option>
								<option value="graduate">Graduate</option>
							</select>
						</div>
						<div>
							<label for="finder-field" class="block text-xs font-semibold text-slate-600 mb-1">Field</label>
							<input
								id="finder-field"
								type="text"
								bind:value={finderField}
								placeholder="e.g., Engineering"
								class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2C3580]/30"
							/>
						</div>
					</div>
					<div class="mt-3 flex items-center justify-between gap-3">
						<p class="text-xs text-slate-500">
							Tip: add your GPA inside the matcher for smarter results.
						</p>
						<button
							type="submit"
							class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
						>
							Find universities
						</button>
					</div>
				</form>

				<!-- Trust Indicators -->
				<div class="flex items-center justify-center lg:justify-start gap-4 mt-6">
					<div class="flex -space-x-2">
						<img src={victory} alt="Student testimonial" class="w-10 h-10 rounded-full border-2 border-white object-cover" />
						<img src={mojisola} alt="Student testimonial" class="w-10 h-10 rounded-full border-2 border-white object-cover" />
						<img src={david} alt="Student testimonial" class="w-10 h-10 rounded-full border-2 border-white object-cover" />
						<img src={chima} alt="Student testimonial" class="w-10 h-10 rounded-full border-2 border-white object-cover" />
						<img src={ayomide} alt="Student testimonial" class="w-10 h-10 rounded-full border-2 border-white object-cover" />
					</div>
					<div class="text-left">
						<div class="text-sm font-semibold text-gray-900">Trusted by 10,000+ students</div>
						<div class="flex items-center gap-1 text-sm text-gray-600">
							<span class="flex items-center gap-0.5 text-amber-500" aria-label="5 out of 5 stars">
								<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.809c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"/></svg>
								<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.809c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"/></svg>
								<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.809c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"/></svg>
								<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.809c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"/></svg>
								<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.809c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"/></svg>
							</span>
							<span>500+ scholarships tracked</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Right: Hero Illustration -->
			<div class="relative">
				<div class="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/40 via-violet-200/30 to-emerald-100/20 blur-2xl"></div>
				<div class="relative">
					<img
						src={heroIllustration}
						alt="A student planning their study abroad journey with guidance and scholarships"
						class="w-full max-h-[520px] object-contain drop-shadow-[0_25px_60px_rgba(15,23,42,0.18)]"
						loading="eager"
					/>

					<!-- Floating mini-cards (integrated, no big box) -->
					<div class="float-card hidden md:block absolute -left-2 top-10 rounded-2xl bg-white/90 backdrop-blur border border-slate-200 px-4 py-3 shadow-md">
						<div class="text-xs font-semibold text-slate-500">Scholarships</div>
						<div class="text-sm font-bold text-slate-900">500+ tracked</div>
					</div>
					<div class="float-card float-card-slow hidden md:block absolute -right-2 bottom-10 rounded-2xl bg-white/90 backdrop-blur border border-slate-200 px-4 py-3 shadow-md">
						<div class="text-xs font-semibold text-slate-500">Documents</div>
						<div class="text-sm font-bold text-slate-900">4/mo free</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- STRATEGY PACK PREVIEW -->
<section class="bg-white py-16 px-6">
	<div class="max-w-7xl mx-auto">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
			<div class="text-center lg:text-left">
				<div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
					<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
					Your Strategy Pack (Plan-first)
				</div>
				<h2 class="mt-6 text-3xl md:text-4xl font-bold text-slate-900">
					Everything you need—on one page
				</h2>
				<p class="mt-3 text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
					Your free Plan is the quick diagnostic. Your Strategy Pack (Plan) is the saved, upgradable version with ranking, playbooks, and timelines—so you always know what to do next.
				</p>

				<div class="mt-6 grid gap-3 text-left max-w-xl mx-auto lg:mx-0">
					<div class="flex items-start gap-3">
						<div class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
							<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5" />
							</svg>
						</div>
						<div class="text-slate-700"><strong>Ranked matches</strong> for scholarships and universities</div>
					</div>
					<div class="flex items-start gap-3">
						<div class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
							<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5" />
							</svg>
						</div>
						<div class="text-slate-700"><strong>Step-by-step playbooks</strong> that explain how to apply</div>
					</div>
					<div class="flex items-start gap-3">
						<div class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
							<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5" />
							</svg>
						</div>
						<div class="text-slate-700"><strong>Timeline</strong> so you don’t miss deadlines</div>
					</div>
				</div>

				<div class="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
					<button
						type="button"
						onclick={goToPlan}
						class="inline-flex items-center justify-center bg-[#2C3580] hover:bg-[#3c4d9c] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-indigo-900/10 transition-all duration-300 transform hover:scale-[1.02]"
					>
						Generate my plan
					</button>
					<a
						href="/pricing"
						class="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-[#2C3580] font-semibold text-lg px-8 py-4 rounded-xl border-2 border-[#2C3580] transition-all duration-300"
					>
						View pricing
					</a>
				</div>
			</div>

			<!-- Visual preview (lightweight mock) -->
			<div class="relative">
				<div class="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/35 via-violet-200/25 to-emerald-100/15 blur-2xl"></div>
				<div class="relative rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm">
					<div class="flex items-center justify-between">
						<div class="text-sm font-semibold text-slate-700">Strategy Pack preview</div>
						<div class="text-xs text-slate-500">Top picks + timeline</div>
					</div>

					<div class="mt-4 grid grid-cols-1 gap-3">
						<div class="rounded-2xl border border-slate-200 bg-white p-4">
							<div class="text-xs font-semibold text-slate-500">Top scholarships</div>
							<div class="mt-2 space-y-2">
								<div class="flex items-center justify-between text-sm">
									<span class="font-semibold text-slate-900">Scholarship A</span>
									<span class="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 text-xs font-semibold">92% match</span>
								</div>
								<div class="flex items-center justify-between text-sm">
									<span class="font-semibold text-slate-900">Scholarship B</span>
									<span class="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 text-xs font-semibold">84% match</span>
								</div>
								<div class="flex items-center justify-between text-sm">
									<span class="font-semibold text-slate-900">Scholarship C</span>
									<span class="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 text-xs font-semibold">79% match</span>
								</div>
							</div>
						</div>

						<div class="rounded-2xl border border-slate-200 bg-white p-4">
							<div class="text-xs font-semibold text-slate-500">University plan</div>
							<div class="mt-2 grid grid-cols-3 gap-2 text-xs">
								<div class="rounded-xl border border-emerald-100 bg-emerald-50 px-2 py-2 text-emerald-800 font-semibold text-center">Safety</div>
								<div class="rounded-xl border border-sky-100 bg-sky-50 px-2 py-2 text-sky-800 font-semibold text-center">Target</div>
								<div class="rounded-xl border border-amber-100 bg-amber-50 px-2 py-2 text-amber-800 font-semibold text-center">Reach</div>
							</div>
						</div>

						<div class="rounded-2xl border border-slate-200 bg-white p-4">
							<div class="text-xs font-semibold text-slate-500">Next steps</div>
							<div class="mt-2 space-y-2 text-sm text-slate-700">
								<div class="flex items-start justify-between gap-3">
									<span>Draft SOP for University X</span>
									<span class="text-xs text-slate-500 whitespace-nowrap">This week</span>
								</div>
								<div class="flex items-start justify-between gap-3">
									<span>Apply to Scholarship A</span>
									<span class="text-xs text-slate-500 whitespace-nowrap">14 days</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- STATS BAR -->
<section class="bg-white py-10 px-6">
	<div class="max-w-7xl mx-auto">
		<div class="rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-6 py-8">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
				<div class="rounded-2xl bg-white/70 border border-slate-200 p-4">
					<div class="text-3xl font-bold text-slate-900 mb-1">10,000+</div>
					<div class="text-slate-600 text-sm">Students Guided</div>
				</div>
				<div class="rounded-2xl bg-white/70 border border-slate-200 p-4">
					<div class="text-3xl font-bold text-slate-900 mb-1">1,500+</div>
					<div class="text-slate-600 text-sm">Universities</div>
				</div>
				<div class="rounded-2xl bg-white/70 border border-slate-200 p-4">
					<div class="text-3xl font-bold text-slate-900 mb-1">500+</div>
					<div class="text-slate-600 text-sm">Scholarships</div>
				</div>
				<div class="rounded-2xl bg-white/70 border border-slate-200 p-4">
					<div class="text-3xl font-bold text-slate-900 mb-1">Free</div>
					<div class="text-slate-600 text-sm">IELTS Test Prep</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- HOW IT WORKS - 3 STEPS -->
<section class="bg-white py-20 px-6 overflow-hidden">
	<div class="max-w-7xl mx-auto">
		<!-- Section Header -->
		<div class="text-center mb-16">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Plan → Strategy Pack → Applications
			</h2>
		</div>

		<!-- Steps Grid: uniform illustration size + staggered fade-in -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-12">
			<!-- Step 1: Free plan -->
			<div class="home-step-card text-center group" style="animation-delay: 0ms;">
				<div class="mb-6 flex justify-center">
					<div class="step-illustration-box relative w-32 h-32 flex items-center justify-center">
						<div class="absolute inset-0 rounded-full bg-indigo-100 blur-xl"></div>
						<img
							src={step1Illustration}
							alt="Get your roadmap"
							class="relative w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
							loading="lazy"
						/>
					</div>
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Get your free plan</h3>
				<p class="text-gray-600 leading-relaxed mb-4">
					Answer a few questions to get pathway + funding guidance and a preview of what to do next.
				</p>
				<a href="/diagnostic" class="inline-block text-indigo-600 font-semibold hover:text-indigo-700">
					Start →
				</a>
			</div>

			<!-- Step 2: Strategy Pack -->
			<div class="home-step-card text-center group" style="animation-delay: 150ms;">
				<div class="mb-6 flex justify-center">
					<div class="step-illustration-box relative w-32 h-32 flex items-center justify-center">
						<div class="absolute inset-0 rounded-full bg-violet-100 blur-xl"></div>
						<img
							src={step2Illustration}
							alt="Open your Strategy Pack"
							class="relative w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
							loading="lazy"
						/>
					</div>
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Open your Strategy Pack</h3>
				<p class="text-gray-600 leading-relaxed mb-4">
					Save your plan and unlock ranked scholarships, a university plan, and a timeline.
				</p>
				<button type="button" onclick={goToPlan} class="inline-block text-indigo-600 font-semibold hover:text-indigo-700">
					Generate my plan →
				</button>
			</div>

			<!-- Step 3: Apply with confidence -->
			<div class="home-step-card text-center group" style="animation-delay: 300ms;">
				<div class="mb-6 flex justify-center">
					<div class="step-illustration-box relative w-32 h-32 flex items-center justify-center">
						<div class="absolute inset-0 rounded-full bg-emerald-100 blur-xl"></div>
						<img
							src={step3Illustration}
							alt="Apply with confidence"
							class="relative w-full h-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
							loading="lazy"
						/>
					</div>
				</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Apply with confidence</h3>
				<p class="text-gray-600 leading-relaxed mb-4">
					Follow step-by-step playbooks (“how to apply”), create documents, and track deadlines.
				</p>
				<a href="/scholarships" class="inline-block text-indigo-600 font-semibold hover:text-indigo-700">
					Explore opportunities →
				</a>
			</div>
		</div>

		<!-- Support Message -->
		<div class="text-center mt-12">
			<p class="text-gray-600">
				Free to start, upgrade only when you need more. Cancel anytime.
			</p>
		</div>
	</div>
</section>

<!-- PLATFORM QUICK LINKS -->
<section class="bg-white py-20 px-6">
	<div class="max-w-7xl mx-auto">
		<div class="text-center mb-12">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Start here
			</h2>
			<p class="text-lg text-gray-600 max-w-3xl mx-auto">
				Keep it simple: start with the Plan, then open your Strategy Pack.
			</p>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			<a href="/diagnostic" class="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-indigo-300 hover:shadow-md transition">
				<div class="flex items-start gap-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
						<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4" />
						</svg>
					</div>
					<div>
						<div class="font-semibold text-gray-900 group-hover:text-emerald-700">Get your free plan</div>
						<div class="mt-1 text-sm text-gray-600">Take the diagnostic and get your next steps.</div>
					</div>
				</div>
			</a>

			<button type="button" onclick={goToPlan} class="text-left group rounded-2xl border border-slate-200 bg-white p-6 hover:border-indigo-300 hover:shadow-md transition">
				<div class="flex items-start gap-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
						<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 11l3 3L22 4" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h11" />
						</svg>
					</div>
					<div>
						<div class="font-semibold text-gray-900 group-hover:text-indigo-700">Open your Strategy Pack</div>
						<div class="mt-1 text-sm text-gray-600">Save your plan and unlock ranking + timelines.</div>
					</div>
				</div>
			</button>

			<a href="/scholarships" class="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-indigo-300 hover:shadow-md transition">
				<div class="flex items-start gap-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
						<svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 2l2.7 6.2L22 9.2l-5.4 4.3 1.7 6.5L12 16.9 5.7 20l1.7-6.5L2 9.2l7.3-1 2.7-6.2z" />
						</svg>
					</div>
					<div>
						<div class="font-semibold text-gray-900 group-hover:text-indigo-700">Browse scholarships</div>
						<div class="mt-1 text-sm text-gray-600">Search 500+ funding opportunities.</div>
					</div>
				</div>
			</a>
		</div>
	</div>
</section>

<!-- BENEFITS SECTION -->
<section class="bg-gray-50 py-20 px-6">
	<div class="max-w-7xl mx-auto">
		<div class="text-center mb-16">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Everything you need in one platform
			</h2>
			<p class="text-lg text-gray-600 max-w-3xl mx-auto">
				From finding scholarships to creating documents, we guide you through every step of your study abroad journey
			</p>
		</div>

		<!-- Benefit 1: Scholarship & Opportunity Matching -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
			<div class="order-2 lg:order-1">
				<h3 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
					Find scholarships & opportunities
				</h3>
				<p class="text-gray-600 mb-6 leading-relaxed">
					Our AI-powered diagnostic tool analyzes your profile and matches you with the best funding opportunities
				</p>
				<ul class="space-y-3">
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-gray-700"><strong>500+ scholarships</strong> tracked across major study destinations</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-gray-700"><strong>Personalized matching</strong> based on your GPA, field, and goals</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-gray-700"><strong>Eligibility checking</strong> before you apply - save time and money</span>
					</li>
				</ul>
			</div>
			<div class="order-1 lg:order-2">
				<div class="relative">
					<div class="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/40 via-sky-100/30 to-white blur-2xl"></div>
					<img
						src={benefitDocumentsIllustration}
						alt="AI-powered matching and recommendations"
						class="relative w-full max-h-[460px] object-contain drop-shadow-[0_25px_60px_rgba(15,23,42,0.14)]"
						loading="lazy"
					/>
				</div>
			</div>
		</div>

		<!-- Benefit 2: AI Document Creation -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
			<div>
				<div class="relative">
					<div class="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-violet-200/40 via-pink-100/25 to-white blur-2xl"></div>
					<img
						src={benefitMatchingIllustration}
						alt="Document creation and AI assistance"
						class="relative w-full max-h-[460px] object-contain drop-shadow-[0_25px_60px_rgba(15,23,42,0.14)]"
						loading="lazy"
					/>
				</div>
			</div>
			<div>
				<h3 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
					AI-powered document creation
				</h3>
				<p class="text-gray-600 mb-6 leading-relaxed">
					Create professional application documents in minutes with our AI assistant
				</p>
				<ul class="space-y-3">
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-gray-700"><strong>Smart generation</strong> for SOPs, cover letters, CVs, and personal statements</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-gray-700"><strong>AI review & enhancement</strong> with instant feedback</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-gray-700"><strong>Free tier included</strong> - 4 documents per month on Starter plan</span>
					</li>
				</ul>
			</div>
		</div>

		<!-- Benefit 3: Complete Guidance -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
			<div class="order-2 lg:order-1">
				<h3 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
					Guided support every step
				</h3>
				<p class="text-gray-600 mb-6 leading-relaxed">
					From test prep to application tracking, we're with you throughout your journey
				</p>
				<ul class="space-y-3">
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-gray-700"><strong>Free IELTS prep</strong> with unlimited practice tests</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-gray-700"><strong>Application tracking</strong> with document checklists and deadlines</span>
					</li>
					<li class="flex items-start gap-3">
						<svg class="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
						</svg>
						<span class="text-gray-700"><strong>GPA converter & calculators</strong> for international standards</span>
					</li>
				</ul>
			</div>
			<div class="order-1 lg:order-2">
				<div class="relative">
					<div class="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-emerald-200/30 via-teal-100/25 to-white blur-2xl"></div>
					<img
						src={benefitSupportIllustration}
						alt="Guidance and support through every step"
						class="relative w-full max-h-[460px] object-contain drop-shadow-[0_25px_60px_rgba(15,23,42,0.14)]"
						loading="lazy"
					/>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- PRICING PREVIEW -->
<section class="bg-white py-20 px-6">
	<div class="max-w-7xl mx-auto">
		<div class="text-center mb-12">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Simple pricing
			</h2>
			<p class="text-lg text-gray-600 max-w-3xl mx-auto">
				Start with the free Plan. Upgrade only when you want the full Strategy Pack and higher limits.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
			<!-- Starter -->
			<div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
				<div class="text-sm font-semibold text-slate-600">Starter</div>
				<div class="mt-2 flex items-end gap-2">
					<div class="text-4xl font-bold text-slate-900">$0</div>
					<div class="text-sm text-slate-500">/month</div>
				</div>
				<p class="mt-3 text-slate-600">
					Get your Plan and explore scholarships and universities.
				</p>
				<ul class="mt-6 space-y-3 text-sm text-slate-700">
					<li class="flex gap-2"><span class="text-emerald-600 font-bold">✓</span>Free diagnostic plan</li>
					<li class="flex gap-2"><span class="text-emerald-600 font-bold">✓</span>Browse scholarships + universities</li>
					<li class="flex gap-2"><span class="text-emerald-600 font-bold">✓</span>Basic tools (docs/test prep/tracking)</li>
				</ul>
				<a
					href="/diagnostic"
					class="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#2C3580] px-6 py-3 text-base font-bold text-white hover:bg-[#3c4d9c] transition"
				>
					Get free plan
				</a>
			</div>

			<!-- Professional -->
			<div class="relative rounded-3xl border-2 border-[#2C3580] bg-gradient-to-b from-indigo-50 via-white to-white p-8 shadow-md">
				<div class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2C3580] px-4 py-1 text-xs font-bold text-white shadow">
					Most popular
				</div>
				<div class="text-sm font-semibold text-slate-700">Professional</div>
				<div class="mt-2 flex items-end gap-2">
					<div class="text-4xl font-bold text-slate-900">$12</div>
					<div class="text-sm text-slate-500">/month</div>
				</div>
				<p class="mt-3 text-slate-600">
					Unlock deeper intelligence and higher limits.
				</p>
				<ul class="mt-6 space-y-3 text-sm text-slate-700">
					<li class="flex gap-2"><span class="text-emerald-600 font-bold">✓</span>More ranked matches + previews</li>
					<li class="flex gap-2"><span class="text-emerald-600 font-bold">✓</span>Stronger document tools + higher limits</li>
					<li class="flex gap-2"><span class="text-emerald-600 font-bold">✓</span>Better reminders and tracking</li>
				</ul>
				<a
					href="/pricing"
					class="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#2C3580] px-6 py-3 text-base font-bold text-white hover:bg-[#3c4d9c] transition"
				>
					See plans
				</a>
				<p class="mt-3 text-center text-xs text-slate-500">Cancel anytime.</p>
			</div>

			<!-- Elite -->
			<div class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
				<div class="text-sm font-semibold text-slate-600">Elite</div>
				<div class="mt-2 flex items-end gap-2">
					<div class="text-4xl font-bold text-slate-900">$29</div>
					<div class="text-sm text-slate-500">/month</div>
				</div>
				<p class="mt-3 text-slate-600">
					For high-stakes applications needing priority support.
				</p>
				<ul class="mt-6 space-y-3 text-sm text-slate-700">
					<li class="flex gap-2"><span class="text-emerald-600 font-bold">✓</span>Highest limits + priority features</li>
					<li class="flex gap-2"><span class="text-emerald-600 font-bold">✓</span>Human-touch support (priority advisory)</li>
					<li class="flex gap-2"><span class="text-emerald-600 font-bold">✓</span>Fast support response time</li>
				</ul>
				<a
					href="/pricing"
					class="mt-8 inline-flex w-full items-center justify-center rounded-xl border-2 border-[#2C3580] bg-white px-6 py-3 text-base font-bold text-[#2C3580] hover:bg-slate-50 transition"
				>
					View Elite
				</a>
			</div>
		</div>

		<div class="text-center mt-10">
			<a href="/pricing" class="text-indigo-600 font-semibold hover:text-indigo-700">
				See full pricing details →
			</a>
		</div>
	</div>
</section>

<!-- POPULAR DESTINATIONS -->
<section class="bg-white py-20 px-6">
	<div class="max-w-7xl mx-auto">
		<div class="text-center mb-12">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Popular study destinations
			</h2>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Explore opportunities in top countries for international students
			</p>
		</div>
		
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
			{#each popularCountries as country}
				<a
					href={`/scholarships?country=${country.slug}`}
					class="destination-card group block rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
				>
					<div class="aspect-[4/3] min-h-[100px] relative overflow-hidden bg-gradient-to-br from-indigo-700 to-slate-800">
						<img
							src={country.image}
							alt=""
							class="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
							loading="lazy"
							onerror={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
						/>
						<!-- Slim gradient at bottom so image dominates; label in a thin bar -->
						<div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none"></div>
						<div class="absolute bottom-0 left-0 right-0 py-2 px-2 text-center pointer-events-none">
							<span class="text-white text-sm font-bold tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{country.name}</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
		
		<div class="text-center mt-10">
			<a href="/scholarships" class="inline-flex items-center gap-2 text-[#2C3580] font-semibold hover:text-[#3c4d9c] transition-colors">
				View all destinations
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
			</a>
		</div>
	</div>
</section>

<!-- POPULAR FIELDS -->
<section class="bg-gray-50 py-20 px-6">
	<div class="max-w-7xl mx-auto">
		<div class="text-center mb-12">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Popular fields of study
			</h2>
			<p class="text-lg text-gray-600">
				Find scholarships and programs in your field
			</p>
		</div>
		
		<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{#each popularFields as field}
				<a
					href={`/scholarships?field=${encodeURIComponent(field)}`}
					class="bg-white hover:bg-indigo-50 rounded-lg p-4 text-center font-medium text-gray-700 hover:text-indigo-600 transition-all duration-300 border border-gray-200 hover:border-indigo-300"
				>
					{field}
				</a>
			{/each}
		</div>
		
		<div class="text-center mt-8">
			<a href="/scholarships" class="text-indigo-600 font-semibold hover:text-indigo-700">
				Explore all fields →
			</a>
		</div>
	</div>
</section>

<!-- CTA SECTION -->
<section class="bg-white py-20 px-6">
	<div class="max-w-7xl mx-auto">
		<div class="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-6 py-10 md:px-10">
			<div class="pointer-events-none absolute inset-0">
				<div class="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-200/35 blur-3xl"></div>
				<div class="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-violet-200/25 blur-3xl"></div>
			</div>

			<div class="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
				<div class="text-center lg:text-left">
					<div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
						<span class="h-2 w-2 rounded-full bg-emerald-500"></span>
						Free to start • upgrade only when needed
					</div>

					<h2 class="mt-6 text-3xl md:text-4xl font-bold text-slate-900">
						Ready to start your study abroad journey?
					</h2>
					<p class="mt-3 text-lg text-slate-600 max-w-xl">
						Start with your free Plan, then open your Strategy Pack to get ranked matches, timelines, and next steps.
					</p>

					<div class="mt-6 grid gap-3 text-left max-w-xl mx-auto lg:mx-0">
						<div class="flex items-start gap-3">
							<div class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
								<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5" />
								</svg>
							</div>
							<div class="text-slate-700"><strong>Discover</strong> scholarships and funding pathways you qualify for</div>
						</div>
						<div class="flex items-start gap-3">
							<div class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
								<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5" />
								</svg>
							</div>
							<div class="text-slate-700"><strong>Get guided steps</strong> based on your GPA, field, and target countries</div>
						</div>
						<div class="flex items-start gap-3">
							<div class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
								<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5" />
								</svg>
							</div>
							<div class="text-slate-700"><strong>Create stronger documents</strong> with AI-powered SOP/CV/letters</div>
						</div>
					</div>

					<div class="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
						<a
							href="/diagnostic"
							class="inline-flex items-center justify-center bg-[#2C3580] hover:bg-[#3c4d9c] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-indigo-900/10 transition-all duration-300 transform hover:scale-[1.02]"
						>
							Get my free plan
						</a>
						<button
							type="button"
							onclick={goToPlan}
							class="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-[#2C3580] font-semibold text-lg px-8 py-4 rounded-xl border-2 border-[#2C3580] transition-all duration-300"
						>
							Open Strategy Pack
						</button>
					</div>
				</div>

				<div class="relative">
					<div class="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/40 via-violet-200/25 to-white blur-2xl"></div>
					<img
						src={ctaRoadmapIllustration}
						alt="A personalized plan with study abroad milestones"
						class="relative w-full max-h-[320px] object-contain drop-shadow-[0_25px_60px_rgba(15,23,42,0.16)]"
						loading="lazy"
					/>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- TESTIMONIALS -->
<section class="bg-white py-20 px-6">
	<div class="max-w-7xl mx-auto">
		<div class="text-center mb-12">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Trusted by students worldwide
			</h2>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Join thousands of students who've successfully used Abroaducate for their study abroad journey
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<div class="bg-gray-50 rounded-xl p-6 border border-gray-100">
				<div class="flex items-center gap-3 mb-4">
					<img src={victory} alt="Victory testimonial" class="w-12 h-12 rounded-full object-cover" />
					<div>
						<h4 class="font-semibold text-gray-900">Victory Olorunfemi</h4>
						<p class="text-sm text-gray-500">Nigeria → PhD Programs</p>
					</div>
				</div>
				<p class="text-gray-700 text-sm leading-relaxed">
					"The scholarship matcher made everything so easy! I no longer have to randomly search. The platform did a great job - highly recommend!"
				</p>
			</div>

			<div class="bg-gray-50 rounded-xl p-6 border border-gray-100">
				<div class="flex items-center gap-3 mb-4">
					<img src={ayomide} alt="Ayomide testimonial" class="w-12 h-12 rounded-full object-cover" />
					<div>
						<h4 class="font-semibold text-gray-900">Ayomide Ojo</h4>
						<p class="text-sm text-gray-500">Nigeria → Graduate Programs</p>
					</div>
				</div>
				<p class="text-gray-700 text-sm leading-relaxed">
					"Made my whole process so much easier. Used it to check my GPA, find schools that fit my profile, and get my SOP draft. Saved me a lot of stress!"
				</p>
			</div>

			<div class="bg-gray-50 rounded-xl p-6 border border-gray-100">
				<div class="flex items-center gap-3 mb-4">
					<img src={chima} alt="Chima testimonial" class="w-12 h-12 rounded-full object-cover" />
					<div>
						<h4 class="font-semibold text-gray-900">Chima Okwuokei</h4>
						<p class="text-sm text-gray-500">Nigeria → Masters Programs</p>
					</div>
				</div>
				<p class="text-gray-700 text-sm leading-relaxed">
					"Felt like a goldmine! The scholarship content is well organized with so many free services. I highly recommend this platform!"
				</p>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes floaty {
		0% { transform: translateY(0); }
		50% { transform: translateY(-8px); }
		100% { transform: translateY(0); }
	}

	.float-card {
		animation: floaty 6s ease-in-out infinite;
		will-change: transform;
	}

	.float-card.float-card-slow {
		animation-duration: 8s;
		animation-delay: 0.4s;
	}

	@media (prefers-reduced-motion: reduce) {
		.float-card,
		.float-card.float-card-slow {
			animation: none;
		}
	}

	/* Staggered fade-in for Plan → Strategy Pack → Applications steps */
	@keyframes homeStepFadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.home-step-card {
		animation: homeStepFadeIn 0.6s ease-out forwards;
		opacity: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.home-step-card {
			animation: none;
			opacity: 1;
		}
	}
</style>

<!-- FAQ SECTION -->
<section class="bg-gray-50 py-20 px-6">
	<div class="max-w-4xl mx-auto">
		<div class="text-center mb-12">
			<h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
				Frequently asked questions
			</h2>
		</div>

		<div class="space-y-4">
			{#each faqs as faq, index}
				<div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
					<button
						onclick={() => toggleFAQ(index)}
						class="w-full text-left px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
					>
						<h3 class="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
						<svg
							class="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform {openFAQ === index ? 'rotate-180' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
						</svg>
					</button>
					{#if openFAQ === index}
						<div class="px-6 pb-5 pt-2 text-gray-600 leading-relaxed border-t border-gray-100">
							{faq.answer}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- FOOTER -->
<footer class="bg-gray-900 text-white py-12 px-6">
	<div class="max-w-7xl mx-auto">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
			<!-- Brand -->
			<div>
				<h3 class="text-2xl font-bold mb-3">Abroaducate</h3>
				<p class="text-gray-400 text-sm">Your AI-powered study abroad advisor</p>
			</div>

			<!-- Platform Links -->
			<div>
				<h4 class="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-400">Platform</h4>
				<ul class="space-y-2 text-sm">
					<li><a href="/diagnostic" class="text-gray-300 hover:text-white transition">Get free plan</a></li>
					<li><a href="/scholarships" class="text-gray-300 hover:text-white transition">Scholarships</a></li>
					<li><a href="/universities" class="text-gray-300 hover:text-white transition">Universities</a></li>
					<li><a href="/tools" class="text-gray-300 hover:text-white transition">Tools</a></li>
					<li><a href="/test-prep" class="text-gray-300 hover:text-white transition">Test Prep</a></li>
				</ul>
			</div>

			<!-- Resources -->
			<div>
				<h4 class="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-400">Resources</h4>
				<ul class="space-y-2 text-sm">
					<li><a href="/blog" class="text-gray-300 hover:text-white transition">Blog</a></li>
					<li><a href="/pricing" class="text-gray-300 hover:text-white transition">Pricing</a></li>
					<li><a href="/contact" class="text-gray-300 hover:text-white transition">Contact</a></li>
					{#if session}
						<li><a href="/dashboard" class="text-gray-300 hover:text-white transition">Dashboard</a></li>
					{/if}
				</ul>
			</div>

			<!-- Legal & Social -->
			<div>
				<h4 class="font-semibold mb-3 text-sm uppercase tracking-wider text-gray-400">Legal</h4>
				<ul class="space-y-2 text-sm mb-4">
					<li><a href="/privacy" class="text-gray-300 hover:text-white transition">Privacy Policy</a></li>
					<li><a href="/terms" class="text-gray-300 hover:text-white transition">Terms of Service</a></li>
				</ul>
				
				<div class="flex items-center gap-3 mt-4">
					<a href="https://x.com/abroaducate" target="_blank" rel="noopener noreferrer" aria-label="Abroaducate on X" class="text-gray-400 hover:text-white transition">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.26l-5.356-7.003-6.127 7.003H1.47l7.73-8.834L1 2.25h7.19l4.817 6.348L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.623H5.117l11.966 15.147Z"/>
						</svg>
					</a>
					<a href="https://linkedin.com/company/abroaducate" target="_blank" rel="noopener noreferrer" aria-label="Abroaducate on LinkedIn" class="text-gray-400 hover:text-white transition">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M19 0h-14C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM8 19H5V8h3v11zm-1.5-12.27c-.97 0-1.75-.79-1.75-1.76s.78-1.76 1.75-1.76S8.25 4 8.25 4.97 7.47 6.73 6.5 6.73zM19 19h-3v-5.6c0-3.37-4-3.11-4 0V19h-3V8h3v1.77C13.4 7.18 19 7 19 12.25V19z"/>
						</svg>
					</a>
					<a href="https://instagram.com/abroaducate" target="_blank" rel="noopener noreferrer" aria-label="Abroaducate on Instagram" class="text-gray-400 hover:text-white transition">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm4.25 3A5.75 5.75 0 1 1 6.25 12 5.75 5.75 0 0 1 12 6.5Zm0 1.5a4.25 4.25 0 1 0 4.25 4.25A4.25 4.25 0 0 0 12 8Zm5.25-.75a1.25 1.25 0 1 1 1.25-1.25 1.25 1.25 0 0 1-1.25 1.25Z"/>
						</svg>
					</a>
				</div>
			</div>
		</div>

		<div class="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
			<p>&copy; {new Date().getFullYear()} Abroaducate. All rights reserved.</p>
		</div>
	</div>
</footer>
