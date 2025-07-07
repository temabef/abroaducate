<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let duration: number; // in seconds
  export let onTimesUp: () => void;

  let timeLeft: number = duration;
  let interval: any;

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  onMount(() => {
    interval = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        clearInterval(interval);
        onTimesUp();
      }
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div class="text-2xl font-bold text-gray-800 dark:text-white">
  {formatTime(timeLeft)}
</div> 