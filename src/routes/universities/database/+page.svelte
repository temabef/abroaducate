<script>
  import { redirect } from '@sveltejs/kit';
  
  export function load({ url }) {
    // Preserve any query parameters from the original URL
    const queryString = url.search;
    return redirect(302, `/universities/phase2${queryString}`);
  }
</script> 