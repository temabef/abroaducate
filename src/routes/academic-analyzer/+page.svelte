<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import CompactUpgradeModal from '$lib/components/CompactUpgradeModal.svelte';

	// Interfaces for type safety
	interface Course {
		code: string;
		name: string;
		credits: number;
		grade: string;
		usGPA: number;
		year: string;
	}

	interface AcademicYearSummary {
		courses: Course[];
		gpa: string;
		totalCredits: number;
		courseCount: number;
	}

	interface SubjectSummary {
		courses: Course[];
		gpa: string;
		totalCredits: number;
		courseCount: number;
	}

	interface GradeDistribution {
		byGrade: Record<string, number>;
		byGPARange: Record<string, number>;
		totalCourses: number;
	}

	interface AcademicProfile {
		hasData: boolean;
		totalGPA: number;
		totalCourses: number;
		studentInfo: {
			studentName: string;
			universityName: string;
			programOfStudy: string;
		};
		coursesByYear: Record<string, AcademicYearSummary>;
		coursesBySubject: Record<string, SubjectSummary>;
		gradeDistribution: GradeDistribution;
		creditHours: {
			total: number;
			average: number;
			courseCount: number;
		};
		gradingSystem: {
			country: string;
			system: string;
		};
		extractedAt: string;
	}

	interface AnalysisResult {
		hasAnalysis: boolean;
		message?: string;
		overall?: {
			gpa: number;
			gpaCategory: string;
			gpaDescription: string;
			gpaColor: string;
			totalCredits: number;
			creditLoadAssessment: string;
			coursesCompleted: number;
			averageCreditsPerCourse: number;
		};
		strengths?: {
			category: string;
			title: string;
			description: string;
			impact: string;
			icon: string;
		}[];
		weaknesses?: {
			category: string;
			title: string;
			description: string;
			severity: string;
			icon: string;
		}[];
		trends?: {
			hasEnoughData: boolean;
			message?: string;
			gpaTrend?: {
				year: string;
				gpa: number;
			}[];
			creditTrend?: {
				year: string;
				credits: number;
			}[];
			trendDirection?: string;
			trendDescription?: string;
			gpaChange?: string | number;
			yearsAnalyzed?: number;
		};
		recommendations?: {
			priority: string;
			category: string;
			title: string;
			description: string;
			actionItems: string[];
		}[];
		competitiveness?: {
			level: string;
			description: string;
			opportunities: string[];
			gpaScore: number;
			percentile: number;
		};
		riskFactors?: {
			type: string;
			description: string;
			severity: string;
		}[];
		insights?: {
			title: string;
			description: string;
			type: string;
		}[];
	}

	// State variables
	let hasData = false;
	let academicProfile: AcademicProfile | null = null;
	let analysis: AnalysisResult | null = null;
	let loading = true;
	let dataSource = '';
	let activeTab = 'overview';

	// UI state
	let showAnalysis = false;

	// Premium access control
	let showUpgradeModal = false;
	let userPlan = 'free'; // Default to free, will be updated if authenticated
	let isPremiumUser = false;

	const tabs = [
		{ id: 'overview', label: 'Overview', icon: '📊' },
		{ id: 'strengths', label: 'Strengths', icon: '💪' },
		{ id: 'areas', label: 'Growth Areas', icon: '📈' },
		{ id: 'trends', label: 'Trends', icon: '📉' },
		{ id: 'recommendations', label: 'Recommendations', icon: '💡' },
		{ id: 'competitiveness', label: 'Competitiveness', icon: '🎯' }
	];

	onMount(() => {
		loadAcademicData();
		checkUserSubscription();
	});

	async function checkUserSubscription() {
		try {
			// Try to fetch the user's current subscription plan
			const response = await fetch('/api/get-user-profile');
			if (response.ok) {
				const userData = await response.json();
				userPlan = userData.subscription?.plan_type || 'free';
				isPremiumUser = userPlan === 'professional' || userPlan === 'elite';
			} else {
				// Default to free if we can't verify
				isPremiumUser = false;
			}

			// Never show the upgrade modal - we have the locked content page instead
			showUpgradeModal = false;
		} catch (error) {
			console.error('Error checking subscription:', error);
			isPremiumUser = false;
		}
	}

	async function loadAcademicData() {
		loading = true;

		try {
			// Check for stored GPA converter data
			const gpaData = localStorage.getItem('gpaConverterData');
			if (gpaData) {
				const data = JSON.parse(gpaData);
				if (data.courses && data.courses.length > 0) {
					hasData = true;
					dataSource = 'stored';
					academicProfile = extractProfileFromStoredData(data);

					// Import and run analysis
					const module = await import('$lib/academicAnalyzer/analysisEngine.js');
					analysis = module.analyzeAcademicProfile(academicProfile);

					// Only show analysis if user is premium
					showAnalysis = isPremiumUser;
				}
			}

			if (!hasData) {
				// No data available
				dataSource = 'none';
			}
		} catch (error) {
			console.error('Error loading academic data:', error);
		}

		loading = false;
	}

	function extractProfileFromStoredData(data: any) {
		const courses = data.courses || [];
		const totalCredits = courses.reduce((sum: number, course: any) => sum + course.credits, 0);
		const totalPoints = courses.reduce(
			(sum: number, course: any) => sum + course.usGPA * course.credits,
			0
		);
		const calculatedGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

		// Group courses by year
		const academicYears = [
			'Year 1',
			'Year 2',
			'Year 3',
			'Year 4',
			'Year 5',
			'Year 6',
			'Postgraduate'
		];
		const coursesByYear: Record<string, AcademicYearSummary> = {};
		academicYears.forEach((year) => {
			const yearCourses = courses.filter((c: any) => c.year === year);
			if (yearCourses.length > 0) {
				const yearCredits = yearCourses.reduce(
					(sum: number, course: any) => sum + course.credits,
					0
				);
				const yearPoints = yearCourses.reduce(
					(sum: number, course: any) => sum + course.usGPA * course.credits,
					0
				);
				coursesByYear[year] = {
					courses: yearCourses,
					gpa: yearCredits > 0 ? (yearPoints / yearCredits).toFixed(2) : '0.00',
					totalCredits: yearCredits,
					courseCount: yearCourses.length
				};
			}
		});

		// Categorize by subject
		const coursesBySubject = categorizeBySubject(courses);

		// Analyze grade distribution
		const gradeDistribution = analyzeGradeDistribution(courses);

		return {
			hasData: true,
			totalGPA: calculatedGPA,
			totalCourses: courses.length,
			studentInfo: {
				studentName: data.studentName || '',
				universityName: data.universityName || '',
				programOfStudy: data.programOfStudy || ''
			},
			coursesByYear: coursesByYear,
			coursesBySubject: coursesBySubject,
			gradeDistribution: gradeDistribution,
			creditHours: {
				total: totalCredits,
				average: courses.length > 0 ? parseFloat((totalCredits / courses.length).toFixed(1)) : 0,
				courseCount: courses.length
			},
			gradingSystem: {
				country: data.selectedCountry,
				system: data.selectedGradingSystem
			},
			extractedAt: new Date().toISOString()
		};
	}

	function categorizeBySubject(courses: any[]) {
		const subjectCategories: Record<string, string[]> = {
			Science: [
				'chemistry',
				'biology',
				'physics',
				'anatomy',
				'physiology',
				'biochemistry',
				'microbiology'
			],
			Mathematics: ['mathematics', 'math', 'calculus', 'statistics', 'algebra', 'geometry'],
			Engineering: ['engineering', 'mechanical', 'electrical', 'civil', 'chemical', 'computer'],
			Business: ['business', 'management', 'economics', 'finance', 'accounting', 'marketing'],
			'Liberal Arts': ['english', 'literature', 'history', 'philosophy', 'art', 'music'],
			'Social Sciences': ['psychology', 'sociology', 'political', 'anthropology', 'geography'],
			Language: ['language', 'foreign', 'spanish', 'french', 'german', 'chinese'],
			Other: []
		};

		const categorizedCourses: Record<string, any[]> = {};

		// Initialize categories
		Object.keys(subjectCategories).forEach((category) => {
			categorizedCourses[category] = [];
		});

		courses.forEach((course) => {
			const courseName = (course.name || '').toLowerCase();
			const courseCode = (course.code || '').toLowerCase();

			let categorized = false;

			// Try to categorize based on course name and code
			for (const [category, keywords] of Object.entries(subjectCategories)) {
				if (category === 'Other') continue;

				const isMatch = keywords.some(
					(keyword) => courseName.includes(keyword) || courseCode.includes(keyword)
				);

				if (isMatch) {
					categorizedCourses[category].push(course);
					categorized = true;
					break;
				}
			}

			// If not categorized, put in 'Other'
			if (!categorized) {
				categorizedCourses['Other'].push(course);
			}
		});

		// Calculate GPA for each subject area
		const result: Record<string, SubjectSummary> = {};
		Object.keys(categorizedCourses).forEach((category) => {
			const courses = categorizedCourses[category];
			if (courses.length > 0) {
				const totalCredits = courses.reduce(
					(sum: number, course: any) => sum + (course.credits || 0),
					0
				);
				const totalGradePoints = courses.reduce(
					(sum: number, course: any) => sum + (course.usGPA || 0) * (course.credits || 0),
					0
				);

				result[category] = {
					courses: courses,
					gpa: totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00',
					totalCredits: totalCredits,
					courseCount: courses.length
				};
			} else {
				result[category] = {
					courses: [],
					gpa: '0.00',
					totalCredits: 0,
					courseCount: 0
				};
			}
		});

		return result;
	}

	function analyzeGradeDistribution(courses: any[]) {
		const gradeCount: Record<string, number> = {};
		const gpaRanges: Record<string, number> = {
			'A Range (3.7-4.0)': 0,
			'B Range (2.7-3.6)': 0,
			'C Range (1.7-2.6)': 0,
			'D Range (0.7-1.6)': 0,
			'F Range (0.0-0.6)': 0
		};

		courses.forEach((course) => {
			const grade = course.grade;
			const gpa = course.usGPA || 0;

			// Count individual grades
			gradeCount[grade] = (gradeCount[grade] || 0) + 1;

			// Count GPA ranges
			if (gpa >= 3.7) gpaRanges['A Range (3.7-4.0)']++;
			else if (gpa >= 2.7) gpaRanges['B Range (2.7-3.6)']++;
			else if (gpa >= 1.7) gpaRanges['C Range (1.7-2.6)']++;
			else if (gpa >= 0.7) gpaRanges['D Range (0.7-1.6)']++;
			else gpaRanges['F Range (0.0-0.6)']++;
		});

		return {
			byGrade: gradeCount,
			byGPARange: gpaRanges,
			totalCourses: courses.length
		};
	}

	function switchTab(tabId: string) {
		activeTab = tabId;
	}

	function getGPAColor(gpa: number): string {
		if (gpa >= 3.7) return 'text-[#2C3580]';
		if (gpa >= 3.3) return 'text-[#2C3580]';
		if (gpa >= 3.0) return 'text-[#2C3580]';
		if (gpa >= 2.5) return 'text-orange-600';
		return 'text-red-600';
	}

	function getGPABgColor(gpa: number): string {
		if (gpa >= 3.7) return 'bg-green-100 border-green-200';
		if (gpa >= 3.3) return 'bg-blue-100 border-blue-200';
		if (gpa >= 3.0) return 'bg-yellow-100 border-yellow-200';
		if (gpa >= 2.5) return 'bg-orange-100 border-orange-200';
		return 'bg-red-100 border-red-200';
	}

	function formatPercentage(value: number, total: number): number {
		return total > 0 ? Math.round((value / total) * 100) : 0;
	}

	function refreshAnalysis() {
		loadAcademicData();
	}

	function goToGPAConverter() {
		goto('/gpa-converter');
	}

	function handleUpgrade(event: CustomEvent) {
		// Redirect to pricing page
		goto('/pricing');
	}
</script>

<svelte:head>
	<title>Academic Profile Analyzer | Abroaducate</title>
	<meta
		name="description"
		content="Analyze your academic strengths, weaknesses, and competitiveness for studying abroad. Get personalized recommendations based on your GPA and course performance."
	/>
	<meta
		name="keywords"
		content="academic analysis, GPA analyzer, study abroad, academic strengths, university admissions, academic profile"
	/>
</svelte:head>

<div class="max-w-7xl mx-auto p-6 pt-24">
	<!-- Header -->
	<div class="text-center mb-8 shadow-lg px-4 py-6">
		<h1 class="text-4xl font-bold text-gray-900 mb-4">Academic Profile Analyzer</h1>
		<p class="text-xl text-gray-600 max-w-3xl mx-auto">
			Get comprehensive insights into your academic performance, identify strengths and growth
			areas, and receive personalized recommendations for your study abroad journey.
		</p>
		<div class="mt-6 flex justify-center">
			<div class="flex items-center space-x-6 text-sm text-gray-500">
				<div class="flex items-center space-x-1">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-black mr-2 flex-shrink-0 mt-0.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
					<span>Detailed Analysis</span>
				</div>
				<div class="flex items-center space-x-1">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-black mr-2 flex-shrink-0 mt-0.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
					<span>Actionable Insights</span>
				</div>
				<div class="flex items-center space-x-1">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 text-black mr-2 flex-shrink-0 mt-0.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
					<span>University Matching</span>
				</div>
			</div>
		</div>
	</div>

	{#if loading}
		<!-- Loading State -->
		<div class="flex justify-center items-center min-h-64">
			<div class="text-center">
				<div
					class="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2C3580] mx-auto mb-4"
				></div>
				<p class="text-gray-600">Analyzing your academic profile...</p>
			</div>
		</div>
	{:else if !hasData}
		<!-- No Data State -->
		<div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 text-center">
			<div class="max-w-2xl mx-auto">
				<div class="text-6xl mb-6">📚</div>
				<h2 class="text-2xl font-bold text-gray-900 mb-4">No Academic Data Found</h2>
				<p class="text-gray-600 mb-6 text-lg">
					To use the Academic Profile Analyzer, you need to first convert your transcript using our
					GPA Converter.
				</p>
				<div class="bg-white rounded-xl p-6 mb-6 text-left">
					<h3 class="font-semibold text-gray-900 mb-3">📋 Quick Steps:</h3>
					<ol class="list-decimal list-inside space-y-2 text-gray-700">
						<li>Go to the <strong>GPA Converter</strong> tool</li>
						<li>Upload your transcript or add courses manually</li>
						<li>Complete the conversion process</li>
						<li>Return here for comprehensive analysis</li>
					</ol>
				</div>
				<a
					href="/gpa-converter"
					class="inline-flex items-center bg-[#2C3580] text-white px-6 py-3 rounded-lg hover:bg-[#3c4d9c]  transition-colors font-medium"
				>
					Convert Transcript First
					<svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"
						></path>
					</svg>
				</a>
			</div>
		</div>
	{:else if !isPremiumUser}
		<!-- Free User with Data - Show Premium Feature Teaser -->
		<div class=" rounded-xl shadow-lg p-8 text-center">
			<div class="max-w-2xl mx-auto">
				<h2 class="text-4xl font-bold text-gray-900 mb-4">Professional Feature</h2>
				<p class="text-gray-700 mb-6 text-lg">
					The comprehensive Academic Profile Analyzer is available to Professional and Elite plans
					only.
				</p>

				<div class="bg-white rounded-xl p-6 mb-6 text-left">
					<h3 class="font-semibold text-gray-900 mb-3">✨ What you'll get:</h3>
					<ul class="space-y-3 text-gray-700">
						<li class="flex items-start">
							<svg
								class="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
							<span
								><strong>Comprehensive academic strengths</strong> analysis tailored to your transcript</span
							>
						</li>
						<li class="flex items-start">
							<svg
								class="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
							<span
								><strong>Personalized improvement recommendations</strong> for studying abroad</span
							>
						</li>
						<li class="flex items-start">
							<svg
								class="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
							<span
								><strong>University competitiveness assessment</strong> based on your GPA and academic
								profile</span
							>
						</li>
						<li class="flex items-start">
							<svg
								class="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
							<span><strong>Detailed academic trends</strong> showing your progress over time</span>
						</li>
					</ul>
				</div>

				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a
						href="/pricing"
						class="inline-flex items-center justify-center px-6 py-3 bg-[#2C3580] text-white rounded-lg hover:bg-[#3c4d9c]  transition-colors font-medium"
					>
						Upgrade to Professional
					</a>
					<a
						href="/gpa-converter"
						class="inline-flex items-center justify-center px-6 py-3 border border-[#3c4d9c]  text-[#3c4d9c]  rounded-lg hover:bg-blue-50 transition-colors font-medium"
					>
						Get Free Basic Analysis
					</a>
				</div>
			</div>

			<!-- Success Stats Section -->
			<div class="mt-16 bg-gray-100 rounded-lg p-8">
				<div class="text-center mb-8">
					<h3 class="text-2xl font-bold text-gray-900 mb-4">
						Trusted Academic Analysis for African Students
					</h3>
					<p class="text-gray-600">
						Empowering students with data-driven insights for study abroad success
					</p>
				</div>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
					<div>
						<div class="text-3xl font-bold text-[#2C3580]">50+</div>
						<div class="text-sm text-gray-600">Academic Systems</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-[#2C3580]">1,200+</div>
						<div class="text-sm text-gray-600">Profiles Analyzed</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-[#2C3580]">100%</div>
						<div class="text-sm text-gray-600">FREE Analysis</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-[#2C3580]">7,000+</div>
						<div class="text-sm text-gray-600">Universities Tracked</div>
					</div>
				</div>
			</div>

			<!-- Call to Action Section -->
			<div
				class="mt-16 bg-gradient-to-r from-[#2C3580] to-[#2C3580] rounded-lg p-8 text-center text-white"
			>
				<h3 class="text-2xl font-bold mb-4">
					Ready to Take the Next Step in Your Study Abroad Journey?
				</h3>
				<p class="text-purple-100 mb-6">
					Use our comprehensive suite of tools to find the perfect universities and secure funding
					for your dreams.
				</p>
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a
						href="/universities"
						class="bg-white text-[#2C3580] px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition duration-200"
					>
						🏛️ Find Matching Universities
					</a>
					<a
						href="/scholarships"
						class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-[#2C3580] transition duration-200"
					>
						💰 Discover Scholarships
					</a>
					<a
						href="/sop"
						class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-[#2C3580] transition duration-200"
					>
						📝 Generate Statement of Purpose
					</a>
					<a
						href="/gpa-converter"
						class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-[#2C3580] transition duration-200"
					>
						📊 Enter Your GPA Data
					</a>
				</div>
			</div>
		</div>
	{:else if analysis && analysis.hasAnalysis && academicProfile}
		<!-- Main Analysis Interface -->
		<div class="space-y-6">
			<!-- Data Source Indicator -->
			<div class="bg-green-50 border border-green-200 rounded-lg p-4">
				<div class="flex items-center space-x-2">
					<div class="text-[#2C3580]">✅</div>
					<div class="text-sm text-green-800">
						Analysis based on {dataSource === 'stored'
							? 'your saved GPA data'
							: 'live session data'}
						| Last updated: {new Date(academicProfile.extractedAt).toLocaleString()}
					</div>
					<button
						on:click={refreshAnalysis}
						class="ml-auto text-[#2C3580] hover:text-green-800 text-sm font-medium"
					>
						🔄 Refresh
					</button>
				</div>
			</div>

			<!-- Quick Stats Overview -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div class="bg-white rounded-xl shadow-sm border p-6 text-center">
					<div class="text-3xl font-bold {getGPAColor(academicProfile.totalGPA)} mb-2">
						{academicProfile.totalGPA.toFixed(2)}
					</div>
					<div class="text-gray-600 text-sm">Overall GPA</div>
					<div class="text-xs text-gray-500 mt-1">{analysis?.overall?.gpaCategory || 'N/A'}</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border p-6 text-center">
					<div class="text-3xl font-bold text-gray-900 mb-2">
						{academicProfile.totalCourses}
					</div>
					<div class="text-gray-600 text-sm">Total Courses</div>
					<div class="text-xs text-gray-500 mt-1">{academicProfile.creditHours.total} Credits</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border p-6 text-center">
					<div class="text-3xl font-bold text-gray-900 mb-2">
						{analysis?.strengths?.length || 0}
					</div>
					<div class="text-gray-600 text-sm">Key Strengths</div>
					<div class="text-xs text-[#2C3580] mt-1">Identified</div>
				</div>

				<div class="bg-white rounded-xl shadow-sm border p-6 text-center">
					<div class="text-3xl font-bold text-gray-900 mb-2">
						{analysis?.competitiveness?.percentile || 0}th
					</div>
					<div class="text-gray-600 text-sm">Percentile</div>
					<div class="text-xs text-[#2C3580] mt-1">{analysis?.competitiveness?.level || 'N/A'}</div>
				</div>
			</div>

			<!-- Navigation Tabs -->
			<div class="bg-white rounded-xl shadow-sm border overflow-hidden">
				<div class="border-b border-gray-200">
					<nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
						{#each tabs as tab}
							<button
								on:click={() => switchTab(tab.id)}
								class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab ===
								tab.id
									? 'border-blue-500 text-[#2C3580]'
									: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
							>
								<span class="mr-2">{tab.icon}</span>
								{tab.label}
							</button>
						{/each}
					</nav>
				</div>

				<!-- Tab Content -->
				<div class="p-6">
					{#if activeTab === 'overview'}
						<!-- Overview Tab -->
						<div class="space-y-6">
							<!-- Student Information -->
							{#if academicProfile?.studentInfo?.studentName}
								<div class="bg-gray-50 rounded-lg p-4">
									<h3 class="font-semibold text-gray-900 mb-2">📋 Academic Profile</h3>
									<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
										<div>
											<span class="font-medium text-gray-700">Student:</span>
											<span class="text-gray-600 ml-2"
												>{academicProfile?.studentInfo?.studentName}</span
											>
										</div>
										{#if academicProfile?.studentInfo?.universityName}
											<div>
												<span class="font-medium text-gray-700">University:</span>
												<span class="text-gray-600 ml-2"
													>{academicProfile.studentInfo.universityName}</span
												>
											</div>
										{/if}
										{#if academicProfile?.studentInfo?.programOfStudy}
											<div>
												<span class="font-medium text-gray-700">Program:</span>
												<span class="text-gray-600 ml-2"
													>{academicProfile.studentInfo.programOfStudy}</span
												>
											</div>
										{/if}
									</div>
								</div>
							{/if}

							<!-- Performance Overview -->
							<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
								<!-- Overall Performance -->
								<div class="bg-white border rounded-lg p-6">
									<h3 class="font-semibold text-gray-900 mb-4">🎯 Overall Performance</h3>
									<div class="{getGPABgColor(academicProfile.totalGPA)} rounded-lg p-4 mb-4">
										<div class="flex items-center justify-between">
											<div>
												<div class="text-2xl font-bold {getGPAColor(academicProfile.totalGPA)}">
													{academicProfile.totalGPA.toFixed(2)} GPA
												</div>
												<div class="text-sm text-gray-600">{analysis.overall?.gpaDescription}</div>
											</div>
											<div class="text-3xl">
												{#if academicProfile.totalGPA >= 3.7}🏆
												{:else if academicProfile.totalGPA >= 3.3}⭐
												{:else if academicProfile.totalGPA >= 3.0}👍
												{:else}📈{/if}
											</div>
										</div>
									</div>
									<div class="space-y-2 text-sm">
										<div class="flex justify-between">
											<span class="text-gray-600">Credit Load:</span>
											<span class="font-medium">{analysis.overall?.creditLoadAssessment}</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-600">Total Credits:</span>
											<span class="font-medium">{academicProfile.creditHours.total}</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-600">Avg Credits/Course:</span>
											<span class="font-medium">{academicProfile.creditHours.average}</span>
										</div>
									</div>
								</div>

								<!-- Grade Distribution -->
								<div class="bg-white border rounded-lg p-6">
									<h3 class="font-semibold text-gray-900 mb-4">📊 Grade Distribution</h3>
									<div class="space-y-3">
										{#each Object.entries(academicProfile.gradeDistribution.byGPARange) as [range, count]}
											{@const percentage = formatPercentage(count, academicProfile.totalCourses)}
											<div class="flex items-center justify-between">
												<span class="text-sm text-gray-600">{range}</span>
												<div class="flex items-center space-x-2">
													<div class="w-24 bg-gray-200 rounded-full h-2">
														<div
															class="h-2 rounded-full {range.includes('A')
																? 'bg-green-500'
																: range.includes('B')
																	? 'bg-blue-500'
																	: range.includes('C')
																		? 'bg-yellow-500'
																		: range.includes('D')
																			? 'bg-orange-500'
																			: 'bg-red-500'}"
															style="width: {percentage}%"
														></div>
													</div>
													<span class="text-sm font-medium w-12 text-right">{percentage}%</span>
												</div>
											</div>
										{/each}
									</div>
								</div>
							</div>

							<!-- Subject Performance -->
							<div class="bg-white border rounded-lg p-6">
								<h3 class="font-semibold text-gray-900 mb-4">📚 Subject Area Performance</h3>
								<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{#each Object.entries(academicProfile.coursesBySubject) as [subject, data]}
										{#if data.courseCount > 0}
											<div class="bg-gray-50 rounded-lg p-4">
												<div class="flex items-center justify-between mb-2">
													<h4 class="font-medium text-gray-900 text-sm">{subject}</h4>
													<span class="text-xs text-gray-500">{data.courseCount} courses</span>
												</div>
												<div class="flex items-center justify-between">
													<span class="text-lg font-bold {getGPAColor(parseFloat(data.gpa))}"
														>{data.gpa}</span
													>
													<span class="text-xs text-gray-500">{data.totalCredits} credits</span>
												</div>
											</div>
										{/if}
									{/each}
								</div>
							</div>
						</div>
					{:else if activeTab === 'strengths'}
						<!-- Strengths Tab -->
						<div class="space-y-4">
							<h3 class="text-xl font-semibold text-gray-900 mb-4">💪 Your Academic Strengths</h3>
							{#if analysis.strengths && analysis.strengths.length > 0}
								<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
									{#each analysis.strengths as strength}
										<div class="bg-green-50 border border-green-200 rounded-lg p-6">
											<div class="flex items-start space-x-3">
												<div class="text-2xl">{strength.icon}</div>
												<div class="flex-1">
													<h4 class="font-semibold text-green-900 mb-1">{strength.title}</h4>
													<p class="text-green-700 text-sm mb-2">{strength.description}</p>
													<div class="flex items-center space-x-2">
														<span
															class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
														>
															{strength.category}
														</span>
														<span
															class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {strength.impact ===
															'high'
																? 'bg-red-100 text-red-800'
																: strength.impact === 'medium'
																	? 'bg-yellow-100 text-yellow-800'
																	: 'bg-blue-100 text-blue-800'}"
														>
															{strength.impact} impact
														</span>
													</div>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="text-center py-8">
									<div class="text-4xl mb-4">🌱</div>
									<p class="text-gray-600">
										Keep working hard! Strengths will be identified as your academic profile
										develops.
									</p>
								</div>
							{/if}
						</div>
					{:else if activeTab === 'areas'}
						<!-- Growth Areas Tab -->
						<div class="space-y-4">
							<h3 class="text-xl font-semibold text-gray-900 mb-4">📈 Areas for Growth</h3>
							{#if analysis.weaknesses && analysis.weaknesses.length > 0}
								<div class="space-y-4">
									{#each analysis.weaknesses as weakness}
										<div class="bg-orange-50 border border-orange-200 rounded-lg p-6">
											<div class="flex items-start space-x-3">
												<div class="text-2xl">{weakness.icon}</div>
												<div class="flex-1">
													<div class="flex items-center justify-between mb-2">
														<h4 class="font-semibold text-orange-900">{weakness.title}</h4>
														<span
															class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {weakness.severity ===
															'high'
																? 'bg-red-100 text-red-800'
																: weakness.severity === 'medium'
																	? 'bg-yellow-100 text-yellow-800'
																	: 'bg-blue-100 text-blue-800'}"
														>
															{weakness.severity} priority
														</span>
													</div>
													<p class="text-orange-700 text-sm mb-2">{weakness.description}</p>
													<span
														class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
													>
														{weakness.category}
													</span>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="text-center py-8">
									<div class="text-4xl mb-4">🎉</div>
									<p class="text-gray-600">
										Great job! No significant areas for improvement identified.
									</p>
								</div>
							{/if}
						</div>
					{:else if activeTab === 'trends'}
						<!-- Trends Tab -->
						<div class="space-y-6">
							<h3 class="text-xl font-semibold text-gray-900 mb-4">📉 Academic Trends</h3>
							{#if analysis.trends && analysis.trends.hasEnoughData}
								<div class="bg-white border rounded-lg p-6">
									<div class="flex items-center justify-between mb-4">
										<h4 class="font-semibold text-gray-900">GPA Trend Analysis</h4>
										<span
											class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {analysis
												.trends?.trendDirection === 'improving'
												? 'bg-green-100 text-green-800'
												: analysis.trends?.trendDirection === 'declining'
													? 'bg-red-100 text-red-800'
													: 'bg-blue-100 text-blue-800'}"
										>
											{analysis.trends?.trendDirection === 'improving'
												? '📈 Improving'
												: analysis.trends?.trendDirection === 'declining'
													? '📉 Declining'
													: '➡️ Stable'}
										</span>
									</div>
									<p class="text-gray-600 mb-4">{analysis.trends?.trendDescription}</p>

									<!-- Yearly GPA Chart -->
									<div class="space-y-3">
										{#each analysis.trends?.gpaTrend || [] as yearData}
											<div class="flex items-center space-x-4">
												<div class="w-20 text-sm font-medium text-gray-700">{yearData.year}</div>
												<div class="flex-1 bg-gray-200 rounded-full h-6 relative">
													<div
														class="h-6 rounded-full {getGPAColor(yearData.gpa)
															.replace('text-', 'bg-')
															.replace(
																'-600',
																'-500'
															)} flex items-center justify-center text-white text-sm font-medium"
														style="width: {(yearData.gpa / 4.0) * 100}%"
													>
														{yearData.gpa.toFixed(2)}
													</div>
												</div>
											</div>
										{/each}
									</div>

									<div class="mt-4 text-sm text-gray-600">
										<strong>Change:</strong>
										{(Number(analysis.trends?.gpaChange) || 0) > 0 ? '+' : ''}{analysis.trends
											?.gpaChange} points over {analysis.trends?.yearsAnalyzed} years
									</div>
								</div>
							{:else}
								<div class="text-center py-8">
									<div class="text-4xl mb-4">📊</div>
									<p class="text-gray-600">{analysis.trends?.message}</p>
								</div>
							{/if}
						</div>
					{:else if activeTab === 'recommendations'}
						<!-- Recommendations Tab -->
						<div class="space-y-4">
							<h3 class="text-xl font-semibold text-gray-900 mb-4">
								💡 Personalized Recommendations
							</h3>
							{#if analysis.recommendations && analysis.recommendations.length > 0}
								<div class="space-y-6">
									{#each analysis.recommendations as rec}
										<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
											<div class="flex items-start space-x-3">
												<div class="text-2xl">💡</div>
												<div class="flex-1">
													<div class="flex items-center justify-between mb-2">
														<h4 class="font-semibold text-blue-900">{rec.title}</h4>
														<span
															class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {rec.priority ===
															'high'
																? 'bg-red-100 text-red-800'
																: rec.priority === 'medium'
																	? 'bg-yellow-100 text-yellow-800'
																	: 'bg-green-100 text-green-800'}"
														>
															{rec.priority} priority
														</span>
													</div>
													<p class="text-[#3c4d9c]  text-sm mb-3">{rec.description}</p>
													<div class="space-y-2">
														<h5 class="font-medium text-blue-900 text-sm">Action Steps:</h5>
														<ul class="space-y-1">
															{#each rec.actionItems as action}
																<li class="flex items-start space-x-2 text-sm text-[#3c4d9c] ">
																	<span class="text-blue-500 mt-1">•</span>
																	<span>{action}</span>
																</li>
															{/each}
														</ul>
													</div>
													<span
														class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-3"
													>
														{rec.category}
													</span>
												</div>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="text-center py-8">
									<div class="text-4xl mb-4">🎯</div>
									<p class="text-gray-600">
										Excellent! Your academic profile shows strong performance across all areas.
									</p>
								</div>
							{/if}
						</div>
					{:else if activeTab === 'competitiveness'}
						<!-- Competitiveness Tab -->
						<div class="space-y-6">
							<h3 class="text-xl font-semibold text-gray-900 mb-4">
								🎯 Admissions Competitiveness
							</h3>

							<div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6">
								<div class="text-center mb-6">
									<h4 class="text-2xl font-bold text-gray-900 mb-2">
										{analysis.competitiveness?.level}
									</h4>
									<p class="text-gray-600">{analysis.competitiveness?.description}</p>
									<div class="mt-4 flex items-center justify-center space-x-4">
										<div class="text-center">
											<div class="text-3xl font-bold text-[#2C3580]">
												{analysis.competitiveness?.gpaScore?.toFixed(2)}
											</div>
											<div class="text-sm text-gray-600">Your GPA</div>
										</div>
										<div class="text-center">
											<div class="text-3xl font-bold text-[#2C3580]">
												{analysis.competitiveness?.percentile}th
											</div>
											<div class="text-sm text-gray-600">Percentile</div>
										</div>
									</div>
								</div>

								<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div class="bg-white rounded-lg p-4">
										<h5 class="font-semibold text-gray-900 mb-2">🎓 Opportunities</h5>
										<ul class="space-y-2">
											{#each analysis.competitiveness?.opportunities || [] as opportunity}
												<li class="flex items-start space-x-2 text-sm">
													<span class="text-green-500 mt-1">✓</span>
													<span class="text-gray-700">{opportunity}</span>
												</li>
											{/each}
										</ul>
									</div>

									{#if analysis.insights && analysis.insights.length > 0}
										<div class="bg-white rounded-lg p-4 md:col-span-2">
											<h5 class="font-semibold text-gray-900 mb-2">🔍 Key Insights</h5>
											<div class="space-y-2">
												{#each analysis.insights || [] as insight}
													<div class="flex items-start space-x-2">
														<span class="text-blue-500 mt-1">
															{#if (insight as any).type === 'strength'}💪
															{:else if (insight as any).type === 'achievement'}🏆
															{:else}💡{/if}
														</span>
														<div>
															<div class="font-medium text-gray-900 text-sm">
																{(insight as any).title}
															</div>
															<div class="text-gray-600 text-sm">
																{(insight as any).description}
															</div>
														</div>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							</div>

							{#if analysis.riskFactors && analysis.riskFactors.length > 0}
								<div class="bg-red-50 border border-red-200 rounded-lg p-6">
									<h4 class="font-semibold text-red-900 mb-4">⚠️ Risk Factors to Address</h4>
									<div class="space-y-3">
										{#each analysis.riskFactors || [] as risk}
											<div class="flex items-start space-x-3">
												<span class="text-red-500 mt-1">⚠️</span>
												<div>
													<div class="font-medium text-red-900">{(risk as any).type}</div>
													<div class="text-red-700 text-sm">{(risk as any).description}</div>
												</div>
												<span
													class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {(
														risk as any
													).severity === 'high'
														? 'bg-red-100 text-red-800'
														: (risk as any).severity === 'medium'
															? 'bg-yellow-100 text-yellow-800'
															: 'bg-blue-100 text-blue-800'}"
												>
													{(risk as any).severity}
												</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="bg-white rounded-xl shadow-sm border p-6">
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<button
						on:click={refreshAnalysis}
						class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							></path>
						</svg>
						Refresh Analysis
					</button>
					<button
						on:click={goToGPAConverter}
						class="inline-flex items-center justify-center px-6 py-3 bg-[#2C3580] text-white rounded-lg hover:bg-[#3c4d9c]  transition-colors font-medium"
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							></path>
						</svg>
						Enter GPA Data
					</button>
					<a
						href="/universities"
						class="inline-flex items-center justify-center px-6 py-3 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium"
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							></path>
						</svg>
						Find Matching Universities
					</a>
				</div>
			</div>
		</div>

		<!-- Success Stats Section -->
		<div class="mt-16 bg-gray-100 rounded-lg p-8">
			<div class="text-center mb-8">
				<h3 class="text-2xl font-bold text-gray-900 mb-4">
					Trusted Academic Analysis for African Students
				</h3>
				<p class="text-gray-600">
					Empowering students with data-driven insights for study abroad success
				</p>
			</div>

			<div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
				<div>
					<div class="text-3xl font-bold text-[#2C3580]">50+</div>
					<div class="text-sm text-gray-600">Academic Systems</div>
				</div>
				<div>
					<div class="text-3xl font-bold text-[#2C3580]">1,200+</div>
					<div class="text-sm text-gray-600">Profiles Analyzed</div>
				</div>
				<div>
					<div class="text-3xl font-bold text-[#2C3580]">100%</div>
					<div class="text-sm text-gray-600">FREE Analysis</div>
				</div>
				<div>
					<div class="text-3xl font-bold text-[#2C3580]">7,000+</div>
					<div class="text-sm text-gray-600">Universities Tracked</div>
				</div>
			</div>
		</div>

		<!-- Call to Action Section -->
		<div
			class="mt-16 bg-gradient-to-r from-[#2C3580] to-[#2C3580] rounded-lg p-8 text-center text-white"
		>
			<h3 class="text-2xl font-bold mb-4">
				Ready to Take the Next Step in Your Study Abroad Journey?
			</h3>
			<p class="text-purple-100 mb-6">
				Use our comprehensive suite of tools to find the perfect universities and secure funding for
				your dreams.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a
					href="/universities"
					class="bg-white text-[#2C3580] px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition duration-200"
				>
					🏛️ Find Matching Universities
				</a>
				<a
					href="/scholarships"
					class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-[#2C3580] transition duration-200"
				>
					💰 Discover Scholarships
				</a>
				<a
					href="/sop"
					class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-[#2C3580] transition duration-200"
				>
					📝 Generate Statement of Purpose
				</a>
				<a
					href="/gpa-converter"
					class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-[#2C3580] transition duration-200"
				>
					📊 Enter Your GPA Data
				</a>
			</div>
		</div>
	{:else}
		<!-- Error State -->
		<div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
			<div class="text-4xl mb-4">❌</div>
			<h2 class="text-xl font-bold text-red-900 mb-2">Analysis Error</h2>
			<p class="text-red-700 mb-4">There was an issue analyzing your academic profile.</p>
			<button
				on:click={refreshAnalysis}
				class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
			>
				Try Again
			</button>
		</div>
	{/if}
</div>
