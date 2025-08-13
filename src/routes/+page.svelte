<script lang="ts">
  import { goto } from '$app/navigation';
  import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';

  let { data } = $props();
  let { session, supabase } = $derived(data);
  let prefersReducedMotion = false;
  let activityItems: Array<{ message: string; ts: string; type: string }> = $state([]);
  let activityIdx = $state(0);
  let activityTimer: any = null;
  let activityLoading = $state(true);
  let recentScholarships: Array<{ id: string; title: string; location?: string; deadline?: string; created_at?: string }> = $state([]);
  let scholarshipIdx = $state(0);
  let scholarshipTimer: any = null;
  let scrollProgress = $state(0);
  
  let showAuthModal = $state(false);
  let openFAQ = $state<number | null>(1); // First FAQ open by default
  let pendingDashboardRedirect = $state(false);

  function toggleFAQ(index: number) {
    openFAQ = openFAQ === index ? null : index;
  }

  function scrollToSection(sectionId: string) {
    if (typeof document !== 'undefined') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  function showSignup() {
    showAuthModal = true;
  }

  function handleManageApplications() {
    if (session) {
      goto('/dashboard');
    } else {
      pendingDashboardRedirect = true;
      showAuthModal = true;
    }
  }

  function handleAuthSuccess() {
    if (pendingDashboardRedirect) {
      pendingDashboardRedirect = false;
      goto('/dashboard');
    }
  }

  function animateCounters() {
    try {
      const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-counter]'));
      if (elements.length === 0) return;
      const start = performance.now();
      const duration = 1000;
      const formatter = (num: number, el: HTMLElement) => {
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const useComma = el.dataset.comma === '1';
        const value = useComma ? Math.floor(num).toLocaleString() : Math.floor(num).toString();
        el.textContent = `${prefix}${value}${suffix}`;
      };
      const targets = elements.map((el) => ({ el, target: Number(el.dataset.counter || '0') }));
      targets.forEach(({ el }) => { el.textContent = '0'; });
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        targets.forEach(({ el, target }) => { formatter(target * eased, el); });
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {}
  }

  // Observer disabled for now to rule out any visibility race
  function observeAndAnimate() { /* no-op */ }

  function initialRevealAboveFold() {
    try {
      const vh = window.innerHeight || 800;
      document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < vh * 0.95) {
          el.classList.add('revealed');
        }
      });
    } catch {}
  }

  async function loadRecentActivity() {
    try {
      const res = await fetch('/api/recent-activity');
      if (!res.ok) return;
      const json = await res.json();
      activityItems = json.items || [];
      if (activityTimer) clearInterval(activityTimer);
      if (activityItems.length > 0) {
        activityIdx = 0;
        activityTimer = setInterval(() => {
          activityIdx = (activityIdx + 1) % activityItems.length;
        }, 6000);
      }
    } catch {}
    activityLoading = false;
  }

  async function loadRecentScholarships() {
    try {
      const { data, error } = await supabase
        .from('public_scholarships_decoded')
        .select('id, title, location, deadline, created_at, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) {
        recentScholarships = data as any;
        if (scholarshipTimer) clearInterval(scholarshipTimer);
        // No rotation UI (compact pill), so no timer needed
      }
    } catch {}
  }

  function relTime(iso?: string): string {
    if (!iso) return '';
    const diff = Math.max(0, Date.now() - new Date(iso).getTime());
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }
  function recentScholarshipsAdded(hours = 24): number {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return recentScholarships.filter(s => s.created_at && new Date(s.created_at).getTime() >= cutoff).length;
  }

  function startFadeOnView() {
    try {
      const observer = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('fade-up');
            (e.target as HTMLElement).classList.add('drawn');
            observer.unobserve(e.target);
          }
        }
      }, { threshold: 0.08 });
      document.querySelectorAll('[data-fade], [data-draw]').forEach((el) => observer.observe(el));
    } catch {}
  }

  $effect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.add('js');
      prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      // Immediately reveal hero and anything above the fold
      initialRevealAboveFold();
      // Force hero visible regardless of observer timing
      const hero = document.getElementById('hero');
      if (hero) hero.classList.add('revealed');
      // Observer disabled; rely on default visible content
      loadRecentActivity();
      loadRecentScholarships();
      startFadeOnView();
      if (!prefersReducedMotion) animateCounters();

      const updateProgress = () => {
        const h = document.documentElement;
        const max = (h.scrollHeight - h.clientHeight) || 1;
        scrollProgress = Math.max(0, Math.min(1, window.scrollY / max));
      };
      window.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();
    }
  });
</script>

<style>
  /* Default: visible for SSR/no-JS. When JS boots, we add .js to <html> and then animate */
  .reveal { opacity: 1; transform: none; transition: opacity 300ms ease, transform 300ms ease; }
  /* Disable hide-on-load to avoid any flicker; we only add subtle transition */
  :global(html.js) .reveal { opacity: 1; transform: none; }
  /* Revealed state (new class) */
  :global(.revealed) { opacity: 1; transform: none; }
  /* Ensure hero never hides due to reveal class */
  #hero { opacity: 1 !important; transform: none !important; }
  /* Non-blocking enhancements */
  .fade-up { animation: fadeUp 420ms ease forwards; }
  @keyframes fadeUp { from { transform: translateY(6px); opacity: 0.98; } to { transform: none; opacity: 1; } }
  .grad-animate { background-size: 200% 200%; animation: gradShift 6s ease infinite; }
  @keyframes gradShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  /* Journey line: base is always visible; animated overlay draws in */
  .line-base, .line-anim { position: absolute; left: 0; right: 0; height: 6px; border-radius: 9999px; }
  .line-base { background: linear-gradient(90deg, #93c5fd, #86efac, #c4b5fd); opacity: 0.7; }
  .line-anim { background: linear-gradient(90deg, #93c5fd, #86efac, #c4b5fd); width: 0%; opacity: 1; transition: width 800ms ease; }
  :global(.drawn) .line-anim { width: 100%; }
  @media (prefers-reduced-motion: reduce) {
    .reveal, :global(html.js) .reveal { opacity: 1; transform: none; transition: none; }
    .fade-up, .grad-animate { animation: none; }
  }
  /* Scroll progress bar */
  .progress-bar { position: fixed; top: 0; left: 0; height: 3px; background: linear-gradient(90deg,#3b82f6,#a855f7); z-index: 9999; transform-origin: 0 0; }
  /* Button/Card hovers */
  .hover-elevate { transition: transform 160ms ease, box-shadow 160ms ease; }
  .hover-elevate:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(2, 6, 23, 0.12); }
  /* .link-underline declared when needed */
</style>
<svelte:head>
  <title>Abroaducate - Your Complete Academic Application Platform</title>
  <meta name="description" content="Generate SOPs, cover letters, track applications, find scholarships, and optimize your academic journey with AI-powered tools." />
</svelte:head>

<div class="bg-white">
  <!-- Scroll progress (purely visual) -->
  <div class="progress-bar" style={`width:${scrollProgress*100}%;`}></div>
  <!-- Hero Section -->
  <section id="hero" class="pt-20 pb-16 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center reveal">
        <!-- Journey-Focused Headline -->
        <h1 class="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Your Complete<br/>
          <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent grad-animate">
            Academic Journey
          </span><br/>
          Starts Here
        </h1>
        
        <!-- Value-Focused Subheading -->
        <p class="text-xl md:text-2xl text-blue-100 mb-4 max-w-4xl mx-auto leading-relaxed">
          From exploration to acceptance - get comprehensive guidance, AI-powered tools, 
          and expert support for every step of your international education journey.
        </p>

        <!-- Subtle Value Hint -->
        <p class="text-lg text-blue-200 mb-10 max-w-2xl mx-auto">
          Professional-grade platform trusted by thousands of students worldwide
        </p>

        <!-- Journey-Oriented CTAs -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          {#if session}
            <a href="/dashboard" data-sveltekit-prefetch class="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 shadow-lg hover-elevate">
              Continue Your Journey
            </a>
          {:else}
            <button 
              onclick={showSignup}
              class="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 shadow-lg hover-elevate"
            >
              Start Your Journey - Free
            </button>
          {/if}
          
          <button 
            onclick={() => scrollToSection('journey-map')}
            class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-900 transition duration-300 hover-elevate"
          >
            See How It Works
          </button>
        </div>

        <!-- Enhanced Stats with Value Emphasis -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mt-6">
          <div class="reveal fade-up">
            <div class="text-3xl font-bold text-white" data-counter="50" data-suffix="+">50+</div>
            <div class="text-blue-200">Features Built & Ready</div>
          </div>
          <div class="reveal fade-up" style="animation-delay:80ms">
            <div class="text-3xl font-bold text-white" data-counter="7000" data-suffix="+" data-comma="1">7,000+</div>
            <div class="text-blue-200">Universities Worldwide</div>
          </div>
          <div class="reveal fade-up" style="animation-delay:160ms">
            <div class="text-3xl font-bold text-white" data-counter="95" data-suffix="%">95%</div>
            <div class="text-blue-200">Application Success Rate</div>
          </div>
          <div class="reveal fade-up" style="animation-delay:240ms">
            <div class="text-3xl font-bold text-white">24hrs</div>
            <div class="text-blue-200">From Signup to First Document</div>
          </div>
        </div>

        <!-- Real recent activity ticker (genuine) -->
        <div class="mt-8 mx-auto max-w-2xl bg-white/10 rounded-lg px-4 py-3 text-blue-100 text-sm reveal" aria-live="polite">
          <div class="flex items-center gap-3 flex-wrap" data-fade>
            {#if activityLoading}
              <div class="flex items-center gap-2 w-full">
                <span class="inline-block w-5 h-5 rounded-full bg-white/20 animate-pulse"></span>
                <span class="flex-1 h-3 bg-white/20 rounded animate-pulse"></span>
              </div>
            {:else if activityItems.length > 0}
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-400 text-white text-[10px]">•</span>
                <span>{activityItems[activityIdx].message}</span>
              </div>
            {:else}
              <div class="text-blue-200">Exploring universities, generating documents, and starting trials…</div>
            {/if}
            {#if recentScholarships.length > 0}
              <span class="opacity-60">|</span>
              <div class="flex items-center gap-2 text-[12px] text-blue-100/90">
                <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-400 text-white text-[9px]">★</span>
                <span class="font-medium">{recentScholarshipsAdded(24)}</span>
                <span>scholarships added in the last 24h</span>
                <a href="/scholarships" data-sveltekit-prefetch class="underline hover:no-underline text-blue-50">View</a>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Journey Map Section -->
  <section id="journey-map" class="py-20 bg-gradient-to-b from-gray-50 to-white" data-fade>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16" data-fade>
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Your Academic Journey, Simplified
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Follow our proven 5-stage process used by thousands of successful international students
        </p>
      </div>

      <!-- Journey Timeline -->
      <div class="relative" data-fade>
        <!-- Connection Line - static base + animated overlay (always visible, plus subtle draw) -->
        <div class="hidden lg:block absolute z-0" style="top: 40px; left: 10%; right: 10%;" data-draw>
          <div class="line-base"></div>
          <div class="line-anim"></div>
        </div>
        
        <!-- Journey Stages -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">
          <!-- Stage 1: Start Journey -->
          <div class="text-center group" data-fade>
            <div class="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-700 transition duration-300 shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Start Journey</h3>
            <p class="text-sm text-gray-600 mb-3">Explore options & analyze your profile</p>
            <ul class="text-xs text-gray-500 space-y-1">
              <li>• Academic Profile Analysis</li>
              <li>• GPA Conversion</li>
              <li>• University Matching</li>
            </ul>
          </div>

          <!-- Stage 2: Prepare Docs -->
          <div class="text-center group" data-fade>
            <div class="mx-auto w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-700 transition duration-300 shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Prepare Docs</h3>
            <p class="text-sm text-gray-600 mb-3">Create perfect application documents</p>
            <ul class="text-xs text-gray-500 space-y-1">
              <li>• AI-Powered SOPs</li>
              <li>• Professional CVs</li>
              <li>• Cover Letters</li>
            </ul>
          </div>

          <!-- Stage 3: Find Funding -->
          <div class="text-center group" data-fade>
            <div class="mx-auto w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-yellow-700 transition duration-300 shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Find Funding</h3>
            <p class="text-sm text-gray-600 mb-3">Discover scholarships & financial aid</p>
            <ul class="text-xs text-gray-500 space-y-1">
              <li>• Scholarship Matching</li>
              <li>• Funding Tracker</li>
              <li>• Financial Planning</li>
          </ul>
        </div>

          <!-- Stage 4: Submit Apps -->
          <div class="text-center group" data-fade>
            <div class="mx-auto w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-700 transition duration-300 shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">Submit Apps</h3>
            <p class="text-sm text-gray-600 mb-3">Manage deadlines & track progress</p>
            <ul class="text-xs text-gray-500 space-y-1">
              <li>• Application Dashboard</li>
              <li>• Deadline Tracking</li>
              <li>• Professor Outreach</li>
            </ul>
          </div>

          <!-- Stage 5: Next Steps -->
          <div class="text-center group" data-fade>
            <div class="mx-auto w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-700 transition duration-300 shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">Next Steps</h3>
            <p class="text-sm text-gray-600 mb-3">Prepare for acceptance & beyond</p>
            <ul class="text-xs text-gray-500 space-y-1">
              <li>• Visa Interview Prep</li>
              <li>• Document Review</li>
              <li>• Success Planning</li>
            </ul>
          </div>
        </div>

        <!-- Journey CTA -->
        <div class="text-center mt-12">
          <p class="text-lg text-gray-600 mb-6">
            Join thousands of students who have successfully navigated this journey
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            {#if session}
          <a href="/academic-analyzer" data-sveltekit-prefetch class="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 hover-elevate">
                Start with Profile Analysis
              </a>
            {:else}
              <button 
                onclick={showSignup}
                class="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 hover-elevate"
              >
                Begin Your Journey Today
              </button>
            {/if}
            <button 
              onclick={() => scrollToSection('features')}
              class="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition duration-300 hover-elevate"
            >
              Explore All Features
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Journey-Based Features Section -->
  <section id="features" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16" data-fade>
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Complete Tools for Every Journey Stage
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive support from exploration to acceptance - everything you need at each step of your journey
        </p>
      </div>

      <!-- Journey Stage Features -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <!-- Stage 1: Start Journey -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-blue-200" data-fade>
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Start Your Journey</h3>
              <p class="text-blue-700 font-medium">Exploration & Planning</p>
            </div>
          </div>
          <p class="text-gray-700 mb-6">
            Begin with comprehensive analysis and smart university matching to set the foundation for your success.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg border border-blue-200">
              <h4 class="font-semibold text-gray-900 mb-2">Academic Profile Analyzer</h4>
              <p class="text-sm text-gray-600">AI-powered assessment of your academic strengths</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-blue-200">
              <h4 class="font-semibold text-gray-900 mb-2">GPA Converter</h4>
              <p class="text-sm text-gray-600">40+ international grading systems supported</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-blue-200">
              <h4 class="font-semibold text-gray-900 mb-2">University Matching</h4>
              <p class="text-sm text-gray-600">Smart matching from 7,000+ universities</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-blue-200">
              <h4 class="font-semibold text-gray-900 mb-2">Program Research</h4>
              <p class="text-sm text-gray-600">Detailed program information & requirements</p>
            </div>
          </div>
          <a href="/academic-analyzer" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-300 inline-block">
            Start Analysis →
          </a>
        </div>

        <!-- Stage 2: Prepare Documents -->
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-green-200" data-fade>
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Prepare Your Documents</h3>
              <p class="text-green-700 font-medium">AI-Powered Document Generation</p>
            </div>
          </div>
          <p class="text-gray-700 mb-6">
            Create compelling application documents with AI assistance and professional templates.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg border border-green-200">
              <h4 class="font-semibold text-gray-900 mb-2">Statement of Purpose</h4>
              <p class="text-sm text-gray-600">4 types with AI enhancement & review</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-green-200">
              <h4 class="font-semibold text-gray-900 mb-2">Academic CV Builder</h4>
              <p class="text-sm text-gray-600">6 subject-specific professional templates</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-green-200">
              <h4 class="font-semibold text-gray-900 mb-2">Cover Letters</h4>
              <p class="text-sm text-gray-600">Professional & academic templates</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-green-200">
              <h4 class="font-semibold text-gray-900 mb-2">AI Enhancement Suite</h4>
              <p class="text-sm text-gray-600">Grammar, style, plagiarism & optimization</p>
            </div>
          </div>
          <a href="/sop" data-sveltekit-prefetch class="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition duration-300 inline-block hover-elevate">
            Start Creating →
          </a>
        </div>

        <!-- Stage 3: Find Funding -->
        <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-yellow-200" data-fade>
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Find Funding</h3>
              <p class="text-yellow-700 font-medium">Scholarships & Financial Aid</p>
            </div>
          </div>
          <p class="text-gray-700 mb-6">
            Discover funding opportunities with AI-powered matching and comprehensive scholarship database.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg border border-yellow-200">
              <h4 class="font-semibold text-gray-900 mb-2">Scholarship Matching</h4>
              <p class="text-sm text-gray-600">AI-powered matching with eligibility analysis</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-yellow-200">
              <h4 class="font-semibold text-gray-900 mb-2">Graduate Funding</h4>
              <p class="text-sm text-gray-600">Research positions & funding opportunities</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-yellow-200">
              <h4 class="font-semibold text-gray-900 mb-2">Application Tracking</h4>
              <p class="text-sm text-gray-600">Track multiple scholarship applications</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-yellow-200">
              <h4 class="font-semibold text-gray-900 mb-2">Financial Planning</h4>
              <p class="text-sm text-gray-600">Cost analysis & funding strategy</p>
            </div>
          </div>
          <a href="/scholarships" data-sveltekit-prefetch class="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition duration-300 inline-block hover-elevate">
            Find Scholarships →
          </a>
        </div>

        <!-- Stage 4: Submit Applications -->
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-purple-200" data-fade>
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Submit Applications</h3>
              <p class="text-purple-700 font-medium">Application Management</p>
            </div>
          </div>
          <p class="text-gray-700 mb-6">
            Manage deadlines, track progress, and communicate effectively with universities.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg border border-purple-200">
              <h4 class="font-semibold text-gray-900 mb-2">Application Dashboard</h4>
              <p class="text-sm text-gray-600">Centralized tracking & status updates</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-purple-200">
              <h4 class="font-semibold text-gray-900 mb-2">Cold Email Generator</h4>
              <p class="text-sm text-gray-600">Professional professor outreach</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-purple-200">
              <h4 class="font-semibold text-gray-900 mb-2">Deadline Management</h4>
              <p class="text-sm text-gray-600">Automated reminders & notifications</p>
            </div>
          </div>
          <button
            class="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition duration-300 inline-block hover-elevate"
            onclick={handleManageApplications}
          >
            Manage Applications →
          </button>
        </div>

        <!-- Stage 5: Next Steps -->
        <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-indigo-200 lg:col-span-2" data-fade>
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Next Steps</h3>
              <p class="text-indigo-700 font-medium">Post-Application Success</p>
            </div>
          </div>
          <p class="text-gray-700 mb-6">
            Prepare for interviews, visa applications, and your journey to acceptance and beyond.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 class="font-semibold text-gray-900 mb-2">Visa Interview Prep</h4>
              <p class="text-sm text-gray-600">AI-powered F-1 visa interview practice</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 class="font-semibold text-gray-900 mb-2">Document Review</h4>
              <p class="text-sm text-gray-600">Final review before submission</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 class="font-semibold text-gray-900 mb-2">Text Enhancement</h4>
              <p class="text-sm text-gray-600">Last-minute document improvements</p>
            </div>
            <div class="bg-white p-4 rounded-lg border border-indigo-200">
              <h4 class="font-semibold text-gray-900 mb-2">Success Planning</h4>
              <p class="text-sm text-gray-600">Pre-departure & next steps guidance</p>
            </div>
          </div>
          <a href="/visa-interview-practice" data-sveltekit-prefetch class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition duration-300 inline-block hover-elevate">
            Prepare for Success →
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Combined Why + Built For Students -->
  <section class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12" data-fade>
        <h2 class="text-4xl font-bold text-gray-900 mb-4">Why Abroaducate</h2>
        <p class="text-lg text-gray-600 max-w-3xl mx-auto">All-in-one platform for your applications: plan smarter, write better, and stay on track—without paying agency prices.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100" data-fade>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Comprehensive tools</h3>
          <p class="text-gray-600 text-sm">University match, GPA conversion, SOP/CV/letters, scholarship search, deadline tracking, visa practice, built to work together.</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100" data-fade>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Fair, student‑friendly pricing</h3>
          <p class="text-gray-600 text-sm">Start free. Professional trial available. Upgrade only when you’re getting value, no lock‑in, cancel anytime.</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100" data-fade>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Built for students</h3>
          <p class="text-gray-600 text-sm">Designed with accessibility and speed in mind. Private by default. Your work stays yours.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Platform Foundation & Innovation -->
  <section class="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Built for Students, By Students
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Our foundation, innovation, and commitment to making world-class education accessible to everyone
        </p>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        
        <!-- Mission & Foundation -->
        <div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Our Mission</h3>
              <p class="text-blue-700 font-medium">Making Excellence Accessible</p>
            </div>
          </div>
          <div class="space-y-4 text-gray-700">
            <p>
              <strong>We believe every student deserves access to world-class academic guidance.</strong> Traditional consultants charge $500-$3,000+ for services that should be accessible to all students, regardless of financial background.
            </p>
            <p>
              That's why we built Abroaducate - to provide comprehensive, AI-powered academic application support at a fraction of traditional costs, without compromising on quality or features.
            </p>
                         <div class="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-6">
               <h4 class="font-semibold text-blue-900 mb-2">Our Approach</h4>
               <p class="text-blue-800 text-sm">
                 We're building something revolutionary from the ground up, focusing on comprehensive features and student success rather than marketing gimmicks. Quality and accessibility drive everything we do.
               </p>
             </div>
          </div>
        </div>

        <!-- Technical Innovation -->
        <div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mr-4">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">Technical Innovation</h3>
              <p class="text-purple-700 font-medium">Cutting-Edge AI Platform</p>
            </div>
          </div>
          <div class="space-y-4 text-gray-700">
            <p>
              <strong>Advanced AI Architecture:</strong> We leverage multiple GPT models (3.5-turbo, 4o-mini, 4o) to provide tier-appropriate AI assistance that rivals expensive human consultants.
            </p>
            <p>
              <strong>Comprehensive Integration:</strong> From university APIs to scholarship databases, we've built connections to provide real-time, accurate information across your entire application journey.
            </p>
                         <div class="grid grid-cols-2 gap-4 mt-6">
               <div class="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                 <div class="text-2xl font-bold text-purple-600">24/7</div>
                 <div class="text-xs text-purple-700">AI Availability</div>
               </div>
               <div class="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                 <div class="text-2xl font-bold text-purple-600">6</div>
                 <div class="text-xs text-purple-700">AI Models Integrated</div>
               </div>
             </div>
          </div>
        </div>
      </div>

      <!-- Platform Capabilities Showcase -->
      <div class="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-16">
        <div class="text-center mb-8">
          <h3 class="text-3xl font-bold text-gray-900 mb-4">What We've Built</h3>
          <p class="text-lg text-gray-600">A comprehensive platform that's ready to support your entire academic journey</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <div class="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div class="text-3xl font-bold text-blue-600 mb-2">7,000+</div>
            <div class="text-sm text-gray-700 font-medium">Universities</div>
            <div class="text-xs text-gray-500">US, UK, Canada, Australia</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <div class="text-3xl font-bold text-green-600 mb-2">40+</div>
            <div class="text-sm text-gray-700 font-medium">Grading Systems</div>
            <div class="text-xs text-gray-500">International GPA conversion</div>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div class="text-3xl font-bold text-yellow-600 mb-2">6</div>
            <div class="text-sm text-gray-700 font-medium">AI Tools Suite</div>
            <div class="text-xs text-gray-500">Review, enhance, optimize</div>
          </div>
          <div class="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div class="text-3xl font-bold text-purple-600 mb-2">80+</div>
            <div class="text-sm text-gray-700 font-medium">Visa Questions</div>
            <div class="text-xs text-gray-500">F-1 interview practice</div>
          </div>
          <div class="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <div class="text-3xl font-bold text-indigo-600 mb-2">4</div>
            <div class="text-sm text-gray-700 font-medium">Document Types</div>
            <div class="text-xs text-gray-500">SOPs, CVs, Cover Letters</div>
          </div>
          <div class="text-center p-4 bg-rose-50 rounded-xl border border-rose-200">
            <div class="text-3xl font-bold text-rose-600 mb-2">∞</div>
            <div class="text-sm text-gray-700 font-medium">Scholarships</div>
            <div class="text-xs text-gray-500">Continuously updated</div>
          </div>
        </div>
      </div>

      
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="py-20 bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h2>
        <p class="text-xl text-gray-600">
          Everything you need to know about starting your academic journey with Abroaducate
        </p>
      </div>

      <div class="space-y-8">
        {#each [
          {
            question: "Is Abroaducate really free to start?",
            answer: "Yes! Our Academic Starter plan is completely free and includes 4 documents per month, AI features, university matching, and more. You can create your first SOP, cover letter, or academic CV without paying anything. Upgrade only when you need more features."
          },
          {
            question: "How does Abroaducate compare to traditional consultants?",
            answer: "Traditional consultants charge $500-$3,000+ and often provide limited, one-time services. Abroaducate offers comprehensive, always-available AI assistance starting at $12/month. You get 24/7 access to advanced AI tools, unlimited revisions, and support for your entire application journey - not just one document."
          },
          {
            question: "Which countries and universities do you support?",
            answer: "We support 7,000+ universities across the US, UK, Canada, and Australia. Our database includes Ivy League schools, Russell Group universities, and top institutions worldwide. We also support 40+ international grading systems for accurate GPA conversion from any country."
          },
          {
            question: "What AI models do you use and how good are they?",
            answer: "We use multiple GPT models including GPT-3.5-turbo, GPT-4o-mini, and GPT-4o depending on your subscription tier. Our AI is specifically trained for academic writing and understands the nuances of different document types, application requirements, and academic fields."
          },
          {
            question: "You mentioned you're new - should I trust you with my applications?",
            answer: "We're transparent about being new because we believe in honesty. However, we've spent 12+ months building 50+ features before launching. Our platform is comprehensive and production-ready. Plus, with our free tier, you can test everything risk-free before upgrading."
          },
          {
            question: "What's your \"Pay-As-We-Grow\" promise?",
            answer: "As our platform grows and we add more features, your usage limits automatically increase at no extra cost. You're locking in today's prices while getting more value over time. We're starting conservative to ensure quality, but your benefits expand as we scale."
          },
          {
            question: "Can I cancel anytime? Are there long-term commitments?",
            answer: "Absolutely! You can cancel anytime with no penalties or long-term commitments. We offer both monthly and annual plans (annual saves 20%), but you're never locked in. Your data remains accessible even after cancellation."
          },
          {
            question: "How quickly can I get my first document ready?",
            answer: "Most students have their first document ready within 24 hours of signup. Our AI can generate a complete SOP or cover letter in minutes, then you can refine it using our enhancement tools. The speed depends on how much information you provide and your revision preferences."
          }
        ] as faq, index}
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <button 
              class="w-full text-left focus:outline-none" 
              onclick={() => toggleFAQ(index + 1)}
            >
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">{faq.question}</h3>
                <svg 
                  class="w-5 h-5 text-gray-500 transform transition-transform {openFAQ === index + 1 ? 'rotate-180' : ''}" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>
            </button>
            {#if openFAQ === index + 1}
              <div class="mt-4 text-gray-600">
                <p>{faq.answer}</p>
            </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- FAQ CTA -->
      <div class="text-center mt-16">
        <div class="bg-blue-50 rounded-xl p-8 border border-blue-200">
          <h3 class="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h3>
          <p class="text-gray-600 mb-6">
            We're here to help! Start with our free tier to explore the platform, or reach out to our support team.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            {#if session}
              <a href="/dashboard" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300">
                Explore Your Dashboard
              </a>
            {:else}
              <button 
                onclick={showSignup}
                class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
              >
                Try Free Today
              </button>
            {/if}
            <a href="/contact" class="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition duration-300">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-20 bg-gradient-to-r from-blue-600 to-indigo-700" data-fade>
    <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
      <h2 class="text-4xl font-bold text-white mb-6">
        Ready to Start Your Academic Journey?
      </h2>
      <p class="text-xl text-blue-100 mb-8">
        Join thousands of students who've successfully used Abroaducate for their applications
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        {#if session}
          <a href="/dashboard" class="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 shadow-lg">
            Go to Your Dashboard
          </a>
        {:else}
          <button 
            onclick={showSignup}
            class="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 shadow-lg"
          >
            Create Account - Free
          </button>
          
          <a href="/pricing" data-sveltekit-prefetch class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition duration-300">
            View Pricing
          </a>
        {/if}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div class="flex items-center space-x-3 mb-4">
            <img src="/logo-icon.svg" alt="Abroaducate" class="w-8 h-8" />
            <h3 class="text-xl font-bold">Abroaducate</h3>
          </div>
          <p class="text-gray-400 mb-4">
            Your complete academic application platform powered by AI
          </p>
        </div>
        
        <div>
          <h4 class="font-semibold mb-4">Platform</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="/sop" class="hover:text-white transition duration-300">SOP Generator</a></li>    
            <li><a href="/universities" class="hover:text-white transition duration-300">University Search</a></li>
            <li><a href="/scholarships" class="hover:text-white transition duration-300">Scholarships</a></li>
            <li><a href="/test-prep" class="hover:text-white transition duration-300">Test Prep</a></li>
            <li><a href="/academic-cv" class="hover:text-white transition duration-300">Academic CV</a></li>
            <li class="text-gray-500 text-sm italic">... and more</li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold mb-4">Tools & Support</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="/gpa-converter" class="hover:text-white transition duration-300">GPA Converter</a></li>
            <li><a href="/visa-interview-practice" class="hover:text-white transition duration-300">Visa Interview</a></li>
            <li><a href="/pricing" class="hover:text-white transition duration-300">Pricing</a></li>
            <li><a href="/contact" class="hover:text-white transition duration-300">Contact Support</a></li>
            <li><button 
  class="hover:text-white transition duration-300 bg-transparent border-none p-0 cursor-pointer" 
  onclick={handleManageApplications}
>
  Dashboard
</button></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold mb-4">Connect & Follow</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="/privacy" class="hover:text-white transition duration-300 font-medium">Privacy Policy</a></li>
            <li><a href="/terms" class="hover:text-white transition duration-300 font-medium">Terms of Service</a></li>
            <li><a href="/cookies" class="hover:text-white transition duration-300 font-medium">Cookie Policy</a></li>
            <li class="pt-2">
              <p class="text-sm text-gray-400 mb-2">Join our community:</p>
              <div class="flex flex-wrap gap-2">
                <a href="https://twitter.com/abroaducate" target="_blank" class="text-gray-400 hover:text-blue-400 transition duration-300" title="Twitter" aria-label="Follow us on Twitter">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                                <a href="https://linkedin.com/company/abroaducate" target="_blank" class="text-gray-400 hover:text-blue-500 transition duration-300" title="LinkedIn" aria-label="Follow us on LinkedIn">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>     
                  </svg>
                </a>
                <a href="https://facebook.com/abroaducate" target="_blank" class="text-gray-400 hover:text-blue-600 transition duration-300" title="Facebook" aria-label="Follow us on Facebook">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>   
                  </svg>
                </a>
                <a href="https://instagram.com/abroaducate" target="_blank" class="text-gray-400 hover:text-pink-500 transition duration-300" title="Instagram" aria-label="Follow us on Instagram">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.988 11.988 11.988 6.62 0 11.987-5.367 11.987-11.988C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.317C4.25 14.81 3.76 13.659 3.76 12.362c0-1.297.49-2.448 1.366-3.323.875-.827 2.026-1.317 3.323-1.317 1.297 0 2.448.49 3.323 1.317.875.875 1.366 2.026 1.366 3.323 0 1.297-.491 2.449-1.366 3.326-.875.827-2.026 1.317-3.323 1.317zm7.83-9.456h-1.24V6.194h1.24v1.338zm-2.574 5.831c0 .827-.336 1.587-.931 2.134-.595.547-1.353.83-2.134.83-.781 0-1.539-.283-2.134-.83-.595-.547-.931-1.307-.931-2.134 0-.827.336-1.587.931-2.134.595-.547 1.353-.83 2.134-.83.781 0 1.539.283 2.134.83.595.547.931 1.307.931 2.134z"/>
                  </svg>
                </a>
                <a href="https://youtube.com/@saheedkolawole" target="_blank" class="text-gray-400 hover:text-red-500 transition duration-300" title="YouTube" aria-label="Subscribe to our YouTube channel">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                <a href="mailto:support@abroaducate.com" class="text-gray-400 hover:text-green-500 transition duration-300" title="Email Support" aria-label="Contact us via email">
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z"/>
                    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z"/>
                  </svg>
                </a>
              </div>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- Legal Disclaimer -->
      <div class="mt-8 p-4 bg-gray-800 rounded-lg">
        <p class="text-gray-400 text-xs leading-relaxed">
          <strong>Disclaimer:</strong> Abroaducate provides AI-powered tools to help you create better application documents. 
          While our platform assists with structure and content improvement, you are responsible for ensuring all information 
          is accurate and truthful. We do not guarantee admission to any institution or scholarship award. Please review 
          your target institution's policies regarding AI assistance in applications.
        </p>
      </div>
      
      <div class="border-t border-gray-800 mt-6 pt-8">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <p class="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Abroaducate. All rights reserved.
          </p>
          <div class="flex items-center space-x-6 mt-4 md:mt-0">
            <span class="text-gray-400 text-sm">
              Made with ❤️ for students worldwide
            </span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</div>

<!-- Authentication Modal -->
<AuthenticationFlow 
  bind:show={showAuthModal} 
  {supabase} 
  mode="signup" 
  returnUrl="/dashboard"
/>
