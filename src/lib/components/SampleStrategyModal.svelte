<script lang="ts">
	import { X } from 'lucide-svelte';

	let { show = $bindable(false) } = $props();

	function close() {
		show = false;
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			close();
		}
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
				<h2 id="sample-modal-title" class="text-xl font-bold text-slate-900">
					Sample Scholarship Strategy Output
				</h2>
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
				<!-- Program Header -->
				<div class="bg-slate-50 rounded-xl p-5 border border-slate-200">
					<div class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Example Program</div>
					<h3 class="text-2xl font-bold text-slate-900 mb-2">Computer Science (M.Sc.)</h3>
					<p class="text-slate-600">Technische Universität Berlin, Germany</p>
				</div>

				<!-- Fit Score Card -->
				<div class="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
					<div class="flex items-center justify-between mb-4">
						<div>
							<div class="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-1">Your Fit Score</div>
							<div class="text-5xl font-extrabold text-emerald-600">82/100</div>
						</div>
						<div class="w-24 h-24 rounded-full border-8 border-emerald-500 flex items-center justify-center bg-white">
							<span class="text-2xl font-bold text-emerald-600">A</span>
						</div>
					</div>
					<p class="text-slate-700 leading-relaxed">
						<strong>Strong match.</strong> Your academic background aligns well with the program requirements. Focus on highlighting your software engineering experience and relevant projects in your application.
					</p>
				</div>

				<!-- Top 5 Scholarships -->
				<div>
					<h4 class="text-lg font-bold text-slate-900 mb-4">Top 5 Scholarships You Qualify For</h4>
					<div class="space-y-3">
						{#each [
							{ name: 'DAAD Scholarship', match: 88, covers: 'Full tuition + €850/month stipend', deadline: 'Nov 15, 2026' },
							{ name: 'Deutschlandstipendium', match: 75, covers: '€300/month for 2 semesters', deadline: 'Sep 30, 2026' },
							{ name: 'Heinrich Böll Foundation', match: 72, covers: 'Full tuition + €1,200/month', deadline: 'Mar 1, 2027' },
							{ name: 'DAAD-STIBET', match: 68, covers: 'One-time €500 grant', deadline: 'Rolling' },
							{ name: 'Friedrich Ebert Foundation', match: 65, covers: 'Full tuition + living costs', deadline: 'Apr 30, 2027' }
						] as scholarship}
							<div class="bg-white rounded-lg p-4 border border-slate-200 hover:border-orange-300 transition-colors">
								<div class="flex items-start justify-between mb-2">
									<div class="flex-1">
										<h5 class="font-bold text-slate-900">{scholarship.name}</h5>
										<p class="text-sm text-slate-600">{scholarship.covers}</p>
									</div>
									<div class="flex items-center gap-2">
										<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
											{scholarship.match}% match
										</span>
									</div>
								</div>
								<div class="text-xs text-slate-500">
									<strong>Deadline:</strong> {scholarship.deadline}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Application Tips -->
				<div class="bg-blue-50 rounded-xl p-5 border border-blue-200">
					<h4 class="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
						<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
						Application Tips for Your Profile
					</h4>
					<ul class="space-y-2 text-slate-700">
						<li class="flex gap-2">
							<span class="text-blue-500 font-bold">→</span>
							<span>Emphasize your 3.6 GPA in your motivation letter — it's above the typical admitted student average.</span>
						</li>
						<li class="flex gap-2">
							<span class="text-blue-500 font-bold">→</span>
							<span>Mention your internship at Microsoft — TU Berlin values industry experience in CS applicants.</span>
						</li>
						<li class="flex gap-2">
							<span class="text-blue-500 font-bold">→</span>
							<span>Apply for DAAD first (highest match) — deadline is Nov 15, 3 months before program application.</span>
						</li>
					</ul>
				</div>

				<!-- CTA Footer -->
				<div class="bg-slate-900 rounded-xl p-6 text-white">
					<h4 class="text-lg font-bold mb-2">This is what you'll get for YOUR program</h4>
					<p class="text-slate-300 mb-4 text-sm">
						Personalized fit score, scholarship matches, and application strategy based on your actual academic profile.
					</p>
					<button 
						onclick={close}
						class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all"
					>
						Got it — Unlock My Strategy
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fadeIn {
		animation: fadeIn 0.2s ease-out;
	}

	.animate-slideUp {
		animation: slideUp 0.3s ease-out;
	}
</style>
