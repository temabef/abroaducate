<script lang="ts">
  import { onMount } from 'svelte';
  import BasicReminders from '$lib/components/BasicReminders.svelte';
  
  let { data } = $props();
  let { supabase, session } = $derived(data);

  let testResults = $state({
    viewExists: false,
    dataLoaded: false,
    scholarshipCount: 0,
    applicationCount: 0,
    error: null as string | null
  });

  onMount(async () => {
    await runTests();
  });

  async function runTests() {
    if (!session?.user?.id) {
      testResults.error = 'Not logged in';
      return;
    }

    try {
      // Test 1: Check if user_scholarship_deadlines view exists
      const { data: viewData, error: viewError } = await supabase
        .from('user_scholarship_deadlines')
        .select('count')
        .eq('user_id', session.user.id)
        .limit(1);

      testResults.viewExists = !viewError;

      // Test 2: Load scholarship data
      const { data: scholarships, error: scholarshipError } = await supabase
        .from('user_scholarship_interactions')
        .select('scholarship_id, is_saved, is_applied')
        .eq('user_id', session.user.id);

      testResults.scholarshipCount = scholarships?.length || 0;

      // Test 3: Load application data
      const { data: applications, error: applicationError } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', session.user.id);

      testResults.applicationCount = applications?.length || 0;
      testResults.dataLoaded = true;

    } catch (error) {
      testResults.error = (error as Error).message;
      console.error('Test error:', error);
    }
  }

  async function createTestScholarship() {
    if (!session?.user?.id) return;

    try {
      // Create a test scholarship interaction with upcoming deadline
      const { error } = await supabase
        .from('user_scholarship_interactions')
        .insert({
          user_id: session.user.id,
          scholarship_id: '00000000-0000-0000-0000-000000000001', // Use existing scholarship ID
          is_saved: true,
          status: 'interested',
          priority: 'high'
        });

      if (error) {
        alert('Error creating test data: ' + error.message);
      } else {
        alert('Test scholarship interaction created! Refresh to see in sidebar.');
        await runTests();
      }
    } catch (error) {
      console.error('Error creating test scholarship:', error);
    }
  }
</script>

<svelte:head>
  <title>Test Scholarship Deadlines Integration</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">🧪 Scholarship Deadline Integration Test</h1>

    <!-- Test Results -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
      
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="text-lg">{testResults.viewExists ? '✅' : '❌'}</span>
          <span>Database View Exists: <code>user_scholarship_deadlines</code></span>
        </div>
        
        <div class="flex items-center gap-3">
          <span class="text-lg">{testResults.dataLoaded ? '✅' : '❌'}</span>
          <span>Data Loading: Successfully loaded user data</span>
        </div>
        
        <div class="flex items-center gap-3">
          <span class="text-lg">📊</span>
          <span>Scholarship Interactions: {testResults.scholarshipCount}</span>
        </div>
        
        <div class="flex items-center gap-3">
          <span class="text-lg">📝</span>
          <span>Application Entries: {testResults.applicationCount}</span>
        </div>

        {#if testResults.error}
          <div class="flex items-center gap-3 text-red-600">
            <span class="text-lg">❌</span>
            <span>Error: {testResults.error}</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Live Component Test -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Test Actions -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Test Actions</h3>
          
          <div class="space-y-3">
            <button 
              onclick={runTests}
              class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh Tests
            </button>
            
            <button 
              onclick={createTestScholarship}
              class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              ➕ Create Test Data
            </button>
            
            <a 
              href="/scholarships" 
              class="block w-full text-center bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              🎓 Browse Scholarships
            </a>
            
            <a 
              href="/scholarships/my-applications" 
              class="block w-full text-center bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              📋 My Applications
            </a>
          </div>
        </div>
      </div>

      <!-- Right: Live BasicReminders Component -->
      <div class="lg:col-span-2">
        <div class="bg-gray-50 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Live BasicReminders Component</h3>
          <p class="text-sm text-gray-600 mb-4">This is the actual component used in the dashboard sidebar:</p>
          
          <div class="max-w-sm">
            <BasicReminders />
          </div>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
      <h3 class="text-lg font-semibold text-blue-900 mb-3">Testing Instructions</h3>
      <ol class="list-decimal list-inside space-y-2 text-blue-800">
        <li>Ensure you're logged in to see personalized data</li>
        <li>Check that the database view exists (✅ should appear above)</li>
        <li>Create test data using the "Create Test Data" button</li>
        <li>Visit the scholarships page and save some scholarships</li>
        <li>Return here to see them appear in the BasicReminders component</li>
        <li>Go to the main dashboard to see the integrated sidebar</li>
      </ol>
    </div>

    <!-- Technical Details -->
    <div class="bg-gray-50 rounded-lg p-6 mt-8">
      <h3 class="text-lg font-semibold text-gray-900 mb-3">Implementation Details</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <h4 class="font-medium text-gray-900 mb-2">Database Integration</h4>
          <ul class="space-y-1 text-gray-600">
            <li>• Uses <code>user_scholarship_deadlines</code> view</li>
            <li>• Fallback to manual calculation</li>
            <li>• RLS security enforced</li>
            <li>• Real-time urgency calculation</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-gray-900 mb-2">UI Features</h4>
          <ul class="space-y-1 text-gray-600">
            <li>• Visual badge differentiation</li>
            <li>• Urgency-based color coding</li>
            <li>• Provider and amount display</li>
            <li>• Responsive grid layout</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div> 