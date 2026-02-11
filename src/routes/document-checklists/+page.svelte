<script>
    import DocumentChecklistComponent from '$lib/components/DocumentChecklistComponent.svelte';
    
    export let data;
</script>

<svelte:head>
    <title>Document Checklists for Study Abroad | Abroaducate</title>
    <meta name="description" content="Comprehensive study abroad document checklists for US, UK, Canada & Australia. Track your progress, get expert tips, and ensure you have all required documents." />
    <meta name="keywords" content="document checklist, study abroad documents, visa application checklist, university enrollment documents, student visa documents, document tracker" />
</svelte:head>

<!-- Manual AdSense blocks removed (auto ads only) -->

<!-- Pass selected country only, avoid duplicating the component -->
<DocumentChecklistComponent country="US" {data} /> 