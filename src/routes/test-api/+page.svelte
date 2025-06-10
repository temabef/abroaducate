<script lang="ts">
  import { onMount } from 'svelte';
  
  let loading = false;
  let result = '';
  let error = '';
  
  async function testAPI() {
    loading = true;
    error = '';
    result = '';
    
    try {
      const response = await fetch('/api/universities/fetch?source=us&type=all&limit=5');
      const data = await response.json();
      result = JSON.stringify(data, null, 2);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }
  
  async function testMainMatching() {
    loading = true;
    error = '';
    result = '';
    
    try {
      const testProfile = {
        gpa: "3.5",
        field: "computer-science",
        degree_level: "masters",
        qualities: ["research-excellence"],
        value_approach: "balanced_approach",
        research_interest: "artificial intelligence",
        preferred_countries: ["United States"],
        scholarship_priority: "moderate"
      };
      
      const response = await fetch('/api/university-matching-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testProfile)
      });
      
      const data = await response.json();
      result = JSON.stringify(data, null, 2);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto p-8">
  <h1 class="text-3xl font-bold mb-8">🧪 API Integration Test</h1>
  
  <div class="space-y-6">
    <div class="card bg-white shadow-lg rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">College Scorecard API Test</h2>
      <button 
        class="btn btn-primary px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400" 
        on:click={testAPI}
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Test College Scorecard API'}
      </button>
    </div>
    
    <div class="card bg-white shadow-lg rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Main University Matching Test</h2>
      <button 
        class="btn btn-primary px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400" 
        on:click={testMainMatching}
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Test Main Matching System'}
      </button>
    </div>
    
    {#if error}
      <div class="alert alert-error bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
      </div>
    {/if}
    
    {#if result}
      <div class="card bg-white shadow-lg rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">📊 API Response</h3>
        <pre class="bg-gray-100 p-4 rounded overflow-x-auto text-sm">{result}</pre>
      </div>
    {/if}
  </div>
</div>

<style>
  .container {
    max-width: 1200px;
  }
</style> 