<script lang="ts">
	import { RefreshCw } from 'lucide-svelte';

	let {
		aiWinStrategy = $bindable(null),
		aiStrategyLoading = false,
		aiStrategyError = null,
		generationPhase = '',
		strategyActiveTab = $bindable('overview'),
		winEligibility = [],
		winRubric = [],
		winPlan = { topActions: [], evidence: [], redFlags: [] },
		onReveal
	}: {
		aiWinStrategy: any;
		aiStrategyLoading: boolean;
		aiStrategyError: string | null;
		generationPhase: string;
		strategyActiveTab: string;
		winEligibility: any[];
		winRubric: any[];
		winPlan: { topActions: string[]; evidence: string[]; redFlags: string[] };
		onReveal: () => void;
	} = $props();

	function weightToLabel(w: number) {
		if (w >= 0.8) return 'Critical';
		if (w >= 0.5) return 'High';
		if (w >= 0.3) return 'Medium';
		return 'Low';
	}

	function weightToWidth(w: number) {
		return `${Math.round((w || 0) * 100)}%`;
	}
</script>

<div class="bg-slate-900 rounded-3xl p-8 md:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
	<div class="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px]"></div>

	<div class="flex items-center justify-between gap-3 mb-8 relative z-10">
		<h2 class="text-2xl lg:text-3xl font-extrabold text-white flex items-center gap-3">
			<svg class="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
			</svg>
			Copilot Strategy
		</h2>
		<span class="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700">
			{aiWinStrategy ? 'Unlocked' : 'Free Preview'}
		</span>
	</div>

	{#if !aiWinStrategy}
		<!-- Reveal button -->
		<div class="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-8 relative z-10">
			<p class="text-xl text-white font-bold mb-4">Unlock the Strategy Board for this scholarship</p>
			<ul class="text-slate-300 space-y-3 mb-8 text-lg">
				<li class="flex items-center gap-3">
					<svg class="w-6 h-6 text-emerald-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
					Exact Eligibility match using your profile
				</li>
				<li class="flex items-center gap-3">
					<svg class="w-6 h-6 text-emerald-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
					Committee Selection Rubric breakdown
				</li>
				<li class="flex items-center gap-3">
					<svg class="w-6 h-6 text-emerald-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
					Essay narrative angles & evidence requested
				</li>
			</ul>
			<button
				onclick={onReveal}
				disabled={aiStrategyLoading}
				class="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-center hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/20 text-lg disabled:opacity-75 disabled:cursor-wait flex items-center justify-center gap-3"
			>
				{#if aiStrategyLoading}
					<svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
					<span class="animate-pulse">{generationPhase || 'Loading AI Engine...'}</span>
				{:else}
					Reveal Strategy (1 Credit)
				{/if}
			</button>
			{#if aiStrategyError}
				<div class="mt-4 text-sm text-red-400">{aiStrategyError}</div>
			{/if}
		</div>
	{:else}
		<!-- Strategy tabs -->
		<div class="relative z-10 space-y-6">
			<div class="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5">
				<div class="flex items-center justify-between mb-2">
					<div class="text-sm font-bold text-emerald-400">AI strategy compiled</div>
					<button class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors" onclick={onReveal}>
						<RefreshCw size={12} class={aiStrategyLoading ? 'animate-spin' : ''} />
						Regenerate
					</button>
				</div>
				<div class="text-sm text-emerald-100">{aiWinStrategy.summary || 'Use this plan to improve your odds.'}</div>
			</div>

			<div class="flex flex-wrap gap-2 border-b border-slate-700/50">
				<button onclick={() => strategyActiveTab = 'overview'} class="px-5 py-3 font-bold text-sm tracking-wide rounded-t-lg transition-all border-b-2 {strategyActiveTab === 'overview' ? 'text-orange-400 border-orange-500 bg-slate-800/50' : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'}">Overview</button>
				<button onclick={() => strategyActiveTab = 'audit'} class="px-5 py-3 font-bold text-sm tracking-wide rounded-t-lg transition-all border-b-2 {strategyActiveTab === 'audit' ? 'text-emerald-400 border-emerald-500 bg-slate-800/50' : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'}">Document Audit</button>
				<button onclick={() => strategyActiveTab = 'action'} class="px-5 py-3 font-bold text-sm tracking-wide rounded-t-lg transition-all border-b-2 {strategyActiveTab === 'action' ? 'text-blue-400 border-blue-500 bg-slate-800/50' : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'}">Action Path</button>
			</div>

			<div class="animate-in fade-in slide-in-from-bottom-2 duration-300">
				{#if strategyActiveTab === 'overview'}
					<div class="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-6 shadow-inner">
						<h3 class="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2">Coach's Assessment</h3>
						<p class="text-lg text-orange-100 font-medium leading-relaxed">{aiWinStrategy.summary || 'Use this plan to improve your odds.'}</p>
					</div>
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
						<div class="rounded-2xl border border-slate-700 bg-slate-800 p-6">
							<div class="text-sm font-bold text-white mb-5 uppercase tracking-wider">Eligibility Check</div>
							<div class="space-y-4">
								{#each winEligibility as c (c.label)}
									<div class="flex items-start justify-between gap-3">
										<div class="text-sm text-slate-300 font-medium">{c.label}</div>
										<div class="text-right">
											<div class="text-[10px] font-bold uppercase tracking-wider rounded border px-2 py-0.5 inline-block {c.status === 'pass' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : c.status === 'fail' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}">
												{c.status === 'pass' ? 'Pass' : c.status === 'fail' ? 'Fail' : 'Unknown'}
											</div>
											{#if c.detail}<div class="text-[10px] text-slate-500 mt-1">{c.detail}</div>{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
						<div class="rounded-2xl border border-slate-700 bg-slate-800 p-6">
							<div class="text-sm font-bold text-white mb-5 uppercase tracking-wider">Committee Rubric</div>
							<div class="space-y-5">
								{#each (aiWinStrategy?.rubric || winRubric) as r (r.key || r.label)}
									<div class="group">
										<div class="flex items-center justify-between gap-3 mb-2">
											<div class="text-sm font-semibold text-slate-200" title={r.reason}>{r.label}</div>
											<div class="text-[10px] font-bold uppercase tracking-widest text-orange-400">{weightToLabel(r.weight)}</div>
										</div>
										<div class="h-2 rounded-full bg-slate-700 overflow-hidden mb-1">
											<div class="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500" style="width: {weightToWidth(r.weight)}"></div>
										</div>
										<p class="text-xs text-slate-500 hidden group-hover:block">{r.reason}</p>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{:else if strategyActiveTab === 'audit'}
					<div class="space-y-6">
						{#if aiWinStrategy.document_audit && aiWinStrategy.document_audit.length > 0}
							<div class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
								<h3 class="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">Document Insights</h3>
								<ul class="space-y-4">
									{#each aiWinStrategy.document_audit as audit}
										<li class="text-emerald-100 text-lg leading-relaxed border-l-2 border-emerald-500/50 pl-4 py-1">{audit}</li>
									{/each}
								</ul>
							</div>
						{/if}
						<div class="rounded-2xl border border-slate-700 bg-slate-800 p-6">
							<div class="text-sm font-bold text-white mb-4 uppercase tracking-wider">Narrative Angles to Leverage</div>
							{#if aiWinStrategy.narrative_angles && aiWinStrategy.narrative_angles.length > 0}
								<ul class="text-slate-300 space-y-4">
									{#each aiWinStrategy.narrative_angles as angle}
										<li class="leading-relaxed bg-slate-700/30 p-4 rounded-xl border border-slate-600/50"><span class="text-orange-400 font-bold mr-2">»</span>{angle}</li>
									{/each}
								</ul>
							{:else}
								<p class="text-slate-400 italic">No specific angles identified. Provide a richer document or profile for better context.</p>
							{/if}
						</div>
					</div>
				{:else if strategyActiveTab === 'action'}
					<div class="space-y-6">
						<div class="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6">
							<div class="text-sm font-bold text-blue-400 mb-4 uppercase tracking-wider">Chronological Action Path</div>
							<ol class="space-y-4 text-blue-50">
								{#each (aiWinStrategy?.top_actions || winPlan.topActions) as a, index (a)}
									<li class="pl-2 leading-relaxed flex items-start gap-3">
										<div class="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs mt-0.5 border border-blue-500/30">{index + 1}</div>
										<div>{a}</div>
									</li>
								{/each}
							</ol>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="rounded-2xl border border-slate-700 bg-slate-800 p-6">
								<div class="text-sm font-bold text-white mb-4 uppercase tracking-wider">Required Evidence</div>
								<ul class="text-slate-300 space-y-3 list-disc pl-5">
									{#each (aiWinStrategy?.evidence || winPlan.evidence) as e (e)}
										<li class="pl-2 leading-relaxed">{e}</li>
									{/each}
								</ul>
							</div>
							<div class="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
								<div class="text-sm font-bold text-red-400 mb-4 uppercase tracking-wider">Red Flags / Risks to Bridge</div>
								<ul class="text-red-200 space-y-3 list-disc pl-5">
									{#each (aiWinStrategy?.red_flags || winPlan.redFlags) as rf (rf)}
										<li class="pl-2 leading-relaxed">{rf}</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
