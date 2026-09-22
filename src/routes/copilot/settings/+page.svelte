<script lang="ts">
	import { goto } from '$app/navigation';
	import { Settings, User, Sparkles, LogOut, CheckCircle, ShieldCheck } from 'lucide-svelte';

	let { data } = $props();
	let { session, supabase } = $derived(data);

	async function handleSignOut() {
		await supabase.auth.signOut();
		goto('/');
	}
</script>

<svelte:head>
	<title>Account & Settings | Abroaducate Copilot</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
	
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-slate-900 mb-2" style="font-family: 'Outfit', sans-serif;">Account & Settings</h1>
		<p class="text-slate-500">Manage your profile and platform preferences.</p>
	</div>

	<!-- Profile Section -->
	<section class="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
		<div class="flex items-center gap-4 mb-6">
			<div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-navy to-slate-700 text-white flex items-center justify-center font-bold text-2xl shadow-md">
				{session?.user?.email?.[0]?.toUpperCase() || 'U'}
			</div>
			<div>
				<h2 class="text-xl font-bold text-slate-900" style="font-family: 'Outfit', sans-serif;">{session?.user?.email}</h2>
				<p class="text-sm text-slate-500">Student Account</p>
			</div>
		</div>

		<div class="pt-6 border-t border-slate-100 flex gap-4">
			<button onclick={handleSignOut} class="flex items-center gap-2 text-red-600 hover:bg-red-50 font-semibold px-4 py-2 rounded-xl transition-colors">
				<LogOut size={18} /> Sign Out
			</button>
		</div>
	</section>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		
		<!-- Free Access Status -->
		<section class="bg-[#0f172a] rounded-3xl p-8 shadow-lg relative overflow-hidden text-white flex flex-col justify-between">
			<!-- Glow -->
			<div class="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

			<div class="relative z-10">
				<div class="flex items-center justify-between mb-8">
					<h2 class="text-lg font-bold text-slate-300 flex items-center gap-2">
						<Sparkles size={20} class="text-emerald-400" /> Platform Access
					</h2>
					<span class="bg-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-emerald-400 border border-emerald-500/30">Free Tier</span>
				</div>

				<div class="mb-6">
					<div class="text-4xl font-extrabold tracking-tight text-white mb-2" style="font-family: 'Outfit', sans-serif;">100% Free</div>
					<div class="text-slate-400 text-sm">Full Lifetime Access Included</div>
				</div>

				<p class="text-slate-400 text-sm leading-relaxed mb-6">
					All AI strategy tools, SOP writers, personal statements, and scholarship recommendations are completely free to use.
				</p>
			</div>

			<div class="relative z-10 pt-4 border-t border-white/10 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
				<ShieldCheck size={16} /> No credit cards, limits, or paywalls
			</div>
		</section>

		<!-- Platform Features Included -->
		<section class="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between">
			<div>
				<h2 class="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2" style="font-family: 'Outfit', sans-serif;">
					Included Tools
				</h2>

				<ul class="space-y-4 text-sm text-slate-600">
					<li class="flex items-start gap-3">
						<CheckCircle size={18} class="text-emerald-500 shrink-0 mt-0.5" />
						<span><strong>SOP & Cover Letter Generator:</strong> AI-powered drafts tailored to your profile.</span>
					</li>
					<li class="flex items-start gap-3">
						<CheckCircle size={18} class="text-emerald-500 shrink-0 mt-0.5" />
						<span><strong>Scholarship Strategy Board:</strong> Win strategies and requirement breakdown.</span>
					</li>
					<li class="flex items-start gap-3">
						<CheckCircle size={18} class="text-emerald-500 shrink-0 mt-0.5" />
						<span><strong>Cold Email Outreach:</strong> Tailored professor outreach emails.</span>
					</li>
					<li class="flex items-start gap-3">
						<CheckCircle size={18} class="text-emerald-500 shrink-0 mt-0.5" />
						<span><strong>Relocation & Partner Hub:</strong> Direct access to vetted visa, bank, and insurance partners.</span>
					</li>
				</ul>
			</div>

			<div class="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400">
				Abroaducate is committed to keeping admissions accessible to all international students.
			</div>
		</section>

	</div>
</div>
