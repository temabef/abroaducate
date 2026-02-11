<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { EligibilityResult, DiagnosticData } from '$lib/utils/eligibilityCalculator';
  import { getCountryExamples } from '$lib/utils/eligibilityCalculator';
  import { getPathwayRule, getPathwayRulesForCountry, type PathwayType } from '$lib/utils/pathwayRules';
  import { assessEligibility } from '$lib/utils/eligibilityCalculator';
  import { CheckCircle, XCircle, ClipboardList, Trophy, Star, Wallet, BarChart3, Lightbulb, AlertTriangle } from 'lucide-svelte';
  
  let results: EligibilityResult | null = $state(null);
  let diagnosticData: DiagnosticData | null = $state(null);
  let degreeLevel = $state<string>('');
  let isLoading = $state(true);
  let selectedCountry = $state<string | null>(null);
  let showPathwaySwitcher = $state(false);
  let alternativePathways = $state<Array<{type: PathwayType, rule: any, country: string}>>([]);
  let expandedPathway = $state<string | null>(null); // Track which pathway is expanded for "Learn More"
  
  $effect(() => {
    degreeLevel = diagnosticData?.degreeLevel ?? '';
  });
  
  onMount(() => {
    try {
      // Load results from sessionStorage
      const storedResults = sessionStorage.getItem('diagnosticResults');
      const storedData = sessionStorage.getItem('diagnosticData');
      
      console.log('Loading results from sessionStorage:', { 
        hasResults: !!storedResults, 
        hasData: !!storedData 
      });
      
      if (storedResults && storedData) {
        try {
          results = JSON.parse(storedResults);
          diagnosticData = JSON.parse(storedData);
          console.log('Parsed results:', { results, diagnosticData });
          isLoading = false;
          
          // Load alternative pathways if pathway exists
          if (results?.pathway && (diagnosticData?.targetCountries?.length ?? 0) > 0) {
            loadAlternativePathways();
          }
        } catch (parseError) {
          console.error('Error parsing stored data:', parseError);
          goto('/diagnostic');
        }
      } else {
        console.log('No stored results found, redirecting to diagnostic');
        // Redirect to diagnostic if no results
        goto('/diagnostic');
      }
    } catch (error) {
      console.error('Error in onMount:', error);
      // Set loading to false to show error state
      isLoading = false;
    }
  });
  
  function loadAlternativePathways() {
    if (!results?.pathway || !diagnosticData?.targetCountries) return;
    
    const primaryCountry = diagnosticData.targetCountries[0];
    const currentPathway = results.pathway.type as PathwayType;
    
    // Get all pathway rules for this country
    const countryRules = getPathwayRulesForCountry(primaryCountry);
    
    // Find alternatives
    const alternatives: Array<{type: PathwayType, rule: any, country: string}> = [];
    
    countryRules.forEach(rule => {
      if (rule.pathway !== currentPathway) {
        alternatives.push({
          type: rule.pathway,
          rule: rule,
          country: primaryCountry
        });
      }
    });
    
    alternativePathways = alternatives;
  }
  
  function formatTimeline(months: number): string {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${months} months`;
    if (remainingMonths === 0) return `${years} ${years === 1 ? 'year' : 'years'}`;
    return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
  }
  
  function getPathwayTimelineSteps(pathwayType: string, months: number): Array<{year: string, description: string}> {
    const steps: Array<{year: string, description: string}> = [];
    
    if (pathwayType === 'BSc_to_PhD') {
      if (months >= 60) {
        // USA/Canada style (5-6 years)
        steps.push({ year: 'Year 1-2', description: 'Master\'s coursework + Research (earn Master\'s degree)' });
        steps.push({ year: 'Year 3-5', description: 'Dissertation Research' });
        steps.push({ year: 'Year 6', description: 'Defense & Graduation' });
      } else {
        // UK/Europe style (3-4 years)
        steps.push({ year: 'Year 1', description: 'Coursework + Research preparation' });
        steps.push({ year: 'Year 2-3', description: 'Dissertation Research' });
        steps.push({ year: 'Year 4', description: 'Defense & Graduation' });
      }
    } else if (pathwayType === 'BSc_to_MSc') {
      steps.push({ year: 'Year 1', description: 'Core coursework' });
      steps.push({ year: 'Year 2', description: 'Specialization + Thesis' });
    } else if (pathwayType === 'BSc_to_MSc_to_PhD') {
      steps.push({ year: 'Year 1', description: 'Master\'s coursework' });
      steps.push({ year: 'Year 2', description: 'Master\'s thesis + PhD application' });
      steps.push({ year: 'Year 3-5', description: 'PhD Research' });
      steps.push({ year: 'Year 6', description: 'Defense & Graduation' });
    } else if (pathwayType === 'MSc_to_PhD') {
      steps.push({ year: 'Year 1', description: 'Research preparation' });
      steps.push({ year: 'Year 2-3', description: 'Dissertation Research' });
      steps.push({ year: 'Year 4', description: 'Defense & Graduation' });
    }
    
    return steps;
  }
  
  function getScoreColor(score: number): string {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }
  
  function getScoreBgColor(score: number): string {
    if (score >= 70) return 'bg-green-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  }

  function getPreviewCountry(): string {
    const fromCompetitive = results?.competitive?.[0]?.country;
    if (fromCompetitive) return fromCompetitive;
    const fromNeedsWork = results?.needsWork?.[0]?.country;
    if (fromNeedsWork) return fromNeedsWork;
    const fromUnrealistic = results?.unrealistic?.[0]?.country;
    if (fromUnrealistic) return fromUnrealistic;
    return diagnosticData?.targetCountries?.[0] ?? 'United States';
  }

  function getStrategyPackScholarshipPreview(): Array<{ title: string; meta: string }> {
    const country = getPreviewCountry();
    const examples = getCountryExamples(country).slice(0, 3);
    return examples.map((ex) => ({
      title: ex.scholarship,
      meta: `${ex.name} → ${ex.accepted}`
    }));
  }

  function getStrategyPackTimelinePreview(): Array<{ when: string; what: string }> {
    if (!results?.pathway) return [];
    const primaryCountry = diagnosticData?.targetCountries?.[0] || 'OTHER';
    const pathwayRule = getPathwayRule(results.pathway.type as PathwayType, primaryCountry);
    if (!pathwayRule) return [];
    const steps = getPathwayTimelineSteps(results.pathway.type, pathwayRule.conditions.timeline_months);
    return steps.slice(0, 2).map((s) => ({ when: s.year, what: s.description }));
  }
  
  // Categorize field of study into 6 major categories
  function categorizeField(fieldOfStudy: string): string {
    const field = fieldOfStudy.toLowerCase();
    
    // STEM
    if (field.includes('computer') || field.includes('engineering') || field.includes('math') || 
        field.includes('physics') || field.includes('chemistry') || field.includes('technology') ||
        field.includes('data science') || field.includes('software')) {
      return 'STEM';
    }
    
    // Health & Life Sciences
    if (field.includes('medicine') || field.includes('biology') || field.includes('health') ||
        field.includes('pharmacy') || field.includes('nursing') || field.includes('biotech')) {
      return 'Health & Life Sciences';
    }
    
    // Business & Economics
    if (field.includes('business') || field.includes('mba') || field.includes('economic') ||
        field.includes('finance') || field.includes('accounting') || field.includes('management')) {
      return 'Business & Economics';
    }
    
    // Social Sciences
    if (field.includes('psychology') || field.includes('sociology') || field.includes('education') ||
        field.includes('political') || field.includes('anthropology') || field.includes('social work')) {
      return 'Social Sciences';
    }
    
    // Humanities & Arts
    if (field.includes('literature') || field.includes('history') || field.includes('language') ||
        field.includes('philosophy') || field.includes('art') || field.includes('music') ||
        field.includes('humanities')) {
      return 'Humanities & Arts';
    }
    
    // Professional Programs
    if (field.includes('law') || field.includes('medical') || field.includes('dental')) {
      return 'Professional Programs';
    }
    
    // Default to STEM if unclear
    return 'STEM';
  }
  
  // Get field-specific insights
  function getFieldInsights(fieldCategory: string, degreeLevel: string) {
    const isPHD = degreeLevel.toLowerCase().includes('phd') || degreeLevel.toLowerCase().includes('doctor');
    
    const insights: Record<string, {
      title: string;
      fundingRate: string;
      message: string;
      keyPoints: string[];
      focusAreas: string[];
      topScholarships: string[];
      color: string;
      icon: string;
    }> = {
      'STEM': {
        title: 'Great News for STEM Students!',
        fundingRate: isPHD ? '90%+ funded' : '60-70% funded',
        message: isPHD ? 'STEM PhDs have the BEST funding prospects' : 'Good funding opportunities available',
        keyPoints: [
          isPHD ? '90%+ of PhD students receive full funding' : '60-70% of Master\'s students get partial funding',
          'Research experience matters MORE than GPA',
          'TA/RA positions widely available'
        ],
        focusAreas: ['Publications & research projects', 'Lab/technical experience', 'Programming skills', 'Strong recommendation from research supervisor'],
        topScholarships: ['NSF Graduate Research Fellowship', 'DAAD (Germany)', 'University RA/TA positions', 'Erasmus Mundus'],
        color: 'green',
        icon: 'beaker'
      },
      'Health & Life Sciences': {
        title: 'Health Sciences Funding',
        fundingRate: isPHD ? '75-85% funded' : '30-40% funded',
        message: isPHD ? 'Good funding prospects for PhD, competitive but achievable' : 'Master\'s programs often require self-funding',
        keyPoints: [
          isPHD ? '75-85% of PhD students receive funding' : 'Master\'s funding is limited',
          'Lab research experience is critical',
          'Higher GPA needed than STEM (3.3+ recommended)'
        ],
        focusAreas: ['Lab/clinical experience', 'Publications or conference posters', 'GPA 3.3+ for competitiveness', 'GRE scores'],
        topScholarships: ['NIH Training Grants (USA)', 'Wellcome Trust (UK)', 'University training programs', 'Fogarty International'],
        color: 'blue',
        icon: 'heart'
      },
      'Business & Economics': {
        title: 'Business Funding Reality',
        fundingRate: isPHD ? '80-90% funded' : '10-20% funded',
        message: isPHD ? 'PhD Economics similar to STEM funding' : 'MBA/Master\'s usually unfunded - plan for loans',
        keyPoints: [
          isPHD ? 'PhD Economics: 80-90% funded (like STEM)' : 'MBA: Usually unfunded (self-pay or loans)',
          isPHD ? 'Strong quantitative skills valued' : 'Consider employer sponsorship',
          isPHD ? 'GRE Quant 165+ highly valued' : 'Merit scholarships available (20-40% tuition)'
        ],
        focusAreas: isPHD ? ['Math/statistics background', 'GRE Quantitative score', 'Research experience', 'Programming (R, Python)'] : ['Work experience (3-5 years)', 'GMAT 700+', 'Employer sponsorship', 'Leadership roles'],
        topScholarships: isPHD ? ['University fellowships', 'Fulbright', 'IMF/World Bank fellowships'] : ['Forté Foundation', 'Merit scholarships', 'Employer sponsorship programs'],
        color: 'purple',
        icon: 'briefcase'
      },
      'Social Sciences': {
        title: 'Social Sciences Funding',
        fundingRate: isPHD ? '50-70% funded' : '30-50% funded',
        message: 'Moderate funding - competitive but achievable with strong profile',
        keyPoints: [
          isPHD ? '50-70% of students receive funding' : '30-50% get partial funding',
          'GPA 3.5+ strongly preferred',
          'Excellent writing sample is critical'
        ],
        focusAreas: ['Research experience', 'Strong writing sample', 'GPA 3.5+', 'Clear research agenda in SOP', 'Quantitative skills (increasingly valued)'],
        topScholarships: ['NSF SBE', 'Fulbright', 'Spencer Foundation (Education)', 'University TA/RA positions'],
        color: 'indigo',
        icon: 'users'
      },
      'Humanities & Arts': {
        title: 'Important for Humanities Students',
        fundingRate: isPHD ? '20-40% funded' : '10-20% funded',
        message: 'Funding is limited - be strategic and realistic',
        keyPoints: [
          'Only 20-40% of Humanities students get funding',
          'ONLY apply to programs offering guaranteed funding',
          'Top-tier programs have better funding rates'
        ],
        focusAreas: ['Exceptional writing sample (CRITICAL)', 'GPA 3.7+ essential', 'Language proficiency', 'Fit with specific faculty advisor', 'Top-tier programs priority'],
        topScholarships: ['Fulbright (best option)', 'DAAD (some humanities programs)', 'Top university fellowships', 'Mellon Foundation'],
        color: 'amber',
        icon: 'book'
      },
      'Professional Programs': {
        title: 'Professional Programs Funding',
        fundingRate: '10-30% funded',
        message: 'Most professional programs require self-funding or loans',
        keyPoints: [
          'Rarely funded for international students',
          'Merit scholarships available (10-30% tuition)',
          'Consider employer sponsorship (MBA)'
        ],
        focusAreas: ['Target schools with merit aid', 'Employer sponsorship', 'Strong GMAT/LSAT scores', 'Plan for student loans', 'Part-time programs while working'],
        topScholarships: ['University merit scholarships', 'Commonwealth Scholarships', 'Employer sponsorship', 'Country-specific programs'],
        color: 'red',
        icon: 'graduation-cap'
      }
    };
    
    return insights[fieldCategory] || insights['STEM'];
  }
</script>

<svelte:head>
  <title>Your Study Abroad Assessment Results - Abroaducate</title>
</svelte:head>

{#if isLoading}
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white flex items-center justify-center px-6">
    <div class="relative w-full max-w-md">
      <div class="pointer-events-none absolute -inset-10">
        <div class="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-indigo-200/40 blur-3xl"></div>
        <div class="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-200/30 blur-3xl"></div>
      </div>
      <div class="relative text-center rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-8 shadow-sm">
        <div class="animate-spin rounded-full h-12 w-12 border-2 border-slate-300 border-t-[#2C3580] mx-auto mb-4"></div>
        <p class="text-slate-700 text-lg font-semibold">Loading your results…</p>
        <p class="text-sm text-slate-500 mt-2">This should only take a moment.</p>
      </div>
    </div>
  </div>
{:else if results && diagnosticData}
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white py-12">
    <div class="max-w-5xl mx-auto px-4">
      
      <!-- Overall Score Card -->
      <div class="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-sm p-8 mb-8">
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-indigo-200/35 blur-3xl"></div>
          <div class="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-200/25 blur-3xl"></div>
        </div>
        <div class="relative">
        <div class="text-center mb-6">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-full text-sm font-semibold text-slate-700 mb-4 shadow-sm">
            <svg class="w-5 h-5 text-indigo-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
              <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"></path>
            </svg>
            Your Scholarship Potential
          </div>
          <h1 class="text-4xl font-bold text-slate-900 mb-2">Here’s your funding reality</h1>
          <p class="text-slate-600 text-lg mb-4">Based on your profile, here are your scholarship opportunities.</p>
          
          <!-- Beginner-Friendly Explanation -->
          <div class="max-w-2xl mx-auto mt-6 p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200">
            <p class="text-slate-700 text-sm leading-relaxed">
              <strong>What this means:</strong> Your {results.overallScore}% funding potential shows how ready you are to get scholarships RIGHT NOW. 
              {#if results.competitive.length > 0}
                You have <strong>{results.competitive.length} strong opportunity{results.competitive.length === 1 ? '' : 'ies'}</strong> where scholarships are realistic. 
              {/if}
              {#if results.needsWork.length > 0}
                {results.needsWork.length} country{results.needsWork.length === 1 ? '' : 'ies'} need{results.needsWork.length === 1 ? 's' : ''} some improvement, but funding is still possible.
              {/if}
              This isn't about admission - it's about getting <strong>FUNDED</strong> so you don't pay full tuition.
            </p>
          </div>
        </div>
        
        <div class="flex items-center justify-center mb-6">
          <div class="relative">
            <div class="w-48 h-48 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center border border-slate-200 shadow-sm">
              <div class="text-center">
                <div class="text-5xl font-bold text-slate-900">{results.overallScore}%</div>
                <div class="text-sm text-slate-600 mt-1">Funding potential</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200">
            <div class="text-3xl font-bold text-slate-900">{results.competitive.length}</div>
            <div class="text-sm text-slate-600 mt-1">Strong funding chance</div>
          </div>
          <div class="p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200">
            <div class="text-3xl font-bold text-slate-900">{results.needsWork.length}</div>
            <div class="text-sm text-slate-600 mt-1">Improve to get funded</div>
          </div>
          <div class="p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200">
            <div class="text-3xl font-bold text-slate-900">{results.unrealistic.length}</div>
            <div class="text-sm text-slate-600 mt-1">Major work needed</div>
          </div>
        </div>
        </div>
      </div>
      
      <!-- Field-Specific Insights (Priority 7) -->
      {#if diagnosticData?.fieldOfStudy}
        {@const fieldCategory = categorizeField(diagnosticData.fieldOfStudy)}
        {@const insights = getFieldInsights(fieldCategory, diagnosticData.degreeLevel || 'masters')}
        {@const colorClasses = {
          'green': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', badge: 'bg-green-100 text-green-700', icon: 'text-green-600' },
          'blue': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-600' },
          'purple': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-700', icon: 'text-purple-600' },
          'indigo': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', badge: 'bg-indigo-100 text-indigo-700', icon: 'text-indigo-600' },
          'amber': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-600' },
          'red': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', badge: 'bg-red-100 text-red-700', icon: 'text-red-600' }
        }}
        {@const colors = colorClasses[insights.color as keyof typeof colorClasses]}
        
        <div class="{colors.bg} border-2 {colors.border} rounded-2xl p-6 mb-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 {colors.badge} rounded-full flex items-center justify-center flex-shrink-0">
              <Lightbulb class="w-6 h-6 {colors.icon}" />
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-bold {colors.text} mb-2">{insights.title}</h2>
              <p class="{colors.text} mb-4">{insights.message}</p>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <!-- Key Points -->
                <div class="bg-white/60 rounded-lg p-4">
                  <p class="font-semibold {colors.text} mb-2 text-sm">Funding Reality:</p>
                  <ul class="space-y-1">
                    {#each insights.keyPoints as point}
                      <li class="text-sm {colors.text} flex items-start gap-2">
                        <span class="font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    {/each}
                  </ul>
                  <div class="mt-3 inline-block px-3 py-1 {colors.badge} rounded-full text-xs font-bold">
                    {insights.fundingRate}
                  </div>
                </div>
                
                <!-- Focus Areas -->
                <div class="bg-white/60 rounded-lg p-4">
                  <p class="font-semibold {colors.text} mb-2 text-sm">What Matters Most for Your Field:</p>
                  <ul class="space-y-1">
                    {#each insights.focusAreas as area}
                      <li class="text-sm {colors.text} flex items-start gap-2">
                        <CheckCircle class="w-3.5 h-3.5 {colors.icon} flex-shrink-0 mt-0.5" />
                        <span>{area}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              </div>
              
              <!-- Top Scholarships for Field -->
              <div class="bg-white/60 rounded-lg p-4">
                <p class="font-semibold {colors.text} mb-2 text-sm">Top Scholarships for {fieldCategory}:</p>
                <div class="flex flex-wrap gap-2">
                  {#each insights.topScholarships as scholarship}
                    <span class="px-3 py-1 bg-white {colors.text} border {colors.border} rounded-full text-xs font-medium">
                      {scholarship}
                    </span>
                  {/each}
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Your Pathway Section -->
      {#if results.pathway}
        <div class="bg-white/80 backdrop-blur rounded-3xl border border-slate-200 shadow-sm p-8 mb-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center border border-violet-200">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-slate-900">Your educational pathway</h2>
              <p class="text-slate-600">Based on your goals, here's what you need to know.</p>
            </div>
          </div>
          
          <div class="bg-white/70 border border-slate-200 rounded-2xl p-6 mb-6">
            <p class="text-slate-700 leading-relaxed">{results.pathway.explanation}</p>
          </div>
          
          <!-- Timeline Visualization -->
          {#if results.pathway}
            {@const pathwayRule = getPathwayRule(results.pathway.type as PathwayType, diagnosticData?.targetCountries?.[0] || 'OTHER')}
            {#if pathwayRule}
              {@const timelineSteps = getPathwayTimelineSteps(results.pathway.type, pathwayRule.conditions.timeline_months)}
              <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Your Timeline: {formatTimeline(pathwayRule.conditions.timeline_months)}
                </h3>
                
                <div class="relative">
                  <!-- Timeline Line -->
                  <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-purple-200"></div>
                  
                  <div class="space-y-6">
                    {#each timelineSteps as step, index}
                      <div class="relative flex items-start gap-4">
                        <!-- Timeline Dot -->
                        <div class="relative z-10 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span class="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        
                        <!-- Content -->
                        <div class="flex-1 bg-white border-2 border-purple-100 rounded-lg p-4 shadow-sm">
                          <p class="font-bold text-purple-900 mb-1">{step.year}</p>
                          <p class="text-sm text-gray-700">{step.description}</p>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
                
                <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p class="text-sm text-blue-900">
                    <strong>Application Deadline:</strong> {pathwayRule.conditions.application_deadline_range}
                  </p>
                  <p class="text-sm text-blue-700 mt-1">
                    <strong>Typical Funding:</strong> {pathwayRule.conditions.funding_typical}
                  </p>
                </div>
              </div>
            {/if}
          {/if}
          
          <!-- Interactive Pathway Comparison Tool -->
          {#if alternativePathways.length > 0}
            <div class="mb-6 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-lg font-bold text-indigo-900 mb-1 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Compare Pathway Options
                  </h3>
                  <p class="text-sm text-indigo-700">See how different pathways compare for {diagnosticData?.targetCountries?.[0] || 'your target country'}</p>
                </div>
                <button
                  onclick={() => showPathwaySwitcher = !showPathwaySwitcher}
                  class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold flex items-center gap-2"
                >
                  {#if showPathwaySwitcher}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                    </svg>
                    Hide
                  {:else}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                    Compare
                  {/if}
                </button>
              </div>
              
              {#if showPathwaySwitcher}
                <!-- Side-by-side comparison grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <!-- Current Pathway Card -->
                  {#if results.pathway}
                    <div class="bg-white border-3 border-green-500 rounded-lg p-5 relative">
                      <div class="absolute -top-3 left-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        YOUR PATH
                      </div>
                      
                      <h4 class="font-bold text-gray-900 mb-2 mt-2 flex items-center gap-2">
                        <CheckCircle class="w-5 h-5 text-green-600" />
                        {results.pathway.type === 'BSc_to_PhD' ? 'Direct BSc → PhD' :
                         results.pathway.type === 'BSc_to_MSc' ? 'BSc → Master\'s' :
                         results.pathway.type === 'BSc_to_MSc_to_PhD' ? 'BSc → Master\'s → PhD' :
                         results.pathway.type === 'MSc_to_PhD' ? 'Master\'s → PhD' : results.pathway.type}
                      </h4>
                      
                      <p class="text-sm text-gray-600 mb-4">{results.pathway.explanation}</p>
                      
                      <!-- Timeline -->
                      <div class="mb-3">
                        <div class="flex items-center gap-2 mb-1">
                          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span class="text-xs font-semibold text-gray-700">Timeline</span>
                        </div>
                        <p class="text-sm font-bold text-indigo-600">{results.pathway.timeline}</p>
                        <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div class="bg-indigo-600 h-2 rounded-full" style="width: 100%"></div>
                        </div>
                      </div>
                      
                      <!-- Documents -->
                      <div class="mb-3">
                        <div class="flex items-center gap-2 mb-2">
                          <ClipboardList class="w-4 h-4 text-gray-600" />
                          <span class="text-xs font-semibold text-gray-700">Documents</span>
                        </div>
                        <div class="space-y-1">
                          {#if results.pathway.documentRequirements.transcriptInfo.bachelor}
                            <div class="flex items-center gap-2 text-xs">
                              <CheckCircle class="w-3.5 h-3.5 text-green-600" />
                              <span>Bachelor's Transcript</span>
                            </div>
                          {/if}
                          {#if results.pathway.documentRequirements.transcriptInfo.master}
                            <div class="flex items-center gap-2 text-xs">
                              <CheckCircle class="w-3.5 h-3.5 text-green-600" />
                              <span>Master's Transcript</span>
                            </div>
                          {:else}
                            <div class="flex items-center gap-2 text-xs">
                              <XCircle class="w-3.5 h-3.5 text-blue-600" />
                              <span>No Master's needed</span>
                            </div>
                          {/if}
                        </div>
                      </div>
                    </div>
                  {/if}
                  
                  <!-- Alternative Pathway Cards -->
                  {#each alternativePathways as alt}
                    <div class="bg-white border-2 border-gray-300 rounded-lg p-5 hover:border-indigo-400 hover:shadow-lg transition-all relative group">
                      <div class="absolute -top-3 left-4 px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-full group-hover:bg-indigo-500 transition-colors">
                        ALTERNATIVE
                      </div>
                      
                      <h4 class="font-bold text-gray-900 mb-2 mt-2 flex items-center gap-2">
                        <svg class="w-5 h-5 text-gray-500 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        {alt.type === 'BSc_to_PhD' ? 'Direct BSc → PhD' :
                         alt.type === 'BSc_to_MSc' ? 'BSc → Master\'s' :
                         alt.type === 'BSc_to_MSc_to_PhD' ? 'BSc → Master\'s → PhD' :
                         alt.type === 'MSc_to_PhD' ? 'Master\'s → PhD' : alt.type}
                      </h4>
                      
                      <p class="text-sm text-gray-600 mb-4">{alt.rule.explanation}</p>
                      
                      <!-- Timeline -->
                      <div class="mb-3">
                        <div class="flex items-center gap-2 mb-1">
                          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span class="text-xs font-semibold text-gray-700">Timeline</span>
                        </div>
                        <p class="text-sm font-bold text-gray-700">{formatTimeline(alt.rule.conditions.timeline_months)}</p>
                        <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div class="bg-gray-500 group-hover:bg-indigo-500 h-2 rounded-full transition-colors" 
                               style="width: {Math.min(100, (alt.rule.conditions.timeline_months / 72) * 100)}%"></div>
                        </div>
                      </div>
                      
                      <!-- Documents -->
                      <div class="mb-3">
                        <div class="flex items-center gap-2 mb-2">
                          <ClipboardList class="w-4 h-4 text-gray-600" />
                          <span class="text-xs font-semibold text-gray-700">Documents</span>
                        </div>
                        <div class="space-y-1">
                          {#if alt.rule.conditions.transcript_bachelor_required}
                            <div class="flex items-center gap-2 text-xs">
                              <CheckCircle class="w-3.5 h-3.5 text-green-600" />
                              <span>Bachelor's Transcript</span>
                            </div>
                          {/if}
                          {#if alt.rule.conditions.transcript_master_required}
                            <div class="flex items-center gap-2 text-xs">
                              <CheckCircle class="w-3.5 h-3.5 text-green-600" />
                              <span>Master's Transcript</span>
                            </div>
                          {:else if alt.rule.conditions.transcript_master_reason}
                            <div class="flex items-center gap-2 text-xs">
                              <XCircle class="w-3.5 h-3.5 text-blue-600" />
                              <span>No Master's needed</span>
                            </div>
                          {/if}
                        </div>
                      </div>
                      
                      <!-- Funding -->
                      <div class="mb-3 pb-3 border-b border-gray-200">
                        <div class="flex items-center gap-2 mb-1">
                          <Wallet class="w-4 h-4 text-gray-600" />
                          <span class="text-xs font-semibold text-gray-700">Funding</span>
                        </div>
                        <p class="text-xs text-gray-600">{alt.rule.conditions.funding_typical}</p>
                      </div>
                      
                      <button 
                        onclick={() => expandedPathway = expandedPathway === alt.type ? null : alt.type}
                        class="w-full mt-2 px-4 py-2 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded-lg transition-all text-sm font-semibold flex items-center justify-center gap-2 group"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{expandedPathway === alt.type ? 'M5 15l7-7 7 7' : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}"></path>
                        </svg>
                        {expandedPathway === alt.type ? 'Show Less' : 'Learn More'}
                      </button>
                      
                      <!-- Expanded Details -->
                      {#if expandedPathway === alt.type}
                        <div class="mt-4 space-y-3 pt-4 border-t border-gray-200 animate-in slide-in-from-top">
                          <div class="bg-indigo-50 rounded-lg p-3">
                            <p class="text-xs font-semibold text-indigo-900 mb-2">Why Choose This Pathway?</p>
                            <p class="text-xs text-indigo-700">{alt.rule.whyChoose || 'A flexible option that may better suit your current qualifications and timeline.'}</p>
                          </div>
                          
                          <div class="bg-gray-50 rounded-lg p-3">
                            <p class="text-xs font-semibold text-gray-900 mb-2">Key Considerations:</p>
                            <ul class="text-xs text-gray-700 space-y-1">
                              <li class="flex items-start gap-2">
                                <span class="text-gray-500">•</span>
                                <span>Timeline: {formatTimeline(alt.rule.conditions.timeline_months)}</span>
                              </li>
                              <li class="flex items-start gap-2">
                                <span class="text-gray-500">•</span>
                                <span>Funding: {alt.rule.conditions.funding_typical}</span>
                              </li>
                              <li class="flex items-start gap-2">
                                <span class="text-gray-500">•</span>
                                <span>Best for: {alt.rule.bestFor || 'Students seeking this specific educational pathway'}</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
                
                <!-- Comparison Note -->
                <div class="mt-4 p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-indigo-200">
                  <p class="text-sm text-indigo-800 flex items-start gap-2">
                    <Lightbulb class="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />
                    <span><strong>Not sure which pathway to choose?</strong> Consider timeline, funding availability, and whether you want to earn a Master's degree along the way. Direct PhD paths save time but require stronger preparation.</span>
                  </p>
                </div>
              {/if}
            </div>
          {/if}
          
          <!-- Documents Checklist -->
          <div class="space-y-4">
            <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList class="w-5 h-5 text-gray-700" />
              Documents You Actually Need
            </h3>
            
            <!-- Required Documents -->
            <div>
              <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                Essential Documents:
              </h4>
              <div class="space-y-2">
                {#if results.pathway.documentRequirements.transcriptInfo.bachelor}
                  <div class="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <svg class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <div class="flex-1">
                      <p class="font-semibold text-green-900">Bachelor's Transcript</p>
                      <p class="text-sm text-green-700">Required for your application</p>
                    </div>
                  </div>
                {/if}
                
                {#if results.pathway.documentRequirements.transcriptInfo.master}
                  <div class="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <svg class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <div class="flex-1">
                      <p class="font-semibold text-green-900">Master's Transcript</p>
                      <p class="text-sm text-green-700">Required for your application</p>
                    </div>
                  </div>
                {:else if !results.pathway.documentRequirements.transcriptInfo.master && results.pathway.documentRequirements.transcriptInfo.masterReason}
                  <div class="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                    </svg>
                    <div class="flex-1">
                      <p class="font-semibold text-blue-900">Master's Transcript</p>
                      <p class="text-sm text-blue-700 flex items-center gap-1.5">
                        <XCircle class="w-4 h-4 flex-shrink-0" />
                        Don't worry — you don't need this!
                      </p>
                      <p class="text-sm text-blue-600 mt-1">{results.pathway.documentRequirements.transcriptInfo.masterReason}</p>
                    </div>
                  </div>
                {/if}
                
                {#each results.pathway.documentRequirements.required.filter(doc => !doc.includes('transcript')) as doc}
                  <div class="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <svg class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <div class="flex-1">
                      <p class="font-semibold text-green-900 capitalize">{doc.replace(/_/g, ' ')}</p>
                      <p class="text-sm text-green-700">Required for your application</p>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
            
            <!-- Optional Documents -->
            {#if results.pathway.documentRequirements.optional.length > 0}
              <div>
                <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <svg class="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                  </svg>
                  Optional (but recommended):
                </h4>
                <div class="space-y-2">
                  {#each results.pathway.documentRequirements.optional as doc}
                    <div class="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <svg class="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                      </svg>
                      <div class="flex-1">
                        <p class="font-medium text-gray-900 capitalize">{doc.replace(/_/g, ' ')}</p>
                        <p class="text-sm text-gray-600">Can strengthen your application</p>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
      
      <!-- Competitive Countries -->
      {#if results.competitive.length > 0}
        <div class="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle class="w-7 h-7 text-green-600" />
                Strong Scholarship Potential
              </h2>
              <p class="text-gray-600 mb-2">You're competitive for FUNDED opportunities in these countries</p>
              <p class="text-sm text-gray-500">
                <strong>What this means:</strong> You meet the basic requirements for scholarships in these countries. 
                Create an account to see specific scholarship programs and application deadlines.
              </p>
            </div>
          </div>
          
          <!-- Quick Action CTA -->
          <div class="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold text-green-900 mb-1">Ready to find specific scholarships?</p>
                <p class="text-sm text-green-700">Get personalized scholarship matches and application deadlines</p>
              </div>
              <a
                href="/auth?signup=true&source=diagnostic&next=/plan"
                class="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
              >
                Open Strategy Pack →
              </a>
            </div>
          </div>
          
          <div class="space-y-4">
            {#each results.competitive as assessment}
              <div class="border-2 border-green-200 rounded-lg p-5 hover:border-green-300 transition-all">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">{assessment.country}</h3>
                    <p class="text-green-700 mt-1">{assessment.reason}</p>
                  </div>
                  <span class="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full text-sm font-bold shadow flex items-center gap-2">
{#if assessment.fundingPotential === 'excellent'}
                      <Trophy class="w-4 h-4" /> Excellent Funding
                    {:else if assessment.fundingPotential === 'good'}
                      <Star class="w-4 h-4" /> Good Funding
                    {:else if assessment.fundingPotential === 'moderate'}
                      <Wallet class="w-4 h-4" /> Moderate Funding
                    {:else}
                      <BarChart3 class="w-4 h-4" /> Limited Funding
                    {/if}
                  </span>
                </div>
                
                <!-- Scholarship Opportunities -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p class="text-sm font-bold text-green-900 mb-2 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
                      <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"></path>
                    </svg>
<Wallet class="w-5 h-5" />
                    Funding Opportunities:
                  </p>
                  <ul class="text-sm text-green-800 space-y-1">
                    {#each assessment.scholarshipTypes as scholarship}
                      <li class="flex items-start gap-2">
                        <svg class="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        {scholarship}
                      </li>
                    {/each}
                  </ul>
                </div>
                
                <!-- Country-Specific Pathway Intelligence -->
                {#if degreeLevel && (degreeLevel === 'masters' || degreeLevel === 'phd')}
                  {@const countryPathwayRules = getPathwayRulesForCountry(assessment.country)}
                  {#if countryPathwayRules.length > 0}
                    {@const relevantRule = countryPathwayRules.find(r => 
                      (degreeLevel === 'phd' && (r.pathway === 'BSc_to_PhD' || r.pathway === 'BSc_to_MSc_to_PhD' || r.pathway === 'MSc_to_PhD')) ||
                      (degreeLevel === 'masters' && r.pathway === 'BSc_to_MSc')
                    )}
                    {#if relevantRule}
                      <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                        <p class="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                          </svg>
                          Pathway for {assessment.country}:
                        </p>
                        <p class="text-sm text-indigo-800 mb-2">{relevantRule.explanation}</p>
                        <div class="flex flex-wrap gap-2 text-xs mt-2">
                          <span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                            Timeline: {formatTimeline(relevantRule.conditions.timeline_months)}
                          </span>
                          <span class="px-2 py-1 bg-green-100 text-green-700 rounded">
                            {relevantRule.conditions.funding_typical}
                          </span>
                          <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            Deadline: {relevantRule.conditions.application_deadline_range}
                          </span>
                        </div>
                      </div>
                    {/if}
                  {/if}
                {/if}
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p class="text-sm font-medium text-gray-600 mb-1">Next Steps:</p>
                    <ul class="text-sm text-gray-700 space-y-1">
                      {#each assessment.requirements as req}
                        <li class="flex items-start gap-2">
                          <svg class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                          </svg>
                          {req}
                        </li>
                      {/each}
                    </ul>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-600 mb-1">You'll Need to Cover:</p>
                    <p class="text-sm font-semibold text-gray-900">{assessment.outOfPocketCosts}</p>
                    <p class="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Lightbulb class="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                      Scholarship covers tuition
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onclick={() => selectedCountry = selectedCountry === assessment.country ? null : assessment.country}
                  class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  {selectedCountry === assessment.country ? 'Hide' : 'View'} Success Stories
                  <svg class="w-4 h-4 transition-transform {selectedCountry === assessment.country ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {#if selectedCountry === assessment.country}
                  <div class="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 class="font-semibold text-gray-900 mb-3">Recent Success Stories:</h4>
                    <div class="space-y-3">
                      {#each getCountryExamples(assessment.country) as example}
                        <div class="flex items-start gap-3 p-3 bg-white rounded border border-gray-200">
                          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span class="text-blue-600 font-bold">{example.name.charAt(0)}</span>
                          </div>
                          <div class="flex-1">
                            <p class="font-medium text-gray-900">{example.name} <span class="text-gray-500 text-sm">from {example.from}</span></p>
                            <p class="text-sm text-gray-600">GPA: {example.gpa} • Accepted: {example.accepted}</p>
                            <p class="text-sm text-green-600 font-medium">Scholarship: {example.scholarship}</p>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Needs Work Countries -->
      {#if results.needsWork.length > 0}
        <div class="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle class="w-7 h-7 text-yellow-600" />
                Improve to Get Funded
              </h2>
              <p class="text-gray-600 mb-2">Strengthen these areas to access scholarships</p>
              <p class="text-sm text-gray-500">
                <strong>What this means:</strong> You're close! Scholarships are still available, but you need to strengthen your profile first. 
                Follow the steps below to improve your chances.
              </p>
            </div>
          </div>
          
          <!-- Quick Action CTA -->
              <div class="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold text-yellow-900 mb-1">Need help improving your profile?</p>
                    <p class="text-sm text-yellow-700">Open your Strategy Pack to see ranked matches and next steps</p>
              </div>
              <a
                    href="/auth?signup=true&source=diagnostic&next=/plan"
                class="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
              >
                    Open Strategy Pack →
              </a>
            </div>
          </div>
          
          <div class="space-y-4">
            {#each results.needsWork as assessment}
              <div class="border-2 border-yellow-200 rounded-lg p-5">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">{assessment.country}</h3>
                    <p class="text-yellow-700 mt-1">{assessment.reason}</p>
                  </div>
                  <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    Work Needed
                  </span>
                </div>
                
                <!-- Scholarship Potential -->
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                  <p class="text-sm font-bold text-yellow-900 mb-2 flex items-center gap-2">
                    <Wallet class="w-5 h-5" /> Funding Still Available:
                  </p>
                  <ul class="text-sm text-yellow-800 space-y-1">
                    {#each assessment.scholarshipTypes as scholarship}
                      <li class="flex items-start gap-2">
                        <svg class="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        {scholarship}
                      </li>
                    {/each}
                  </ul>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm font-medium text-gray-600 mb-1">What to Improve:</p>
                    <ul class="text-sm text-gray-700 space-y-1">
                      {#each assessment.requirements as req}
                        <li class="flex items-start gap-2">
                          <svg class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                          </svg>
                          {req}
                        </li>
                      {/each}
                    </ul>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-600 mb-1">Your Out-of-Pocket:</p>
                    <p class="text-sm font-semibold text-gray-900">{assessment.outOfPocketCosts}</p>
                    <p class="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Lightbulb class="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                      After scholarship covers tuition
                    </p>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Unrealistic Countries -->
      {#if results.unrealistic.length > 0}
        <div class="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <XCircle class="w-7 h-7 text-red-600" />
                Currently Unrealistic
              </h2>
              <p class="text-gray-600">Consider alternative paths or significant improvement</p>
            </div>
          </div>
          
          <div class="space-y-4">
            {#each results.unrealistic as assessment}
              <div class="border-2 border-red-200 rounded-lg p-5">
                <h3 class="text-lg font-bold text-gray-900 mb-2">{assessment.country}</h3>
                <p class="text-red-700 mb-3">{assessment.reason}</p>
                
                <div>
                  <p class="text-sm font-medium text-gray-600 mb-1">Significant Improvements Needed:</p>
                  <ul class="text-sm text-gray-700 space-y-1">
                    {#each assessment.requirements as req}
                      <li class="flex items-start gap-2">
                        <svg class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                        {req}
                      </li>
                    {/each}
                  </ul>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- Recommendations -->
      {#if results.recommendations.length > 0}
        <div class="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-sm p-8 mb-6">
          <div class="pointer-events-none absolute inset-0">
            <div class="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-indigo-200/35 blur-3xl"></div>
            <div class="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-violet-200/25 blur-3xl"></div>
          </div>
          <div class="relative">
            <div class="flex items-center gap-3 mb-4">
              <div class="h-12 w-12 rounded-2xl border border-slate-200 bg-white/70 flex items-center justify-center">
                <Lightbulb class="w-6 h-6 text-indigo-700" />
              </div>
              <div>
                <h2 class="text-2xl font-bold text-slate-900">Your action plan</h2>
                <p class="text-sm text-slate-600">Follow these steps to increase your funding chances.</p>
              </div>
            </div>
            <div class="space-y-3">
              {#each results.recommendations as recommendation, index}
                <div class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-4">
                  <div class="w-8 h-8 bg-[#2C3580] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    {index + 1}
                  </div>
                  <p class="text-slate-700 text-base leading-relaxed">{recommendation}</p>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
      
      <!-- STRATEGY PACK PREVIEW -->
      <div class="bg-white/80 backdrop-blur rounded-3xl border border-slate-200 shadow-sm p-8 mb-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              Strategy Pack preview
            </div>
            <h2 class="mt-5 text-2xl md:text-3xl font-bold text-slate-900">
              What you’ll see next inside your Strategy Pack
            </h2>
            <p class="mt-3 text-slate-600 leading-relaxed">
              These diagnostic results are your free plan preview. The Strategy Pack turns it into a saved, ranked, step-by-step page with timelines and next actions.
            </p>

            <div class="mt-6 space-y-3 text-sm text-slate-700">
              <div class="flex items-start gap-3">
                <div class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle class="w-4 h-4" />
                </div>
                <div><strong>Scholarships</strong> ranked for your profile (not just a long list)</div>
              </div>
              <div class="flex items-start gap-3">
                <div class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle class="w-4 h-4" />
                </div>
                <div><strong>Universities</strong> grouped into safety / target / reach</div>
              </div>
              <div class="flex items-start gap-3">
                <div class="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle class="w-4 h-4" />
                </div>
                <div><strong>Timeline</strong> with the next steps you should take first</div>
              </div>
            </div>

            <div class="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="/plan"
                class="inline-flex items-center justify-center rounded-xl bg-[#2C3580] px-7 py-3.5 text-base font-bold text-white hover:bg-[#3c4d9c] transition-all shadow-lg shadow-indigo-900/10"
              >
                Continue in Strategy Pack →
              </a>
              <a
                href="/pricing"
                class="inline-flex items-center justify-center rounded-xl border-2 border-[#2C3580] bg-white px-7 py-3.5 text-base font-semibold text-[#2C3580] hover:bg-slate-50 transition-all"
              >
                Compare plans
              </a>
            </div>
            <p class="mt-3 text-xs text-slate-500">
              You’ll be prompted to sign up/log in to save your Strategy Pack.
            </p>
          </div>

          <div class="relative">
            <div class="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/35 via-violet-200/20 to-emerald-100/10 blur-2xl"></div>
            <div class="relative rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-6">
              <div class="flex items-center justify-between">
                <div class="text-sm font-semibold text-slate-800">Preview for {getPreviewCountry()}</div>
                <div class="text-xs text-slate-500">Sample sections</div>
              </div>

              <div class="mt-4 grid grid-cols-1 gap-3">
                <!-- Scholarships -->
                <div class="rounded-2xl border border-slate-200 bg-white p-4">
                  <div class="flex items-center justify-between">
                    <div class="text-xs font-semibold text-slate-500">Scholarships (examples)</div>
                    <div class="text-xs text-slate-500">Ranked in Strategy Pack</div>
                  </div>
                  <div class="mt-2 space-y-2">
                    {#each getStrategyPackScholarshipPreview() as item}
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <div class="text-sm font-semibold text-slate-900 truncate">{item.title}</div>
                          <div class="text-xs text-slate-500 truncate">{item.meta}</div>
                        </div>
                        <span class="shrink-0 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 text-xs font-semibold">
                          Preview
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>

                <!-- Universities -->
                <div class="rounded-2xl border border-slate-200 bg-white p-4">
                  <div class="text-xs font-semibold text-slate-500">University plan</div>
                  <div class="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div class="rounded-xl border border-emerald-100 bg-emerald-50 px-2 py-2 text-emerald-800 font-semibold text-center">Safety</div>
                    <div class="rounded-xl border border-sky-100 bg-sky-50 px-2 py-2 text-sky-800 font-semibold text-center">Target</div>
                    <div class="rounded-xl border border-amber-100 bg-amber-50 px-2 py-2 text-amber-800 font-semibold text-center">Reach</div>
                  </div>
                  <p class="mt-2 text-xs text-slate-500">
                    Your Strategy Pack will fill these with real universities matched to your profile.
                  </p>
                </div>

                <!-- Timeline -->
                <div class="rounded-2xl border border-slate-200 bg-white p-4">
                  <div class="text-xs font-semibold text-slate-500">Timeline (preview)</div>
                  {#if getStrategyPackTimelinePreview().length > 0}
                    <div class="mt-2 space-y-2 text-sm text-slate-700">
                      {#each getStrategyPackTimelinePreview() as t}
                        <div class="flex items-start justify-between gap-3">
                          <span class="min-w-0">{t.what}</span>
                          <span class="text-xs text-slate-500 whitespace-nowrap">{t.when}</span>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <p class="mt-2 text-sm text-slate-700">
                      Your Strategy Pack will generate a simple timeline of next steps once your plan is saved.
                    </p>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-sm p-8 md:p-10 text-center">
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl"></div>
          <div class="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl"></div>
        </div>
        <div class="relative">
          <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm mb-4">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            Next step
          </div>
          <h2 class="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Continue in your Strategy Pack</h2>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">
            This is your free plan preview. Open your Strategy Pack to save it and see ranked scholarships + universities, timelines, and next steps.
          </p>

          <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/plan"
              class="inline-flex items-center justify-center rounded-xl bg-[#2C3580] px-8 py-4 text-base font-bold text-white hover:bg-[#3c4d9c] transition-all shadow-lg shadow-indigo-900/10"
            >
              Continue in Strategy Pack
            </a>
            <a
              href="/diagnostic"
              class="inline-flex items-center justify-center rounded-xl border-2 border-[#2C3580] bg-white px-8 py-4 text-base font-semibold text-[#2C3580] hover:bg-slate-50 transition-all"
            >
              Retake assessment
            </a>
          </div>

          <p class="mt-4 text-sm text-slate-600">
            You’ll be prompted to sign up/log in to save your plan.
          </p>

          <div class="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
            <span class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5">
              <CheckCircle class="w-4 h-4 text-emerald-600" />
              Free to start
            </span>
            <span class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5">
              <CheckCircle class="w-4 h-4 text-emerald-600" />
              Save progress
            </span>
            <span class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5">
              <CheckCircle class="w-4 h-4 text-emerald-600" />
              Tools + scholarships in one place
            </span>
          </div>
        </div>
      </div>
      
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white flex items-center justify-center px-6">
    <div class="text-center max-w-md mx-auto px-4">
      <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-slate-900 mb-2">Results not found</h2>
      <p class="text-slate-600 mb-6">
        We couldn't load your assessment results. This might happen if you refreshed the page or came here directly.
      </p>
      <a href="/diagnostic" class="inline-block px-6 py-3 bg-[#2C3580] text-white rounded-xl font-semibold hover:bg-[#3c4d9c] transition-colors shadow-sm">
        Take Assessment Again
      </a>
    </div>
  </div>
{/if}
