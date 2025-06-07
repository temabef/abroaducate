<script lang="ts">
  import Navbar from '$lib/components/Navbar.svelte';
  import Header from '$lib/components/Header.svelte';
  import WhyChooseUs from '$lib/components/WhyChooseUs.svelte';
  import HowItWorks from '$lib/components/HowItWorks.svelte';
  import FormSection from '$lib/components/FormSection.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import TryNowSection from '$lib/components/TryNowSection.svelte';
  import StartJourneySection from '$lib/components/StartJourneySection.svelte';

  let { data } = $props();
  let { session } = $derived(data);
</script>

<div class="bg-white">
  <Navbar {data} />
  <main class="pt-16">
    {#if session}
      <div class="py-20 text-center">
        <h1 class="text-4xl font-bold">Your Dashboard</h1>
        <p class="mt-4 text-lg">Welcome back! Here are your generated SOPs.</p>
        <!-- Dashboard content will go here -->
      </div>
    {:else}
      <Header />
      <WhyChooseUs />
      <HowItWorks />
      <FormSection />
      <TryNowSection />
      <StartJourneySection />
    {/if}
  </main>
  <Footer />
</div>
