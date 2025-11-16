<script lang="ts">
	import { onMount } from 'svelte';
	import VisaInterviewPractice from '$lib/components/VisaInterviewPractice.svelte';
	import { analytics } from '$lib/utils/posthog';
	import AdSenseAd from '$lib/components/AdSenseAd.svelte';

	let { data } = $props();
	let { session, supabase } = $derived(data);

	onMount(() => {
		// Track visa interview practice page view
		analytics.trackPageView('Visa Interview Practice', {
			user_id: session?.user?.id
		});
	});
</script>

<svelte:head>
	<title>Visa Interview Practice | Abroaducate</title>
	<meta
		name="description"
		content="Practice F-1 visa interview questions with AI-powered feedback. Improve your confidence and increase your chances of visa approval."
	/>
	<meta name="keywords" content="visa interview, F1 visa, student visa, interview practice, USA visa" />
	<meta property="og:title" content="Visa Interview Practice - Abroaducate" />
	<meta
		property="og:description"
		content="Practice F-1 visa interview questions with AI-powered feedback. Improve your confidence and increase your chances of visa approval."
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Hero Section with Title -->
	<section class="pt-30 pb-12 bg-gradient-to-br from-[#2C3580] to-[#3c4d9c]">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
					Visa Interview 
					<span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
						Simulator
					</span>
				</h1>
				
				<p class="text-xl md:text-2xl text-slate-200 mb-8 max-w-4xl mx-auto leading-relaxed">
					Practice F-1 visa interview questions with AI-powered feedback. Build confidence and improve your chances of visa approval.
				</p>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
					<div>
						<div class="text-3xl font-bold text-white">6-80+</div>
						<div class="text-slate-300">Questions per Session</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-white">80+</div>
						<div class="text-slate-300">Question Database</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-white">AI</div>
						<div class="text-slate-300">Powered Feedback</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-white">6</div>
						<div class="text-slate-300">Question Categories</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Main Content Section -->
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<VisaInterviewPractice user={session?.user} {supabase} />
	</div>

	<!-- Additional Info Section -->
	<section class="py-20 bg-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">
					How the Visa Interview Simulator Works
				</h2>
				<p class="text-xl text-gray-600 max-w-3xl mx-auto">
					A simple 3-step process to master your F-1 visa interview
				</p>
				<div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
					<p class="text-blue-800 font-medium">🎯 Practice Sessions by Plan:</p>
					<div class="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
						<div class="text-blue-700"><strong>Free:</strong> 6 questions per session</div>
						<div class="text-blue-700"><strong>Professional:</strong> 50 questions per session</div>
						<div class="text-blue-700"><strong>Elite:</strong> 80+ questions per session</div>
					</div>
				</div>
			</div>

			<!-- Ad placement after How It Works section -->
			<div class="my-10 max-w-4xl mx-auto">
				<AdSenseAd adSlot="6442575607" className="bg-gray-50 p-4 rounded-lg border" variant="in-article" />
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div class="text-center">
					<div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<span class="text-2xl font-bold text-blue-600">1</span>
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-4">Start Practice Session</h3>
					<p class="text-gray-600">
						Begin a practice session with randomly selected F-1 visa interview questions from our comprehensive 80+ question database across 6 key categories (6-25+ questions based on your plan)
					</p>
				</div>

				<div class="text-center">
					<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<span class="text-2xl font-bold text-green-600">2</span>
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-4">Answer Questions</h3>
					<p class="text-gray-600">
						Type your responses to each question and receive instant AI-powered feedback on your answers
					</p>
				</div>

				<div class="text-center">
					<div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<span class="text-2xl font-bold text-purple-600">3</span>
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-4">Review & Improve</h3>
					<p class="text-gray-600">
						Get detailed feedback, scores, and improvement suggestions to strengthen your interview performance
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Question Categories Section -->
	<section class="py-20 bg-gray-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">
					Practice Questions Cover All Key Areas
				</h2>
				<p class="text-xl text-gray-600">
					Our comprehensive question bank covers every aspect of the F-1 visa interview
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<div class="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200">
					<div class="text-4xl mb-4">👤</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-3">Background</h3>
					<p class="text-gray-600">
						Questions about your personal background, education history, and current status
					</p>
				</div>

				<div class="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200">
					<div class="text-4xl mb-4">📚</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-3">Academic</h3>
					<p class="text-gray-600">
						Questions about your chosen program, university, and academic goals
					</p>
				</div>

				<div class="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200">
					<div class="text-4xl mb-4">💰</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-3">Financial</h3>
					<p class="text-gray-600">
						Questions about funding, expenses, and financial capability for studies
					</p>
				</div>

				<div class="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200">
					<div class="text-4xl mb-4">🏠</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-3">Home Country Ties</h3>
					<p class="text-gray-600">
						Questions about your connections and reasons to return to your home country
					</p>
				</div>

				<div class="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200">
					<div class="text-4xl mb-4">🎯</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-3">Future Plans</h3>
					<p class="text-gray-600">
						Questions about your career goals and post-graduation plans
					</p>
				</div>

				<div class="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow duration-200">
					<div class="text-4xl mb-4">💡</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-3">Motivation</h3>
					<p class="text-gray-600">
						Questions about your motivation and reasons for studying in the US
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Call to Action Section -->
	<section class="py-20 bg-gradient-to-r from-[#2C3580] to-[#3c4d9c]">
		<div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
			<h2 class="text-4xl font-bold text-white mb-6">
				Need Help with Your Application Documents?
			</h2>
			<p class="text-xl text-slate-200 mb-8">
				Complete your application journey with our full suite of AI-powered document creation tools
			</p>
			
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a href="/sop" class="bg-white text-slate-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-slate-50 transition duration-300 shadow-lg">
					📝 Generate Statement of Purpose
				</a>
				<a href="/cover-letters" class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-slate-600 transition duration-300">
					✉️ Create Cover Letter
				</a>
				<a href="/dashboard" class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-slate-600 transition duration-300">
					📊 View Dashboard
				</a>
			</div>
		</div>
	</section>


</div> 