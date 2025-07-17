<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { PlusCircle, Edit, Trash2, BookOpen, Volume2, PenTool, Mic } from 'lucide-svelte';

  const sectionIcons = {
    reading: BookOpen,
    listening: Volume2,
    writing: PenTool,
    speaking: Mic
  };

  let { data } = $props();
  let { session } = $derived(data);
  
  interface TestQuestion {
    id: string;
    question: string;
    type: 'multiple_choice' | 'short_answer' | 'essay' | 'listening' | 'reading' | 'speaking';
    options?: string[];
    correct_answer?: string;
    explanation?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    time_limit?: number;
    order_number: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }

  interface TestSet {
    id: string;
    title: string;
    section: 'IELTS Reading' | 'IELTS Writing' | 'IELTS Speaking' | 'IELTS Listening';
    description: string;
    time_limit: number;
    is_active: boolean;
    questions: TestQuestion[];
    created_at: string;
    updated_at: string;
  }

  let sets: TestSet[] = $state([]);
  let selectedSet: TestSet | null = $state(null);
  let isLoading = $state(true);
  let error = $state('');
  let message = $state('');
  let messageType = $state<'success' | 'error' | 'info'>('info');

  // Filter and search states
  let searchTerm = $state('');
  let selectedSection = $state('all');

  // Computed filtered sets
  let filteredSets = $derived(sets.filter(set => {
    const matchesSection = selectedSection === 'all' || set.section === selectedSection;
    const matchesSearch = !searchTerm || 
      set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      set.section.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSection && matchesSearch;
  }));

  onMount(async () => {
    // Check admin permissions before loading data
    if (!session?.user?.email?.includes('admin') && 
        session?.user?.email !== 'solakolawole62@gmail.com') {
      console.log('❌ Access denied - not admin user');
      return;
    }
    
    console.log('✅ Admin access granted, loading test prep data...');
    await loadTestSets();
  });

  async function loadTestSets() {
    isLoading = true;
    try {
      console.log('🔄 Loading test prep sets...');
      
      const { data, error } = await supabase
        .from('practice_sets')
        .select(`
          id, 
          title, 
          section, 
          sort_order,
          created_at,
          practice_questions(count)
        `)
        .order('section')
        .order('sort_order');

      if (error) {
        console.error('❌ Error loading sets:', error);
      } else {
        sets = data || [];
        console.log('✅ Loaded', sets.length, 'test prep sets');
      }
    } catch (error) {
      console.error('❌ Unexpected error loading sets:', error);
    } finally {
      isLoading = false;
    }
  }

  async function deleteSet(setId: string, setTitle: string) {
    if (!confirm(`Are you sure you want to delete "${setTitle}"? This will also delete all associated questions and choices.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('practice_sets')
        .delete()
        .eq('id', setId);

      if (error) {
        console.error('Error deleting set:', error);
        alert('Failed to delete set. Please try again.');
      } else {
        await loadTestSets(); // Refresh the list
      }
    } catch (error) {
      console.error('Unexpected error deleting set:', error);
      alert('Failed to delete set. Please try again.');
    }
  }

  function getSectionColor(section: string): string {
    const colors = {
      reading: 'bg-blue-100 text-blue-800',
      listening: 'bg-green-100 text-green-800',
      writing: 'bg-purple-100 text-purple-800',
      speaking: 'bg-orange-100 text-orange-800'
    };
    return colors[section as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Test Prep Content Management - Admin</title>
</svelte:head>

<div class="test-prep-admin">
  <!-- Header Section -->
  <div class="header-section">
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          📝 Test Prep Content Management
        </h1>
        <p class="text-gray-600">
          Manage IELTS practice questions across Reading, Listening, Writing, and Speaking sections
        </p>
      </div>
      <a 
        href="/admin/test-prep/edit/new" 
        class="create-btn"
      >
        <PlusCircle size={20} />
        Create New Question Set
      </a>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon reading">
          <BookOpen size={24} />
        </div>
        <div>
          <p class="stat-number">{sets.filter(s => s.section === 'reading').length}</p>
          <p class="stat-label">Reading Sets</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon listening">
          <Volume2 size={24} />
        </div>
        <div>
          <p class="stat-number">{sets.filter(s => s.section === 'listening').length}</p>
          <p class="stat-label">Listening Sets</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon writing">
          <PenTool size={24} />
        </div>
        <div>
          <p class="stat-number">{sets.filter(s => s.section === 'writing').length}</p>
          <p class="stat-label">Writing Sets</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon speaking">
          <Mic size={24} />
        </div>
        <div>
          <p class="stat-number">{sets.filter(s => s.section === 'speaking').length}</p>
          <p class="stat-label">Speaking Sets</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters and Search -->
  <div class="filters-section">
    <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div class="flex gap-3">
        <select 
          bind:value={selectedSection}
          class="filter-select"
        >
          <option value="all">All Sections</option>
          <option value="reading">Reading</option>
          <option value="listening">Listening</option>
          <option value="writing">Writing</option>
          <option value="speaking">Speaking</option>
        </select>
      </div>
      
      <div class="search-container">
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="Search question sets..."
          class="search-input"
        />
      </div>
    </div>
  </div>

  <!-- Content Table -->
  <div class="content-section">
    {#if isLoading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading question sets...</p>
      </div>
    {:else if filteredSets.length === 0}
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>No Question Sets Found</h3>
        <p>
          {searchTerm ? 'No sets match your search criteria.' : 'Get started by creating your first question set.'}
        </p>
        <a href="/admin/test-prep/edit/new" class="create-btn-secondary">
          <PlusCircle size={18} />
          Create Question Set
        </a>
      </div>
    {:else}
      <div class="table-container">
        <table class="content-table">
          <thead>
            <tr>
              <th>Set Information</th>
              <th>Section</th>
              <th>Questions</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredSets as set}
              <tr class="table-row">
                <td>
                  <div class="set-info">
                    <h4 class="set-title">{set.title}</h4>
                    <p class="set-meta">Order: {set.sort_order}</p>
                  </div>
                </td>
                                 <td>
                   <span class="section-badge {getSectionColor(set.section)}">
                     <svelte:component this={sectionIcons[set.section as keyof typeof sectionIcons]} size={16} />
                     {set.section.charAt(0).toUpperCase() + set.section.slice(1)}
                   </span>
                 </td>
                <td>
                  <span class="question-count">
                    {set.practice_questions?.[0]?.count || 0} questions
                  </span>
                </td>
                <td>
                  <span class="date-text">{formatDate(set.created_at)}</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <a 
                      href="/admin/test-prep/edit/{set.id}" 
                      class="action-btn edit"
                      title="Edit question set"
                    >
                      <Edit size={16} />
                    </a>
                    <button 
                      on:click={() => deleteSet(set.id, set.title)}
                      class="action-btn delete"
                      title="Delete question set"
                    >
                      <Trash2 size={16} />
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

  <!-- Help Section -->
  <div class="help-section">
    <h3>💡 Getting Started</h3>
    <div class="help-grid">
      <div class="help-card">
        <h4>📖 Reading Questions</h4>
        <p>Create comprehension questions with passages. Perfect for IELTS Reading practice.</p>
      </div>
      <div class="help-card">
        <h4>🎧 Listening Questions</h4>
        <p>Upload audio files and create multiple-choice questions for listening comprehension.</p>
      </div>
      <div class="help-card">
        <h4>✍️ Writing Prompts</h4>
        <p>Create writing task prompts with sample answers and evaluation criteria.</p>
      </div>
      <div class="help-card">
        <h4>🗣️ Speaking Practice</h4>
        <p>Set up speaking prompts with recording capabilities and feedback systems.</p>
      </div>
    </div>
  </div>
</div>

<style>
  .test-prep-admin {
    max-width: 1400px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .header-section {
    background: white;
    border-radius: 12px;
    padding: 32px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 24px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #f8fafc;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .stat-icon.reading { background: #3b82f6; }
  .stat-icon.listening { background: #10b981; }
  .stat-icon.writing { background: #8b5cf6; }
  .stat-icon.speaking { background: #f59e0b; }

  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .create-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #3b82f6;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
    border: none;
    cursor: pointer;
  }

  .create-btn:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  .create-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #f3f4f6;
    color: #374151;
    padding: 10px 16px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s ease;
    border: 1px solid #d1d5db;
  }

  .create-btn-secondary:hover {
    background: #e5e7eb;
  }

  .filters-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .filter-select {
    padding: 8px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    background: white;
    font-size: 0.875rem;
    color: #374151;
    min-width: 150px;
  }

  .filter-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .search-container {
    position: relative;
  }

  .search-input {
    padding: 8px 12px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.875rem;
    width: 300px;
    max-width: 100%;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .content-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .loading-state {
    text-align: center;
    padding: 60px 20px;
    color: #6b7280;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 16px;
  }

  .empty-state h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .empty-state p {
    color: #6b7280;
    margin: 0 0 24px 0;
  }

  .table-container {
    overflow-x: auto;
  }

  .content-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .content-table th {
    background: #f8fafc;
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
  }

  .table-row {
    border-bottom: 1px solid #e5e7eb;
    transition: background-color 0.2s ease;
  }

  .table-row:hover {
    background: #f8fafc;
  }

  .content-table td {
    padding: 16px;
    vertical-align: middle;
  }

  .set-info {
    min-width: 200px;
  }

  .set-title {
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 4px 0;
    font-size: 0.875rem;
  }

  .set-meta {
    color: #6b7280;
    margin: 0;
    font-size: 0.75rem;
  }

  .section-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .question-count {
    color: #374151;
    font-weight: 500;
  }

  .date-text {
    color: #6b7280;
    font-size: 0.8rem;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
  }

  .action-btn.edit {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .action-btn.edit:hover {
    background: #bfdbfe;
  }

  .action-btn.delete {
    background: #fef2f2;
    color: #dc2626;
  }

  .action-btn.delete:hover {
    background: #fecaca;
  }

  .help-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .help-section h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 20px 0;
  }

  .help-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }

  .help-card {
    background: #f8fafc;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .help-card h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .help-card p {
    color: #6b7280;
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
  }
</style> 