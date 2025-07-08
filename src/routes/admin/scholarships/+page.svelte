<script lang="ts">
  import { onMount } from 'svelte';
  import { isUserAdmin } from '$lib/utils/adminHelper';
  import ScholarshipForm from '$lib/components/ScholarshipForm.svelte';
  import ScholarshipTable from '$lib/components/ScholarshipTable.svelte';
  
  let { data } = $props();
  let { supabase, session } = $derived(data);

  interface Scholarship {
    id?: string;
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
    funding_category?: string;
    university_name?: string;
    program_name?: string;
    department?: string;
    funding_type?: string;
    application_method?: string;
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
  let showBulkImport = $state(false);
  let bulkCsvData = $state('');

  // Pagination state
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalScholarships = $state(0);
  let totalPages = $state(1);

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

  let isAdmin = $state(false);

  onMount(async () => {
    // Check if user can manage scholarships
    const { data: canManage, error: permissionError } = await supabase.rpc('can_manage_scholarships');
    
    if (permissionError) {
      isAdmin = false;
    } else if (canManage) {
      isAdmin = true;
      await loadScholarships();
    } else {
      isAdmin = false;
    }
  });

  // Legacy admin check as fallback
  $effect(() => {
    if (session?.user) {
      const legacyCheck = 
        session?.user?.email === 'solakolawole62@gmail.com' || 
        session?.user?.email === 'admin@abroaducate.com' || 
        session?.user?.email?.includes('admin') ||
        session?.user?.user_metadata?.role === 'admin';
        
      isAdmin = isAdmin || legacyCheck;
    }
  });

  async function loadScholarships() {
    isLoading = true;
    
    // Get count for pagination
    const { count, error: countError } = await supabase
      .from('scholarships')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting scholarships:', countError);
    } else {
      totalScholarships = count || 0;
      totalPages = Math.ceil(totalScholarships / pageSize);
      
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
      }
    }
    
    // Get paginated data
    const { data: scholarshipData, error } = await supabase
      .from('scholarships')
      .select('*')
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

    if (error) {
      console.error('Error loading scholarships:', error);
    } else {
      scholarships = scholarshipData || [];
    }
    
    isLoading = false;
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      loadScholarships();
    }
  }

  async function handleSaveScholarship(event: any) {
    const scholarshipData = {
      ...event.detail || formData,
      requirements: typeof event.detail?.requirements === 'string' 
        ? event.detail.requirements.split('\n').filter((r: string) => r.trim())
        : formData.requirements.split('\n').filter(r => r.trim()),
      nationality_restrictions: typeof event.detail?.nationality_restrictions === 'string'
        ? event.detail.nationality_restrictions.split(',').map((c: string) => c.trim()).filter((c: string) => c)
        : formData.nationality_restrictions 
          ? formData.nationality_restrictions.split(',').map(c => c.trim()).filter(c => c)
          : [],
      min_gpa: event.detail?.min_gpa ? parseFloat(event.detail.min_gpa) : (formData.min_gpa ? parseFloat(formData.min_gpa) : null),
      min_ielts: event.detail?.min_ielts ? parseFloat(event.detail.min_ielts) : (formData.min_ielts ? parseFloat(formData.min_ielts) : null),
      min_toefl: event.detail?.min_toefl ? parseInt(event.detail.min_toefl) : (formData.min_toefl ? parseInt(formData.min_toefl) : null),
      age_limit: event.detail?.age_limit ? parseInt(event.detail.age_limit) : (formData.age_limit ? parseInt(formData.age_limit) : null),
    };

    let result;
    if (editingScholarship) {
      result = await supabase
        .from('scholarships')
        .update(scholarshipData)
        .eq('id', editingScholarship.id);
    } else {
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

  async function handleDeleteScholarship(event: any) {
    const scholarship = event.detail;
    
    const { error } = await supabase
      .from('scholarships')
      .delete()
      .eq('id', scholarship.id);

    if (error) {
      console.error('Error deleting scholarship:', error);
      alert('Error deleting scholarship: ' + error.message);
    } else {
      await loadScholarships();
      alert('Scholarship deleted!');
    }
  }

  function handleEditScholarship(event: any) {
    const scholarship = event.detail;
    editingScholarship = scholarship;
    formData = {
      title: scholarship.title,
      provider: scholarship.provider,
      amount: scholarship.amount,
      deadline: scholarship.deadline,
      location: scholarship.location,
      field: scholarship.field,
      level: scholarship.level,
      type: scholarship.type,
      description: scholarship.description,
      requirements: scholarship.requirements?.join('\n') || '',
      website: scholarship.website || '',
      min_gpa: scholarship.min_gpa?.toString() || '',
      min_ielts: scholarship.min_ielts?.toString() || '',
      min_toefl: scholarship.min_toefl?.toString() || '',
      age_limit: scholarship.age_limit?.toString() || '',
      nationality_restrictions: scholarship.nationality_restrictions?.join(', ') || '',
      is_active: scholarship.is_active,
      funding_category: scholarship.funding_category || 'Traditional Scholarship',
      university_name: scholarship.university_name || '',
      program_name: scholarship.program_name || '',
      department: scholarship.department || '',
      funding_type: scholarship.funding_type || '',
      application_method: scholarship.application_method || '',
      professor_name: scholarship.professor_name || '',
      professor_email: scholarship.professor_email || '',
      position_details: scholarship.position_details || '',
      has_automatic_funding: scholarship.has_automatic_funding || false
    };
    showAddForm = true;
  }

  function handleAddScholarship() {
    showAddForm = true;
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

  function handleChangePage(event: any) {
    goToPage(event.detail);
  }

  // Simple bulk import functionality
  async function processBulkImport() {
    if (!bulkCsvData.trim()) {
      alert('Please paste CSV data');
      return;
    }

    const lines = bulkCsvData.trim().split('\n');
    let successCount = 0;
    let errorCount = 0;

    for (const line of lines) {
      try {
        const fields = line.split(',').map(field => field.trim().replace(/^"(.*)"$/, '$1'));
        
        const scholarship = {
          title: fields[0] || '',
          provider: fields[1] || '',
          amount: fields[2] || '',
          deadline: fields[3] || '',
          location: fields[4] || '',
          field: fields[5] || '',
          level: fields[6] || '',
          type: fields[7] || '',
          description: fields[8] || '',
          requirements: fields[9] ? fields[9].split(';') : [],
          website: fields[10] || undefined,
          is_active: true,
          funding_category: 'Traditional Scholarship'
        };

        const { error } = await supabase
          .from('scholarships')
          .insert(scholarship);

        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      } catch (e) {
        errorCount++;
      }
    }

    alert(`Import completed: ${successCount} successful, ${errorCount} errors`);
    bulkCsvData = '';
    showBulkImport = false;
    await loadScholarships();
  }
</script>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Scholarship Administration</h1>
      <p class="mt-2 text-gray-600">Manage scholarship listings and import new opportunities</p>
    </div>

    {#if !isAdmin}
      <div class="bg-white rounded-lg shadow p-6">
        <div class="text-center">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p class="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    {:else}
      <!-- Action Buttons -->
      <div class="mb-6 flex gap-4">
        <button
          on:click={handleAddScholarship}
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Scholarship
        </button>
        <button
          on:click={() => showBulkImport = !showBulkImport}
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Bulk Import
        </button>
      </div>

      <!-- Bulk Import Section -->
      {#if showBulkImport}
        <div class="bg-white rounded-lg shadow mb-6 p-6">
          <h3 class="text-lg font-semibold mb-4">CSV Bulk Import</h3>
          <p class="text-sm text-gray-600 mb-4">
            Format: Title, Provider, Amount, Deadline, Location, Field, Level, Type, Description, Requirements (semicolon-separated), Website
          </p>
          <textarea
            bind:value={bulkCsvData}
            rows="6"
            placeholder="Paste CSV data here..."
            class="w-full border rounded px-3 py-2 mb-4"
          ></textarea>
          <div class="flex gap-2">
            <button
              on:click={processBulkImport}
              class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Import Data
            </button>
            <button
              on:click={() => showBulkImport = false}
              class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      {/if}

      <!-- Scholarship Form Component -->
      <ScholarshipForm 
        bind:formData 
        bind:editingScholarship 
        bind:showAddForm
        on:save={handleSaveScholarship}
        on:cancel={resetForm}
      />

      <!-- Scholarship Table Component -->
      <ScholarshipTable 
        {scholarships}
        {currentPage}
        {totalPages}
        {totalScholarships}
        {pageSize}
        {isLoading}
        on:edit={handleEditScholarship}
        on:delete={handleDeleteScholarship}
        on:add={handleAddScholarship}
        on:changePage={handleChangePage}
      />
    {/if}
  </div>
</div> 