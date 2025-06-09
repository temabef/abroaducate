<script lang="ts">
  import { onMount } from 'svelte';
  
  let { data } = $props();
  let { supabase, session } = $derived(data);

  interface Scholarship {
    id: string;
    title: string;
    provider: string;
    amount: string;
    deadline: string;
    location: string;
    field: string;
    level: string;
    type: string;
    description: string;
    requirements: string[];
    website?: string;
    min_gpa?: number;
    min_ielts?: number;
    min_toefl?: number;
    age_limit?: number;
    nationality_restrictions?: string[];
    is_active: boolean;
    // New fields for Graduate Program Funding
    funding_category?: string; // "Traditional Scholarship" | "Graduate Program Funding" | "Advertised Position"
    university_name?: string;
    program_name?: string;
    department?: string;
    funding_type?: string; // "RA" | "TA" | "GA" | "Full Funding" | "Tuition Waiver"
    application_method?: string; // "Direct Apply" | "Contact Professor First" | "Advertised Position"
    professor_name?: string;
    professor_email?: string;
    position_details?: string;
    has_automatic_funding?: boolean;
    created_at?: string;
    updated_at?: string;
  }

  let scholarships: Scholarship[] = $state([]);
  let isLoading = $state(true);
  let showAddForm = $state(false);
  let editingScholarship: Scholarship | null = $state(null);
  let bulkCsvData = $state('');
  let showBulkImport = $state(false);

  // Form data
  let formData = $state({
    title: '',
    provider: '',
    amount: '',
    deadline: '',
    location: '',
    field: '',
    level: '',
    type: '',
    description: '',
    requirements: '',
    website: '',
    min_gpa: '',
    min_ielts: '',
    min_toefl: '',
    age_limit: '',
    nationality_restrictions: '',
    is_active: true,
    // New fields for Graduate Program Funding
    funding_category: 'Traditional Scholarship',
    university_name: '',
    program_name: '',
    department: '',
    funding_type: '',
    application_method: '',
    professor_name: '',
    professor_email: '',
    position_details: '',
    has_automatic_funding: false
  });

  onMount(async () => {
    await loadScholarships();
  });

  async function loadScholarships() {
    isLoading = true;
    const { data: scholarshipData, error } = await supabase
      .from('scholarships')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading scholarships:', error);
    } else {
      scholarships = scholarshipData || [];
    }
    isLoading = false;
  }

  async function saveScholarship(event: Event) {
    event.preventDefault();
    
    // Prepare data
    const scholarshipData = {
      ...formData,
      requirements: formData.requirements.split('\n').filter(r => r.trim()),
      nationality_restrictions: formData.nationality_restrictions 
        ? formData.nationality_restrictions.split(',').map(c => c.trim()).filter(c => c)
        : [],
      min_gpa: formData.min_gpa ? parseFloat(formData.min_gpa) : null,
      min_ielts: formData.min_ielts ? parseFloat(formData.min_ielts) : null,
      min_toefl: formData.min_toefl ? parseInt(formData.min_toefl) : null,
      age_limit: formData.age_limit ? parseInt(formData.age_limit) : null,
    };

    let result;
    if (editingScholarship) {
      // Update existing
      result = await supabase
        .from('scholarships')
        .update(scholarshipData)
        .eq('id', editingScholarship.id);
    } else {
      // Create new
      result = await supabase
        .from('scholarships')
        .insert(scholarshipData);
    }

    if (result.error) {
      console.error('Error saving scholarship:', result.error);
      alert('Error saving scholarship: ' + result.error.message);
    } else {
      resetForm();
      await loadScholarships();
      alert(editingScholarship ? 'Scholarship updated!' : 'Scholarship added!');
    }
  }

  async function deleteScholarship(id: string) {
    if (!confirm('Are you sure you want to delete this scholarship?')) return;

    const { error } = await supabase
      .from('scholarships')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting scholarship:', error);
      alert('Error deleting scholarship: ' + error.message);
    } else {
      await loadScholarships();
      alert('Scholarship deleted!');
    }
  }

  function resetForm() {
    editingScholarship = null;
    showAddForm = false;
    formData = {
      title: '',
      provider: '',
      amount: '',
      deadline: '',
      location: '',
      field: '',
      level: '',
      type: '',
      description: '',
      requirements: '',
      website: '',
      min_gpa: '',
      min_ielts: '',
      min_toefl: '',
      age_limit: '',
      nationality_restrictions: '',
      is_active: true,
      // New fields for Graduate Program Funding
      funding_category: 'Traditional Scholarship',
      university_name: '',
      program_name: '',
      department: '',
      funding_type: '',
      application_method: '',
      professor_name: '',
      professor_email: '',
      position_details: '',
      has_automatic_funding: false
    };
  }
</script>

<svelte:head>
  <title>Scholarship Admin (Test) - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Simple Header -->
  <div class="bg-yellow-600 text-white p-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-2xl font-bold">🎓 Scholarship Admin (Test Mode)</h1>
      <p>No access restrictions - for testing only</p>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- User Info -->
    <div class="bg-blue-50 p-4 rounded-lg mb-6">
      <p><strong>Logged in as:</strong> {session?.user?.email || 'Not logged in'}</p>
      <p><strong>User ID:</strong> {session?.user?.id || 'None'}</p>
    </div>

    <!-- Action Buttons -->
    <div class="mb-8 flex flex-wrap gap-4">
      <button
        onclick={() => { showAddForm = true; resetForm(); }}
        class="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition duration-200"
      >
        + Add New Scholarship
      </button>
      <button
        onclick={() => showBulkImport = !showBulkImport}
        class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200"
      >
        📁 Bulk Import CSV
      </button>
      <button
        onclick={loadScholarships}
        class="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition duration-200"
      >
        🔄 Refresh
      </button>
    </div>

    <!-- Add Form -->
    {#if showAddForm}
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h3 class="text-lg font-semibold mb-4">Add New Scholarship</h3>
        
        <form onsubmit={saveScholarship} class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                id="title"
                type="text"
                bind:value={formData.title}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label for="provider" class="block text-sm font-medium text-gray-700 mb-1">Provider *</label>
              <input
                id="provider"
                type="text"
                bind:value={formData.provider}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input
                id="amount"
                type="text"
                bind:value={formData.amount}
                required
                placeholder="e.g., $50,000/year"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label for="deadline" class="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
              <input
                id="deadline"
                type="date"
                bind:value={formData.deadline}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input
                id="location"
                type="text"
                bind:value={formData.location}
                required
                placeholder="e.g., United States"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label for="field" class="block text-sm font-medium text-gray-700 mb-1">Field *</label>
              <input
                id="field"
                type="text"
                bind:value={formData.field}
                required
                placeholder="e.g., All Fields, Engineering"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label for="level" class="block text-sm font-medium text-gray-700 mb-1">Level *</label>
              <select
                id="level"
                bind:value={formData.level}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="">Select Level</option>
                <option value="Bachelor">Bachelor's</option>
                <option value="Master's">Master's</option>
                <option value="PhD">PhD</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>
            <div>
              <label for="type" class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                id="type"
                bind:value={formData.type}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="">Select Type</option>
                <option value="Merit-based">Merit-based</option>
                <option value="Research-based">Research-based</option>
                <option value="Need-based">Need-based</option>
                <option value="Field-specific">Field-specific</option>
              </select>
            </div>
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              id="description"
              bind:value={formData.description}
              required
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            ></textarea>
          </div>

          <div>
            <label for="requirements" class="block text-sm font-medium text-gray-700 mb-1">Requirements (one per line)</label>
            <textarea
              id="requirements"
              bind:value={formData.requirements}
              rows="4"
              placeholder="Bachelor's degree&#10;English proficiency&#10;Leadership experience"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            ></textarea>
          </div>

          <!-- Additional Fields -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="website" class="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
              <input
                id="website"
                type="url"
                bind:value={formData.website}
                placeholder="https://example.com/scholarship"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label for="min_gpa" class="block text-sm font-medium text-gray-700 mb-1">Minimum GPA</label>
              <input
                id="min_gpa"
                type="number"
                step="0.1"
                min="0"
                max="4"
                bind:value={formData.min_gpa}
                placeholder="e.g., 3.5"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label for="min_ielts" class="block text-sm font-medium text-gray-700 mb-1">Minimum IELTS Score</label>
              <input
                id="min_ielts"
                type="number"
                step="0.5"
                min="0"
                max="9"
                bind:value={formData.min_ielts}
                placeholder="e.g., 6.5"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label for="min_toefl" class="block text-sm font-medium text-gray-700 mb-1">Minimum TOEFL Score</label>
              <input
                id="min_toefl"
                type="number"
                min="0"
                max="120"
                bind:value={formData.min_toefl}
                placeholder="e.g., 80"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label for="age_limit" class="block text-sm font-medium text-gray-700 mb-1">Age Limit</label>
              <input
                id="age_limit"
                type="number"
                min="16"
                max="65"
                bind:value={formData.age_limit}
                placeholder="e.g., 25"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div>
              <label for="nationality_restrictions" class="block text-sm font-medium text-gray-700 mb-1">Nationality Restrictions</label>
              <input
                id="nationality_restrictions"
                type="text"
                bind:value={formData.nationality_restrictions}
                placeholder="e.g., US, Canada, UK (comma-separated)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </div>

          <!-- Graduate Program Funding Section -->
          <div class="border-t pt-6 mt-6">
            <h4 class="text-lg font-semibold mb-4 text-blue-700">🎓 Graduate Program Funding</h4>
            <p class="text-sm text-gray-600 mb-4">Use this section for US graduate programs with assistantships, research positions, or automatic funding.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="funding_category" class="block text-sm font-medium text-gray-700 mb-1">Funding Category *</label>
                <select
                  id="funding_category"
                  bind:value={formData.funding_category}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="Traditional Scholarship">Traditional Scholarship</option>
                  <option value="Graduate Program Funding">Graduate Program Funding</option>
                  <option value="Advertised Position">Advertised Position</option>
                </select>
              </div>
              
              {#if formData.funding_category === 'Graduate Program Funding' || formData.funding_category === 'Advertised Position'}
                <div>
                  <label for="university_name" class="block text-sm font-medium text-gray-700 mb-1">University Name *</label>
                  <input
                    id="university_name"
                    type="text"
                    bind:value={formData.university_name}
                    placeholder="e.g., Harvard University"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="program_name" class="block text-sm font-medium text-gray-700 mb-1">Program Name *</label>
                  <input
                    id="program_name"
                    type="text"
                    bind:value={formData.program_name}
                    placeholder="e.g., PhD in Computer Science"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="department" class="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    id="department"
                    type="text"
                    bind:value={formData.department}
                    placeholder="e.g., Computer Science Department"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="funding_type" class="block text-sm font-medium text-gray-700 mb-1">Funding Type *</label>
                  <select
                    id="funding_type"
                    bind:value={formData.funding_type}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">Select Funding Type</option>
                    <option value="RA">Research Assistantship (RA)</option>
                    <option value="TA">Teaching Assistantship (TA)</option>
                    <option value="GA">Graduate Assistantship (GA)</option>
                    <option value="Full Funding">Full Funding Package</option>
                    <option value="Tuition Waiver">Tuition Waiver Only</option>
                    <option value="Mixed">Mixed (RA/TA/Fellowship)</option>
                  </select>
                </div>
                <div>
                  <label for="application_method" class="block text-sm font-medium text-gray-700 mb-1">Application Method *</label>
                  <select
                    id="application_method"
                    bind:value={formData.application_method}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">Select Application Method</option>
                    <option value="Direct Apply">Direct Apply (Automatic Consideration)</option>
                    <option value="Contact Professor First">Contact Professor First</option>
                    <option value="Advertised Position">Apply to Advertised Position</option>
                  </select>
                </div>
                <div>
                  <label for="has_automatic_funding" class="flex items-center space-x-2">
                    <input
                      id="has_automatic_funding"
                      type="checkbox"
                      bind:checked={formData.has_automatic_funding}
                      class="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    />
                    <span class="text-sm font-medium text-gray-700">Has Automatic Funding</span>
                  </label>
                  <p class="text-xs text-gray-500 mt-1">Check if program automatically considers all applicants for funding</p>
                </div>
              {/if}
              
              {#if formData.funding_category === 'Advertised Position'}
                <div>
                  <label for="professor_name" class="block text-sm font-medium text-gray-700 mb-1">Professor Name</label>
                  <input
                    id="professor_name"
                    type="text"
                    bind:value={formData.professor_name}
                    placeholder="e.g., Dr. John Smith"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="professor_email" class="block text-sm font-medium text-gray-700 mb-1">Professor Email</label>
                  <input
                    id="professor_email"
                    type="email"
                    bind:value={formData.professor_email}
                    placeholder="e.g., john.smith@university.edu"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div class="md:col-span-2">
                  <label for="position_details" class="block text-sm font-medium text-gray-700 mb-1">Position Details</label>
                  <textarea
                    id="position_details"
                    bind:value={formData.position_details}
                    rows="3"
                    placeholder="Details about the research project, lab, specific requirements, etc."
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  ></textarea>
                </div>
              {/if}
            </div>
          </div>

          <!-- Graduate Program Funding Section -->
          <div class="border-t pt-6 mt-6">
            <h4 class="text-lg font-semibold mb-4 text-blue-700">🎓 Graduate Program Funding</h4>
            <p class="text-sm text-gray-600 mb-4">Use this section for US graduate programs with assistantships, research positions, or automatic funding.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="funding_category" class="block text-sm font-medium text-gray-700 mb-1">Funding Category *</label>
                <select
                  id="funding_category"
                  bind:value={formData.funding_category}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="Traditional Scholarship">Traditional Scholarship</option>
                  <option value="Graduate Program Funding">Graduate Program Funding</option>
                  <option value="Advertised Position">Advertised Position</option>
                </select>
              </div>
              
              {#if formData.funding_category === 'Graduate Program Funding' || formData.funding_category === 'Advertised Position'}
                <div>
                  <label for="university_name" class="block text-sm font-medium text-gray-700 mb-1">University Name *</label>
                  <input
                    id="university_name"
                    type="text"
                    bind:value={formData.university_name}
                    placeholder="e.g., Harvard University"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="program_name" class="block text-sm font-medium text-gray-700 mb-1">Program Name *</label>
                  <input
                    id="program_name"
                    type="text"
                    bind:value={formData.program_name}
                    placeholder="e.g., PhD in Computer Science"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="department" class="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    id="department"
                    type="text"
                    bind:value={formData.department}
                    placeholder="e.g., Computer Science Department"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="funding_type" class="block text-sm font-medium text-gray-700 mb-1">Funding Type *</label>
                  <select
                    id="funding_type"
                    bind:value={formData.funding_type}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">Select Funding Type</option>
                    <option value="RA">Research Assistantship (RA)</option>
                    <option value="TA">Teaching Assistantship (TA)</option>
                    <option value="GA">Graduate Assistantship (GA)</option>
                    <option value="Full Funding">Full Funding Package</option>
                    <option value="Tuition Waiver">Tuition Waiver Only</option>
                    <option value="Mixed">Mixed (RA/TA/Fellowship)</option>
                  </select>
                </div>
                <div>
                  <label for="application_method" class="block text-sm font-medium text-gray-700 mb-1">Application Method *</label>
                  <select
                    id="application_method"
                    bind:value={formData.application_method}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">Select Application Method</option>
                    <option value="Direct Apply">Direct Apply (Automatic Consideration)</option>
                    <option value="Contact Professor First">Contact Professor First</option>
                    <option value="Advertised Position">Apply to Advertised Position</option>
                  </select>
                </div>
                <div>
                  <label for="has_automatic_funding" class="flex items-center space-x-2">
                    <input
                      id="has_automatic_funding"
                      type="checkbox"
                      bind:checked={formData.has_automatic_funding}
                      class="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    />
                    <span class="text-sm font-medium text-gray-700">Has Automatic Funding</span>
                  </label>
                  <p class="text-xs text-gray-500 mt-1">Check if program automatically considers all applicants for funding</p>
                </div>
              {/if}
              
              {#if formData.funding_category === 'Advertised Position'}
                <div>
                  <label for="professor_name" class="block text-sm font-medium text-gray-700 mb-1">Professor Name</label>
                  <input
                    id="professor_name"
                    type="text"
                    bind:value={formData.professor_name}
                    placeholder="e.g., Dr. John Smith"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="professor_email" class="block text-sm font-medium text-gray-700 mb-1">Professor Email</label>
                  <input
                    id="professor_email"
                    type="email"
                    bind:value={formData.professor_email}
                    placeholder="e.g., john.smith@university.edu"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div class="md:col-span-2">
                  <label for="position_details" class="block text-sm font-medium text-gray-700 mb-1">Position Details</label>
                  <textarea
                    id="position_details"
                    bind:value={formData.position_details}
                    rows="3"
                    placeholder="Details about the research project, lab, specific requirements, etc."
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  ></textarea>
                </div>
              {/if}
            </div>
          </div>

          <!-- Graduate Program Funding Section -->
          <div class="border-t pt-6 mt-6">
            <h4 class="text-lg font-semibold mb-4 text-blue-700">🎓 Graduate Program Funding</h4>
            <p class="text-sm text-gray-600 mb-4">Use this section for US graduate programs with assistantships, research positions, or automatic funding.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="funding_category" class="block text-sm font-medium text-gray-700 mb-1">Funding Category *</label>
                <select
                  id="funding_category"
                  bind:value={formData.funding_category}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="Traditional Scholarship">Traditional Scholarship</option>
                  <option value="Graduate Program Funding">Graduate Program Funding</option>
                  <option value="Advertised Position">Advertised Position</option>
                </select>
              </div>
              
              {#if formData.funding_category === 'Graduate Program Funding' || formData.funding_category === 'Advertised Position'}
                <div>
                  <label for="university_name" class="block text-sm font-medium text-gray-700 mb-1">University Name *</label>
                  <input
                    id="university_name"
                    type="text"
                    bind:value={formData.university_name}
                    placeholder="e.g., Harvard University"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="program_name" class="block text-sm font-medium text-gray-700 mb-1">Program Name *</label>
                  <input
                    id="program_name"
                    type="text"
                    bind:value={formData.program_name}
                    placeholder="e.g., PhD in Computer Science"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="department" class="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    id="department"
                    type="text"
                    bind:value={formData.department}
                    placeholder="e.g., Computer Science Department"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="funding_type" class="block text-sm font-medium text-gray-700 mb-1">Funding Type *</label>
                  <select
                    id="funding_type"
                    bind:value={formData.funding_type}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">Select Funding Type</option>
                    <option value="RA">Research Assistantship (RA)</option>
                    <option value="TA">Teaching Assistantship (TA)</option>
                    <option value="GA">Graduate Assistantship (GA)</option>
                    <option value="Full Funding">Full Funding Package</option>
                    <option value="Tuition Waiver">Tuition Waiver Only</option>
                    <option value="Mixed">Mixed (RA/TA/Fellowship)</option>
                  </select>
                </div>
                <div>
                  <label for="application_method" class="block text-sm font-medium text-gray-700 mb-1">Application Method *</label>
                  <select
                    id="application_method"
                    bind:value={formData.application_method}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">Select Application Method</option>
                    <option value="Direct Apply">Direct Apply (Automatic Consideration)</option>
                    <option value="Contact Professor First">Contact Professor First</option>
                    <option value="Advertised Position">Apply to Advertised Position</option>
                  </select>
                </div>
                <div>
                  <label for="has_automatic_funding" class="flex items-center space-x-2">
                    <input
                      id="has_automatic_funding"
                      type="checkbox"
                      bind:checked={formData.has_automatic_funding}
                      class="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    />
                    <span class="text-sm font-medium text-gray-700">Has Automatic Funding</span>
                  </label>
                  <p class="text-xs text-gray-500 mt-1">Check if program automatically considers all applicants for funding</p>
                </div>
              {/if}
              
              {#if formData.funding_category === 'Advertised Position'}
                <div>
                  <label for="professor_name" class="block text-sm font-medium text-gray-700 mb-1">Professor Name</label>
                  <input
                    id="professor_name"
                    type="text"
                    bind:value={formData.professor_name}
                    placeholder="e.g., Dr. John Smith"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="professor_email" class="block text-sm font-medium text-gray-700 mb-1">Professor Email</label>
                  <input
                    id="professor_email"
                    type="email"
                    bind:value={formData.professor_email}
                    placeholder="e.g., john.smith@university.edu"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div class="md:col-span-2">
                  <label for="position_details" class="block text-sm font-medium text-gray-700 mb-1">Position Details</label>
                  <textarea
                    id="position_details"
                    bind:value={formData.position_details}
                    rows="3"
                    placeholder="Details about the research project, lab, specific requirements, etc."
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  ></textarea>
                </div>
              {/if}
            </div>
          </div>

          <div class="flex gap-4 pt-4">
            <button
              type="submit"
              class="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition duration-200"
            >
              Add Scholarship
            </button>
            <button
              type="button"
              onclick={resetForm}
              class="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    {/if}

    <!-- Scholarships List -->
    <div class="bg-white rounded-lg shadow-sm border">
      <div class="p-6 border-b">
        <h3 class="text-lg font-semibold">Current Scholarships ({scholarships.length})</h3>
      </div>
      
      {#if isLoading}
        <div class="p-8 text-center">Loading...</div>
      {:else if scholarships.length === 0}
        <div class="p-8 text-center">No scholarships found. Add your first one!</div>
      {:else}
        <div class="p-6">
          <div class="space-y-4">
            {#each scholarships as scholarship}
              <div class="border rounded-lg p-4">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <h4 class="font-semibold">{scholarship.title}</h4>
                      {#if scholarship.funding_category === 'Graduate Program Funding'}
                        <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">🎓 Program Funding</span>
                      {:else if scholarship.funding_category === 'Advertised Position'}
                        <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">🔬 Research Position</span>
                      {:else}
                        <span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">🏆 Scholarship</span>
                      {/if}
                      {#if scholarship.has_automatic_funding}
                        <span class="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">✨ Auto Funding</span>
                      {/if}
                    </div>
                    
                    {#if scholarship.funding_category === 'Graduate Program Funding' || scholarship.funding_category === 'Advertised Position'}
                      <p class="text-sm text-gray-600 mb-1">
                        <strong>{scholarship.university_name}</strong> • {scholarship.program_name}
                      </p>
                      {#if scholarship.department}
                        <p class="text-sm text-gray-500 mb-1">{scholarship.department}</p>
                      {/if}
                      {#if scholarship.funding_type}
                        <p class="text-sm text-blue-600 mb-1">Funding: {scholarship.funding_type}</p>
                      {/if}
                      {#if scholarship.application_method}
                        <p class="text-sm text-gray-600 mb-1">Apply: {scholarship.application_method}</p>
                      {/if}
                      {#if scholarship.professor_name}
                        <p class="text-sm text-green-600 mb-1">Contact: {scholarship.professor_name}</p>
                      {/if}
                      {#if scholarship.professor_email}
                        <p class="text-sm text-green-600 mb-1">Email: {scholarship.professor_email}</p>
                      {/if}
                    {:else}
                      <p class="text-sm text-gray-600 mb-1">{scholarship.provider} • {scholarship.amount}</p>
                    {/if}
                    
                    <p class="text-sm text-gray-500">{scholarship.location} • Deadline: {scholarship.deadline}</p>
                    
                    {#if scholarship.position_details}
                      <p class="text-sm text-gray-600 mt-2 italic">{scholarship.position_details}</p>
                    {/if}
                  </div>
                  
                  <div class="flex gap-2 ml-4">
                    <button
                      onclick={() => deleteScholarship(scholarship.id)}
                      class="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div> 