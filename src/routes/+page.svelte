<script lang="ts">
import { goto } from '$app/navigation';
import {
ChevronRight,
Landmark,
GraduationCap,
BookOpen,
Globe,
Building2,
ShieldCheck
} from 'lucide-svelte';
import SEO from '$lib/components/SEO.svelte';

let { data } = $props();

// Finder bar state
let finderField = $state('');
let finderDestination = $state('');

// Server-loaded feeds (see +page.server.ts) so crawlers see real links
let scholarships = $derived(data.scholarships ?? []);
let guides = $derived(data.guides ?? []);

// Scroll animation action
function fadeUpOnScroll(node: HTMLElement) {
node.style.opacity = '0';
node.style.transform = 'translateY(28px)';
node.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
const observer = new IntersectionObserver(
(entries) => {
entries.forEach((entry) => {
if (entry.isIntersecting) {
node.style.opacity = '1';
node.style.transform = 'translateY(0)';
observer.unobserve(node);
}
});
},
{ threshold: 0.12 }
);
observer.observe(node);
return {
destroy() {
observer.disconnect();
}
};
}

function goToPrograms() {
	const params = new URLSearchParams();
	// Combine field and destination into a single search query for case-insensitive search
	const searchTerms = [finderField.trim(), finderDestination.trim()].filter(Boolean);
	if (searchTerms.length > 0) {
		params.set('q', searchTerms.join(' '));
	}
	goto(`/programs?${params.toString()}`);
}

</script>

<SEO
	title="Abroaducate — Study in Europe Tuition-Free | Scholarships & Guides"
	description="Find 2,500+ tuition-free and affordable degree programs in Europe, the latest fully funded scholarships, and step-by-step guides for visas, blocked accounts and relocation. 100% free."
	canonical="https://abroaducate.com/"
/>

<!-- ═══ HERO ═══ -->
<section class="hero">
	<div class="hero-glow hero-glow-orange"></div>
	<div class="hero-glow hero-glow-blue"></div>
	<div class="hero-inner" use:fadeUpOnScroll>
		<!-- Top Floating Trust Badge -->
		<div class="hero-badge-container">
			<a href="/toolkit" class="hero-badge-pill">
				<span class="badge-dot"></span>
				<span class="badge-text">100% Free Platform &bull; 2,500+ Degree Programs &bull; Visa Toolkit</span>
				<ChevronRight size={14} class="badge-chevron" />
			</a>
		</div>

		<h1 class="hero-title">
			Study in Europe<br />
			<span class="hero-highlight">Without Breaking the Bank</span>
		</h1>
		<p class="hero-sub">
			Discover 2,500+ tuition-free and affordable degree programs across Europe. Match with fully funded scholarships and get practical guides for visas, blocked accounts and relocation.
		</p>

		<!-- Finder Bar -->
		<div class="finder-bar-wrapper">
			<div class="finder-bar">
				<div class="finder-field">
					<BookOpen size={18} class="finder-icon" />
					<input
						type="text"
						placeholder="Field of study (e.g. Computer Science)"
						bind:value={finderField}
						onkeydown={(e) => { if (e.key === 'Enter') goToPrograms(); }}
					/>
				</div>
				<div class="finder-divider"></div>
				<div class="finder-field">
					<Landmark size={18} class="finder-icon" />
					<input
						type="text"
						placeholder="Destination (e.g. Germany, Italy)"
						bind:value={finderDestination}
						onkeydown={(e) => { if (e.key === 'Enter') goToPrograms(); }}
					/>
				</div>
				<button class="finder-btn" onclick={goToPrograms}>
					<span>Search programs</span>
					<ChevronRight size={16} />
				</button>
			</div>
		</div>

		<!-- Popular Quick Search Shortcuts -->
		<div class="hero-shortcuts">
			<span class="shortcuts-title">Popular searches:</span>
			<div class="shortcuts-list">
				<button class="shortcut-pill" onclick={() => { finderDestination = 'Germany'; goToPrograms(); }}>
					<Building2 size={13} class="shortcut-icon" /> Germany €0 Tuition
				</button>
				<button class="shortcut-pill" onclick={() => { finderDestination = 'Italy'; goToPrograms(); }}>
					<GraduationCap size={13} class="shortcut-icon" /> Italy DSU Grants
				</button>
				<button class="shortcut-pill" onclick={() => { finderDestination = 'Sweden'; goToPrograms(); }}>
					<Globe size={13} class="shortcut-icon" /> Sweden Master's
				</button>
				<a href="/toolkit" class="shortcut-pill shortcut-pill-relocation">
					<ShieldCheck size={13} class="shortcut-icon text-orange-500" /> Relocation Toolkit
				</a>
			</div>
		</div>

	</div>
</section>

<!-- ═══ THREE DOORS ═══ -->
<section class="section-problem" use:fadeUpOnScroll>
	<div class="section-inner">
		<span class="eyebrow">WHAT YOU CAN DO HERE</span>
		<h2 class="section-heading">Everything you need to study in Europe for less</h2>
		<div class="problem-grid">
			<a href="/programs" class="problem-card">
				<div class="problem-icon-wrap"><Landmark size={24} /></div>
				<h3>Find a tuition-free program</h3>
				<p>Search 2,500+ tuition-free and low-cost degrees in Germany, Austria, Italy, Sweden, France and more, with real tuition and living costs.</p>
				<span class="problem-link">Search programs <ChevronRight size={14} /></span>
			</a>
			<a href="/scholarships" class="problem-card">
				<div class="problem-icon-wrap"><GraduationCap size={24} /></div>
				<h3>Get funded with scholarships</h3>
				<p>Fully funded and partial scholarships for Master's and PhD students, updated daily with deadlines and eligibility.</p>
				<span class="problem-link">Browse scholarships <ChevronRight size={14} /></span>
			</a>
			<a href="/toolkit" class="problem-card">
				<div class="problem-icon-wrap"><ShieldCheck size={24} /></div>
				<h3>Relocate with confidence</h3>
				<p>Blocked accounts, health insurance, certified translations, banking and eSIMs from trusted providers, with student discounts.</p>
				<span class="problem-link">Open the toolkit <ChevronRight size={14} /></span>
			</a>
		</div>
	</div>
</section>

<!-- ═══ SCHOLARSHIPS LIVE FEED ═══ -->
<section class="section-scholarships" use:fadeUpOnScroll>
	<div class="section-inner">
		<div class="scholarships-header">
			<div>
				<span class="eyebrow">LIVE FEED</span>
				<h2 class="section-heading section-heading-left">Latest scholarship drops</h2>
			</div>
			<a href="/scholarships" class="scholarships-view-all">View all scholarships <ChevronRight size={14} /></a>
		</div>
		{#if scholarships.length > 0}
			<div class="scholarships-grid">
				{#each scholarships as s}
					<a href="/scholarships/{s.id}" class="scholarship-card">
						<div class="scholarship-top">
							<span class="scholarship-badge"><GraduationCap size={12} /> Scholarship</span>
													</div>
						<h3 class="scholarship-title" title={s.title}>{s.title}</h3>
						<p class="scholarship-provider">{s.provider}</p>
						<div class="scholarship-footer">
							{#if s.deadline}
								<span class="scholarship-deadline">Deadline: {new Date(s.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
							{/if}
							{#if s.location}
								<span class="scholarship-location" title={s.location}>{s.location}</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<p class="scholarships-empty">No scholarships loaded yet. <a href="/scholarships">Browse the catalog</a></p>
		{/if}
	</div>
</section>

<!-- ═══ LATEST GUIDES ═══ -->
{#if guides.length > 0}
<section class="section-guides" use:fadeUpOnScroll>
	<div class="section-inner">
		<div class="scholarships-header">
			<div>
				<span class="eyebrow">GUIDES</span>
				<h2 class="section-heading section-heading-left">Latest study abroad guides</h2>
			</div>
			<a href="/blog" class="scholarships-view-all">All guides <ChevronRight size={14} /></a>
		</div>
		<div class="guides-grid">
			{#each guides as g (g.slug)}
				<a href="/blog/{g.slug}" class="guide-card">
					{#if g.cover_image_url}
						<img src={g.cover_image_url} alt="" class="guide-img" loading="lazy" />
					{:else}
						<div class="guide-img guide-img-fallback"><BookOpen size={28} /></div>
					{/if}
					<div class="guide-body">
						<h3 class="guide-title">{g.title}</h3>
						{#if g.excerpt}<p class="guide-excerpt">{g.excerpt}</p>{/if}
						<span class="guide-meta">{g.reading_time} min read</span>
					</div>
				</a>
			{/each}
		</div>
	</div>
</section>
{/if}

<!-- ═══ ESSENTIAL STUDENT RELOCATION & VISA SECTION ═══ -->
<section class="section-relocation-home bg-slate-900 text-white py-20 px-6" use:fadeUpOnScroll>
	<div class="max-w-6xl mx-auto">
		<div class="text-center max-w-3xl mx-auto mb-14">
			<span class="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-extrabold uppercase px-3.5 py-1.5 rounded-full mb-4">
				Official Relocation Toolkit
			</span>
			<h2 class="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight" style="font-family: 'Outfit', sans-serif;">
				Everything you need to relocate & study in Europe
			</h2>
			<p class="text-slate-400 text-base leading-relaxed">
				Trusted providers for blocked accounts, certified translations, banking and travel eSIMs, with student discounts.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
			<!-- Expatrio Box -->
			<div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between hover:border-orange-500/50 transition-all">
				<div>
					<div class="flex items-center justify-between mb-3">
						<span class="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full">€49 Fee Refunded</span>
					</div>
					<h3 class="text-lg font-bold text-white mb-2">Expatrio Value Package</h3>
					<p class="text-slate-400 text-xs mb-4 leading-relaxed">
						Official €11,904 German Blocked Account, TK statutory health insurance, and free €95 incoming travel insurance.
					</p>
				</div>
				<a 
					href="https://www.expatrio.com?p=abroaducate123" 
					target="_blank" 
					rel="noopener noreferrer sponsored"
					class="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-colors"
				>
					Claim €49 Cashback <ChevronRight size={14} />
				</a>
			</div>

			<!-- Translated.net Box -->
			<div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between hover:border-orange-500/50 transition-all">
				<div>
					<div class="flex items-center justify-between mb-3">
						<span class="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full">Pay After Delivery</span>
					</div>
					<h3 class="text-lg font-bold text-white mb-2">Certified Translations</h3>
					<p class="text-slate-400 text-xs mb-4 leading-relaxed">
						Professional sworn translation for academic transcripts, certificates, and visa dossiers across 265 languages.
					</p>
				</div>
				<a 
					href="https://www.translated.net/en/preventivo.php?refid=7247" 
					target="_blank" 
					rel="noopener noreferrer sponsored"
					class="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-colors"
				>
					Order Translation <ChevronRight size={14} />
				</a>
			</div>

			<!-- Airalo Europe eSIM Box -->
			<div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between hover:border-orange-500/50 transition-all">
				<div>
					<div class="flex items-center justify-between mb-3">
						<span class="bg-purple-500/20 text-purple-400 text-xs font-bold px-2.5 py-0.5 rounded-full">€3.00 Off Voucher</span>
					</div>
					<h3 class="text-lg font-bold text-white mb-2">Airalo Europe eSIM</h3>
					<p class="text-slate-400 text-xs mb-4 leading-relaxed">
						Get instant 4G/5G data across 39 European countries the second you land. Keep your WhatsApp number active.
					</p>
				</div>
				<a 
					href="https://airalo.go.link/VyEma" 
					target="_blank" 
					rel="noopener noreferrer sponsored"
					class="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-colors"
				>
					Claim €3 Off eSIM <ChevronRight size={14} />
				</a>
			</div>

			<!-- Grey.co African Student Banking -->
			<div class="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between hover:border-orange-500/50 transition-all">
				<div>
					<div class="flex items-center justify-between mb-3">
						<span class="bg-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-0.5 rounded-full">Virtual EUR IBAN</span>
					</div>
					<h3 class="text-lg font-bold text-white mb-2">Grey.co Global Banking</h3>
					<p class="text-slate-400 text-xs mb-4 leading-relaxed">
						Open virtual EUR & GBP accounts from Nigeria, Ghana, and Kenya to easily pay European university fees.
					</p>
				</div>
				<a 
					href="https://app.grey.co/auth/register?referral=IAUZLT" 
					target="_blank" 
					rel="noopener noreferrer sponsored"
					class="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-colors"
				>
					Open Free Account <ChevronRight size={14} />
				</a>
			</div>
		</div>

		<div class="text-center mt-10">
			<a href="/toolkit" class="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-bold text-sm transition-colors">
				<span>Explore Full International Student Relocation Toolkit (Translations, Banking, Housing)</span>
				<ChevronRight size={16} />
			</a>
		</div>
	</div>
</section>

<!-- ═══ FINAL CTA ═══ -->
<section class="section-final-cta" use:fadeUpOnScroll>
	<div class="section-inner">
		<h2 class="final-cta-title">Ready to find your affordable path?</h2>
		<p class="final-cta-sub">Tuition-free programs, fresh scholarships and step-by-step guides. All free.</p>
		<div class="final-cta-actions">
			<a href="/scholarships" class="btn-cta-orange">Browse scholarships <ChevronRight size={18} /></a>
			<a href="/blog" class="btn-cta-ghost-light">Read the guides</a>
		</div>
	</div>
</section>

<style>
/* ═══════════════════════════════════════
   HERO — Light background with radial glows & premium layout
   ═══════════════════════════════════════ */
.hero {
	position: relative;
	background: #ffffff;
	padding: 7rem 1.5rem 4.5rem;
	text-align: center;
	overflow: hidden;
}
.hero-glow {
	position: absolute;
	border-radius: 50%;
	filter: blur(140px);
	pointer-events: none;
}
.hero-glow-orange {
	width: 550px;
	height: 550px;
	background: #f97316;
	top: -120px;
	right: -100px;
	opacity: 0.14;
}
.hero-glow-blue {
	width: 650px;
	height: 650px;
	background: #3b82f6;
	bottom: -150px;
	left: -150px;
	opacity: 0.10;
}
.hero-inner {
	position: relative;
	z-index: 1;
	max-width: 860px;
	margin: 0 auto;
}

/* Hero Social Proof Avatars Header */
.hero-avatars-row {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.85rem;
	margin-bottom: 1.25rem;
	flex-wrap: wrap;
}
.avatar-stack {
	display: flex;
	align-items: center;
}
.avatar-img {
	width: 34px;
	height: 34px;
	border-radius: 50%;
	object-fit: cover;
	border: 2.5px solid #ffffff;
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12);
	margin-left: -10px;
	transition: transform 0.2s ease, z-index 0.2s ease;
}
.avatar-img:first-child {
	margin-left: 0;
}
.avatar-img:hover {
	transform: translateY(-2px) scale(1.1);
	z-index: 5;
}
.avatar-info-group {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	text-align: left;
	gap: 0.1rem;
}
.avatar-stars-line {
	display: flex;
	align-items: center;
	gap: 0.35rem;
}
.avatar-star-glyphs {
	color: #f59e0b;
	font-size: 0.85rem;
	letter-spacing: 0.05em;
	line-height: 1;
}
.avatar-score {
	font-size: 0.75rem;
	font-weight: 800;
	color: #0f172a;
}
.avatar-subtext {
	font-size: 0.8rem;
	color: #64748b;
	margin: 0;
	line-height: 1.2;
}
.avatar-subtext strong {
	color: #1e293b;
	font-weight: 700;
}

@media (max-width: 640px) {
	.hero-avatars-row {
		flex-direction: column;
		gap: 0.5rem;
		text-align: center;
	}
	.avatar-info-group {
		align-items: center;
		text-align: center;
	}
}

/* Top Floating Trust Badge */
.hero-badge-container {
	display: flex;
	justify-content: center;
	margin-bottom: 1.5rem;
}
.hero-badge-pill {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: rgba(248, 250, 252, 0.9);
	border: 1px solid #e2e8f0;
	backdrop-filter: blur(8px);
	padding: 0.4rem 1rem;
	border-radius: 9999px;
	font-size: 0.85rem;
	font-weight: 600;
	color: #334155;
	text-decoration: none;
	box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
	transition: all 0.2s ease;
}
.hero-badge-pill:hover {
	border-color: #cbd5e1;
	background: #ffffff;
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}
.badge-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #10b981;
	box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
}
.badge-chevron {
	color: #94a3b8;
	transition: transform 0.2s ease;
}
.hero-badge-pill:hover .badge-chevron {
	transform: translateX(2px);
	color: #f97316;
}

/* Hero Typography */
.hero-title {
	font-family: 'Outfit', sans-serif;
	font-size: clamp(2.6rem, 5.5vw, 4.2rem);
	font-weight: 800;
	line-height: 1.12;
	color: #0f172a;
	margin-bottom: 1.25rem;
	letter-spacing: -0.035em;
	text-wrap: balance;
}
.hero-highlight {
	background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #f59e0b 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	display: inline-block;
}
.hero-sub {
	font-size: 1.15rem;
	color: #475569;
	line-height: 1.7;
	max-width: 620px;
	margin: 0 auto 2.25rem;
	text-wrap: balance;
}

/* Finder Bar */
.finder-bar-wrapper {
	max-width: 680px;
	margin: 0 auto 1.5rem;
}
.finder-bar {
	display: flex;
	align-items: center;
	background: #ffffff;
	border: 1.5px solid #e2e8f0;
	border-radius: 9999px;
	padding: 0.4rem 0.5rem 0.4rem 1.25rem;
	box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04);
	transition: all 0.25s ease;
}
.finder-bar:focus-within {
	border-color: #f97316;
	box-shadow: 0 12px 36px rgba(249, 115, 22, 0.15), 0 0 0 3px rgba(249, 115, 22, 0.1);
}
.finder-field {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 0.65rem;
	padding: 0.5rem 0.5rem;
	color: #94a3b8;
}
:global(.finder-icon) {
	color: #94a3b8;
	flex-shrink: 0;
}
.finder-bar:focus-within .finder-field:focus-within :global(.finder-icon) {
	color: #f97316;
}
.finder-field input {
	border: none;
	outline: none;
	background: transparent;
	font-size: 0.95rem;
	font-weight: 500;
	width: 100%;
	color: #0f172a;
}
.finder-field input::placeholder {
	color: #94a3b8;
	font-weight: 400;
}
.finder-divider {
	width: 1px;
	height: 32px;
	background: #e2e8f0;
	flex-shrink: 0;
	margin: 0 0.25rem;
}
.finder-btn {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.85rem 1.6rem;
	background: linear-gradient(135deg, #f97316, #ea580c);
	color: white;
	border: none;
	border-radius: 9999px;
	font-weight: 700;
	font-size: 0.95rem;
	white-space: nowrap;
	cursor: pointer;
	box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);
	transition: all 0.2s ease;
}
.finder-btn:hover {
	transform: translateY(-1px);
	box-shadow: 0 6px 18px rgba(249, 115, 22, 0.45);
	background: linear-gradient(135deg, #ea580c, #c2410c);
}

/* Quick Search Shortcuts */
.hero-shortcuts {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.6rem;
	flex-wrap: wrap;
	margin-bottom: 2rem;
}
.shortcuts-title {
	font-size: 0.82rem;
	font-weight: 600;
	color: #94a3b8;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}
.shortcuts-list {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-wrap: wrap;
	justify-content: center;
}
.shortcut-pill {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 9999px;
	padding: 0.35rem 0.85rem;
	font-size: 0.82rem;
	font-weight: 600;
	color: #334155;
	text-decoration: none;
	cursor: pointer;
	transition: all 0.15s ease;
}
.shortcut-pill:hover {
	background: #ffffff;
	border-color: #cbd5e1;
	color: #f97316;
	transform: translateY(-1px);
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
}
.shortcut-pill-relocation {
	background: #fff7ed;
	border-color: #ffedd5;
	color: #ea580c;
}
.shortcut-pill-relocation:hover {
	background: #ffedd5;
	border-color: #fdba74;
	color: #c2410c;
}
:global(.shortcut-icon) {
	color: #64748b;
	flex-shrink: 0;
}

.hero-trust {
	font-size: 0.82rem;
	color: #64748b;
	font-weight: 500;
	letter-spacing: 0.01em;
}

/* ═══════════════════════════════════════
   SHARED
   ═══════════════════════════════════════ */
.section-inner {
	max-width: 1080px;
	margin: 0 auto;
	padding: 0 1.5rem;
}
.eyebrow {
	display: inline-block;
	font-size: 0.72rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.12em;
	color: var(--brand-orange);
	margin-bottom: 0.75rem;
}
.eyebrow-on-dark {
	color: var(--brand-orange);
}
.section-heading {
	font-family: 'Outfit', sans-serif;
	font-size: clamp(1.7rem, 3.5vw, 2.4rem);
	font-weight: 800;
	color: var(--brand-navy);
	text-align: center;
	margin-bottom: 2.75rem;
	letter-spacing: -0.02em;
}
.section-heading-left {
	text-align: left;
}
.section-heading-light {
	color: #ffffff;
}

/* ═══════════════════════════════════════
   PROBLEM SECTION — slate-50 bg
   ═══════════════════════════════════════ */
.section-problem {
	padding: 6rem 1.5rem;
	background: var(--surface-subtle);
	text-align: center;
}
.problem-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1.5rem;
	text-align: left;
}
.problem-card {
	background: #ffffff;
	border: 1px solid var(--border-subtle);
	border-radius: 1.5rem;
	padding: 2.25rem 1.75rem;
	transition: transform 0.25s, box-shadow 0.25s;
}
.problem-card:hover {
	transform: translateY(-6px);
	box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
}
.problem-icon-wrap {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	border-radius: 14px;
	background: var(--brand-orange-light);
	color: var(--brand-orange);
	margin-bottom: 1.25rem;
}
.problem-card h3 {
	font-family: 'Outfit', sans-serif;
	font-size: 1.1rem;
	font-weight: 700;
	color: var(--brand-navy);
	margin-bottom: 0.6rem;
}
.problem-card p {
	font-size: 0.9rem;
	color: var(--text-secondary);
	line-height: 1.7;
}

.problem-card {
	display: flex;
	flex-direction: column;
	text-decoration: none;
}
.problem-link {
	margin-top: auto;
	padding-top: 1rem;
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.85rem;
	font-weight: 700;
	color: var(--brand-orange);
}

/* ═══════════════════════════════════════
   LATEST GUIDES
   ═══════════════════════════════════════ */
.section-guides {
	padding: 5rem 1.5rem;
	background: var(--surface-subtle);
}
.guides-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 1.25rem;
}
.guide-card {
	display: flex;
	flex-direction: column;
	background: #ffffff;
	border: 1px solid var(--border-subtle);
	border-radius: 1.25rem;
	overflow: hidden;
	text-decoration: none;
	transition: transform 0.25s, box-shadow 0.25s;
}
.guide-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
}
.guide-img {
	width: 100%;
	aspect-ratio: 16 / 9;
	object-fit: cover;
	background: var(--surface-subtle);
}
.guide-img-fallback {
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--text-muted);
}
.guide-body {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 1.25rem 1.25rem 1.4rem;
	flex: 1;
}
.guide-title {
	font-family: 'Outfit', sans-serif;
	font-size: 1.02rem;
	font-weight: 700;
	line-height: 1.4;
	color: var(--brand-navy);
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	overflow: hidden;
}
.guide-excerpt {
	font-size: 0.85rem;
	line-height: 1.6;
	color: var(--text-secondary);
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	overflow: hidden;
}
.guide-meta {
	margin-top: auto;
	padding-top: 0.25rem;
	font-size: 0.76rem;
	color: var(--text-muted);
}
.final-cta-actions {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	justify-content: center;
	flex-wrap: wrap;
	margin-bottom: 1.25rem;
}
.final-cta-actions .btn-cta-orange {
	margin-bottom: 0;
}
.btn-cta-ghost-light {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: calc(1rem - 1px) 2.5rem;
	border-radius: 14px;
	border: 1px solid rgba(255, 255, 255, 0.3);
	color: #ffffff;
	font-weight: 700;
	font-size: 1.1rem;
	text-decoration: none;
	transition: background 0.2s;
}
.btn-cta-ghost-light:hover {
	background: rgba(255, 255, 255, 0.08);
}
@media (max-width: 900px) {
	.guides-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
	.guides-grid { grid-template-columns: 1fr; }
}

/* ═══════════════════════════════════════
   SCHOLARSHIPS LIVE FEED — white bg
   ═══════════════════════════════════════ */
.section-scholarships {
	padding: 6rem 1.5rem;
	background: #ffffff;
}
.scholarships-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	gap: 1rem;
	margin-bottom: 2.25rem;
}
/* heading margin would push the "View all" link below the title baseline */
.scholarships-header .section-heading {
	margin-bottom: 0;
}
.scholarships-view-all {
	white-space: nowrap;
}
.scholarships-view-all {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	font-size: 0.9rem;
	font-weight: 600;
	color: var(--brand-orange);
	text-decoration: none;
	transition: opacity 0.2s;
}
.scholarships-view-all:hover {
	opacity: 0.75;
}
.scholarships-loading {
	text-align: center;
	color: var(--text-muted);
	padding: 3rem;
}
.scholarships-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 1.25rem;
}
.scholarship-card {
	background: #ffffff;
	border: 1px solid var(--border-subtle);
	border-radius: 1.5rem;
	padding: 1.75rem 1.5rem;
	text-decoration: none;
	transition: transform 0.25s, box-shadow 0.25s;
	display: flex;
	flex-direction: column;
	gap: 0.6rem;
	min-width: 0;
}
.scholarship-card:hover {
	transform: translateY(-6px);
	box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
}
.scholarship-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 0.75rem;
	min-height: 1.75rem;
}
.scholarship-badge {
	flex-shrink: 0;
	white-space: nowrap;
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	font-size: 0.68rem;
	font-weight: 700;
	color: var(--brand-orange);
	background: var(--brand-orange-light);
	padding: 0.3rem 0.7rem;
	border-radius: 100px;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}
.scholarship-title {
	font-family: 'Outfit', sans-serif;
	font-size: 1rem;
	font-weight: 700;
	color: var(--brand-navy);
	line-height: 1.4;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 3;
	line-clamp: 3;
	overflow: hidden;
	min-height: 4.2em;
}
.scholarship-provider {
	font-size: 0.84rem;
	color: var(--text-secondary);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.scholarship-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 0.75rem;
	margin-top: auto;
	padding-top: 0.75rem;
	border-top: 1px solid var(--border-subtle);
	font-size: 0.76rem;
	color: var(--text-muted);
}
.scholarship-deadline {
	font-weight: 500;
	white-space: nowrap;
	flex-shrink: 0;
}
.scholarship-location {
	min-width: 0;
	text-align: right;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.scholarships-empty {
	text-align: center;
	color: var(--text-muted);
	padding: 3rem;
}
.scholarships-empty a {
	color: var(--brand-orange);
	text-decoration: none;
	font-weight: 600;
}

/* ═══════════════════════════════════════
   FINAL CTA — dark background
   ═══════════════════════════════════════ */
.section-final-cta {
	padding: 6rem 1.5rem;
	background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
	text-align: center;
}
.final-cta-title {
	font-family: 'Outfit', sans-serif;
	font-size: clamp(1.9rem, 4vw, 2.6rem);
	font-weight: 800;
	color: #ffffff;
	margin-bottom: 0.85rem;
	letter-spacing: -0.02em;
}
.final-cta-sub {
	font-size: 1.08rem;
	color: rgba(255, 255, 255, 0.7);
	max-width: 500px;
	margin: 0 auto 2.25rem;
	line-height: 1.75;
}
.btn-cta-orange {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	padding: 1rem 2.5rem;
	background: var(--brand-orange);
	color: white;
	border: none;
	border-radius: 14px;
	font-weight: 700;
	font-size: 1.1rem;
	transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
	margin-bottom: 1.25rem;
}
.btn-cta-orange:hover {
	background: var(--brand-orange-hover);
	transform: translateY(-2px);
	box-shadow: 0 8px 24px rgba(249, 115, 22, 0.3);
}
.final-cta-note {
	font-size: 0.82rem;
	color: rgba(255, 255, 255, 0.45);
}

/* ═══════════════════════════════════════
   ANIMATIONS
   ═══════════════════════════════════════ */
@keyframes fadeIn {
	from { opacity: 0; transform: translateY(10px); }
	to { opacity: 1; transform: translateY(0); }
}

/* ═══════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════ */
@media (max-width: 900px) {
	.scholarships-grid {
		grid-template-columns: repeat(2, 1fr);
	}
	.steps-grid {
		flex-direction: column;
		align-items: center;
	}
	.step-connector {
		width: 2px;
		height: 32px;
		margin: 0;
	}
	.ai-strategy-card {
		grid-template-columns: 1fr;
		gap: 2.5rem;
	}
	.ai-strategy-right {
		width: 100%;
		display: flex;
		justify-content: center;
	}
	.strategy-preview-card {
		max-width: 440px;
	}
}

@media (max-width: 768px) {
	.hero {
		padding: 5rem 1rem 3rem;
	}
	.hero-actions {
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		max-width: 320px;
		margin-left: auto;
		margin-right: auto;
	}
	.hero-actions .btn-cta-primary,
	.hero-actions .btn-ghost {
		width: 100%;
		justify-content: center;
		text-align: center;
		box-sizing: border-box;
	}
	.finder-bar {
		flex-direction: column;
		border-radius: 1.25rem;
		padding: 0.75rem;
	}
	.finder-divider {
		width: 100%;
		height: 1px;
	}
	.finder-btn {
		border-radius: 0.75rem;
		justify-content: center;
		padding: 0.85rem;
		width: 100%;
	}
	.section-problem,
	.section-solution,
	.section-how,
	.section-video,
	.section-proof,
	.section-scholarships,
	.section-final-cta {
		padding: 4rem 1rem;
	}
	.solution-layout {
		grid-template-columns: 1fr;
		gap: 2.5rem;
	}
	.strategy-mockup {
		order: 2;
	}
	.solution-copy {
		order: 1;
	}
	.proof-layout {
		grid-template-columns: 1fr;
		gap: 2rem;
	}
	.scholarships-header {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
	}
	.scholarships-grid {
		grid-template-columns: 1fr;
	}
	.video-features {
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	/* AI Strategy Mobile */
	.section-ai-strategy {
		padding: 3.5rem 1rem;
	}
	.ai-strategy-card {
		display: flex;
		flex-direction: column;
		gap: 2.25rem;
		width: 100%;
	}
	.ai-strategy-left {
		width: 100%;
	}
	.ai-strategy-desc {
		font-size: 0.95rem;
		line-height: 1.6;
		margin-bottom: 1.25rem;
	}
	.ai-strategy-features {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		width: 100%;
	}
	.ai-feature-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		background: rgba(255, 255, 255, 0.85);
		border: 1px solid #fed7aa;
		border-radius: 0.875rem;
		padding: 0.875rem 1rem;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
		width: 100%;
		box-sizing: border-box;
	}
	.ai-feature-icon {
		width: 2rem;
		height: 2rem;
		border-radius: 8px;
		flex-shrink: 0;
	}
	.ai-strategy-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
		margin-bottom: 0.5rem;
	}
	.btn-strategy-sample,
	.btn-strategy-browse {
		width: 100%;
		justify-content: center;
		text-align: center;
		padding: 0.9rem 1.25rem;
		box-sizing: border-box;
		border-radius: 12px;
	}
	.ai-strategy-footer {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	.strategy-preview-card {
		width: 100%;
		max-width: 100%;
		border-radius: 1rem;
		padding: 1.25rem;
		box-sizing: border-box;
		box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
	}
}

@media (max-width: 480px) {
	.hero {
		padding: 4rem 0.875rem 2.5rem;
	}
	.hero-title {
		font-size: 2.25rem;
		line-height: 1.15;
		margin-bottom: 1rem;
	}
	.hero-sub {
		font-size: 1rem;
		line-height: 1.6;
		margin-bottom: 1.75rem;
	}
	.section-inner {
		padding: 0 0.875rem;
	}
	.section-heading {
		font-size: 1.65rem;
		margin-bottom: 1.75rem;
	}
	.problem-card,
	.proof-stats-card,
	.proof-testimonial-card,
	.step-card {
		padding: 1.5rem 1.125rem;
	}
	.final-cta-title {
		font-size: 1.85rem;
	}
	.btn-cta-orange {
		width: 100%;
		justify-content: center;
		box-sizing: border-box;
	}
}
</style>
