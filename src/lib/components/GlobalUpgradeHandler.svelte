<script lang="ts">
    import { upgradeState, handleUpgradeClick, handleUpgradeDismiss } from '$lib/services/upgradeService';
    import CompactUpgradeModal from './CompactUpgradeModal.svelte';
    import UpgradeToast from './UpgradeToast.svelte';
    
    // Subscribe to global upgrade state
    $: showModal = $upgradeState.showModal;
    $: showToast = $upgradeState.showToast;
    $: modalData = $upgradeState.modalData;
    
    function onUpgrade(event: CustomEvent<{ planType: string }>) {
        handleUpgradeClick(event.detail.planType);
    }
    
    function onDismiss() {
        handleUpgradeDismiss();
    }
</script>

<!-- Global Compact Upgrade Modal - shows anywhere in the app -->
<CompactUpgradeModal 
    bind:isOpen={showModal}
    limitType={modalData.limitType}
    currentPlan={modalData.currentPlan}
    currentUsage={modalData.currentUsage}
    limit={modalData.limit}
    featureType={modalData.featureType}
    on:upgrade={onUpgrade}
    on:close={onDismiss}
/>

<!-- Global Upgrade Toast - shows anywhere in the app -->
<UpgradeToast 
    bind:isVisible={showToast}
    limitType={modalData.limitType}
    featureType={modalData.featureType}
    currentUsage={modalData.currentUsage}
    limit={modalData.limit}
    planType={modalData.currentPlan}
    on:upgrade={onUpgrade}
/> 