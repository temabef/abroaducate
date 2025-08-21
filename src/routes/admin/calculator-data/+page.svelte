<script lang="ts">
  import { onMount } from 'svelte';
  
  let { data } = $props();
  let { supabase } = $derived(data);
  
  // State for managing cities data
  let cities: any[] = $state([]);
  let loading = $state(true);
  let saving = $state(false);
  let message = $state('');
  let messageType = $state('info');
  
  // Form state for adding new city
  let showAddForm = $state(false);
  let newCity = $state({
    city: '',
    state: '',
    state_code: '',
    dorm_cost_min: 800,
    dorm_cost_max: 1500,
    shared_apt_min: 600,
    shared_apt_max: 1200,
    studio_apt_min: 1200,
    studio_apt_max: 2500,
    food_budget: 300,
    food_average: 500,
    food_comfortable: 800,
    transportation: 100,
    utilities: 150,
    personal_expenses: 250,
    public_tuition_min: 15000,
    public_tuition_max: 30000,
    private_tuition_min: 25000,
    private_tuition_max: 50000,
    community_tuition_min: 8000,
    community_tuition_max: 15000,
    health_insurance: 2500,
    books_supplies: 1200,
    cost_of_living_index: 100.0,
    population: 500000,
    popular_universities: []
  });
  
  let universitiesText = $state(''); // For editing universities as text
  
  onMount(async () => {
    await loadCities();
  });
  
  async function loadCities() {
    loading = true;
    try {
      const { data: citiesData, error } = await supabase
        .from('us_cities_cost_data')
        .select('*')
        .order('state', { ascending: true })
        .order('city', { ascending: true });
      
      if (error) throw error;
      cities = citiesData || [];
      
    } catch (error) {
      console.error('Error loading cities:', error);
      showMessage('Failed to load cities data', 'error');
    } finally {
      loading = false;
    }
  }
  
  async function saveCity(city: any) {
    saving = true;
    try {
      const { error } = await supabase
        .from('us_cities_cost_data')
        .update(city)
        .eq('id', city.id);
      
      if (error) throw error;
      
      showMessage(`Updated ${city.city}, ${city.state}`, 'success');
      
    } catch (error) {
      console.error('Error saving city:', error);
      showMessage('Failed to save city data', 'error');
    } finally {
      saving = false;
    }
  }
  
  async function addNewCity() {
    saving = true;
    try {
      // Parse universities from text
      const universities = universitiesText
        .split(',')
        .map(u => u.trim())
        .filter(u => u.length > 0);
      
      const cityData = {
        ...newCity,
        popular_universities: universities
      };
      
      const { error } = await supabase
        .from('us_cities_cost_data')
        .insert([cityData]);
      
      if (error) throw error;
      
      showMessage(`Added ${newCity.city}, ${newCity.state}`, 'success');
      
      // Reset form
      showAddForm = false;
      universitiesText = '';
      newCity = {
        city: '',
        state: '',
        state_code: '',
        dorm_cost_min: 800,
        dorm_cost_max: 1500,
        shared_apt_min: 600,
        shared_apt_max: 1200,
        studio_apt_min: 1200,
        studio_apt_max: 2500,
        food_budget: 300,
        food_average: 500,
        food_comfortable: 800,
        transportation: 100,
        utilities: 150,
        personal_expenses: 250,
        public_tuition_min: 15000,
        public_tuition_max: 30000,
        private_tuition_min: 25000,
        private_tuition_max: 50000,
        community_tuition_min: 8000,
        community_tuition_max: 15000,
        health_insurance: 2500,
        books_supplies: 1200,
        cost_of_living_index: 100.0,
        population: 500000,
        popular_universities: []
      };
      
      await loadCities();
      
    } catch (error) {
      console.error('Error adding city:', error);
      showMessage('Failed to add city', 'error');
    } finally {
      saving = false;
    }
  }
  
  async function deleteCity(cityId: string, cityName: string) {
    if (!confirm(`Are you sure you want to delete ${cityName}?`)) return;
    
    saving = true;
    try {
      const { error } = await supabase
        .from('us_cities_cost_data')
        .delete()
        .eq('id', cityId);
      
      if (error) throw error;
      
      showMessage(`Deleted ${cityName}`, 'success');
      await loadCities();
      
    } catch (error) {
      console.error('Error deleting city:', error);
      showMessage('Failed to delete city', 'error');
    } finally {
      saving = false;
    }
  }
  
  function showMessage(text: string, type: 'success' | 'error' | 'info' = 'info') {
    message = text;
    messageType = type;
    setTimeout(() => {
      message = '';
    }, 3000);
  }
  
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
</script>

<svelte:head>
  <title>Budget Calculator Data Management - Admin</title>
</svelte:head>

<div class="calculator-data-admin">
  <div class="header">
    <h1>💰 Budget Calculator Data Management</h1>
    <p>Manage US cities cost data for the budget calculator</p>
  </div>
  
  {#if message}
    <div class="message {messageType}">{message}</div>
  {/if}
  
  <div class="actions">
    <button onclick={() => showAddForm = !showAddForm} class="add-button">
      {showAddForm ? '❌ Cancel' : '➕ Add New City'}
    </button>
    <button onclick={loadCities} disabled={loading} class="refresh-button">
      🔄 Refresh Data
    </button>
  </div>
  
  {#if showAddForm}
    <div class="add-form">
      <h3>Add New City</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>City Name</label>
          <input type="text" bind:value={newCity.city} placeholder="e.g., San Francisco" />
        </div>
        <div class="form-group">
          <label>State</label>
          <input type="text" bind:value={newCity.state} placeholder="e.g., California" />
        </div>
        <div class="form-group">
          <label>State Code</label>
          <input type="text" bind:value={newCity.state_code} placeholder="e.g., CA" maxlength="2" />
        </div>
        <div class="form-group">
          <label>Population</label>
          <input type="number" bind:value={newCity.population} />
        </div>
        
        <!-- Housing Costs -->
        <div class="form-section">
          <h4>Housing Costs (Monthly)</h4>
          <div class="cost-pair">
            <label>Dorm Cost Range</label>
            <input type="number" bind:value={newCity.dorm_cost_min} placeholder="Min" />
            <input type="number" bind:value={newCity.dorm_cost_max} placeholder="Max" />
          </div>
          <div class="cost-pair">
            <label>Shared Apartment Range</label>
            <input type="number" bind:value={newCity.shared_apt_min} placeholder="Min" />
            <input type="number" bind:value={newCity.shared_apt_max} placeholder="Max" />
          </div>
          <div class="cost-pair">
            <label>Studio Apartment Range</label>
            <input type="number" bind:value={newCity.studio_apt_min} placeholder="Min" />
            <input type="number" bind:value={newCity.studio_apt_max} placeholder="Max" />
          </div>
        </div>
        
        <!-- Living Costs -->
        <div class="form-section">
          <h4>Living Costs (Monthly)</h4>
          <div class="form-group">
            <label>Food - Budget</label>
            <input type="number" bind:value={newCity.food_budget} />
          </div>
          <div class="form-group">
            <label>Food - Average</label>
            <input type="number" bind:value={newCity.food_average} />
          </div>
          <div class="form-group">
            <label>Food - Comfortable</label>
            <input type="number" bind:value={newCity.food_comfortable} />
          </div>
          <div class="form-group">
            <label>Transportation</label>
            <input type="number" bind:value={newCity.transportation} />
          </div>
          <div class="form-group">
            <label>Utilities</label>
            <input type="number" bind:value={newCity.utilities} />
          </div>
          <div class="form-group">
            <label>Personal Expenses</label>
            <input type="number" bind:value={newCity.personal_expenses} />
          </div>
        </div>
        
        <!-- Tuition Costs -->
        <div class="form-section">
          <h4>Tuition Costs (Annual)</h4>
          <div class="cost-pair">
            <label>Public University Range</label>
            <input type="number" bind:value={newCity.public_tuition_min} placeholder="Min" />
            <input type="number" bind:value={newCity.public_tuition_max} placeholder="Max" />
          </div>
          <div class="cost-pair">
            <label>Private University Range</label>
            <input type="number" bind:value={newCity.private_tuition_min} placeholder="Min" />
            <input type="number" bind:value={newCity.private_tuition_max} placeholder="Max" />
          </div>
          <div class="cost-pair">
            <label>Community College Range</label>
            <input type="number" bind:value={newCity.community_tuition_min} placeholder="Min" />
            <input type="number" bind:value={newCity.community_tuition_max} placeholder="Max" />
          </div>
        </div>
        
        <!-- Additional Costs -->
        <div class="form-section">
          <h4>Additional Costs (Annual)</h4>
          <div class="form-group">
            <label>Health Insurance</label>
            <input type="number" bind:value={newCity.health_insurance} />
          </div>
          <div class="form-group">
            <label>Books & Supplies</label>
            <input type="number" bind:value={newCity.books_supplies} />
          </div>
          <div class="form-group">
            <label>Cost of Living Index</label>
            <input type="number" step="0.1" bind:value={newCity.cost_of_living_index} />
          </div>
        </div>
        
        <!-- Universities -->
        <div class="form-section full-width">
          <h4>Popular Universities</h4>
          <textarea 
            bind:value={universitiesText}
            placeholder="Enter university names separated by commas, e.g., Harvard University, MIT, Boston University"
            rows="3"
          ></textarea>
        </div>
      </div>
      
      <div class="form-actions">
        <button onclick={addNewCity} disabled={saving || !newCity.city || !newCity.state} class="save-button">
          {saving ? 'Adding...' : '✅ Add City'}
        </button>
        <button onclick={() => showAddForm = false} class="cancel-button">
          ❌ Cancel
        </button>
      </div>
    </div>
  {/if}
  
  {#if loading}
    <div class="loading">Loading cities data...</div>
  {:else}
    <div class="cities-grid">
      <div class="cities-header">
        <h3>Cities Database ({cities.length} cities)</h3>
      </div>
      
      {#each cities as city}
        <div class="city-card">
          <div class="city-header">
            <h4>{city.city}, {city.state_code}</h4>
            <div class="city-meta">
              <span>COL Index: {city.cost_of_living_index}</span>
              <span>Pop: {city.population?.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="cost-summary">
            <div class="cost-item">
              <span class="cost-label">Housing Range:</span>
              <span class="cost-value">
                {formatCurrency(city.shared_apt_min)} - {formatCurrency(city.studio_apt_max)}/mo
              </span>
            </div>
            <div class="cost-item">
              <span class="cost-label">Food Range:</span>
              <span class="cost-value">
                {formatCurrency(city.food_budget)} - {formatCurrency(city.food_comfortable)}/mo
              </span>
            </div>
            <div class="cost-item">
              <span class="cost-label">Public Tuition:</span>
              <span class="cost-value">
                {formatCurrency(city.public_tuition_min)} - {formatCurrency(city.public_tuition_max)}/yr
              </span>
            </div>
          </div>
          
          {#if city.popular_universities?.length > 0}
            <div class="universities">
              <strong>Universities:</strong>
              {city.popular_universities.join(', ')}
            </div>
          {/if}
          
          <div class="city-actions">
            <button onclick={() => saveCity(city)} disabled={saving} class="edit-button">
              ✏️ Edit
            </button>
            <button onclick={() => deleteCity(city.id, `${city.city}, ${city.state}`)} disabled={saving} class="delete-button">
              🗑️ Delete
            </button>
          </div>
        </div>
      {/each}
      
      {#if cities.length === 0}
        <div class="empty-state">
          <p>No cities data found. Add some cities to get started!</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .calculator-data-admin {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .header h1 {
    color: #1f2937;
    margin-bottom: 0.5rem;
    font-size: 2rem;
    font-weight: 700;
  }

  .header p {
    color: #6b7280;
    font-size: 1.1rem;
  }

  .message {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    font-weight: 500;
  }

  .message.success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }

  .message.error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .message.info {
    background: #dbeafe;
    color: #1e40af;
    border: 1px solid #bfdbfe;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    justify-content: center;
  }

  .add-button, .refresh-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .add-button {
    background: linear-gradient(135deg, #059669, #10b981);
    color: white;
  }

  .add-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(5, 150, 105, 0.25);
  }

  .refresh-button {
    background: #f8fafc;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .refresh-button:hover {
    background: #f1f5f9;
  }

  .add-form {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .add-form h3 {
    color: #1f2937;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .form-section {
    grid-column: span 1;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .form-section.full-width {
    grid-column: 1 / -1;
  }

  .form-section h4 {
    color: #374151;
    margin-bottom: 1rem;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
  }

  .form-group label {
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
  }

  .form-group input, .form-group textarea {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.875rem;
  }

  .form-group input:focus, .form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .cost-pair {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
  }

  .cost-pair label {
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
  }

  .cost-pair input {
    margin-bottom: 0.25rem;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
  }

  .save-button, .cancel-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .save-button {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
  }

  .save-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.25);
  }

  .save-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .cancel-button {
    background: #f8fafc;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .cancel-button:hover {
    background: #f1f5f9;
  }

  .cities-grid {
    display: grid;
    gap: 1.5rem;
  }

  .cities-header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .cities-header h3 {
    color: #1f2937;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .city-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .city-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .city-header h4 {
    color: #1f2937;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .city-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .cost-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .cost-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem;
    background: #f8fafc;
    border-radius: 4px;
  }

  .cost-label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }

  .cost-value {
    font-weight: 600;
    color: #1f2937;
    font-size: 0.875rem;
  }

  .universities {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: #f0fdf4;
    border-radius: 4px;
    font-size: 0.875rem;
    color: #374151;
  }

  .city-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .edit-button, .delete-button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .edit-button {
    background: #f0f9ff;
    color: #0369a1;
  }

  .edit-button:hover:not(:disabled) {
    background: #e0f2fe;
  }

  .delete-button {
    background: #fef2f2;
    color: #dc2626;
  }

  .delete-button:hover:not(:disabled) {
    background: #fee2e2;
  }

  .edit-button:disabled, .delete-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .loading {
    text-align: center;
    padding: 4rem;
    color: #6b7280;
    font-size: 1.1rem;
  }

  .empty-state {
    text-align: center;
    padding: 4rem;
    color: #6b7280;
  }

  .empty-state p {
    font-size: 1.1rem;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .calculator-data-admin {
      padding: 1rem;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .cost-summary {
      grid-template-columns: 1fr;
    }

    .city-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .city-meta {
      flex-direction: column;
      gap: 0.25rem;
    }

    .actions {
      flex-direction: column;
      align-items: center;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style>
