<script lang="ts">
  import { MapPin, Users, Globe, Building2, ChevronRight, Euro, ShieldCheck, GraduationCap } from 'lucide-svelte';
  let { data } = $props();
  let uni = $derived(data.university);
  let programs = $derived(data.programs || []);
  let displayProgramLimit = $state(12);

  function hasValue(value: any) {
    const text = String(value || '').trim();
    return Boolean(text && text !== '--' && text.toLowerCase() !== 'n/a');
  }
</script>

<svelte:head>
  <title>{uni?.name || 'Error'} - Study Abroad</title>
</svelte:head>

{#if data.debugError}
	<div class="max-w-3xl mx-auto mt-20 p-6 bg-red-50 text-red-700 border border-red-200 rounded-xl">
		<h2 class="font-bold text-xl mb-4">Database Error Debug</h2>
		<p class="font-mono text-sm break-all">{data.debugError}</p>
	</div>
{:else}
<!-- Premium Cover Layout -->
<div class="min-h-screen bg-slate-50">
  <div class="h-[500px] relative overflow-hidden">
     <img src={uni.hero_image_url || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2000&q=80'} onerror={(e) => (e.currentTarget as HTMLImageElement).src='https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=2000&q=80'} class="absolute inset-0 w-full h-full object-cover" alt={uni.name} />
     <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
     
     <div class="absolute bottom-0 left-0 right-0">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
           <div class="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-full text-sm font-bold uppercase tracking-wide mb-6 shadow-lg shadow-orange-500/10 backdrop-blur-sm">
             {uni.tuition_type || 'Variable Tuition'}
           </div>
           <h1 class="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight" style="font-family: 'Outfit', sans-serif;">{uni.name}</h1>
           <div class="flex flex-wrap items-center gap-8 text-slate-200 text-lg font-medium">
              <span class="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl backdrop-blur-md border border-slate-700/50"><MapPin class="w-5 h-5 text-orange-400"/> {uni.city}, {uni.country}</span>
              <span class="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl backdrop-blur-md border border-slate-700/50"><Building2 class="w-5 h-5 text-orange-400"/> {uni.type}</span>
              {#if hasValue(uni.global_rank)}
                <span class="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-xl backdrop-blur-md border border-slate-700/50"><Globe class="w-5 h-5 text-orange-400"/> {uni.global_rank} Rank</span>
              {/if}
           </div>
        </div>
     </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
     <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        <!-- Left Column: Main Content -->
        <div class="lg:col-span-2 space-y-10">
           
           <!-- About Section -->
           <div class="bg-white rounded-[2rem] p-8 md:p-10 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div class="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <h2 class="text-3xl font-extrabold text-slate-900 mb-6 relative z-10" style="font-family: 'Outfit', sans-serif;">About {uni.name}</h2>
              <p class="text-slate-600 text-lg leading-relaxed relative z-10">{uni.description}</p>
           </div>
           
           <!-- Programs Section -->
           <div class="bg-white rounded-[2rem] p-8 md:p-10 border border-slate-200 shadow-sm">
              <div class="flex items-center justify-between mb-8">
                 <h2 class="text-2xl font-extrabold text-slate-900 flex items-center gap-3" style="font-family: 'Outfit', sans-serif;">
                    <GraduationCap class="w-8 h-8 text-orange-500 p-1.5 bg-orange-50 rounded-xl" /> 
                    Curated Program Pathways
                 </h2>
                 <span class="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-sm font-bold">Low-tuition catalog</span>
              </div>
              
              <div class="space-y-4">
                 {#if programs.length === 0}
                    <div class="p-12 text-center bg-slate-50 border border-slate-200 rounded-[1.5rem] border-dashed">
                      <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <GraduationCap class="w-8 h-8 text-slate-300" />
                      </div>
                      <p class="text-slate-500 font-medium">No programs listed for this university yet.</p>
                    </div>
                 {:else}
                    {#each programs.slice(0, displayProgramLimit) as program}
                      <a href={`/programs/${program.id}`} class="p-6 rounded-[1.5rem] border border-slate-100 bg-slate-50 flex justify-between items-center group hover:bg-white hover:border-orange-200 hover:shadow-lg transition-all cursor-pointer block relative overflow-hidden">
                         <div class="absolute inset-0 bg-gradient-to-r from-orange-50/0 via-orange-50/0 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div class="flex-1 relative z-10">
                            <h3 class="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">{program.program_name}</h3>
                            <div class="flex flex-wrap items-center gap-2 text-sm font-medium">
                               <span class="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 capitalize shadow-sm">{program.degree_level || 'Master'}</span>
                               {#if program.field_of_study}
                                  <span class="text-slate-400">•</span>
                                  <span class="text-slate-600">{program.field_of_study}</span>
                               {/if}
                               <span class="text-slate-400">•</span>
                               {#if program.tuition_per_semester > 0}
                                  <span class="text-slate-600 flex items-center gap-1"><Euro class="w-3.5 h-3.5"/>{program.tuition_per_semester}/semester</span>
                               {:else}
                                  <span class="text-green-600 bg-green-50 px-2 py-0.5 rounded-md flex items-center gap-1"><ShieldCheck class="w-3.5 h-3.5"/>Zero Tuition</span>
                               {/if}
                            </div>
                         </div>
                         <div class="text-orange-500 bg-white border border-slate-100 shadow-sm group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all p-3 rounded-xl ml-4 relative z-10 transform group-hover:scale-110 group-hover:rotate-12">
                            <ChevronRight class="w-5 h-5" />
                         </div>
                      </a>
                    {/each}
                    {#if displayProgramLimit < programs.length}
                      <div class="pt-4 flex justify-center">
                        <button onclick={() => displayProgramLimit += 12} class="px-6 py-3 bg-white border border-slate-200 hover:border-orange-500 hover:text-orange-600 shadow-sm text-slate-700 font-bold rounded-full text-sm transition-all">
                          Load More Programs
                        </button>
                      </div>
                    {/if}
                 {/if}
              </div>
           </div>

           <!-- Funding Banner -->
           <div class="bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-emerald-600 rounded-[2rem] p-8 md:p-10 shadow-xl text-white relative overflow-hidden group">
              <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/90 to-emerald-800/90"></div>
              
              <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                 <div class="flex-1">
                    <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-400/30 text-emerald-50 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-400/30 backdrop-blur-sm">
                       <Euro class="w-3.5 h-3.5" /> Funding Matches Available
                    </div>
                    <h2 class="text-3xl md:text-4xl font-extrabold mb-3 leading-tight" style="font-family: 'Outfit', sans-serif;">Fund Your Studies Here</h2>
                    <p class="text-emerald-50 text-lg max-w-xl leading-relaxed">Don't let living expenses hold you back. Discover fully-funded scholarships and grants matching this university's profile.</p>
                 </div>
                 
                 <div class="shrink-0">
                    <a href="/scholarships" class="px-8 py-4 bg-white text-emerald-700 rounded-2xl font-bold text-lg hover:bg-emerald-50 hover:shadow-xl hover:shadow-emerald-900/20 transition-all inline-flex items-center gap-3 transform hover:-translate-y-1">
                       View Scholarships <ChevronRight class="w-5 h-5" />
                    </a>
                 </div>
              </div>
           </div>
           
        </div>
        
        <!-- Right Column: Sticky Sidebar -->
        <div>
           <div class="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl sticky top-28 border border-slate-800 overflow-hidden">
              <!-- Decorative ambient glow -->
              <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none"></div>
              <div class="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

              <h3 class="text-2xl font-extrabold mb-8 flex items-center gap-3 relative z-10" style="font-family: 'Outfit', sans-serif;">
                 <Euro class="w-7 h-7 text-orange-400" /> Affordability Score
              </h3>
              
              <div class="space-y-4 mb-10 relative z-10">
                 <!-- Tuition Card -->
                 <div class="bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/60 hover:border-orange-500/30 transition-colors">
                    <div class="text-slate-400 text-sm mb-2 font-medium flex items-center gap-2">
                       <Building2 class="w-4 h-4" /> Estimated Tuition
                    </div>
                    <div class="text-4xl font-bold text-white flex items-baseline gap-2">
                       {uni.tuition_type === 'Zero Tuition' ? '€0' : '< €1,500'} 
                       <span class="text-lg text-slate-500 font-normal">/ yr</span>
                    </div>
                 </div>
                 
                 <!-- Proof of Funds Card -->
                 <div class="bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/60 hover:border-orange-500/30 transition-colors">
                    <div class="text-slate-400 text-sm mb-2 font-medium flex items-center gap-2">
                       <ShieldCheck class="w-4 h-4" /> Required Proof of Funds
                    </div>
                    <div class="text-3xl font-bold text-slate-200">
                       {uni.living_cost_estimate || 'Varies'}
                    </div>
                    <div class="text-xs text-slate-400 mt-3 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                       Check the current proof-of-funds rules for {uni.country} before applying.
                    </div>
                 </div>
              </div>
              
              <button class="relative z-10 w-full py-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 rounded-2xl font-bold text-lg text-white transition-all shadow-lg shadow-orange-500/25 mb-6 transform hover:-translate-y-1 flex items-center justify-center gap-2">
                 Start Strategy Profile <ChevronRight class="w-5 h-5" />
              </button>
              
              <div class="relative z-10 flex items-center justify-center gap-2 text-slate-400 text-sm bg-slate-800/30 py-3 rounded-xl border border-slate-800/50">
                 <ShieldCheck class="w-4 h-4 text-green-400" /> Verified Low-Tuition Pathway
              </div>
           </div>
        </div>

     </div>
  </div>
</div>
{/if}
