<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  
  export let isOpen = false;
  export let title = 'Success!';
  export let message = 'Operation completed successfully';
  export let icon = '✅';
  export let actionText = 'OK';
  export let showConfetti = true;
  
  const dispatch = createEventDispatcher();
  
  function handleClose() {
    dispatch('close');
    isOpen = false;
  }
  
  function handleAction() {
    dispatch('action');
    isOpen = false;
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    } else if (event.key === 'Enter') {
      handleAction();
    }
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    transition:fade={{ duration: 200 }}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="success-modal-title"
    tabindex="-1"
  >
    <button
      type="button"
      class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
      on:click={handleClose}
      aria-label="Close modal"
    ></button>
    <!-- Modal -->
    <div 
      class="relative z-10 bg-white rounded-2xl shadow-2xl max-w-md w-full"
      transition:scale={{ duration: 300, start: 0.95 }}
      role="document"
    >
      <!-- Close Button -->
      <button 
        on:click={handleClose}
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 transition-colors"
        aria-label="Close modal"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      
      <!-- Header with Success Animation -->
      <div class="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-8 rounded-t-2xl text-center relative overflow-hidden">
        {#if showConfetti}
          <!-- Confetti Animation -->
          <div class="absolute inset-0 pointer-events-none">
            <div class="confetti">🎉</div>
            <div class="confetti">🎊</div>
            <div class="confetti">✨</div>
            <div class="confetti">🌟</div>
            <div class="confetti">🎉</div>
            <div class="confetti">🎊</div>
          </div>
        {/if}
        
        <div class="relative z-10">
          <div class="text-6xl mb-4 animate-bounce">{icon}</div>
          <h2 id="success-modal-title" class="text-2xl font-bold mb-2">{title}</h2>
          <p class="text-green-100 text-lg">{message}</p>
        </div>
      </div>
      
      <!-- Content Section -->
      <div class="p-8 text-center">
        <div class="mb-6">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <p class="text-gray-600 leading-relaxed">
            Your action has been completed successfully. You can continue using the application.
          </p>
        </div>
        
        <!-- Action Button -->
        <button
          on:click={handleAction}
          class="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          {actionText}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Confetti animation */
  .confetti {
    position: absolute;
    font-size: 1.5rem;
    animation: confettiFall 3s ease-out infinite;
  }
  
  .confetti:nth-child(1) {
    left: 10%;
    animation-delay: 0s;
  }
  
  .confetti:nth-child(2) {
    left: 20%;
    animation-delay: 0.5s;
  }
  
  .confetti:nth-child(3) {
    left: 30%;
    animation-delay: 1s;
  }
  
  .confetti:nth-child(4) {
    left: 70%;
    animation-delay: 0.3s;
  }
  
  .confetti:nth-child(5) {
    left: 80%;
    animation-delay: 0.8s;
  }
  
  .confetti:nth-child(6) {
    left: 90%;
    animation-delay: 1.2s;
  }
  
  @keyframes confettiFall {
    0% {
      transform: translateY(-100px) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(300px) rotate(360deg);
      opacity: 0;
    }
  }
  
  /* Bounce animation for icon */
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0, 0, 0);
    }
    40%, 43% {
      transform: translate3d(0, -10px, 0);
    }
    70% {
      transform: translate3d(0, -5px, 0);
    }
    90% {
      transform: translate3d(0, -2px, 0);
    }
  }
  
  .animate-bounce {
    animation: bounce 1s ease-in-out;
  }
</style> 
