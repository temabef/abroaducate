<script lang="ts">
  import { 
		CalendarDays,
		Search,
		TrendingUp,
		Star,
		RefreshCw
	} from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
  import CompactUpgradeModal from '$lib/components/CompactUpgradeModal.svelte';
  import { formatCurrencyAmount, formatScholarshipText, decodeHtmlEntities } from '$lib/utils/htmlEntities';
  import { subscriptionState } from '$lib/stores/subscription';
  import { loadQuickProfile, gpaMidpoint, type QuickProfile } from '$lib/services/quickProfile';
  import StrategyDocumentLinker from '$lib/components/StrategyDocumentLinker.svelte';
  import ScholarshipStrategy from '$lib/components/ScholarshipStrategy.svelte';
  
  let { data } = $props();
  let { session, scholarship, supabase } = $derived(data);
  let userDocuments = $derived((data as any).userDocuments || []);
  // Compute saved status from SSR data when present
  let isSaved = $state<boolean>(Boolean((data as any).savedStatus));
  // Related scholarships provided by SSR when available
  let relatedScholarships = $state<any[]>((data as any).relatedScholarships || []);
  
  let isLoading = $state(false); // Data is loaded on the server
  let error = $state('');
  let isApplied = $state(false);

  type PlaybookStep = { title: string; description: string };
  let playbookRouteType = $state<string>('Direct scholarship application');
  let playbookSteps = $state<PlaybookStep[]>([]);
  
  // Paid gating + lightweight personalization
  let showBillingModal = $state(false);
  let aiWinStrategy = $state<any>((data as any).userStrategy || (data as any).winStrategy || null);
  // isPremium is $state (not $derived) so it can be upgraded by the subscription store.
  // It is initialized from SSR data so a returning-user always sees their strategy immediately.
  // IMPORTANT: isPremium may only ever go false → true, never true → false.
  let isPremium = $state<boolean>(!!((data as any).userStrategy || (data as any).winStrategy));
  let quickProfile = $state<QuickProfile | null>(null);
  let quickProfileSource = $state<'remote' | 'local' | 'none'>('none');
  let aiStrategyLoading = $state(false);
  let aiStrategyError = $state<string | null>(null);
  let generationPhase = $state('');

  let showStrategyLinker = $state(false);
  let strategyTargetDocument = $state<{ docId?: string, type?: string, text?: string | null, name?: string | null } | null>(null);
  let strategyActiveTab = $state<'overview' | 'audit' | 'action'>('overview');

  function initiateStrategyGeneration() {
    if (!session?.user?.id) {
      authMode = 'login';
      showAuthModal = true;
      return;
    }
    if (userDocuments && userDocuments.length === 1) {
      processStrategyGeneration({ docId: userDocuments[0].id, type: userDocuments[0].type, name: userDocuments[0].program_name || 'My Document' });
    } else {
      showStrategyLinker = true;
    }
  }

  function processStrategyGeneration(info: { docId?: string, type?: string, text?: string | null, name?: string | null }) {
    strategyTargetDocument = info;
    generateAIWinStrategy();
  }

  const LOADING_PHASES = [
    "Analyzing your academic footprint...",
    "Identifying targeted narrative angles...",
    "Finalizing your personal Clarity Report..."
  ];

  function cyclePhases() {
    let i = 0;
    generationPhase = LOADING_PHASES[0];
    const interval = setInterval(() => {
      if (!aiStrategyLoading) {
        clearInterval(interval);
        return;
      }
      i = (i + 1) % LOADING_PHASES.length;
      generationPhase = LOADING_PHASES[i];
    }, 2000);
  }

  type RubricKey = 'leadership_impact' | 'academics' | 'research_fit' | 'need_based' | 'regional_targeting' | 'essay_story';
  type RubricItem = { key: RubricKey; label: string; weight: 0 | 1 | 2 | 3; reason: string };
  type EligibilityCheck = { label: string; status: 'pass' | 'fail' | 'unknown'; detail?: string };

  function normText(s: any): string {
    return String(s ?? '').toLowerCase();
  }

  function combinedScholarshipText(s: any): string {
    return [
      s?.title,
      s?.provider,
      s?.description,
      s?.position_details,
      s?.funding_category,
      s?.application_method,
      s?.field,
      s?.level,
      s?.location
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  function clampWeight(n: number): 0 | 1 | 2 | 3 {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    if (n === 2) return 2;
    return 3;
  }

  function inferRubric(s: any): RubricItem[] {
    const txt = combinedScholarshipText(s);
    const cat = normText(s?.funding_category);
    const method = normText(s?.application_method);

    let leadership = 0;
    let academics = 1; // most scholarships always care a bit
    let research = 0;
    let need = 0;
    let regional = 0;
    let essay = 1;

    // Research/RA signals
    if (cat.includes('advertised position') || txt.includes('research') || txt.includes('lab') || txt.includes('supervisor') || txt.includes('professor')) {
      research += 2;
      academics += 1;
      essay += 1;
    }

    // Leadership / impact signals
    if (
      txt.includes('leadership') ||
      txt.includes('community') ||
      txt.includes('impact') ||
      txt.includes('ngo') ||
      txt.includes('volunteer') ||
      txt.includes('entrepreneur') ||
      txt.includes('social') ||
      txt.includes('change')
    ) {
      leadership += 2;
      essay += 1;
    }

    // Merit/grades/test signals
    if (txt.includes('merit') || txt.includes('gpa') || txt.includes('academic excellence') || txt.includes('grades') || txt.includes('toefl') || txt.includes('ielts')) {
      academics += 2;
    }

    // Need-based signals
    if (txt.includes('need-based') || txt.includes('financial need') || txt.includes('low-income') || txt.includes('proof of income') || txt.includes('socioeconomic')) {
      need += 2;
      essay += 1;
    }

    // Regional targeting signals
    if (txt.includes('africa') || txt.includes('nigeria') || txt.includes('ghana') || txt.includes('kenya') || txt.includes('asia') || txt.includes('south asia') || txt.includes('latin') || txt.includes('middle east')) {
      regional += 2;
    }
    if (Array.isArray(s?.nationality_restrictions) && s.nationality_restrictions.length > 0) {
      regional += 2;
    }

    // Application method signals
    if (method.includes('nomination')) {
      leadership += 1;
      essay += 1;
    }
    if (cat.includes('graduate program')) {
      academics += 1;
      research += 1;
    }

    const items: RubricItem[] = [
      { key: 'leadership_impact', label: 'Leadership & impact', weight: clampWeight(leadership), reason: leadership >= 2 ? 'Signals in the description suggest they reward leadership/impact.' : 'Less emphasis unless the prompt asks for impact.' },
      { key: 'academics', label: 'Academic strength', weight: clampWeight(academics), reason: academics >= 3 ? 'Merit/grades/tests are likely a major factor here.' : 'Most scholarships still expect solid academics.' },
      { key: 'research_fit', label: 'Research / fit', weight: clampWeight(research), reason: research >= 2 ? 'This looks like program/research-fit driven funding.' : 'Fit matters more for research/RA scholarships.' },
      { key: 'need_based', label: 'Financial need', weight: clampWeight(need), reason: need >= 2 ? 'Need-based language suggests finances matter.' : 'Only relevant if they explicitly mention need.' },
      { key: 'regional_targeting', label: 'Region targeting', weight: clampWeight(regional), reason: regional >= 2 ? 'Eligibility appears region/nationality-targeted.' : 'Eligibility may be broader.' },
      { key: 'essay_story', label: 'Essay & positioning', weight: clampWeight(essay), reason: essay >= 2 ? 'Essays/letters likely influence selection heavily.' : 'A clear story still improves odds.' }
    ];

    // Sort by highest weight first for readability
    return items.sort((a, b) => b.weight - a.weight);
  }

  function eligibilityGate(s: any, qp: QuickProfile | null): EligibilityCheck[] {
    const checks: EligibilityCheck[] = [];

    // Degree level (soft check; scholarships have inconsistent level strings)
    const scholarshipLevel = normText(s?.level);
    const userLevel = qp?.degree_level ? normText(qp.degree_level) : '';
    let levelStatus: EligibilityCheck['status'] = 'unknown';
    if (!qp?.degree_level || !s?.level) levelStatus = 'unknown';
    else if (scholarshipLevel.includes('all') || scholarshipLevel.includes('graduate')) levelStatus = 'pass';
    else if (scholarshipLevel.includes(userLevel)) levelStatus = 'pass';
    else levelStatus = 'unknown';
    checks.push({
      label: 'Degree level fit',
      status: levelStatus,
      detail: qp?.degree_level ? `You: ${qp.degree_level}` : 'Add your quick profile to check'
    });

    // Country/location
    const loc = normText(s?.location);
    let countryStatus: EligibilityCheck['status'] = 'unknown';
    if (qp?.preferred_countries?.length && loc) {
      countryStatus = qp.preferred_countries.some((c) => loc.includes(String(c).toLowerCase())) ? 'pass' : 'unknown';
    }
    checks.push({
      label: 'Country / region fit',
      status: countryStatus,
      detail: qp?.preferred_countries?.length ? `You: ${qp.preferred_countries.join(', ')}` : 'Add preferred countries to check'
    });

    // Field
    const field = normText(s?.field);
    let fieldStatus: EligibilityCheck['status'] = 'unknown';
    if (qp?.field_of_study && field) {
      const u = normText(qp.field_of_study);
      if (field.includes('all') || field.includes(u) || u.includes(field)) fieldStatus = 'pass';
      else fieldStatus = 'unknown';
    }
    checks.push({
      label: 'Field fit',
      status: fieldStatus,
      detail: qp?.field_of_study ? `You: ${qp.field_of_study}` : 'Add your field to check'
    });

    // GPA
    if (typeof s?.min_gpa === 'number') {
      if (!qp?.gpa_range) {
        checks.push({ label: 'Minimum GPA', status: 'unknown', detail: `Min GPA: ${s.min_gpa}` });
      } else {
        const userGpa = gpaMidpoint(qp.gpa_range);
        checks.push({
          label: 'Minimum GPA',
          status: userGpa >= s.min_gpa ? 'pass' : 'fail',
          detail: `Min: ${s.min_gpa} • You (est): ${userGpa}`
        });
      }
    } else {
      checks.push({ label: 'Minimum GPA', status: 'unknown', detail: 'Not specified' });
    }

    return checks;
  }

  function buildWinPlan(rubric: RubricItem[], s: any): { topActions: string[]; evidence: string[]; redFlags: string[] } {
    const top = rubric.slice(0, 3);
    const topKeys = new Set(top.map((r) => r.key));

    const topActions: string[] = [];
    const evidence: string[] = [];
    const redFlags: string[] = [];

    if (topKeys.has('leadership_impact')) {
      topActions.push('Pick 1 impact story and quantify it (people helped, money raised, programs delivered, outcomes).');
      evidence.push('Impact proof: photos, links, reports, letters from beneficiaries/partners.');
      redFlags.push('Vague “I like helping people” with no measurable outcomes.');
    }
    if (topKeys.has('academics')) {
      topActions.push('Highlight your strongest academic signals: GPA context, class rank (if any), awards, toughest courses.');
      evidence.push('Transcript highlights, awards, publications (if any), standardized test scores (if required).');
      redFlags.push('Ignoring minimum requirements (GPA/test) or submitting incomplete academic documents.');
    }
    if (topKeys.has('research_fit')) {
      topActions.push('Write a tight “fit paragraph”: your interest → what you’ve done → why this program/lab → what you’ll do next.');
      evidence.push('Research proof: project writeups, GitHub, posters, publications, supervisor recommendation.');
      redFlags.push('Generic SOP not aligned to the program/research theme.');
    }
    if (topKeys.has('need_based')) {
      topActions.push('Prepare a clear need narrative: constraints → resilience → why funding changes your trajectory.');
      evidence.push('Proof of income/expenses if requested; short budget outline; supporting documents.');
      redFlags.push('Contradicting yourself (claiming need but presenting luxury spending or unclear finances).');
    }
    if (topKeys.has('regional_targeting')) {
      topActions.push('Confirm nationality/region rules early and align your story to the scholarship’s regional mission.');
      evidence.push('Passport/ID and any eligibility documents needed for region-targeted programs.');
      redFlags.push('Applying despite explicit nationality restrictions.');
    }
    if (topKeys.has('essay_story')) {
      topActions.push('Answer the prompt with structure: context → action → result → reflection → future goal.');
      evidence.push('Draft, feedback, and a final proofread; reference letters that confirm your claims.');
      redFlags.push('Generic essay, no proof, and missing alignment to scholarship values.');
    }

    // Scholarship-specific small nudges
    if (String(s?.application_method || '').toLowerCase().includes('email')) {
      topActions.push('Send a targeted email: 5–7 sentences + 2 attachments (CV + transcript) + 1 clear ask.');
    }
    if (s?.deadline) {
      topActions.push('Work backwards from the deadline: draft in 7 days, get feedback in 3 days, submit early.');
    }

    return {
      topActions: topActions.slice(0, 6),
      evidence: evidence.slice(0, 6),
      redFlags: redFlags.slice(0, 5)
    };
  }

  function weightToLabel(w: 0 | 1 | 2 | 3): string {
    if (w === 3) return 'High';
    if (w === 2) return 'Medium';
    if (w === 1) return 'Low';
    return 'Not a focus';
  }

  function weightToWidth(w: 0 | 1 | 2 | 3): string {
    if (w === 3) return '100%';
    if (w === 2) return '70%';
    if (w === 1) return '40%';
    return '12%';
  }

  let winRubric = $derived(inferRubric(scholarship));
  let winEligibility = $derived(eligibilityGate(scholarship, quickProfile));
  let winPlan = $derived(buildWinPlan(winRubric, scholarship));

  async function generateAIWinStrategy(): Promise<void> {
    if (!session?.user?.id) {
      authMode = 'login';
      showAuthModal = true;
      return;
    }

    // 1. Check for cached strategy in the data provided by SSR or local profile
    if (aiWinStrategy) return; // Already loaded

    // 2. Force profile if missing (necessary for personalized strategy)


    aiStrategyLoading = true;
    aiStrategyError = null;
    cyclePhases();

    try {
      const payload = { 
        scholarshipId: scholarship.id,
        documentId: strategyTargetDocument?.docId,
        documentType: strategyTargetDocument?.type,
        documentText: strategyTargetDocument?.text,
        documentName: strategyTargetDocument?.name
      };

      const res = await fetch('/api/scholarship-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (j?.error === 'Insufficient credits' || j?.error === 'Insufficient credits or billing error') {
             showBillingModal = true;
             return;
        }
        throw new Error(j?.message || j?.error || `Failed to generate (${res.status})`);
      }
      aiWinStrategy = j?.strategy || null;
      
    } catch (e: any) {
      aiStrategyError = e?.message || 'Failed to generate win strategy. Please try again.';
    } finally {
      aiStrategyLoading = false;
    }
  }

  function computeRouteType(s: any): string {
    const method = String(s?.application_method || '').toLowerCase();
    const cat = String(s?.funding_category || '').toLowerCase();

    if (cat.includes('advertised position')) return 'Advertised position (RA/PhD posting)';
    if (cat.includes('graduate program')) {
      if (s?.has_automatic_funding) return 'Apply to program (automatic funding consideration)';
      return 'Apply to program (funding may be separate)';
    }
    if (method.includes('nomination')) return 'Nomination-based';
    if (method.includes('university') || method.includes('admission')) return 'University admission = funding consideration';
    if (method.includes('email')) return 'Direct application via email';
    return 'Direct scholarship application';
  }

  function computeSteps(s: any): PlaybookStep[] {
    const route = computeRouteType(s);

    if (route.startsWith('Advertised position')) {
      return [
        { title: 'Read the position details', description: 'Confirm the role, eligibility, and what the professor expects.' },
        { title: 'Prepare your documents', description: 'Academic CV + transcripts. If requested, add a short research statement or proposal.' },
        { title: 'Send a targeted email', description: 'Write a short email that matches the professor’s research and the position requirements.' },
        { title: 'Attach and submit', description: 'Attach your CV/transcript (and any requested docs) and send to the listed contact.' },
        { title: 'Follow up', description: 'If no reply, follow up after 7–10 days with a short, polite reminder.' }
      ];
    }

    if (route.startsWith('Apply to program')) {
      return [
        { title: 'Find the official program page', description: 'Confirm deadline, required tests, and required documents.' },
        { title: 'Prepare core documents', description: 'SOP, CV, transcripts, and recommendation letters (if required).' },
        { title: 'Apply to the university/program', description: 'Submit your admission application before the program deadline.' },
        { title: 'Confirm funding process', description: 'Some programs automatically consider you; others require a separate funding form.' },
        { title: 'Track and respond', description: 'Monitor email/portal for interview requests, missing documents, or additional steps.' }
      ];
    }

    if (route === 'Nomination-based') {
      return [
        { title: 'Confirm nomination rules', description: 'Check who can nominate you (university, government, employer) and the internal deadline.' },
        { title: 'Prepare nomination packet', description: 'Gather required forms, CV, transcripts, and essays for the nominating body.' },
        { title: 'Submit for nomination', description: 'Submit to the nominating body before their internal deadline.' },
        { title: 'Complete external application', description: 'If nominated, finish the scholarship’s external steps quickly.' },
        { title: 'Track and follow up', description: 'Monitor email for nomination confirmation and next steps.' }
      ];
    }

    // Default: direct scholarship application
    return [
      { title: 'Confirm eligibility', description: 'Check GPA, country, degree level, and any restrictions before you invest time.' },
      { title: 'Gather required documents', description: 'Prepare transcripts, CV, SOP/personal statement, and references (as required).' },
      { title: 'Answer the prompts', description: 'Complete all questions/essays using the scholarship’s exact prompt and word limits.' },
      { title: 'Submit before the deadline', description: 'Submit early to avoid portal issues and missing documents.' },
      { title: 'Track your application', description: 'Save this scholarship and track status and deadlines in Applications.' }
    ];
  }

  // Keep playbook derived from current scholarship (runes mode)
  $effect(() => {
    if (!scholarship) return;
    playbookRouteType = computeRouteType(scholarship);
    playbookSteps = computeSteps(scholarship);
  });

  // Whenever aiWinStrategy becomes available (e.g. after a successful Reveal), unlock the UI.
  // This is the single source of truth for the locked/unlocked state.
  $effect(() => {
    if (aiWinStrategy) isPremium = true;
  });

  // Get the scholarship ID from the URL parameter
  // Data is loaded on the server via +page.server.ts; avoid overriding it here to prevent double-fetch/mismatch
  onMount(() => {
    // Subscription state: only UPGRADE isPremium to true for paid-plan users.
    // Never force it back to false — that would hide an already-revealed strategy.
    const unsub = subscriptionState.subscribe((s) => {
      if (s?.loaded === true && s.isPremium === true) {
        isPremium = true;
      }
    });

    // Quick profile (anonymous allowed: localStorage fallback)
    (async () => {
      try {
        const qp = await loadQuickProfile(supabase, session);
        quickProfile = qp.profile;
        quickProfileSource = qp.source;
      } catch {}
    })();

    return () => unsub();
  });
  
  async function loadScholarship(id: string) {
    // Keep for potential refresh actions; prefer decoded view when fetching directly
    try {
      isLoading = true;
      error = '';
      const { data: scholarshipData, error: scholarshipError } = await supabase
        .from('public_scholarships_decoded')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (scholarshipError) {
        error = 'Failed to load scholarship details.';
        isLoading = false;
        return;
      }
      if (!scholarshipData) {
        error = `Scholarship with ID ${id} was not found.`;
        isLoading = false;
        return;
      }
      scholarship = scholarshipData as any;
      if (scholarship.field && scholarship.level) {
        loadRelatedScholarships(scholarship.field, scholarship.level);
      }
      if (session && session.user && session.user.id) {
        const { data: interactionData } = await supabase
          .from('user_scholarship_interactions')
          .select('is_saved')
          .eq('user_id', session.user.id)
          .eq('scholarship_id', id)
          .maybeSingle();
        isSaved = interactionData?.is_saved || false;
      }
      isLoading = false;
    } catch (err) {
      error = 'An unexpected error occurred while loading the scholarship.';
      isLoading = false;
    }
  }
  
  async function loadRelatedScholarships(field: string, level: string) {
    try {
      // Fetch related scholarships (same field and level)
      const { data: relatedData } = await supabase
        .from('scholarships')
        .select('*')
        .eq('is_active', true)
        .or(`field.eq.${field},field.eq.All Fields`)
        .eq('level', level)
        .limit(3);
        
      relatedScholarships = relatedData || [];
    } catch (err) {
      console.error('Error loading related scholarships:', err);
    }
  }
  
  async function toggleSaved() {
    if (!session?.user?.id) {
      // Instead of alert, show login modal and store intended scholarship
      pendingSaveScholarshipId = scholarship.id;
      authMode = 'login';
      showAuthModal = true;
      return;
    }
    
    try {
      console.log(`Toggling saved state for scholarship ${scholarship.id}, current state: ${isSaved}`);
      
      // Check if interaction exists
      const { data: existing, error: fetchError } = await supabase
        .from('user_scholarship_interactions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('scholarship_id', scholarship.id)
        .single();
      
      // Handle fetch error differently from "not found"
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking interaction:', fetchError);
        throw fetchError;
      }
      
      let result;
      if (existing) {
        // Update existing interaction
        result = await supabase
          .from('user_scholarship_interactions')
          .update({ is_saved: !isSaved })
          .eq('id', existing.id);
      } else {
        // Create new interaction
        result = await supabase
          .from('user_scholarship_interactions')
          .insert({
            user_id: session.user.id,
            scholarship_id: scholarship.id,
            is_saved: true,
            is_applied: false
          });
      }
      
      if (result.error) {
        console.error('Error updating interaction:', result.error);
        throw result.error;
      }
      
      // Update local state
      isSaved = !isSaved;
      console.log('Scholarship saved state updated successfully:', isSaved);
      
    } catch (err) {
      console.error('Error saving scholarship:', err);
      alert('Failed to update. Please try again.');
    }
  }
  
  async function toggleApplied() {
    if (!session?.user?.id) {
      alert('Please log in to track applications');
      return;
    }
    
    try {
      // Check if interaction exists
      const { data: existing } = await supabase
        .from('user_scholarship_interactions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('scholarship_id', scholarship.id)
        .single();
      
      if (existing) {
        // Update existing interaction
        await supabase
          .from('user_scholarship_interactions')
          .update({ 
            is_applied: !isApplied,
            is_saved: true // Always save when applied
          })
          .eq('id', existing.id);
      } else {
        // Create new interaction
        await supabase
          .from('user_scholarship_interactions')
          .insert({
            user_id: session.user.id,
            scholarship_id: scholarship.id,
            is_saved: true,
            is_applied: true
          });
      }
      
      // Update local state
      isApplied = !isApplied;
      if (isApplied) isSaved = true;
      
      // If applying, open the website in a new tab if available
      if (isApplied && scholarship.website) {
        window.open(scholarship.website, '_blank');
      }
      
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Failed to update. Please try again.');
    }
  }
  
  function formatDeadline(deadline: string) {
    try {
      const date = new Date(deadline);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return deadline; // Return as-is if parsing fails
    }
  }
  
  function getDeadlineStatus(deadline: string) {
    try {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return { text: 'Expired', class: 'bg-red-100 text-red-800' };
      if (diffDays <= 7) return { text: `${diffDays} day${diffDays === 1 ? '' : 's'} left`, class: 'bg-red-100 text-red-800' };
      if (diffDays <= 30) return { text: `${diffDays} days left`, class: 'bg-yellow-100 text-yellow-800' };
      return { text: `${diffDays} days left`, class: 'bg-green-100 text-green-800' };
    } catch (e) {
      return { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };
    }
  }

  let showAuthModal = $state(false);
  let pendingSaveScholarshipId = $state<string | null>(null);
  let authMode = $state<'login' | 'signup'>('login');
  let pendingApplicationsRedirect = $state(false);

  function handleApplicationTracker() {
    if (session) {
      goto('/applications');
    } else {
      pendingApplicationsRedirect = true;
      authMode = 'login';
      showAuthModal = true;
    }
  }

  function handleAuthSuccess() {
    if (pendingSaveScholarshipId) {
      saveScholarshipAfterLogin(pendingSaveScholarshipId);
      pendingSaveScholarshipId = null;
    } else if (pendingApplicationsRedirect) {
      pendingApplicationsRedirect = false;
      goto('/applications');
    }
  }

  async function saveScholarshipAfterLogin(scholarshipId: string) {
    // Save the scholarship for the now-logged-in user
    try {
      // Check if interaction exists
      if (!session || !session.user || !session.user.id) {
        throw new Error('Not authenticated');
      }
      const { data: existing, error: fetchError } = await supabase
        .from('user_scholarship_interactions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('scholarship_id', scholarshipId)
        .single();
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      let result;
      if (existing) {
        result = await supabase
          .from('user_scholarship_interactions')
          .update({ is_saved: true })
          .eq('id', existing.id);
      } else {
        result = await supabase
          .from('user_scholarship_interactions')
          .insert({
            user_id: session.user.id,
            scholarship_id: scholarshipId,
            is_saved: true,
            is_applied: false
          });
      }
      if (result.error) {
        throw result.error;
      }
      // Redirect to saved scholarships page
      goto('/scholarships/my-applications');
    } catch (err) {
      alert('Failed to save scholarship after login. Please try again.');
    }
  }
</script>

<svelte:head>
  <title>{decodeHtmlEntities(scholarship.title)} - Scholarship Details</title>
  <meta name="description" content="{decodeHtmlEntities(scholarship.description)}" />
</svelte:head>

<div class="min-h-screen bg-slate-50 pt-20 pb-12">
  {#if error}
    <div class="max-w-3xl mx-auto px-4 pt-16">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h2 class="text-red-800 text-xl font-semibold mb-2">Something went wrong</h2>
        <p class="text-red-700 mb-4">{error}</p>
        <button onclick={() => goto('/scholarships')} class="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700">Back to Scholarships</button>
      </div>
    </div>
  {:else}
    <!-- Premium Cover Layout (Matching Universities Profile) -->
    <div class="h-[500px] relative bg-slate-900 overflow-hidden">
       <!-- Dynamic background pattern instead of an image since scholarships don't have hero images -->
       <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0); background-size: 32px 32px;"></div>
       <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
       <div class="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
       
       <div class="absolute bottom-0 left-0 right-0">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 relative z-10">
             <div class="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded text-sm font-bold uppercase tracking-wide mb-6 shadow-lg shadow-orange-500/10">
               {scholarship.funding_category || 'Scholarship'}
             </div>
             
             <h1 class="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight" style="font-family: 'Outfit', sans-serif;">{decodeHtmlEntities(scholarship.title)}</h1>
             
             <div class="flex flex-wrap items-center gap-8 text-slate-300 text-lg font-medium">
                <span class="flex items-center gap-2">
                  <svg class="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  {decodeHtmlEntities(scholarship.provider)}
                </span>
                <span class="flex items-center gap-2">
                  <svg class="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" /></svg>
                  {scholarship.location}
                </span>
                <span class="flex items-center gap-2">
                  <svg class="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" /></svg>
                  {scholarship.level}
                </span>
             </div>
          </div>
       </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
       <!-- Back Link -->
       <div class="mb-8">
         <a href="/scholarships" class="text-slate-500 hover:text-orange-500 font-bold inline-flex items-center transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
             <path d="M19 12H5"></path>
             <path d="M12 19l-7-7 7-7"></path>
           </svg>
           Back to Discover Scholarships
         </a>
       </div>

       <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <!-- Left Column: Main Content -->
          <div class="lg:col-span-2 space-y-8">
             
             <!-- About Block -->
             <div class="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
                <h2 class="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <svg class="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  About this Scholarship
                </h2>
                <div class="mb-8">
                  <p class="text-slate-700 text-lg leading-relaxed whitespace-pre-line">{formatScholarshipText(scholarship.description)}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                  <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span class="text-slate-400 text-xs font-bold tracking-wider uppercase block mb-1">Field of Study</span>
                    <span class="font-bold text-slate-900">{scholarship.field}</span>
                  </div>
                  <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span class="text-slate-400 text-xs font-bold tracking-wider uppercase block mb-1">Degree Level</span>
                    <span class="font-bold text-slate-900">
                      {scholarship.levels && scholarship.levels.length > 1 ? scholarship.levels.join(', ') : scholarship.level}
                    </span>
                  </div>
                </div>
             </div>

             <!-- Scholarship Value Block -->
             <div class="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Scholarship Value</h2>
                  <div class="text-2xl md:text-3xl font-extrabold text-emerald-500 mb-2">
                    {formatCurrencyAmount(scholarship.amount) || 'Fully Funded / Stipend'}
                  </div>
                  {#if scholarship.funding_category}
                    <div class="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-100">
                      {scholarship.funding_category}
                    </div>
                  {/if}
                </div>
                <div class="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <svg class="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
             </div>
             
             <!-- Requirements Block -->
             {#if scholarship.requirements && scholarship.requirements.length > 0}
               <div class="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
                  <h2 class="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <svg class="w-7 h-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Requirements
                  </h2>
                  <ul class="space-y-3">
                    {#each scholarship.requirements as requirement}
                      <li class="flex items-start gap-3">
                        <svg class="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                        <span class="text-slate-700 text-lg leading-relaxed">{requirement}</span>
                      </li>
                    {/each}
                  </ul>
               </div>
             {/if}

             <!-- Eligibility Criteria Stats (Merged) -->
             {#if scholarship.min_gpa || scholarship.min_ielts || scholarship.min_toefl || scholarship.age_limit || (scholarship.nationality_restrictions && scholarship.nationality_restrictions.length > 0)}
               <div class="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
                  <h2 class="text-2xl font-bold text-slate-900 mb-6">Eligibility Criteria</h2>
                  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {#if scholarship.min_gpa}
                      <div class="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div class="text-3xl font-bold text-slate-900 mb-1">{scholarship.min_gpa}</div>
                        <div class="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Min GPA</div>
                      </div>
                    {/if}
                    {#if scholarship.min_ielts}
                      <div class="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div class="text-3xl font-bold text-slate-900 mb-1">{scholarship.min_ielts}</div>
                        <div class="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Min IELTS</div>
                      </div>
                    {/if}
                    {#if scholarship.min_toefl}
                      <div class="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div class="text-3xl font-bold text-slate-900 mb-1">{scholarship.min_toefl}</div>
                        <div class="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Min TOEFL</div>
                      </div>
                    {/if}
                    {#if scholarship.age_limit}
                      <div class="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div class="text-3xl font-bold text-slate-900 mb-1">{scholarship.age_limit}</div>
                        <div class="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Age Limit</div>
                      </div>
                    {/if}
                  </div>
                  {#if scholarship.nationality_restrictions && scholarship.nationality_restrictions.length > 0}
                    <div class="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                      <span class="block text-xs font-bold text-orange-800 uppercase tracking-wider mb-2">Targeted Nationalities</span>
                      <span class="font-medium text-orange-900">{scholarship.nationality_restrictions.join(', ')}</span>
                    </div>
                  {/if}
               </div>
             {/if}



             <!-- WIN STRATEGY (Copilot Intelligence) -->
             <ScholarshipStrategy
               bind:aiWinStrategy
               {aiStrategyLoading}
               {aiStrategyError}
               {generationPhase}
               bind:strategyActiveTab
               {winEligibility}
               {winRubric}
               {winPlan}
               onReveal={initiateStrategyGeneration}
             />
          </div>
          
          <!-- Right Column: Sticky Sidebar CTA -->
          <div>
            <div class="bg-slate-900 rounded-3xl p-8 text-white shadow-xl sticky top-28 border border-slate-800">
               <h3 class="text-xl font-bold mb-8 text-slate-300 uppercase tracking-widest pt-1">
                 Funding Details
               </h3>
               
               <div class="space-y-6 mb-8">

                  
                  {#if scholarship.deadline}
                    {@const status = getDeadlineStatus(scholarship.deadline)}
                    <div class="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                       <div class="text-slate-400 text-sm mb-2 font-medium uppercase tracking-wider">Application Deadline</div>
                       <div class="text-2xl font-bold text-white">
                          {formatDeadline(scholarship.deadline)}
                       </div>
                       <div class="inline-block mt-3 px-3 py-1 bg-slate-700 font-bold rounded-lg text-xs tracking-wider uppercase border border-slate-600 {status.class.includes('red') ? 'text-red-400 border-red-400/30 bg-red-400/10' : 'text-orange-400'}">
                         {status.text}
                       </div>
                    </div>
                  {/if}
               </div>

               {#if scholarship.website}
                 <a href={scholarship.website} target="_blank" rel="noopener noreferrer" class="w-full flex items-center justify-center gap-2 py-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl font-bold text-lg text-white transition-all shadow-lg shadow-orange-500/20 mb-4 transform hover:-translate-y-1">
                    Apply on Official Website
                 </a>
               {/if}
               
               <button onclick={toggleSaved} class="w-full flex items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-slate-300 transition-all mb-6">
                 <svg class="w-5 h-5 {isSaved ? 'fill-orange-500 text-orange-500' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                 </svg>
                 {isSaved ? 'Saved to Applications' : 'Save to Applications'}
               </button>
               
               <div class="text-center">
                 <button onclick={handleApplicationTracker} class="text-orange-400 hover:text-orange-300 text-sm font-bold border-b border-orange-400/30 hover:border-orange-300 pb-0.5 transition-colors">
                   Open Application Tracker →
                 </button>
               </div>
            </div>
            
            {#if scholarship.program_name && scholarship.university_name}
              <!-- Supplementary sticky block for grad program info if applicable -->
              <div class="bg-white rounded-3xl p-8 border border-slate-200 mt-8 shadow-sm">
                <h3 class="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Program Details
                </h3>
                <div class="space-y-3 text-sm">
                   <div>
                     <span class="block text-slate-500 font-medium">University</span>
                     <span class="font-bold text-slate-900">{scholarship.university_name}</span>
                   </div>
                   <div>
                     <span class="block text-slate-500 font-medium">Program</span>
                     <span class="font-bold text-slate-900">{scholarship.program_name}</span>
                   </div>
                   {#if scholarship.department}
                     <div>
                       <span class="block text-slate-500 font-medium">Department</span>
                       <span class="font-bold text-slate-900">{scholarship.department}</span>
                     </div>
                   {/if}
                </div>
              </div>
            {/if}
          </div>
       </div>
      
      <!-- Related Scholarships -->
      {#if relatedScholarships && relatedScholarships.length > 0}
        <div class="mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Related Scholarships</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {#each relatedScholarships as related}
              <div class="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                <h3 class="font-semibold text-gray-900 mb-1">
                  <a href={`/scholarships/${related.id}`} class="hover:text-indigo-700">{related.title}</a>
                </h3>
                <p class="text-sm text-gray-600 mb-2">{related.provider}</p>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-indigo-700">{related.amount}</span>
                  <span class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">{related.level}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      

    </div>
  {/if}
  <AuthenticationFlow 
    bind:show={showAuthModal} 
    {supabase} 
    mode={authMode} 
    returnUrl={$page.url.pathname}
    on:success={handleAuthSuccess}
  />
  <CompactUpgradeModal
    isOpen={showBillingModal}
    on:close={() => showBillingModal = false}
    on:upgrade={() => goto('/pricing')}
  />
  <StrategyDocumentLinker 
    bind:show={showStrategyLinker} 
    {userDocuments} 
    scholarshipTitle={decodeHtmlEntities(scholarship.title)} 
    onProcessGeneration={processStrategyGeneration} 
  />
</div> 
