<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import Header from '$lib/components/Header.svelte';
  import HowItWorks from '$lib/components/HowItWorks.svelte';
  import FormSection from '$lib/components/FormSection.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<div class="bg-white">
  <Navbar />
  <main class="pt-16">
    <Header />
    <HowItWorks />
    <FormSection />
  </main>
  <Footer />
</div>
