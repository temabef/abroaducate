<script lang="ts">
  import { goto } from '$app/navigation';

  // Redirect to the main auth page in sign-up mode
  goto('/auth?signup=true', { replaceState: true });
</script>

<svelte:head>
  <title>Create Account - Abroaducate</title>
  <meta name="robots" content="noindex" />
</svelte:head>
