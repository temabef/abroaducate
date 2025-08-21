<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, afterUpdate } from 'svelte';
  import { goto } from '$app/navigation';
  import type { EnhancedUniversity } from '$lib/database/university-integration';
  
  export let data: { 
    university: EnhancedUniversity | null; 
    error?: string;
    isUkUniversity?: boolean;
    suggestedName?: string;
    redirect?: string;
    status?: number;
  };
  
  let university = data.university;
  let error = data.error;
  let loading = false;
  
  // Handle redirects
  afterUpdate(() => {
    if (data.redirect) {
      goto(data.redirect);
    }
  });
  
  // Extract clean university name from slug
  function getCleanUniversityName(slug: string): string {
    // Special cases for UK universities
    const ukSpecialCases: {[key: string]: string} = {
      'bishopg.ac.uk': 'Bishop Grosseteste University',
      'www.bishopg.ac.uk': 'Bishop Grosseteste University',
      'marjon.ac.uk': 'Plymouth Marjon University',
      'www.marjon.ac.uk': 'Plymouth Marjon University',
      'stmarys.ac.uk': 'St Mary\'s University, Twickenham',
      'www.stmarys.ac.uk': 'St Mary\'s University, Twickenham',
      'newman.ac.uk': 'Newman University',
      'www.newman.ac.uk': 'Newman University',
      'roehampton.ac.uk': 'University of Roehampton',
      'www.roehampton.ac.uk': 'University of Roehampton',
      'beds.ac.uk': 'University of Bedfordshire',
      'www.beds.ac.uk': 'University of Bedfordshire',
      'falmouth.ac.uk': 'Falmouth University',
      'www.falmouth.ac.uk': 'Falmouth University'
    };
    
    // Check special cases first
    if (ukSpecialCases[slug]) {
      return ukSpecialCases[slug];
    }
    
    // Remove www., .edu, .ac.uk, etc. and clean up
    return slug
      .replace(/^www\./, '')
      .replace(/\.(edu|ac\.uk|ca|nl|de)$/, '')
      .replace(/[-_]/g, ' ')
      .split('.')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }
  
  function getCountryFlag(country: string): string {
    const flags: { [key: string]: string } = {
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'Australia': '🇦🇺',
      'Canada': '🇨🇦',
      'Germany': '🇩🇪',
      'Netherlands': '🇳🇱'
    };
    return flags[country] || '🌍';
  }
  
  function getProgramColor(score: number): string {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  }
  
  function getAcceptanceRateColor(rate: number): string {
    if (rate <= 20) return 'text-red-600 bg-red-50';
    if (rate <= 40) return 'text-orange-600 bg-orange-50';
    if (rate <= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  }
  
  function getAcceptanceRateLabel(rate: number): string {
    if (rate <= 20) return 'Highly Selective';
    if (rate <= 40) return 'Selective';
    if (rate <= 60) return 'Moderately Selective';
    return 'Less Selective';
  }
</script>

<svelte:head>
  {#if university}
    <title>{university.name} - University Profile | Abroaducate</title>
    <meta name="description" content="Complete profile for {university.name} including rankings, programs, costs, admission requirements, and application guidance." />
    <!-- JSON-LD: College/University + Breadcrumb for better SEO snippets -->
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollegeOrUniversity",
        "name": university.name,
        ...(university.website_url ? { "url": university.website_url } : {}),
        "address": {
          "@type": "PostalAddress",
          ...(university.city ? { "addressLocality": university.city } : {}),
          ...(university.state ? { "addressRegion": university.state } : {}),
          "addressCountry": university.country || "United States"
        },
        ...(university.acceptance_rate != null ? { "acceptanceRate": university.acceptance_rate / 100 } : {}),
        ...(university.student_size ? { "numberOfStudents": university.student_size } : {}),
        ...(university.ownership_type ? { "additionalType": university.ownership_type } : {}),
        ...(university.programs ? { "knowsAbout": Object.keys(university.programs) } : {}),
        "offers": [
          ...(university.in_state_tuition ? [{
            "@type": "Offer",
            "name": "In-state Tuition (Undergraduate)",
            "price": university.in_state_tuition,
            "priceCurrency": "USD"
          }] : []),
          ...(university.out_of_state_tuition ? [{
            "@type": "Offer",
            "name": "Out-of-state Tuition (Undergraduate)",
            "price": university.out_of_state_tuition,
            "priceCurrency": "USD"
          }] : []),
          ...(university.cost ? [{
            "@type": "Offer",
            "name": "Estimated Total Cost of Attendance (Undergraduate)",
            "price": university.cost,
            "priceCurrency": "USD"
          }] : [])
        ]
      })}
    </script>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Universities",
            "item": "/universities"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": university.name
          }
        ]
      })}
    </script>
  {:else if data.redirect}
    <title>Redirecting...</title>
  {:else}
    <title>University Profile | Abroaducate</title>
  {/if}
</svelte:head>

<div class="min-h-screen bg-gray-50">
  {#if loading || data.redirect}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading university profile...</p>
      </div>
    </div>
  {:else if error}
    <div class="max-w-4xl mx-auto px-4 py-20">
      <div class="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div class="text-6xl mb-4">🏫</div>
        <h1 class="text-2xl font-bold text-red-800 mb-2">University Not Found</h1>
        <p class="text-red-600 mb-6">{error}</p>
        <div class="space-y-2 text-sm text-red-700">
          <p><strong>Requested:</strong> {$page.params.slug}</p>
          <p><strong>Suggested Name:</strong> {data.suggestedName || getCleanUniversityName($page.params.slug)}</p>
        </div>
        
        {#if data.isUkUniversity || $page.params.slug.includes('.ac.uk')}
          <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
            <h3 class="font-medium text-yellow-800 mb-2">UK University Website Detected</h3>
            <p class="text-yellow-700 mb-2">We've detected a UK university website. If you're looking for a specific UK university, try these options:</p>
            <ul class="list-disc list-inside text-yellow-700 space-y-1">
              <li>Try searching for the university by name instead of website</li>
              <li>Check our <a href="/universities?source=uk" class="text-blue-600 underline">UK Universities Database</a></li>
              <li>If this is a newer or specialized institution, we may be updating our database</li>
            </ul>
          </div>
        {/if}
        
        <div class="mt-6 space-y-4">
          <a href="/universities" class="btn btn-primary">
            Browse All Universities
          </a>
          <div class="text-sm text-gray-600">
            <p>Can't find your university? <a href="/contact" class="text-blue-600 underline">Contact us</a> and we'll add it.</p>
          </div>
        </div>
      </div>
    </div>
  {:else if university}
    <div class="max-w-6xl mx-auto px-4 py-12">
      
      <!-- Header Section -->
      <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div class="flex items-start justify-between mb-6">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-3xl">{getCountryFlag(university.country)}</span>
              <h1 class="text-3xl font-bold text-gray-900">{university.name}</h1>
            </div>
            <div class="flex items-center gap-4 text-gray-600 mb-4">
              <span>📍 {university.city}, {university.state || university.country}</span>
              {#if university.global_ranking}
                <span>🏆 Global Rank #{university.global_ranking}</span>
              {/if}
              {#if university.national_ranking}
                <span>🥇 National Rank #{university.national_ranking}</span>
              {/if}
            </div>
            
            <!-- Quick Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              {#if university.acceptance_rate}
                <div class="text-center p-3 rounded-lg {getAcceptanceRateColor(university.acceptance_rate)}">
                  <div class="text-2xl font-bold">{university.acceptance_rate}%</div>
                  <div class="text-sm">{getAcceptanceRateLabel(university.acceptance_rate)}</div>
                </div>
              {/if}
              
              <div class="text-center p-3 bg-blue-50 rounded-lg">
                <div class="text-2xl font-bold">{formatCurrency(university.cost)}</div>
                <div class="text-sm text-blue-600">Total Cost</div>
              </div>
              
              {#if university.student_size}
                <div class="text-center p-3 bg-purple-50 rounded-lg">
                  <div class="text-2xl font-bold">{university.student_size.toLocaleString()}</div>
                  <div class="text-sm text-purple-600">Students</div>
                </div>
              {/if}
              
              {#if university.scholarship_percentage}
                <div class="text-center p-3 bg-green-50 rounded-lg">
                  <div class="text-2xl font-bold">{university.scholarship_percentage}%</div>
                  <div class="text-sm text-green-600">Get Scholarships</div>
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex flex-col gap-3 ml-6">
            {#if university.website_url}
              <a 
                href={university.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                class="btn btn-primary"
              >
                🌐 Visit Official Website
              </a>
            {/if}
            <button class="btn btn-outline btn-success">
              📝 Start Application
            </button>
            <button class="btn btn-outline btn-info">
              💰 Find Scholarships
            </button>
          </div>
        </div>
      </div>
      
      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column - Main Info -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- Programs & Rankings -->
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
              🎓 Academic Programs & Rankings
            </h2>
            
            {#if university.programs && Object.keys(university.programs).length > 0}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each Object.entries(university.programs).sort(([,a], [,b]) => b - a) as [program, score]}
                  <div class="flex items-center justify-between p-3 border rounded-lg {getProgramColor(score)}">
                    <span class="font-medium capitalize">{program.replace(/-/g, ' ')}</span>
                    <div class="flex items-center gap-2">
                      <span class="font-bold">{score}/100</span>
                      {#if score >= 90}
                        <span class="text-green-600">⭐</span>
                      {:else if score >= 80}
                        <span class="text-blue-600">🔥</span>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-gray-600">Program rankings will be available soon.</p>
            {/if}
          </div>
          
          <!-- Strengths & Highlights -->
          {#if university.strengths && university.strengths.length > 0}
            <div class="bg-white rounded-lg shadow-lg p-6">
              <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
                💪 University Strengths
              </h2>
              <div class="flex flex-wrap gap-3">
                {#each university.strengths as strength}
                  <span class="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {strength.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                {/each}
              </div>
            </div>
          {/if}
          
          <!-- Admission Requirements -->
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
              📋 Admission Requirements
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="font-semibold text-gray-800 mb-3">Academic Requirements</h3>
                <ul class="space-y-2 text-gray-600">
                  {#if university.requirements.min_gpa}
                    <li class="flex items-center gap-2">
                      <span class="text-green-500">✓</span>
                      Minimum GPA: {university.requirements.min_gpa}
                    </li>
                  {/if}
                  {#if university.avg_gpa}
                    <li class="flex items-center gap-2">
                      <span class="text-blue-500">📊</span>
                      Average GPA: {university.avg_gpa}
                    </li>
                  {/if}
                  {#if university.avg_sat}
                    <li class="flex items-center gap-2">
                      <span class="text-blue-500">📊</span>
                      Average SAT: {university.avg_sat}
                    </li>
                  {/if}
                  {#if university.avg_act}
                    <li class="flex items-center gap-2">
                      <span class="text-blue-500">📊</span>
                      Average ACT: {university.avg_act}
                    </li>
                  {/if}
                </ul>
              </div>
              
              <div>
                <h3 class="font-semibold text-gray-800 mb-3">Additional Requirements</h3>
                <ul class="space-y-2 text-gray-600">
                  {#if university.requirements.english_test}
                    <li class="flex items-center gap-2">
                      <span class="text-orange-500">📝</span>
                      English Proficiency Test Required
                    </li>
                  {/if}
                  {#if university.requirements.research_experience}
                    <li class="flex items-center gap-2">
                      <span class="text-purple-500">🔬</span>
                      Research Experience: {university.requirements.research_experience}
                    </li>
                  {/if}
                  <li class="flex items-center gap-2">
                    <span class="text-blue-500">📄</span>
                    Personal Statement Required
                  </li>
                  <li class="flex items-center gap-2">
                    <span class="text-green-500">📝</span>
                    Letters of Recommendation
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right Column - Quick Info -->
        <div class="space-y-6">
          
          <!-- Cost Breakdown -->
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
              💰 Cost Breakdown
            </h3>
            
            <div class="space-y-3">
              {#if university.in_state_tuition && university.out_of_state_tuition}
                <div class="flex justify-between">
                  <span class="text-gray-600">In-State Tuition:</span>
                  <span class="font-semibold">{formatCurrency(university.in_state_tuition)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Out-of-State Tuition:</span>
                  <span class="font-semibold">{formatCurrency(university.out_of_state_tuition)}</span>
                </div>
              {:else}
                <div class="flex justify-between">
                  <span class="text-gray-600">Annual Tuition:</span>
                  <span class="font-semibold">{formatCurrency(university.cost - (university.living_cost || 0))}</span>
                </div>
              {/if}
              
              {#if university.living_cost}
                <div class="flex justify-between">
                  <span class="text-gray-600">Living Expenses:</span>
                  <span class="font-semibold">{formatCurrency(university.living_cost)}</span>
                </div>
              {/if}
              
              <hr class="my-3">
              <div class="flex justify-between text-lg font-bold">
                <span>Total Annual Cost:</span>
                <span class="text-blue-600">{formatCurrency(university.cost)}</span>
              </div>
              <div class="text-xs text-gray-500 mt-2">
                Undergraduate data; graduate costs vary by program.
              </div>
              
              {#if university.median_debt}
                <div class="text-sm text-gray-500 mt-2">
                  Average Graduate Debt: {formatCurrency(university.median_debt)}
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Quick Facts -->
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
              ⚡ Quick Facts
            </h3>
            
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Location Type:</span>
                <span class="font-medium">{university.location_type}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600">Class Size:</span>
                <span class="font-medium">{university.class_size}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-gray-600">Research:</span>
                <span class="font-medium">{university.research_opportunities}</span>
              </div>
              
              {#if university.ownership_type}
                <div class="flex justify-between">
                  <span class="text-gray-600">Type:</span>
                  <span class="font-medium capitalize">{university.ownership_type.replace('_', ' ')}</span>
                </div>
              {/if}
              
              {#if university.graduate_earnings}
                <div class="flex justify-between">
                  <span class="text-gray-600">Avg. Graduate Salary:</span>
                  <span class="font-medium text-green-600">{formatCurrency(university.graduate_earnings)}</span>
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Application Help -->
          <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <h3 class="text-xl font-bold mb-4 text-blue-900">🚀 Need Application Help?</h3>
            <p class="text-blue-800 text-sm mb-4">
              Get personalized guidance for your {university.name} application with our AI-powered tools.
            </p>
            
            <div class="space-y-2">
              <a href="/personal-statements" class="block w-full btn btn-sm btn-primary">
                📝 Personal Statement Help
              </a>
              <a href="/scholarships" class="block w-full btn btn-sm btn-outline btn-success">
                💰 Find Scholarships
              </a>
              <a href="/gpa-converter" class="block w-full btn btn-sm btn-outline btn-info">
                📊 Convert Your GPA
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Data Source Info -->
      <div class="mt-8 text-center text-sm text-gray-500">
        <p>
          Data Source: {university.data_source} • 
          Last Updated: {new Date(university.last_updated).toLocaleDateString()}
        </p>
      </div>

      <!-- Call to Action Section -->
      <div class="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white">
        <h3 class="text-2xl font-bold mb-4">Ready to Apply to {university.name}?</h3>
        <p class="text-blue-100 mb-6">
          Use our AI-powered tools to create a compelling application that stands out from the competition.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/sop" class="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition duration-200">
            📝 Generate Statement of Purpose
          </a>
          <a href="/scholarships" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition duration-200">
            💰 Find Scholarships
          </a>
          <a href="/gpa-converter" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition duration-200">
            📊 Convert Your GPA
          </a>
        </div>
      </div>
    </div>
  {/if}
</div> 