<script lang="ts">
  import { page } from '$app/stores';
  
  let { data } = $props<{ data: { session: any; supabase: any } }>();
  let { session, supabase } = $derived(data);

  // Dropdown state management
  let documentDropdownOpen = $state(false);
  let scholarshipsDropdownOpen = $state(false);
  let applicationsDropdownOpen = $state(false);
  let aiToolsDropdownOpen = $state(false);
  let mobileMenuOpen = $state(false);

  async function signInWithGoogle() {
    const currentPath = $page.url.pathname;
    const redirectUrl = `${location.origin}/auth/callback?next=${encodeURIComponent(currentPath)}`;
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // Close dropdowns when clicking outside
  function closeAllDropdowns() {
    documentDropdownOpen = false;
    scholarshipsDropdownOpen = false;
    applicationsDropdownOpen = false;
    aiToolsDropdownOpen = false;
  }
</script>

<svelte:window onclick={closeAllDropdowns} />

<header class="bg-[#0A192F] backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-md">
  <nav class="flex items-center justify-between p-4 mx-auto max-w-7xl">
    <!-- Brand Logo -->
    <a href="/" class="text-2xl font-bold text-white hover:text-blue-300 transition duration-300">
      Abroaducate
    </a>

    <!-- Desktop Navigation -->
    <div class="hidden lg:flex items-center space-x-8">
      <!-- Document Suite Dropdown -->
      <div class="relative">
        <button 
          onclick={(e) => {
            e.stopPropagation();
            documentDropdownOpen = !documentDropdownOpen;
            scholarshipsDropdownOpen = false;
            applicationsDropdownOpen = false;
            aiToolsDropdownOpen = false;
          }}
          class="flex items-center space-x-1 text-white hover:text-blue-300 transition duration-300"
        >
          <span>Document Suite</span>
          <svg class="w-4 h-4 transition-transform duration-200 {documentDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        {#if documentDropdownOpen}
          <div class="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            <a href="/sop" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">📝</span>
              <div>
                <div class="font-medium">Statements of Purpose</div>
                <div class="text-sm text-gray-500">Academic SOP generator</div>
              </div>
            </a>
            <a href="/cover-letters" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">💼</span>
              <div>
                <div class="font-medium">Cover Letters</div>
                <div class="text-sm text-gray-500">Professional cover letters</div>
              </div>
            </a>
            <a href="/personal-statements" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">💭</span>
              <div>
                <div class="font-medium">Personal Statements</div>
                <div class="text-sm text-gray-500">Application essays</div>
              </div>
            </a>
            <a href="/academic-cv" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">📋</span>
              <div>
                <div class="font-medium">Academic CVs</div>
                <div class="text-sm text-gray-500">Professional CV builder</div>
              </div>
            </a>
          </div>
        {/if}
      </div>

      <!-- Scholarships Dropdown -->
      <div class="relative">
        <button 
          onclick={(e) => {
            e.stopPropagation();
            scholarshipsDropdownOpen = !scholarshipsDropdownOpen;
            documentDropdownOpen = false;
            applicationsDropdownOpen = false;
            aiToolsDropdownOpen = false;
          }}
          class="flex items-center space-x-1 text-white hover:text-blue-300 transition duration-300"
        >
          <span>Scholarships</span>
          <svg class="w-4 h-4 transition-transform duration-200 {scholarshipsDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        {#if scholarshipsDropdownOpen}
          <div class="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            <a href="/scholarships" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🔍</span>
              <div>
                <div class="font-medium">Browse Scholarships</div>
                <div class="text-sm text-gray-500">Find opportunities</div>
              </div>
            </a>
            <a href="/universities" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🎯</span>
              <div>
                <div class="font-medium">University Matching</div>
                <div class="text-sm text-gray-500">Smart university + scholarship pairing</div>
              </div>
            </a>
            <a href="/universities/database" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🚀</span>
              <div>
                <div class="font-medium">Phase II Testing</div>
                <div class="text-sm text-gray-500">1000+ university database</div>
              </div>
            </a>
            <a href="/scholarships/my-applications" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">📊</span>
              <div>
                <div class="font-medium">My Applications</div>
                <div class="text-sm text-gray-500">Track progress</div>
              </div>
            </a>
          </div>
        {/if}
      </div>

      <!-- Applications Dropdown -->
      <div class="relative">
        <button 
          onclick={(e) => {
            e.stopPropagation();
            applicationsDropdownOpen = !applicationsDropdownOpen;
            documentDropdownOpen = false;
            scholarshipsDropdownOpen = false;
            aiToolsDropdownOpen = false;
          }}
          class="flex items-center space-x-1 text-white hover:text-blue-300 transition duration-300"
        >
          <span>Applications</span>
          <svg class="w-4 h-4 transition-transform duration-200 {applicationsDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        {#if applicationsDropdownOpen}
          <div class="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            <a href="/dashboard" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">📊</span>
              <div>
                <div class="font-medium">Dashboard</div>
                <div class="text-sm text-gray-500">Application overview</div>
              </div>
            </a>
            <a href="/calendar" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">📅</span>
              <div>
                <div class="font-medium">Calendar</div>
                <div class="text-sm text-gray-500">Deadlines & reminders</div>
              </div>
            </a>
            <a href="/universities" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🏫</span>
              <div>
                <div class="font-medium">University Matching</div>
                <div class="text-sm text-gray-500">Find the right fit</div>
              </div>
            </a>
            <a href="/gpa-converter" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🧮</span>
              <div>
                <div class="font-medium">GPA Converter</div>
                <div class="text-sm text-gray-500">50+ African countries - 100% FREE</div>
              </div>
              <span class="ml-auto px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">FREE</span>
            </a>
            <a href="/academic-analyzer" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🎯</span>
              <div>
                <div class="font-medium">Academic Profile Analyzer</div>
                <div class="text-sm text-gray-500">Quick assessment + detailed analysis</div>
              </div>
              <span class="ml-auto px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">NEW</span>
            </a>
          </div>
        {/if}
      </div>

      <!-- AI Tools Dropdown -->
      <div class="relative">
        <button 
          onclick={(e) => {
            e.stopPropagation();
            aiToolsDropdownOpen = !aiToolsDropdownOpen;
            documentDropdownOpen = false;
            scholarshipsDropdownOpen = false;
            applicationsDropdownOpen = false;
          }}
          class="flex items-center space-x-1 text-white hover:text-blue-300 transition duration-300"
        >
          <span>AI Tools</span>
          <svg class="w-4 h-4 transition-transform duration-200 {aiToolsDropdownOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        {#if aiToolsDropdownOpen}
          <div class="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            <!-- Featured: AI Hub -->
            <a href="/ai-features-demo" class="flex items-center px-4 py-4 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition duration-200 border-b border-gray-100 mb-2">
              <span class="text-xl mr-3">🤖</span>
              <div class="flex-1">
                <div class="font-semibold text-base">AI Features Hub</div>
                <div class="text-sm text-gray-500">Try all tools in one place</div>
              </div>
              <span class="ml-2 px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full">NEW</span>
            </a>
            
            <!-- Quick Access Tools -->
            <div class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Quick Access</div>
            
            <a href="/text-enhancement" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">✨</span>
              <div>
                <div class="font-medium">Text Enhancement</div>
                <div class="text-sm text-gray-500">Grammar, style & clarity</div>
              </div>
            </a>
            
            <a href="/sop-review" class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition duration-200">
              <span class="text-lg mr-3">🔍</span>
              <div>
                <div class="font-medium">Document Review</div>
                <div class="text-sm text-gray-500">Comprehensive analysis</div>
              </div>
            </a>
            
            <!-- More Tools Link -->
            <div class="border-t border-gray-100 mt-2 pt-2">
              <a href="/ai-features-demo" class="flex items-center px-4 py-3 text-blue-600 hover:bg-blue-50 transition duration-200">
                <span class="text-lg mr-3">🔧</span>
                <div>
                  <div class="font-medium">More AI Tools</div>
                  <div class="text-sm text-blue-500">Word optimization, cold emails & more</div>
                </div>
                <span class="ml-auto">→</span>
              </a>
            </div>

          </div>
        {/if}
      </div>

      <!-- Pricing -->
      <a href="/pricing" class="text-white hover:text-blue-300 transition duration-300">
        Pricing
      </a>
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
            onclick={() => {
              if (typeof document !== 'undefined') {
                const formSection = document.getElementById('form-section');
                if (formSection) {
                  formSection.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out"
          >
            Get Started
          </button>
          <button onclick={signInWithGoogle} class="px-4 py-2 text-sm font-medium text-white bg-transparent border border-white rounded-md hover:bg-white hover:text-[#0A192F] flex items-center space-x-3 transition duration-300 ease-in-out">
            <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google G Logo" class="w-4 h-4">
            Login
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

  <!-- Mobile Menu -->
  {#if mobileMenuOpen}
    <div class="lg:hidden bg-[#0A192F] border-t border-gray-700">
      <div class="px-4 py-2 space-y-1">
        <!-- Mobile Document Suite -->
        <details class="group">
          <summary class="flex items-center justify-between py-2 text-white hover:text-blue-300 cursor-pointer">
            <span>Document Suite</span>
            <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <div class="pl-4 space-y-1">
            <a href="/sop" class="block py-2 text-gray-300 hover:text-white transition duration-300">📝 Statements of Purpose</a>
            <a href="/cover-letters" class="block py-2 text-gray-300 hover:text-white transition duration-300">💼 Cover Letters</a>
            <a href="/personal-statements" class="block py-2 text-gray-300 hover:text-white transition duration-300">💭 Personal Statements</a>
            <a href="/academic-cv" class="block py-2 text-gray-300 hover:text-white transition duration-300">📋 Academic CVs</a>
          </div>
        </details>

        <!-- Mobile Scholarships -->
        <details class="group">
          <summary class="flex items-center justify-between py-2 text-white hover:text-blue-300 cursor-pointer">
            <span>Scholarships</span>
            <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <div class="pl-4 space-y-1">
            <a href="/scholarships" class="block py-2 text-gray-300 hover:text-white transition duration-300">🔍 Browse Scholarships</a>
            <a href="/universities" class="block py-2 text-gray-300 hover:text-white transition duration-300">🎯 University Matching</a>
            <a href="/scholarships/my-applications" class="block py-2 text-gray-300 hover:text-white transition duration-300">📊 My Applications</a>
          </div>
        </details>

        <!-- Mobile Applications -->
        <details class="group">
          <summary class="flex items-center justify-between py-2 text-white hover:text-blue-300 cursor-pointer">
            <span>Applications</span>
            <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <div class="pl-4 space-y-1">
            <a href="/dashboard" class="block py-2 text-gray-300 hover:text-white transition duration-300">📊 Dashboard</a>
            <a href="/calendar" class="block py-2 text-gray-300 hover:text-white transition duration-300">📅 Calendar</a>
            <a href="/universities" class="block py-2 text-gray-300 hover:text-white transition duration-300">🏫 University Matching</a>
            <a href="/gpa-converter" class="block py-2 text-gray-300 hover:text-white transition duration-300">🌍 GPA Converter <span class="ml-2 px-2 py-1 text-xs bg-green-600 text-white rounded-full">FREE</span></a>
          </div>
        </details>

        <!-- Mobile AI Tools -->
        <details class="group">
          <summary class="flex items-center justify-between py-2 text-white hover:text-blue-300 cursor-pointer">
            <span>AI Tools</span>
            <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <div class="pl-4 space-y-1">
            <a href="/ai-features-demo" class="block py-2 text-blue-300 hover:text-white transition duration-300">🤖 AI Features Hub</a>
            <a href="/sop-review" class="block py-2 text-gray-300 hover:text-white transition duration-300">🔍 Document Review</a>
            <a href="/text-enhancement" class="block py-2 text-gray-300 hover:text-white transition duration-300">✨ Text Enhancement</a>
            <a href="/word-optimization" class="block py-2 text-gray-300 hover:text-white transition duration-300">📝 Word Optimization</a>
            <a href="/cold-email-generator" class="block py-2 text-gray-300 hover:text-white transition duration-300">📧 Cold Email Generator</a>
            <a href="/visa-interview-practice" class="block py-2 text-gray-300 hover:text-white transition duration-300">🎯 Visa Interview Practice</a>
          </div>
        </details>

        <!-- Mobile Pricing -->
        <a href="/pricing" class="block py-2 text-white hover:text-blue-300 transition duration-300">Pricing</a>

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
              onclick={() => {
                if (typeof document !== 'undefined') {
                  const formSection = document.getElementById('form-section');
                  if (formSection) {
                    formSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }
                mobileMenuOpen = false;
              }}
              class="block w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-300"
            >
              Get Started
            </button>
            <button onclick={signInWithGoogle} class="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-transparent border border-white rounded-md hover:bg-white hover:text-[#0A192F] transition duration-300 space-x-2">
              <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google G Logo" class="w-4 h-4">
              <span>Login</span>
            </button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</header> 