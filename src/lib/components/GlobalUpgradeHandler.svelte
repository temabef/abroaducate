<script lang="ts">
    import { onMount } from 'svelte';
    import { upgradeState, handleUpgradeClick, handleUpgradeDismiss } from '$lib/services/upgradeService';
    import CompactUpgradeModal from './CompactUpgradeModal.svelte';
    import UpgradeToast from './UpgradeToast.svelte';
    
    let mounted = false;
    
    onMount(() => {
        mounted = true;
    });
    
    // Subscribe to global upgrade state
    $: showModal = $upgradeState.showModal;
    $: showToast = $upgradeState.showToast;
    $: modalData = $upgradeState.modalData;
    
    // Computed values for safe modal/toast showing (only after component is mounted)
    $: shouldShowModal = mounted && showModal && modalData.limit > 0;
    $: shouldShowToast = mounted && showToast && modalData.limit > 0;
    
    // Debug log to track unexpected modal shows
    $: if (showModal && modalData.currentUsage === 0 && modalData.limit === 0) {
        console.warn('Upgrade modal triggered with invalid data:', modalData);
        // Automatically dismiss invalid modals
        handleUpgradeDismiss();
    }
    
    function onUpgrade(event: CustomEvent<{ planType: string }>) {
        handleUpgradeClick(event.detail.planType);
    }
    
    function onDismiss() {
        handleUpgradeDismiss();
    }
</script>

<!-- Global Compact Upgrade Modal - shows anywhere in the app (only with valid data) -->
<CompactUpgradeModal 
    bind:isOpen={shouldShowModal}
    limitType={modalData.limitType}
    currentPlan={modalData.currentPlan}
    currentUsage={modalData.currentUsage}
    limit={modalData.limit}
    featureType={modalData.featureType}
    on:upgrade={onUpgrade}
    on:close={onDismiss}
/>

<!-- Global Upgrade Toast - shows anywhere in the app (only with valid data) -->
<UpgradeToast 
    bind:isVisible={shouldShowToast}
    limitType={modalData.limitType}
    featureType={modalData.featureType}
    currentUsage={modalData.currentUsage}
    limit={modalData.limit}
    planType={modalData.currentPlan}
    on:upgrade={onUpgrade}
/> 