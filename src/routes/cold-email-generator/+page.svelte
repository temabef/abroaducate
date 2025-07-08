<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  let { data } = $props<{ data: { session: any; supabase: any } }>();
  let { session, supabase } = $derived(data);

  // Form state
  let formData = $state({
    professorName: '',
    professorTitle: 'Dr.',
    university: '',
    department: '',
    professorResearch: '',
    studentResearch: '',
    studentName: '',
    studentProgram: '',
    emailTone: 'formal',
    additionalInfo: ''
  });

  // UI state
  let isGenerating = $state(false);
  let generatedEmail = $state({
    subject: '',
    body: '',
    researchOverlap: []
  });
  let showResult = $state(false);
  let copySuccess = $state(false);

  // Auth guard
  onMount(() => {
    if (!session) {
      window.location.href = `/auth/login?redirect=${encodeURIComponent('/cold-email-generator')}`;
    }
  });

  async function generateEmail(event) {
    event.preventDefault();
    if (!validateForm()) return;
    
    isGenerating = true;
    showResult = false;

    try {
      const response = await fetch('/api/generate-cold-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const result = await response.json();
      generatedEmail = result;
      showResult = true;
    } catch (error) {
      console.error('Error generating email:', error);
      alert('Failed to generate email. Please try again.');
    } finally {
      isGenerating = false;
    }
  }

  function validateForm() {
    const required = ['professorName', 'professorResearch', 'studentResearch', 'studentName'];
    for (const field of required) {
      if (!formData[field].trim()) {
        alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    return true;
  }

  async function copyToClipboard() {
    const fullEmail = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`;
    try {
      await navigator.clipboard.writeText(fullEmail);
      copySuccess = true;
      setTimeout(() => copySuccess = false, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  function resetForm() {
    formData = {
      professorName: '',
      professorTitle: 'Dr.',
      university: '',
      department: '',
      professorResearch: '',
      studentResearch: '',
      studentName: '',
      studentProgram: '',
      emailTone: 'formal',
      additionalInfo: ''
    };
    showResult = false;
    generatedEmail = { subject: '', body: '', researchOverlap: [] };
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-[#0A192F] via-[#1E3A8A] to-[#0A192F] pt-20">
  <div class="container mx-auto px-4 py-12">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl md:text-5xl font-bold text-white mb-4">
        Cold Email Generator
      </h1>
      <p class="text-xl text-blue-200 max-w-3xl mx-auto">
        Generate professional, personalized emails to reach out to professors and researchers. 
        Our AI analyzes research interests to find common ground and creates compelling outreach emails.
      </p>
    </div>

    <div class="max-w-6xl mx-auto">
      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Form Section -->
        <div class="bg-white rounded-xl shadow-xl p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Email Details</h2>
          
          <form onsubmit={generateEmail} class="space-y-6">
            <!-- Professor Information -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-800 border-b pb-2">Professor Information</h3>
              
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label for="professor-title" class="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <select id="professor-title" bind:value={formData.professorTitle} class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                  </select>
                </div>
                
                <div>
                  <label for="professor-name" class="block text-sm font-medium text-gray-700 mb-2">Professor Name *</label>
                  <input
                    id="professor-name"
                    type="text"
                    bind:value={formData.professorName}
                    placeholder="e.g., John Smith"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label for="university" class="block text-sm font-medium text-gray-700 mb-2">University</label>
                  <input
                    id="university"
                    type="text"
                    bind:value={formData.university}
                    placeholder="e.g., Stanford University"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label for="department" class="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    id="department"
                    type="text"
                    bind:value={formData.department}
                    placeholder="e.g., Computer Science"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label for="professor-research" class="block text-sm font-medium text-gray-700 mb-2">Professor's Research Interests *</label>
                <textarea
                  id="professor-research"
                  bind:value={formData.professorResearch}
                  placeholder="e.g., Machine Learning, Natural Language Processing, Computer Vision, Deep Learning..."
                  rows="3"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                ></textarea>
                <p class="text-sm text-gray-500 mt-1">Enter the professor's research areas, keywords, or specific projects</p>
              </div>
            </div>

            <!-- Student Information -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-800 border-b pb-2">Your Information</h3>
              
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label for="student-name" class="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                  <input
                    id="student-name"
                    type="text"
                    bind:value={formData.studentName}
                    placeholder="e.g., Jane Doe"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label for="student-program" class="block text-sm font-medium text-gray-700 mb-2">Program/Background</label>
                  <input
                    id="student-program"
                    type="text"
                    bind:value={formData.studentProgram}
                    placeholder="e.g., MS Computer Science, PhD candidate"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label for="student-research" class="block text-sm font-medium text-gray-700 mb-2">Your Research Interests *</label>
                <textarea
                  id="student-research"
                  bind:value={formData.studentResearch}
                  placeholder="e.g., I'm interested in applying deep learning to healthcare, specifically in medical image analysis and diagnostic AI systems..."
                  rows="3"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                ></textarea>
                <p class="text-sm text-gray-500 mt-1">Describe your research interests and any relevant experience</p>
              </div>
            </div>

            <!-- Email Settings -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-800 border-b pb-2">Email Settings</h3>
              
              <div>
                <label for="email-tone" class="block text-sm font-medium text-gray-700 mb-2">Email Tone</label>
                <select id="email-tone" bind:value={formData.emailTone} class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="formal">Formal & Professional</option>
                  <option value="semi-formal">Semi-formal & Approachable</option>
                  <option value="enthusiastic">Enthusiastic & Passionate</option>
                </select>
              </div>

              <div>
                <label for="additional-info" class="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                <textarea
                  id="additional-info"
                  bind:value={formData.additionalInfo}
                  placeholder="Any specific achievements, publications, projects, or reasons for reaching out..."
                  rows="2"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating Email...' : 'Generate Cold Email'}
            </button>
          </form>
        </div>

        <!-- Results Section -->
        <div class="bg-white rounded-xl shadow-xl p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Generated Email</h2>
          
          {#if showResult}
            <div class="space-y-6">
              <!-- Research Overlap Analysis -->
              {#if generatedEmail.researchOverlap.length > 0}
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 class="font-semibold text-green-800 mb-2">🎯 Research Interest Overlap</h3>
                  <div class="flex flex-wrap gap-2">
                    {#each generatedEmail.researchOverlap as overlap}
                      <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {overlap}
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}

              <!-- Email Preview -->
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 class="font-semibold text-gray-800">Email Preview</h3>
                </div>
                
                <div class="p-4 space-y-4">
                  <!-- Subject Line -->
                  <div>
                    <label for="email-subject" class="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
                    <div id="email-subject" class="bg-blue-50 px-3 py-2 rounded border border-blue-200">
                      <span class="text-blue-900 font-medium">{generatedEmail.subject}</span>
                    </div>
                  </div>

                  <!-- Email Body -->
                  <div>
                    <label for="email-body" class="block text-sm font-medium text-gray-700 mb-1">Email Body:</label>
                    <div id="email-body" class="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-line font-mono text-sm">
                      {generatedEmail.body}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col sm:flex-row gap-3">
                <button
                  onclick={copyToClipboard}
                  class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition duration-300 flex items-center justify-center space-x-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  <span>{copySuccess ? 'Copied!' : 'Copy Email'}</span>
                </button>
                
                <button
                  onclick={resetForm}
                  class="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition duration-300"
                >
                  Generate Another
                </button>
              </div>
            </div>
          {:else}
            <div class="text-center py-12">
              <div class="text-gray-400 mb-4">
                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <p class="text-gray-500">Fill out the form and click "Generate Cold Email" to create your personalized professor outreach email.</p>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Tips Section -->
    <div class="max-w-4xl mx-auto mt-12">
      <div class="bg-white rounded-xl shadow-xl p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">📧 Cold Email Best Practices</h2>
        
        <div class="grid md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800">✅ Do's</h3>
            <ul class="space-y-2 text-gray-600">
              <li class="flex items-start space-x-2">
                <span class="text-green-500 mt-1">•</span>
                <span>Research the professor's recent publications</span>
              </li>
              <li class="flex items-start space-x-2">
                <span class="text-green-500 mt-1">•</span>
                <span>Be specific about shared research interests</span>
              </li>
              <li class="flex items-start space-x-2">
                <span class="text-green-500 mt-1">•</span>
                <span>Keep it concise (3-4 paragraphs max)</span>
              </li>
              <li class="flex items-start space-x-2">
                <span class="text-green-500 mt-1">•</span>
                <span>Include relevant experience or achievements</span>
              </li>
              <li class="flex items-start space-x-2">
                <span class="text-green-500 mt-1">•</span>
                <span>Follow up politely after 1-2 weeks</span>
              </li>
            </ul>
          </div>
          
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-800">❌ Don'ts</h3>
            <ul class="space-y-2 text-gray-600">
              <li class="flex items-start space-x-2">
                <span class="text-red-500 mt-1">•</span>
                <span>Send generic, mass emails</span>
              </li>
              <li class="flex items-start space-x-2">
                <span class="text-red-500 mt-1">•</span>
                <span>Be overly familiar or casual</span>
              </li>
              <li class="flex items-start space-x-2">
                <span class="text-red-500 mt-1">•</span>
                <span>Focus only on what you want</span>
              </li>
              <li class="flex items-start space-x-2">
                <span class="text-red-500 mt-1">•</span>
                <span>Send attachments in the first email</span>
              </li>
              <li class="flex items-start space-x-2">
                <span class="text-red-500 mt-1">•</span>
                <span>Write extremely long emails</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 