<script lang="ts">
  import { redirect } from '@sveltejs/kit';
  
  export function load({ url }: { url: URL }) {
    // Preserve any query parameters from the original URL
    const queryString = url.search;
    return redirect(302, `/universities/phase2${queryString}`);
  }
</script> 