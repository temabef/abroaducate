<script lang="ts">
	import { X, CheckCircle2, AlertTriangle, Minus, Lightbulb } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let { show = $bindable(false) } = $props();

	function close() {
		show = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			close();
		}
	}

	function goToPrograms() {
		close();
		goto('/programs');
	}

	const rubricItems = [
		{ label: 'GPA / Academic Strength', level: 'low', badge: 'Below Range', description: 'GPA is below the competitive range for this PhD program. Retaking courses or enrolling in additional certifications can help.' },
		{ label: 'Language Requirements', level: 'missing', badge: 'Not Provided', description: 'IELTS or TOEFL scores required but not yet provided. Prioritise taking a language test soon.' },
		{ label: 'Field of Study Fit', level: 'medium', badge: 'Medium', description: 'Computer science background aligns with the program. Emphasise research experience in your application.' },
		{ label: 'Research / Work Experience', level: 'medium', badge: 'Medium', description: 'Prior project or internship experience is relevant. Highlight specific technical contributions.' },
	];

	const sopAngles = [
		'Discuss how your unique experiences in computer science have shaped your research goals',
		'Highlight specific challenges you\'ve overcome in your academic journey that show resilience',
		'Connect your career aspirations directly to the training and research environment at this institution',
	];

	const actionPath = [
		{ step: 1, text: 'Retake or supplement relevant coursework to strengthen your GPA profile' },
		{ step: 2, text: 'Prepare for and schedule an IELTS or TOEFL exam within the next 6 weeks' },
		{ step: 3, text: 'Research faculty members whose research aligns with your interests and send brief emails' },
		{ step: 4, text: 'Draft your Statement of Purpose using the narrative angles above' },
		{ step: 5, text: 'Gather 2–3 strong recommendation letters from academic or professional contacts' },
		{ step: 6, text: 'Submit the scholarship application before the deadline — aim for 2 weeks early' },
	];

	function levelColor(level: string) {
		if (level === 'low') return 'bg-red-100 text-red-700';
		if (level === 'medium') return 'bg-amber-100 text-amber-700';
		if (level === 'high') return 'bg-green-100 text-green-700';
		return 'bg-slate-100 text-slate-600';
	}

	function levelIcon(level: string) {
		if (level === 'low') return AlertTriangle;
		if (level === 'medium') return Minus;
		if (level === 'missing') return AlertTriangle;
		return CheckCircle2;
	}
</script>

{#if show}
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="sample-modal-title"
	>
		<div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">

			<!-- Header -->
			<div class="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
				<div>
					<h2 id="sample-modal-title" class="text-xl font-bold text-slate-900">
						Sample Scholarship Win Strategy
					</h2>
					<p class="text-sm text-slate-500 mt-0.5">This is what you get for <strong class="text-orange-600">1 credit</strong> when you unlock a scholarship strategy</p>
				</div>
				<button
					onclick={close}
					class="text-slate-400 hover:text-slate-600 transition-colors"
					aria-label="Close modal"
				>
					<X size={24} />
				</button>
			</div>

			<!-- Content -->
			<div class="p-6 space-y-6">

				<!-- Scholarship Header -->
				<div class="bg-slate-50 rounded-xl p-5 border border-slate-200">
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1">
							<div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Example Scholarship</div>
							<h3 class="text-2xl font-bold text-slate-900 mb-1">NHR Graduate School Fellowship 2026</h3>
							<p class="text-slate-600 text-sm">National High Performance Computing (NHR) — Germany</p>
						</div>
						<div class="text-right shrink-0">
							<div class="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
								Full tuition + €2,200/month
							</div>
						</div>
					</div>
				</div>

				<!-- Clarity Engine Summary -->
				<div class="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-5">
					<div class="flex items-center gap-2 mb-2">
						<svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
						<span class="text-sm font-bold text-blue-900">Clarity Engine Summary</span>
					</div>
					<p class="text-sm text-blue-800 leading-relaxed">
						You have a strong background in computer science that aligns well with this program. Focus on highlighting your research interests and relevant projects. Your lack of language proficiency scores could be a barrier — prioritise taking IELTS or TOEFL soon. Your GPA needs attention before this scholarship becomes competitive for you.
					</p>
				</div>

				<!-- Committee Rubric -->
				<div>
					<h4 class="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
						<svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
						Committee Selection Rubric
					</h4>
					<div class="space-y-3">
						{#each rubricItems as item}
							<div class="flex items-start gap-3 bg-white rounded-xl p-4 border border-slate-200">
								<span class="px-2.5 py-1 rounded-full text-xs font-bold shrink-0 {levelColor(item.level)}">
									{item.badge}
								</span>
								<div class="flex-1 min-w-0">
									<p class="font-semibold text-slate-900 text-sm">{item.label}</p>
									<p class="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.description}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- SOP Narrative Angles -->
				<div class="bg-slate-50 rounded-xl p-5 border border-slate-200">
					<h4 class="font-bold text-slate-900 mb-3 flex items-center gap-2">
						<svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
						SOP Narrative Angles
					</h4>
					<ul class="space-y-2">
						{#each sopAngles as angle}
							<li class="flex items-start gap-2.5 text-sm text-slate-700">
								<Lightbulb size={16} class="text-purple-500 mt-0.5 shrink-0" />
								<span>"{angle}"</span>
							</li>
						{/each}
					</ul>
				</div>

				<!-- Chronological Action Path -->
				<div class="bg-green-50 rounded-xl p-5 border border-green-200">
					<h4 class="font-bold text-slate-900 mb-4 flex items-center gap-2">
						<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
						Chronological Action Path
					</h4>
					<ol class="space-y-3">
						{#each actionPath as item}
							<li class="flex items-start gap-3">
								<span class="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{item.step}</span>
								<span class="text-sm text-slate-700 leading-relaxed">{item.text}</span>
							</li>
						{/each}
					</ol>
				</div>

				<!-- Risks to Bridge -->
				<div class="bg-red-50 rounded-xl p-5 border border-red-200">
					<h4 class="font-bold text-slate-900 mb-3 flex items-center gap-2">
						<AlertTriangle size={18} class="text-red-500" />
						Risks to Bridge Before Applying
					</h4>
					<ul class="space-y-2 text-sm text-slate-700">
						<li class="flex items-start gap-2.5">
							<AlertTriangle size={15} class="text-red-500 shrink-0 mt-0.5" />
							<span>Missing language proficiency scores — applications without IELTS/TOEFL are typically rejected outright</span>
						</li>
						<li class="flex items-start gap-2.5">
							<AlertTriangle size={15} class="text-red-500 shrink-0 mt-0.5" />
							<span>GPA below typical admitted student range — consider supplementary evidence like research publications or strong recommendations</span>
						</li>
					</ul>
				</div>

				<!-- CTA Footer -->
				<div class="bg-slate-900 rounded-xl p-6 text-white">
					<div class="flex items-start gap-4 mb-5">
						<div class="flex-1">
							<h4 class="text-lg font-bold mb-1">This is what you'll get for YOUR scholarships</h4>
							<p class="text-slate-300 text-sm leading-relaxed">
								Personalised eligibility match, committee rubric, essay angles, and step-by-step action path — tailored to your actual academic profile. In 30 seconds.
							</p>
						</div>
					</div>
					<div class="grid grid-cols-2 gap-3 mb-5 text-xs">
						<div class="flex items-center gap-2 text-slate-300">
							<CheckCircle2 size={14} class="text-emerald-400 shrink-0" />
							Eligibility match for each scholarship
						</div>
						<div class="flex items-center gap-2 text-slate-300">
							<CheckCircle2 size={14} class="text-emerald-400 shrink-0" />
							What selection committees look for
						</div>
						<div class="flex items-center gap-2 text-slate-300">
							<CheckCircle2 size={14} class="text-emerald-400 shrink-0" />
							Essay angles tailored to you
						</div>
						<div class="flex items-center gap-2 text-slate-300">
							<CheckCircle2 size={14} class="text-emerald-400 shrink-0" />
							Step-by-step action path
						</div>
					</div>
					<div class="border-t border-slate-700 pt-4">
						<p class="text-center text-slate-400 text-sm mb-4">
							This strategy costs <span class="font-bold text-orange-400">1 credit</span>. You start with <span class="font-bold text-white">3 free credits</span> — no card required.
						</p>
						<div class="flex gap-3">
							<button
								onclick={close}
								class="flex-1 py-3 px-4 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 rounded-lg text-sm font-semibold transition-all"
							>
								Close
							</button>
							<button
								onclick={goToPrograms}
								class="flex-2 flex-grow py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-all text-sm"
							>
								Browse Programs & Unlock Strategy →
							</button>
						</div>
					</div>
				</div>

			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes slideUp {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fadeIn { animation: fadeIn 0.2s ease-out; }
	.animate-slideUp { animation: slideUp 0.3s ease-out; }
</style>
