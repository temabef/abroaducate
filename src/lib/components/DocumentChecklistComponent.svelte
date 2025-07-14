<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>

<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import AuthenticationFlow from '$lib/components/AuthenticationFlow.svelte';
    
    // Props
    export let country = 'US';
    export let category = null;
    export let data: any;
    
    // State
    let checklists: any[] = [];
    let loading = true;
    let error = '';
    let selectedCountry = country;
    let selectedCategory = category;
    let usage: any = null;
    let isPreview = false;
    let previewMessage = '';
    
    // Authentication modal state
    let showAuthModal = false;
    let authMode: 'login' | 'signup' = 'signup';
    
    // Supabase client
    $: ({ supabase } = data || {});
    
    // Available options
    const countries = [
        { code: 'US', name: '🇺🇸 United States', flag: '🇺🇸' },
        { code: 'UK', name: '🇬🇧 United Kingdom', flag: '🇬🇧' },
        { code: 'Canada', name: '🇨🇦 Canada', flag: '🇨🇦' },
        { code: 'Australia', name: '🇦🇺 Australia', flag: '🇦🇺' }
    ];
    
    // Update the categories array to match the actual data
    let categories = [
        { code: 'visa_application', name: 'Visa Application', icon: '📄' },
        { code: 'enrollment', name: 'University Enrollment', icon: '🏫' },
        { code: 'pre_departure', name: 'Pre-Departure', icon: '✈️' },
        { code: 'financial_documents', name: 'Financial Documentation', icon: '💰' }
    ];
    
    // Color schemes for different priorities
    const priorityColors = {
        high: 'bg-red-50 border-red-200 text-red-800',
        medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        low: 'bg-green-50 border-green-200 text-green-800',
        urgent: 'bg-purple-50 border-purple-200 text-purple-800'
    };
    
    const categoryColors = {
        visa_application: 'bg-blue-50 border-blue-200',
        university_enrollment: 'bg-green-50 border-green-200',
        pre_departure: 'bg-purple-50 border-purple-200',
        financial_documentation: 'bg-yellow-50 border-yellow-200'
    };
    
    // Add state to track which checklist is expanded
    let expandedChecklistId: any = null;
    
    // Add a reactive variable for organized checklists
    $: organizedChecklists = checklists ? organizeByCategory(checklists) : [];
    
    onMount(() => {
        loadChecklists();
    });
    
    // Add this function to validate and fix checklist items if needed
    function validateAndFixChecklistItems(checklistList: any) {
        if (!Array.isArray(checklistList)) {
            console.error('Checklists is not an array:', checklistList);
            return [];
        }
        
        return checklistList.map(checklist => {
            // Ensure the checklist has a valid structure
            if (!checklist || typeof checklist !== 'object') {
                console.error('Invalid checklist:', checklist);
                return null;
            }
            
            // Ensure items is an array
            let validItems = [];
            if (checklist.items) {
                try {
                    // Handle both string and object formats
                    if (typeof checklist.items === 'string') {
                        validItems = JSON.parse(checklist.items);
                    } else if (Array.isArray(checklist.items)) {
                        validItems = checklist.items;
                    } else if (typeof checklist.items === 'object') {
                        // Convert object to array if needed
                        validItems = Object.values(checklist.items);
                    }
                } catch (e) {
                    console.error('Error parsing checklist items:', e);
                    validItems = [];
                }
            }
            
            // Ensure user_progress has a valid structure
            let validProgress = null;
            if (checklist.user_progress) {
                validProgress = {
                    ...checklist.user_progress,
                    completed_items: Array.isArray(checklist.user_progress.completed_items) 
                        ? checklist.user_progress.completed_items 
                        : []
                };
            }
            
            return {
                ...checklist,
                items: validItems,
                user_progress: validProgress
            };
        }).filter(checklist => checklist !== null);
    }
    
    async function loadChecklists() {
        try {
            loading = true;
            const params = new URLSearchParams();
            params.set('country', selectedCountry);
            if (selectedCategory) {
                params.set('category', selectedCategory);
            }
            
            const queryString = params.toString();
            const url = `/api/document-checklists?${queryString}`;
            
            console.log(`Loading checklists for country=${selectedCountry}, category=${selectedCategory || 'all'}`);
            
            let response;
            try {
                // Add timeout to prevent infinite loading
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                
                response = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                loading = false;
                error = 'Failed to load checklists. Please try again later.';
                return;
            }
            
            if (!response.ok) {
                console.error('API error:', response.status, response.statusText);
                loading = false;
                error = `Server error: ${response.status}. Please try again later.`;
                return;
            }
            
            const responseData = await response.json();
            console.log('Checklist API response received:', responseData);
            
            if (!responseData.success) {
                console.error('API returned error:', responseData.error);
                loading = false;
                error = responseData.error || 'Failed to load checklists';
                return;
            }
            
            isPreview = !!responseData.is_preview;
            
            // Data validation to prevent rendering issues
            if (!Array.isArray(responseData.data)) {
                console.error('Invalid data format, expected array:', responseData.data);
                loading = false;
                error = 'Invalid data received from server';
                return;
            }
            
            // Filter out duplicates based on checklist ID
            const uniqueChecklists = [];
            const seenIds = new Set();
            
            for (const checklist of responseData.data) {
                if (!seenIds.has(checklist.id)) {
                    seenIds.add(checklist.id);
                    uniqueChecklists.push(checklist);
                } else {
                    console.log(`Filtered out duplicate checklist: ${checklist.id} - ${checklist.name}`);
                }
            }
            
            console.log(`Filtered ${responseData.data.length} to ${uniqueChecklists.length} unique checklists`);
            
            // Process each checklist to ensure data consistency
            const processedChecklists = uniqueChecklists.map(checklist => {
                // Ensure items is an array
                if (!Array.isArray(checklist.items)) {
                    checklist.items = [];
                }
                
                // Ensure user_progress.completed_items is an array if it exists
                if (checklist.user_progress && checklist.user_progress.completed_items) {
                    if (typeof checklist.user_progress.completed_items === 'string') {
                        try {
                            checklist.user_progress.completed_items = JSON.parse(checklist.user_progress.completed_items);
                        } catch (e) {
                            console.error('Error parsing completed_items:', e);
                            checklist.user_progress.completed_items = [];
                        }
                    }
                    
                    // Ensure it's an array even after parsing
                    if (!Array.isArray(checklist.user_progress.completed_items)) {
                        checklist.user_progress.completed_items = [];
                    }
                }
                
                return checklist;
            });
            
            checklists = processedChecklists;
            console.log(`Loaded ${checklists.length} checklists, preview mode: ${isPreview}`);
        } catch (err) {
            console.error('Error loading checklists:', err);
            error = 'An unexpected error occurred';
        } finally {
            loading = false;
        }
    }
    
    async function toggleChecklistItem(checklistId: any, itemId: any) {
        try {
            console.log(`Toggling item ${itemId} for checklist ${checklistId}`);
            
            // First, find the checklist in our local state
            const checklist = checklists.find(c => c.id === checklistId);
            if (!checklist) {
                console.error(`Checklist ${checklistId} not found in local state`);
                throw new Error('Checklist not found');
            }
            
            // Ensure user_progress exists
            if (!checklist.user_progress) {
                console.log(`Starting checklist ${checklistId} first since it hasn't been started yet`);
                await startChecklist(checklistId);
                // Wait a moment before continuing
                await new Promise(resolve => setTimeout(resolve, 500));
                return; // The UI will refresh from startChecklist
            }
            
            // Ensure completed_items is an array
            const completedItems = Array.isArray(checklist.user_progress.completed_items) 
                ? [...checklist.user_progress.completed_items] 
                : [];
                
            // Optimistically update the UI immediately
            const isCompleted = completedItems.includes(itemId);
            const updatedItems = isCompleted
                ? completedItems.filter(id => id !== itemId)
                : [...completedItems, itemId];
                
            // Update local state optimistically
            const updatedChecklists = checklists.map(c => {
                if (c.id === checklistId) {
                    return {
                        ...c,
                        user_progress: {
                            ...c.user_progress,
                            completed_items: updatedItems,
                            // Approximate progress percentage
                            progress_percentage: Math.round((updatedItems.length / checklist.items.length) * 100)
                        }
                    };
                }
                return c;
            });
            
            // Update local state right away for better UX
            checklists = updatedChecklists;
            
            // Send update to server with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            try {
                const response = await fetch('/api/document-checklists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'toggle_item',
                        checklistId,
                        itemId
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const result = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                    console.error('Error response from toggle_item API:', result);
                    throw new Error(result.error || 'Failed to update item');
                }
                
                const result = await response.json().catch(() => ({ success: true }));
                console.log('Item toggled successfully');
                
            } catch (fetchError) {
                console.error('Fetch error during toggle:', fetchError);
                // Don't throw here - we'll keep the optimistic UI update
                // but log the error and continue
                console.log('Continuing with optimistic UI update despite server error');
                return; // Don't reload checklists, keep optimistic update
            }
            
        } catch (err) {
            console.error('Error toggling item:', err);
            // Show error in a more user-friendly way (toast or small notification)
            const errorMessage = err instanceof Error ? err.message : 'Failed to update item';
            error = `Failed to update progress: ${errorMessage}`;
        }
    }
    
    async function startChecklist(checklistId: any) {
        try {
            // Add timeout protection
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
            
            try {
                const response = await fetch('/api/document-checklists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'start_checklist',
                        checklistId
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    const result = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
                    console.error('Server error starting checklist:', result);
                    const errorMessage = result.error || 'Failed to start checklist';
                    const errorDetails = result.details ? `: ${result.details}` : '';
                    throw new Error(`${errorMessage}${errorDetails}`);
                }
                
                // Create an optimistic update for better UX
                const checklist = checklists.find(c => c.id === checklistId);
                if (checklist) {
                    const updatedChecklists = checklists.map(c => {
                        if (c.id === checklistId) {
                            return {
                                ...c,
                                user_progress: {
                                    checklist_id: checklistId,
                                    completed_items: [],
                                    progress_percentage: 0,
                                    started_at: new Date().toISOString()
                                }
                            };
                        }
                        return c;
                    });
                    
                    // Update local state immediately
                    checklists = updatedChecklists;
                }
                
                // Attempt to load updated state from server, but don't fail if it doesn't work
                try {
                    await loadChecklists();
                } catch (loadError) {
                    console.error('Error refreshing checklists after start:', loadError);
                    // Continue with optimistic update
                }
                
            } catch (fetchError) {
                console.error('Error starting checklist:', fetchError);
                if (fetchError.name === 'AbortError') {
                    error = 'Request timed out. Please try again.';
                } else {
                    error = 'Failed to start checklist. Please try again.';
                }
            }
        } catch (err) {
            console.error('Unexpected error starting checklist:', err);
            error = err instanceof Error ? err.message : 'Failed to start checklist';
        }
    }
    
    function getProgressColor(percentage: any) {
        if (percentage >= 100) return 'bg-green-500';
        if (percentage >= 75) return 'bg-blue-500';
        if (percentage >= 50) return 'bg-yellow-500';
        if (percentage >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    }
    
    function formatEstimatedTime(hours: any) {
        if (!hours) return 'Quick';
        if (hours < 1) return 'Less than 1 hour';
        return hours === 1 ? '1 hour' : `${hours} hours`;
    }
    
    // Handle filter changes
    function handleCountryChange() {
        // Reset category when changing country to avoid no results
        selectedCategory = null;
        loadChecklists();
    }
    
    function handleCategoryChange() {
        loadChecklists();
    }
    
    function getCategoryIcon(categoryCode: any) {
        const cat = categories.find(c => c.code === categoryCode);
        return cat?.icon || '📋';
    }
    
    // Authentication modal functions
    function showSignup() {
        authMode = 'signup';
        showAuthModal = true;
    }
    
    function showLogin() {
        authMode = 'login';
        showAuthModal = true;
    }
    
    // Function to toggle expand/collapse a checklist
    function toggleExpand(checklistId: any) {
        if (expandedChecklistId === checklistId) {
            expandedChecklistId = null; // Collapse if already expanded
        } else {
            expandedChecklistId = checklistId; // Expand this one, collapse others
        }
    }
    
    // Update the getPriorityColor function to use different colors for different categories
    function getPriorityColor(category: any) {
        switch (category) {
            case 'visa_application':
                return 'red';
            case 'enrollment':
                return 'blue';
            case 'pre_departure':
                return 'yellow';
            case 'financial_documents':
                return 'green';
            // Fallback to priority levels if category not found
            case 'high':
                return 'red';
            case 'medium':
                return 'yellow';
            case 'low':
                return 'green';
            case 'urgent':
                return 'purple';
            default:
                return 'gray';
        }
    }
    
    // Add the function to get category names
    function getCategoryName(categoryCode: any) {
        const category = categories.find(c => c.code === categoryCode);
        return category ? category.name : categoryCode;
    }
    
    // Update the organizeByCategory function to better handle duplicate entries
    function organizeByCategory(checklistList: any) {
        const result = {};
        const seenItems = new Set(); // Track seen items to prevent duplicates
        
        // Initialize with all known categories
        categories.forEach(cat => {
            result[cat.code] = {
                name: cat.name,
                icon: cat.icon,
                checklists: []
            };
        });
        
        // Add each checklist to its category, preventing duplicates
        checklistList.forEach(checklist => {
            const category = checklist.category || 'other';
            const uniqueKey = `${category}_${checklist.name}`;
            
            // Skip if we've already seen this item
            if (seenItems.has(uniqueKey)) {
                console.log(`Skipping duplicate: ${checklist.name} in ${category}`);
                return;
            }
            
            seenItems.add(uniqueKey);
            
            if (!result[category]) {
                // Create category if it doesn't exist (fallback)
                result[category] = {
                    name: getCategoryName(category),
                    icon: '📋',
                    checklists: []
                };
            }
            
            result[category].checklists.push(checklist);
        });
        
        // Filter out empty categories
        return Object.entries(result)
            .filter(([_, data]) => data.checklists.length > 0)
            .map(([code, data]) => ({
                code,
                name: data.name,
                icon: data.icon,
                checklists: data.checklists
            }));
    }

    // Helper function to organize checklists into balanced columns
    function organizeIntoColumns(checklists: any) {
        const leftColumn: any[] = [];
        const rightColumn: any[] = [];
        
        checklists.forEach((checklist: any, index: any) => {
            if (index % 2 === 0) {
                leftColumn.push(checklist);
            } else {
                rightColumn.push(checklist);
            }
        });
        

        
        return { leftColumn, rightColumn };
    }
</script>

<div class="min-h-screen bg-white pt-8">
    <!-- Header Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center mb-8">
            <!-- Free Badge -->
            <div class="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <span class="mr-2">🎉</span>
                100% FREE
            </div>
            
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                <span class="text-4xl">📋</span>
                Study Abroad Document Checklists
            </h1>
            <p class="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
                Never miss a critical document again! Our comprehensive, country-specific checklists guide you through every step of your study abroad journey - from visa applications to university enrollment.
            </p>
            
            <!-- Value Proposition -->
            <div class="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 mb-8 max-w-4xl mx-auto border border-blue-200">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">✨ What You Get (100% Free)</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                        <div class="text-2xl mb-2">🌍</div>
                        <div class="font-semibold text-gray-900">Multiple Countries</div>
                        <div class="text-gray-600">US, UK, Canada, Australia specific guides</div>
                    </div>
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                        <div class="text-2xl mb-2">✅</div>
                        <div class="font-semibold text-gray-900">Progress Tracking</div>
                        <div class="text-gray-600">Mark items complete, track your progress</div>
                    </div>
                    <div class="bg-white rounded-lg p-4 shadow-sm">
                        <div class="text-2xl mb-2">💡</div>
                        <div class="font-semibold text-gray-900">Expert Tips</div>
                        <div class="text-gray-600">Insider advice and helpful resources</div>
                    </div>
                </div>
                
                <!-- Registration Benefits -->
                {#if !$page.data.session}
                    <div class="mt-6 pt-6 border-t border-gray-200">
                        <div class="flex items-center justify-center gap-4 text-sm text-gray-700">
                            <span class="flex items-center gap-2">
                                <span class="text-green-500">✓</span>
                                Create free account to save progress
                            </span>
                            <span class="flex items-center gap-2">
                                <span class="text-green-500">✓</span>
                                Access all our study abroad tools
                            </span>
                            <span class="flex items-center gap-2">
                                <span class="text-green-500">✓</span>
                                Track multiple applications
                            </span>
                        </div>
                        <div class="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                            <button 
                                on:click={showSignup}
                                class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
                            >
                                Start Tracking My Progress →
                            </button>
                            <a href="/pricing" class="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                                Explore All Features
                            </a>
                        </div>
                    </div>
                {/if}
            </div>
            
            <!-- Success Stats -->
            <div class="bg-gray-50 rounded-lg p-6 mb-8">
                <div class="text-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">Trusted by Students Worldwide</h3>
                    <p class="text-gray-600 text-sm">Join thousands who've successfully used our platform</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <div class="text-2xl font-bold text-green-600">5+</div>
                        <div class="text-sm text-gray-600">Countries Supported</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-purple-600">100%</div>
                        <div class="text-sm text-gray-600">FREE Access</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-yellow-600">24/7</div>
                        <div class="text-sm text-gray-600">Available</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Preview Mode Banner -->
        {#if isPreview}
            <div class="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg shadow-sm border p-6 mb-6 text-white">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <div class="text-2xl">👁️</div>
                            <h3 class="text-lg font-semibold">You're Previewing Our FREE Document Checklists!</h3>
                        </div>
                        <p class="text-green-100 mb-4">Create a free account to unlock progress tracking, save your work, and access all our study abroad tools.</p>
                        <div class="flex flex-wrap gap-3">
                            <button 
                                on:click={showSignup}
                                class="bg-white text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition-colors font-semibold shadow-lg"
                            >
                                Create Free Account
                            </button>
                            <a href="/sop" class="bg-green-400 bg-opacity-30 border border-white text-white px-4 py-2 rounded-lg hover:bg-opacity-40 transition-colors font-medium">
                                Try Our AI Tools
                            </a>
                        </div>
                    </div>
                    <div class="hidden md:block">
                        <div class="text-right">
                            <div class="text-green-100 text-sm font-medium mb-2">Plus get access to:</div>
                            <ul class="text-green-100 text-sm space-y-1">
                                <li>📝 AI-powered SOP Generator</li>
                                <li>🎓 Scholarship Database</li>
                                <li>🏫 University Matching</li>
                                <li>📊 GPA Converter</li>
                                <li>✉️ Cover Letter Generator</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        {/if}
        
        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <div class="grid grid-cols-1 {$page.data.session ? 'md:grid-cols-2' : ''} gap-6">
                <!-- Country Filter -->
                <div>
                    <label for="country" class="block text-sm font-medium text-gray-700 mb-2">
                        Select Country
                    </label>
                    <select 
                        bind:value={selectedCountry} 
                        on:change={handleCountryChange}
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {#each countries as country}
                            <option value={country.code}>{country.name}</option>
                        {/each}
                    </select>
                </div>
                
                <!-- Category Filter - Only show for logged-in users -->
                {#if $page.data.session}
                    <div>
                        <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Category (Optional)
                        </label>
                        <select 
                            bind:value={selectedCategory} 
                            on:change={handleCategoryChange}
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Categories</option>
                            {#each categories as cat}
                                <option value={cat.code}>{cat.name}</option>
                            {/each}
                        </select>
                    </div>
                {/if}
            </div>
        </div>
        
        <!-- Error State -->
        {#if error}
            <div class="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                <div class="flex items-center space-x-3">
                    <div class="text-red-500 text-2xl">⚠️</div>
                    <div>
                        <h3 class="text-lg font-semibold text-red-800">Unable to Load Checklists</h3>
                        <p class="text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        {/if}
        
        <!-- Loading State -->
        {#if loading}
            <div class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-gray-600">Loading checklists...</span>
            </div>
        {/if}
        
        <!-- Checklists Grid -->
        <div class="grid grid-cols-1 gap-8 mb-8">
            {#if loading}
                <div class="text-center py-12">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p class="mt-4 text-gray-600">Loading checklists...</p>
                </div>
            {:else if organizedChecklists.length > 0}
                <!-- Flatten all checklists for global 2-column layout -->
                {@const allChecklists = organizedChecklists.flatMap(category => 
                    category.checklists.map(checklist => ({
                        ...checklist,
                        categoryName: category.name,
                        categoryIcon: category.icon,
                        categoryCode: category.code
                    }))
                )}
                {@const globalColumns = organizeIntoColumns(allChecklists)}
                
                <!-- Remove debug info for clean UI -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Left Column -->
                    <div class="space-y-6">
                        {#each globalColumns.leftColumn as checklist (checklist.id)}
                            <!-- Category Header for this checklist -->
                        <div class="flex items-center mb-3">
                            <div class="bg-white p-2 rounded-full border border-gray-200 shadow-sm mr-3">
                                    <span class="text-xl">{checklist.categoryIcon}</span>
                            </div>
                                <h2 class="text-lg font-bold text-gray-900">{checklist.categoryName}</h2>
                        </div>
                        
                            <!-- Checklist Card -->
                            <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
                                <!-- Clickable Checklist Header -->
                                <div class="p-4 flex items-start justify-between cursor-pointer hover:bg-gray-50 transition-colors" 
                                         on:click={() => toggleExpand(checklist.id)}
                                         class:bg-blue-50={expandedChecklistId === checklist.id}
                                         class:border-b={expandedChecklistId === checklist.id}
                                     class:border-blue-200={expandedChecklistId === checklist.id}>
                                        
                                    <div class="flex items-start space-x-3 flex-1">
                                        <div class="flex-shrink-0 mt-1" class:text-blue-600={expandedChecklistId === checklist.id}>
                                                {#if checklist.user_progress && checklist.user_progress.progress_percentage > 0}
                                                    <div class="relative">
                                                    <div class="h-7 w-7 border-2 border-blue-600 rounded-lg flex items-center justify-center bg-white">
                                                        <div class="h-4 w-4 bg-blue-600 rounded-sm"></div>
                                                        </div>
                                                    <div class="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                                            {checklist.user_progress.progress_percentage}%
                                                        </div>
                                                    </div>
                                                {:else}
                                                <div class="h-7 w-7 border-2 border-gray-300 rounded-lg bg-white"></div>
                                                {/if}
                                            </div>
                                            
                                            <div class="flex-1 min-w-0">
                                            <h3 class="font-semibold text-gray-900 text-lg leading-tight">{checklist.name}</h3>
                                            <div class="flex items-center space-x-2 mt-2">
                                                <span class="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600">
                                                    ⏱️ {formatEstimatedTime(checklist.estimated_time_hours)}
                                                </span>
                                                <span class="bg-blue-100 rounded-full px-3 py-1 text-xs text-blue-700 font-medium">
                                                    {checklist.items.length} items
                                                </span>
                                                </div>
                                            {#if checklist.description && expandedChecklistId !== checklist.id}
                                                <p class="text-sm text-gray-600 mt-2 line-clamp-2">{checklist.description}</p>
                                            {/if}
                                            </div>
                                        </div>
                                        
                                    <div class="flex items-center ml-3">
                                            {#if expandedChecklistId === checklist.id}
                                                <span class="text-blue-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                                    </svg>
                                                </span>
                                            {:else}
                                                <span class="text-gray-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </span>
                                            {/if}
                                        </div>
                        </div>
                        
                                <!-- Expanded Content -->
                                {#if expandedChecklistId === checklist.id}
                                        <!-- Description -->
                                        <div class="p-4 border-b border-gray-100 bg-gray-50">
                                            <p class="text-sm text-gray-600">{checklist.description}</p>
                                        </div>
                                        
                                        <!-- Start/Progress Section -->
                                        {#if !checklist.user_progress && !isPreview}
                                            <div class="flex items-center justify-center py-6 px-4 border-b border-gray-100">
                                                <div class="text-center">
                                                    <div class="text-3xl mb-2">📋</div>
                                                <p class="text-sm text-gray-600 mb-3">Ready to get started?</p>
                                                    <button 
                                                        on:click={() => startChecklist(checklist.id)}
                                                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Start Checklist
                                                    </button>
                                                </div>
                                            </div>
                                        {:else if checklist.user_progress}
                                        <!-- Progress Bar -->
                                        <div class="px-4 py-3 border-b border-gray-100">
                                            <div class="flex justify-between items-center mb-2">
                                                <span class="text-sm font-medium text-gray-700">Progress</span>
                                                <span class="text-sm font-medium text-blue-600">{checklist.user_progress.progress_percentage}%</span>
                                                </div>
                                            <div class="w-full bg-gray-200 rounded-full h-2">
                                                <div class="{getProgressColor(checklist.user_progress.progress_percentage)} h-2 rounded-full transition-all" style="width: {checklist.user_progress.progress_percentage}%"></div>
                                                </div>
                                            </div>
                                            
                                            <!-- Checklist Items -->
                                        <div class="max-h-96 overflow-y-auto">
                                            <ul class="divide-y divide-gray-100">
                                                {#each checklist.items as item (item.id)}
                                                    <li class="py-3 px-4 hover:bg-gray-50 transition-colors">
                                                        <div class="flex items-start space-x-3">
                                                            <div class="pt-0.5">
                                                                <button 
                                                                    on:click={() => toggleChecklistItem(checklist.id, item.id)}
                                                                    class="h-5 w-5 rounded border border-gray-300 flex items-center justify-center transition-colors {checklist.user_progress.completed_items.includes(item.id) ? 'bg-green-500 border-green-500' : 'bg-white hover:border-green-400'}"
                                                                >
                                                                    {#if checklist.user_progress.completed_items.includes(item.id)}
                                                                        <svg class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                                                        </svg>
                                                                    {/if}
                                                                </button>
                                                            </div>
                                                            <div class="flex-1">
                                                                <div class="flex items-start">
                                                                    <span class="font-medium text-gray-900 {checklist.user_progress.completed_items.includes(item.id) ? 'line-through text-gray-500' : ''}">{item.title}</span>
                                                                    {#if item.required}
                                                                        <span class="ml-2 text-red-500 text-xs font-bold">*</span>
                                                                    {/if}
                                                                </div>
                                                                <p class="text-sm text-gray-600 mt-1">{item.description}</p>
                                                                {#if item.tips}
                                                                    <p class="text-xs text-blue-600 mt-1">💡 {item.tips}</p>
                                                                {/if}
                                                            </div>
                                                        </div>
                                                    </li>
                                                {/each}
                                            </ul>
                                                    </div>
                                    {:else if isPreview}
                                        <!-- Preview Mode -->
                                        <div class="py-6 px-4 text-center">
                                            <div class="text-3xl mb-2">👀</div>
                                                    <h4 class="font-medium text-gray-900 mb-2">Preview Mode</h4>
                                            <p class="text-sm text-gray-600 mb-4">Sign up to track your progress</p>
                                                    <div class="space-x-2">
                                                        <button 
                                                            on:click={showSignup}
                                                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                    Sign Up
                                                        </button>
                                                        <button 
                                                            on:click={showLogin}
                                                            class="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            Log In
                                                        </button>
                                                </div>
                                            </div>
                                        {/if}
                                        
                                        <!-- Tips Section -->
                                        {#if checklist.tips_and_notes && checklist.tips_and_notes.length > 0}
                                        <div class="p-4 bg-blue-50">
                                                <h4 class="font-medium text-blue-900 mb-2 flex items-center">
                                                <span class="mr-2">💡</span> Tips
                                                </h4>
                                            <ul class="space-y-1 text-sm text-blue-800">
                                                    {#each checklist.tips_and_notes as tip}
                                                        <li class="flex items-start">
                                                        <span class="text-blue-500 mr-2 mt-1">•</span>
                                                            <span>{tip}</span>
                                                        </li>
                                                    {/each}
                                                </ul>
                                            </div>
                                        {/if}
                                {/if}
                            </div>
                        {/each}
                    </div>
                    
                    <!-- Right Column -->
                    <div class="space-y-6">
                        {#each globalColumns.rightColumn as checklist (checklist.id)}
                            <!-- Category Header for this checklist -->
                            <div class="flex items-center mb-3">
                                <div class="bg-white p-2 rounded-full border border-gray-200 shadow-sm mr-3">
                                    <span class="text-xl">{checklist.categoryIcon}</span>
                                </div>
                                <h2 class="text-lg font-bold text-gray-900">{checklist.categoryName}</h2>
                            </div>
                            
                            <!-- Checklist Card -->
                            <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
                                <!-- Clickable Checklist Header -->
                                <div class="p-4 flex items-start justify-between cursor-pointer hover:bg-gray-50 transition-colors" 
                                                on:click={() => toggleExpand(checklist.id)}
                                     class:bg-blue-50={expandedChecklistId === checklist.id}
                                     class:border-b={expandedChecklistId === checklist.id}
                                     class:border-blue-200={expandedChecklistId === checklist.id}>
                                    
                                    <div class="flex items-start space-x-3 flex-1">
                                        <div class="flex-shrink-0 mt-1" class:text-blue-600={expandedChecklistId === checklist.id}>
                                            {#if checklist.user_progress && checklist.user_progress.progress_percentage > 0}
                                                <div class="relative">
                                                    <div class="h-7 w-7 border-2 border-blue-600 rounded-lg flex items-center justify-center bg-white">
                                                        <div class="h-4 w-4 bg-blue-600 rounded-sm"></div>
                                                    </div>
                                                    <div class="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                                                        {checklist.user_progress.progress_percentage}%
                                                    </div>
                                                </div>
                                            {:else}
                                                <div class="h-7 w-7 border-2 border-gray-300 rounded-lg bg-white"></div>
                                            {/if}
                                        </div>
                                        
                                        <div class="flex-1 min-w-0">
                                            <h3 class="font-semibold text-gray-900 text-lg leading-tight">{checklist.name}</h3>
                                            <div class="flex items-center space-x-2 mt-2">
                                                <span class="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600">
                                                    ⏱️ {formatEstimatedTime(checklist.estimated_time_hours)}
                                                </span>
                                                <span class="bg-blue-100 rounded-full px-3 py-1 text-xs text-blue-700 font-medium">
                                                    {checklist.items.length} items
                                                </span>
                                            </div>
                                            {#if checklist.description && expandedChecklistId !== checklist.id}
                                                <p class="text-sm text-gray-600 mt-2 line-clamp-2">{checklist.description}</p>
                                            {/if}
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center ml-3">
                                        {#if expandedChecklistId === checklist.id}
                                            <span class="text-blue-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                                </svg>
                                            </span>
                                        {:else}
                                            <span class="text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </span>
                                        {/if}
                                    </div>
                                </div>
                                
                                <!-- Expanded Content -->
                                {#if expandedChecklistId === checklist.id}
                                    <!-- Description -->
                                    <div class="p-4 border-b border-gray-100 bg-gray-50">
                                        <p class="text-sm text-gray-600">{checklist.description}</p>
                                    </div>
                                    
                                    <!-- Start/Progress Section -->
                                    {#if !checklist.user_progress && !isPreview}
                                        <div class="flex items-center justify-center py-6 px-4 border-b border-gray-100">
                                            <div class="text-center">
                                                <div class="text-3xl mb-2">📋</div>
                                                <p class="text-sm text-gray-600 mb-3">Ready to get started?</p>
                                                <button 
                                                    on:click={() => startChecklist(checklist.id)}
                                                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Start Checklist
                                                </button>
                                            </div>
                                        </div>
                                    {:else if checklist.user_progress}
                                        <!-- Progress Bar -->
                                        <div class="px-4 py-3 border-b border-gray-100">
                                            <div class="flex justify-between items-center mb-2">
                                                <span class="text-sm font-medium text-gray-700">Progress</span>
                                                                                                 <span class="text-sm font-medium text-blue-600">{checklist.user_progress.progress_percentage}%</span>
                                            </div>
                                            <div class="w-full bg-gray-200 rounded-full h-2">
                                                <div class="{getProgressColor(checklist.user_progress.progress_percentage)} h-2 rounded-full transition-all" style="width: {checklist.user_progress.progress_percentage}%"></div>
                                            </div>
                                        </div>
                                        
                                        <!-- Checklist Items -->
                                        <div class="max-h-96 overflow-y-auto">
                                            <ul class="divide-y divide-gray-100">
                                                {#each checklist.items as item (item.id)}
                                                    <li class="py-3 px-4 hover:bg-gray-50 transition-colors">
                                                        <div class="flex items-start space-x-3">
                                                            <div class="pt-0.5">
                                                                <button 
                                                                    on:click={() => toggleChecklistItem(checklist.id, item.id)}
                                                                    class="h-5 w-5 rounded border border-gray-300 flex items-center justify-center transition-colors {checklist.user_progress.completed_items.includes(item.id) ? 'bg-green-500 border-green-500' : 'bg-white hover:border-green-400'}"
                                                                >
                                                                    {#if checklist.user_progress.completed_items.includes(item.id)}
                                                                        <svg class="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                                </svg>
                                                                    {/if}
                                            </button>
                                        </div>
                                                            <div class="flex-1">
                                                                <div class="flex items-start">
                                                                    <span class="font-medium text-gray-900 {checklist.user_progress.completed_items.includes(item.id) ? 'line-through text-gray-500' : ''}">{item.title}</span>
                                                                    {#if item.required}
                                                                        <span class="ml-2 text-red-500 text-xs font-bold">*</span>
                                                                    {/if}
                                    </div>
                                                                <p class="text-sm text-gray-600 mt-1">{item.description}</p>
                                                                {#if item.tips}
                                                                    <p class="text-xs text-blue-600 mt-1">💡 {item.tips}</p>
                                {/if}
                                                            </div>
                                                        </div>
                                                    </li>
                            {/each}
                                            </ul>
                                        </div>
                                    {:else if isPreview}
                                        <!-- Preview Mode -->
                                        <div class="py-6 px-4 text-center">
                                            <div class="text-3xl mb-2">👀</div>
                                            <h4 class="font-medium text-gray-900 mb-2">Preview Mode</h4>
                                            <p class="text-sm text-gray-600 mb-4">Sign up to track your progress</p>
                                            <div class="space-x-2">
                                                <button 
                                                    on:click={showSignup}
                                                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Sign Up
                                                </button>
                                                <button 
                                                    on:click={showLogin}
                                                    class="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Log In
                                                </button>
                                            </div>
                                        </div>
                                    {/if}
                                    
                                    <!-- Tips Section -->
                                    {#if checklist.tips_and_notes && checklist.tips_and_notes.length > 0}
                                        <div class="p-4 bg-blue-50">
                                            <h4 class="font-medium text-blue-900 mb-2 flex items-center">
                                                <span class="mr-2">💡</span> Tips
                                            </h4>
                                            <ul class="space-y-1 text-sm text-blue-800">
                                                {#each checklist.tips_and_notes as tip}
                                                    <li class="flex items-start">
                                                        <span class="text-blue-500 mr-2 mt-1">•</span>
                                                        <span>{tip}</span>
                                                    </li>
                                                {/each}
                                            </ul>
                                        </div>
                                    {/if}
                        {/if}
                    </div>
                {/each}
                    </div>
                </div>
            {:else if !loading}
                <div class="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <div class="text-4xl mb-4">🔍</div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">No Checklists Found</h3>
                    <p class="text-gray-600 max-w-md mx-auto">
                        {#if selectedCategory}
                            We don't have checklists in the "{getCategoryName(selectedCategory)}" category for {selectedCountry} yet.
                            <button 
                                on:click={() => { selectedCategory = null; loadChecklists(); }}
                                class="text-blue-600 hover:underline"
                            >
                                Clear filter
                            </button>
                        {:else}
                            We don't have checklists for {selectedCountry} yet. Please try another country.
                        {/if}
                    </p>
                </div>
            {/if}
        </div>
        
        <!-- Call to Action Section -->
        <div class="mt-12 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg p-8 text-center text-white">
            <h3 class="text-2xl font-bold mb-4">Complete Your Study Abroad Journey</h3>
            <p class="text-green-100 mb-6">
                Use our comprehensive AI-powered platform to create perfect applications and find funding opportunities.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/sop" class="bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition duration-200">
                    📝 Generate Statement of Purpose
                </a>
                <a href="/scholarships" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-green-600 transition duration-200">
                    🎓 Find Scholarships
                </a>
                <a href="/universities" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-green-600 transition duration-200">
                    🏫 University Matching
                </a>
                <a href="/gpa-converter" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-green-600 transition duration-200">
                    📊 GPA Converter
                </a>
            </div>
        </div>
    </div>
</div>

<!-- Authentication Modal -->
{#if showAuthModal && supabase}
    <AuthenticationFlow 
        bind:show={showAuthModal} 
        {supabase} 
        mode={authMode} 
        returnUrl="/document-checklists"
    />
{/if}