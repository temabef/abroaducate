<script lang="ts">
	import { goto } from '$app/navigation';
	import { Settings, User, CreditCard, LogOut, Receipt, History } from 'lucide-svelte';

	let { data } = $props();
	let { session, supabase } = $derived(data);
	
	// Mocking credit history for the UI
	const transactions = [
		{ date: 'Oct 24, 2026', action: 'Motivation Letter Review', amount: -2, balance: 13 },
		{ date: 'Oct 21, 2026', action: 'Accelerator Pack Purchase', amount: 15, balance: 15 },
		{ date: 'Oct 15, 2026', action: 'Right-Fit Competitiveness Score', amount: -1, balance: 0 },
		{ date: 'Oct 14, 2026', action: 'Signup Welcome Bonus', amount: 1, balance: 1 }
	];

	async function handleSignOut() {
		await supabase.auth.signOut();
		goto('/');
	}
</script>

<svelte:head>
	<title>Settings & Billing | Strategy Board</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
	
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-slate-900 mb-2" style="font-family: 'Outfit', sans-serif;">Settings & Billing</h1>
		<p class="text-slate-500">Manage your profile, API credits, and transaction history.</p>
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
		
		<!-- Credit Balance -->
		<section class="bg-[#0f172a] rounded-3xl p-8 shadow-lg relative overflow-hidden text-white">
			<!-- Glow -->
			<div class="absolute -right-20 -top-20 w-64 h-64 bg-orange-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

			<div class="relative z-10 flex flex-col h-full">
				<div class="flex items-center justify-between mb-8">
					<h2 class="text-lg font-bold text-slate-300 flex items-center gap-2">
						<CreditCard size={20} class="text-orange-400" /> API Credits
					</h2>
					<span class="bg-white/10 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-emerald-400 border border-white/10">Pay-As-You-Go</span>
				</div>

				<div class="mb-8">
					<div class="text-6xl font-extrabold tracking-tighter" style="font-family: 'Outfit', sans-serif;">13</div>
					<div class="text-slate-400 text-sm mt-2">Available Credits</div>
				</div>

				<div class="mt-auto">
					<a href="/pricing" class="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-orange-500/30">
						Buy Credit Pack
					</a>
				</div>
			</div>
		</section>

		<!-- Transaction History -->
		<section class="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col h-full">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-lg font-bold text-slate-900 flex items-center gap-2" style="font-family: 'Outfit', sans-serif;">
					<History size={20} class="text-slate-400" /> Recent Usage
				</h2>
			</div>

			<div class="space-y-4 flex-1">
				{#each transactions as tx}
					<div class="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0">
						<div>
							<div class="font-semibold text-sm text-slate-800">{tx.action}</div>
							<div class="text-xs text-slate-400 mt-0.5">{tx.date}</div>
						</div>
						<div class="text-right">
							<div class={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
								{tx.amount > 0 ? '+' : ''}{tx.amount}
							</div>
							<div class="text-xs text-slate-400">Bal: {tx.balance}</div>
						</div>
					</div>
				{/each}
			</div>

			<button class="mt-6 w-full py-3 text-sm font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200">
				View Full History
			</button>
		</section>

	</div>
</div>
