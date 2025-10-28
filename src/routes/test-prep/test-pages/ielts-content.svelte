<script lang="ts">
	import AdSenseAd from '$lib/components/AdSenseAd.svelte';
	import { goto } from '$app/navigation';
	import heroImage from '$lib/images/background-image.png';
	import ieltsListening from '$lib/images/ielts-listening.png';
	import ieltsReading from '$lib/images/ielts-reading.png';
	import ieltsSpeaking from '$lib/images/ielts-speaking.png';
	import ieltsWriting from '$lib/images/ielts-writing.png';
	// The handleStartPractice function is passed down from the parent page
	export let handleStartPractice: (link: string) => void;

	// All IELTS-specific data now lives inside the IELTS component
	interface WeekPlan {
		week: number;
		title: string;
		focus: string;
		goals: string[];
		dailyTasks: {
			day: string;
			morning: string;
			afternoon: string;
			evening: string;
		}[];
		materials: string[];
		assessment: string;
	}

	const comprehensiveStudyPlan: WeekPlan[] = [
		{
			week: 1,
			title: 'Foundation & Assessment Week',
			focus: 'Understand IELTS format, assess current level, and establish study routine',
			goals: [
				'Complete diagnostic test to identify strengths and weaknesses',
				'Understand IELTS band descriptors and scoring criteria',
				'Set realistic target score based on current level',
				'Establish daily study routine and organize materials',
				'Learn time management strategies for each section'
			],
			dailyTasks: [
				{
					day: 'Monday',
					morning: 'Take Reading diagnostic test (60 mins) - analyze results',
					afternoon: 'Study IELTS Reading question types and strategies',
					evening: 'Create vocabulary journal, add 10 academic words'
				},
				{
					day: 'Tuesday',
					morning: 'Take Listening diagnostic test (30 mins) - analyze results',
					afternoon: 'Practice note-taking techniques for Listening',
					evening: 'Watch IELTS overview videos, understand band scores'
				},
				{
					day: 'Wednesday',
					morning: 'Take Writing Task 1 diagnostic (20 mins) - self-assess',
					afternoon: 'Study Writing Task 1 structure and vocabulary',
					evening: 'Read sample band 7-9 Task 1 responses'
				},
				{
					day: 'Thursday',
					morning: 'Take Writing Task 2 diagnostic (40 mins) - self-assess',
					afternoon: 'Study Writing Task 2 essay types and structures',
					evening: 'Practice Speaking Part 1 questions (record yourself)'
				},
				{
					day: 'Friday',
					morning: 'Speaking diagnostic - record Part 2 response (3 mins)',
					afternoon: 'Analyze all diagnostic results, identify weak areas',
					evening: 'Create personalized study plan and set weekly goals'
				},
				{
					day: 'Saturday',
					morning: 'Reading practice: Academic texts + vocabulary building',
					afternoon: 'Listening practice: Academic lectures and conversations',
					evening: "Review week's progress, adjust study plan if needed"
				},
				{
					day: 'Sunday',
					morning: 'Writing practice: One Task 1 + vocabulary review',
					afternoon: 'Speaking practice: All parts with sample questions',
					evening: 'Relaxation and light English media consumption'
				}
			],
			materials: [
				'Official IELTS practice tests',
				'Academic vocabulary lists (AWL)',
				'IELTS writing task samples (bands 6-9)',
				'Audio recordings for listening practice',
				'Grammar reference book',
				'Notebook for vocabulary and notes'
			],
			assessment: 'Complete diagnostic assessment of all four skills with detailed error analysis'
		},
		{
			week: 2,
			title: 'Reading & Listening Mastery Week',
			focus: 'Master reading strategies and listening skills through intensive practice',
			goals: [
				'Improve reading speed to 250+ words per minute',
				'Master skimming and scanning techniques',
				'Develop effective note-taking for listening',
				'Learn to predict answers and handle distractors',
				'Build academic vocabulary (100+ new words)'
			],
			dailyTasks: [
				{
					day: 'Monday',
					morning: 'Reading: Complete Practice Set 1 + time analysis',
					afternoon: 'Listening: Academic lectures (Section 4 focus)',
					evening: 'Vocabulary: 15 academic words + collocations'
				},
				{
					day: 'Tuesday',
					morning: 'Reading: Speed reading practice (3 passages, 45 mins)',
					afternoon: 'Listening: Conversations and discussions (Sections 1-2)',
					evening: 'Grammar focus: Complex sentence structures'
				},
				{
					day: 'Wednesday',
					morning: 'Reading: Practice Set 2 + strategy analysis',
					afternoon: 'Listening: Note-taking practice with academic content',
					evening: 'Speaking: Record Part 1 responses (work/studies/hometown)'
				},
				{
					day: 'Thursday',
					morning: 'Reading: Keyword matching and paraphrasing practice',
					afternoon: 'Listening: Complete Practice Set 1 (full test conditions)',
					evening: "Writing: Plan 3 Task 1 responses (don't write full essays)"
				},
				{
					day: 'Friday',
					morning: 'Reading: Complete Practice Set 3 under timed conditions',
					afternoon: 'Listening: Review mistakes and practice weak question types',
					evening: "Vocabulary review: Test yourself on week's words"
				},
				{
					day: 'Saturday',
					morning: 'Full Reading section (3 passages, 60 mins)',
					afternoon: 'Full Listening section (4 sections, 30 mins)',
					evening: 'Analyze performance, identify patterns in mistakes'
				},
				{
					day: 'Sunday',
					morning: 'Light reading: English newspapers/magazines',
					afternoon: 'Listening: English podcasts/TED talks for general practice',
					evening: 'Plan next week based on identified weaknesses'
				}
			],
			materials: [
				'Academic reading passages from multiple sources',
				'IELTS listening practice tests',
				'Academic vocabulary flashcards',
				'Listening transcripts for self-study',
				'Timer for timed practice sessions',
				'Error tracking sheets'
			],
			assessment: 'Full Reading and Listening practice tests with detailed performance analysis'
		},
		{
			week: 3,
			title: 'Writing Excellence & Speaking Confidence Week',
			focus: 'Develop strong writing skills and build speaking fluency',
			goals: [
				'Master Task 1 structure and achieve coherent responses',
				'Write well-structured Task 2 essays with clear arguments',
				'Improve speaking fluency and pronunciation',
				'Learn to expand answers naturally in Speaking',
				'Build confidence for test day performance'
			],
			dailyTasks: [
				{
					day: 'Monday',
					morning: 'Writing: 2 Task 1 responses (charts/graphs) + self-review',
					afternoon: 'Speaking Part 1: Practice 20 questions from 4 topics',
					evening: 'Grammar: Practice complex sentence structures'
				},
				{
					day: 'Tuesday',
					morning: 'Writing: 1 Task 2 essay (opinion type) - full 40 minutes',
					afternoon: 'Speaking Part 2: Practice 3 different cue cards',
					evening: 'Vocabulary: Learn phrases for giving opinions and examples'
				},
				{
					day: 'Wednesday',
					morning: 'Writing: 2 Task 1 responses (process/maps) + peer review',
					afternoon: 'Speaking Part 3: Practice abstract discussion topics',
					evening: 'Reading: Quick practice to maintain skills'
				},
				{
					day: 'Thursday',
					morning: 'Writing: 1 Task 2 essay (discussion type) - analyze afterwards',
					afternoon: 'Speaking: Record full 15-minute mock interview',
					evening: 'Listening: Maintain skills with 1 practice section'
				},
				{
					day: 'Friday',
					morning: 'Writing: 1 Task 1 + 1 Task 2 under test conditions',
					afternoon: 'Speaking: Focus on pronunciation and intonation',
					evening: 'Review writing samples and speaking recordings'
				},
				{
					day: 'Saturday',
					morning: 'Writing: Complete both tasks (60 mins total)',
					afternoon: 'Speaking: Mock test with friend/teacher if possible',
					evening: 'Plan improvements for next week'
				},
				{
					day: 'Sunday',
					morning: 'Light writing practice: Informal letters/emails',
					afternoon: 'Conversational English: Movies/TV with subtitles',
					evening: 'Relaxation and motivation building'
				}
			],
			materials: [
				'IELTS writing task samples (all question types)',
				'Essay planning templates',
				'Speaking question banks',
				'Recording device for speaking practice',
				'Grammar reference for complex structures',
				'Feedback forms for self-assessment'
			],
			assessment:
				'Complete writing tasks under test conditions and record full speaking practice test'
		},
		{
			week: 4,
			title: 'Integration & Test Readiness Week',
			focus: 'Full practice tests, final review, and test day preparation',
			goals: [
				'Complete full IELTS practice tests under exam conditions',
				'Achieve target scores consistently',
				'Perfect test day strategies and time management',
				'Build mental stamina for 3-hour test',
				'Prepare physically and mentally for test day'
			],
			dailyTasks: [
				{
					day: 'Monday',
					morning: 'Full IELTS Practice Test 1 (3 hours) - no breaks',
					afternoon: 'Detailed analysis of all sections and mistakes',
					evening: 'Light vocabulary review, early rest'
				},
				{
					day: 'Tuesday',
					morning: 'Focus practice on weakest section (2 hours)',
					afternoon: 'Review test strategies and time management',
					evening: 'Speaking practice with test day timing'
				},
				{
					day: 'Wednesday',
					morning: 'Full IELTS Practice Test 2 (3 hours)',
					afternoon: "Compare with Monday's performance, track improvement",
					evening: 'Final vocabulary and phrase review'
				},
				{
					day: 'Thursday',
					morning: 'Quick practice of problem question types (1 hour)',
					afternoon: 'Speaking practice: Focus on confidence building',
					evening: 'Test day logistics: Route, documents, timing'
				},
				{
					day: 'Friday',
					morning: 'Light practice only - Reading passage + Speaking Part 1',
					afternoon: 'Final test day preparation and relaxation',
					evening: 'Early sleep and positive visualization'
				},
				{
					day: 'Saturday',
					morning: 'TEST DAY or Final Mock Test (full 3 hours)',
					afternoon: 'If not test day: Final review and relaxation',
					evening: 'Celebrate completion of study plan!'
				},
				{
					day: 'Sunday',
					morning: 'Rest and recovery',
					afternoon: 'Light English activities (if already took test)',
					evening: 'Plan next steps based on performance'
				}
			],
			materials: [
				'Full IELTS practice tests',
				'Test day checklist',
				'ID documents and test confirmation',
				'Comfortable test day clothing',
				'Healthy snacks and water',
				'Transportation plan and backup'
			],
			assessment: 'Multiple full practice tests achieving consistent target band scores'
		}
	];

	const studyTips = {
		timeManagement: [
			'Set specific times for each study session and stick to them',
			'Use the Pomodoro Technique: 25 minutes focused study + 5 minute break',
			'Practice under actual test timing conditions at least 3 times per week',
			"Allocate more time to your weakest skills, but don't neglect strengths"
		],
		vocabulary: [
			'Learn 10-15 new academic words daily with example sentences',
			'Focus on word families and collocations, not just individual words',
			'Use spaced repetition techniques for long-term retention',
			'Practice using new vocabulary in writing and speaking exercises'
		],
		practiceStrategies: [
			'Always analyze mistakes: Why was the answer wrong? What was the trap?',
			'Keep error logs to track patterns in your mistakes',
			'Practice with materials slightly harder than actual test level',
			'Time yourself consistently to build speed and confidence'
		],
		testDay: [
			'Visit the test center beforehand to familiarize yourself with location',
			'Bring multiple forms of ID and arrive 30 minutes early',
			'Read all instructions carefully before starting each section',
			'Stay calm and manage time effectively during the test'
		]
	};

	const availablePracticeTests = [
		{
			title: 'IELTS Reading Practice',
			description: '3 comprehensive reading passages with academic content',
			sections: ['Academic Reading'],
			status: 'Available',
			link: '/practice/ielts/reading',
			difficulty: 'Academic Level',
			timeRequired: '60 minutes',
			imageUrl:ieltsReading
		},
		{
			title: 'IELTS Writing Practice',
			description: 'Task 1 data description and Task 2 essay writing with word count tracking',
			sections: ['Writing Task 1', 'Writing Task 2'],
			status: 'Available',
			link: '/practice/ielts/writing',
			difficulty: 'Academic Level',
			timeRequired: '60 minutes',
			imageUrl:ieltsWriting
		},
		{
			title: 'IELTS Speaking Practice',
			description: 'Parts 1, 2, and 3 with timing and self-assessment tools',
			sections: ['Speaking Parts 1-3'],
			status: 'Available',
			link: '/practice/ielts/speaking',
			difficulty: 'Academic Level',
			timeRequired: '15 minutes',
			imageUrl:ieltsSpeaking
		},
		{
			title: 'IELTS Listening Practice',
			description: 'BBC Learning English content with real conversations and discussions',
			sections: ['Listening'],
			status: 'Available',
			link: '/practice/ielts/listening',
			difficulty: 'Academic Level',
			timeRequired: '30 minutes',
			imageUrl:ieltsListening
		}
	];
</script>

<div class="text-center mb-12">
	<h1 class="text-4xl font-extrabold text-gray-900 mb-4">IELTS Test Prep Centre</h1>
	<p class="text-lg text-gray-600 mb-6 max-w-3xl mx-auto">
		Master the IELTS Academic test with our comprehensive 1-month study plan. This intensive program
		covers all four sections with daily tasks, practice materials, and strategic preparation.
	</p>
	<div class="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
		<div class="flex items-center gap-2">
			<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
					clip-rule="evenodd"
				></path>
			</svg>
			<span>Daily Study Plans</span>
		</div>
		<div class="flex items-center gap-2">
			<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
					clip-rule="evenodd"
				></path>
			</svg>
			<span>All 4 IELTS Sections</span>
		</div>
		<div class="flex items-center gap-2">
			<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
					clip-rule="evenodd"
				></path>
			</svg>
			<span>Practice Tests Available</span>
		</div>
		<div class="flex items-center gap-2">
			<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
					clip-rule="evenodd"
				></path>
			</svg>
			<span>Test Day Preparation</span>
		</div>
	</div>
</div>

<div class="mb-12">
	<h2 class="text-3xl font-bold text-gray-900 mb-6">Available Practice Tests</h2>
	<div class="space-y-6">
		{#each availablePracticeTests as test}
			<button
				onclick={() => handleStartPractice(test.link)}
				class="w-full text-left bg-white rounded-3xl shadow-lg p-5 sm:p-6 flex flex-col sm:flex-row gap-5 sm:gap-6 items-start transition-all hover:shadow-xl hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				<div class="relative flex-shrink-0 w-full sm:w-40 h-full">
					<img
						src={test.imageUrl}
						alt={test.title}
						class="w-full h-full rounded-2xl object-cover"
					/>
				</div>

				<div class="flex-1 flex flex-col justify-between h-full w-full">
					<div class="flex justify-between items-start w-full">
						<div class="flex-1 pr-4">
							<h3 class="text-xl font-bold text-gray-900 mb-1">
								{test.title}
							</h3>
							<p class="text-sm text-gray-600 leading-relaxed">
								{test.description}
							</p>
						</div>

						<div class="flex-shrink-0 flex flex-col sm:flex-row sm:items-center gap-2">
							<span class="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800"
								>Test</span
							>
							<span class="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
								>IELTS</span
							>
						</div>
					</div>

					<div class="mt-4 w-full">
						<div class="flex items-center justify-between flex-wrap gap-y-3">
							<div class="flex items-center gap-4 text-sm text-gray-600">
								<span class="flex items-center gap-1.5">
									<svg
										class="w-4 h-4 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
									{test.timeRequired}
								</span>
								<span class="flex items-center gap-1.5">
									<svg
										class="w-4 h-4 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
										></path>
									</svg>
									{test.difficulty}
								</span>
							</div>

							<div class="flex items-center flex-wrap gap-2">
								{#each test.sections as section}
									<span class="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
										>{section}</span
									>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</button>
		{/each}
	</div>
</div>

<div class="mb-12">
	<h2 class="text-3xl font-bold text-gray-900 mb-6">Comprehensive 1-Month Study Plan</h2>
	<p class="text-gray-600 mb-8">
		This detailed study plan provides daily tasks and strategies to maximize your IELTS preparation.
		Each week focuses on specific skills while maintaining practice across all sections.
	</p>

	<div class="space-y-8">
		{#each comprehensiveStudyPlan as week}
			<details class="group bg-white border border-gray-200 rounded-lg shadow-sm">
				<summary class="flex items-center justify-between p-6 cursor-pointer select-none">
					<div class="flex-1">
						<span class="text-xl font-semibold text-gray-900">Week {week.week}: {week.title}</span>
						<p class="text-gray-600 mt-1">{week.focus}</p>
					</div>
					<svg
						class="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform ml-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
						></path>
					</svg>
				</summary>

				<div class="px-6 pb-6 border-t border-gray-100">
					<div class="mt-4">
						<h4 class="font-semibold text-gray-900 mb-3">Week Goals</h4>
						<ul class="space-y-2">
							{#each week.goals as goal}
								<li class="flex items-start gap-2">
									<svg
										class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										></path>
									</svg>
									<span class="text-gray-700">{goal}</span>
								</li>
							{/each}
						</ul>
					</div>

					<div class="mt-6">
						<h4 class="font-semibold text-gray-900 mb-3">Daily Study Schedule</h4>
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
							{#each week.dailyTasks as dayTask}
								<div class="border border-gray-200 rounded-lg p-4">
									<h5 class="font-medium text-gray-900 mb-3">
										{dayTask.day}
									</h5>
									<div class="space-y-3">
										<div>
											<span class="text-xs font-medium text-orange-600 uppercase tracking-wide"
												>Morning (2-3 hours)</span
											>
											<p class="text-sm text-gray-700 mt-1">
												{dayTask.morning}
											</p>
										</div>
										<div>
											<span class="text-xs font-medium text-blue-600 uppercase tracking-wide"
												>Afternoon (1-2 hours)</span
											>
											<p class="text-sm text-gray-700 mt-1">
												{dayTask.afternoon}
											</p>
										</div>
										<div>
											<span class="text-xs font-medium text-purple-600 uppercase tracking-wide"
												>Evening (1 hour)</span
											>
											<p class="text-sm text-gray-700 mt-1">
												{dayTask.evening}
											</p>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<div class="mt-6">
						<h4 class="font-semibold text-gray-900 mb-3">Required Materials</h4>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
							{#each week.materials as material}
								<div class="flex items-center gap-2">
									<svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clip-rule="evenodd"
										></path>
									</svg>
									<span class="text-sm text-gray-700">{material}</span>
								</div>
							{/each}
						</div>
					</div>

					<div class="mt-6 bg-blue-50 rounded-lg p-4">
						<h4 class="font-semibold text-blue-900 mb-2">Week Assessment</h4>
						<p class="text-blue-800">{week.assessment}</p>
					</div>
				</div>
			</details>
		{/each}
	</div>
</div>

<div class="my-10 max-w-4xl mx-auto">
	<AdSenseAd
		adSlot="8877167254"
		className="bg-gray-50 p-4 rounded-lg border"
		variant="in-article"
	/>
</div>

<div class="mb-12">
	<h2 class="text-3xl font-bold text-gray-900 mb-6">Essential Study Tips & Strategies</h2>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<div class="bg-white rounded-lg shadow-md p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
				<svg class="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
						clip-rule="evenodd"
					></path>
				</svg>
				Time Management
			</h3>
			<ul class="space-y-2">
				{#each studyTips.timeManagement as tip}
					<li class="flex items-start gap-2">
						<svg
							class="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
								clip-rule="evenodd"
							></path>
						</svg>
						<span class="text-sm text-gray-700">{tip}</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="bg-white rounded-lg shadow-md p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
				<svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
					<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
				</svg>
				Vocabulary Building
			</h3>
			<ul class="space-y-2">
				{#each studyTips.vocabulary as tip}
					<li class="flex items-start gap-2">
						<svg
							class="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
								clip-rule="evenodd"
							></path>
						</svg>
						<span class="text-sm text-gray-700">{tip}</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="bg-white rounded-lg shadow-md p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
				<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
					<path
						d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
					></path>
				</svg>
				Practice Strategies
			</h3>
			<ul class="space-y-2">
				{#each studyTips.practiceStrategies as tip}
					<li class="flex items-start gap-2">
						<svg
							class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
								clip-rule="evenodd"
							></path>
						</svg>
						<span class="text-sm text-gray-700">{tip}</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="bg-white rounded-lg shadow-md p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
				<svg class="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
						clip-rule="evenodd"
					></path>
				</svg>
				Test Day Preparation
			</h3>
			<ul class="space-y-2">
				{#each studyTips.testDay as tip}
					<li class="flex items-start gap-2">
						<svg
							class="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
								clip-rule="evenodd"
							></path>
						</svg>
						<span class="text-sm text-gray-700">{tip}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12">
	<section
		class="relative rounded-3xl overflow-hidden text-center"
		style="background-image: url('{heroImage}'); background-size: cover; background-position: center;"
	>
		<div class="relative max-w-4xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
			<h2 class="text-4xl md:text-5xl font-semibold text-white tracking-tight">
				Ready to Start Your IELTS Journey?
			</h2>
			<p class="mt-4 text-lg text-indigo-100 max-w-2xl mx-auto">
				Begin with our Reading practice tests and track your progress through the comprehensive
				study plan.
			</p>

			<div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
				<button
					onclick={() => handleStartPractice('/practice/ielts/reading')}
					class="inline-flex items-center gap-3 bg-white text-blue-700 font-semibold px-6 py-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-105"
				>
					Start Practice Test
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

				<button
					onclick={() => goto('/dashboard/progress')}
					class="inline-flex items-center gap-3 border-2 border-white/50 text-white font-semibold px-6 py-3 rounded-full transition-colors duration-300 hover:bg-white/10"
				>
					View Progress
					<span class="bg-white/20 text-white p-1.5 rounded-full">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
					</span>
				</button>
			</div>
		</div>
	</section>
</div>
