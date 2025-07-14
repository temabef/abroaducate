<script lang="ts">
  import type { PageData } from "./$types";
  import { onMount } from "svelte";
  import { ukUniversityDataManager } from "$lib/database/uk-university-integration";
  import { australianUniversityManager } from "$lib/database/australia-university-integration";
  import { canadianUniversityManager } from "$lib/database/canada-university-integration";
  import { germanUniversityManager } from "$lib/database/germany-university-integration";
  import { dutchUniversityManager } from "$lib/database/netherlands-university-integration";
  import { japaneseUniversityManager } from "$lib/database/japan-university-integration";
  import { frenchUniversityManager } from "$lib/database/france-university-integration";
  import { italianUniversityManager } from "$lib/database/italy-university-integration";

  export let data: PageData;

  let statistics = {
    total: 0,
    uk: {
      total: 0,
      ancient: 0,
      russell: 0
    },
    us: {
      total: 0,
      ivyLeague: 0
    },
    canada: {
      total: 0,
      u15: 0
    },
    australia: {
      total: 0,
      group_of_eight: 0
    },
    germany: {
      total: 0,
      tu9: 0,
      u15: 0
    },
    netherlands: {
      total: 0,
      research: 0
    },
    japan: {
      total: 0
    },
    france: {
      total: 0
    },
    italy: {
      total: 0
    }
  };

  let isLoading = true;
  let hasError = false;
  let errorMessage = "";

  onMount(async () => {
    try {
      // Get UK statistics
      const ukStats = ukUniversityDataManager.getUKStats();
      statistics.uk.total = ukStats.total_universities;
      statistics.uk.ancient = ukStats.ancient_universities;
      statistics.uk.russell = ukStats.russell_group_estimate;

      // Get German statistics
      const germanStats = germanUniversityManager.getGermanStats();
      statistics.germany.total = germanStats.total_universities;
      statistics.germany.tu9 = germanStats.tu9_universities;
      statistics.germany.u15 = germanStats.u15_universities;

      // Get Dutch statistics
      const dutchStats = dutchUniversityManager.getDutchStats();
      statistics.netherlands.total = dutchStats.total_universities;
      statistics.netherlands.research = dutchStats.research_universities;

      // US universities (from server data)
      statistics.us.total = data.usStats.total_universities;
      statistics.us.ivyLeague = data.usStats.ivyLeague;

      // Australian universities
      const auStats = (australianUniversityManager as any).getAustralianStats?.() || { total_universities: 0, group_of_eight_universities: 0 };
      statistics.australia.total = auStats.total_universities;
      statistics.australia.group_of_eight = auStats.group_of_eight_universities;

      // Canadian universities
      const caStats = (canadianUniversityManager as any).getCanadianStats?.() || { total_universities: 0, u15_universities: 0 };
      statistics.canada.total = caStats.total_universities;
      statistics.canada.u15 = caStats.u15_universities;

      // Japanese universities
      const jpStats = (japaneseUniversityManager as any).getJapaneseStats?.() || { total_universities: 0 };
      statistics.japan.total = jpStats.total_universities;

      // French universities
      const frStats = (frenchUniversityManager as any).getFrenchStats?.() || { total_universities: 0 };
      statistics.france.total = frStats.total_universities;

      // Italian universities
      const itStats = (italianUniversityManager as any).getItalianStats?.() || { total_universities: 0 };
      statistics.italy.total = itStats.total_universities;

      // Calculate total
      statistics.total = 
        statistics.uk.total + 
        statistics.us.total + 
        statistics.canada.total + 
        statistics.australia.total + 
        statistics.germany.total + 
        statistics.netherlands.total +
        statistics.japan.total +
        statistics.france.total +
        statistics.italy.total;

      isLoading = false;
    } catch (error) {
      console.error("Error loading statistics:", error);
      hasError = true;
      errorMessage = (error as Error).message || "Unknown error occurred";
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>University Statistics | University Matcher</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8 text-center">University Statistics Dashboard</h1>

  {#if isLoading}
    <div class="flex justify-center items-center h-64">
      <div class="loader"></div>
    </div>
  {:else if hasError}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
      <p>Error loading statistics: {errorMessage}</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Total Universities -->
      <div class="bg-blue-100 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4 text-blue-800">Total Universities</h2>
        <p class="text-4xl font-bold text-blue-900">{statistics.total}</p>
        <p class="text-sm text-blue-700 mt-2">From all countries in database</p>
      </div>

      <!-- United Kingdom -->
      <div class="bg-red-50 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4 text-red-800">United Kingdom</h2>
        <p class="text-4xl font-bold text-red-900">{statistics.uk.total}</p>
        <div class="mt-2 space-y-1">
          <p class="text-sm text-red-700">Ancient Universities: {statistics.uk.ancient}</p>
          <p class="text-sm text-red-700">Russell Group (est): {statistics.uk.russell}</p>
        </div>
      </div>

      <!-- United States -->
      <div class="bg-blue-50 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4 text-blue-800">United States</h2>
        <p class="text-4xl font-bold text-blue-900">{statistics.us.total}</p>
        <div class="mt-2 space-y-1">
          <p class="text-sm text-blue-700">Ivy League: {statistics.us.ivyLeague}</p>
        </div>
      </div>

      <!-- Germany -->
      <div class="bg-yellow-50 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4 text-yellow-800">Germany</h2>
        <p class="text-4xl font-bold text-yellow-900">{statistics.germany.total}</p>
        <div class="mt-2 space-y-1">
          <p class="text-sm text-yellow-700">TU9 Technical Universities: {statistics.germany.tu9}</p>
          <p class="text-sm text-yellow-700">U15 Research Universities: {statistics.germany.u15}</p>
        </div>
      </div>

      <!-- Netherlands -->
      <div class="bg-orange-50 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4 text-orange-800">Netherlands</h2>
        <p class="text-4xl font-bold text-orange-900">{statistics.netherlands.total}</p>
        <div class="mt-2 space-y-1">
          <p class="text-sm text-orange-700">Research Universities: {statistics.netherlands.research}</p>
        </div>
      </div>

      <!-- Canada -->
      <div class="bg-red-50 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4 text-red-800">Canada</h2>
        <p class="text-4xl font-bold text-red-900">{statistics.canada.total}</p>
        <div class="mt-2 space-y-1">
          <p class="text-sm text-red-700">U15 Research Group: {statistics.canada.u15}</p>
        </div>
      </div>

      <!-- Australia -->
      <div class="bg-green-50 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4 text-green-800">Australia</h2>
        <p class="text-4xl font-bold text-green-900">{statistics.australia.total}</p>
        <div class="mt-2 space-y-1">
          <p class="text-sm text-green-700">Group of Eight: {statistics.australia.group_of_eight}</p>
        </div>
      </div>

      <!-- Japan -->
      <div class="bg-purple-50 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4 text-purple-800">Japan</h2>
        <p class="text-4xl font-bold text-purple-900">{statistics.japan.total}</p>
      </div>

      <!-- France -->
      <div class="bg-indigo-50 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4 text-indigo-800">France</h2>
        <p class="text-4xl font-bold text-indigo-900">{statistics.france.total}</p>
      </div>

      <!-- Italy -->
      <div class="bg-teal-50 rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4 text-teal-800">Italy</h2>
        <p class="text-4xl font-bold text-teal-900">{statistics.italy.total}</p>
      </div>
    </div>

    <div class="mt-8">
      <h2 class="text-2xl font-bold mb-4">University Database Coverage</h2>
      <p class="mb-2">Our database includes universities from 9 countries around the world, with comprehensive information about each institution.</p>
      <p class="mb-2">This data is regularly updated to ensure accuracy and completeness.</p>
    </div>

    <div class="mt-8">
      <h3 class="text-xl font-bold mb-4">Note on Internal Linking</h3>
      <p class="mb-2">
        All universities have internal profile pages that can be accessed by clicking on their names in the listings. 
        If you encounter any issues with internal links for specific universities, please report them.
      </p>
    </div>
  {/if}
</div>

<style>
  .loader {
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style> 