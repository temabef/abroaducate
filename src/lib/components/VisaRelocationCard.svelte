<script lang="ts">
	import { 
		ShieldCheck, Globe, FileText, CheckCircle2, 
		ExternalLink, CreditCard, Sparkles, Building2
	} from 'lucide-svelte';
	import { AFFILIATE_PARTNERS } from '$lib/config/affiliates';

	let { country = 'Germany' }: { country?: string } = $props();

	const isGermany = $derived(country.toLowerCase().includes('germany') || country.toLowerCase().includes('deutschland'));
	const expatrio = AFFILIATE_PARTNERS.find(p => p.id === 'expatrio')!;
	const fintiba = AFFILIATE_PARTNERS.find(p => p.id === 'fintiba')!;
	const airalo = AFFILIATE_PARTNERS.find(p => p.id === 'airalo')!;
	const rushTranslate = AFFILIATE_PARTNERS.find(p => p.id === 'rushtranslate')!;
	const grey = AFFILIATE_PARTNERS.find(p => p.id === 'grey')!;
</script>

<div class="relocation-wrapper">
	{#if isGermany}
		<!-- GERMANY SPECIFIC RELOCATION & BLOCKED ACCOUNT CARD -->
		<div class="card-germany">
			<!-- Header Tag -->
			<div class="card-badge-row">
				<span class="badge-embassy">
					<ShieldCheck size={14} /> Official Visa Requirement
				</span>
				<span class="badge-tuition">
					€0 Tuition • Low Living Cost
				</span>
			</div>

			<h3 class="relocation-title">
				German Student Visa & Blocked Account Package
			</h3>
			<p class="relocation-subtitle">
				To study in Germany, international students are legally required to open a <strong>Blocked Account (€11,904/yr)</strong> and obtain <strong>Statutory Health Insurance (TK)</strong> before their visa appointment.
			</p>

			<!-- Value Package Box (Expatrio) -->
			<div class="expatrio-box">
				<div class="expatrio-box-header">
					<div>
						<div class="partner-name-row">
							<span class="font-extrabold text-slate-900 text-base">Expatrio Value Package</span>
							<span class="partner-pill">Recommended</span>
						</div>
						<p class="text-xs text-slate-500 mt-0.5">Government-approved all-in-one German visa solution</p>
					</div>
				</div>

				<div class="features-grid">
					<div class="feature-item">
						<CheckCircle2 size={16} class="text-emerald-600 shrink-0 mt-0.5" />
						<span><strong>€11,904 Blocked Account</strong> with instant digital confirmation</span>
					</div>
					<div class="feature-item">
						<CheckCircle2 size={16} class="text-emerald-600 shrink-0 mt-0.5" />
						<span><strong>TK Statutory Health Insurance</strong> (Official partner)</span>
					</div>
					<div class="feature-item">
						<CheckCircle2 size={16} class="text-emerald-600 shrink-0 mt-0.5" />
						<span><strong>Free German Bank Account</strong> & digital debit card</span>
					</div>
					<div class="feature-item">
						<CheckCircle2 size={16} class="text-emerald-600 shrink-0 mt-0.5" />
						<span><strong>Free Travel/Incoming Insurance</strong> (worth €95)</span>
					</div>
				</div>

				<div class="cta-row">
					<a 
						href={expatrio.url} 
						target="_blank" 
						rel="noopener noreferrer sponsored"
						class="btn-expatrio"
					>
						<span>Open Expatrio Value Package</span>
						<ExternalLink size={16} />
					</a>
					<a 
						href={fintiba.url} 
						target="_blank" 
						rel="noopener noreferrer sponsored"
						class="btn-fintiba"
					>
						<span>Compare Fintiba</span>
					</a>
				</div>
			</div>

			<!-- Additional Essentials Row -->
			<div class="essentials-grid">
				<!-- RushTranslate -->
				<a 
					href={rushTranslate.url} 
					target="_blank" 
					rel="noopener noreferrer sponsored"
					class="essential-card group"
				>
					<div class="essential-icon text-blue-600 bg-blue-50">
						<FileText size={18} />
					</div>
					<div class="min-w-0">
						<div class="essential-title group-hover:text-orange-600 transition-colors">
							Certified Translations <ExternalLink size={12} class="inline ml-0.5" />
						</div>
						<p class="essential-desc">WAEC, degree, & transcript translations for Uni-Assist.</p>
					</div>
				</a>

				<!-- Airalo -->
				<a 
					href={airalo.url} 
					target="_blank" 
					rel="noopener noreferrer sponsored"
					class="essential-card group"
				>
					<div class="essential-icon text-orange-600 bg-orange-50">
						<Globe size={18} />
					</div>
					<div class="min-w-0">
						<div class="essential-title group-hover:text-orange-600 transition-colors">
							Europe eSIM from $5 <ExternalLink size={12} class="inline ml-0.5" />
						</div>
						<p class="essential-desc">Instant 4G/5G mobile data upon landing in Germany.</p>
					</div>
				</a>
			</div>
		</div>

	{:else}
		<!-- GENERAL EUROPEAN RELOCATION & TRAVEL ESSENTIALS CARD -->
		<div class="card-general">
			<div class="card-badge-row">
				<span class="badge-embassy">
					<Building2 size={14} /> International Student Relocation
				</span>
				<span class="badge-tuition">
					Essential Services
				</span>
			</div>

			<h3 class="relocation-title">
				Relocation & Document Essentials for {country}
			</h3>
			<p class="relocation-subtitle">
				Applying to university in {country}? Prepare your verified paperwork, international tuition payments, and travel connectivity in advance.
			</p>

			<div class="general-grid">
				<!-- RushTranslate -->
				<div class="general-card">
					<div class="general-header">
						<div class="general-icon text-blue-600 bg-blue-50">
							<FileText size={20} />
						</div>
						<div>
							<h4 class="font-bold text-slate-900 text-sm">Certified Academic Translations</h4>
							<p class="text-xs text-slate-500">RushTranslate • 100% Acceptance Guarantee</p>
						</div>
					</div>
					<p class="text-xs text-slate-600 my-2 leading-relaxed">
						Universities require sworn certified translations for degrees, transcripts, and certificates.
					</p>
					<a 
						href={rushTranslate.url}
						target="_blank"
						rel="noopener noreferrer sponsored"
						class="btn-general"
					>
						Order Certified Translation <ExternalLink size={14} />
					</a>
				</div>

				<!-- Grey.co African Fee Payment -->
				<div class="general-card">
					<div class="general-header">
						<div class="general-icon text-emerald-600 bg-emerald-50">
							<CreditCard size={20} />
						</div>
						<div>
							<h4 class="font-bold text-slate-900 text-sm">African Student EUR Accounts</h4>
							<p class="text-xs text-slate-500">Grey.co • Virtual EUR IBAN</p>
						</div>
					</div>
					<p class="text-xs text-slate-600 my-2 leading-relaxed">
						Pay application fees and deposits to European universities at competitive FX rates directly from Africa.
					</p>
					<a 
						href={grey.url}
						target="_blank"
						rel="noopener noreferrer sponsored"
						class="btn-general"
					>
						Open Free EUR Account <ExternalLink size={14} />
					</a>
				</div>

				<!-- Airalo Europe eSIM -->
				<div class="general-card">
					<div class="general-header">
						<div class="general-icon text-orange-600 bg-orange-50">
							<Globe size={20} />
						</div>
						<div>
							<h4 class="font-bold text-slate-900 text-sm">Europe Travel eSIM</h4>
							<p class="text-xs text-slate-500">Airalo • 39 Countries Connected</p>
						</div>
					</div>
					<p class="text-xs text-slate-600 my-2 leading-relaxed">
						Get instant 4G/5G mobile data on your phone before boarding your flight to Europe.
					</p>
					<a 
						href={airalo.url}
						target="_blank"
						rel="noopener noreferrer sponsored"
						class="btn-general"
					>
						Get European eSIM <ExternalLink size={14} />
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.relocation-wrapper {
		margin-top: 1.5rem;
		margin-bottom: 2rem;
	}

	.card-germany {
		background: linear-gradient(135deg, #fffbf5 0%, #fff7ed 100%);
		border: 1.5px solid #fed7aa;
		border-radius: 1.25rem;
		padding: 1.75rem;
		box-shadow: 0 4px 20px -4px rgba(234, 88, 12, 0.08);
	}

	.card-general {
		background: #ffffff;
		border: 1.5px solid #e2e8f0;
		border-radius: 1.25rem;
		padding: 1.75rem;
		box-shadow: 0 4px 16px -4px rgba(15, 23, 42, 0.05);
	}

	.card-badge-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
	}

	.badge-embassy {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		background: #ffedd5;
		color: #c2410c;
		padding: 0.25rem 0.65rem;
		border-radius: 9999px;
	}

	.badge-tuition {
		font-size: 0.75rem;
		font-weight: 700;
		background: #ecfdf5;
		color: #047857;
		padding: 0.25rem 0.65rem;
		border-radius: 9999px;
	}

	.relocation-title {
		font-family: 'Outfit', sans-serif;
		font-size: 1.35rem;
		font-weight: 800;
		color: #0f172a;
		margin: 0 0 0.5rem;
		letter-spacing: -0.01em;
	}

	.relocation-subtitle {
		font-size: 0.875rem;
		color: #64748b;
		margin: 0 0 1.25rem;
		line-height: 1.55;
	}

	.expatrio-box {
		background: #ffffff;
		border: 1px solid #fed7aa;
		border-radius: 1rem;
		padding: 1.25rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		margin-bottom: 1rem;
	}

	.expatrio-box-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #f1f5f9;
	}

	.partner-name-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.partner-pill {
		font-size: 0.65rem;
		font-weight: 800;
		text-transform: uppercase;
		background: #ecfdf5;
		color: #059669;
		padding: 0.15rem 0.45rem;
		border-radius: 9999px;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.feature-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		font-size: 0.8125rem;
		color: #334155;
		line-height: 1.4;
	}

	.cta-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.btn-expatrio {
		flex: 2;
		min-width: 200px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: #ea580c;
		color: white;
		font-weight: 800;
		font-size: 0.875rem;
		border-radius: 0.625rem;
		text-decoration: none;
		transition: all 0.2s ease;
		box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
	}

	.btn-expatrio:hover {
		background: #c2410c;
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(234, 88, 12, 0.35);
	}

	.btn-fintiba {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1rem;
		background: #f8fafc;
		color: #475569;
		border: 1px solid #cbd5e1;
		font-weight: 600;
		font-size: 0.8125rem;
		border-radius: 0.625rem;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.btn-fintiba:hover {
		background: #f1f5f9;
		color: #0f172a;
		border-color: #94a3b8;
	}

	.essentials-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.essential-card {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 0.875rem;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.essential-card:hover {
		border-color: #cbd5e1;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
	}

	.essential-icon {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.essential-title {
		font-size: 0.8125rem;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 0.15rem;
	}

	.essential-desc {
		font-size: 0.75rem;
		color: #64748b;
		margin: 0;
		line-height: 1.35;
	}

	.general-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.general-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.875rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.general-header {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.general-icon {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.btn-general {
		margin-top: 0.75rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		padding: 0.55rem 0.85rem;
		background: #0f172a;
		color: white;
		font-weight: 700;
		font-size: 0.75rem;
		border-radius: 0.5rem;
		text-decoration: none;
		transition: background 0.2s;
	}

	.btn-general:hover {
		background: #1e293b;
	}

	@media (max-width: 768px) {
		.features-grid {
			grid-template-columns: 1fr;
		}
		.essentials-grid {
			grid-template-columns: 1fr;
		}
		.general-grid {
			grid-template-columns: 1fr;
		}
		.cta-row {
			flex-direction: column;
		}
		.btn-expatrio,
		.btn-fintiba {
			width: 100%;
		}
	}
</style>
