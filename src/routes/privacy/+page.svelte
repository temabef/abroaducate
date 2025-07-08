<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>Privacy Policy - Abroaducate</title>
  <meta name="description" content="Abroaducate Privacy Policy - How we collect, use, and protect your personal information" />
  <meta name="robots" content="index, follow" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
      <p class="text-lg text-gray-600 mb-4">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      <p class="text-gray-700">
        At Abroaducate, we take your privacy seriously. This Privacy Policy explains how we collect, 
        use, disclose, and safeguard your information when you use our academic application platform.
      </p>
    </div>

    <!-- Content -->
    <div class="bg-white rounded-lg shadow-lg p-8 space-y-8">
      
      <!-- Information We Collect -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
        
        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Personal Information</h3>
            <p class="text-gray-700 mb-2">When you create an account or use our services, we may collect:</p>
            <ul class="list-disc pl-6 space-y-1 text-gray-700">
              <li>Name, email address, and contact information</li>
              <li>Academic information (GPA, test scores, transcripts)</li>
              <li>Educational background and career goals</li>
              <li>Documents you create or upload (SOPs, cover letters, personal statements)</li>
              <li>University preferences and application data</li>
              <li>Payment information (processed securely through Stripe)</li>
            </ul>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Automatically Collected Information</h3>
            <ul class="list-disc pl-6 space-y-1 text-gray-700">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Log data and analytics information</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- How We Use Information -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
        
        <p class="text-gray-700 mb-4">We use the information we collect to:</p>
        <ul class="list-disc pl-6 space-y-2 text-gray-700">
          <li><strong>Provide Services:</strong> Generate documents, match universities, provide recommendations</li>
          <li><strong>AI-Powered Features:</strong> Improve document quality, provide personalized feedback, analyze academic profiles</li>
          <li><strong>Communication:</strong> Send scholarship alerts, application reminders, and platform updates</li>
          <li><strong>Account Management:</strong> Maintain your account, process payments, provide customer support</li>
          <li><strong>Platform Improvement:</strong> Analyze usage patterns, develop new features, enhance user experience</li>
          <li><strong>Legal Compliance:</strong> Comply with applicable laws and protect against fraud</li>
        </ul>
      </section>

      <!-- AI and Document Processing -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">3. AI Processing and Document Handling</h2>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
          <h3 class="text-lg font-semibold text-blue-900 mb-2">🤖 AI Processing</h3>
          <p class="text-blue-800">
            We use third-party AI services (including OpenAI) to power our document generation, 
            review, and enhancement features. Your documents are processed securely and are not 
            used to train AI models.
          </p>
        </div>

        <ul class="list-disc pl-6 space-y-1 text-gray-700">
          <li>Documents are encrypted during transmission and processing</li>
          <li>AI processing is used solely for providing services to you</li>
          <li>We maintain strict data handling agreements with AI service providers</li>
          <li>You retain full ownership of all documents you create</li>
        </ul>
      </section>

      <!-- Information Sharing -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
        
        <p class="text-gray-700 mb-4">We do not sell your personal information. We may share information in these limited circumstances:</p>
        
        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Service Providers</h3>
            <p class="text-gray-700">Third-party vendors who help us provide our services (payment processing, email delivery, AI processing, analytics)</p>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Legal Requirements</h3>
            <p class="text-gray-700">When required by law, court order, or government request</p>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Business Transfers</h3>
            <p class="text-gray-700">In connection with mergers, acquisitions, or sale of assets (with user notification)</p>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Consent</h3>
            <p class="text-gray-700">With your explicit consent for specific purposes</p>
          </div>
        </div>
      </section>

      <!-- Data Security -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
        
        <p class="text-gray-700 mb-4">We implement comprehensive security measures to protect your information:</p>
        <ul class="list-disc pl-6 space-y-1 text-gray-700">
          <li>Industry-standard encryption for data in transit and at rest</li>
          <li>Secure authentication and access controls</li>
          <li>Regular security audits and vulnerability assessments</li>
          <li>SOC 2 compliant infrastructure (Supabase)</li>
          <li>PCI DSS compliant payment processing (Stripe)</li>
          <li>Regular security training for our team</li>
        </ul>
      </section>

      <!-- Your Rights -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">6. Your Privacy Rights</h2>
        
        <div class="grid md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-2">Access & Portability</h3>
              <p class="text-gray-700 text-sm">Request copies of your personal data and export your documents</p>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-2">Correction</h3>
              <p class="text-gray-700 text-sm">Update or correct inaccurate personal information</p>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-2">Deletion</h3>
              <p class="text-gray-700 text-sm">Request deletion of your account and associated data</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-2">Opt-Out</h3>
              <p class="text-gray-700 text-sm">Unsubscribe from marketing communications at any time</p>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-2">Restrict Processing</h3>
              <p class="text-gray-700 text-sm">Limit how we use your information in certain circumstances</p>
            </div>

            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-2">Object</h3>
              <p class="text-gray-700 text-sm">Object to processing for marketing or legitimate interests</p>
            </div>
          </div>
        </div>

        <div class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-green-800">
            <strong>How to Exercise Your Rights:</strong> Contact us at 
            <a href="mailto:privacy@abroaducate.com" class="text-green-600 hover:text-green-800 underline">privacy@abroaducate.com</a> 
            or use the account settings in your dashboard.
          </p>
        </div>
      </section>

      <!-- Data Retention -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
        
        <div class="space-y-3 text-gray-700">
          <p><strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion</p>
          <p><strong>Documents:</strong> Retained according to your plan's version history limits</p>
          <p><strong>Payment Records:</strong> Retained for 7 years for tax and legal compliance</p>
          <p><strong>Analytics Data:</strong> Anonymized and retained for platform improvement</p>
          <p><strong>Email Communications:</strong> Retained until you unsubscribe or delete your account</p>
        </div>
      </section>

      <!-- International Transfers -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">8. International Data Transfers</h2>
        
        <p class="text-gray-700 mb-4">
          Abroaducate operates globally. Your information may be transferred to and processed in 
          countries outside your residence, including the United States. We ensure appropriate 
          safeguards are in place through:
        </p>
        <ul class="list-disc pl-6 space-y-1 text-gray-700">
          <li>Standard Contractual Clauses (SCCs) with service providers</li>
          <li>Adequacy decisions by relevant data protection authorities</li>
          <li>Certification schemes and codes of conduct</li>
        </ul>
      </section>

      <!-- Cookies -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">9. Cookies and Tracking</h2>
        
        <p class="text-gray-700 mb-4">We use cookies and similar technologies for:</p>
        <ul class="list-disc pl-6 space-y-1 text-gray-700">
          <li><strong>Essential:</strong> Authentication, security, basic functionality</li>
          <li><strong>Analytics:</strong> Understanding usage patterns and improving our platform</li>
          <li><strong>Preferences:</strong> Remembering your settings and customizations</li>
          <li><strong>Marketing:</strong> Providing relevant content and measuring campaign effectiveness</li>
        </ul>
        
        <p class="text-gray-700 mt-4">
          You can control cookies through your browser settings. Note that disabling certain 
          cookies may impact platform functionality.
        </p>
      </section>

      <!-- Children's Privacy -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
        
        <p class="text-gray-700">
          Our services are intended for users 16 years and older. We do not knowingly collect 
          personal information from children under 16. If you believe we have collected information 
          from a child under 16, please contact us immediately.
        </p>
      </section>

      <!-- Changes to Policy -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
        
        <p class="text-gray-700 mb-4">
          We may update this Privacy Policy periodically. When we make material changes, we will:
        </p>
        <ul class="list-disc pl-6 space-y-1 text-gray-700">
          <li>Update the "Last updated" date at the top of this policy</li>
          <li>Notify you via email if you have an account</li>
          <li>Post a notice on our platform</li>
          <li>For significant changes, obtain your consent where required by law</li>
        </ul>
      </section>

      <!-- Contact Information -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
        
        <div class="bg-gray-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Questions about this Privacy Policy?</h3>
          
          <div class="space-y-2 text-gray-700">
            <p><strong>Email:</strong> <a href="mailto:privacy@abroaducate.com" class="text-blue-600 hover:text-blue-800 underline">privacy@abroaducate.com</a></p>
            <p><strong>Support:</strong> <a href="mailto:support@abroaducate.com" class="text-blue-600 hover:text-blue-800 underline">support@abroaducate.com</a></p>
            <p><strong>Response Time:</strong> We aim to respond within 72 hours</p>
          </div>

          <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-blue-800 text-sm">
              <strong>Data Protection Officer:</strong> For EU-related privacy inquiries, you may contact our 
              designated representative at <a href="mailto:dpo@abroaducate.com" class="text-blue-600 hover:text-blue-800 underline">dpo@abroaducate.com</a>
            </p>
          </div>
        </div>
      </section>

    </div>

    <!-- Footer Navigation -->
    <div class="mt-8 text-center">
      <div class="space-x-6">
        <a href="/terms" class="text-blue-600 hover:text-blue-800 underline">Terms of Service</a>
        <a href="/" class="text-blue-600 hover:text-blue-800 underline">Back to Home</a>
        <a href="/contact" class="text-blue-600 hover:text-blue-800 underline">Contact Support</a>
      </div>
    </div>
  </div>
</div>

<style>
  /* Smooth scroll for anchor links */
  html {
    scroll-behavior: smooth;
  }
  
  /* Print styles */
  @media print {
    .min-h-screen {
      min-height: auto;
    }
    
    .bg-gray-50 {
      background: white !important;
    }
    
    .shadow-lg {
      box-shadow: none !important;
      border: 1px solid #e5e7eb;
    }
  }
</style> 