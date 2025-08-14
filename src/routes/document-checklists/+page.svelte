<script>
    import DocumentChecklistComponent from '$lib/components/DocumentChecklistComponent.svelte';
    import AdSenseAd from '$lib/components/AdSenseAd.svelte';
    
    export let data;
</script>

<svelte:head>
    <title>Document Checklists for Study Abroad | Abroaducate</title>
    <meta name="description" content="Comprehensive study abroad document checklists for US, UK, Canada & Australia. Track your progress, get expert tips, and ensure you have all required documents." />
    <meta name="keywords" content="document checklist, study abroad documents, visa application checklist, university enrollment documents, student visa documents, document tracker" />
</svelte:head>

<!-- Ad placement at top of page -->
<div class="max-w-4xl mx-auto my-8">
    <AdSenseAd adSlot="6442575607" className="bg-gray-50 p-4 rounded-lg border" />
</div>

<!-- Pass selected country only, avoid duplicating the component -->
<DocumentChecklistComponent country="US" {data} /> 