<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import AuthenticationFlow from './AuthenticationFlow.svelte';

	let { data } = $props<{ data: { session: any; supabase: any } }>();
	let { session, supabase } = $derived(data);

	let mobileMenuOpen = $state(false);
	let profileDropdownOpen = $state(false);
	let showAuthModal = $state(false);
	let authMode = $state<'login' | 'signup'>('login');
	let pendingRedirect = $state<string>('/dashboard');
	let scrolled = $state(false);

	function closeMobile() {
		mobileMenuOpen = false;
	}

	function nav(path: string) {
		closeMobile();
		if (path === '/dashboard' && window.location.pathname.startsWith('/dashboard')) {
			window.location.href = '/dashboard';
		} else {
			goto(path);
		}
	}

	function showLogin() {
		pendingRedirect = '/dashboard';
		authMode = 'login';
		showAuthModal = true;
		closeMobile();
	}

	function showSignup() {
		pendingRedirect = '/dashboard';
		authMode = 'signup';
		showAuthModal = true;
		closeMobile();
	}

	function isActive(path: string): boolean {
		return $page.url.pathname === path || ($page.url.pathname.startsWith(path + '/') && path !== '/');
	}

	$effect(() => {
		function handleScroll() {
			scrolled = window.scrollY > 10;
		}
		function handleClickOutside(e: MouseEvent) {
			if (profileDropdownOpen) {
				const dropdown = document.getElementById('profile-dropdown');
				if (dropdown && !dropdown.contains(e.target as Node)) {
					profileDropdownOpen = false;
				}
			}
		}
		window.addEventListener('scroll', handleScroll, { passive: true });
		document.addEventListener('click', handleClickOutside);
		return () => {
			window.removeEventListener('scroll', handleScroll);
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<header
	class="fixed left-0 right-0 top-0 z-50 transition-all duration-300"
	class:nav-scrolled={scrolled}
	class:nav-top={!scrolled}
	style="overflow: hidden; max-width: 100vw;"
>
	<nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-3" style="overflow: hidden; max-width: 100vw;">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2.5 transition duration-300 hover:opacity-80">
			<img src="/abroaducate-new-icon1.png" alt="Abroaducate icon" style="height: 2.5rem; width: auto; mix-blend-mode: multiply;" />
			<span style="font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1.125rem; color: #0B132B; letter-spacing: -0.02em;">Abroaducate</span>
		</a>

		<!-- Desktop Nav Links -->
		<div class="hidden items-center gap-1 lg:flex">
			<a
				href="/programs"
				class="nav-link {isActive('/programs') ? 'nav-link-active' : ''}"
			>
				Find Programs
			</a>
			<a
				href="/universities"
				class="nav-link {isActive('/universities') ? 'nav-link-active' : ''}"
			>
				Find Universities
			</a>
			<a
				href="/scholarships"
				class="nav-link {isActive('/scholarships') ? 'nav-link-active' : ''}"
			>
				Scholarships
			</a>
			<a
				href="/pricing"
				class="nav-link {isActive('/pricing') ? 'nav-link-active' : ''}"
			>
				Pricing
			</a>
			<a
				href="/blog"
				class="nav-link {isActive('/blog') ? 'nav-link-active' : ''}"
			>
				Blog
			</a>
		</div>

		<!-- Desktop Auth Buttons -->
		<div class="hidden items-center gap-3 lg:flex">
			{#if session}
				<div class="relative ml-2" id="profile-dropdown">
					<button onclick={(e) => { e.stopPropagation(); profileDropdownOpen = !profileDropdownOpen; }} class="flex items-center justify-center h-10 w-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors cursor-pointer border border-slate-200" aria-label="Open account menu">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
					</button>
					<div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 transition-all duration-200 flex flex-col overflow-hidden py-1 top-full z-50 {profileDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-1 pointer-events-none'}">
						<a href="/settings" onclick={() => profileDropdownOpen = false} class="px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2">
							<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
							Account Settings
						</a>
						<form action="/auth/logout" method="POST" onsubmit={() => profileDropdownOpen = false} class="border-t border-slate-100 mt-1 pt-1">
							<button type="submit" class="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-2">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
								Sign Out
							</button>
						</form>
					</div>
				</div>
				<a
					href="/dashboard"
					onclick={() => profileDropdownOpen = false}
					class="nav-btn-primary"
					data-sveltekit-reload
				>
					My Dashboard
				</a>
			{:else}
				<button onclick={showLogin} class="nav-btn-ghost">
					Log in
				</button>
				<button onclick={showSignup} class="nav-btn-primary">
					Get Started Free
				</button>
			{/if}
		</div>

		<!-- Mobile Hamburger -->
		<div class="flex items-center lg:hidden">
			<button
				type="button"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				class="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
				aria-label="Toggle mobile menu"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

	<!-- Mobile Menu -->
	{#if mobileMenuOpen}
		<div class="border-t border-slate-100 bg-white lg:hidden" style="animation: slideDown 0.2s ease-out;">
			<div class="space-y-1 px-4 py-3">
				<button type="button" onclick={() => nav('/programs')} class="mobile-nav-link {isActive('/programs') ? 'mobile-nav-active' : ''}">
					Find Programs
				</button>
				<button type="button" onclick={() => nav('/universities')} class="mobile-nav-link {isActive('/universities') ? 'mobile-nav-active' : ''}">
					Find Universities
				</button>
				<button type="button" onclick={() => nav('/scholarships')} class="mobile-nav-link {isActive('/scholarships') ? 'mobile-nav-active' : ''}">
					Scholarships
				</button>
				<button type="button" onclick={() => nav('/pricing')} class="mobile-nav-link {isActive('/pricing') ? 'mobile-nav-active' : ''}">
					Pricing
				</button>
				<button type="button" onclick={() => nav('/blog')} class="mobile-nav-link {isActive('/blog') ? 'mobile-nav-active' : ''}">
					Blog
				</button>

				<div class="border-t border-slate-100 pt-3 mt-2">
					{#if session}
						<div class="space-y-2">
							<button type="button" onclick={() => nav('/dashboard')} class="w-full rounded-xl bg-[var(--brand-orange)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-hover)]">
								My Dashboard
							</button>
							<button type="button" onclick={() => nav('/settings')} class="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 flex items-center justify-center gap-2">
								<svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
								Account Settings
							</button>
							<form action="/auth/logout" method="POST">
								<button type="submit" class="w-full rounded-xl bg-red-50 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 flex items-center justify-center gap-2">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
									Sign Out
								</button>
							</form>
						</div>
					{:else}
						<div class="space-y-2">
							<button type="button" onclick={showLogin} class="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
								Log in
							</button>
							<button type="button" onclick={showSignup} class="w-full rounded-xl bg-[var(--brand-orange)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-orange-hover)]">
								Get Started Free
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
	returnUrl={pendingRedirect || '/dashboard'}
	on:success={() => {
		showAuthModal = false;
		try {
			if (pendingRedirect) goto(pendingRedirect);
		} catch {}
	}}
/>

<style>
	.nav-top {
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid transparent;
	}

	.nav-scrolled {
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-bottom: 1px solid var(--border-subtle);
		box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
	}

	.nav-link {
		padding: 0.5rem 0.875rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		border-radius: 0.5rem;
		transition: all 0.15s ease;
		text-decoration: none;
	}

	.nav-link:hover {
		color: var(--text-primary);
		background: var(--surface-muted);
	}

	.nav-link-active {
		color: var(--brand-navy) !important;
		font-weight: 600;
	}

	.nav-btn-primary {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: white;
		background: var(--brand-orange);
		border: none;
		border-radius: 9999px;
		transition: all 0.2s ease;
		text-decoration: none;
		cursor: pointer;
	}

	.nav-btn-primary:hover {
		background: var(--brand-orange-hover);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
	}

	.nav-btn-ghost {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		border: none;
		border-radius: 0.5rem;
		transition: all 0.15s ease;
		cursor: pointer;
	}

	.nav-btn-ghost:hover {
		color: var(--text-primary);
		background: var(--surface-muted);
	}

	.mobile-nav-link {
		display: block;
		width: 100%;
		padding: 0.75rem;
		text-align: left;
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--text-secondary);
		border-radius: 0.75rem;
		transition: all 0.15s;
		background: transparent;
		border: none;
		cursor: pointer;
	}

	.mobile-nav-link:hover {
		background: var(--surface-muted);
		color: var(--text-primary);
	}

	.mobile-nav-active {
		color: var(--brand-navy) !important;
		background: var(--surface-muted) !important;
		font-weight: 600;
	}

	@keyframes slideDown {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
