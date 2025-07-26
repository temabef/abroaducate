<script lang="ts">
  import SEO from '$lib/components/SEO.svelte';
  import { derived } from 'svelte/store';
  
  let formData = $state({
    name: '',
    email: '',
    category: 'general', // Default to 'general'
    subject: '',
    message: '',
    priority: 'normal'
  });
  
  let submitting = $state(false);
  let submitted = $state(false);
  let error = $state('');

  // Real-time validation state
  let nameError = '';
  let emailError = '';
  let messageError = '';
  let categoryError = '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateName() {
    nameError = formData.name.trim().length < 2 ? 'Full name is required (min 2 characters).' : '';
  }
  function validateEmail() {
    emailError = !formData.email ? 'Email is required.' : (!emailRegex.test(formData.email) ? 'Invalid email format.' : '');
  }
  function validateMessage() {
    messageError = formData.message.trim().length < 10 ? 'Message is required (min 10 characters).' : '';
  }
  function validateCategory() {
    categoryError = !formData.category ? 'Please select a support category.' : '';
  }

  function validateAll() {
    validateName();
    validateEmail();
    validateMessage();
    validateCategory();
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    validateAll();
    if (nameError || emailError || messageError || categoryError) {
      error = 'Please fix the errors above.';
      return;
    }

    submitting = true;
    error = '';

    try {
      const response = await fetch('/api/contact-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        submitted = true;
        formData = { name: '', email: '', category: 'general', subject: '', message: '', priority: 'normal' };
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      error = 'Failed to send your message. Please try emailing us directly at support@abroaducate.com';
    } finally {
      submitting = false;
    }
  }

  const supportCategories = [
    { value: 'technical', label: 'Technical Issues', icon: '🔧', desc: 'Login problems, bugs, feature not working' },
    { value: 'billing', label: 'Billing & Subscriptions', icon: '💳', desc: 'Payment issues, subscription changes, refunds' },
    { value: 'account', label: 'Account Support', icon: '👤', desc: 'Profile settings, data export, account deletion' },
    { value: 'documents', label: 'Document Help', icon: '📄', desc: 'SOP generation, editing tools, document formatting' },
    { value: 'universities', label: 'University Questions', icon: '🎓', desc: 'University recommendations, application requirements' },
    { value: 'general', label: 'General Inquiry', icon: '💬', desc: 'Features, partnerships, feedback' }
  ];

  const faqs = [
    {
      question: "How quickly will you respond to my support request?",
      answer: "We aim to respond within 24-48 hours for all inquiries. Billing and technical issues typically receive priority response within 24 hours. During weekends, responses may take up to 72 hours."
    },
    {
      question: "I'm having trouble logging in. What should I do?",
      answer: "First, try resetting your password using the 'Forgot Password' link. If that doesn't work, check if you're using the correct email address. Still having issues? Contact us with your registered email and we'll help you regain access."
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer: "Yes! We offer a 7-day money-back guarantee for all paid plans. If you're not completely satisfied, contact us within 7 days of your purchase for a full refund."
    },
    {
      question: "My AI-generated document seems incorrect. Can you help?",
      answer: "Absolutely! AI can sometimes misinterpret inputs. Try rephrasing your information or being more specific. If you're still having issues, send us your inputs and we'll help optimize your document generation."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel anytime in your account settings under 'Subscription Management.' Or contact us and we'll cancel it for you immediately. You'll continue to have access until your current billing period ends."
    },
    {
      question: "Do you offer student discounts?",
      answer: "Our pricing is already designed with students in mind! Our Academic Starter plan is completely free, and our paid plans are priced affordably for student budgets. We occasionally offer special promotions - follow us for updates."
    },
    {
      question: "Can you help me choose the right universities to apply to?",
      answer: "While we can't provide personalized counseling, our University Matching tool analyzes your profile against 1500+ universities. For detailed guidance, consider booking a consultation with an educational advisor."
    },
    {
      question: "Is my personal information and documents secure?",
      answer: "Yes! We use industry-standard encryption and never share your personal information. Your documents are stored securely and you can export or delete them anytime. Read our Privacy Policy for full details."
    }
  ];

  let openFAQ = $state<number | null>(null);
  
  function toggleFAQ(index: number) {
    openFAQ = openFAQ === index ? null : index;
  }
</script>

<SEO 
  title="Contact & Support - Abroaducate"
  description="Get help with your academic applications. Contact our support team for technical issues, billing questions, and application guidance."
  canonical="https://abroaducate.com/contact"
/>

<div class="min-h-screen bg-gray-50 py-16">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <!-- Header -->
    <div class="text-center mb-16">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">Contact & Support</h1>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        We're here to help you succeed in your academic journey. Get support, ask questions, or share feedback.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
      
      <!-- Contact Form -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
          
          {#if submitted}
            <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div class="flex items-center">
                <svg class="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <div>
                  <h3 class="text-green-900 font-semibold">Message Sent Successfully!</h3>
                  <p class="text-green-700 mt-1">We'll get back to you within 24-48 hours. Check your email for our response.</p>
                </div>
              </div>
            </div>
          {/if}

          {#if error}
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p class="text-red-700">{error}</p>
            </div>
          {/if}

          <form onsubmit={handleSubmit} class="space-y-6">
            
            <!-- Support Category -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">What can we help you with? *</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                {#each supportCategories as category}
                  <label class="relative">
                    <input
                      type="radio"
                      bind:group={formData.category}
                      value={category.value}
                      class="sr-only"
                      onchange={validateCategory}
                    />
                    <div class="border-2 rounded-lg p-4 cursor-pointer transition-all {formData.category === category.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}">
                      <div class="flex items-start space-x-3">
                        <span class="text-2xl">{category.icon}</span>
                        <div>
                          <div class="font-semibold text-gray-900">{category.label}</div>
                          <div class="text-xs text-gray-600 mt-1">{category.desc}</div>
                        </div>
                      </div>
                    </div>
                  </label>
                {/each}
              </div>
              {#if categoryError}
                <div class="input-error">{categoryError}</div>
              {/if}
            </div>

            <!-- Name and Email -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  bind:value={formData.name}
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Your full name"
                  oninput={validateName}
                />
                {#if nameError}
                  <div class="input-error">{nameError}</div>
                {/if}
              </div>
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  bind:value={formData.email}
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your.email@example.com"
                  oninput={validateEmail}
                />
                {#if emailError}
                  <div class="input-error">{emailError}</div>
                {/if}
              </div>
            </div>

            <!-- Subject -->
            <div>
              <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                id="subject"
                bind:value={formData.subject}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief summary of your inquiry"
              />
            </div>

            <!-- Priority -->
            <div>
              <label for="priority" class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                id="priority"
                bind:value={formData.priority}
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low - General inquiry</option>
                <option value="normal">Normal - Standard support</option>
                <option value="high">High - Urgent issue</option>
                <option value="critical">Critical - Service blocking</option>
              </select>
            </div>

            <!-- Message -->
            <div>
              <label for="message" class="block text-sm font-medium text-gray-700 mb-2">Message *</label>
              <textarea
                id="message"
                bind:value={formData.message}
                required
                rows="6"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please describe your issue or question in detail. Include any error messages, steps you've tried, or specific information that might help us assist you better."
                oninput={validateMessage}
              ></textarea>
              {#if messageError}
                <div class="input-error">{messageError}</div>
              {/if}
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              disabled={submitting}
              class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>

      <!-- Contact Info & Quick Help -->
      <div class="space-y-8">
        
        <!-- Direct Contact -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Direct Contact</h3>
          <div class="space-y-4">
            <div class="flex items-center space-x-3">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <div>
                <div class="text-sm text-gray-600">Email Support</div>
                <a href="mailto:support@abroaducate.com" class="text-blue-600 hover:text-blue-700 font-medium">support@abroaducate.com</a>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <div class="text-sm text-gray-600">Response Time</div>
                <div class="font-medium text-gray-900">24-48 hours</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Emergency Contact -->
        <div class="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 class="text-lg font-bold text-red-900 mb-2">Critical Issues?</h3>
          <p class="text-red-700 text-sm mb-3">
            If you're experiencing payment failures, account lockouts, or deadline-critical issues:
          </p>
          <a 
            href="mailto:urgent@abroaducate.com?subject=URGENT:%20[Describe%20Issue]" 
            class="inline-block bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition duration-300"
          >
            Email: urgent@abroaducate.com
          </a>
        </div>

        <!-- Quick Tips -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 class="text-lg font-bold text-blue-900 mb-4">Before You Contact Us</h3>
          <ul class="space-y-2 text-sm text-blue-800">
            <li class="flex items-start space-x-2">
              <span class="text-blue-600">•</span>
              <span>Check our FAQ below for common solutions</span>
            </li>
            <li class="flex items-start space-x-2">
              <span class="text-blue-600">•</span>
              <span>Try refreshing the page or clearing your browser cache</span>
            </li>
            <li class="flex items-start space-x-2">
              <span class="text-blue-600">•</span>
              <span>Include screenshots or error messages in your request</span>
            </li>
            <li class="flex items-start space-x-2">
              <span class="text-blue-600">•</span>
              <span>Mention your account email for faster assistance</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="mt-20">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <p class="text-xl text-gray-600">Quick answers to common questions</p>
      </div>

      <div class="max-w-4xl mx-auto">
        <div class="space-y-4">
          {#each faqs as faq, index}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
              <button 
                class="w-full text-left p-6 focus:outline-none" 
                onclick={() => toggleFAQ(index)}
              >
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                  <svg 
                    class="w-5 h-5 text-gray-500 transform transition-transform {openFAQ === index ? 'rotate-180' : ''}" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </button>
              {#if openFAQ === index}
                <div class="px-6 pb-6">
                  <p class="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Additional Resources -->
    <div class="mt-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-center">
      <h2 class="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
      <p class="text-blue-100 mb-6 max-w-2xl mx-auto">
        We're committed to your success. Don't hesitate to reach out - we're here to help you achieve your academic goals.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a 
          href="mailto:support@abroaducate.com" 
          class="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition duration-300"
        >
          Email Support
        </a>
        <a 
          href="/dashboard" 
          class="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition duration-300"
        >
          Back to Dashboard
        </a>
      </div>
    </div>

  </div>
</div> 

<style>
.input-error {
  color: #DC2626;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}
</style> 