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
  let { session, supabase } = $derived(data);
</script>

<div class="bg-white">
  <Navbar {data} />
  <main class="pt-16">
    <Header />
    <WhyChooseUs />
    <HowItWorks />
    <FormSection {supabase} {session} />
    <TryNowSection />
    <StartJourneySection />
  </main>
  <Footer />
</div>
