<script lang="ts">
  import { goto } from '$app/navigation';
  
  let { data } = $props();
  let { session, supabase } = $derived(data);

  async function signInWithGoogle() {
    const redirectUrl = `${location.origin}/auth/callback?next=${encodeURIComponent('/dashboard')}`;
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    });
  }

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<svelte:head>
  <title>Abroaducate - Your Complete Academic Application Platform</title>
  <meta name="description" content="Generate SOPs, cover letters, track applications, find scholarships, and optimize your academic journey with AI-powered tools." />
</svelte:head>

<div class="bg-white">
  <!-- Hero Section -->
  <section class="pt-20 pb-16 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h1 class="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Your Complete <br/>
          <span class="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Academic Application
          </span><br/>
          Platform
        </h1>
        
        <p class="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
          From SOP generation to scholarship tracking, Abroaducate provides everything you need 
          to succeed in your academic journey with AI-powered assistance.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          {#if session}
            <a href="/dashboard" class="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 shadow-lg">
              Go to Dashboard
            </a>
          {:else}
            <button 
              onclick={signInWithGoogle}
              class="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 shadow-lg flex items-center space-x-3"
            >
              <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google" class="w-6 h-6">
              <span>Get Started Free</span>
            </button>
          {/if}
          
          <button 
            onclick={() => scrollToSection('features')}
            class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-900 transition duration-300"
          >
            Explore Features
          </button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div class="text-3xl font-bold text-white">50K+</div>
            <div class="text-blue-200">Documents Generated</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-white">10K+</div>
            <div class="text-blue-200">Students Helped</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-white">500+</div>
            <div class="text-blue-200">Universities</div>
          </div>
          <div>
            <div class="text-3xl font-bold text-white">95%</div>
            <div class="text-blue-200">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 5 Core Features Section -->
  <section id="features" class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          Everything You Need in One Platform
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Streamline your academic application process with our comprehensive suite of AI-powered tools
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <!-- Document Suite -->
        <div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-gray-100">
          <div class="text-4xl mb-4">📝</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-4">Document Suite</h3>
          <p class="text-gray-600 mb-6">
            Generate professional SOPs, cover letters, personal statements, and academic CVs with AI assistance
          </p>
          <ul class="space-y-2 mb-6">
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Statement of Purpose Generator
            </li>
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Cover Letter Builder
            </li>
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Academic CV Creator
            </li>
          </ul>
          <a href="/sop" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-300 inline-block">
            Start Creating →
          </a>
        </div>

        <!-- Scholarships -->
        <div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-gray-100">
          <div class="text-4xl mb-4">🎓</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-4">Scholarships</h3>
          <p class="text-gray-600 mb-6">
            Discover funding opportunities and track your scholarship applications with intelligent matching
          </p>
          <ul class="space-y-2 mb-6">
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              AI-Powered Matching
            </li>
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Application Tracking
            </li>
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Deadline Reminders
            </li>
          </ul>
          <a href="/scholarships" class="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition duration-300 inline-block">
            Browse Scholarships →
          </a>
        </div>

        <!-- Applications -->
        <div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-gray-100">
          <div class="text-4xl mb-4">📊</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-4">Applications</h3>
          <p class="text-gray-600 mb-6">
            Manage your entire application process with dashboards, calendars, and university matching
          </p>
          <ul class="space-y-2 mb-6">
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Smart Dashboard
            </li>
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Calendar Integration
            </li>
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              University Matching
            </li>
          </ul>
          <a href="/dashboard" class="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition duration-300 inline-block">
            View Dashboard →
          </a>
        </div>

        <!-- AI Tools -->
        <div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-gray-100">
          <div class="text-4xl mb-4">🤖</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-4">AI Tools</h3>
          <p class="text-gray-600 mb-6">
            Enhance your documents with AI-powered review, text optimization, and word count management
          </p>
          <ul class="space-y-2 mb-6">
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Document Review
            </li>
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7-293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Text Enhancement
            </li>
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Word Optimization
            </li>
          </ul>
          <a href="/sop-review" class="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition duration-300 inline-block">
            Try AI Tools →
          </a>
        </div>

        <!-- University Research -->
        <div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-gray-100">
          <div class="text-4xl mb-4">🏛️</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-4">University Research</h3>
          <p class="text-gray-600 mb-6">
            Discover the perfect universities with detailed profiles, rankings, and program information
          </p>
          <ul class="space-y-2 mb-6">
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              University Database
            </li>
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Program Comparison
            </li>
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Admission Requirements
            </li>
          </ul>
          <a href="/universities" class="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition duration-300 inline-block">
            Explore Universities →
          </a>
        </div>

        <!-- Pricing -->
        <div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition duration-300 border border-gray-100">
          <div class="text-4xl mb-4">💎</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-4">Flexible Pricing</h3>
          <p class="text-gray-600 mb-6">
            Choose the perfect plan for your academic journey, from free starter to unlimited professional
          </p>
          <ul class="space-y-2 mb-6">
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Free Starter Plan
            </li>
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              Professional Features
            </li>
            <li class="flex items-center text-gray-700">
              <svg class="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
              </svg>
              No Hidden Costs
            </li>
          </ul>
          <a href="/pricing" class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition duration-300 inline-block">
            View Pricing →
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works -->
  <section class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          How Abroaducate Works
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          A simple 3-step process to transform your academic application journey
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold text-blue-600">1</span>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Create Your Profile</h3>
          <p class="text-gray-600">
            Sign up and tell us about your academic background, interests, and goals to personalize your experience
          </p>
        </div>

        <div class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold text-green-600">2</span>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Generate Documents</h3>
          <p class="text-gray-600">
            Use our AI-powered tools to create compelling SOPs, cover letters, and other application materials
          </p>
        </div>

        <div class="text-center">
          <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold text-purple-600">3</span>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Track & Apply</h3>
          <p class="text-gray-600">
            Manage your applications, track deadlines, and find scholarship opportunities all in one place
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">
          What Students Say
        </h2>
        <p class="text-xl text-gray-600">
          Join thousands of successful applicants who used Abroaducate
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-white rounded-lg p-6 shadow-sm">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <span class="text-blue-600 font-semibold">AS</span>
            </div>
            <div>
              <div class="font-semibold text-gray-900">Alex Smith</div>
              <div class="text-gray-600 text-sm">PhD in Computer Science</div>
            </div>
          </div>
          <p class="text-gray-700">
            "Abroaducate helped me craft a compelling SOP that got me into my dream PhD program at MIT. The AI suggestions were spot-on!"
          </p>
        </div>

        <div class="bg-white rounded-lg p-6 shadow-sm">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <span class="text-green-600 font-semibold">MP</span>
            </div>
            <div>
              <div class="font-semibold text-gray-900">Maria Patel</div>
              <div class="text-gray-600 text-sm">MS in Data Science</div>
            </div>
          </div>
          <p class="text-gray-700">
            "The scholarship finder was a game-changer. I discovered funding opportunities I never knew existed and saved thousands!"
          </p>
        </div>

        <div class="bg-white rounded-lg p-6 shadow-sm">
          <div class="flex items-center mb-4">
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <span class="text-purple-600 font-semibold">JL</span>
            </div>
            <div>
              <div class="font-semibold text-gray-900">James Lee</div>
              <div class="text-gray-600 text-sm">MBA Student</div>
            </div>
          </div>
          <p class="text-gray-700">
            "The application tracking dashboard kept me organized throughout my MBA applications. Got into 4 top schools!"
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
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
            onclick={signInWithGoogle}
            class="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition duration-300 shadow-lg flex items-center justify-center space-x-3"
          >
            <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google" class="w-6 h-6">
            <span>Start Free Today</span>
          </button>
          
          <a href="/pricing" class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition duration-300">
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
          <h3 class="text-xl font-bold mb-4">Abroaducate</h3>
          <p class="text-gray-400">
            Your complete academic application platform powered by AI
          </p>
        </div>
        
        <div>
          <h4 class="font-semibold mb-4">Features</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="/sop" class="hover:text-white transition duration-300">SOP Generator</a></li>
            <li><a href="/cover-letters" class="hover:text-white transition duration-300">Cover Letters</a></li>
            <li><a href="/scholarships" class="hover:text-white transition duration-300">Scholarships</a></li>
            <li><a href="/dashboard" class="hover:text-white transition duration-300">Dashboard</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold mb-4">Support</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="/pricing" class="hover:text-white transition duration-300">Pricing</a></li>
            <li><a href="#" class="hover:text-white transition duration-300">Help Center</a></li>
            <li><a href="#" class="hover:text-white transition duration-300">Contact Us</a></li>
            <li><a href="#" class="hover:text-white transition duration-300">Blog</a></li>
          </ul>
        </div>
        
        <div>
          <h4 class="font-semibold mb-4">Connect</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white transition duration-300">Twitter</a></li>
            <li><a href="#" class="hover:text-white transition duration-300">LinkedIn</a></li>
            <li><a href="#" class="hover:text-white transition duration-300">Facebook</a></li>
            <li><a href="#" class="hover:text-white transition duration-300">Instagram</a></li>
          </ul>
        </div>
      </div>
      
      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; 2024 Abroaducate. All rights reserved.</p>
      </div>
    </div>
  </footer>
</div>
