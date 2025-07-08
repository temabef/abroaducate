<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let formData: any;
  export let editingScholarship: any;
  export let showAddForm: boolean = false;

  const dispatch = createEventDispatcher();

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    dispatch('save', formData);
  }

  function handleCancel() {
    dispatch('cancel');
  }

  function resetForm() {
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

{#if showAddForm}
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <h2 class="text-xl font-bold mb-4">
        {editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}
      </h2>
      
      <form on:submit={handleSubmit} class="space-y-4">
        <!-- Funding Category -->
        <div>
          <label class="block text-sm font-medium mb-1">Funding Category</label>
          <select bind:value={formData.funding_category} class="w-full border rounded px-3 py-2">
            <option value="Traditional Scholarship">Traditional Scholarship</option>
            <option value="Graduate Program Funding">Graduate Program Funding</option>
            <option value="Advertised Position">Advertised Position</option>
          </select>
        </div>

        <!-- Basic Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Title *</label>
            <input type="text" bind:value={formData.title} required class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Provider *</label>
            <input type="text" bind:value={formData.provider} required class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Amount</label>
            <input type="text" bind:value={formData.amount} class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Deadline</label>
            <input type="date" bind:value={formData.deadline} class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Location</label>
            <input type="text" bind:value={formData.location} class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Field</label>
            <input type="text" bind:value={formData.field} class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Level</label>
            <select bind:value={formData.level} class="w-full border rounded px-3 py-2">
              <option value="">Select Level</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Graduate">Graduate</option>
              <option value="PhD">PhD</option>
              <option value="Postgraduate">Postgraduate</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Type</label>
            <select bind:value={formData.type} class="w-full border rounded px-3 py-2">
              <option value="">Select Type</option>
              <option value="Merit-based">Merit-based</option>
              <option value="Need-based">Need-based</option>
              <option value="Research-based">Research-based</option>
            </select>
          </div>
        </div>

        <!-- Graduate Funding Fields (conditional) -->
        {#if formData.funding_category === 'Graduate Program Funding'}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded">
            <h3 class="md:col-span-2 font-medium text-blue-900">Graduate Program Details</h3>
            <div>
              <label class="block text-sm font-medium mb-1">University Name</label>
              <input type="text" bind:value={formData.university_name} class="w-full border rounded px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Program Name</label>
              <input type="text" bind:value={formData.program_name} class="w-full border rounded px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Department</label>
              <input type="text" bind:value={formData.department} class="w-full border rounded px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Funding Type</label>
              <select bind:value={formData.funding_type} class="w-full border rounded px-3 py-2">
                <option value="">Select Type</option>
                <option value="Full Funding">Full Funding</option>
                <option value="RA">Research Assistantship</option>
                <option value="TA">Teaching Assistantship</option>
                <option value="Fellowship">Fellowship</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-1">Application Method</label>
              <input type="text" bind:value={formData.application_method} class="w-full border rounded px-3 py-2">
            </div>
          </div>
        {/if}

        <!-- Advertised Position Fields (conditional) -->
        {#if formData.funding_category === 'Advertised Position'}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded">
            <h3 class="md:col-span-2 font-medium text-green-900">Position Details</h3>
            <div>
              <label class="block text-sm font-medium mb-1">Professor Name</label>
              <input type="text" bind:value={formData.professor_name} class="w-full border rounded px-3 py-2">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Professor Email</label>
              <input type="email" bind:value={formData.professor_email} class="w-full border rounded px-3 py-2">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-1">Position Details</label>
              <textarea bind:value={formData.position_details} rows="3" class="w-full border rounded px-3 py-2"></textarea>
            </div>
          </div>
        {/if}

        <!-- Description and Requirements -->
        <div>
          <label class="block text-sm font-medium mb-1">Description</label>
          <textarea bind:value={formData.description} rows="4" class="w-full border rounded px-3 py-2"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Requirements (one per line)</label>
          <textarea bind:value={formData.requirements} rows="4" class="w-full border rounded px-3 py-2"></textarea>
        </div>

        <!-- Additional Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Website</label>
            <input type="url" bind:value={formData.website} class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Nationality Restrictions (comma-separated)</label>
            <input type="text" bind:value={formData.nationality_restrictions} class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Minimum GPA</label>
            <input type="number" step="0.1" bind:value={formData.min_gpa} class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Minimum IELTS</label>
            <input type="number" step="0.5" bind:value={formData.min_ielts} class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Minimum TOEFL</label>
            <input type="number" bind:value={formData.min_toefl} class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Age Limit</label>
            <input type="number" bind:value={formData.age_limit} class="w-full border rounded px-3 py-2">
          </div>
        </div>

        <div>
          <label class="flex items-center">
            <input type="checkbox" bind:checked={formData.is_active} class="mr-2">
            Active
          </label>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-4">
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {editingScholarship ? 'Update' : 'Add'} Scholarship
          </button>
          <button type="button" on:click={handleCancel} class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
{/if} 