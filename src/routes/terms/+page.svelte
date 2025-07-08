<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>Terms of Service - Abroaducate</title>
  <meta name="description" content="Abroaducate Terms of Service - Rules and agreements for using our academic application platform" />
  <meta name="robots" content="index, follow" />
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
      <p class="text-lg text-gray-600 mb-4">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      <p class="text-gray-700">
        These Terms of Service ("Terms") govern your use of Abroaducate, an academic application 
        platform that helps students create compelling application documents and find opportunities abroad.
      </p>
    </div>

    <!-- Content -->
    <div class="bg-white rounded-lg shadow-lg p-8 space-y-8">
      
      <!-- Acceptance of Terms -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
        
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
          <p class="text-yellow-800">
            <strong>By accessing or using Abroaducate, you agree to be bound by these Terms.</strong> 
            If you do not agree to these Terms, please do not use our services.
          </p>
        </div>

        <p class="text-gray-700">
          These Terms constitute a legally binding agreement between you and Abroaducate. 
          You must be at least 16 years old to use our services.
        </p>
      </section>

      <!-- Description of Service -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
        
        <p class="text-gray-700 mb-4">Abroaducate provides:</p>
        <ul class="list-disc pl-6 space-y-2 text-gray-700">
          <li><strong>Document Generation:</strong> AI-powered creation of SOPs, cover letters, personal statements</li>
          <li><strong>University Matching:</strong> Personalized recommendations based on your academic profile</li>
          <li><strong>Academic Analysis:</strong> Transcript evaluation and academic profile assessment</li>
          <li><strong>Scholarship Database:</strong> Access to scholarship opportunities and application tracking</li>
          <li><strong>Test Preparation:</strong> IELTS practice materials and mock tests</li>
          <li><strong>Document Management:</strong> Version control, checklists, and deadline tracking</li>
          <li><strong>AI-Enhanced Tools:</strong> Document review, enhancement, and optimization features</li>
        </ul>
      </section>

      <!-- Account Registration -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">3. Account Registration and Security</h2>
        
        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Account Creation</h3>
            <ul class="list-disc pl-6 space-y-1 text-gray-700">
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must notify us immediately of any unauthorized access</li>
              <li>One account per person; sharing accounts is prohibited</li>
            </ul>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Account Security</h3>
            <p class="text-gray-700">
              You are solely responsible for all activities that occur under your account. 
              We recommend using strong passwords and enabling two-factor authentication when available.
            </p>
          </div>
        </div>
      </section>

      <!-- Subscription Plans -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">4. Subscription Plans and Payment</h2>
        
        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Available Plans</h3>
            <ul class="list-disc pl-6 space-y-1 text-gray-700">
              <li><strong>Free Plan:</strong> Basic access with limited features</li>
              <li><strong>Professional Plan:</strong> Enhanced features with monthly usage limits</li>
              <li><strong>Elite Plan:</strong> Unlimited access to all features and priority support</li>
            </ul>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Payment Terms</h3>
            <ul class="list-disc pl-6 space-y-1 text-gray-700">
              <li>Subscriptions are billed monthly or annually in advance</li>
              <li>All payments are processed securely through Stripe</li>
              <li>Prices are subject to change with 30 days notice</li>
              <li>No refunds for partial months, except as required by law</li>
              <li>Failed payments may result in service suspension</li>
            </ul>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Cancellation</h3>
            <p class="text-gray-700">
              You may cancel your subscription at any time. Your access will continue until the end 
              of your current billing period. Cancellation does not entitle you to a refund for the current period.
            </p>
          </div>
        </div>
      </section>

      <!-- Acceptable Use -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use Policy</h2>
        
        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Permitted Uses</h3>
            <ul class="list-disc pl-6 space-y-1 text-gray-700">
              <li>Creating original academic application documents</li>
              <li>Researching universities and scholarship opportunities</li>
              <li>Using AI tools to enhance your own written content</li>
              <li>Practicing for standardized tests and interviews</li>
            </ul>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Prohibited Uses</h3>
            <div class="bg-red-50 border border-red-200 rounded-lg p-6">
              <p class="text-red-800 font-semibold mb-2">You may NOT use our service to:</p>
              <ul class="list-disc pl-6 space-y-1 text-red-700">
                <li>Submit completely AI-generated content as your own original work</li>
                <li>Create documents for other people without disclosure</li>
                <li>Violate any university's academic integrity policies</li>
                <li>Upload malicious content or attempt to harm our systems</li>
                <li>Share account credentials or circumvent usage limits</li>
                <li>Reverse engineer or attempt to extract our AI models</li>
                <li>Use automated tools to scrape our data or content</li>
                <li>Create multiple accounts to exceed usage limits</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Academic Integrity -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">6. Academic Integrity and Responsible Use</h2>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
          <h3 class="text-lg font-semibold text-blue-900 mb-2">🎓 Our Commitment to Academic Ethics</h3>
          <p class="text-blue-800">
            Abroaducate is designed to help you express your authentic self more effectively, 
            not to replace your original thoughts and experiences.
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Responsible AI Use</h3>
            <ul class="list-disc pl-6 space-y-1 text-gray-700">
              <li>Use AI suggestions as starting points, not final submissions</li>
              <li>Always personalize generated content with your own experiences</li>
              <li>Ensure all statements in your documents are truthful</li>
              <li>Review and understand all content before submission</li>
              <li>Comply with your target institution's AI usage policies</li>
            </ul>
          </div>

          <div>
            <h3 class="text-xl font-semibent text-gray-800 mb-2">Document Authenticity</h3>
            <p class="text-gray-700">
              While our AI helps with structure, grammar, and expression, the core content, 
              experiences, and achievements must be authentically yours. You are responsible 
              for ensuring all information is accurate and truthful.
            </p>
          </div>
        </div>
      </section>

      <!-- Intellectual Property -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property Rights</h2>
        
        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Your Content</h3>
            <ul class="list-disc pl-6 space-y-1 text-gray-700">
              <li>You retain ownership of all documents you create using our platform</li>
              <li>You grant us a limited license to process your content to provide our services</li>
              <li>We do not claim ownership of your personal experiences or achievements</li>
              <li>You can delete your content at any time</li>
            </ul>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Our Content</h3>
            <ul class="list-disc pl-6 space-y-1 text-gray-700">
              <li>Abroaducate platform, features, and technology are our property</li>
              <li>University data and scholarship information are licensed from third parties</li>
              <li>You may not copy, modify, or redistribute our platform</li>
              <li>Our brand, logos, and trademarks are protected</li>
            </ul>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">AI-Generated Content</h3>
            <p class="text-gray-700">
              Content generated by our AI tools is provided "as-is" and becomes part of your document 
              when you accept it. We do not claim ownership of AI-generated suggestions, but you are 
              responsible for reviewing and validating all content.
            </p>
          </div>
        </div>
      </section>

      <!-- Data Usage and Privacy -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">8. Data Usage and Privacy</h2>
        
        <p class="text-gray-700 mb-4">
          Your privacy is important to us. Please review our 
          <a href="/privacy" class="text-blue-600 hover:text-blue-800 underline">Privacy Policy</a> 
          for detailed information about how we collect, use, and protect your data.
        </p>

        <div class="space-y-2 text-gray-700">
          <p><strong>Data Security:</strong> We use industry-standard encryption and security measures</p>
          <p><strong>AI Processing:</strong> Your documents are processed securely and not used to train AI models</p>
          <p><strong>Data Retention:</strong> We retain your data according to our Privacy Policy</p>
          <p><strong>Your Rights:</strong> You can access, correct, or delete your data at any time</p>
        </div>
      </section>

      <!-- Service Availability -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">9. Service Availability and Limitations</h2>
        
        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Service Level</h3>
            <ul class="list-disc pl-6 space-y-1 text-gray-700">
              <li>We strive for 99.9% uptime but cannot guarantee uninterrupted service</li>
              <li>Planned maintenance will be announced in advance when possible</li>
              <li>Emergency maintenance may occur without notice</li>
              <li>Some features may have usage limits based on your plan</li>
            </ul>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Third-Party Dependencies</h3>
            <p class="text-gray-700">
              Our service relies on third-party providers (AI services, payment processors, hosting). 
              While we work to minimize disruptions, we cannot control third-party availability.
            </p>
          </div>
        </div>
      </section>

      <!-- Disclaimers -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">10. Disclaimers and Limitations</h2>
        
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-3">Important Disclaimers</h3>
          
          <div class="space-y-4 text-gray-700">
            <div>
              <h4 class="font-semibold">No Admission Guarantees</h4>
              <p class="text-sm">We do not guarantee admission to any university or award of any scholarship. Success depends on many factors beyond our control.</p>
            </div>

            <div>
              <h4 class="font-semibold">AI Accuracy</h4>
              <p class="text-sm">AI-generated content may contain errors or inaccuracies. You must review and verify all content before use.</p>
            </div>

            <div>
              <h4 class="font-semibold">University Information</h4>
              <p class="text-sm">University data and requirements change frequently. Always verify information with official sources.</p>
            </div>

            <div>
              <h4 class="font-semibold">Service "As-Is"</h4>
              <p class="text-sm">Our service is provided "as-is" without warranties of any kind, express or implied.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Limitation of Liability -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">11. Limitation of Liability</h2>
        
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p class="text-yellow-800 mb-4">
            <strong>To the maximum extent permitted by law:</strong>
          </p>
          
          <ul class="list-disc pl-6 space-y-1 text-yellow-700">
            <li>Our total liability to you is limited to the amount you paid in the 12 months preceding the claim</li>
            <li>We are not liable for indirect, incidental, special, or consequential damages</li>
            <li>We are not responsible for failed applications, missed deadlines, or lost opportunities</li>
            <li>You assume all risks associated with using AI-generated content</li>
          </ul>
        </div>
      </section>

      <!-- Indemnification -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">12. Indemnification</h2>
        
        <p class="text-gray-700">
          You agree to indemnify and hold harmless Abroaducate from any claims, damages, or expenses 
          arising from your use of our service, violation of these Terms, or infringement of any rights.
        </p>
      </section>

      <!-- Termination -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">13. Termination</h2>
        
        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Termination by You</h3>
            <p class="text-gray-700">You may terminate your account at any time through your account settings or by contacting support.</p>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Termination by Us</h3>
            <p class="text-gray-700 mb-2">We may terminate or suspend your account for:</p>
            <ul class="list-disc pl-6 space-y-1 text-gray-700">
              <li>Violation of these Terms</li>
              <li>Non-payment of fees</li>
              <li>Fraudulent or harmful activity</li>
              <li>Extended period of inactivity (with notice)</li>
            </ul>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Effect of Termination</h3>
            <ul class="list-disc pl-6 space-y-1 text-gray-700">
              <li>Your access to the service will cease immediately</li>
              <li>You can export your documents before termination</li>
              <li>We will delete your data according to our Privacy Policy</li>
              <li>No refund for prepaid periods unless required by law</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Governing Law -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">14. Governing Law and Disputes</h2>
        
        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Jurisdiction</h3>
            <p class="text-gray-700">
              These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles.
            </p>
          </div>

          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Dispute Resolution</h3>
            <p class="text-gray-700 mb-2">We encourage resolving disputes through:</p>
            <ol class="list-decimal pl-6 space-y-1 text-gray-700">
              <li>Direct communication with our support team</li>
              <li>Good faith negotiation</li>
              <li>Mediation, if necessary</li>
              <li>Binding arbitration for claims exceeding $10,000</li>
            </ol>
          </div>
        </div>
      </section>

      <!-- Changes to Terms -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">15. Changes to These Terms</h2>
        
        <p class="text-gray-700 mb-4">
          We may update these Terms periodically. When we make material changes:
        </p>
        <ul class="list-disc pl-6 space-y-1 text-gray-700">
          <li>We will update the "Last updated" date at the top</li>
          <li>We will notify you via email if you have an account</li>
          <li>We will post a notice on our platform</li>
          <li>Continued use after changes constitutes acceptance</li>
        </ul>
      </section>

      <!-- Contact Information -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">16. Contact Information</h2>
        
        <div class="bg-gray-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Questions about these Terms?</h3>
          
          <div class="space-y-2 text-gray-700">
            <p><strong>Email:</strong> <a href="mailto:legal@abroaducate.com" class="text-blue-600 hover:text-blue-800 underline">legal@abroaducate.com</a></p>
            <p><strong>Support:</strong> <a href="mailto:support@abroaducate.com" class="text-blue-600 hover:text-blue-800 underline">support@abroaducate.com</a></p>
            <p><strong>Response Time:</strong> We aim to respond within 72 hours</p>
          </div>

          <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-blue-800 text-sm">
              <strong>Legal Address:</strong> [Your Company Address]<br>
              <strong>Business Registration:</strong> [Your Registration Number]
            </p>
          </div>
        </div>
      </section>

    </div>

    <!-- Footer Navigation -->
    <div class="mt-8 text-center">
      <div class="space-x-6">
        <a href="/privacy" class="text-blue-600 hover:text-blue-800 underline">Privacy Policy</a>
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

  /* Focus styles for accessibility */
  a:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
</style> 