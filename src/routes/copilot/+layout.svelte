<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { 
		LayoutDashboard, 
		Briefcase, 
		FileText, 
		Wallet, 
		Settings, 
		LogOut,
		Menu,
		X
	} from 'lucide-svelte';

	let { data, children } = $props();
	let { session, supabase } = $derived(data);
	let mobileOpen = $state(false);

	const navLinks = [
		{ name: 'Dashboard', icon: LayoutDashboard, href: '/copilot', exact: true },
		{ name: 'Programs', icon: Briefcase, href: '/copilot/programs', exact: false },
		{ name: 'Applications', icon: FileText, href: '/copilot/applications', exact: false },
		{ name: 'Finances', icon: Wallet, href: '/copilot/finances', exact: false },
	];

	function isActive(href: string, exact: boolean = false) {
		const path = $page.url.pathname;
		if (exact) return path === href;
		return path.startsWith(href);
	}

	async function handleSignOut() {
		await supabase.auth.signOut();
		goto('/');
	}
</script>

<div class="flex h-screen overflow-hidden bg-slate-50 font-sans">
	
	<!-- Mobile Topbar -->
	<div class="lg:hidden absolute top-0 left-0 right-0 h-16 bg-[#0f172a] flex items-center justify-between px-4 z-50">
		<span class="text-white font-bold text-lg" style="font-family: 'Outfit', sans-serif;">Abroaducate</span>
		<button onclick={() => mobileOpen = !mobileOpen} class="text-white p-2">
			{#if mobileOpen}
				<X size={24} />
			{:else}
				<Menu size={24} />
			{/if}
		</button>
	</div>

	<!-- Sidebar Navigation -->
	<aside 
		class={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0f172a] text-slate-300 transform transition-transform duration-300 ease-in-out flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} pt-20 lg:pt-0`}
	>
		<!-- Logo Area -->
		<div class="h-20 hidden lg:flex items-center px-6 border-b border-slate-800">
			<a href="/" class="flex items-center gap-3 w-full hover:opacity-90 transition-opacity">
				<div class="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
					<svg class="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 2L12 14M12 2L8 6M12 2L16 6" />
						<circle cx="12" cy="18" r="3" fill="currentColor" stroke="none" />
					</svg>
				</div>
				<span class="text-xl font-bold text-white tracking-wide" style="font-family: 'Outfit', sans-serif;">Strategy Board</span>
			</a>
		</div>

		<!-- Nav Links -->
		<nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
			{#each navLinks as link}
				{@const LinkIcon = link.icon}
				<a 
					href={link.href}
					onclick={() => mobileOpen = false}
					class={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive(link.href, link.exact) ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}
				>
					<LinkIcon size={18} class={isActive(link.href, link.exact) ? 'text-white' : 'text-slate-400'} />
					{link.name}
				</a>
			{/each}
		</nav>

		<!-- Bottom Utils -->
		<div class="p-4 border-t border-slate-800 space-y-2">
			<a 
				href="/copilot/settings" 
				onclick={() => mobileOpen = false}
				class={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive('/copilot/settings') ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}
			>
				<Settings size={18} class={isActive('/copilot/settings') ? 'text-white' : 'text-slate-400'} />
				Settings
			</a>
		</div>
	</aside>

	<!-- Main Content Wrapper -->
	<main class="flex-1 overflow-y-auto pt-16 lg:pt-0">
		<!-- Top Bar for Auth State (Mobile & Desktop) -->
		<div class="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm hidden lg:flex">
			<div class="text-sm font-semibold text-slate-800" style="font-family: 'Outfit', sans-serif;">
				<!-- Breadcrumb logic can go here in future -->
			</div>
			
			<div class="flex items-center gap-6">
				<!-- Mocked Credit Balance -->
				<a href="/pricing" class="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors border border-slate-200">
					<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
					<span class="text-sm font-bold text-slate-700">1 Credit</span>
				</a>

				<div class="h-6 w-px bg-slate-200"></div>

				<!-- Profile Snippet -->
				<button onclick={() => goto('/copilot/settings')} class="flex items-center gap-3 hover:opacity-80 transition-opacity">
					<div class="text-right hidden sm:block">
						<div class="text-sm font-bold text-slate-900 leading-tight">Student</div>
						<div class="text-xs font-medium text-slate-500">Free Tier</div>
					</div>
					<div class="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-navy to-slate-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
						{session?.user?.email?.[0]?.toUpperCase() || 'U'}
					</div>
				</button>
			</div>
		</div>

		<!-- Fluid Content Render Area -->
		<div class="p-4 md:p-8">
			{@render children()}
		</div>
	</main>
</div>

<style>
	:global(:root) {
		--brand-navy: #0f172a;
	}
</style>
