<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
  import { formatCurrencyAmount, formatScholarshipText } from '$lib/utils/htmlEntities';
  import { subscriptionState } from '$lib/stores/subscription';
  import { loadQuickProfile, gpaMidpoint, type QuickProfile } from '$lib/services/quickProfile';
  
  let { data } = $props();
  let { session, scholarship, supabase } = $derived(data);
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
  let isPremium = $state(false);
  let quickProfile = $state<QuickProfile | null>(null);
  let quickProfileSource = $state<'remote' | 'local' | 'none'>('none');
  let aiWinStrategy = $state<any>((data as any).winStrategy || null);
  let aiStrategyLoading = $state(false);
  let aiStrategyError = $state<string | null>(null);

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
    aiStrategyLoading = true;
    aiStrategyError = null;
    try {
      const res = await fetch('/api/scholarships/win-strategy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarship_id: scholarship.id })
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(j?.message || j?.error || `Failed (${res.status})`);
      }
      aiWinStrategy = j?.strategy || null;
    } catch (e: any) {
      aiStrategyError = e?.message || 'Failed to generate win strategy';
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
  
  // Get the scholarship ID from the URL parameter
  // Data is loaded on the server via +page.server.ts; avoid overriding it here to prevent double-fetch/mismatch
  onMount(() => {
    // Paid status
    const unsub = subscriptionState.subscribe((s) => {
      isPremium = s?.loaded === true && s.isPremium === true;
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
  <title>{scholarship.title} - Scholarship Details</title>
  <meta name="description" content="{scholarship.description}" />
</svelte:head>

<div class="min-h-screen bg-slate-50 pt-20 pb-12">
  {#if error}
    <div class="max-w-3xl mx-auto px-4 pt-16">
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h2 class="text-red-800 text-xl font-semibold mb-2">Error Loading Scholarship</h2>
        <p class="text-red-700 mb-4">{error}</p>
        
        <div class="text-left mb-4 bg-red-100 p-4 rounded overflow-auto">
          <p class="text-red-700 font-medium">Debug Information:</p>
          <p class="text-red-600 text-sm mb-1">Scholarship ID: {$page.params.slug}</p>
          <p class="text-red-600 text-sm mb-1">User authenticated: {session ? 'Yes' : 'No'}</p>
          <p class="text-red-600 text-sm mb-1">Current timestamp: {new Date().toISOString()}</p>
        </div>
        
        <div class="flex justify-center gap-3">
          <button
            onclick={() => window.location.reload()}
            class="bg-[#2C3580] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#3c4d9c]"
          >
            Try Again
          </button>
          
          <button
            onclick={() => goto('/scholarships')}
            class="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700"
          >
            Back to Scholarships
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="max-w-6xl mx-auto px-4">
      <!-- Back Link -->
      <div class="mb-6">
        <a href="/scholarships" class="text-indigo-700 hover:text-indigo-800 font-medium inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
          Back to All Scholarships
        </a>
      </div>
      
      <!-- Scholarship Card -->
      <div class="bg-white rounded-3xl shadow-sm overflow-hidden mb-8 border border-slate-200">
        <!-- Header -->
        <div class="bg-gradient-to-r from-[#2C3580] to-indigo-600 p-7 text-white">
          <div class="flex justify-between items-start">
            <h1 class="text-2xl md:text-3xl font-bold mb-2 leading-tight">{scholarship.title}</h1>
            
            <!-- Badge based on funding category -->
            {#if scholarship.funding_category === 'Graduate Program Funding'}
              <span class="bg-white/90 text-[#2C3580] px-3 py-1 rounded-full text-sm font-semibold">🎓 Program Funding</span>
            {:else if scholarship.funding_category === 'Advertised Position'}
              <span class="bg-white/90 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">🔬 Research Position</span>
            {:else}
              <span class="bg-white/90 text-[#2C3580] px-3 py-1 rounded-full text-sm font-semibold">🏆 Scholarship</span>
            {/if}
          </div>
          <p class="text-lg opacity-90 mb-3">
            {scholarship.provider}
          </p>
          
          <div class="flex flex-wrap gap-2 mt-4">
            <span class="bg-white/15 px-3 py-1 rounded-full text-sm border border-white/15">
              Amount: {formatCurrencyAmount(scholarship.amount)}
            </span>
            
            {#if scholarship.deadline}
              {@const deadlineStatus = getDeadlineStatus(scholarship.deadline)}
              <span class="bg-white/15 px-3 py-1 rounded-full text-sm border border-white/15">
                Deadline: {formatDeadline(scholarship.deadline)}
                <span class="ml-2 text-white/90 bg-white/10 px-2 py-0.5 rounded-full text-xs border border-white/10">
                  {deadlineStatus.text}
                </span>
              </span>
            {/if}
            
            <span class="bg-white/15 px-3 py-1 rounded-full text-sm border border-white/15">
              {scholarship.location}
            </span>
          </div>
        </div>
        
        <!-- Content -->
        <div class="p-7">
          <div class="grid grid-cols-1 gap-8">
            <!-- Left Column -->
            <div>
              <section class="mb-6">
                <h2 class="text-lg font-semibold text-slate-900 mb-3">About this scholarship</h2>
                <p class="text-slate-700 mb-4 whitespace-pre-line leading-relaxed">{formatScholarshipText(scholarship.description)}</p>
                
                <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span class="text-slate-500 block">Field of study</span>
                    <span class="font-medium text-slate-900">{scholarship.field}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block">Degree level</span>
                    <span class="font-medium text-slate-900">
                      {#if scholarship.levels && scholarship.levels.length > 1}
                        {scholarship.levels.join(', ')}
                      {:else}
                        {scholarship.level}
                      {/if}
                    </span>
                  </div>
                  <div>
                    <span class="text-slate-500 block">Type</span>
                    <span class="font-medium text-slate-900">{scholarship.type}</span>
                  </div>
                  {#if scholarship.funding_category === 'Graduate Program Funding' || scholarship.funding_category === 'Advertised Position'}
                    <div>
                      <span class="text-slate-500 block">Funding type</span>
                      <span class="font-medium text-slate-900">{scholarship.funding_type || 'Not specified'}</span>
                    </div>
                  {/if}
                </div>
              </section>
              
              {#if scholarship.requirements && scholarship.requirements.length > 0}
                <section class="mb-6">
                  <h2 class="text-lg font-semibold text-slate-900 mb-3">Requirements</h2>
                  <ul class="list-disc list-inside text-slate-700 space-y-1">
                    {#each scholarship.requirements as requirement}
                      <li>{requirement}</li>
                    {/each}
                  </ul>
                </section>
              {/if}
            </div>
            
            <!-- Right Column -->
            <div>
              {#if scholarship.funding_category === 'Graduate Program Funding'}
                <section class="mb-6">
                  <h2 class="text-lg font-semibold text-slate-900 mb-3">Program details</h2>
                  <div class="space-y-3 text-slate-700">
                    <div>
                      <span class="text-slate-500 block">University</span>
                      <span class="font-medium text-slate-900">{scholarship.university_name}</span>
                    </div>
                    <div>
                      <span class="text-slate-500 block">Program</span>
                      <span class="font-medium text-slate-900">{scholarship.program_name}</span>
                    </div>
                    {#if scholarship.department}
                      <div>
                        <span class="text-slate-500 block">Department</span>
                        <span class="font-medium text-slate-900">{scholarship.department}</span>
                      </div>
                    {/if}
                    <div>
                      <span class="text-slate-500 block">Application method</span>
                      <span class="font-medium text-slate-900">{scholarship.application_method || 'Direct Application'}</span>
                    </div>
                    {#if scholarship.has_automatic_funding}
                      <div class="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mt-3">
                        <span class="font-medium text-emerald-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                          Automatic Funding Consideration
                        </span>
                        <p class="text-sm text-emerald-600 mt-1">All applicants are automatically considered for funding.</p>
                      </div>
                    {/if}
                  </div>
                </section>
              {/if}
              
              {#if scholarship.funding_category === 'Advertised Position'}
                <section class="mb-6">
                  <h2 class="text-lg font-semibold text-slate-900 mb-3">Position details</h2>
                  <div class="space-y-3 text-slate-700">
                    <div>
                      <span class="text-slate-500 block">University</span>
                      <span class="font-medium text-slate-900">{scholarship.university_name}</span>
                    </div>
                    <div>
                      <span class="text-slate-500 block">Professor</span>
                      <span class="font-medium text-slate-900">{scholarship.professor_name}</span>
                    </div>
                    {#if scholarship.professor_email}
                      <div>
                        <span class="text-slate-500 block">Contact email</span>
                        <a href="mailto:{scholarship.professor_email}" class="font-medium text-indigo-700 hover:underline">{scholarship.professor_email}</a>
                      </div>
                    {/if}
                    {#if scholarship.position_details}
                      <div class="mt-2">
                        <span class="text-slate-500 block mb-1">Position description</span>
                        <p class="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">{scholarship.position_details}</p>
                      </div>
                    {/if}
                  </div>
                </section>
              {/if}
              
              {#if scholarship.min_gpa || scholarship.min_ielts || scholarship.min_toefl || scholarship.age_limit || (scholarship.nationality_restrictions && scholarship.nationality_restrictions.length > 0)}
                <section class="mb-6">
                  <h2 class="text-lg font-semibold text-slate-900 mb-3">Eligibility criteria</h2>
                  <div class="space-y-2 text-slate-700">
                    {#if scholarship.min_gpa}
                      <div>
                        <span class="text-slate-500 block">Minimum GPA</span>
                        <span class="font-medium text-slate-900">{scholarship.min_gpa}</span>
                      </div>
                    {/if}
                    {#if scholarship.min_ielts}
                      <div>
                        <span class="text-slate-500 block">Minimum IELTS</span>
                        <span class="font-medium text-slate-900">{scholarship.min_ielts}</span>
                      </div>
                    {/if}
                    {#if scholarship.min_toefl}
                      <div>
                        <span class="text-slate-500 block">Minimum TOEFL</span>
                        <span class="font-medium text-slate-900">{scholarship.min_toefl}</span>
                      </div>
                    {/if}
                    {#if scholarship.age_limit}
                      <div>
                        <span class="text-slate-500 block">Age limit</span>
                        <span class="font-medium text-slate-900">{scholarship.age_limit} years</span>
                      </div>
                    {/if}
                    {#if scholarship.nationality_restrictions && scholarship.nationality_restrictions.length > 0}
                      <div>
                        <span class="text-slate-500 block">Nationality restrictions</span>
                        <span class="font-medium text-slate-900">{scholarship.nationality_restrictions.join(', ')}</span>
                      </div>
                    {/if}
                  </div>
                </section>
              {/if}

              <!-- Application Playbook (How to apply) -->
              <section class="mb-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-3">How to apply (step-by-step)</h2>
                <div class="rounded-xl border bg-white p-4">
                  <div class="flex items-start justify-between gap-3">
                    <div class="text-sm text-gray-700">
                      <div class="text-xs text-gray-500 mb-1">Application route</div>
                      <div class="font-medium">{playbookRouteType}</div>
                    </div>
                    <button
                      onclick={() => goto('/plan')}
                      class="px-3 py-2 text-sm font-semibold rounded-lg bg-[#2C3580] text-white hover:bg-[#3c4d9c] transition"
                    >
                      Go to your Plan →
                    </button>
                  </div>

                  <ol class="mt-4 space-y-3">
                    {#each playbookSteps as step, idx}
                      <li class="flex gap-3">
                        <div class="mt-0.5 h-7 w-7 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-semibold text-sm border border-indigo-100">
                          {idx + 1}
                        </div>
                        <div>
                          <div class="font-semibold text-gray-900">{step.title}</div>
                          <div class="text-sm text-gray-700">{step.description}</div>
                          {#if idx === 0 && scholarship.deadline}
                            <div class="text-xs text-gray-500 mt-1">Tip: set a personal deadline 7 days before {formatDeadline(scholarship.deadline)}.</div>
                          {/if}
                        </div>
                      </li>
                    {/each}
                  </ol>

                  <div class="mt-4 flex flex-col sm:flex-row gap-2">
                    <button
                      onclick={toggleSaved}
                      class="flex-1 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 transition font-semibold"
                    >
                      {isSaved ? 'Saved' : 'Save'} scholarship
                    </button>
                    <button
                      onclick={handleApplicationTracker}
                      class="flex-1 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 transition font-semibold"
                    >
                      Track in Applications
                    </button>
                  </div>
                </div>
              </section>

              <!-- WIN STRATEGY (Paid Intelligence) -->
              <section class="mb-6">
                <div class="flex items-start justify-between gap-3 mb-3">
                  <h2 class="text-lg font-semibold text-gray-900">Win Strategy (Preferred Candidate Plan)</h2>
                  <span class="text-xs font-semibold px-2 py-1 rounded-full border {isPremium ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}">
                    {isPremium ? 'Paid intelligence' : 'Preview'}
                  </span>
                </div>

                {#if !isPremium}
                  <div class="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <p class="text-sm text-indigo-900 font-medium mb-2">
                      Unlock the full win strategy for this scholarship
                    </p>
                    <ul class="text-sm text-indigo-900 space-y-1 mb-3">
                      <li>✓ Eligibility gate (pass/fail) using your profile</li>
                      <li>✓ What this scholarship rewards (rubric)</li>
                      <li>✓ A personalized “increase your odds” action plan</li>
                    </ul>
                    <div class="flex flex-col sm:flex-row gap-2">
                      <a href="/pricing" class="flex-1 px-4 py-2 rounded-lg bg-[#2C3580] text-white font-semibold text-center hover:bg-[#3c4d9c] transition">
                        Unlock win strategy
                      </a>
                      <button onclick={() => goto('/plan')} class="flex-1 px-4 py-2 rounded-lg border border-indigo-200 bg-white text-indigo-700 font-semibold hover:bg-slate-50 transition">
                        Open Strategy Pack →
                      </button>
                    </div>
                  </div>
                {:else}
                  <div class="rounded-xl border bg-white p-4">
                    {#if aiWinStrategy}
                      <div class="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div class="text-sm font-semibold text-emerald-900">AI win strategy generated</div>
                        <div class="text-sm text-emerald-800 mt-1">{aiWinStrategy.summary || 'Use this plan to improve your odds.'}</div>
                      </div>
                    {:else}
                      <div class="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div class="text-sm text-indigo-900">
                            <span class="font-semibold">Generate AI win strategy:</span> get scholarship-specific rubric + actions.
                          </div>
                          <button
                            type="button"
                            onclick={generateAIWinStrategy}
                            disabled={aiStrategyLoading}
                            class="rounded-lg bg-[#2C3580] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3c4d9c] transition disabled:opacity-60"
                          >
                            {aiStrategyLoading ? 'Generating…' : 'Generate now'}
                          </button>
                        </div>
                        {#if aiStrategyError}
                          <div class="mt-2 text-sm text-red-700">{aiStrategyError}</div>
                        {/if}
                      </div>
                    {/if}

                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <!-- Eligibility gate -->
                      <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div class="text-sm font-semibold text-slate-900 mb-2">Eligibility gate (fast check)</div>
                        <div class="space-y-2">
                          {#each winEligibility as c (c.label)}
                            <div class="flex items-start justify-between gap-3">
                              <div class="text-sm text-slate-800">{c.label}</div>
                              <div class="text-right">
                                <div class="text-xs font-semibold rounded-full px-2 py-0.5 inline-block {c.status === 'pass' ? 'bg-emerald-100 text-emerald-800' : c.status === 'fail' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}">
                                  {c.status === 'pass' ? 'Pass' : c.status === 'fail' ? 'Fail' : 'Unknown'}
                                </div>
                                {#if c.detail}
                                  <div class="text-[11px] text-slate-500 mt-1">{c.detail}</div>
                                {/if}
                              </div>
                            </div>
                          {/each}
                        </div>
                        {#if !quickProfile}
                          <div class="mt-3 text-xs text-slate-600">
                            Tip: add your quick profile in your Strategy Pack to make this check precise.
                          </div>
                        {/if}
                      </div>

                      <!-- Selection profile -->
                      <div class="rounded-xl border border-slate-200 bg-white p-4">
                        <div class="text-sm font-semibold text-slate-900 mb-2">What they likely reward</div>
                        <div class="space-y-3">
                          {#each (aiWinStrategy?.rubric || winRubric) as r (r.key)}
                            <div>
                              <div class="flex items-center justify-between gap-3">
                                <div class="text-sm font-medium text-slate-800">{r.label}</div>
                                <div class="text-xs text-slate-600">{weightToLabel(r.weight)}</div>
                              </div>
                              <div class="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div class="h-2 rounded-full bg-indigo-500" style={`width: ${weightToWidth(r.weight)}`}></div>
                              </div>
                              <div class="mt-1 text-[11px] text-slate-500">{r.reason}</div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    </div>

                    <!-- Action plan -->
                    <div class="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div class="rounded-xl border border-slate-200 bg-white p-4">
                        <div class="text-sm font-semibold text-slate-900 mb-2">Top actions to increase odds</div>
                        <ol class="text-sm text-slate-700 space-y-2 list-decimal pl-5">
                          {#each (aiWinStrategy?.top_actions || winPlan.topActions) as a (a)}
                            <li>{a}</li>
                          {/each}
                        </ol>
                      </div>
                      <div class="rounded-xl border border-slate-200 bg-white p-4">
                        <div class="text-sm font-semibold text-slate-900 mb-2">Evidence to prepare</div>
                        <ul class="text-sm text-slate-700 space-y-2 list-disc pl-5">
                          {#each (aiWinStrategy?.evidence || winPlan.evidence) as e (e)}
                            <li>{e}</li>
                          {/each}
                        </ul>
                      </div>
                      <div class="rounded-xl border border-slate-200 bg-white p-4">
                        <div class="text-sm font-semibold text-slate-900 mb-2">Red flags to avoid</div>
                        <ul class="text-sm text-slate-700 space-y-2 list-disc pl-5">
                          {#each (aiWinStrategy?.red_flags || winPlan.redFlags) as rf (rf)}
                            <li>{rf}</li>
                          {/each}
                        </ul>
                      </div>
                    </div>

                    {#if aiWinStrategy?.narrative_angles?.length}
                      <div class="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                        <div class="text-sm font-semibold text-slate-900 mb-2">Suggested narrative angles</div>
                        <ul class="text-sm text-slate-700 space-y-2 list-disc pl-5">
                          {#each aiWinStrategy.narrative_angles as angle (angle)}
                            <li>{angle}</li>
                          {/each}
                        </ul>
                      </div>
                    {/if}

                    <div class="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div class="text-sm text-indigo-900">
                          <span class="font-semibold">Next:</span> open your Strategy Pack to build a timeline + track this scholarship.
                        </div>
                        <button onclick={() => goto('/plan')} class="rounded-lg bg-[#2C3580] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3c4d9c] transition">
                          Open Strategy Pack →
                        </button>
                      </div>
                    </div>
                  </div>
                {/if}
              </section>
              
              {#if scholarship.website}
                <section class="mb-6">
                  <h2 class="text-lg font-semibold text-slate-900 mb-3">Application</h2>
                  <a href={scholarship.website} target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-4 py-2 bg-[#2C3580] text-white rounded-lg hover:bg-[#3c4d9c] transition-colors mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Apply on Official Website
                  </a>
                  <p class="text-sm text-slate-600">
                    Visit the official scholarship website for complete application instructions and to submit your application.
                  </p>
                </section>
              {/if}
              
              <div class="flex flex-col gap-3">
                <div class="flex justify-between items-center">
                  <span class="font-medium text-gray-700">Save this scholarship to your list</span>
                  <button
                    onclick={toggleSaved}
                    class={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition duration-200 ${
                      isSaved 
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {isSaved ? 'Saved to Your List' : 'Save to Your List'}
                  </button>
                </div>
                
                <div class="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p class="text-sm text-gray-700 mb-3 font-medium">💾 <strong>Quick Save:</strong> Click 'Save' to add this scholarship to your <a href="/scholarships/my-applications" class="text-blue-600 hover:text-blue-700 underline">Saved Scholarships</a> list for easy access later.</p>
                  <p class="text-sm text-gray-600 mb-2">📊 <strong>Full Tracking:</strong> Use our <button
  class="text-blue-600 hover:text-blue-700 underline font-medium bg-transparent border-none p-0 cursor-pointer"
  onclick={handleApplicationTracker}
>
  Application Tracker →
</button> to manually track ALL your applications (including from other platforms) with deadlines, documents, and status updates.</p>
                </div>
                
                <div class="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-lg text-center">
                  <p class="text-sm text-gray-600 mb-2">Looking for other opportunities?</p>
                  <a href="/scholarships" class="text-indigo-700 hover:text-indigo-800 font-medium">Explore more scholarships →</a>
                </div>
              </div>
            </div>
          </div>
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
      
      <!-- Call to Action Section -->
      <div class="mt-12 bg-gradient-to-r from-[#2C3580] to-indigo-600 rounded-2xl p-8 text-center text-white border border-indigo-200/20">
        <h3 class="text-2xl font-bold mb-4">Need Help with Your Applications?</h3>
        <p class="text-indigo-100 mb-6">
          Use our AI-powered tools to create compelling scholarship essays and application documents.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/sop" class="bg-white text-[#2C3580] px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition duration-200">
            📝 Generate Statement of Purpose
          </a>
          <a href="/cover-letters" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-[#2C3580] transition duration-200">
            ✉️ Create Cover Letter
          </a>
          <a href="/plan" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-[#2C3580] transition duration-200">
            🎯 Open Plan
          </a>
        </div>
      </div>
    </div>
  {/if}
  <AuthenticationFlow 
    bind:show={showAuthModal} 
    {supabase} 
    mode={authMode} 
    returnUrl={$page.url.pathname}
    on:success={handleAuthSuccess}
  />
</div> 