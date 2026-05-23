<script lang="ts">
	import { ArrowRight, BookMarked, Wallet, Zap, Clock, TrendingUp } from 'lucide-svelte';
	import { programCatalog } from '$lib/copilot/data/program-catalog';

	let { data }: { data: any } = $props();
	let { session } = $derived(data);

	// Mocking a couple of 'saved' programs that the user is actively working on
	const savedPrograms = [
		programCatalog[1], // M.Sc. Data Science
		programCatalog[2]  // M.Sc. Quantum Engineering
	];
</script>

<svelte:head>
	<title>My Dashboard | Abroaducate Copilot</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-8">
	<!-- Top Welcome Area -->
	<header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
		<div>
			<div class="text-sm font-bold tracking-widest text-orange-500 uppercase mb-2">Command Center</div>
			<h1 class="text-3xl font-bold text-slate-900" style="font-family: 'Outfit', sans-serif;">
				Welcome back, {session?.user?.email?.split('@')[0] || 'Scholar'}.
			</h1>
			<p class="text-slate-500 mt-2">Here is a summary of your active study-abroad pathways.</p>
		</div>
		<div class="flex items-center gap-3">
			<a href="/programs" class="bg-brand-navy hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm shadow-md">
				Find New Programs <ArrowRight size={16} />
			</a>
		</div>
	</header>

	<!-- Quick Stats Row -->
	<section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
			<div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
				<Wallet size={24} />
			</div>
			<div>
				<div class="text-2xl font-black text-slate-900 leading-none" style="font-family: 'Outfit', sans-serif;">13</div>
				<div class="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">API Credits</div>
			</div>
		</div>
		
		<div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
			<div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
				<BookMarked size={24} />
			</div>
			<div>
				<div class="text-2xl font-black text-slate-900 leading-none" style="font-family: 'Outfit', sans-serif;">2</div>
				<div class="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">Saved Programs</div>
			</div>
		</div>

		<div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
			<div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
				<Zap size={24} />
			</div>
			<div>
				<div class="text-2xl font-black text-slate-900 leading-none" style="font-family: 'Outfit', sans-serif;">4</div>
				<div class="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">Active Documents</div>
			</div>
		</div>

		<div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
			<div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
				<Clock size={24} />
			</div>
			<div>
				<div class="text-2xl font-black text-slate-900 leading-none" style="font-family: 'Outfit', sans-serif;">12</div>
				<div class="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">Days to Deadline</div>
			</div>
		</div>
	</section>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
		
		<!-- Main Active Programs Grid -->
		<div class="lg:col-span-2 space-y-6">
			<div class="flex justify-between items-center mb-2">
				<h2 class="text-xl font-bold text-slate-900" style="font-family: 'Outfit', sans-serif;">Your Strategy Boards</h2>
				<a href="/copilot/programs" class="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">View All</a>
			</div>
			
			<div class="space-y-4">
				{#each savedPrograms as program}
					<a 
						href={`/copilot/program?programId=${program.id}`} 
						class="block bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group relative overflow-hidden"
					>
						<div class="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
						
						<div class="flex items-start justify-between relative z-10">
							<div class="flex gap-5">
								<div class="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
									<img src="https://ui-avatars.com/api/?name={program.university}&background=f8fafc&color=0f172a&bold=true" alt="logo" class="w-10 h-10 object-contain rounded-lg" />
								</div>
								<div>
									<div class="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">{program.university}</div>
									<h3 class="text-lg font-bold text-slate-900 group-hover:text-orange-500 transition-colors">{program.program_name}</h3>
									<div class="flex gap-4 mt-3">
										<span class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Intake: {program.next_intake}</span>
										<span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Tuition: {program.tuition}</span>
									</div>
								</div>
							</div>
							
							<div class="flex flex-col items-end">
								<div class="text-right mb-2">
									<div class="text-3xl font-black text-slate-900 leading-none" style="font-family: 'Outfit', sans-serif;">91<span class="text-base text-slate-400 font-medium">/100</span></div>
									<div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Match Score</div>
								</div>
								<div class="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-brand-navy group-hover:text-white flex items-center justify-center transition-colors">
									<ArrowRight size={18} />
								</div>
							</div>
						</div>
					</a>
				{/each}

				<a href="/programs" class="flex flex-col items-center justify-center bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-3xl p-8 hover:bg-slate-100 hover:border-slate-300 transition-colors group">
					<div class="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-brand-navy group-hover:scale-110 transition-all mb-3">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
					</div>
					<div class="font-bold text-slate-700">Add another program</div>
					<div class="text-sm text-slate-500 mt-1">Explore universities and zero-tuition pathways</div>
				</a>
			</div>
		</div>

		<!-- Right Column: Recent Activity / Announcements -->
		<div class="space-y-6">
			<div class="bg-[#0f172a] rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
				<div class="absolute -right-10 -top-10 w-40 h-40 bg-orange-500 rounded-full blur-[60px] opacity-20 pointer-events-none"></div>
				<h3 class="font-bold text-lg mb-4 flex items-center gap-2" style="font-family: 'Outfit', sans-serif;"><TrendingUp size={18} class="text-orange-400" /> Platform Updates</h3>
				
				<div class="space-y-4">
					<div class="border-l-2 border-orange-500 pl-4 py-1">
						<div class="text-xs text-slate-400 font-medium mb-1">Today</div>
						<div class="text-sm font-semibold">New Zero-Tuition Pathways Added</div>
						<div class="text-xs text-slate-400 mt-1">We just indexed 12 new English-taught programs in Norway and Germany.</div>
					</div>
					<div class="border-l-2 border-slate-700 pl-4 py-1">
						<div class="text-xs text-slate-400 font-medium mb-1">Oct 24</div>
						<div class="text-sm font-semibold text-slate-300">New Motivation Letter AI Model</div>
						<div class="text-xs text-slate-400 mt-1">Your document coaching cards now use our upgraded scoring logic.</div>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
				<h3 class="font-bold text-slate-900 mb-4" style="font-family: 'Outfit', sans-serif;">Action Checklist</h3>
				<div class="space-y-3">
					<label class="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent transition-colors">
						<input type="checkbox" checked class="mt-1 w-4 h-4 rounded text-emerald-500 border-slate-300">
						<div>
							<div class="text-sm font-semibold text-slate-600 line-through">Run Right-Fit Check</div>
						</div>
					</label>
					<label class="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent transition-colors">
						<input type="checkbox" class="mt-1 w-4 h-4 rounded text-orange-500 border-slate-300">
						<div>
							<div class="text-sm font-semibold text-slate-900">Upload Academic Transcripts</div>
							<div class="text-xs text-slate-500 mt-0.5">Required for Quantum Engineering</div>
						</div>
					</label>
					<label class="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent transition-colors">
						<input type="checkbox" class="mt-1 w-4 h-4 rounded text-orange-500 border-slate-300">
						<div>
							<div class="text-sm font-semibold text-slate-900">Draft Motivation Letter</div>
							<div class="text-xs text-slate-500 mt-0.5">Data Science deadline approaching</div>
						</div>
					</label>
				</div>
			</div>
		</div>

	</div>
</div>
