<script lang="ts">
  import { onMount } from 'svelte';
  import { isUserAdmin } from '$lib/utils/adminHelper';
  import SuccessModal from '$lib/components/SuccessModal.svelte';
  
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
    levels?: string[]; // New multiple levels array
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
  let selectedImportType = $state('Traditional Scholarship');

  // Success modal state
  let showSuccessModal = $state(false);
  let successModalTitle = $state('Success!');
  let successModalMessage = $state('Operation completed successfully');
  let successModalIcon = $state('✅');

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
    levels: [] as string[], // New multiple levels array
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

  // Available level options for multiple selection
  const levelOptions = [
    { value: 'Bachelor', label: "Bachelor's" },
    { value: "Master's", label: "Master's" },
    { value: 'PhD', label: 'PhD' },
    { value: 'Graduate', label: 'Graduate' }
  ];

  let isAdmin = $state(false);

  onMount(async () => {
    // Use only role-based admin check via Supabase RPC
    if (session?.user) {
      try {
        const { data: canManage, error: permissionError } = await supabase.rpc('can_manage_scholarships');
        if (permissionError) {
          console.error('❌ Permission check failed:', permissionError);
          isAdmin = false;
        } else if (canManage) {
          isAdmin = true;
          console.log('✅ Admin access granted via RPC');
          await loadScholarships();
        } else {
          isAdmin = false;
          console.log('❌ Access denied - not admin');
        }
      } catch (error) {
        console.error('❌ RPC call failed:', error);
        isAdmin = false;
      }
    }
  });

  async function loadScholarships() {
    isLoading = true;
    console.log('🔄 Loading scholarships for admin...');
    
    try {
      // Use enhanced nuclear function to bypass RLS and get decoded entities
      const { data: result, error } = await supabase.rpc('nuclear_load_scholarships_enhanced', {
        page_number: currentPage,
        page_size: pageSize
      });
      
      if (error) {
        console.error('❌ Error loading scholarships:', error);
        // Fallback to direct query for debugging
        await loadScholarshipsDirect();
      } else if (result?.error) {
        console.error('❌ Nuclear function returned error:', result.error);
        await loadScholarshipsDirect();
      } else {
        console.log('✅ Scholarships loaded via enhanced nuclear function:', result);
        scholarships = result.scholarships || [];
        totalScholarships = result.total_count || 0;
        totalPages = Math.ceil(totalScholarships / pageSize);
        
        if (currentPage > totalPages && totalPages > 0) {
          currentPage = totalPages;
        }
      }
    } catch (error) {
      console.error('❌ Exception loading scholarships:', error);
      await loadScholarshipsDirect();
    }
    
    isLoading = false;
  }

  // Fallback direct query for debugging
  async function loadScholarshipsDirect() {
    console.log('🔄 Trying direct query fallback...');
    
    // Get count for pagination
    const { count, error: countError } = await supabase
      .from('scholarships')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting scholarships:', countError);
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
      console.error('❌ Error loading scholarships direct:', error);
    } else {
      scholarships = scholarshipData || [];
      console.log('✅ Scholarships loaded directly:', scholarships.length);
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      loadScholarships();
    }
  }

  async function saveScholarship(event: Event) {
    event.preventDefault();
    
    // Prepare data - convert empty strings to null to avoid constraint violations
    const scholarshipData = {
      ...formData,
      requirements: formData.requirements.split('\n').filter(r => r.trim()),
      nationality_restrictions: formData.nationality_restrictions 
        ? formData.nationality_restrictions.split(',').map(c => c.trim()).filter(c => c)
        : [],
      levels: formData.levels.length > 0 ? formData.levels : [formData.level], // Ensure levels array is populated
      min_gpa: formData.min_gpa ? parseFloat(formData.min_gpa) : null,
      min_ielts: formData.min_ielts ? parseFloat(formData.min_ielts) : null,
      min_toefl: formData.min_toefl ? parseInt(formData.min_toefl) : null,
      age_limit: formData.age_limit ? parseInt(formData.age_limit) : null,
      // Convert empty strings to null for database constraints
      funding_type: formData.funding_type || null,
      application_method: formData.application_method || null,
      university_name: formData.university_name || null,
      program_name: formData.program_name || null,
      department: formData.department || null,
      professor_name: formData.professor_name || null,
      professor_email: formData.professor_email || null,
      position_details: formData.position_details || null,
      website: formData.website || null
    };

    let result;
    if (editingScholarship) {
      result = await supabase.rpc('nuclear_update_scholarship_enhanced', {
        scholarship_id: editingScholarship.id,
        scholarship_data: scholarshipData
      });
    } else {
      result = await supabase.rpc('nuclear_insert_scholarship_enhanced', {
        scholarship_data: scholarshipData
      });
    }

    if (result.error) {
      console.error('Error saving scholarship:', result.error);
      showSuccessModal = true;
      successModalTitle = 'Error Saving Scholarship';
      successModalMessage = result.error.message;
      successModalIcon = '❌';
    } else if (result.data?.error) {
      console.error('Function returned error:', result.data.error);
      showSuccessModal = true;
      successModalTitle = 'Error Saving Scholarship';
      successModalMessage = result.data.error;
      successModalIcon = '❌';
    } else {
      cancelForm();
      await loadScholarships();
      showSuccessModal = true;
      successModalTitle = editingScholarship ? 'Scholarship Updated!' : 'Scholarship Added!';
      successModalMessage = editingScholarship ? 'Scholarship updated successfully.' : 'Scholarship added successfully.';
      successModalIcon = '✅';
    }
  }

  async function deleteScholarship(id: string | undefined) {
    if (!id) {
      showSuccessModal = true;
      successModalTitle = 'Error Deleting Scholarship';
      successModalMessage = 'Invalid scholarship ID';
      successModalIcon = '❌';
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this scholarship?')) return;

    const { data, error } = await supabase.rpc('nuclear_delete_scholarship', {
      scholarship_id: id
    });

    if (error) {
      console.error('Error deleting scholarship:', error);
      showSuccessModal = true;
      successModalTitle = 'Error Deleting Scholarship';
      successModalMessage = error.message;
      successModalIcon = '❌';
    } else if (data?.error) {
      console.error('Nuclear function returned error:', data.error);
      showSuccessModal = true;
      successModalTitle = 'Error Deleting Scholarship';
      successModalMessage = data.error;
      successModalIcon = '❌';
    } else {
      console.log('✅ Scholarship deleted successfully');
      await loadScholarships();
      showSuccessModal = true;
      successModalTitle = 'Scholarship Deleted!';
      successModalMessage = 'Scholarship deleted successfully.';
      successModalIcon = '✅';
    }
  }

  function handleEditScholarship(scholarship: Scholarship) {
    editingScholarship = scholarship;
    formData = {
      title: scholarship.title,
      provider: scholarship.provider,
      amount: scholarship.amount,
      deadline: scholarship.deadline,
      location: scholarship.location,
      field: scholarship.field,
      level: scholarship.level,
      levels: scholarship.levels || [scholarship.level], // Use levels array or fallback to single level
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
    console.log('🔄 Resetting form data');
    editingScholarship = null;
    // Don't set showAddForm = false here, as we want to keep the form open
    formData = {
      title: '',
      provider: '',
      amount: '',
      deadline: '',
      location: '',
      field: '',
      level: '',
      levels: [], // Reset levels array
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

  function cancelForm() {
    console.log('❌ Canceling form');
    editingScholarship = null;
    showAddForm = false;
    resetForm();
  }

  function handleChangePage(event: any) {
    goToPage(event.detail);
  }

  // Simple bulk import functionality (12 essential fields only)
  async function processBulkImport() {
    if (!bulkCsvData.trim()) {
      showSuccessModal = true;
      successModalTitle = 'Error Importing Data';
      successModalMessage = 'Please paste CSV data or upload a file';
      successModalIcon = '❌';
      return;
    }

    console.log('🔄 Starting bulk import process...');
    const lines = bulkCsvData.trim().split('\n');
    
    // Skip header line if it exists
    let startIndex = 0;
    if (lines.length > 0 && lines[0].toLowerCase().includes('title')) {
      startIndex = 1;
      console.log('📋 Header line detected, skipping...');
    }
    
    let successCount = 0;
    let errorCount = 0;
    let errors: string[] = [];
    
    console.log(`📊 Processing ${lines.length - startIndex} lines...`);

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // Skip empty lines
      
      try {
        // Parse CSV line (handling quoted fields)
        const fields = parseCSVLine(line);
        
        let scholarship;
        
        if (selectedImportType === 'Traditional Scholarship') {
          scholarship = {
            title: fields[0] || '',
            provider: fields[1] || '',
            amount: fields[2] || '',
            deadline: fields[3] || '',
            location: fields[4] || '',
            field: fields[5] || '',
            level: fields[6] || '',
            levels: fields[6] ? fields[6].split(';').map(l => l.trim()).filter(l => l) : [], // Parse multiple levels
            type: fields[7] || '',
            description: fields[8] || '',
            requirements: fields[9] ? fields[9].split(';').map(r => r.trim()).filter(r => r) : [],
            website: fields[10] || undefined,
            funding_category: 'Traditional Scholarship',
            // Set defaults for optional fields
            min_gpa: null,
            min_ielts: null,
            min_toefl: null,
            age_limit: null,
            nationality_restrictions: [],
            is_active: true,
            university_name: undefined,
            program_name: undefined,
            department: undefined,
            funding_type: undefined,
            application_method: undefined,
            professor_name: undefined,
            professor_email: undefined,
            position_details: undefined,
            has_automatic_funding: false
          };
        } 
        else if (selectedImportType === 'Graduate Program Funding') {
          scholarship = {
            title: fields[0] || '',
            provider: fields[1] || '',
            amount: fields[2] || '',
            deadline: fields[3] || '',
            location: fields[4] || '',
            field: fields[5] || '',
            level: fields[6] || '',
            levels: fields[6] ? fields[6].split(';').map(l => l.trim()).filter(l => l) : [], // Parse multiple levels
            type: fields[7] || '',
            description: fields[8] || '',
            requirements: fields[9] ? fields[9].split(';').map(r => r.trim()).filter(r => r) : [],
            website: fields[10] || undefined,
            university_name: fields[11] || '',
            program_name: fields[12] || '',
            department: fields[13] || '',
            funding_type: fields[14] || '',
            application_method: fields[15] || '',
            has_automatic_funding: fields[16] ? fields[16].toLowerCase() === 'true' : false,
            funding_category: 'Graduate Program Funding',
            // Set defaults for optional fields
            min_gpa: null,
            min_ielts: null,
            min_toefl: null,
            age_limit: null,
            nationality_restrictions: [],
            is_active: true,
            professor_name: undefined,
            professor_email: undefined,
            position_details: undefined
          };
        } 
        else if (selectedImportType === 'Advertised Position') {
          scholarship = {
            title: fields[0] || '',
            provider: fields[1] || '',
            amount: fields[2] || '',
            deadline: fields[3] || '',
            location: fields[4] || '',
            field: fields[5] || '',
            level: fields[6] || '',
            levels: fields[6] ? fields[6].split(';').map(l => l.trim()).filter(l => l) : [], // Parse multiple levels
            type: fields[7] || '',
            description: fields[8] || '',
            requirements: fields[9] ? fields[9].split(';').map(r => r.trim()).filter(r => r) : [],
            website: fields[10] || undefined,
            university_name: fields[11] || '',
            program_name: fields[12] || '',
            department: fields[13] || '',
            funding_type: fields[14] || '',
            professor_name: fields[15] || '',
            professor_email: fields[16] || '',
            position_details: fields[17] || '',
            funding_category: 'Advertised Position',
            // Set defaults for optional fields
            min_gpa: null,
            min_ielts: null,
            min_toefl: null,
            age_limit: null,
            nationality_restrictions: [],
            is_active: true,
            application_method: 'Contact Professor First',
            has_automatic_funding: false
          };
        }

        // Use nuclear function for admin insert to bypass RLS
        const { data, error } = await supabase.rpc('nuclear_insert_scholarship_enhanced', {
          scholarship_data: scholarship
        });

        if (error) {
          errorCount++;
          errors.push(`Line ${i + 1}: ${error.message}`);
        } else if (data?.error) {
          errorCount++;
          errors.push(`Line ${i + 1}: ${data.error}`);
        } else {
          successCount++;
        }
      } catch (e) {
        errorCount++;
        errors.push(`Line ${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    console.log(`✅ Import completed: ${successCount} successful, ${errorCount} errors`);
    
    let message = `Import completed: ${successCount} successful, ${errorCount} errors`;
    if (errors.length > 0) {
      message += '\n\nErrors:\n' + errors.slice(0, 5).join('\n');
      if (errors.length > 5) {
        message += `\n... and ${errors.length - 5} more errors`;
      }
    }
    
    showSuccessModal = true;
    successModalTitle = 'Import Completed';
    successModalMessage = message;
    successModalIcon = '✅';

    bulkCsvData = '';
    showBulkImport = false;
    console.log('🔄 Reloading scholarships after import...');
    await loadScholarships();
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        bulkCsvData = e.target?.result as string;
      };
      reader.readAsText(file);
    }
  }

  function downloadCSVTemplate() {
    let headers: string[] = [];
    let sampleData: string = '';
    let filename: string = '';
    
    if (selectedImportType === 'Traditional Scholarship') {
      headers = [
        'Title', 'Provider', 'Amount', 'Deadline', 'Location', 'Field', 'Level (semicolon-separated for multiple)', 'Type', 
        'Description', 'Requirements (semicolon-separated)', 'Website'
      ];
      sampleData = '"Merit Excellence Scholarship","Education Foundation","$25,000","2024-12-31","United States","All Fields","Master\'s;PhD","Merit-based","Annual scholarship for outstanding students","Bachelor\'s degree;3.0+ GPA;Leadership experience","https://foundation.edu/scholarship"';
      filename = 'traditional_scholarship_template.csv';
    } 
    else if (selectedImportType === 'Graduate Program Funding') {
      headers = [
        'Title', 'Provider', 'Amount', 'Deadline', 'Location', 'Field', 'Level (semicolon-separated for multiple)', 'Type', 
        'Description', 'Requirements (semicolon-separated)', 'Website', 'University Name', 
        'Program Name', 'Department', 'Funding Type', 'Application Method', 'Has Automatic Funding'
      ];
      sampleData = '"PhD Research Assistantship","MIT","$35,000 + tuition","2024-03-15","Massachusetts, USA","Computer Science","PhD","Research-based","Full funding with research assistantship","Bachelor\'s in CS;3.5+ GPA;Research experience","https://eecs.mit.edu/phd","Massachusetts Institute of Technology","PhD in Computer Science","Electrical Engineering & Computer Science","RA","Direct Apply","true"';
      filename = 'graduate_program_funding_template.csv';
    } 
    else if (selectedImportType === 'Advertised Position') {
      headers = [
        'Title', 'Provider', 'Amount', 'Deadline', 'Location', 'Field', 'Level (semicolon-separated for multiple)', 'Type', 
        'Description', 'Requirements (semicolon-separated)', 'Website', 'University Name', 
        'Program Name', 'Department', 'Funding Type', 'Professor Name', 'Professor Email', 'Position Details'
      ];
      sampleData = '"PhD Position in Machine Learning","Stanford University","$45,000 + benefits","2024-06-01","California, USA","Machine Learning","PhD","Research-based","PhD position in AI research lab","MS in CS/related;Strong math background;Python/ML experience","https://stanford.edu/ai-lab","Stanford University","PhD in Computer Science","Computer Science","RA","Dr. Jane Smith","jane.smith@stanford.edu","Research focuses on deep learning applications in healthcare. Looking for motivated PhD candidate."';
      filename = 'advertised_position_template.csv';
    }
    
    const csvContent = headers.join(',') + '\n' + sampleData;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function handleSuccessModalClose() {
    showSuccessModal = false;
    successModalTitle = 'Success!';
    successModalMessage = 'Operation completed successfully';
    successModalIcon = '✅';
  }
</script>

<svelte:head>
  <title>Scholarship Administration - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Scholarship Administration</h1>
      <p class="mt-2 text-gray-600">Manage scholarship listings across all funding categories</p>
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
      <div class="mb-8 flex flex-wrap gap-4">
        <button
          onclick={() => { 
            console.log('🔘 Add New Scholarship clicked'); 
            editingScholarship = null;
            showAddForm = true; 
            resetForm(); 
            console.log('📝 showAddForm set to:', showAddForm);
          }}
          class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          Add New Scholarship
        </button>
        <button
          onclick={() => showBulkImport = !showBulkImport}
          class="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition duration-200 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          Bulk Import CSV
        </button>
        <button
          onclick={loadScholarships}
          class="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition duration-200 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>

      <!-- Scholarship Categories Info -->
      <div class="bg-blue-50 rounded-lg p-6 mb-8">
        <h3 class="text-lg font-semibold text-blue-900 mb-4">📚 Scholarship Categories</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white p-4 rounded-lg border border-blue-200">
            <h4 class="font-semibold text-blue-800 mb-2">🏆 Traditional Scholarship</h4>
            <p class="text-sm text-gray-600">Standard merit-based, need-based, or field-specific scholarships from foundations, organizations, and governments.</p>
          </div>
          <div class="bg-white p-4 rounded-lg border border-blue-200">
            <h4 class="font-semibold text-blue-800 mb-2">🎓 Graduate Program Funding</h4>
            <p class="text-sm text-gray-600">US graduate programs with assistantships (RA/TA), automatic funding, or integrated funding packages.</p>
          </div>
          <div class="bg-white p-4 rounded-lg border border-blue-200">
            <h4 class="font-semibold text-blue-800 mb-2">🔬 Advertised Position</h4>
            <p class="text-sm text-gray-600">Specific research positions, PhD positions, or professor-led opportunities with contact information.</p>
          </div>
        </div>
      </div>

      <!-- Bulk Import Section -->
      {#if showBulkImport}
        <div class="bg-white rounded-lg shadow mb-8 p-6">
                     <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
             <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
             </svg>
             CSV Bulk Import
           </h3>
                      <p class="text-sm text-gray-600 mb-4">
             💡 <strong>Perfect for scraped data!</strong> Import multiple scholarships at once with category-specific templates.
           </p>
           
           <div class="space-y-4">
             <!-- Import Type Selection -->
             <div class="bg-blue-50 p-4 rounded-lg">
               <label class="block text-sm font-medium text-gray-700 mb-2">
                 Select Import Type
               </label>
               <select
                 bind:value={selectedImportType}
                 class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               >
                 <option value="Traditional Scholarship">🏆 Traditional Scholarship</option>
                 <option value="Graduate Program Funding">🎓 Graduate Program Funding</option>
                 <option value="Advertised Position">🔬 Advertised Position</option>
               </select>
               <p class="text-xs text-gray-500 mt-2">
                 Each type has different required fields and CSV format
               </p>
             </div>
             
             <div class="flex gap-4">
               <button
                 onclick={downloadCSVTemplate}
                 class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
               >
                 Download {selectedImportType} Template
               </button>
              <div class="flex-1">
                                  <input
                    type="file"
                    accept=".csv"
                    onchange={handleFileUpload}
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
              </div>
            </div>
            
                         <div>
               <label class="block text-sm font-medium text-gray-700 mb-2">
                 CSV Data (paste scraped data or upload file above)
               </label>
              <textarea
                bind:value={bulkCsvData}
                rows="8"
                                 placeholder="Paste your scraped scholarship data here (CSV format) or upload a file above..."
                class="w-full border rounded-lg px-3 py-2 text-sm font-mono"
              ></textarea>
            </div>
            
                         <div class="text-sm text-gray-600 bg-gray-50 p-4 rounded">
               {#if selectedImportType === 'Traditional Scholarship'}
                 <p><strong>Traditional Scholarship CSV Format (11 fields):</strong></p>
                 <p>Title, Provider, Amount, Deadline (YYYY-MM-DD), Location, Field, Level (semicolon-separated for multiple), Type, Description, Requirements (semicolon-separated), Website</p>
                 <p class="mt-2 text-xs text-gray-500">
                   <strong>Perfect for:</strong> Foundation scholarships, government grants, organization awards
                 </p>
                 <p class="mt-1 text-xs text-blue-600">
                   <strong>Multiple Levels:</strong> Use semicolons to separate multiple levels (e.g., "Master's;PhD" for scholarships open to both levels)
                 </p>
               {:else if selectedImportType === 'Graduate Program Funding'}
                 <p><strong>Graduate Program Funding CSV Format (17 fields):</strong></p>
                 <p>Title, Provider, Amount, Deadline (YYYY-MM-DD), Location, Field, Level (semicolon-separated for multiple), Type, Description, Requirements (semicolon-separated), Website, University Name, Program Name, Department, Funding Type, Application Method, Has Automatic Funding (true/false)</p>
                 <p class="mt-2 text-xs text-gray-500">
                   <strong>Perfect for:</strong> PhD programs, research assistantships, teaching assistantships
                 </p>
                 <p class="mt-1 text-xs text-blue-600">
                   <strong>Multiple Levels:</strong> Use semicolons to separate multiple levels (e.g., "Master's;PhD" for programs accepting both levels)
                 </p>
               {:else if selectedImportType === 'Advertised Position'}
                 <p><strong>Advertised Position CSV Format (18 fields):</strong></p>
                 <p>Title, Provider, Amount, Deadline (YYYY-MM-DD), Location, Field, Level (semicolon-separated for multiple), Type, Description, Requirements (semicolon-separated), Website, University Name, Program Name, Department, Funding Type, Professor Name, Professor Email, Position Details</p>
                 <p class="mt-2 text-xs text-gray-500">
                   <strong>Perfect for:</strong> Research positions, professor-led projects, specific PhD openings
                 </p>
                 <p class="mt-1 text-xs text-blue-600">
                   <strong>Multiple Levels:</strong> Use semicolons to separate multiple levels (e.g., "Master's;PhD" for positions open to both levels)
                 </p>
               {/if}
             </div>
            
            <div class="flex gap-2">
              <button
                onclick={processBulkImport}
                class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Import Data
              </button>
              <button
                onclick={() => { 
                  console.log('❌ Canceling bulk import');
                  showBulkImport = false; 
                  bulkCsvData = ''; 
                }}
                class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Comprehensive Add/Edit Form -->
      {#if showAddForm}
        <div class="bg-white rounded-lg shadow mb-8 p-6">
          <h3 class="text-lg font-semibold mb-6 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            {editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}
          </h3>
          
          <div class="text-sm text-gray-500 mb-4">
            Form state: showAddForm = {showAddForm}, editing = {editingScholarship ? 'true' : 'false'}
          </div>
          
          <form onsubmit={saveScholarship} class="space-y-6">
            <!-- Funding Category Selection -->
            <div class="bg-blue-50 p-4 rounded-lg">
              <label for="funding_category" class="block text-sm font-medium text-gray-700 mb-2">
                Funding Category *
              </label>
              <select
                id="funding_category"
                bind:value={formData.funding_category}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Traditional Scholarship">🏆 Traditional Scholarship</option>
                <option value="Graduate Program Funding">🎓 Graduate Program Funding</option>
                <option value="Advertised Position">🔬 Advertised Position</option>
              </select>
              <p class="text-sm text-gray-600 mt-2">
                {#if formData.funding_category === 'Traditional Scholarship'}
                  Standard scholarships from foundations, organizations, and governments
                {:else if formData.funding_category === 'Graduate Program Funding'}
                  US graduate programs with assistantships and automatic funding
                {:else}
                  Specific research positions with professor contact information
                {/if}
              </p>
            </div>

            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  id="title"
                  type="text"
                  bind:value={formData.title}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label for="provider" class="block text-sm font-medium text-gray-700 mb-1">Provider *</label>
                <input
                  id="provider"
                  type="text"
                  bind:value={formData.provider}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label for="deadline" class="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
                <input
                  id="deadline"
                  type="date"
                  bind:value={formData.deadline}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label for="level" class="block text-sm font-medium text-gray-700 mb-1">Level(s) *</label>
                <div class="space-y-2">
                  {#each levelOptions as option}
                    <label class="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={option.value}
                        checked={formData.levels.includes(option.value)}
                        onchange={(e) => {
                          const target = e.target as HTMLInputElement;
                          if (target.checked) {
                            formData.levels = [...formData.levels, option.value];
                          } else {
                            formData.levels = formData.levels.filter(l => l !== option.value);
                          }
                          // Update single level field for backward compatibility
                          formData.level = formData.levels[0] || '';
                        }}
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span class="text-sm text-gray-700">{option.label}</span>
                    </label>
                  {/each}
                </div>
                {#if formData.levels.length === 0}
                  <p class="text-red-500 text-xs mt-1">Please select at least one level</p>
                {/if}
              </div>
              <div>
                <label for="type" class="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  id="type"
                  bind:value={formData.type}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Type</option>
                  <option value="Merit-based">Merit-based</option>
                  <option value="Research-based">Research-based</option>
                  <option value="Need-based">Need-based</option>
                  <option value="Field-specific">Field-specific</option>
                </select>
              </div>
            </div>

            <!-- Description and Requirements -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                id="description"
                bind:value={formData.description}
                required
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div>
              <label for="requirements" class="block text-sm font-medium text-gray-700 mb-1">Requirements (one per line)</label>
              <textarea
                id="requirements"
                bind:value={formData.requirements}
                rows="4"
                placeholder="Bachelor's degree&#10;English proficiency&#10;Leadership experience"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <!-- Additional Basic Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="website" class="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input
                  id="website"
                  type="url"
                  bind:value={formData.website}
                  placeholder="https://example.com/scholarship"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label for="nationality_restrictions" class="block text-sm font-medium text-gray-700 mb-1">Nationality Restrictions</label>
                <input
                  id="nationality_restrictions"
                  type="text"
                  bind:value={formData.nationality_restrictions}
                  placeholder="e.g., US, Canada, UK (comma-separated)"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <!-- Conditional Fields based on Funding Category -->
            {#if formData.funding_category === 'Graduate Program Funding' || formData.funding_category === 'Advertised Position'}
              <div class="border-t pt-6 mt-6">
                <h4 class="text-lg font-semibold mb-4 text-blue-700">
                  {formData.funding_category === 'Graduate Program Funding' ? '🎓 Graduate Program Details' : '🔬 Research Position Details'}
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label for="university_name" class="block text-sm font-medium text-gray-700 mb-1">University Name *</label>
                    <input
                      id="university_name"
                      type="text"
                      bind:value={formData.university_name}
                      placeholder="e.g., Harvard University"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label for="program_name" class="block text-sm font-medium text-gray-700 mb-1">Program Name *</label>
                    <input
                      id="program_name"
                      type="text"
                      bind:value={formData.program_name}
                      placeholder="e.g., PhD in Computer Science"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label for="department" class="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      id="department"
                      type="text"
                      bind:value={formData.department}
                      placeholder="e.g., Computer Science Department"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label for="funding_type" class="block text-sm font-medium text-gray-700 mb-1">Funding Type *</label>
                    <select
                      id="funding_type"
                      bind:value={formData.funding_type}
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span class="text-sm font-medium text-gray-700">Has Automatic Funding</span>
                    </label>
                    <p class="text-xs text-gray-500 mt-1">Check if program automatically considers all applicants for funding</p>
                  </div>
                </div>
              </div>
            {/if}
            
            {#if formData.funding_category === 'Advertised Position'}
              <div class="border-t pt-6 mt-6">
                <h4 class="text-lg font-semibold mb-4 text-green-700">👨‍🔬 Professor Contact Details</h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label for="professor_name" class="block text-sm font-medium text-gray-700 mb-1">Professor Name</label>
                    <input
                      id="professor_name"
                      type="text"
                      bind:value={formData.professor_name}
                      placeholder="e.g., Dr. John Smith"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label for="professor_email" class="block text-sm font-medium text-gray-700 mb-1">Professor Email</label>
                    <input
                      id="professor_email"
                      type="email"
                      bind:value={formData.professor_email}
                      placeholder="e.g., john.smith@university.edu"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div class="md:col-span-2">
                    <label for="position_details" class="block text-sm font-medium text-gray-700 mb-1">Position Details</label>
                    <textarea
                      id="position_details"
                      bind:value={formData.position_details}
                      rows="3"
                      placeholder="Details about the research project, lab, specific requirements, etc."
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Form Actions -->
            <div class="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                class="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition duration-200"
              >
                {editingScholarship ? 'Update Scholarship' : 'Add Scholarship'}
              </button>
              <button
                type="button"
                onclick={cancelForm}
                class="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      {/if}

      <!-- Scholarships List -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Current Scholarships ({totalScholarships})
          </h3>
        </div>
        
        {#if isLoading}
          <div class="p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-gray-600">Loading scholarships...</p>
          </div>
        {:else if scholarships.length === 0}
          <div class="p-8 text-center">
            <div class="text-gray-400 mb-4">
              <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <p class="text-gray-600">No scholarships found. Add your first one!</p>
          </div>
        {:else}
          <div class="p-6">
            <div class="space-y-4">
              {#each scholarships as scholarship}
                <div class="border rounded-lg p-4 hover:bg-gray-50 transition duration-200">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-2">
                        <h4 class="font-semibold text-lg">{scholarship.title}</h4>
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
                      
                      <p class="text-sm text-gray-500">
                        {scholarship.location} • Deadline: {scholarship.deadline}
                        {#if scholarship.levels && scholarship.levels.length > 1}
                          • Levels: {scholarship.levels.join(', ')}
                        {:else}
                          • Level: {scholarship.level}
                        {/if}
                      </p>
                      
                      {#if scholarship.position_details}
                        <p class="text-sm text-gray-600 mt-2 italic">{scholarship.position_details}</p>
                      {/if}
                    </div>
                    
                    <div class="flex gap-2 ml-4">
                      <button
                        onclick={() => handleEditScholarship(scholarship)}
                        class="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onclick={() => deleteScholarship(scholarship.id)}
                        class="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-200 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
            
            <!-- Pagination -->
            {#if totalPages > 1}
              <div class="flex justify-center mt-6">
                <nav class="flex space-x-2">
                  <button
                    onclick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    class="px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  {#each Array(totalPages) as _, i}
                    <button
                      onclick={() => goToPage(i + 1)}
                      class="px-3 py-2 text-sm border rounded-lg {currentPage === i + 1 ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}"
                    >
                      {i + 1}
                    </button>
                  {/each}
                  
                  <button
                    onclick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    class="px-3 py-2 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Success Modal -->
<SuccessModal 
  bind:isOpen={showSuccessModal}
  title={successModalTitle}
  message={successModalMessage}
  icon={successModalIcon}
  on:close={() => showSuccessModal = false}
  on:action={() => showSuccessModal = false}
/> 