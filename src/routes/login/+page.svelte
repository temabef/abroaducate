<script lang="ts">
  import { goto } from '$app/navigation';

  // Redirect to the main auth page in login mode
  goto('/auth', { replaceState: true });
</script>

<svelte:head>
  <title>Login - Abroaducate</title>
  <meta name="robots" content="noindex" />
</svelte:head>
