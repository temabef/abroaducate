<script lang="ts">
import { goto } from '$app/navigation';
import { onMount } from 'svelte';
import {
Wallet,
Target,
Route,
CheckCircle2,
ChevronRight,
Quote,
Landmark,
GraduationCap,
BookOpen,
Sparkles,
Globe,
Building2,
ShieldCheck
} from 'lucide-svelte';
import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
import SampleStrategyModal from '$lib/components/SampleStrategyModal.svelte';
import StrategyUsageCounter from '$lib/components/StrategyUsageCounter.svelte';
import IeltsPrepModal from '$lib/components/IeltsPrepModal.svelte';

let { data } = $props();
let { supabase, session } = $derived(data);

// Finder bar state
let finderField = $state('');
let finderDestination = $state('');

// Auth modal state
let showAuth = $state(false);
let authMode = $state<'login' | 'signup'>('signup');

// Sample strategy modal & IELTS modal
let showSampleModal = $state(false);
let showIeltsModal = $state(false);

// Testimonial rotation
let activeTestimonial = $state(0);
const testimonials = [
{
quote: 'I had no idea tuition-free programs in Germany were this accessible. Abroaducate matched me to TU Berlin in under 5 minutes.',
name: 'Adaeze O.',
context: 'Applied to TU Berlin'
},
{
quote: 'The scholarship radar found 12 matches I never would have found on my own. Now I study at RWTH Aachen with full funding.',
name: 'Samuel K.',
context: 'Now studying at RWTH Aachen'
},
{
quote: 'The strategy check told me exactly what documents I needed and when. I got into Heidelberg on my first application.',
name: 'Fatima A.',
context: 'Applied to Heidelberg University'
}
];

// Scholarships live feed
let scholarships = $state<any[]>([]);
let scholarshipsLoading = $state(true);

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

function openSignup() {
if (session?.user) {
goto('/dashboard');
} else {
authMode = 'signup';
showAuth = true;
}
}

onMount(() => {
// Rotate testimonials every 5 seconds
const interval = setInterval(() => {
activeTestimonial = (activeTestimonial + 1) % testimonials.length;
}, 5000);

// Fetch scholarships
(async () => {
try {
const { data: rows } = await supabase
.from('public_scholarships_decoded')
.select('id, title, provider, amount, deadline, location')
.order('created_at', { ascending: false })
.limit(4);
scholarships = rows ?? [];
} catch {
scholarships = [];
} finally {
scholarshipsLoading = false;
}
})();

return () => clearInterval(interval);
});
</script>

<svelte:head>
	<title>Abroaducate — Study Abroad Affordably. Apply with Clarity.</title>
</svelte:head>

<!-- ═══ HERO ═══ -->
<section class="hero">
	<div class="hero-glow hero-glow-orange"></div>
	<div class="hero-glow hero-glow-blue"></div>
	<div class="hero-inner" use:fadeUpOnScroll>
		<!-- Top Floating Trust Badge -->
		<div class="hero-badge-container">
			<a href="/pricing" class="hero-badge-pill">
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
			Discover 2,500+ tuition-free and affordable degree programs across Europe. Match with fully funded scholarships and access embassy-approved relocation tools.
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

		<!-- Social Proof Avatars Footer (Replaces plain text) -->
		<div class="hero-avatars-row mt-6 pt-2">
			<div class="avatar-stack">
				<img src="https://i.ibb.co/Cs7xfBMy/nigeria-ghana-blocked-account-cover-1787935987572.jpg" alt="Student Ada" class="avatar-img" />
				<img src="https://i.ibb.co/bMbsNsFs/biotech-campus-study-1787935502813.jpg" alt="Student Maya" class="avatar-img" />
				<img src="https://i.ibb.co/yBpq3Y50/austria-study-cover-1787937472288.jpg" alt="Student Julia" class="avatar-img" />
				<img src="https://i.ibb.co/QjHhxjsR/italy-dsu-cover-1787935757791.jpg" alt="Student Marco" class="avatar-img" />
			</div>
			<div class="avatar-info-group">
				<div class="avatar-stars-line">
					<span class="avatar-star-glyphs">★★★★★</span>
					<span class="avatar-score">4.9/5</span>
				</div>
				<p class="avatar-subtext">Trusted by <strong>4,500+ international students</strong> applying to European universities</p>
			</div>
		</div>
	</div>
</section>

<!-- ═══ UNIVERSITY TRUST BAR ═══ -->
<section class="marquee-section" use:fadeUpOnScroll>
	<p class="marquee-label">Zero/Low Tuition Pathways in Europe</p>
	<div class="marquee-track">
		<div class="marquee-content">
			<span class="marquee-item"><Landmark size={18} /> <span class="marquee-name">RWTH Aachen</span> <span class="marquee-country">Germany</span></span>
			<span class="marquee-item"><GraduationCap size={18} /> <span class="marquee-name">TU Munich</span> <span class="marquee-country">Germany</span></span>
			<span class="marquee-item"><BookOpen size={18} /> <span class="marquee-name">Univ. of Oslo</span> <span class="marquee-country">Norway</span></span>
			<span class="marquee-item"><Landmark size={18} /> <span class="marquee-name">TU Wien</span> <span class="marquee-country">Austria</span></span>
			<span class="marquee-item"><GraduationCap size={18} /> <span class="marquee-name">Sorbonne</span> <span class="marquee-country">France</span></span>
			<!-- Duplicate for infinite scroll -->
			<span class="marquee-item"><Landmark size={18} /> <span class="marquee-name">RWTH Aachen</span> <span class="marquee-country">Germany</span></span>
			<span class="marquee-item"><GraduationCap size={18} /> <span class="marquee-name">TU Munich</span> <span class="marquee-country">Germany</span></span>
			<span class="marquee-item"><BookOpen size={18} /> <span class="marquee-name">Univ. of Oslo</span> <span class="marquee-country">Norway</span></span>
			<span class="marquee-item"><Landmark size={18} /> <span class="marquee-name">TU Wien</span> <span class="marquee-country">Austria</span></span>
			<span class="marquee-item"><GraduationCap size={18} /> <span class="marquee-name">Sorbonne</span> <span class="marquee-country">France</span></span>
		</div>
	</div>
</section>

<!-- ═══ PROBLEM SECTION ═══ -->
<section class="section-problem" use:fadeUpOnScroll>
	<div class="section-inner">
		<span class="eyebrow">THE PLATFORM</span>
		<h2 class="section-heading">Studying abroad shouldn't cost your future</h2>
		<div class="problem-grid">
			<div class="problem-card">
				<div class="problem-icon-wrap"><Landmark size={24} /></div>
				<h3>0 EUR Tuition Pathways</h3>
				<p>Discover 2,500+ tuition-free and affordable degree programs across Germany, Austria, Italy, Sweden, and France with complete cost transparency.</p>
			</div>
			<div class="problem-card">
				<div class="problem-icon-wrap"><Target size={24} /></div>
				<h3>Free AI Scholarship Radar</h3>
				<p>Automatically match your academic profile with verified DAAD, Erasmus+, and university grants with zero subscription fees.</p>
			</div>
			<div class="problem-card">
				<div class="problem-icon-wrap"><ShieldCheck size={24} /></div>
				<h3>Embassy Relocation Toolkit</h3>
				<p>Get official blocked accounts, statutory health insurance (TK), certified sworn translations, and travel eSIMs with exclusive student discounts.</p>
			</div>
		</div>
	</div>
</section>

<!-- ═══ SOLUTION SECTION ═══ -->
<section class="section-solution" use:fadeUpOnScroll>
	<div class="section-inner">
		<div class="solution-layout">
			<!-- Left: Strategy Board Mockup -->
			<div class="strategy-mockup">
				<div class="mockup-chrome">
					<span class="dot red"></span>
					<span class="dot yellow"></span>
					<span class="dot green"></span>
					<span class="mockup-title-bar">Strategy Board</span>
				</div>
				<div class="mockup-body">
					<div class="mockup-row">
						<span class="mockup-label">Match Score</span>
						<span class="mockup-value mockup-green">92%</span>
					</div>
					<div class="mockup-row">
						<span class="mockup-label">Program</span>
						<span class="mockup-value">MSc Data Science — TU Munich</span>
					</div>
					<div class="mockup-row">
						<span class="mockup-label">Tuition</span>
						<span class="mockup-value mockup-green">€0/semester</span>
					</div>
					<div class="mockup-row">
						<span class="mockup-label">Scholarships Matched</span>
						<span class="mockup-value">4 found</span>
					</div>
					<div class="mockup-divider"></div>
					<div class="mockup-action">
						<span class="mockup-action-dot"></span>
						Generate Free SOP with AI
					</div>
					<div class="mockup-action">
						<span class="mockup-action-dot"></span>
						Review scholarship win strategy
					</div>
				</div>
			</div>

			<!-- Right: Copy -->
			<div class="solution-copy">
				<span class="eyebrow">YOUR APP</span>
				<h2 class="section-heading section-heading-left">One clear workflow from discovery to submission</h2>
				<ul class="solution-bullets">
					<li><CheckCircle2 size={20} /> <span>Find affordable programs with real cost breakdowns</span></li>
					<li><CheckCircle2 size={20} /> <span>Get auto-matched with relevant scholarships</span></li>
					<li><CheckCircle2 size={20} /> <span>Generate tailored SOPs, cover letters, and personal statements for free</span></li>
					<li><CheckCircle2 size={20} /> <span>Access official blocked accounts and visa relocation tools</span></li>
				</ul>
				<a href="/programs" class="btn-cta-primary btn-cta-navy">Explore Programs <ChevronRight size={16} /></a>
			</div>
		</div>
	</div>
</section>

<!-- ═══ HOW IT WORKS ═══ -->
<section class="section-how" id="how-it-works" use:fadeUpOnScroll>
	<div class="section-inner">
		<span class="eyebrow">HOW IT WORKS</span>
		<h2 class="section-heading">From search to submission in three steps</h2>
		<div class="steps-grid">
			<div class="step-card">
				<div class="step-number-wrap"><span class="step-number">01</span></div>
				<h3>Find your program</h3>
				<p>Search 2,500+ programs by field, country, and budget. See tuition, living costs, and language requirements upfront.</p>
			</div>
			<div class="step-connector"></div>
			<div class="step-card">
				<div class="step-number-wrap"><span class="step-number">02</span></div>
				<h3>Auto-match scholarships</h3>
				<p>Our engine matches you with relevant funding opportunities based on your academic background and chosen degree.</p>
			</div>
			<div class="step-connector"></div>
			<div class="step-card">
				<div class="step-number-wrap"><span class="step-number">03</span></div>
				<h3>Generate free application strategy</h3>
				<p>Generate AI-powered application documents and action plans with zero credits or subscription fees.</p>
			</div>
		</div>
	</div>
</section>

<!-- ═══ VIDEO SECTION ═══ -->
<section class="section-video" use:fadeUpOnScroll>
	<div class="section-inner">
		<span class="eyebrow eyebrow-on-dark">SEE IT IN ACTION</span>
		<h2 class="section-heading section-heading-light">From finding a program to matching scholarships in under 2 minutes</h2>
		<div class="video-container">
			<div class="video-wrapper">
				<iframe
					src="https://guideless.ai/share/finding-and-applying-to-scholarships-with-abroaducate-QZAcgafe8jdH/embed"
					title="Abroaducate Platform Walkthrough"
					frameborder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
				></iframe>
				<div class="video-bottom-mask"></div>
			</div>
		</div>
		<div class="video-features">
			<span class="video-feature"><span class="vf-dot"></span> 2,500+ programs</span>
			<span class="video-feature"><span class="vf-dot"></span> Automatic scholarship matching</span>
			<span class="video-feature"><span class="vf-dot"></span> AI strategy in 1 click</span>
		</div>
	</div>
</section>

<!-- ═══ SOCIAL PROOF ═══ -->
<section class="section-proof" use:fadeUpOnScroll>
	<div class="section-inner">
		<div class="proof-layout">
			<!-- Left: Stats Card -->
			<div class="proof-stats-card">
				<div class="proof-hero-stat">
					<span class="proof-big-number">2,500+</span>
					<span class="proof-big-label">Programs across Europe</span>
				</div>
				<div class="proof-secondary-stats">
					<div class="proof-stat-item">
						<span class="proof-stat-val">10</span>
						<span class="proof-stat-lbl">Countries</span>
					</div>
					<div class="proof-stat-item">
						<span class="proof-stat-val">600+</span>
						<span class="proof-stat-lbl">Scholarships</span>
					</div>
					<div class="proof-stat-item">
						<span class="proof-stat-val">5,000+</span>
						<span class="proof-stat-lbl">Students</span>
					</div>
				</div>
			</div>

			<!-- Right: Testimonials Card -->
			<div class="proof-testimonial-card">
				<div class="testimonial-carousel">
					{#each testimonials as t, i}
						<div class="testimonial-slide" class:active={i === activeTestimonial}>
							<Quote size={28} class="tq-icon" />
							<p class="testimonial-text">{t.quote}</p>
							<div class="testimonial-author">
								<span class="testimonial-name">{t.name}</span>
								<span class="testimonial-context">{t.context}</span>
							</div>
						</div>
					{/each}
					<div class="testimonial-dots">
						{#each testimonials as _, i}
							<button
								class="testimonial-dot"
								class:active={i === activeTestimonial}
								onclick={() => { activeTestimonial = i; }}
								aria-label="Show testimonial {i + 1}"
							></button>
						{/each}
					</div>
				</div>
			</div>
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
			<a href="/scholarships" class="scholarships-view-all">View all directory <ChevronRight size={14} /></a>
		</div>
		{#if scholarshipsLoading}
			<div class="scholarships-loading">
				<span class="loading-spinner"></span> Loading scholarships...
			</div>
		{:else if scholarships.length > 0}
			<div class="scholarships-grid">
				{#each scholarships as s}
					<a href="/scholarships/{s.id}" class="scholarship-card">
						<div class="scholarship-top">
							<span class="scholarship-badge"><GraduationCap size={12} /> Scholarship</span>
							{#if s.amount}<span class="scholarship-amount">{s.amount}</span>{/if}
						</div>
						<h3 class="scholarship-title">{s.title}</h3>
						<p class="scholarship-provider">{s.provider}</p>
						<div class="scholarship-footer">
							{#if s.deadline}
								<span class="scholarship-deadline">Deadline: {new Date(s.deadline).toLocaleDateString()}</span>
							{/if}
							{#if s.location}
								<span class="scholarship-location">{s.location}</span>
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

<!-- ═══ AI SCHOLARSHIP STRATEGY TRUST SECTION ═══ -->
<section class="section-ai-strategy" use:fadeUpOnScroll>
	<div class="section-inner">
		<div class="ai-strategy-card">
			<div class="ai-strategy-left">
				<span class="eyebrow">AI-POWERED</span>
				<h2 class="section-heading section-heading-left">Get a Scholarship Win Strategy in 30 seconds</h2>
				<p class="ai-strategy-desc">
					For every scholarship you find, unlock a personalised strategy that tells you exactly how to win it — based on your actual profile.
				</p>
				<div class="ai-strategy-features">
					<div class="ai-feature-item">
						<div class="ai-feature-icon" style="color: #16a34a;"><CheckCircle2 size={20} /></div>
						<div class="ai-feature-text">
							<strong>Eligibility Match</strong>
							<p>Know if you qualify before you apply</p>
						</div>
					</div>
					<div class="ai-feature-item">
						<div class="ai-feature-icon" style="color: #2563eb;"><Target size={20} /></div>
						<div class="ai-feature-text">
							<strong>Committee Rubric</strong>
							<p>Exactly what selection committees look for</p>
						</div>
					</div>
					<div class="ai-feature-item">
						<div class="ai-feature-icon" style="color: #9333ea;"><Route size={20} /></div>
						<div class="ai-feature-text">
							<strong>Action Path</strong>
							<p>Step-by-step roadmap tailored to your profile</p>
						</div>
					</div>
				</div>
				<div class="ai-strategy-actions">
					<button onclick={() => showSampleModal = true} class="btn-ghost btn-strategy-sample">
						See Sample Strategy
					</button>
					<a href="/programs" class="btn-cta-primary btn-strategy-browse">
						Browse Programs <ChevronRight size={16} />
					</a>
				</div>
				<div class="ai-strategy-footer">
					<StrategyUsageCounter />
					<p class="ai-strategy-footnote">100% Free for all students · No credit card required</p>
				</div>
			</div>
			<div class="ai-strategy-right">
				<!-- Strategy preview mockup -->
				<div class="strategy-preview-card">
					<div class="sp-header">
						<div class="sp-badge">Scholarship Win Strategy</div>
						<div class="sp-scholarship">NHR Graduate Fellowship 2026</div>
						<div class="sp-value">Full tuition + €2,200/month</div>
					</div>
					<div class="sp-rubric">
						<div class="sp-rubric-title">Committee Rubric</div>
						<div class="sp-rubric-row">
							<span class="sp-badge-low">Below Range</span>
							<span>GPA / Academic Strength</span>
						</div>
						<div class="sp-rubric-row">
							<span class="sp-badge-missing">Not Provided</span>
							<span>Language Requirements</span>
						</div>
						<div class="sp-rubric-row">
							<span class="sp-badge-med">Medium</span>
							<span>Field of Study Fit</span>
						</div>
					</div>
					<div class="sp-action">
						<div class="sp-action-title">Next Steps</div>
						<div class="sp-step"><span class="sp-step-num">1</span> Schedule IELTS/TOEFL exam</div>
						<div class="sp-step"><span class="sp-step-num">2</span> Draft your Statement of Purpose</div>
						<div class="sp-step"><span class="sp-step-num">3</span> Reach out to potential supervisors</div>
					</div>
					<div class="sp-cost">100% Free · Generated in 30s</div>
				</div>
			</div>
		</div>
	</div>
</section>

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
				We partner with embassy-approved providers to bring you blocked accounts, certified translations, travel eSIMs, and free AI test prep.
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

<!-- ═══ MEET THE FOUNDER & MISSION ═══ -->
<section class="section-founder" use:fadeUpOnScroll>
	<!-- Ambient glows mirroring the hero -->
	<div class="founder-glow founder-glow-orange"></div>
	<div class="founder-glow founder-glow-blue"></div>

	<div class="section-inner" style="position: relative; z-index: 1;">
		<!-- Top eyebrow label -->
		<div class="founder-eyebrow-row">
			<span class="founder-eyebrow-pill">
				<Sparkles size={13} />
				Our Story & Mission
			</span>
		</div>

		<div class="founder-card-container">
			<!-- Left: Photo Column -->
			<div class="founder-image-col">
				<!-- Decorative rings -->
				<div class="founder-ring founder-ring-1"></div>
				<div class="founder-ring founder-ring-2"></div>
				<div class="founder-image-wrapper">
					<img src="/images/saheed-kolawole.jpg" alt="Saheed Kolawole — Founder of Abroaducate" class="founder-portrait" />
				</div>
				<!-- Credential chip below photo -->
				<div class="founder-chip">
					<span class="founder-chip-dot"></span>
					<div>
						<p class="founder-chip-name">Saheed Kolawole</p>
						<p class="founder-chip-title">Founder &amp; Lead Strategist &bull; Europe Alum</p>
					</div>
				</div>
			</div>

			<!-- Right: Story Content -->
			<div class="founder-content-col">
				<h2 class="founder-heading">
					"Studying in Europe should be <span class="founder-heading-accent">transparent, affordable,</span> and accessible to everyone."
				</h2>

				<div class="founder-letter">
					<p>
						When I first embarked on my journey to study in Europe, I was confronted with predatory agency fees of $3,000+, confusing foreign portals, and the constant anxiety of making a minor document error that could derail a visa.
					</p>
					<p>
						I built <strong>Abroaducate</strong> with a simple mission: ensure that no ambitious student ever has to pay a fortune just to find an accredited <strong>€0 tuition degree</strong> in Germany, win a <strong>€7,000 regional grant</strong> in Italy, or navigate embassy requirements with complete confidence.
					</p>
					<p>
						Every program in our database and every partner in our toolkit is curated from real experience — so you can apply directly, save thousands on tuition, and relocate with clarity.
					</p>
				</div>

				<!-- Highlight Pills -->
				<div class="founder-highlights-grid">
					<div class="founder-highlight-item">
						<CheckCircle2 size={15} class="flex-shrink-0" style="color: #10b981;" />
						<span>100% Free Self-Serve Search</span>
					</div>
					<div class="founder-highlight-item">
						<CheckCircle2 size={15} class="flex-shrink-0" style="color: #10b981;" />
						<span>2,800+ Verified Public Degrees</span>
					</div>
					<div class="founder-highlight-item">
						<CheckCircle2 size={15} class="flex-shrink-0" style="color: #10b981;" />
						<span>Official Embassy-Approved Tools</span>
					</div>
				</div>

				<!-- Actions -->
				<div class="founder-actions-row">
					<a href="/programs" class="founder-btn-primary">
						<span>Explore Programs</span>
						<ChevronRight size={16} />
					</a>
					<a href="/toolkit" class="founder-btn-ghost">
						<span>Relocation Toolkit</span>
						<ChevronRight size={14} />
					</a>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ═══ FINAL CTA ═══ -->
<section class="section-final-cta" use:fadeUpOnScroll>
	<div class="section-inner">
		<h2 class="final-cta-title">Ready to find your affordable path?</h2>
		<p class="final-cta-sub">Join thousands of students discovering tuition-free and low-cost programs across Europe.</p>
		<button class="btn-cta-orange" onclick={openSignup}>
			Start Discovering <ChevronRight size={18} />
		</button>
		<p class="final-cta-note">100% Free &middot; No credit card required &middot; 2,500+ European programs.</p>
	</div>
</section>

<!-- Auth Modal -->
<AuthenticationFlow bind:show={showAuth} {supabase} mode={authMode} returnUrl="/dashboard" />

<!-- Sample Strategy Modal -->
<SampleStrategyModal bind:show={showSampleModal} />

<!-- IELTS Prep Modal -->
<IeltsPrepModal bind:show={showIeltsModal} />

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
   UNIVERSITY MARQUEE — separated with borders
   ═══════════════════════════════════════ */
.marquee-section {
	background: #ffffff;
	border-top: 1px solid var(--border-subtle);
	border-bottom: 1px solid var(--border-subtle);
	padding: 2rem 0;
	overflow: hidden;
}
.marquee-label {
	text-align: center;
	font-size: 0.7rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.12em;
	color: var(--text-muted);
	margin-bottom: 1.25rem;
}
.marquee-track {
	position: relative;
	overflow: hidden;
	mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
	-webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
}
.marquee-content {
	display: flex;
	gap: 3.5rem;
	animation: marquee-scroll 35s linear infinite;
	width: max-content;
}
.marquee-item {
	display: inline-flex;
	align-items: center;
	gap: 0.65rem;
	white-space: nowrap;
	filter: grayscale(1);
	opacity: 0.6;
	transition: filter 0.3s, opacity 0.3s;
}
.marquee-item:hover {
	filter: grayscale(0);
	opacity: 1;
}
.marquee-name {
	font-size: 0.95rem;
	font-weight: 600;
	color: var(--text-primary);
}
.marquee-country {
	font-size: 0.8rem;
	color: var(--text-muted);
	font-weight: 400;
}
@keyframes marquee-scroll {
	0% { transform: translateX(0); }
	100% { transform: translateX(-50%); }
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

/* ═══════════════════════════════════════
   SOLUTION SECTION — white bg, 2-col
   ═══════════════════════════════════════ */
.section-solution {
	padding: 6rem 1.5rem;
	background: #ffffff;
}
.solution-layout {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4rem;
	align-items: center;
}
.strategy-mockup {
	background: #ffffff;
	border: 1px solid var(--border-subtle);
	border-radius: 1.5rem;
	overflow: hidden;
	box-shadow: 0 20px 60px rgba(15, 23, 42, 0.1), 0 1px 3px rgba(15, 23, 42, 0.04);
}
.mockup-chrome {
	display: flex;
	align-items: center;
	gap: 7px;
	padding: 0.85rem 1.25rem;
	background: #f8fafc;
	border-bottom: 1px solid var(--border-subtle);
}
.dot {
	width: 11px;
	height: 11px;
	border-radius: 50%;
}
.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #22c55e; }
.mockup-title-bar {
	margin-left: 0.75rem;
	font-size: 0.78rem;
	font-weight: 600;
	color: var(--text-muted);
}
.mockup-body {
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 0;
}
.mockup-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.7rem 0;
	border-bottom: 1px solid #f1f5f9;
}
.mockup-row:last-of-type {
	border-bottom: none;
}
.mockup-label {
	font-size: 0.82rem;
	color: var(--text-muted);
	font-weight: 500;
}
.mockup-value {
	font-size: 0.84rem;
	font-weight: 600;
	color: var(--text-primary);
}
.mockup-green {
	color: #16a34a;
}
.mockup-divider {
	height: 1px;
	background: var(--border-subtle);
	margin: 0.75rem 0;
}
.mockup-action {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	font-size: 0.84rem;
	color: var(--text-secondary);
	font-weight: 500;
	padding: 0.4rem 0;
}
.mockup-action-dot {
	width: 9px;
	height: 9px;
	border-radius: 50%;
	background: var(--brand-orange);
	flex-shrink: 0;
}
.solution-copy {
	text-align: left;
}
.solution-bullets {
	list-style: none;
	padding: 0;
	margin: 0 0 2.25rem;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}
.solution-bullets li {
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	font-size: 0.98rem;
	color: var(--text-secondary);
	line-height: 1.55;
}
.solution-bullets li :global(svg) {
	color: #10b981;
	flex-shrink: 0;
	margin-top: 2px;
}

/* ═══════════════════════════════════════
   HOW IT WORKS — white bg
   ═══════════════════════════════════════ */
.section-how {
	padding: 6rem 1.5rem;
	background: #ffffff;
	text-align: center;
}
.steps-grid {
	display: flex;
	align-items: flex-start;
	justify-content: center;
	gap: 0;
	max-width: 920px;
	margin: 0 auto;
}
.step-card {
	flex: 1;
	text-align: center;
	padding: 1.5rem 1.25rem;
}
.step-number-wrap {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 64px;
	height: 64px;
	border-radius: 1rem;
	background: var(--brand-orange-light);
	margin-bottom: 1.25rem;
}
.step-number {
	font-family: 'Outfit', sans-serif;
	font-size: 1.6rem;
	font-weight: 800;
	color: var(--brand-orange);
	line-height: 1;
}
.step-connector {
	width: 48px;
	height: 2px;
	background: var(--border-subtle);
	margin-top: 3rem;
	flex-shrink: 0;
}
.step-card h3 {
	font-family: 'Outfit', sans-serif;
	font-size: 1.1rem;
	font-weight: 700;
	color: var(--brand-navy);
	margin-bottom: 0.6rem;
}
.step-card p {
	font-size: 0.9rem;
	color: var(--text-secondary);
	line-height: 1.7;
}

/* ═══════════════════════════════════════
   VIDEO SECTION — dark bg
   ═══════════════════════════════════════ */
.section-video {
	padding: 6rem 1.5rem;
	background: #0f172a;
	text-align: center;
}
.video-container {
	max-width: 840px;
	margin: 0 auto;
}
.video-wrapper {
	position: relative;
	padding-bottom: 62.5%;
	border-radius: 1rem;
	overflow: hidden;
	box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
	border: 1px solid rgba(255, 255, 255, 0.08);
}
.video-wrapper iframe {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border: none;
}
.video-bottom-mask {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 7%;
	background: #0f172a;
	z-index: 2;
	pointer-events: none;
}
.video-features {
	display: flex;
	justify-content: center;
	gap: 2.5rem;
	margin-top: 2.25rem;
	flex-wrap: wrap;
}
.video-feature {
	display: flex;
	align-items: center;
	gap: 0.55rem;
	font-size: 0.88rem;
	color: rgba(255, 255, 255, 0.65);
	font-weight: 500;
}
.vf-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--brand-orange);
	flex-shrink: 0;
}

/* ═══════════════════════════════════════
   SOCIAL PROOF — white bg, 2-col
   ═══════════════════════════════════════ */
.section-proof {
	padding: 6rem 1.5rem;
	background: #ffffff;
	overflow: hidden;
}
.proof-layout {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 3rem;
	align-items: stretch;
	max-width: 100%;
}
.proof-stats-card {
	background: #ffffff;
	border: 1px solid var(--border-subtle);
	border-radius: 1.5rem;
	padding: 3rem 2.5rem;
	box-shadow: 0 8px 32px rgba(15, 23, 42, 0.06);
}
.proof-hero-stat {
	text-align: center;
	margin-bottom: 2.25rem;
	padding-bottom: 2rem;
	border-bottom: 1px solid var(--border-subtle);
}
.proof-big-number {
	display: block;
	font-family: 'Outfit', sans-serif;
	font-size: 3.5rem;
	font-weight: 800;
	color: var(--brand-navy);
	line-height: 1.1;
	letter-spacing: -0.03em;
}
.proof-big-label {
	display: block;
	font-size: 0.95rem;
	color: var(--text-secondary);
	font-weight: 500;
	margin-top: 0.35rem;
}
.proof-secondary-stats {
	display: flex;
	justify-content: space-around;
	gap: 1.5rem;
	flex-wrap: wrap;
}
.proof-stat-item {
	text-align: center;
}
.proof-stat-val {
	display: block;
	font-family: 'Outfit', sans-serif;
	font-size: 1.6rem;
	font-weight: 800;
	color: var(--brand-navy);
	letter-spacing: -0.02em;
}
.proof-stat-lbl {
	font-size: 0.76rem;
	color: var(--text-muted);
	text-transform: uppercase;
	letter-spacing: 0.06em;
	font-weight: 600;
}
.proof-testimonial-card {
	background: #ffffff;
	border: 1px solid var(--border-subtle);
	border-radius: 1.5rem;
	padding: 2.5rem 2rem;
	box-shadow: 0 8px 32px rgba(15, 23, 42, 0.06);
	display: flex;
	align-items: center;
}
.testimonial-carousel {
	width: 100%;
	position: relative;
	min-height: 240px;
}
.testimonial-slide {
	display: none;
	padding: 0;
}
.testimonial-slide.active {
	display: block;
	animation: fadeIn 0.45s ease;
}
:global(.tq-icon) {
	color: var(--brand-orange);
	opacity: 0.45;
	margin-bottom: 1rem;
}
.testimonial-text {
	font-size: 1.08rem;
	color: var(--text-primary);
	line-height: 1.8;
	font-style: italic;
	margin-bottom: 1.5rem;
}
.testimonial-author {
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
}
.testimonial-name {
	font-weight: 700;
	color: var(--brand-navy);
	font-size: 0.95rem;
}
.testimonial-context {
	font-size: 0.82rem;
	color: var(--text-muted);
}
.testimonial-dots {
	display: flex;
	gap: 0.5rem;
	margin-top: 1.5rem;
}
.testimonial-dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	border: none;
	background: var(--border-subtle);
	transition: background 0.2s;
}
.testimonial-dot.active {
	background: var(--brand-orange);
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
	margin-bottom: 2.25rem;
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
}
.scholarship-card:hover {
	transform: translateY(-6px);
	box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
}
.scholarship-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.scholarship-badge {
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
.scholarship-amount {
	font-size: 0.84rem;
	font-weight: 700;
	color: var(--accent-green);
}
.scholarship-title {
	font-family: 'Outfit', sans-serif;
	font-size: 1rem;
	font-weight: 700;
	color: var(--brand-navy);
	line-height: 1.4;
}
.scholarship-provider {
	font-size: 0.84rem;
	color: var(--text-secondary);
}
.scholarship-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: auto;
	padding-top: 0.75rem;
	border-top: 1px solid var(--border-subtle);
	font-size: 0.76rem;
	color: var(--text-muted);
}
.scholarship-deadline {
	font-weight: 500;
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
   AI STRATEGY TRUST SECTION
   ═══════════════════════════════════════ */
.section-ai-strategy {
	background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #fff7ed 100%);
	padding: 5rem 1.5rem;
	border-top: 1px solid #fed7aa;
	border-bottom: 1px solid #fed7aa;
}
.ai-strategy-card {
	display: grid;
	grid-template-columns: 1.15fr 0.85fr;
	gap: 3.5rem;
	align-items: center;
	max-width: 1080px;
	margin: 0 auto;
}
.ai-strategy-left {
	display: flex;
	flex-direction: column;
}
.ai-strategy-desc {
	color: var(--text-secondary);
	font-size: 1.05rem;
	line-height: 1.7;
	margin: 0 0 1.5rem;
}
.ai-strategy-features {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-bottom: 2rem;
}
.ai-feature-item {
	display: flex;
	align-items: flex-start;
	gap: 0.875rem;
}
.ai-feature-icon {
	width: 2.25rem;
	height: 2.25rem;
	border-radius: 10px;
	background: white;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
	flex-shrink: 0;
}
.ai-feature-text strong {
	display: block;
	font-weight: 700;
	color: #0f172a;
	font-size: 0.95rem;
	margin-bottom: 0.15rem;
}
.ai-feature-text p {
	margin: 0;
	color: #64748b;
	font-size: 0.85rem;
	line-height: 1.45;
}
.ai-strategy-actions {
	display: flex;
	gap: 1rem;
	align-items: center;
	flex-wrap: wrap;
}
.btn-strategy-sample {
	padding: 0.85rem 1.5rem;
	border-radius: 14px;
	font-weight: 600;
	font-size: 0.95rem;
	cursor: pointer;
	border: 1px solid var(--border-subtle);
	background: white;
	color: var(--brand-navy);
	transition: all 0.2s ease;
}
.btn-strategy-sample:hover {
	border-color: var(--brand-orange);
	color: var(--brand-orange);
}
.btn-strategy-browse {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	text-decoration: none;
}
.ai-strategy-footer {
	margin-top: 1.25rem;
}
.ai-strategy-footnote {
	font-size: 0.8rem;
	color: #94a3b8;
	margin: 0.25rem 0 0;
}
.ai-strategy-right {
	display: flex;
	justify-content: center;
}

/* Strategy preview card */
.strategy-preview-card {
	background: #0f172a;
	border-radius: 1.25rem;
	padding: 1.5rem;
	color: white;
	width: 100%;
	max-width: 380px;
	box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
	position: relative;
	box-sizing: border-box;
}
.sp-header {
	margin-bottom: 1.25rem;
	padding-bottom: 1.25rem;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.sp-badge {
	font-size: 0.65rem;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: #f97316;
	background: rgba(249, 115, 22, 0.15);
	padding: 0.2rem 0.6rem;
	border-radius: 99px;
	display: inline-block;
	margin-bottom: 0.5rem;
}
.sp-scholarship {
	font-size: 1rem;
	font-weight: 700;
	margin-bottom: 0.25rem;
	line-height: 1.35;
}
.sp-value {
	font-size: 0.8rem;
	color: #34d399;
	font-weight: 600;
}
.sp-rubric {
	margin-bottom: 1.25rem;
}
.sp-rubric-title {
	font-size: 0.7rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: #94a3b8;
	margin-bottom: 0.625rem;
}
.sp-rubric-row {
	display: flex;
	align-items: center;
	gap: 0.625rem;
	font-size: 0.8rem;
	color: #cbd5e1;
	margin-bottom: 0.5rem;
}
.sp-badge-low {
	font-size: 0.65rem;
	font-weight: 700;
	background: #fecaca;
	color: #991b1b;
	padding: 0.15rem 0.45rem;
	border-radius: 99px;
	white-space: nowrap;
}
.sp-badge-missing {
	font-size: 0.65rem;
	font-weight: 700;
	background: #e2e8f0;
	color: #475569;
	padding: 0.15rem 0.45rem;
	border-radius: 99px;
	white-space: nowrap;
}
.sp-badge-med {
	font-size: 0.65rem;
	font-weight: 700;
	background: #fde68a;
	color: #92400e;
	padding: 0.15rem 0.45rem;
	border-radius: 99px;
	white-space: nowrap;
}
.sp-action {
	background: rgba(255, 255, 255, 0.05);
	border-radius: 0.75rem;
	padding: 1rem;
	margin-bottom: 1rem;
}
.sp-action-title {
	font-size: 0.7rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: #94a3b8;
	margin-bottom: 0.625rem;
}
.sp-step {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.8rem;
	color: #e2e8f0;
	margin-bottom: 0.375rem;
}
.sp-step-num {
	width: 1.25rem;
	height: 1.25rem;
	border-radius: 50%;
	background: #f97316;
	color: white;
	font-size: 0.65rem;
	font-weight: 800;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.sp-cost {
	font-size: 0.75rem;
	color: #64748b;
	text-align: center;
	padding-top: 0.75rem;
	border-top: 1px solid rgba(255, 255, 255, 0.08);
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

/* ═══════════════════════════════════════
   FOUNDER & MISSION SECTION
   ═══════════════════════════════════════ */
.section-founder {
	position: relative;
	padding: 6rem 1.5rem;
	background: #0c1120;
	overflow: hidden;
}
/* Ambient glow orbs mirroring the hero */
.founder-glow {
	position: absolute;
	border-radius: 50%;
	filter: blur(80px);
	pointer-events: none;
	z-index: 0;
}
.founder-glow-orange {
	width: 500px;
	height: 500px;
	background: #f97316;
	top: -80px;
	right: -60px;
	opacity: 0.10;
}
.founder-glow-blue {
	width: 600px;
	height: 600px;
	background: #3b82f6;
	bottom: -120px;
	left: -120px;
	opacity: 0.08;
}
/* Eyebrow label */
.founder-eyebrow-row {
	display: flex;
	justify-content: center;
	margin-bottom: 2.5rem;
}
.founder-eyebrow-pill {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.4rem 1rem;
	background: rgba(249, 115, 22, 0.12);
	border: 1px solid rgba(249, 115, 22, 0.3);
	color: #fb923c;
	font-size: 0.78rem;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	border-radius: 9999px;
}
/* Two-column grid */
.founder-card-container {
	display: grid;
	grid-template-columns: 300px 1fr;
	gap: 4rem;
	align-items: center;
}
/* Left — photo */
.founder-image-col {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.25rem;
}
.founder-ring {
	position: absolute;
	border-radius: 50%;
	border: 1px solid rgba(249, 115, 22, 0.15);
	pointer-events: none;
}
.founder-ring-1 {
	width: 340px;
	height: 340px;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
.founder-ring-2 {
	width: 400px;
	height: 400px;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	border-color: rgba(249, 115, 22, 0.07);
}
.founder-image-wrapper {
	position: relative;
	width: 260px;
	height: 300px;
	border-radius: 9999px;
	overflow: hidden;
	border: 4px solid rgba(249, 115, 22, 0.4);
	box-shadow: 0 0 0 8px rgba(249, 115, 22, 0.08), 0 20px 50px -10px rgba(0, 0, 0, 0.5);
	background: #1e293b;
	flex-shrink: 0;
}
.founder-portrait {
	width: 100%;
	height: 100%;
	display: block;
	object-fit: cover;
	object-position: top center;
}
.founder-chip {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	background: rgba(255, 255, 255, 0.06);
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 9999px;
	padding: 0.55rem 1rem;
	backdrop-filter: blur(8px);
	text-align: left;
}
.founder-chip-dot {
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: #10b981;
	box-shadow: 0 0 0 3px rgba(16,185,129,0.25);
	flex-shrink: 0;
}
.founder-chip-name {
	font-size: 0.82rem;
	font-weight: 800;
	color: #f1f5f9;
	margin: 0;
	line-height: 1.2;
}
.founder-chip-title {
	font-size: 0.68rem;
	color: #94a3b8;
	margin: 0;
	line-height: 1.2;
}
/* Right — content */
.founder-content-col {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	text-align: left;
}
.founder-heading {
	font-family: 'Outfit', sans-serif;
	font-size: clamp(1.5rem, 2.4vw, 2.1rem);
	font-weight: 800;
	color: #f1f5f9;
	line-height: 1.25;
	margin-bottom: 1.25rem;
	letter-spacing: -0.02em;
}
.founder-heading-accent {
	color: #fb923c;
}
.founder-letter {
	font-size: 0.94rem;
	color: #94a3b8;
	line-height: 1.75;
	display: flex;
	flex-direction: column;
	gap: 0.85rem;
	margin-bottom: 1.75rem;
}
.founder-letter strong {
	color: #e2e8f0;
	font-weight: 700;
}
.founder-highlights-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 0.6rem 1.5rem;
	margin-bottom: 2rem;
	font-size: 0.84rem;
	font-weight: 600;
	color: #cbd5e1;
}
.founder-highlight-item {
	display: flex;
	align-items: center;
	gap: 0.45rem;
}
.founder-actions-row {
	display: flex;
	align-items: center;
	gap: 1rem;
	flex-wrap: wrap;
}
.founder-btn-primary {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	padding: 0.8rem 1.6rem;
	background: #f97316;
	color: #ffffff;
	font-weight: 700;
	font-size: 0.88rem;
	border-radius: 9999px;
	text-decoration: none;
	box-shadow: 0 4px 16px rgba(249, 115, 22, 0.35);
	transition: all 0.2s ease;
}
.founder-btn-primary:hover {
	background: #ea580c;
	transform: translateY(-1px);
	box-shadow: 0 6px 20px rgba(249, 115, 22, 0.45);
}
.founder-btn-ghost {
	display: inline-flex;
	align-items: center;
	gap: 0.45rem;
	padding: 0.8rem 1.4rem;
	background: transparent;
	color: #94a3b8;
	border: 1px solid rgba(255,255,255,0.12);
	font-weight: 600;
	font-size: 0.88rem;
	border-radius: 9999px;
	text-decoration: none;
	transition: all 0.2s ease;
}
.founder-btn-ghost:hover {
	border-color: rgba(255,255,255,0.28);
	color: #e2e8f0;
	transform: translateY(-1px);
}

@media (max-width: 900px) {
	.founder-card-container {
		grid-template-columns: 1fr;
		gap: 3rem;
	}
	.founder-image-wrapper {
		width: 220px;
		height: 255px;
	}
	.founder-ring-1 { width: 280px; height: 280px; }
	.founder-ring-2 { width: 340px; height: 340px; }
	.founder-heading { font-size: 1.55rem; }
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
