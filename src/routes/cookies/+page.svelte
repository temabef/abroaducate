<script lang="ts">
  import SEO from '$lib/components/SEO.svelte';
  
  let showCookieTypes = $state(false);
  let activeSection = $state<string | null>(null);
  
  function toggleSection(section: string) {
    activeSection = activeSection === section ? null : section;
  }
  
  const cookieCategories = [
    {
      id: 'essential',
      name: 'Essential Cookies',
      description: 'Required for basic website functionality and security',
      required: true,
      examples: [
        'Session authentication cookies',
        'Device fingerprinting',
        'Load balancing cookies',
        'Security preference cookies'
      ]
    },
    {
      id: 'analytics',
      name: 'Analytics Cookies',
      description: 'Help us understand how visitors use our website',
      required: false,
      examples: [
        'Google Analytics tracking',
        'Page view statistics',
        'User interaction tracking',
        'Performance monitoring'
      ]
    },
    {
      id: 'functional',
      name: 'Functional Cookies',
      description: 'Enable enhanced functionality and personalization',
      required: false,
      examples: [
        'Language preferences',
        'Theme settings',
        'Dashboard customizations',
        'Feature preferences'
      ]
    },
    {
      id: 'advertising',
      name: 'Advertising Cookies',
      description: 'Currently not used - we do not display targeted advertisements',
      required: false,
      examples: [
        'Not applicable - we do not use advertising cookies'
      ]
    }
  ];
</script>

<SEO 
  title="Cookie Policy - Abroaducate"
  description="Learn about how Abroaducate uses cookies to provide and improve our academic application platform services."
  canonical="https://abroaducate.com/cookies"
/>

<div class="min-h-screen bg-gray-50 py-16">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Understanding how Abroaducate uses cookies to provide and improve our services
      </p>
      <div class="mt-6 text-sm text-gray-500">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>

    <!-- Quick Summary -->
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
      <h2 class="text-lg font-bold text-blue-900 mb-3">Quick Summary</h2>
      <ul class="text-blue-800 space-y-2 text-sm">
        <li class="flex items-start space-x-2">
          <span class="text-blue-600 mt-1">•</span>
          <span>We use cookies to keep you logged in, analyze usage, and improve our platform</span>
        </li>
        <li class="flex items-start space-x-2">
          <span class="text-blue-600 mt-1">•</span>
          <span>Essential cookies are required for the platform to function properly</span>
        </li>
        <li class="flex items-start space-x-2">
          <span class="text-blue-600 mt-1">•</span>
          <span>You can manage your cookie preferences in your browser settings</span>
        </li>
        <li class="flex items-start space-x-2">
          <span class="text-blue-600 mt-1">•</span>
          <span>We do not sell your personal data or use intrusive tracking</span>
        </li>
      </ul>
    </div>

    <div class="bg-white rounded-xl shadow-lg p-8 space-y-8">
      
      <!-- What Are Cookies -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
        <div class="prose prose-gray max-w-none">
          <p class="text-gray-600 leading-relaxed">
            Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. 
            They help websites remember information about your visit, such as your preferred language, login status, and other settings. 
            This makes your next visit easier and the site more useful to you.
          </p>
          <p class="text-gray-600 leading-relaxed mt-4">
            Cookies cannot access, read, or modify any other data on your computer, and they cannot be used to spread viruses 
            or malware. They are simply small text files that contain information related to your website experience.
          </p>
        </div>
      </section>

      <!-- How We Use Cookies -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">How Abroaducate Uses Cookies</h2>
        <div class="prose prose-gray max-w-none">
          <p class="text-gray-600 leading-relaxed mb-6">
            We use cookies to provide you with a better experience on our platform. Our cookies help us:
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-2">🔐 Keep You Logged In</h3>
              <p class="text-sm text-gray-600">Maintain your authentication session securely across pages</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-2">📊 Understand Usage</h3>
              <p class="text-sm text-gray-600">Analyze how students use our platform to improve features</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-2">⚙️ Remember Preferences</h3>
              <p class="text-sm text-gray-600">Save your settings and personalization choices</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="font-semibold text-gray-900 mb-2">🛡️ Enhance Security</h3>
              <p class="text-sm text-gray-600">Protect against fraud and unauthorized access</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Types of Cookies -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Types of Cookies We Use</h2>
        
        <div class="space-y-4">
          {#each cookieCategories as category}
            <div class="border border-gray-200 rounded-lg">
              <button 
                class="w-full text-left p-4 focus:outline-none hover:bg-gray-50 transition duration-200" 
                onclick={() => toggleSection(category.id)}
              >
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <p class="text-sm text-gray-600 mt-1">{category.description}</p>
                  </div>
                  <div class="flex items-center space-x-3">
                    {#if category.required}
                      <span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Required</span>
                    {:else}
                      <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Optional</span>
                    {/if}
                    <svg 
                      class="w-5 h-5 text-gray-500 transform transition-transform {activeSection === category.id ? 'rotate-180' : ''}" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </button>
              
              {#if activeSection === category.id}
                <div class="px-4 pb-4 border-t border-gray-100">
                  <div class="pt-3">
                    <h4 class="font-medium text-gray-900 mb-2">Examples:</h4>
                    <ul class="space-y-1">
                      {#each category.examples as example}
                        <li class="text-sm text-gray-600 flex items-start space-x-2">
                          <span class="text-gray-400 mt-1">•</span>
                          <span>{example}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </section>

      <!-- Third-Party Cookies -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
        <div class="prose prose-gray max-w-none">
          <p class="text-gray-600 leading-relaxed mb-4">
            We use some third-party services that may set their own cookies:
          </p>
          
          <div class="bg-gray-50 rounded-lg p-6 space-y-4">
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">🔍 Google Analytics</h3>
              <p class="text-sm text-gray-600 mb-2">
                We use Google Analytics to understand how students use our platform. This helps us improve our services and create better features.
              </p>
              <p class="text-xs text-gray-500">
                Learn more: <a href="https://policies.google.com/privacy" class="text-blue-600 hover:text-blue-700">Google Privacy Policy</a> | 
                <a href="https://tools.google.com/dlpage/gaoptout" class="text-blue-600 hover:text-blue-700">Opt-out</a>
              </p>
            </div>
            
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">💳 Stripe (Payment Processing)</h3>
              <p class="text-sm text-gray-600 mb-2">
                When you make payments, Stripe may set cookies to ensure secure transactions and prevent fraud.
              </p>
              <p class="text-xs text-gray-500">
                Learn more: <a href="https://stripe.com/privacy" class="text-blue-600 hover:text-blue-700">Stripe Privacy Policy</a>
              </p>
            </div>
            
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">🏗️ Supabase (Backend Services)</h3>
              <p class="text-sm text-gray-600 mb-2">
                Our backend infrastructure provider may set cookies for authentication and service delivery.
              </p>
              <p class="text-xs text-gray-500">
                Learn more: <a href="https://supabase.com/privacy" class="text-blue-600 hover:text-blue-700">Supabase Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Managing Cookies -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Managing Your Cookie Preferences</h2>
        <div class="prose prose-gray max-w-none">
          <p class="text-gray-600 leading-relaxed mb-4">
            You have several options for managing cookies:
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 class="font-semibold text-blue-900 mb-2">🌐 Browser Settings</h3>
              <p class="text-sm text-blue-800 mb-3">
                You can control cookies through your browser settings. Most browsers allow you to:
              </p>
              <ul class="text-xs text-blue-700 space-y-1">
                <li>• Block all cookies</li>
                <li>• Block third-party cookies only</li>
                <li>• Delete existing cookies</li>
                <li>• Get notifications when cookies are set</li>
              </ul>
            </div>
            
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 class="font-semibold text-amber-900 mb-2">⚠️ Important Note</h3>
              <p class="text-sm text-amber-800 mb-2">
                Blocking essential cookies will prevent you from:
              </p>
              <ul class="text-xs text-amber-700 space-y-1">
                <li>• Logging into your account</li>
                <li>• Saving your work</li>
                <li>• Using AI-powered features</li>
                <li>• Making purchases</li>
              </ul>
            </div>
          </div>
          
          <div class="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 mb-3">Browser-Specific Instructions</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <a href="https://support.google.com/chrome/answer/95647" class="text-blue-600 hover:text-blue-700">Chrome Settings</a>
              <a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" class="text-blue-600 hover:text-blue-700">Firefox Settings</a>
              <a href="https://support.apple.com/en-us/HT201265" class="text-blue-600 hover:text-blue-700">Safari Settings</a>
              <a href="https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies" class="text-blue-600 hover:text-blue-700">Edge Settings</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Data Retention -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Cookie Retention Periods</h2>
        <div class="overflow-x-auto">
          <table class="w-full border border-gray-200 rounded-lg">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cookie Type</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-900">Purpose</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr>
                <td class="px-4 py-3 text-sm text-gray-900">Session cookies</td>
                <td class="px-4 py-3 text-sm text-gray-600">Until browser closes</td>
                <td class="px-4 py-3 text-sm text-gray-600">Authentication & navigation</td>
              </tr>
              <tr>
                <td class="px-4 py-3 text-sm text-gray-900">Persistent cookies</td>
                <td class="px-4 py-3 text-sm text-gray-600">30 days to 2 years</td>
                <td class="px-4 py-3 text-sm text-gray-600">Preferences & analytics</td>
              </tr>
              <tr>
                <td class="px-4 py-3 text-sm text-gray-900">Analytics cookies</td>
                <td class="px-4 py-3 text-sm text-gray-600">26 months (Google Analytics)</td>
                <td class="px-4 py-3 text-sm text-gray-600">Usage statistics</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Updates -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Updates to This Policy</h2>
        <div class="prose prose-gray max-w-none">
          <p class="text-gray-600 leading-relaxed">
            We may update this Cookie Policy from time to time to reflect changes in our practices or legal requirements. 
            When we make significant changes, we will notify you by:
          </p>
          <ul class="text-gray-600 mt-4 space-y-2">
            <li class="flex items-start space-x-2">
              <span class="text-blue-600 mt-1">•</span>
              <span>Posting the updated policy on our website with a new "Last updated" date</span>
            </li>
            <li class="flex items-start space-x-2">
              <span class="text-blue-600 mt-1">•</span>
              <span>Sending an email notification to registered users (for major changes)</span>
            </li>
            <li class="flex items-start space-x-2">
              <span class="text-blue-600 mt-1">•</span>
              <span>Displaying a notice on our platform for 30 days</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Contact -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Questions About Cookies?</h2>
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <p class="text-gray-700 mb-4">
            If you have any questions about our use of cookies or this policy, we're here to help:
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <a 
              href="/contact" 
              class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 text-center"
            >
              Contact Support
            </a>
            <a 
              href="mailto:privacy@abroaducate.com" 
              class="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition duration-300 text-center"
            >
              Email Privacy Team
            </a>
          </div>
        </div>
      </section>

    </div>

    <!-- Related Links -->
    <div class="mt-12 bg-white rounded-xl shadow-lg p-6">
      <h3 class="text-lg font-bold text-gray-900 mb-4">Related Policies</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/privacy" class="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition duration-200">
          <h4 class="font-semibold text-gray-900 mb-1">Privacy Policy</h4>
          <p class="text-sm text-gray-600">How we collect, use, and protect your personal information</p>
        </a>
        <a href="/terms" class="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition duration-200">
          <h4 class="font-semibold text-gray-900 mb-1">Terms of Service</h4>
          <p class="text-sm text-gray-600">Rules and guidelines for using our platform</p>
        </a>
      </div>
    </div>

  </div>
</div> 