<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import AuthenticationFlow from './AuthenticationFlow.svelte';

	let { data } = $props<{ data: { session: any; supabase: any } }>();
	let { session, supabase } = $derived(data);

	let mobileMenuOpen = $state(false);
	let showAuthModal = $state(false);
	let authMode = $state<'login' | 'signup'>('login');
	let pendingRedirect = $state<string>('/plan');

	let exploreOpen = $state(false);
	let docsOpen = $state(false);
	let toolsOpen = $state(false);

	function closeAll() {
		exploreOpen = false;
		docsOpen = false;
		toolsOpen = false;
	}

	function closeMobile() {
		mobileMenuOpen = false;
	}

	function nav(path: string) {
		closeMobile();
		goto(path);
	}

	function requireAuth(path: string) {
		if (session?.user?.id) {
			nav(path);
			return;
		}
		pendingRedirect = path;
		authMode = 'login';
		showAuthModal = true;
		closeMobile();
	}

	function showLogin() {
		pendingRedirect = '/plan';
		authMode = 'login';
		showAuthModal = true;
		closeMobile();
	}

	function showSignup() {
		pendingRedirect = '/plan';
		authMode = 'signup';
		showAuthModal = true;
		closeMobile();
	}

	function isActive(path: string): boolean {
		return $page.url.pathname === path || ($page.url.pathname.startsWith(path + '/') && path !== '/');
	}
</script>

<svelte:window onclick={closeAll} />

<header class="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur">
	<nav class="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
		<a href="/" class="flex items-center space-x-3 hover:opacity-80 transition duration-300">
			<img src="/logo-icon.svg" alt="Abroaducate" class="w-8 h-8" />
			<span class="text-xl font-semibold text-slate-900">Abroaducate</span>
		</a>

		<!-- Desktop Nav -->
		<div class="hidden lg:flex items-center gap-3 bg-white/70 px-4 py-2 rounded-full shadow-sm border border-slate-200 backdrop-blur">
			<a
				href="/plan"
				class="px-4 py-2 text-sm font-semibold rounded-full transition border {isActive('/plan') ? 'bg-indigo-50 text-[#2C3580] border-indigo-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}"
			>
				Plan
			</a>

			<!-- Explore -->
			<div class="relative">
				<button
					type="button"
					onclick={(e) => {
						e.stopPropagation();
						exploreOpen = !exploreOpen;
						docsOpen = false;
						toolsOpen = false;
					}}
					class="px-4 py-2 text-sm font-semibold rounded-full transition border bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
				>
					Explore
				</button>
				{#if exploreOpen}
					<div class="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-slate-200 py-2">
						<button
							type="button"
							onclick={() => nav('/scholarships')}
							class="w-full text-left px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-[#2C3580] transition"
						>
							Scholarships
						</button>
						<button
							type="button"
							onclick={() => nav('/universities')}
							class="w-full text-left px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-[#2C3580] transition"
						>
							Universities
						</button>
					</div>
				{/if}
			</div>

			<!-- Documents -->
			<div class="relative">
				<button
					type="button"
					onclick={(e) => {
						e.stopPropagation();
						docsOpen = !docsOpen;
						exploreOpen = false;
						toolsOpen = false;
					}}
					class="px-4 py-2 text-sm font-semibold rounded-full transition border bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
				>
					Documents
				</button>
				{#if docsOpen}
					<div class="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-slate-200 py-2">
						<button type="button" onclick={() => nav('/sop')} class="w-full text-left px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-[#2C3580] transition">
							Statement of Purpose
						</button>
						<button type="button" onclick={() => nav('/cover-letters')} class="w-full text-left px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-[#2C3580] transition">
							Cover Letters
						</button>
						<button type="button" onclick={() => nav('/personal-statements')} class="w-full text-left px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-[#2C3580] transition">
							Personal Statements
						</button>
						<button type="button" onclick={() => nav('/academic-cv')} class="w-full text-left px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-[#2C3580] transition">
							Academic CV
						</button>
					</div>
				{/if}
			</div>

			<!-- Applications is now inside the Plan dashboard (not global nav) -->

			<!-- Tools (Advanced) -->
			<div class="relative">
				<button
					type="button"
					onclick={(e) => {
						e.stopPropagation();
						toolsOpen = !toolsOpen;
						exploreOpen = false;
						docsOpen = false;
					}}
					class="px-4 py-2 text-sm font-semibold rounded-full transition border bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
				>
					Tools
				</button>
				{#if toolsOpen}
					<div class="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-lg border border-slate-200 py-2">
						<div class="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Advanced</div>
						<button type="button" onclick={() => nav('/gpa-converter')} class="w-full text-left px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-[#2C3580] transition">
							GPA Converter
						</button>
						<button type="button" onclick={() => nav('/test-prep')} class="w-full text-left px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-[#2C3580] transition">
							Test Prep
						</button>
						<button type="button" onclick={() => nav('/visa-interview-practice')} class="w-full text-left px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-[#2C3580] transition">
							Visa Interview Practice
						</button>
						<button type="button" onclick={() => nav('/budget-calculator')} class="w-full text-left px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-[#2C3580] transition">
							Budget Calculator
						</button>
						<button type="button" onclick={() => nav('/cold-email-generator')} class="w-full text-left px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-[#2C3580] transition">
							Cold Email Generator
						</button>
						<a href="/pricing" class="block px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-[#2C3580] transition">
							Pricing
						</a>
						<a href="/blog" class="block px-4 py-3 text-slate-700 hover:bg-indigo-50 hover:text-[#2C3580] transition">
							Blog
						</a>
					</div>
				{/if}
			</div>
		</div>

		<!-- Desktop Auth -->
		<div class="hidden lg:flex items-center space-x-2 bg-white/70 px-3 py-2 rounded-full shadow-sm border border-slate-200 backdrop-blur">
			{#if session}
				<a href="/account" class="px-5 py-2 text-sm font-semibold text-white bg-[#2C3580] rounded-full hover:bg-[#3c4d9c] transition shadow-sm shadow-indigo-900/10">
					Account
				</a>
			{:else}
				<button onclick={showLogin} class="px-5 py-2 text-sm font-semibold text-slate-800 bg-white rounded-full hover:bg-slate-50 transition border border-slate-200">
					Login
				</button>
				<button onclick={showSignup} class="px-5 py-2 text-sm font-semibold text-white bg-[#2C3580] rounded-full hover:bg-[#3c4d9c] transition shadow-sm shadow-indigo-900/10">
					Create Account
				</button>
			{/if}
		</div>

		<!-- Mobile menu button -->
		<div class="lg:hidden flex items-center">
			<button
				type="button"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				class="text-slate-800 hover:text-[#2C3580] transition duration-300"
				aria-label="Toggle mobile menu"
			>
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
					/>
				</svg>
			</button>
		</div>
	</nav>

	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div class="lg:hidden bg-white/95 backdrop-blur border-t border-slate-200">
			<div class="px-4 py-3 space-y-1">
				<button type="button" onclick={() => nav('/plan')} class="w-full text-left py-3 px-3 rounded-xl font-semibold {isActive('/plan') ? 'bg-indigo-50 text-[#2C3580]' : 'text-slate-800 hover:bg-slate-50'}">
					Plan
				</button>

				<details class="group rounded-xl border border-slate-200 bg-white">
					<summary class="flex items-center justify-between py-3 px-3 cursor-pointer font-semibold text-slate-800">
						<span>Explore</span>
						<span class="text-slate-400 group-open:rotate-180 transition">▾</span>
					</summary>
					<div class="pb-2 px-3 space-y-1">
						<button type="button" onclick={() => nav('/scholarships')} class="w-full text-left py-2 text-slate-700 hover:text-[#2C3580]">
							Scholarships
						</button>
						<button type="button" onclick={() => nav('/universities')} class="w-full text-left py-2 text-slate-700 hover:text-[#2C3580]">
							Universities
						</button>
					</div>
				</details>

				<details class="group rounded-xl border border-slate-200 bg-white">
					<summary class="flex items-center justify-between py-3 px-3 cursor-pointer font-semibold text-slate-800">
						<span>Documents</span>
						<span class="text-slate-400 group-open:rotate-180 transition">▾</span>
					</summary>
					<div class="pb-2 px-3 space-y-1">
						<button type="button" onclick={() => nav('/sop')} class="w-full text-left py-2 text-slate-700 hover:text-[#2C3580]">Statement of Purpose</button>
						<button type="button" onclick={() => nav('/cover-letters')} class="w-full text-left py-2 text-slate-700 hover:text-[#2C3580]">Cover Letters</button>
						<button type="button" onclick={() => nav('/personal-statements')} class="w-full text-left py-2 text-slate-700 hover:text-[#2C3580]">Personal Statements</button>
						<button type="button" onclick={() => nav('/academic-cv')} class="w-full text-left py-2 text-slate-700 hover:text-[#2C3580]">Academic CV</button>
					</div>
				</details>

				<!-- Applications is now inside the Plan dashboard (not global nav) -->

				<details class="group rounded-xl border border-slate-200 bg-white">
					<summary class="flex items-center justify-between py-3 px-3 cursor-pointer font-semibold text-slate-800">
						<span>Tools (Advanced)</span>
						<span class="text-slate-400 group-open:rotate-180 transition">▾</span>
					</summary>
					<div class="pb-2 px-3 space-y-1">
						<button type="button" onclick={() => nav('/gpa-converter')} class="w-full text-left py-2 text-slate-700 hover:text-[#2C3580]">GPA Converter</button>
						<button type="button" onclick={() => nav('/test-prep')} class="w-full text-left py-2 text-slate-700 hover:text-[#2C3580]">Test Prep</button>
						<button type="button" onclick={() => nav('/visa-interview-practice')} class="w-full text-left py-2 text-slate-700 hover:text-[#2C3580]">Visa Interview Practice</button>
						<button type="button" onclick={() => nav('/budget-calculator')} class="w-full text-left py-2 text-slate-700 hover:text-[#2C3580]">Budget Calculator</button>
						<button type="button" onclick={() => nav('/cold-email-generator')} class="w-full text-left py-2 text-slate-700 hover:text-[#2C3580]">Cold Email Generator</button>
						<button type="button" onclick={() => nav('/pricing')} class="w-full text-left py-2 text-slate-700 hover:text-[#2C3580]">Pricing</button>
						<button type="button" onclick={() => nav('/blog')} class="w-full text-left py-2 text-slate-700 hover:text-[#2C3580]">Blog</button>
					</div>
				</details>

				<div class="pt-3 border-t border-slate-200">
					{#if session}
						<button type="button" onclick={() => nav('/account')} class="w-full py-3 rounded-xl font-semibold bg-[#2C3580] text-white hover:bg-[#3c4d9c] transition">
							Account
						</button>
					{:else}
						<div class="space-y-2">
							<button type="button" onclick={showLogin} class="w-full py-3 rounded-xl font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition">
								Login
							</button>
							<button type="button" onclick={showSignup} class="w-full py-3 rounded-xl font-semibold bg-[#2C3580] text-white hover:bg-[#3c4d9c] transition">
								Create Account
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</header>

<AuthenticationFlow
	bind:show={showAuthModal}
	{supabase}
	mode={authMode}
	returnUrl={pendingRedirect || '/plan'}
	on:success={() => {
		showAuthModal = false;
		try {
			if (pendingRedirect) goto(pendingRedirect);
		} catch {}
	}}
/>

