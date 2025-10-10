<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let show: boolean = false;
  export let title: string = 'Confirm Action';
  export let message: string = 'Are you sure you want to proceed?';
  export let confirmText: string = 'Confirm';
  export let cancelText: string = 'Cancel';
  export let confirmClass: string = 'bg-red-600 hover:bg-red-700'; // Default to danger style
  export let icon: 'warning' | 'danger' | 'info' | 'question' = 'warning';

  const dispatch = createEventDispatcher();

  function handleConfirm() {
    dispatch('confirm');
    show = false;
  }

  function handleCancel() {
    dispatch('cancel');
    show = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    } else if (event.key === 'Enter') {
      handleConfirm();
    }
  }

  function getIcon() {
    switch (icon) {
      case 'danger':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'question':
        return '❓';
      default:
        return '⚠️';
    }
  }
</script>

{#if show}
  <!-- Modal backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    on:click={handleCancel}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
  >
    <!-- Modal content -->
    <div 
      class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all"
      on:click|stopPropagation
      role="document"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center">
          <span class="text-2xl mr-3">{getIcon()}</span>
          <h3 id="modal-title" class="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      </div>

      <!-- Body -->
      <div class="px-6 py-4">
        <p class="text-gray-600 leading-relaxed">{message}</p>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
        <button
          type="button"
          on:click={handleCancel}
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        >
          {cancelText}
        </button>
        <button
          type="button"
          on:click={handleConfirm}
          class="px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors {confirmClass}"
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Smooth entrance animation */
  .fixed {
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .transform {
    animation: slideUp 0.2s ease-out;
  }

  @keyframes slideUp {
    from {
      transform: translateY(10px) scale(0.95);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
</style> 