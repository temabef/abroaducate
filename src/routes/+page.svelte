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
BookOpen
} from 'lucide-svelte';
import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';

let { data } = $props();
let { supabase, session } = $derived(data);

// Finder bar state
let finderField = $state('');
let finderDestination = $state('');

// Auth modal state
let showAuth = $state(false);
let authMode = $state<'login' | 'signup'>('signup');

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
if (finderField.trim()) params.set('field', finderField.trim());
if (finderDestination.trim()) params.set('destination', finderDestination.trim());
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
		<h1 class="hero-title">
			Study in Europe<br />
			<span class="hero-highlight">without breaking the bank</span>
		</h1>
		<p class="hero-sub">
			Discover 2,500+ affordable programs across 9 European countries. Get matched with scholarships and generate application documents with AI.
		</p>

		<!-- Finder Bar -->
		<div class="finder-bar">
			<div class="finder-field">
				<BookOpen size={18} />
				<input
					type="text"
					placeholder="Field of study (e.g. Computer Science)"
					bind:value={finderField}
					onkeydown={(e) => { if (e.key === 'Enter') goToPrograms(); }}
				/>
			</div>
			<div class="finder-divider"></div>
			<div class="finder-field">
				<Landmark size={18} />
				<input
					type="text"
					placeholder="Destination (e.g. Germany)"
					bind:value={finderDestination}
					onkeydown={(e) => { if (e.key === 'Enter') goToPrograms(); }}
				/>
			</div>
			<button class="finder-btn" onclick={goToPrograms}>
				Search programs <ChevronRight size={16} />
			</button>
		</div>

		<!-- CTAs -->
		<div class="hero-actions">
			<button class="btn-cta-primary" onclick={openSignup}>
				Start Exploring Free <ChevronRight size={16} />
			</button>
			<a href="#how-it-works" class="btn-ghost">See how it works</a>
		</div>

		<!-- Trust line -->
		<p class="hero-trust">No credit card required &middot; 3 free credits on signup &middot; 2,500+ programs</p>
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
		<span class="eyebrow">THE PROBLEM</span>
		<h2 class="section-heading">Studying abroad shouldn't cost your future</h2>
		<div class="problem-grid">
			<div class="problem-card">
				<div class="problem-icon-wrap"><Wallet size={24} /></div>
				<h3>Hidden costs everywhere</h3>
				<p>Tuition-free doesn't mean cost-free. Living costs, semester fees, and application fees add up fast with no transparency.</p>
			</div>
			<div class="problem-card">
				<div class="problem-icon-wrap"><Target size={24} /></div>
				<h3>Generic advice wastes your time</h3>
				<p>Every student's profile is different. Cookie-cutter guidance leads to mismatched programs and rejected applications.</p>
			</div>
			<div class="problem-card">
				<div class="problem-icon-wrap"><Route size={24} /></div>
				<h3>No clear path to submission</h3>
				<p>Between finding programs, matching scholarships, and writing documents — there's no single workflow that ties it together.</p>
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
						Generate SOP with AI
					</div>
					<div class="mockup-action">
						<span class="mockup-action-dot"></span>
						Review scholarship strategy
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
					<li><CheckCircle2 size={20} /> <span>Generate tailored SOPs, cover letters, and CVs</span></li>
					<li><CheckCircle2 size={20} /> <span>Track deadlines and application progress</span></li>
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
				<p>Search by field, country, and budget. See tuition, living costs, and language requirements upfront.</p>
			</div>
			<div class="step-connector"></div>
			<div class="step-card">
				<div class="step-number-wrap"><span class="step-number">02</span></div>
				<h3>See matched scholarships</h3>
				<p>Our engine matches you with relevant funding opportunities based on your profile and chosen programs.</p>
			</div>
			<div class="step-connector"></div>
			<div class="step-card">
				<div class="step-number-wrap"><span class="step-number">03</span></div>
				<h3>Get your strategy</h3>
				<p>Generate AI-powered application documents and receive a personalized action plan for each program.</p>
			</div>
		</div>
	</div>
</section>

<!-- ═══ VIDEO SECTION ═══ -->
<section class="section-video" use:fadeUpOnScroll>
	<div class="section-inner">
		<span class="eyebrow eyebrow-on-dark">SEE IT IN ACTION</span>
		<h2 class="section-heading section-heading-light" style="white-space: nowrap;">From finding a program to matching scholarships in under 2 minutes</h2>
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
						<span class="proof-stat-val">9</span>
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

<!-- ═══ FINAL CTA ═══ -->
<section class="section-final-cta" use:fadeUpOnScroll>
	<div class="section-inner">
		<h2 class="final-cta-title">Ready to find your affordable path?</h2>
		<p class="final-cta-sub">Join thousands of students discovering tuition-free and low-cost programs across Europe.</p>
		<button class="btn-cta-orange" onclick={openSignup}>
			Start Discovering <ChevronRight size={18} />
		</button>
		<p class="final-cta-note">Start exploring for free &middot; 3 credits on signup &middot; Pay-as-you-go after that.</p>
	</div>
</section>

<!-- Auth Modal -->
<AuthenticationFlow bind:show={showAuth} {supabase} mode={authMode} returnUrl="/dashboard" />

<style>
/* ═══════════════════════════════════════
   HERO — Light background with radial glows
   ═══════════════════════════════════════ */
.hero {
	position: relative;
	background: #ffffff;
	padding: 8rem 1.5rem 5rem;
	text-align: center;
	overflow: hidden;
}
.hero-glow {
	position: absolute;
	border-radius: 50%;
	filter: blur(120px);
	opacity: 0.35;
	pointer-events: none;
}
.hero-glow-orange {
	width: 500px;
	height: 500px;
	background: #f97316;
	top: -100px;
	right: -100px;
	opacity: 0.12;
}
.hero-glow-blue {
	width: 600px;
	height: 600px;
	background: #3b82f6;
	bottom: -150px;
	left: -150px;
	opacity: 0.08;
}
.hero-inner {
	position: relative;
	z-index: 1;
	max-width: 760px;
	margin: 0 auto;
}
.hero-title {
	font-family: 'Outfit', sans-serif;
	font-size: clamp(2.8rem, 6vw, 4.2rem);
	font-weight: 800;
	line-height: 1.1;
	color: var(--brand-navy);
	margin-bottom: 1.5rem;
	letter-spacing: -0.03em;
}
.hero-highlight {
	background: linear-gradient(135deg, #f97316, #f59e0b);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}
.hero-sub {
	font-size: 1.15rem;
	color: var(--text-secondary);
	line-height: 1.75;
	max-width: 580px;
	margin: 0 auto 2.5rem;
}

/* Finder Bar — pill-shaped white card */
.finder-bar {
	display: flex;
	align-items: center;
	background: #ffffff;
	border: 1px solid var(--border-subtle);
	border-radius: 100px;
	padding: 0.4rem 0.5rem 0.4rem 1.25rem;
	box-shadow: 0 4px 24px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04);
	max-width: 640px;
	margin: 0 auto 2.5rem;
}
.finder-field {
	flex: 1;
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.6rem 0.5rem;
	color: var(--text-muted);
}
.finder-field input {
	border: none;
	outline: none;
	background: transparent;
	font-size: 0.92rem;
	width: 100%;
	color: var(--text-primary);
}
.finder-field input::placeholder {
	color: var(--text-muted);
}
.finder-divider {
	width: 1px;
	height: 28px;
	background: var(--border-subtle);
	flex-shrink: 0;
}
.finder-btn {
	display: flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.75rem 1.5rem;
	background: var(--brand-orange);
	color: white;
	border: none;
	border-radius: 100px;
	font-weight: 600;
	font-size: 0.9rem;
	white-space: nowrap;
	transition: background 0.2s, transform 0.15s;
}
.finder-btn:hover {
	background: var(--brand-orange-hover);
	transform: translateY(-1px);
}

/* Hero Actions */
.hero-actions {
	display: flex;
	gap: 1.5rem;
	justify-content: center;
	align-items: center;
	flex-wrap: wrap;
	margin-bottom: 1.75rem;
}
.btn-cta-primary {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.9rem 1.85rem;
	background: var(--brand-navy);
	color: white;
	border: none;
	border-radius: 14px;
	font-weight: 600;
	font-size: 1rem;
	text-decoration: none;
	transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
}
.btn-cta-primary:hover {
	background: #1e293b;
	transform: translateY(-2px);
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
}
.btn-cta-navy {
	background: var(--brand-navy);
}
.btn-cta-navy:hover {
	background: #1e293b;
}
.btn-ghost {
	color: var(--text-secondary);
	font-weight: 500;
	font-size: 0.95rem;
	text-decoration: none;
	transition: color 0.2s;
}
.btn-ghost:hover {
	color: var(--brand-navy);
}
.hero-trust {
	font-size: 0.82rem;
	color: var(--text-muted);
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
}
.proof-layout {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 3rem;
	align-items: stretch;
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
}
@media (max-width: 768px) {
	.hero {
		padding: 5rem 1rem 3.5rem;
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
	.solution-layout {
		grid-template-columns: 1fr;
	}
	.strategy-mockup {
		order: 2;
	}
	.solution-copy {
		order: 1;
	}
	.proof-layout {
		grid-template-columns: 1fr;
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
}
</style>
