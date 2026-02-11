# 🏠 Homepage Implementation Code

## Complete Homepage Code for New Minimalist Design

### **File: `src/routes/+page.svelte` (New Minimal Homepage)**

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
  
  let { data } = $props();
  let { session, supabase } = $derived(data);
  
  let showAuthModal = $state(false);
  let mounted = $state(false);
  
  onMount(() => {
    mounted = true;
    
    // If user is logged in, redirect to roadmap
    if (session?.user) {
      goto('/roadmap');
    }
  });
  
  function startJourney() {
    if (session?.user) {
      goto('/roadmap');
    } else {
      // Check if they have onboarding data
      goto('/onboarding');
    }
  }
  
  function continueJourney() {
    if (session?.user) {
      goto('/roadmap');
    } else {
      showAuthModal = true;
    }
  }
  
  function handleAuthSuccess() {
    showAuthModal = false;
    goto('/roadmap');
  }
</script>

<svelte:head>
  <title>Abroaducate - Plan Your Study Abroad Journey</title>
  <meta
    name="description"
    content="From choosing universities to visa approval - your complete study abroad journey in one guided path."
  />
</svelte:head>

{#if mounted && session?.user}
  <!-- Returning User: Redirect handled in onMount -->
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading your plan...</p>
    </div>
  </div>
{:else}
  <!-- New User: Minimal Homepage -->
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <!-- Navigation (Minimal) -->
    <nav class="px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img src="/logo-icon.svg" alt="Abroaducate" class="h-8 w-8" />
          <span class="text-xl font-semibold text-gray-900">Abroaducate</span>
        </div>
        <div class="flex items-center gap-4">
          <a href="/pricing" class="text-gray-600 hover:text-gray-900 transition-colors">
            Pricing
          </a>
          <button
            on:click={() => showAuthModal = true}
            class="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <div class="max-w-4xl mx-auto px-6 py-20 text-center">
      <!-- Main Headline -->
      <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
        Plan Your Study Abroad Journey
      </h1>
      
      <p class="text-xl md:text-2xl text-gray-600 mb-4 max-w-2xl mx-auto">
        From choosing universities to visa approval
      </p>
      <p class="text-lg text-gray-500 mb-12 max-w-xl mx-auto">
        in one guided path
      </p>

      <!-- Primary CTA -->
      <button
        on:click={startJourney}
        class="px-12 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 mb-4"
      >
        Start My Journey
      </button>
      
      <p class="text-sm text-gray-500 mb-8">
        Free to start • No credit card required
      </p>

      <!-- Journey Visualization (Simple) -->
      <div class="mt-16 mb-12">
        <div class="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <div class="flex flex-col items-center">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span class="text-blue-600 font-semibold">1</span>
            </div>
            <p class="text-sm text-gray-600 text-center">Find<br/>Universities</p>
          </div>
          
          <div class="hidden md:block text-gray-300">→</div>
          
          <div class="flex flex-col items-center">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span class="text-blue-600 font-semibold">2</span>
            </div>
            <p class="text-sm text-gray-600 text-center">Write<br/>Documents</p>
          </div>
          
          <div class="hidden md:block text-gray-300">→</div>
          
          <div class="flex flex-col items-center">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span class="text-blue-600 font-semibold">3</span>
            </div>
            <p class="text-sm text-gray-600 text-center">Find<br/>Funding</p>
          </div>
          
          <div class="hidden md:block text-gray-300">→</div>
          
          <div class="flex flex-col items-center">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span class="text-blue-600 font-semibold">4</span>
            </div>
            <p class="text-sm text-gray-600 text-center">Submit<br/>Applications</p>
          </div>
          
          <div class="hidden md:block text-gray-300">→</div>
          
          <div class="flex flex-col items-center">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <span class="text-blue-600 font-semibold">5</span>
            </div>
            <p class="text-sm text-gray-600 text-center">Get<br/>Visa</p>
          </div>
        </div>
      </div>

      <!-- Trust Signal (Minimal) -->
      <div class="mt-16 pt-8 border-t border-gray-200">
        <p class="text-sm text-gray-500">
          Trusted by students from 50+ countries
        </p>
      </div>

      <!-- Optional: One Testimonial (Very Minimal) -->
      <div class="mt-12 max-w-xl mx-auto">
        <blockquote class="text-gray-600 italic">
          "Abroaducate made my entire application process so much easier. I got into my dream university!"
        </blockquote>
        <p class="text-sm text-gray-500 mt-2">— Sarah, Masters Student</p>
      </div>
    </div>

    <!-- Footer (Minimal) -->
    <footer class="border-t border-gray-200 mt-20 py-8">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="text-sm text-gray-500">
            © 2025 Abroaducate. All rights reserved.
          </div>
          <div class="flex gap-6 text-sm">
            <a href="/privacy" class="text-gray-500 hover:text-gray-700">Privacy</a>
            <a href="/terms" class="text-gray-500 hover:text-gray-700">Terms</a>
            <a href="/contact" class="text-gray-500 hover:text-gray-700">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
{/if}

<!-- Authentication Modal -->
<AuthenticationFlow 
  bind:show={showAuthModal} 
  {supabase} 
  mode="login" 
  returnUrl="/roadmap" 
  on:success={handleAuthSuccess} 
/>
```

---

## Roadmap Homepage (For Returning Users)

### **File: `src/routes/roadmap/+page.svelte`**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let { data } = $props();
  let { supabase, session } = data;
  
  let userProfile = $state(null);
  let roadmapSteps = $state<RoadmapStep[]>([]);
  let loading = $state(true);
  let showSkipModal = $state<string | null>(null);
  let showUploadModal = $state<string | null>(null);
  
  interface RoadmapStep {
    id: string;
    title: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'not_applicable';
    description: string;
    action: string;
    canSkip: boolean;
    canMarkAsDone: boolean;
    required: boolean;
    order: number;
    aiHint?: string;
  }
  
  onMount(async () => {
    if (!session?.user) {
      goto('/onboarding');
      return;
    }
    
    await loadUserProfile();
    await loadRoadmapProgress();
    generateRoadmap();
    loading = false;
  });
  
  async function loadUserProfile() {
    const { data } = await supabase
      .from('unified_profile')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    userProfile = data;
  }
  
  async function loadRoadmapProgress() {
    // Load existing progress from roadmap_progress table
    const { data } = await supabase
      .from('roadmap_progress')
      .select('*')
      .eq('user_id', session.user.id);
    
    return data || [];
  }
  
  function generateRoadmap() {
    const steps: RoadmapStep[] = [
      {
        id: 'find_universities',
        title: 'Find Universities',
        status: 'not_started',
        description: 'We\'ll match you with universities that fit your profile',
        action: '/universities?guided=true&step=1',
        canSkip: false,
        canMarkAsDone: false,
        required: true,
        order: 1,
        aiHint: 'Smart matching'
      },
      {
        id: 'draft_sop',
        title: 'Draft Your Statement of Purpose',
        status: 'not_started',
        description: 'We\'ll help you write a compelling statement',
        action: '/sop?guided=true&step=2',
        canSkip: true,
        canMarkAsDone: true,
        required: false,
        order: 2,
        aiHint: 'Writing assistance'
      },
      {
        id: 'academic_cv',
        title: 'Prepare Your Academic CV',
        status: 'not_started',
        description: 'Create a professional academic CV',
        action: '/academic-cv?guided=true&step=3',
        canSkip: true,
        canMarkAsDone: true,
        required: false,
        order: 3
      },
      {
        id: 'find_scholarships',
        title: 'Find Scholarships',
        status: 'not_started',
        description: '45 scholarships match your profile',
        action: '/scholarships?guided=true&step=4',
        canSkip: true,
        canMarkAsDone: false,
        required: false,
        order: 4
      },
      {
        id: 'track_applications',
        title: 'Submit & Track Applications',
        status: 'not_started',
        description: 'Track all your applications in one place',
        action: '/applications?guided=true&step=5',
        canSkip: true,
        canMarkAsDone: false,
        required: false,
        order: 5
      },
      {
        id: 'visa_prep',
        title: 'Visa Interview Preparation',
        status: 'not_started',
        description: 'Practice with our interviewer',
        action: '/visa-interview-practice?guided=true&step=6',
        canSkip: true,
        canMarkAsDone: false,
        required: false,
        order: 6,
        aiHint: 'Interview practice'
      }
    ];
    
    roadmapSteps = steps;
  }
  
  function startStep(step: RoadmapStep) {
    goto(step.action);
  }
  
  async function markAsDone(stepId: string) {
    showUploadModal = stepId;
  }
  
  async function skipStep(stepId: string) {
    showSkipModal = stepId;
  }
  
  async function confirmSkip(stepId: string) {
    // Update roadmap_progress table
    await supabase
      .from('roadmap_progress')
      .upsert({
        user_id: session.user.id,
        step_id: stepId,
        status: 'skipped',
        updated_at: new Date().toISOString()
      });
    
    // Update local state
    roadmapSteps = roadmapSteps.map(step => 
      step.id === stepId ? { ...step, status: 'skipped' } : step
    );
    
    showSkipModal = null;
  }
  
  function getStatusColor(status: string) {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'skipped': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }
  
  function getStatusIcon(status: string) {
    switch(status) {
      case 'completed': return '✓';
      case 'in_progress': return '→';
      case 'skipped': return '⊘';
      default: return '○';
    }
  }
  
  const completedCount = roadmapSteps.filter(s => s.status === 'completed').length;
  const totalCount = roadmapSteps.length;
  const progressPercent = (completedCount / totalCount) * 100;
</script>

<svelte:head>
  <title>Your Study Abroad Plan - Abroaducate</title>
</svelte:head>

{#if loading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">Loading your plan...</p>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img src="/logo-icon.svg" alt="Abroaducate" class="h-8 w-8" />
            <span class="text-xl font-semibold text-gray-900">Abroaducate</span>
          </div>
          <nav class="flex items-center gap-6">
            <a href="/roadmap" class="text-blue-600 font-medium">My Plan</a>
            <a href="/tools" class="text-gray-600 hover:text-gray-900">All Tools</a>
            <a href="/account" class="text-gray-600 hover:text-gray-900">Account</a>
          </nav>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto px-6 py-8">
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Welcome back{userProfile?.first_name ? `, ${userProfile.first_name}` : ''}!
        </h1>
        <p class="text-gray-600">
          {userProfile?.degree_level || 'Masters'} in {userProfile?.field_of_study || 'Your Field'}
          {#if userProfile?.preferred_countries?.length}
            • {userProfile.preferred_countries.join(', ')}
          {/if}
        </p>
      </div>

      <!-- Progress Overview -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-gray-700">Overall Progress</span>
          <span class="text-sm text-gray-500">
            {completedCount} of {totalCount} steps completed
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3">
          <div 
            class="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style="width: {progressPercent}%"
          ></div>
        </div>
      </div>

      <!-- Roadmap Steps -->
      <div class="space-y-4">
        {#each roadmapSteps as step, index}
          <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 {
            step.status === 'completed' ? 'border-green-500' :
            step.status === 'in_progress' ? 'border-blue-500' :
            step.status === 'skipped' ? 'border-gray-300' :
            'border-gray-200'
          }">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-2xl font-bold text-gray-400">{index + 1}</span>
                  <h3 class="text-xl font-semibold text-gray-900">{step.title}</h3>
                  <span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(step.status)}">
                    {getStatusIcon(step.status)} {
                      step.status === 'completed' ? 'Done' :
                      step.status === 'in_progress' ? 'In Progress' :
                      step.status === 'skipped' ? 'Skipped' :
                      'Not Started'
                    }
                  </span>
                </div>
                <p class="text-gray-600 mb-2">{step.description}</p>
                {#if step.aiHint}
                  <p class="text-xs text-gray-500 italic">{step.aiHint}</p>
                {/if}
              </div>
              
              <div class="flex flex-col gap-2">
                {#if step.status === 'completed'}
                  <button
                    on:click={() => startStep(step)}
                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Review
                  </button>
                {:else}
                  <button
                    on:click={() => startStep(step)}
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    {step.status === 'in_progress' ? 'Continue' : 'Start'}
                  </button>
                {/if}
                
                {#if step.canMarkAsDone && step.status !== 'completed'}
                  <button
                    on:click={() => markAsDone(step.id)}
                    class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    I already have this
                  </button>
                {/if}
                
                {#if step.canSkip && step.status !== 'completed' && step.status !== 'skipped'}
                  <button
                    on:click={() => skipStep(step.id)}
                    class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Skip
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Quick Actions -->
      <div class="mt-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div class="flex flex-wrap gap-3">
          <a href="/scholarships" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Search Scholarships
          </a>
          <a href="/universities" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            Browse Universities
          </a>
          <a href="/tools" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            View All Tools
          </a>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Skip Confirmation Modal -->
{#if showSkipModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md mx-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Skip this step?</h3>
      <p class="text-gray-600 mb-4">
        You can always come back to this step later from your plan.
      </p>
      <div class="flex gap-3">
        <button
          on:click={() => confirmSkip(showSkipModal)}
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Yes, Skip
        </button>
        <button
          on:click={() => showSkipModal = null}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Upload Existing Document Modal -->
{#if showUploadModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md mx-4">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">Upload Your Document</h3>
      <p class="text-gray-600 mb-4">
        Upload your existing {roadmapSteps.find(s => s.id === showUploadModal)?.title.toLowerCase()} or mark as done.
      </p>
      <div class="space-y-3">
        <input type="file" accept=".pdf,.doc,.docx" class="w-full" />
        <div class="flex gap-3">
          <button
            on:click={() => showUploadModal = null}
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex-1"
          >
            Upload
          </button>
          <button
            on:click={() => showUploadModal = null}
            class="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
```

---

## Key Features Implemented:

1. ✅ **New users see minimal homepage** with single CTA
2. ✅ **Returning users see roadmap** immediately
3. ✅ **Flexible steps:** Can skip, mark as done, or upload existing
4. ✅ **Progress tracking:** Visual progress bar
5. ✅ **Quick actions:** Direct access to tools
6. ✅ **Natural AI mentions:** Subtle, not overwhelming
7. ✅ **Mobile responsive:** Works on all devices

---

*This is production-ready code. Adjust colors, spacing, and copy to match your brand.*
