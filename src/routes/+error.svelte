<script>
  export let error;
  export let status;
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-100">
  <div class="w-full max-w-md p-8 space-y-4 text-center bg-white rounded-lg shadow-md">
    <div class="flex justify-center mb-4">
      <img src="/logo-icon.svg" alt="Abroaducate" class="w-12 h-12" />
    </div>
    {#if status === 404 || (!status && !error)}
      <h1 class="text-2xl font-bold text-yellow-600">You’ve wandered off the study trail...</h1>
      <p class="text-gray-700 mt-4">
        We’ve searched every scholarship database, knocked on every embassy door, scrolled through every Reddit thread…<br>
        <b>but sadly, we couldn’t find the page you were looking for.</b>
      </p>
    {:else}
      <h1 class="text-2xl font-bold text-red-600">An Error Occurred</h1>
      <p class="text-gray-700">
        {error?.message || 'Something went wrong. Please try again later.'}
      </p>
    {/if}
    <a href="/" class="inline-block px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 mt-4">
      Back to Home
    </a>
  </div>
</div> 