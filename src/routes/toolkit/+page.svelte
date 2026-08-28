<script lang="ts">
	import { 
		ShieldCheck, Globe, FileText, CheckCircle2, 
		ExternalLink, CreditCard, Sparkles, GraduationCap, 
		BookOpen, ArrowRight, Check, Search, AlertCircle
	} from 'lucide-svelte';
	import { AFFILIATE_PARTNERS, type AffiliatePartner } from '$lib/config/affiliates';
	import SEO from '$lib/components/SEO.svelte';
	import IeltsPrepModal from '$lib/components/IeltsPrepModal.svelte';

	let activeCategory = $state<'all' | 'visa' | 'translation' | 'connectivity' | 'banking' | 'prep'>('all');
	let searchQuery = $state('');
	let showIeltsModal = $state(false);

	const filteredPartners = $derived(
		AFFILIATE_PARTNERS.filter(p => {
			const matchesCat = activeCategory === 'all' || p.category === activeCategory;
			const matchesSearch = !searchQuery || 
				p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.tagline.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesCat && matchesSearch;
		})
	);

	const categories = [
		{ id: 'all', label: 'All Essentials' },
		{ id: 'visa', label: 'Visa & Blocked Accounts' },
		{ id: 'translation', label: 'Certified Translations' },
		{ id: 'connectivity', label: 'Travel eSIM Data' },
		{ id: 'banking', label: 'Cross-Border Tuition' },
		{ id: 'prep', label: 'Free IELTS & Language' }
	];
</script>

<SEO 
	title="International Student Relocation Toolkit — Abroaducate"
	description="Official visa-approved tools, blocked accounts (Expatrio, Fintiba), certified transcript translations, Europe eSIMs, and free IELTS prep for international students."
/>

<div class="toolkit-page">
	<!-- Hero Section -->
	<div class="toolkit-hero">
		<div class="max-w-5xl mx-auto px-4 text-center">
			<div class="inline-flex items-center gap-2 bg-orange-100/80 border border-orange-200 text-orange-800 text-xs font-extrabold uppercase px-3.5 py-1.5 rounded-full mb-4">
				<ShieldCheck size={14} class="text-orange-600" />
				Verified International Student Relocation Toolkit
			</div>
			
			<h1 class="hero-title">
				Everything You Need to Move & Study in Europe
			</h1>
			
			<p class="hero-subtitle">
				Embassy-approved blocked accounts, certified transcript translations, travel eSIMs, and free AI test prep — all vetted for international applicants from Africa, Asia, and worldwide.
			</p>

			<!-- Quick Filter Pills -->
			<div class="category-pills-row">
				{#each categories as cat}
					<button 
						class="cat-pill {activeCategory === cat.id ? 'active' : ''}"
						onclick={() => activeCategory = cat.id as any}
					>
						{cat.label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Main Directory Content -->
	<div class="max-w-6xl mx-auto px-4 py-10">
		<!-- Featured Germany Banner -->
		{#if activeCategory === 'all' || activeCategory === 'visa'}
			<div class="germany-spotlight-banner">
				<div class="spotlight-content">
					<div class="flex items-center gap-2 mb-2">
						<span class="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">Germany 2026/2027</span>
						<span class="text-xs font-bold text-amber-900">Mandatory Visa Proof of Funds</span>
					</div>
					<h2 class="text-xl font-extrabold text-slate-900 mb-1.5">
						Official German Blocked Account (€11,904) + TK Health Insurance
					</h2>
					<p class="text-xs text-slate-600 max-w-2xl leading-relaxed mb-4">
						Non-EU students applying to tuition-free German universities must deposit €11,904/year in a government-approved blocked account. The Expatrio Value Package bundles your blocked account, statutory health insurance, and free German bank account in one click.
					</p>
					<div class="flex items-center gap-3 flex-wrap">
						<a 
							href="https://www.expatrio.com?p=abroaducate123" 
							target="_blank" 
							rel="noopener noreferrer sponsored"
							class="btn-spotlight"
						>
							Open Expatrio Value Package <ExternalLink size={14} />
						</a>
						<a 
							href="https://partner.fintiba.com/abroaducate" 
							target="_blank" 
							rel="noopener noreferrer sponsored"
							class="btn-spotlight-secondary"
						>
							Compare Fintiba <ExternalLink size={14} />
						</a>
					</div>
				</div>
			</div>
		{/if}

		<!-- Partner Cards Grid -->
		<div class="partners-grid">
			{#each filteredPartners as partner (partner.id)}
				<div class="partner-card {partner.highlighted ? 'highlighted' : ''}">
					<!-- Card Top Header -->
					<div class="partner-card-header">
						<div class="flex items-center gap-3">
							<div class="partner-avatar">
								{#if partner.category === 'visa'}
									<ShieldCheck size={22} class="text-orange-600" />
								{:else if partner.category === 'translation'}
									<FileText size={22} class="text-blue-600" />
								{:else if partner.category === 'connectivity'}
									<Globe size={22} class="text-emerald-600" />
								{:else if partner.category === 'banking'}
									<CreditCard size={22} class="text-purple-600" />
								{:else}
									<GraduationCap size={22} class="text-indigo-600" />
								{/if}
							</div>
							<div>
								<div class="flex items-center gap-2">
									<h3 class="font-extrabold text-slate-900 text-lg leading-tight">
										{partner.name}
									</h3>
									{#if partner.badge}
										<span class="badge-{partner.badgeColor || 'emerald'}">
											{partner.badge}
										</span>
									{/if}
								</div>
								<p class="text-xs font-semibold text-slate-500 mt-0.5">
									{partner.categoryLabel}
								</p>
							</div>
						</div>
					</div>

					<!-- Tagline & Description -->
					<div class="partner-body">
						<h4 class="text-sm font-bold text-slate-800 mb-1">
							{partner.tagline}
						</h4>
						<p class="text-xs text-slate-600 leading-relaxed mb-4">
							{partner.description}
						</p>

						<!-- Key Features Checklist -->
						<div class="space-y-1.5 mb-6">
							{#each partner.features as feat}
								<div class="flex items-start gap-2 text-xs text-slate-700">
									<Check size={14} class="text-emerald-600 shrink-0 mt-0.5" />
									<span>{feat}</span>
								</div>
							{/each}
						</div>
					</div>

					<!-- CTA Button -->
					<div class="partner-footer">
						{#if partner.id === 'studyoverseas-ai'}
							<button 
								onclick={() => showIeltsModal = true}
								class="btn-partner-cta cursor-pointer w-full text-center"
							>
								<span>{partner.ctaText}</span>
								<ExternalLink size={15} />
							</button>
						{:else}
							<a 
								href={partner.url}
								target="_blank"
								rel="noopener noreferrer sponsored"
								class="btn-partner-cta"
							>
								<span>{partner.ctaText}</span>
								<ExternalLink size={15} />
							</a>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- IELTS Prep Bridge Modal -->
		<IeltsPrepModal bind:show={showIeltsModal} />

		<!-- Disclosure Box -->
		<div class="mt-14 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 leading-relaxed">
			<AlertCircle size={14} class="inline text-slate-400 mr-1 -mt-0.5" />
			<strong>Transparency & Affiliate Disclosure:</strong> Abroaducate partners with verified relocation service providers (Expatrio, Fintiba, Airalo, RushTranslate, Grey, Preply). When you open an account or purchase a service through our links, we may earn an affiliate commission at no extra cost to you. This supports our mission of keeping our university database and tools 100% free for all students.
		</div>
	</div>
</div>

<style>
	.toolkit-page {
		min-height: 100vh;
		background: #fafafa;
	}

	.toolkit-hero {
		background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
		border-bottom: 1px solid #e2e8f0;
		padding: 4rem 1rem 3rem;
	}

	.hero-title {
		font-family: 'Outfit', sans-serif;
		font-size: 2.5rem;
		font-weight: 900;
		color: #0f172a;
		letter-spacing: -0.02em;
		margin: 0 0 1rem;
		line-height: 1.15;
	}

	.hero-subtitle {
		font-size: 1.05rem;
		color: #475569;
		max-width: 44rem;
		margin: 0 auto 2rem;
		line-height: 1.6;
	}

	.category-pills-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.cat-pill {
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 700;
		background: #ffffff;
		border: 1px solid #cbd5e1;
		color: #475569;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.cat-pill:hover {
		border-color: #94a3b8;
		color: #0f172a;
	}

	.cat-pill.active {
		background: #0f172a;
		color: #ffffff;
		border-color: #0f172a;
		box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
	}

	.germany-spotlight-banner {
		background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
		border: 1.5px solid #fed7aa;
		border-radius: 1.25rem;
		padding: 1.75rem;
		margin-bottom: 2.5rem;
		box-shadow: 0 4px 16px -2px rgba(234, 88, 12, 0.08);
	}

	.btn-spotlight {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.65rem 1.25rem;
		background: #ea580c;
		color: white;
		font-weight: 800;
		font-size: 0.875rem;
		border-radius: 0.625rem;
		text-decoration: none;
		transition: all 0.2s;
		box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
	}

	.btn-spotlight:hover {
		background: #c2410c;
		transform: translateY(-1px);
	}

	.btn-spotlight-secondary {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.65rem 1.15rem;
		background: #ffffff;
		color: #475569;
		border: 1px solid #cbd5e1;
		font-weight: 700;
		font-size: 0.875rem;
		border-radius: 0.625rem;
		text-decoration: none;
		transition: all 0.2s;
	}

	.btn-spotlight-secondary:hover {
		background: #f8fafc;
		color: #0f172a;
		border-color: #94a3b8;
	}

	.partners-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.partner-card {
		background: #ffffff;
		border: 1.5px solid #e2e8f0;
		border-radius: 1.25rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
		transition: all 0.2s ease;
	}

	.partner-card:hover {
		border-color: #cbd5e1;
		transform: translateY(-2px);
		box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.06);
	}

	.partner-card.highlighted {
		border-color: #fdba74;
	}

	.partner-card-header {
		margin-bottom: 1rem;
		padding-bottom: 0.875rem;
		border-bottom: 1px solid #f1f5f9;
	}

	.partner-avatar {
		width: 3rem;
		height: 3rem;
		border-radius: 0.75rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.badge-emerald {
		font-size: 0.65rem;
		font-weight: 800;
		text-transform: uppercase;
		background: #ecfdf5;
		color: #059669;
		padding: 0.15rem 0.5rem;
		border-radius: 9999px;
	}

	.badge-blue {
		font-size: 0.65rem;
		font-weight: 800;
		text-transform: uppercase;
		background: #eff6ff;
		color: #2563eb;
		padding: 0.15rem 0.5rem;
		border-radius: 9999px;
	}

	.badge-orange {
		font-size: 0.65rem;
		font-weight: 800;
		text-transform: uppercase;
		background: #fff7ed;
		color: #ea580c;
		padding: 0.15rem 0.5rem;
		border-radius: 9999px;
	}

	.btn-partner-cta {
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: #0f172a;
		color: #ffffff;
		font-weight: 800;
		font-size: 0.875rem;
		border-radius: 0.625rem;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.btn-partner-cta:hover {
		background: #ea580c;
		color: #ffffff;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
	}

	@media (max-width: 900px) {
		.partners-grid {
			grid-template-columns: 1fr;
		}
		.hero-title {
			font-size: 2rem;
		}
	}
</style>
