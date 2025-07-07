<script lang="ts">
  import { page } from '$app/stores';
  import AuthenticationFlow from './AuthenticationFlow.svelte';
  
  let { data } = $props<{ data: { session: any; supabase: any } }>();
  let { session, supabase } = $derived(data);

  // Journey-based dropdown state management
  let startJourneyDropdownOpen = $state(false);
  let prepareDocsDropdownOpen = $state(false);
  let findFundingDropdownOpen = $state(false);
  let submitAppsDropdownOpen = $state(false);
  let nextStepsDropdownOpen = $state(false);
  let mobileMenuOpen = $state(false);
  let showAuthModal = $state(false);
  let authMode = $state<'login' | 'signup'>('login');

  function showLogin() {
    authMode = 'login';
    showAuthModal = true;
    mobileMenuOpen = false; // Close mobile menu if open
  }

  function showSignup() {
    authMode = 'signup';
    showAuthModal = true;
    mobileMenuOpen = false; // Close mobile menu if open
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // Close dropdowns when clicking outside
  function closeAllDropdowns() {
    startJourneyDropdownOpen = false;
    prepareDocsDropdownOpen = false;
    findFundingDropdownOpen = false;
    submitAppsDropdownOpen = false;
    nextStepsDropdownOpen = false;
  }
</script>

<svelte:window onclick={closeAllDropdowns} />

<header class="bg-[#0A192F] backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-md">
  <nav class="flex items-center justify-between p-4 mx-auto max-w-7xl">
    <!-- Brand Logo -->
    <a href="/" class="text-2xl font-bold text-white hover:text-blue-300 transition duration-300">
      Abroaducate
    </a>

    <!-- Desktop Navigation - Journey Based -->
    <div class="hidden lg:flex items-center space-x-8">
      <!-- 1. Start Your Journey -->
      <div class="relative">
        <button 
          onclick={(e) => {
            e.stopPropagation();
            startJourneyDropdownOpen = !startJourneyDropdownOpen;
            prepareDocsDropdownOpen = false;
            findFundingDropdownOpen = false;
            submitAppsDropdownOpen = false;
            nextStepsDropdownOpen = false;
          }}
          class="flex items-center space-x-1 text-white hover:text-blue-300 transition duration-300"
        >
          <span>Start Journey</span>
          <svg class="w-4 h-4 transition-transform duration-200 {startJourneyDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        {#if startJourneyDropdownOpen}
          <div class="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            <div class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Exploration & Planning</div>
            <a href="/academic-analyzer" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🎯</span>
              <div>
                <div class="font-medium">Academic Profile Analyzer</div>
                <div class="text-sm text-gray-500">Assess your academic strengths</div>
              </div>
              <span class="ml-auto px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">NEW</span>
            </a>
            <a href="/gpa-converter" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🧮</span>
              <div>
                <div class="font-medium">GPA Converter</div>
                <div class="text-sm text-gray-500">40+ international grading systems</div>
              </div>
              <span class="ml-auto px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">FREE</span>
            </a>
            <a href="/universities" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🏫</span>
              <div>
                <div class="font-medium">University Matching</div>
                <div class="text-sm text-gray-500">Find your perfect academic fit</div>
              </div>
            </a>
            <a href="/universities/database" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🚀</span>
              <div>
                <div class="font-medium">University Database</div>
                <div class="text-sm text-gray-500">7,000+ universities worldwide</div>
              </div>
            </a>
            <a href="/test-prep" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">📝</span>
              <div>
                <div class="font-medium">Test Prep</div>
                <div class="text-sm text-gray-500">IELTS & other exams (study plans)</div>
              </div>
              <span class="ml-auto px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">NEW</span>
            </a>
          </div>
        {/if}
      </div>

      <!-- 2. Prepare Your Application -->
      <div class="relative">
        <button 
          onclick={(e) => {
            e.stopPropagation();
            prepareDocsDropdownOpen = !prepareDocsDropdownOpen;
            startJourneyDropdownOpen = false;
            findFundingDropdownOpen = false;
            submitAppsDropdownOpen = false;
            nextStepsDropdownOpen = false;
          }}
          class="flex items-center space-x-1 text-white hover:text-blue-300 transition duration-300"
        >
          <span>Prepare Docs</span>
          <svg class="w-4 h-4 transition-transform duration-200 {prepareDocsDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        {#if prepareDocsDropdownOpen}
          <div class="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            <div class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Document Generation</div>
            <a href="/sop" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">📄</span>
              <div>
                <div class="font-medium">Statement of Purpose</div>
                <div class="text-sm text-gray-500">4 types with AI assistance</div>
              </div>
            </a>
            <a href="/cover-letters" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">💼</span>
              <div>
                <div class="font-medium">Cover Letters</div>
                <div class="text-sm text-gray-500">Professional & academic templates</div>
              </div>
            </a>
            <a href="/personal-statements" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">💭</span>
              <div>
                <div class="font-medium">Personal Statements</div>
                <div class="text-sm text-gray-500">6 application types supported</div>
              </div>
            </a>
            <a href="/academic-cv" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">📋</span>
              <div>
                <div class="font-medium">Academic CV</div>
                <div class="text-sm text-gray-500">6 subject-specific templates</div>
              </div>
            </a>
            <div class="border-t border-gray-100 mt-2 pt-2">
              <div class="px-4 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">AI Enhancement</div>

              <a href="/ai-features-demo" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
                <span class="text-lg mr-3">🤖</span>
                <div>
                  <div class="font-medium">AI Tools Hub</div>
                  <div class="text-sm text-gray-500">Grammar, style, plagiarism & more</div>
                </div>
                <span class="ml-auto px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">6+ Tools</span>
              </a>
            </div>
          </div>
        {/if}
      </div>

      <!-- 3. Find Funding -->
      <div class="relative">
        <button 
          onclick={(e) => {
            e.stopPropagation();
            findFundingDropdownOpen = !findFundingDropdownOpen;
            startJourneyDropdownOpen = false;
            prepareDocsDropdownOpen = false;
            submitAppsDropdownOpen = false;
            nextStepsDropdownOpen = false;
          }}
          class="flex items-center space-x-1 text-white hover:text-blue-300 transition duration-300"
        >
          <span>Find Funding</span>
          <svg class="w-4 h-4 transition-transform duration-200 {findFundingDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        {#if findFundingDropdownOpen}
          <div class="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            <div class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Scholarships & Funding</div>
            <a href="/scholarships" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🔍</span>
              <div>
                <div class="font-medium">Browse Scholarships</div>
                <div class="text-sm text-gray-500">AI-powered scholarship matching</div>
              </div>
            </a>
            <a href="/universities" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🎯</span>
              <div>
                <div class="font-medium">University + Scholarship Pairing</div>
                <div class="text-sm text-gray-500">Integrated funding opportunities</div>
              </div>
            </a>
            <a href="/scholarships/my-applications" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">📊</span>
              <div>
                                  <div class="font-medium">Saved Scholarships</div>
                <div class="text-sm text-gray-500">Track funding applications</div>
              </div>
            </a>
          </div>
        {/if}
      </div>

      <!-- 4. Submit Applications -->
      <div class="relative">
        <button 
          onclick={(e) => {
            e.stopPropagation();
            submitAppsDropdownOpen = !submitAppsDropdownOpen;
            startJourneyDropdownOpen = false;
            prepareDocsDropdownOpen = false;
            findFundingDropdownOpen = false;
            nextStepsDropdownOpen = false;
          }}
          class="flex items-center space-x-1 text-white hover:text-blue-300 transition duration-300"
        >
          <span>Submit Apps</span>
          <svg class="w-4 h-4 transition-transform duration-200 {submitAppsDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        {#if submitAppsDropdownOpen}
          <div class="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            <div class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Application Management</div>
            <a href="/dashboard" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">📊</span>
              <div>
                <div class="font-medium">Application Dashboard</div>
                <div class="text-sm text-gray-500">Overview of all applications</div>
              </div>
            </a>
            <a href="/applications" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">📋</span>
              <div>
                <div class="font-medium">Application Tracker</div>
                <div class="text-sm text-gray-500">Track status & deadlines</div>
              </div>
            </a>

            <a href="/sop-review" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🔍</span>
              <div>
                <div class="font-medium">Document Review</div>
                <div class="text-sm text-gray-500">Final application reviews</div>
              </div>
            </a>
            <a href="/cold-email-generator" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">📧</span>
              <div>
                <div class="font-medium">Cold Email Generator</div>
                <div class="text-sm text-gray-500">Connect with professors</div>
              </div>
            </a>
          </div>
        {/if}
      </div>

      <!-- 5. Next Steps -->
      <div class="relative">
        <button 
          onclick={(e) => {
            e.stopPropagation();
            nextStepsDropdownOpen = !nextStepsDropdownOpen;
            startJourneyDropdownOpen = false;
            prepareDocsDropdownOpen = false;
            findFundingDropdownOpen = false;
            submitAppsDropdownOpen = false;
          }}
          class="flex items-center space-x-1 text-white hover:text-blue-300 transition duration-300"
        >
          <span>Next Steps</span>
          <svg class="w-4 h-4 transition-transform duration-200 {nextStepsDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        {#if nextStepsDropdownOpen}
          <div class="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            <div class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Post-Application Support</div>
            <a href="/document-checklists" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">📋</span>
              <div>
                <div class="font-medium">Document Checklists</div>
                <div class="text-sm text-gray-500">Never miss a document again</div>
              </div>
            </a>
            <a href="/visa-interview-practice" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🎯</span>
              <div>
                <div class="font-medium">Visa Interview Practice</div>
                <div class="text-sm text-gray-500">AI-powered F-1 visa prep</div>
              </div>
            </a>

          </div>
        {/if}
      </div>

    </div>

    <!-- Auth Buttons -->
    <div class="flex items-center space-x-4">
      {#if session}
        <div class="hidden lg:flex items-center space-x-2">
          <a href="/dashboard" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out">
            Dashboard
          </a>
          <a href="/account" class="px-4 py-2 text-sm font-medium text-white bg-transparent border border-white rounded-md hover:bg-white hover:text-[#0A192F] transition duration-300 ease-in-out">
            Account
          </a>
        </div>
      {:else}
        <div class="hidden lg:flex items-center space-x-2">
          <button 
            onclick={showLogin}
            class="px-4 py-2 text-sm font-medium text-white bg-transparent border border-white rounded-md hover:bg-white hover:text-[#0A192F] transition duration-300 ease-in-out"
          >
            Login
          </button>
          <button 
            onclick={showSignup}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out"
          >
            Create Account
          </button>
        </div>
      {/if}

      <!-- Mobile Menu Button -->
      <button 
        onclick={() => mobileMenuOpen = !mobileMenuOpen}
        class="lg:hidden text-white hover:text-blue-300 transition duration-300"
        aria-label="Toggle mobile menu"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
        </svg>
      </button>
    </div>
  </nav>

  <!-- Mobile Menu - Journey Based -->
  {#if mobileMenuOpen}
    <div class="lg:hidden bg-[#0A192F] border-t border-gray-700">
      <div class="px-4 py-2 space-y-1">
        <!-- Mobile Start Journey -->
        <details class="group">
          <summary class="flex items-center justify-between py-2 text-white hover:text-blue-300 cursor-pointer">
            <span>Start Journey</span>
            <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <div class="pl-4 space-y-1">
            <a href="/academic-analyzer" class="block py-2 text-gray-300 hover:text-white transition duration-300">Academic Profile Analyzer</a>
            <a href="/gpa-converter" class="block py-2 text-gray-300 hover:text-white transition duration-300">GPA Converter</a>
            <a href="/universities" class="block py-2 text-gray-300 hover:text-white transition duration-300">University Matching</a>
            <a href="/test-prep" class="block py-2 text-gray-300 hover:text-white transition duration-300">Test Prep</a>
          </div>
        </details>

        <!-- Mobile Prepare Docs -->
        <details class="group">
          <summary class="flex items-center justify-between py-2 text-white hover:text-blue-300 cursor-pointer">
            <span>Prepare Docs</span>
            <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <div class="pl-4 space-y-1">
            <a href="/sop" class="block py-2 text-gray-300 hover:text-white transition duration-300">Statement of Purpose</a>
            <a href="/cover-letters" class="block py-2 text-gray-300 hover:text-white transition duration-300">Cover Letters</a>
            <a href="/personal-statements" class="block py-2 text-gray-300 hover:text-white transition duration-300">Personal Statements</a>
            <a href="/academic-cv" class="block py-2 text-gray-300 hover:text-white transition duration-300">Academic CV</a>
            <a href="/sop-review" class="block py-2 text-gray-300 hover:text-white transition duration-300">Document Review</a>
            <a href="/ai-features-demo" class="block py-2 text-blue-300 hover:text-white transition duration-300">AI Tools Hub</a>
          </div>
        </details>

        <!-- Mobile Find Funding -->
        <details class="group">
          <summary class="flex items-center justify-between py-2 text-white hover:text-blue-300 cursor-pointer">
            <span>Find Funding</span>
            <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <div class="pl-4 space-y-1">
            <a href="/scholarships" class="block py-2 text-gray-300 hover:text-white transition duration-300">Browse Scholarships</a>
            <a href="/universities" class="block py-2 text-gray-300 hover:text-white transition duration-300">University + Scholarship Pairing</a>
            <a href="/scholarships/my-applications" class="block py-2 text-gray-300 hover:text-white transition duration-300">My Applications</a>
          </div>
        </details>

        <!-- Mobile Submit Apps -->
        <details class="group">
          <summary class="flex items-center justify-between py-2 text-white hover:text-blue-300 cursor-pointer">
            <span>Submit Apps</span>
            <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <div class="pl-4 space-y-1">
            <a href="/dashboard" class="block py-2 text-gray-300 hover:text-white transition duration-300">Dashboard</a>
            <a href="/applications" class="block py-2 text-gray-300 hover:text-white transition duration-300">Application Tracker</a>

            <a href="/sop-review" class="block py-2 text-gray-300 hover:text-white transition duration-300">Document Review</a>
            <a href="/cold-email-generator" class="block py-2 text-gray-300 hover:text-white transition duration-300">Cold Email Generator</a>
          </div>
        </details>

        <!-- Mobile Next Steps -->
        <details class="group">
          <summary class="flex items-center justify-between py-2 text-white hover:text-blue-300 cursor-pointer">
            <span>Next Steps</span>
            <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <div class="pl-4 space-y-1">
            <a href="/document-checklists" class="block py-2 text-gray-300 hover:text-white transition duration-300">Document Checklists</a>
            <a href="/visa-interview-practice" class="block py-2 text-gray-300 hover:text-white transition duration-300">Visa Interview Practice</a>

          </div>
        </details>

        <!-- Mobile Auth Buttons -->
        {#if session}
          <div class="pt-2 border-t border-gray-700 space-y-2">
            <a href="/dashboard" class="block w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-300 text-center">
              Dashboard
            </a>
            <a href="/account" class="block w-full px-4 py-2 text-sm font-medium text-white bg-transparent border border-white rounded-md hover:bg-white hover:text-[#0A192F] transition duration-300 text-center">
              Account
            </a>
          </div>
        {:else}
          <div class="pt-2 border-t border-gray-700 space-y-2">
            <button 
              onclick={showLogin}
              class="block w-full px-4 py-2 text-sm font-medium text-white bg-transparent border border-white rounded-md hover:bg-white hover:text-[#0A192F] transition duration-300 text-center"
            >
              Login
            </button>
            <button 
              onclick={showSignup}
              class="block w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-300 text-center"
            >
              Create Account
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</header>

<!-- Authentication Modal -->
<AuthenticationFlow 
  bind:show={showAuthModal} 
  {supabase} 
  mode={authMode} 
  returnUrl={$page.url.pathname}
/> 
/> 