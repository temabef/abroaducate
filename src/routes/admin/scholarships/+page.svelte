<script lang="ts">
  import { onMount } from 'svelte';
  
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
    // New Graduate Funding Fields
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

  interface ImportResult {
    row: number;
    success: boolean;
    error?: string;
    title: string;
  }

  interface CsvRow {
    [key: string]: string;
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
    // New Graduate Funding Fields
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

  // CSV Import state with proper typing
  let importType: 'traditional' | 'graduate' | 'advertised' = $state('traditional');
  let csvData: CsvRow[] = $state([]);
  let csvHeaders: string[] = $state([]);
  let isImporting = $state(false);
  let importResults: ImportResult[] = $state([]);

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

  function handleSaveScholarship(event: SubmitEvent) {
    event.preventDefault();
    saveScholarship();
  }

  async function saveScholarship() {
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

  function editScholarship(scholarship: Scholarship) {
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
      requirements: scholarship.requirements.join('\n'),
      website: scholarship.website || '',
      min_gpa: scholarship.min_gpa?.toString() || '',
      min_ielts: scholarship.min_ielts?.toString() || '',
      min_toefl: scholarship.min_toefl?.toString() || '',
      age_limit: scholarship.age_limit?.toString() || '',
      nationality_restrictions: scholarship.nationality_restrictions?.join(', ') || '',
      is_active: scholarship.is_active,
      // Graduate funding fields
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
      // Graduate funding fields
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

  async function processBulkImport() {
    if (!bulkCsvData.trim()) {
      alert('Please paste CSV data');
      return;
    }

    const lines = bulkCsvData.trim().split('\n');
    const imported = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      try {
        // Simple CSV parsing (assumes comma-separated values)
        const fields = line.split(',').map(field => field.trim().replace(/^"(.*)"$/, '$1'));
        
        let scholarship: Partial<Scholarship>;
        
        // Auto-detect funding type based on field count and content
        if (fields.length >= 8 && fields.some(f => f.includes('@'))) {
          // Advertised Position: university,professor_name,professor_email,funding_type,amount,deadline,website,field,position_details
          scholarship = {
            funding_category: 'Advertised Position',
            title: `${fields[3]} with ${fields[1]}`,
            provider: fields[0],
            amount: fields[4],
            deadline: fields[5],
            location: 'United States',
            field: fields[7],
            level: fields[3] === 'Postdoc' ? 'Postgraduate' : 'PhD',
            type: 'Research-based',
            description: fields[8] || `${fields[3]} position in ${fields[7]}`,
            requirements: [],
            website: fields[6] || undefined,
            university_name: fields[0],
            professor_name: fields[1],
            professor_email: fields[2],
            funding_type: fields[3],
            position_details: fields[8],
            application_method: 'Contact Professor First',
            is_active: true
          };
        } else if (fields.length >= 7 && (fields[2]?.includes('RA') || fields[2]?.includes('TA') || fields[2]?.includes('Full Funding'))) {
          // Graduate Program: university,program_name,funding_type,application_method,amount,deadline,website,description
          scholarship = {
            funding_category: 'Graduate Program Funding',
            title: fields[1],
            provider: fields[0],
            amount: fields[4],
            deadline: fields[5],
            location: 'United States',
            field: 'Graduate Studies',
            level: 'Graduate',
            type: 'Research-based',
            description: fields[7] || `${fields[1]} at ${fields[0]}`,
            requirements: [],
            website: fields[6] || undefined,
            university_name: fields[0],
            program_name: fields[1],
            funding_type: fields[2],
            application_method: fields[3],
            has_automatic_funding: false,
            is_active: true
          };
        } else {
          // Traditional Scholarship: title,provider,amount,deadline,location,field,level,type,description
          scholarship = {
            funding_category: 'Traditional Scholarship',
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
            is_active: true
          };
        }

        const { error } = await supabase
          .from('scholarships')
          .insert(scholarship);

        if (error) {
          errors.push(`Line ${i + 1}: ${error.message}`);
        } else {
          imported.push(scholarship.title || 'Unknown');
        }
      } catch (err) {
        errors.push(`Line ${i + 1}: Invalid format`);
      }
    }

    await loadScholarships();
    showBulkImport = false;
    bulkCsvData = '';

    if (errors.length > 0) {
      alert(`Import completed with errors:\n${errors.join('\n')}\n\nSuccessfully imported: ${imported.length} scholarships`);
    } else {
      alert(`Successfully imported ${imported.length} scholarships!`);
    }
  }

  // New CSV Import Functions
  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      parseCSV(csv);
    };
    reader.readAsText(file);
  }

  function parseCSV(csv: string) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      alert('CSV must have at least a header row and one data row');
      return;
    }

    // Parse headers
    csvHeaders = lines[0].split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
    
    // Parse data with proper typing
    csvData = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
      const row: CsvRow = {};
      csvHeaders.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });
  }

  async function processImport() {
    if (csvData.length === 0) return;

    isImporting = true;
    importResults = [];

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      try {
        let scholarshipData: Partial<Scholarship> | undefined;

        // Map data based on import type
        if (importType === 'traditional') {
          scholarshipData = {
            funding_category: 'Traditional Scholarship',
            title: row.title || '',
            provider: row.provider || '',
            amount: row.amount || '',
            deadline: row.deadline || '',
            location: row.location || '',
            field: row.field || '',
            level: row.level || '',
            type: row.type || '',
            description: row.description || '',
            requirements: row.requirements ? row.requirements.split(';').filter(r => r.trim()) : [],
            website: row.website || undefined,
            min_gpa: row.min_gpa ? parseFloat(row.min_gpa) : undefined,
            min_ielts: row.min_ielts ? parseFloat(row.min_ielts) : undefined,
            min_toefl: row.min_toefl ? parseInt(row.min_toefl) : undefined,
            age_limit: row.age_limit ? parseInt(row.age_limit) : undefined,
            nationality_restrictions: row.nationality_restrictions ? 
              row.nationality_restrictions.split(',').map(c => c.trim()).filter(c => c) : [],
            is_active: true
          };
        } else if (importType === 'graduate') {
          // Validate required fields for graduate import
          if (!row.university_name || !row.program_name || !row.funding_type || !row.amount || !row.deadline) {
            throw new Error('Missing required fields: university_name, program_name, funding_type, amount, deadline');
          }
          
          scholarshipData = {
            funding_category: 'Graduate Program Funding',
            title: row.program_name,
            provider: row.university_name,
            amount: row.amount,
            deadline: row.deadline,
            location: 'United States',
            field: row.field || 'Graduate Studies',
            level: 'Graduate',
            type: 'Research-based',
            description: row.description || `${row.program_name} at ${row.university_name}`,
            requirements: row.requirements ? row.requirements.split(';').filter(r => r.trim()) : [],
            // Graduate funding specific fields
            university_name: row.university_name,
            program_name: row.program_name,
            department: row.department || undefined,
            funding_type: row.funding_type,
            application_method: row.application_method || undefined,
            has_automatic_funding: row.has_automatic_funding === 'true' || row.has_automatic_funding === '1',
            is_active: true
          };
        } else if (importType === 'advertised') {
          // Validate required fields for advertised position import
          if (!row.university_name || !row.professor_name || !row.professor_email || !row.funding_type || !row.amount || !row.deadline || !row.field) {
            throw new Error('Missing required fields: university_name, professor_name, professor_email, funding_type, amount, deadline, field');
          }
          
          scholarshipData = {
            funding_category: 'Advertised Position',
            title: `${row.funding_type} with ${row.professor_name}`,
            provider: row.university_name,
            amount: row.amount,
            deadline: row.deadline,
            location: 'United States',
            field: row.field,
            level: row.funding_type === 'Postdoc' ? 'Postgraduate' : 'PhD',
            type: 'Research-based',
            description: row.position_details || `${row.funding_type} position in ${row.field}`,
            requirements: row.requirements ? row.requirements.split(';').filter(r => r.trim()) : [],
            // Advertised position specific fields
            university_name: row.university_name,
            professor_name: row.professor_name,
            professor_email: row.professor_email,
            department: row.department || undefined,
            funding_type: row.funding_type,
            position_details: row.position_details || undefined,
            is_active: true
          };
        }

        if (!scholarshipData) {
          throw new Error('Invalid import type');
        }

        // Validate that all required database fields are present
        const requiredFields = ['title', 'provider', 'amount', 'deadline', 'location', 'field', 'level', 'type', 'description'];
        const missingFields = requiredFields.filter(field => !scholarshipData[field as keyof Scholarship]);
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required database fields: ${missingFields.join(', ')}`);
        }

        const { error } = await supabase
          .from('scholarships')
          .insert(scholarshipData);

        if (error) {
          console.error('Supabase error:', error);
          importResults.push({
            row: i + 1,
            success: false,
            error: error.message,
            title: scholarshipData.title || 'Unknown'
          });
        } else {
          importResults.push({
            row: i + 1,
            success: true,
            title: scholarshipData.title || 'Unknown'
          });
        }
      } catch (err: unknown) {
        console.error('Import error for row', i + 1, ':', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        importResults.push({
          row: i + 1,
          success: false,
          error: `Error: ${errorMessage}`,
          title: 'Unknown'
        });
      }

      // Update progress
      importResults = [...importResults];
    }

    isImporting = false;
    await loadScholarships();
    
    const successCount = importResults.filter(r => r.success).length;
    alert(`Import completed! ${successCount}/${csvData.length} records imported successfully.`);
  }

  function clearImport() {
    csvData = [];
    csvHeaders = [];
    importResults = [];
    
    // Clear file input
    const fileInput = document.getElementById('csv-file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // Check if user is admin - enhanced for role-based access
  let isAdmin = $derived(
    session?.user?.email === 'solakolawole62@gmail.com' || 
    session?.user?.email === 'admin@abroaducate.com' || 
    session?.user?.email?.includes('admin') ||
    session?.user?.user_metadata?.role === 'admin' ||
    session?.user?.user_metadata?.role === 'admin'
  );

  // Auto-populate logic for overlapping fields
  $effect(() => {
    if (formData.funding_category === 'Graduate Program Funding') {
      // Auto-populate provider with university name
      if (formData.university_name && !formData.provider) {
        formData.provider = formData.university_name;
      }
      // Auto-populate title with program name
      if (formData.program_name && !formData.title) {
        formData.title = formData.program_name;
      }
      // Set default location to USA for graduate programs
      if (!formData.location) {
        formData.location = 'United States';
      }
      // Set default level to Graduate
      if (!formData.level) {
        formData.level = 'Graduate';
      }
    } else if (formData.funding_category === 'Advertised Position') {
      // Auto-populate provider with university name
      if (formData.university_name && !formData.provider) {
        formData.provider = formData.university_name;
      }
      // Auto-populate title with position info
      if (formData.professor_name && formData.funding_type && !formData.title) {
        formData.title = `${formData.funding_type} with ${formData.professor_name}`;
      }
      // Set default location to USA for advertised positions
      if (!formData.location) {
        formData.location = 'United States';
      }
      // Set default level
      if (!formData.level) {
        formData.level = formData.funding_type === 'Postdoc' ? 'Postgraduate' : 'PhD';
      }
    }
  });

  // Reset specific fields when funding category changes
  let previousCategory = formData.funding_category;
  $effect(() => {
    if (formData.funding_category !== previousCategory) {
      // Reset category-specific fields
      formData.university_name = '';
      formData.program_name = '';
      formData.department = '';
      formData.funding_type = '';
      formData.application_method = '';
      formData.professor_name = '';
      formData.professor_email = '';
      formData.position_details = '';
      formData.has_automatic_funding = false;
      
      previousCategory = formData.funding_category;
    }
  });
</script>

<svelte:head>
  <title>Scholarship Admin - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Scholarship Administration</h1>
      <p class="text-gray-600">Manage scholarship listings and import data</p>
      
      {#if !isAdmin}
        <div class="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
          <p class="text-red-800">⚠️ Admin access required. Please contact administrator.</p>
        </div>
      {/if}
    </div>

    {#if isAdmin}
      <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-sm text-blue-800">
          Debug: showAddForm = {showAddForm}, isAdmin = {isAdmin}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="mb-8 flex flex-wrap gap-4">
        <button
          type="button"
          onclick={() => { 
            console.log('Add button clicked!');
            showAddForm = true; 
            editingScholarship = null;
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
              // Graduate funding fields
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
          }}
          class="bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-yellow-700 transition duration-200 cursor-pointer"
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

      <!-- Bulk Import Panel -->
      {#if showBulkImport}
        <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 class="text-lg font-semibold mb-4">Bulk Import from CSV</h3>
          <div class="mb-4">
            <p class="text-sm text-gray-600 mb-2">
              Expected CSV format: title, provider, amount, deadline, location, field, level, type, description, website, requirements (separated by semicolons)
            </p>
            <p class="text-xs text-gray-500 mb-4">
              <strong>Test with this simple example:</strong><br/>
              title,provider,amount,deadline,location,field,level,type,description<br/>
              Fulbright Program,US Dept of State,$50000,2024-05-15,United States,All Fields,Graduate,Merit-based,Graduate funding program
            </p>
          </div>
          <textarea
            bind:value={bulkCsvData}
            placeholder="Paste your CSV data here..."
            rows="10"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 font-mono text-sm"
          ></textarea>
          <div class="mt-4 flex gap-4">
            <button
              onclick={processBulkImport}
              class="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition duration-200"
            >
              Import Scholarships
            </button>
            <button
              onclick={() => { showBulkImport = false; bulkCsvData = ''; }}
              class="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      {/if}

      <!-- Add/Edit Form -->
      {#if showAddForm}
        <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 class="text-lg font-semibold mb-4">
            {editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}
          </h3>
          
          <form onsubmit={handleSaveScholarship} class="space-y-4">
            <!-- Funding Category Selection -->
            <div class="bg-blue-50 p-4 rounded-lg">
              <label for="funding_category" class="block text-sm font-medium text-gray-700 mb-2">Funding Category *</label>
              <select
                id="funding_category"
                bind:value={formData.funding_category}
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="Traditional Scholarship">🏆 Traditional Scholarship</option>
                <option value="Graduate Program Funding">🎓 Graduate Program Funding</option>
                <option value="Advertised Position">🔬 Advertised Research Position</option>
              </select>
              <p class="text-xs text-gray-600 mt-1">
                {#if formData.funding_category === 'Traditional Scholarship'}
                  External scholarships from organizations, governments, foundations
                {:else if formData.funding_category === 'Graduate Program Funding'}
                  University programs with automatic RA/TA/GA funding consideration
                {:else}
                  Specific research positions advertised by professors
                {/if}
              </p>
            </div>

            <!-- Traditional Scholarship Form -->
            {#if formData.funding_category === 'Traditional Scholarship'}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="title" class="block text-sm font-medium text-gray-700 mb-1">Scholarship Title *</label>
                  <input
                    id="title"
                    type="text"
                    bind:value={formData.title}
                    required
                    placeholder="e.g., Fulbright Program"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="provider" class="block text-sm font-medium text-gray-700 mb-1">Organization/Provider *</label>
                  <input
                    id="provider"
                    type="text"
                    bind:value={formData.provider}
                    required
                    placeholder="e.g., US Department of State"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">Award Amount *</label>
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
                  <label for="deadline" class="block text-sm font-medium text-gray-700 mb-1">Application Deadline *</label>
                  <input
                    id="deadline"
                    type="date"
                    bind:value={formData.deadline}
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Study Location *</label>
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
                  <label for="field" class="block text-sm font-medium text-gray-700 mb-1">Field of Study *</label>
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
                  <label for="level" class="block text-sm font-medium text-gray-700 mb-1">Academic Level *</label>
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
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
                <div>
                  <label for="type" class="block text-sm font-medium text-gray-700 mb-1">Scholarship Type *</label>
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
                    <option value="Development-focused">Development-focused</option>
                  </select>
                </div>
              </div>
            {/if}

            <!-- Graduate Program Funding Form -->
            {#if formData.funding_category === 'Graduate Program Funding'}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="university_name" class="block text-sm font-medium text-gray-700 mb-1">University *</label>
                  <input
                    id="university_name"
                    type="text"
                    bind:value={formData.university_name}
                    required
                    placeholder="e.g., MIT"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="program_name" class="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                  <input
                    id="program_name"
                    type="text"
                    bind:value={formData.program_name}
                    required
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
                    placeholder="e.g., EECS Department"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="funding_type" class="block text-sm font-medium text-gray-700 mb-1">Funding Type *</label>
                  <select
                    id="funding_type"
                    bind:value={formData.funding_type}
                    required
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
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">Select Method</option>
                    <option value="Direct Apply">Direct Apply (Automatic Consideration)</option>
                    <option value="Contact Professor First">Contact Professor First</option>
                  </select>
                </div>
                <div>
                  <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">Stipend/Funding Amount *</label>
                  <input
                    id="amount"
                    type="text"
                    bind:value={formData.amount}
                    required
                    placeholder="e.g., $35,000/year + tuition"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="deadline" class="block text-sm font-medium text-gray-700 mb-1">Application Deadline *</label>
                  <input
                    id="deadline"
                    type="date"
                    bind:value={formData.deadline}
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div class="md:col-span-2">
                  <label for="has_automatic_funding" class="flex items-center space-x-2">
                    <input
                      id="has_automatic_funding"
                      type="checkbox"
                      bind:checked={formData.has_automatic_funding}
                      class="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    />
                    <span class="text-sm font-medium text-gray-700">Program automatically considers all applicants for funding</span>
                  </label>
                </div>
              </div>
            {/if}

            <!-- Advertised Position Form -->
            {#if formData.funding_category === 'Advertised Position'}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="university_name" class="block text-sm font-medium text-gray-700 mb-1">University *</label>
                  <input
                    id="university_name"
                    type="text"
                    bind:value={formData.university_name}
                    required
                    placeholder="e.g., Stanford University"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="professor_name" class="block text-sm font-medium text-gray-700 mb-1">Professor Name *</label>
                  <input
                    id="professor_name"
                    type="text"
                    bind:value={formData.professor_name}
                    required
                    placeholder="e.g., Dr. John Smith"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="professor_email" class="block text-sm font-medium text-gray-700 mb-1">Professor Email *</label>
                  <input
                    id="professor_email"
                    type="email"
                    bind:value={formData.professor_email}
                    required
                    placeholder="e.g., john.smith@stanford.edu"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="department" class="block text-sm font-medium text-gray-700 mb-1">Department/Lab</label>
                  <input
                    id="department"
                    type="text"
                    bind:value={formData.department}
                    placeholder="e.g., AI Lab, CS Department"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="funding_type" class="block text-sm font-medium text-gray-700 mb-1">Position Type *</label>
                  <select
                    id="funding_type"
                    bind:value={formData.funding_type}
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">Select Position Type</option>
                    <option value="RA">Research Assistantship (RA)</option>
                    <option value="Full Funding">PhD with Full Funding</option>
                    <option value="Postdoc">Postdoc Position</option>
                  </select>
                </div>
                <div>
                  <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">Funding Amount *</label>
                  <input
                    id="amount"
                    type="text"
                    bind:value={formData.amount}
                    required
                    placeholder="e.g., $40,000/year + benefits"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="deadline" class="block text-sm font-medium text-gray-700 mb-1">Application Deadline *</label>
                  <input
                    id="deadline"
                    type="date"
                    bind:value={formData.deadline}
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="field" class="block text-sm font-medium text-gray-700 mb-1">Research Area *</label>
                  <input
                    id="field"
                    type="text"
                    bind:value={formData.field}
                    required
                    placeholder="e.g., Machine Learning, Robotics"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="application_method" class="block text-sm font-medium text-gray-700 mb-1">How to Apply *</label>
                  <select
                    id="application_method"
                    bind:value={formData.application_method}
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">Select Method</option>
                    <option value="Contact Professor First">Email Professor Directly</option>
                    <option value="Apply Online">Apply Through University Portal</option>
                  </select>
                </div>
                <div class="md:col-span-2">
                  <label for="position_details" class="block text-sm font-medium text-gray-700 mb-1">Position Details *</label>
                  <textarea
                    id="position_details"
                    bind:value={formData.position_details}
                    required
                    rows="4"
                    placeholder="Describe the research project, lab, requirements, and what the position offers..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  ></textarea>
                </div>
              </div>
            {/if}

            <!-- Common Fields -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                {formData.funding_category === 'Advertised Position' ? 'Additional Information' : 'Description'} *
              </label>
              <textarea
                id="description"
                bind:value={formData.description}
                required
                rows="3"
                placeholder={formData.funding_category === 'Advertised Position' 
                  ? 'Any additional details about the position or application process...'
                  : 'Describe the scholarship/funding opportunity...'}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              ></textarea>
            </div>

            <div>
              <label for="requirements" class="block text-sm font-medium text-gray-700 mb-1">Requirements (one per line)</label>
              <textarea
                id="requirements"
                bind:value={formData.requirements}
                rows="4"
                placeholder={formData.funding_category === 'Advertised Position'
                  ? 'PhD in Computer Science&#10;Experience with Python&#10;Strong publication record'
                  : 'Bachelor\'s degree&#10;English proficiency&#10;Leadership experience'}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              ></textarea>
            </div>

            <!-- Optional Fields -->
            {#if formData.funding_category !== 'Advertised Position'}
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label for="website" class="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    id="website"
                    type="url"
                    bind:value={formData.website}
                    placeholder="https://..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="min_gpa" class="block text-sm font-medium text-gray-700 mb-1">Min GPA</label>
                  <input
                    id="min_gpa"
                    type="number"
                    step="0.01"
                    max="4.0"
                    bind:value={formData.min_gpa}
                    placeholder="3.0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="min_ielts" class="block text-sm font-medium text-gray-700 mb-1">Min IELTS</label>
                  <input
                    id="min_ielts"
                    type="number"
                    step="0.5"
                    max="9.0"
                    bind:value={formData.min_ielts}
                    placeholder="6.5"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="min_toefl" class="block text-sm font-medium text-gray-700 mb-1">Min TOEFL</label>
                  <input
                    id="min_toefl"
                    type="number"
                    max="120"
                    bind:value={formData.min_toefl}
                    placeholder="80"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="age_limit" class="block text-sm font-medium text-gray-700 mb-1">Age Limit</label>
                  <input
                    id="age_limit"
                    type="number"
                    bind:value={formData.age_limit}
                    placeholder="30"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label for="nationality_restrictions" class="block text-sm font-medium text-gray-700 mb-1">Nationality Restrictions (comma-separated)</label>
                  <input
                    id="nationality_restrictions"
                    type="text"
                    bind:value={formData.nationality_restrictions}
                    placeholder="India, Pakistan, Bangladesh"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
              </div>
            {/if}

            <div class="flex items-center">
              <input
                type="checkbox"
                bind:checked={formData.is_active}
                id="is_active"
                class="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
              />
              <label for="is_active" class="ml-2 block text-sm text-gray-700">
                Active (visible to users)
              </label>
            </div>

            <div class="flex gap-4 pt-4">
              <button
                type="submit"
                class="bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-yellow-700 transition duration-200"
              >
                {editingScholarship ? 'Update Scholarship' : 'Add Scholarship'}
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
          <h3 class="text-lg font-semibold">Scholarship Listings ({scholarships.length})</h3>
        </div>
        
        {#if isLoading}
          <div class="p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
            <p class="mt-2 text-gray-600">Loading scholarships...</p>
          </div>
        {:else if scholarships.length === 0}
          <div class="p-8 text-center">
            <p class="text-gray-600">No scholarships found. Add your first scholarship!</p>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scholarship</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each scholarships as scholarship}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                      <div>
                        <div class="text-sm font-medium text-gray-900">{scholarship.title}</div>
                        <div class="text-sm text-gray-500">{scholarship.provider}</div>
                        <div class="text-sm text-yellow-600 font-medium">{scholarship.amount}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm text-gray-900">{scholarship.location}</div>
                      <div class="text-sm text-gray-500">{scholarship.level} • {scholarship.field}</div>
                      <div class="text-sm text-gray-500">{scholarship.type}</div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">
                      {new Date(scholarship.deadline).toLocaleDateString()}
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {scholarship.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        {scholarship.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm font-medium">
                      <div class="flex space-x-2">
                        <button
                          onclick={() => editScholarship(scholarship)}
                          class="text-yellow-600 hover:text-yellow-700"
                        >
                          Edit
                        </button>
                        <button
                          onclick={() => deleteScholarship(scholarship.id!)}
                          class="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}

    <!-- CSV Bulk Import Section -->
    <div class="bg-white rounded-lg shadow-sm border mb-8">
      <div class="px-6 py-4 border-b">
        <h3 class="text-lg font-semibold text-gray-900">📊 CSV Bulk Import</h3>
        <p class="text-sm text-gray-600 mt-1">Import multiple scholarships/funding opportunities from CSV files</p>
      </div>
      <div class="p-6">
        <!-- Import Type Selection -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">Import Type</label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="border rounded-lg p-4 cursor-pointer transition-colors {importType === 'traditional' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'}"
                 onclick={() => importType = 'traditional'}>
              <div class="flex items-center">
                <input type="radio" bind:group={importType} value="traditional" class="mr-3 text-yellow-600">
                <div>
                  <div class="font-medium">🏆 Traditional Scholarships</div>
                  <div class="text-sm text-gray-600">External scholarships from organizations</div>
                </div>
              </div>
            </div>
            <div class="border rounded-lg p-4 cursor-pointer transition-colors {importType === 'graduate' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}"
                 onclick={() => importType = 'graduate'}>
              <div class="flex items-center">
                <input type="radio" bind:group={importType} value="graduate" class="mr-3 text-blue-600">
                <div>
                  <div class="font-medium">🎓 Graduate Program Funding</div>
                  <div class="text-sm text-gray-600">University RA/TA/GA positions</div>
                </div>
              </div>
            </div>
            <div class="border rounded-lg p-4 cursor-pointer transition-colors {importType === 'advertised' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}"
                 onclick={() => importType = 'advertised'}>
              <div class="flex items-center">
                <input type="radio" bind:group={importType} value="advertised" class="mr-3 text-purple-600">
                <div>
                  <div class="font-medium">🔬 Advertised Positions</div>
                  <div class="text-sm text-gray-600">Professor research positions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CSV Format Guide -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 class="font-medium text-gray-900 mb-2">📋 CSV Format Guide</h4>
          <div class="text-sm text-gray-600">
            {#if importType === 'traditional'}
              <p class="mb-2"><strong>Required columns (in order):</strong> title, provider, amount, deadline, location, field, level, type, description</p>
              <p class="mb-2"><strong>Optional columns:</strong> requirements, website, min_gpa, min_ielts, min_toefl, age_limit, nationality_restrictions</p>
              <p><strong>Example:</strong> "Fulbright Program","US State Dept","$50,000/year","2024-05-15","United States","All Fields","Graduate","Merit-based","Funding for graduate study..."</p>
            {:else if importType === 'graduate'}
              <p class="mb-2"><strong>Required columns (in order):</strong> university_name, program_name, funding_type, application_method, amount, deadline, description</p>
              <p class="mb-2"><strong>Optional columns:</strong> department, has_automatic_funding, requirements, field</p>
              <p class="mb-2"><strong>Column Headers Required:</strong> Use exact column names above</p>
                <p><strong>Example:</strong> <br/>Headers: university_name,program_name,funding_type,application_method,amount,deadline,description<br/>Data: "MIT","PhD Computer Science","Full Funding","Direct Apply","$40,000/year","2024-12-15","Automatic funding consideration..."</p>
            {:else if importType === 'advertised'}
              <p class="mb-2"><strong>Required columns (in order):</strong> university_name, professor_name, professor_email, funding_type, amount, deadline, field, position_details</p>
              <p class="mb-2"><strong>Optional columns:</strong> department, requirements</p>
              <p class="mb-2"><strong>Column Headers Required:</strong> Use exact column names above</p>
              <p><strong>Example:</strong> <br/>Headers: university_name,professor_name,professor_email,funding_type,amount,deadline,field,position_details<br/>Data: "Stanford","Dr. Jane Smith","jane@stanford.edu","RA","$45,000/year","2024-08-01","Machine Learning","Research in deep learning..."</p>
            {/if}
          </div>
        </div>

        <!-- File Upload -->
        <div class="mb-6">
          <label for="csv-file" class="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</label>
          <input
            id="csv-file"
            type="file"
            accept=".csv"
            onchange={handleFileUpload}
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
          />
        </div>

        <!-- Preview and Import -->
        {#if csvData.length > 0}
          <div class="mb-6">
            <h4 class="font-medium text-gray-900 mb-3">📊 Preview ({csvData.length} rows)</h4>
            <div class="overflow-x-auto border rounded-lg">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    {#each csvHeaders as header}
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    {/each}
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each csvData.slice(0, 5) as row}
                    <tr>
                      {#each csvHeaders as header}
                        <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                          {row[header] || ''}
                        </td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
              {#if csvData.length > 5}
                <div class="px-3 py-2 bg-gray-50 text-sm text-gray-600">
                  ... and {csvData.length - 5} more rows
                </div>
              {/if}
            </div>
          </div>

          <!-- Import Actions -->
          <div class="flex gap-4">
            <button
              onclick={processImport}
              disabled={isImporting}
              class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {isImporting ? 'Importing...' : `Import ${csvData.length} Records`}
            </button>
            <button
              onclick={clearImport}
              class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
            >
              Clear
            </button>
          </div>

          <!-- Import Results -->
          {#if importResults.length > 0}
            <div class="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-3">Import Results</h4>
              <div class="space-y-1 text-sm">
                {#each importResults as result}
                  <div class="flex items-center gap-2">
                    {#if result.success}
                      <span class="text-green-600">✅</span>
                      <span>Row {result.row}: {result.title} - Success</span>
                    {:else}
                      <span class="text-red-600">❌</span>
                      <span>Row {result.row}: {result.error}</span>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div> 