<script lang="ts">
	import { X, ExternalLink, GraduationCap, CheckCircle2, Sparkles, BookOpen, Clock, ShieldCheck } from 'lucide-svelte';

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
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm transition-all"
		onclick={handleBackdropClick}
	>
		<div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
			<!-- Header Banner -->
			<div class="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-7 overflow-hidden">
				<div class="absolute -right-12 -top-12 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl pointer-events-none"></div>
				<div class="absolute -left-12 -bottom-12 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>

				<!-- Close Button -->
				<button
					onclick={close}
					class="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
					aria-label="Close modal"
				>
					<X size={20} />
				</button>

				<div class="flex items-center gap-2 mb-3">
					<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
						<Sparkles size={13} /> Free Student Benefit
					</span>
					<span class="text-xs text-slate-400 font-medium">Study Overseas AI Partner</span>
				</div>

				<h2 class="text-2xl font-extrabold text-white tracking-tight" style="font-family: 'Outfit', sans-serif;">
					AI IELTS Prep Center
				</h2>
				<p class="text-slate-300 text-sm mt-1 leading-relaxed">
					Practice with full-length adaptive IELTS mock exams and get instant AI band predictions.
				</p>
			</div>

			<!-- Body: Quick Instructions -->
			<div class="p-6 sm:p-7 space-y-5 bg-slate-50/50">
				<div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3.5">
					<h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
						<BookOpen size={14} class="text-orange-500" /> How to Access Your Free Tests
					</h3>

					<div class="flex items-start gap-3">
						<div class="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center mt-0.5">
							1
						</div>
						<div>
							<p class="text-sm font-semibold text-slate-800">Launch Dedicated Exam Server</p>
							<p class="text-xs text-slate-500 leading-relaxed">Click below to open our testing engine on <span class="font-mono text-slate-700 font-medium">abroaducate.studyoverseas.ai</span>.</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center mt-0.5">
							2
						</div>
						<div>
							<p class="text-sm font-semibold text-slate-800">One-Time Test Account</p>
							<p class="text-xs text-slate-500 leading-relaxed">If visiting for the first time, click <strong>"Sign Up"</strong> on the portal to create your test taker profile (takes 15 seconds).</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs flex items-center justify-center mt-0.5">
							3
						</div>
						<div>
							<p class="text-sm font-semibold text-slate-800">Begin Free Practice</p>
							<p class="text-xs text-slate-500 leading-relaxed">Start taking unlimited section mocks, AI speaking reviews, and timed simulations immediately.</p>
						</div>
					</div>
				</div>

				<!-- Features list -->
				<div class="grid grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
					<div class="flex items-center gap-1.5"><CheckCircle2 size={14} class="text-emerald-500 flex-shrink-0" /> Full Mock Exams</div>
					<div class="flex items-center gap-1.5"><CheckCircle2 size={14} class="text-emerald-500 flex-shrink-0" /> AI Band Predictions</div>
					<div class="flex items-center gap-1.5"><CheckCircle2 size={14} class="text-emerald-500 flex-shrink-0" /> Speaking & Writing AI</div>
					<div class="flex items-center gap-1.5"><CheckCircle2 size={14} class="text-emerald-500 flex-shrink-0" /> 100% Free Forever</div>
				</div>

				<!-- Free Download Bonus Card -->
				<div class="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-3">
					<div class="flex items-center gap-2.5">
						<div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center flex-shrink-0">
							<BookOpen size={16} />
						</div>
						<div>
							<p class="text-xs font-bold text-slate-800">Free 30-Day IELTS Band 7.5 Plan</p>
							<p class="text-[11px] text-slate-500">Download the complete step-by-step PDF</p>
						</div>
					</div>
					<a
						href="https://solakolawole6.gumroad.com/l/ielts2"
						target="_blank"
						rel="noopener noreferrer"
						class="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1 flex-shrink-0"
					>
						<span>Get Free PDF</span>
						<ExternalLink size={12} />
					</a>
				</div>

				<!-- Action Buttons -->
				<div class="space-y-2 pt-1">
					<a
						href="https://abroaducate.studyoverseas.ai"
						target="_blank"
						rel="noopener noreferrer"
						onclick={close}
						class="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.01]"
					>
						<span>Launch Online Mock Engine</span>
						<ExternalLink size={16} />
					</a>

					<p class="text-center text-[11px] text-slate-400 font-medium">
						Free full mock exams & AI band predictions powered by Study Overseas AI
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}
