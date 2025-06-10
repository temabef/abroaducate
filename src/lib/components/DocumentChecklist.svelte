<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    
    export let applicationId: string = '';
    export let universityName: string = '';
    export let programName: string = '';
    export let initialChecklist: any = {};
    export let compact: boolean = false;
    
    const dispatch = createEventDispatcher();
    
    interface DocumentItem {
        id: string;
        name: string;
        required: boolean;
        status: 'not_started' | 'in_progress' | 'completed' | 'uploaded';
        deadline?: string;
        notes?: string;
        fileId?: string;
        fileName?: string;
        category: 'academic' | 'test_scores' | 'essays' | 'personal' | 'financial';
    }
    
    let checklist: DocumentItem[] = [
        // Academic Documents
        { id: 'sop', name: 'Statement of Purpose', required: true, status: 'not_started', category: 'essays' },
        { id: 'transcripts', name: 'Official Transcripts', required: true, status: 'not_started', category: 'academic' },
        { id: 'degree_certificate', name: 'Degree Certificate', required: true, status: 'not_started', category: 'academic' },
        { id: 'lor1', name: 'Letter of Recommendation #1', required: true, status: 'not_started', category: 'academic' },
        { id: 'lor2', name: 'Letter of Recommendation #2', required: true, status: 'not_started', category: 'academic' },
        { id: 'lor3', name: 'Letter of Recommendation #3', required: false, status: 'not_started', category: 'academic' },
        
        // Test Scores
        { id: 'gre', name: 'GRE Scores', required: true, status: 'not_started', category: 'test_scores' },
        { id: 'toefl_ielts', name: 'TOEFL/IELTS Scores', required: true, status: 'not_started', category: 'test_scores' },
        
        // Essays & Personal
        { id: 'personal_statement', name: 'Personal Statement', required: false, status: 'not_started', category: 'essays' },
        { id: 'resume', name: 'Resume/CV', required: true, status: 'not_started', category: 'personal' },
        { id: 'portfolio', name: 'Portfolio', required: false, status: 'not_started', category: 'personal' },
        
        // Financial
        { id: 'bank_statement', name: 'Bank Statement', required: true, status: 'not_started', category: 'financial' },
        { id: 'sponsorship_letter', name: 'Sponsorship Letter', required: false, status: 'not_started', category: 'financial' },
        
        // Additional
        { id: 'passport', name: 'Passport Copy', required: true, status: 'not_started', category: 'personal' },
        { id: 'application_form', name: 'Online Application Form', required: true, status: 'not_started', category: 'personal' }
    ];
    
    let loading = false;
    let expandedCategories = new Set(['academic', 'essays', 'test_scores']);
    
    // Initialize checklist from props
    $: if (initialChecklist && Object.keys(initialChecklist).length > 0) {
        checklist = checklist.map(item => ({
            ...item,
            status: initialChecklist[item.id]?.status || item.status,
            notes: initialChecklist[item.id]?.notes || item.notes,
            deadline: initialChecklist[item.id]?.deadline || item.deadline,
            fileId: initialChecklist[item.id]?.fileId || item.fileId,
            fileName: initialChecklist[item.id]?.fileName || item.fileName
        }));
    }
    
    // Group documents by category
    $: documentsByCategory = checklist.reduce((acc, doc) => {
        if (!acc[doc.category]) acc[doc.category] = [];
        acc[doc.category].push(doc);
        return acc;
    }, {} as Record<string, DocumentItem[]>);
    
    // Calculate progress statistics
    $: progress = {
        total: checklist.length,
        required: checklist.filter(item => item.required).length,
        completed: checklist.filter(item => item.status === 'completed' || item.status === 'uploaded').length,
        requiredCompleted: checklist.filter(item => item.required && (item.status === 'completed' || item.status === 'uploaded')).length,
        percentage: Math.round((checklist.filter(item => item.status === 'completed' || item.status === 'uploaded').length / checklist.length) * 100)
    };
    
    const categoryLabels = {
        academic: { name: 'Academic Documents', icon: '🎓' },
        test_scores: { name: 'Test Scores', icon: '📊' },
        essays: { name: 'Essays & Statements', icon: '📝' },
        personal: { name: 'Personal Documents', icon: '👤' },
        financial: { name: 'Financial Documents', icon: '💰' }
    };
    
    async function updateDocumentStatus(documentId: string, newStatus: DocumentItem['status']) {
        checklist = checklist.map(item => 
            item.id === documentId ? { ...item, status: newStatus } : item
        );
        await saveChecklist();
    }
    
    async function updateDocumentNotes(documentId: string, notes: string) {
        checklist = checklist.map(item => 
            item.id === documentId ? { ...item, notes } : item
        );
        await saveChecklist();
    }
    
    async function saveChecklist() {
        if (!applicationId) return;
        
        loading = true;
        try {
            // Convert checklist to database format
            const checklistData = checklist.reduce((acc, item) => {
                acc[item.id] = {
                    status: item.status,
                    notes: item.notes,
                    deadline: item.deadline,
                    fileId: item.fileId,
                    fileName: item.fileName
                };
                return acc;
            }, {} as any);
            
            dispatch('checklistUpdated', {
                applicationId,
                checklist: checklistData,
                progress
            });
            
        } catch (error) {
            console.error('Error saving checklist:', error);
        } finally {
            loading = false;
        }
    }
    
    function getStatusColor(status: DocumentItem['status']): string {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100';
            case 'uploaded': return 'text-green-600 bg-green-100';
            case 'in_progress': return 'text-blue-600 bg-blue-100';
            case 'not_started': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    }
    
    function getStatusIcon(status: DocumentItem['status']): string {
        switch (status) {
            case 'completed': return '✅';
            case 'uploaded': return '📎';
            case 'in_progress': return '🔄';
            case 'not_started': return '⭕';
            default: return '⭕';
        }
    }
    
    function toggleCategory(category: string) {
        if (expandedCategories.has(category)) {
            expandedCategories.delete(category);
        } else {
            expandedCategories.add(category);
        }
        expandedCategories = new Set(expandedCategories);
    }
    
    function getProgressColor(percentage: number): string {
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 60) return 'bg-blue-500';
        if (percentage >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    }
</script>

<div class="document-checklist {compact ? 'compact' : ''} bg-white rounded-lg shadow-sm border">
    <!-- Header -->
    <div class="header border-b bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4">
        <div class="flex justify-between items-center">
            <div>
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    📋 Document Checklist
                    {#if universityName && !compact}
                        <span class="text-sm font-normal text-gray-600">• {universityName}</span>
                    {/if}
                </h3>
                {#if !compact && programName}
                    <p class="text-sm text-gray-600">{programName}</p>
                {/if}
            </div>
            <div class="text-right">
                <div class="text-2xl font-bold text-gray-900">{progress.percentage}%</div>
                <div class="text-xs text-gray-600">{progress.completed}/{progress.total} complete</div>
            </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="mt-3">
            <div class="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{progress.requiredCompleted}/{progress.required} required</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                    class="h-2 rounded-full transition-all duration-300 {getProgressColor(progress.percentage)}"
                    style="width: {progress.percentage}%"
                ></div>
            </div>
        </div>
    </div>
    
    <!-- Categories -->
    <div class="categories p-6 space-y-4">
        {#each Object.entries(documentsByCategory) as [category, documents]}
            {#if documents.length > 0}
                <div class="category">
                    <!-- Category Header -->
                    <button 
                        class="category-header w-full flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        on:click={() => toggleCategory(category)}
                    >
                        <div class="flex items-center gap-3">
                            <span class="text-lg">{categoryLabels[category]?.icon}</span>
                            <span class="font-medium text-gray-900">{categoryLabels[category]?.name}</span>
                            <span class="text-sm text-gray-600">
                                ({documents.filter(d => d.status === 'completed' || d.status === 'uploaded').length}/{documents.length})
                            </span>
                        </div>
                        <span class="text-gray-500 transform transition-transform {expandedCategories.has(category) ? 'rotate-180' : ''}">
                            ▼
                        </span>
                    </button>
                    
                    <!-- Category Documents -->
                    {#if expandedCategories.has(category)}
                        <div class="category-documents mt-3 space-y-2">
                            {#each documents as document}
                                <div class="document-item p-3 border rounded-lg hover:shadow-sm transition-shadow">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <div class="flex items-center gap-3 mb-2">
                                                <span class="text-lg">{getStatusIcon(document.status)}</span>
                                                <div>
                                                    <h4 class="font-medium text-gray-900 flex items-center gap-2">
                                                        {document.name}
                                                        {#if document.required}
                                                            <span class="text-red-500 text-xs">*</span>
                                                        {/if}
                                                    </h4>
                                                    {#if document.fileName}
                                                        <p class="text-sm text-gray-600">📎 {document.fileName}</p>
                                                    {/if}
                                                </div>
                                            </div>
                                            
                                            {#if document.notes}
                                                <div class="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                                                    {document.notes}
                                                </div>
                                            {/if}
                                        </div>
                                        
                                        <div class="flex flex-col items-end gap-2">
                                            <!-- Status Dropdown -->
                                            <select 
                                                value={document.status}
                                                on:change={(e) => updateDocumentStatus(document.id, e.target.value)}
                                                class="text-xs px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 {getStatusColor(document.status)}"
                                            >
                                                <option value="not_started">Not Started</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="completed">Completed</option>
                                                <option value="uploaded">Uploaded</option>
                                            </select>
                                            
                                            {#if !compact}
                                                <button 
                                                    class="text-xs text-blue-600 hover:text-blue-700"
                                                    on:click={() => {
                                                        const notes = prompt('Add notes for ' + document.name, document.notes || '');
                                                        if (notes !== null) updateDocumentNotes(document.id, notes);
                                                    }}
                                                >
                                                    {document.notes ? 'Edit Notes' : 'Add Notes'}
                                                </button>
                                            {/if}
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if}
        {/each}
    </div>
    
    <!-- Actions -->
    {#if !compact}
        <div class="actions border-t p-4 bg-gray-50">
            <div class="flex justify-between items-center">
                <div class="text-sm text-gray-600">
                    <span class="text-red-500">*</span> Required documents
                </div>
                <div class="flex gap-2">
                    <button 
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        on:click={() => dispatch('generateReport', { applicationId, progress, checklist })}
                    >
                        📊 Generate Report
                    </button>
                    <button 
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        disabled={progress.requiredCompleted < progress.required}
                        on:click={() => dispatch('markReadyToSubmit', { applicationId })}
                    >
                        ✅ Ready to Submit
                    </button>
                </div>
            </div>
        </div>
    {/if}
    
    {#if loading}
        <div class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    {/if}
</div>

<style>
    .document-checklist {
        position: relative;
        max-width: 100%;
    }
    
    .compact {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .category-header:hover {
        background-color: #f3f4f6;
    }
    
    .document-item {
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    }
    
    .document-item:hover {
        transform: translateY(-1px);
    }
    
    select {
        transition: all 0.2s ease;
    }
    
    select:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
</style> 