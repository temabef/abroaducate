<script lang="ts">
  import { onMount } from 'svelte';
  import { extractAcademicProfile, hasAcademicData } from '$lib/academicAnalyzer/dataExtractor';
  import { analyzeAcademicProfile } from '$lib/academicAnalyzer/analysisEngine';

  // State variables
  let hasData = false;
  let academicProfile: any = null;
  let analysis: any = null;
  let loading = true;
  let activeTab = 'overview';

  // UI state
  let showAnalysis = false;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'strengths', label: 'Strengths', icon: '💪' },
    { id: 'areas', label: 'Growth Areas', icon: '📈' },
    { id: 'trends', label: 'Trends', icon: '📉' },
    { id: 'recommendations', label: 'Recommendations', icon: '💡' },
    { id: 'competitiveness', label: 'Competitiveness', icon: '🎯' }
  ];

  onMount(() => {
    loadAcademicData();
  });

  function loadAcademicData() {
    loading = true;
    
    // Check if data exists
    hasData = hasAcademicData();
    
    if (hasData) {
      // Extract and analyze academic profile
      academicProfile = extractAcademicProfile();
      
      if (academicProfile.hasData) {
        analysis = analyzeAcademicProfile(academicProfile);
        showAnalysis = true;
      }
    }
    
    loading = false;
  }

  function switchTab(tabId: string) {
    activeTab = tabId;
  }

  function getGPAColor(gpa: number): string {
    if (gpa >= 3.7) return 'text-green-600';
    if (gpa >= 3.3) return 'text-blue-600';
    if (gpa >= 3.0) return 'text-yellow-600';
    if (gpa >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  }

  function getGPABgColor(gpa: number): string {
    if (gpa >= 3.7) return 'bg-green-100 border-green-200';
    if (gpa >= 3.3) return 'bg-blue-100 border-blue-200';
    if (gpa >= 3.0) return 'bg-yellow-100 border-yellow-200';
    if (gpa >= 2.5) return 'bg-orange-100 border-orange-200';
    return 'bg-red-100 border-red-200';
  }

  function formatPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  $: gradeDistributionEntries = Object.entries(
    (academicProfile?.gradeDistribution?.byGPARange ?? {}) as Record<string, number>
  );
  $: subjectEntries = Object.entries(
    (academicProfile?.coursesBySubject ?? {}) as Record<string, { courseCount: number; gpa: string; totalCredits?: number }>
  );
</script>

<div class="max-w-7xl mx-auto p-6">
  <!-- Header -->
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold text-gray-900 mb-2">
      🎓 Academic Profile Analyzer
    </h1>
    <p class="text-xl text-gray-600 max-w-3xl mx-auto">
      Get comprehensive insights into your academic performance, identify strengths and growth areas, 
      and receive personalized recommendations for your study abroad journey.
    </p>
  </div>

  {#if loading}
    <!-- Loading State -->
    <div class="flex justify-center items-center min-h-64">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Analyzing your academic profile...</p>
      </div>
    </div>
  {:else if !hasData}
    <!-- No Data State -->
    <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 text-center">
      <div class="max-w-2xl mx-auto">
        <div class="text-6xl mb-6">📚</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">
          No Academic Data Found
        </h2>
        <p class="text-gray-600 mb-6 text-lg">
          To use the Academic Profile Analyzer, you need to first convert your transcript using our GPA Converter.
        </p>
        <div class="bg-white rounded-xl p-6 mb-6 text-left">
          <h3 class="font-semibold text-gray-900 mb-3">📋 Quick Steps:</h3>
          <ol class="list-decimal list-inside space-y-2 text-gray-700">
            <li>Go to the <strong>GPA Converter</strong> tool</li>
            <li>Upload your transcript or add courses manually</li>
            <li>Complete the conversion process</li>
            <li>Return here for comprehensive analysis</li>
          </ol>
        </div>
        <a 
          href="/gpa-converter" 
          class="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Convert Transcript First
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>
    </div>
  {:else if analysis && analysis.hasAnalysis}
    <!-- Main Analysis Interface -->
    <div class="space-y-6">
      <!-- Quick Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div class="text-3xl font-bold {getGPAColor(academicProfile.totalGPA)} mb-2">
            {academicProfile.totalGPA.toFixed(2)}
          </div>
          <div class="text-gray-600 text-sm">Overall GPA</div>
          <div class="text-xs text-gray-500 mt-1">{analysis.overall.gpaCategory}</div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div class="text-3xl font-bold text-gray-900 mb-2">
            {academicProfile.totalCourses}
          </div>
          <div class="text-gray-600 text-sm">Total Courses</div>
          <div class="text-xs text-gray-500 mt-1">{academicProfile.creditHours.total} Credits</div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div class="text-3xl font-bold text-gray-900 mb-2">
            {analysis.strengths.length}
          </div>
          <div class="text-gray-600 text-sm">Key Strengths</div>
          <div class="text-xs text-green-600 mt-1">Identified</div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border p-6 text-center">
          <div class="text-3xl font-bold text-gray-900 mb-2">
            {analysis.competitiveness.percentile}th
          </div>
          <div class="text-gray-600 text-sm">Percentile</div>
          <div class="text-xs text-blue-600 mt-1">{analysis.competitiveness.level}</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {#each tabs as tab}
              <button
                on:click={() => switchTab(tab.id)}
                class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }"
              >
                <span class="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            {/each}
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          {#if activeTab === 'overview'}
            <!-- Overview Tab -->
            <div class="space-y-6">
              <!-- Student Information -->
              {#if academicProfile.studentInfo.studentName}
                <div class="bg-gray-50 rounded-lg p-4">
                  <h3 class="font-semibold text-gray-900 mb-2">📋 Academic Profile</h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span class="font-medium text-gray-700">Student:</span>
                      <span class="text-gray-600 ml-2">{academicProfile.studentInfo.studentName}</span>
                    </div>
                    {#if academicProfile.studentInfo.universityName}
                      <div>
                        <span class="font-medium text-gray-700">University:</span>
                        <span class="text-gray-600 ml-2">{academicProfile.studentInfo.universityName}</span>
                      </div>
                    {/if}
                    {#if academicProfile.studentInfo.programOfStudy}
                      <div>
                        <span class="font-medium text-gray-700">Program:</span>
                        <span class="text-gray-600 ml-2">{academicProfile.studentInfo.programOfStudy}</span>
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}

              <!-- Performance Overview -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Overall Performance -->
                <div class="bg-white border rounded-lg p-6">
                  <h3 class="font-semibold text-gray-900 mb-4">🎯 Overall Performance</h3>
                  <div class="{getGPABgColor(academicProfile.totalGPA)} rounded-lg p-4 mb-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-2xl font-bold {getGPAColor(academicProfile.totalGPA)}">
                          {academicProfile.totalGPA.toFixed(2)} GPA
                        </div>
                        <div class="text-sm text-gray-600">{analysis.overall.gpaDescription}</div>
                      </div>
                      <div class="text-3xl">
                        {#if academicProfile.totalGPA >= 3.7}🏆
                        {:else if academicProfile.totalGPA >= 3.3}⭐
                        {:else if academicProfile.totalGPA >= 3.0}👍
                        {:else}📈{/if}
                      </div>
                    </div>
                  </div>
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-gray-600">Credit Load:</span>
                      <span class="font-medium">{analysis.overall.creditLoadAssessment}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Total Credits:</span>
                      <span class="font-medium">{academicProfile.creditHours.total}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600">Avg Credits/Course:</span>
                      <span class="font-medium">{academicProfile.creditHours.average}</span>
                    </div>
                  </div>
                </div>

                <!-- Grade Distribution -->
                <div class="bg-white border rounded-lg p-6">
                  <h3 class="font-semibold text-gray-900 mb-4">📊 Grade Distribution</h3>
                  <div class="space-y-3">
                    {#each gradeDistributionEntries as [range, count]}
                      {@const percentage = formatPercentage(count, academicProfile.totalCourses)}
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600">{range}</span>
                        <div class="flex items-center space-x-2">
                          <div class="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              class="h-2 rounded-full {
                                range.includes('A') ? 'bg-green-500' :
                                range.includes('B') ? 'bg-blue-500' :
                                range.includes('C') ? 'bg-yellow-500' :
                                range.includes('D') ? 'bg-orange-500' : 'bg-red-500'
                              }" 
                              style="width: {percentage}%"
                            ></div>
                          </div>
                          <span class="text-sm font-medium w-12 text-right">{percentage}%</span>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>

              <!-- Subject Performance -->
              <div class="bg-white border rounded-lg p-6">
                <h3 class="font-semibold text-gray-900 mb-4">📚 Subject Area Performance</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {#each subjectEntries as [subject, data]}
                    {#if data.courseCount > 0}
                      <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                          <h4 class="font-medium text-gray-900 text-sm">{subject}</h4>
                          <span class="text-xs text-gray-500">{data.courseCount} courses</span>
                        </div>
                        <div class="flex items-center justify-between">
                          <span class="text-lg font-bold {getGPAColor(parseFloat(data.gpa))}">{data.gpa}</span>
                          <span class="text-xs text-gray-500">{data.totalCredits} credits</span>
                        </div>
                      </div>
                    {/if}
                  {/each}
                </div>
              </div>
            </div>

          {:else if activeTab === 'strengths'}
            <!-- Strengths Tab -->
            <div class="space-y-4">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">💪 Your Academic Strengths</h3>
              {#if analysis.strengths.length > 0}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {#each analysis.strengths as strength}
                    <div class="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div class="flex items-start space-x-3">
                        <div class="text-2xl">{strength.icon}</div>
                        <div class="flex-1">
                          <h4 class="font-semibold text-green-900 mb-1">{strength.title}</h4>
                          <p class="text-green-700 text-sm mb-2">{strength.description}</p>
                          <div class="flex items-center space-x-2">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {strength.category}
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
                              strength.impact === 'high' ? 'bg-red-100 text-red-800' :
                              strength.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }">
                              {strength.impact} impact
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-center py-8">
                  <div class="text-4xl mb-4">🌱</div>
                  <p class="text-gray-600">Keep working hard! Strengths will be identified as your academic profile develops.</p>
                </div>
              {/if}
            </div>

          {:else if activeTab === 'areas'}
            <!-- Growth Areas Tab -->
            <div class="space-y-4">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">📈 Areas for Growth</h3>
              {#if analysis.weaknesses.length > 0}
                <div class="space-y-4">
                  {#each analysis.weaknesses as weakness}
                    <div class="bg-orange-50 border border-orange-200 rounded-lg p-6">
                      <div class="flex items-start space-x-3">
                        <div class="text-2xl">{weakness.icon}</div>
                        <div class="flex-1">
                          <div class="flex items-center justify-between mb-2">
                            <h4 class="font-semibold text-orange-900">{weakness.title}</h4>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
                              weakness.severity === 'high' ? 'bg-red-100 text-red-800' :
                              weakness.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }">
                              {weakness.severity} priority
                            </span>
                          </div>
                          <p class="text-orange-700 text-sm mb-2">{weakness.description}</p>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {weakness.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-center py-8">
                  <div class="text-4xl mb-4">🎉</div>
                  <p class="text-gray-600">Great job! No significant areas for improvement identified.</p>
                </div>
              {/if}
            </div>

          {:else if activeTab === 'trends'}
            <!-- Trends Tab -->
            <div class="space-y-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">📉 Academic Trends</h3>
              {#if analysis.trends.hasEnoughData}
                <div class="bg-white border rounded-lg p-6">
                  <div class="flex items-center justify-between mb-4">
                    <h4 class="font-semibold text-gray-900">GPA Trend Analysis</h4>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {
                      analysis.trends.trendDirection === 'improving' ? 'bg-green-100 text-green-800' :
                      analysis.trends.trendDirection === 'declining' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }">
                      {analysis.trends.trendDirection === 'improving' ? '📈 Improving' :
                       analysis.trends.trendDirection === 'declining' ? '📉 Declining' :
                       '➡️ Stable'}
                    </span>
                  </div>
                  <p class="text-gray-600 mb-4">{analysis.trends.trendDescription}</p>
                  
                  <!-- Yearly GPA Chart -->
                  <div class="space-y-3">
                    {#each analysis.trends.gpaTrend as yearData}
                      <div class="flex items-center space-x-4">
                        <div class="w-20 text-sm font-medium text-gray-700">{yearData.year}</div>
                        <div class="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div 
                            class="h-6 rounded-full {getGPAColor(yearData.gpa).replace('text-', 'bg-').replace('-600', '-500')} flex items-center justify-center text-white text-sm font-medium"
                            style="width: {(yearData.gpa / 4.0) * 100}%"
                          >
                            {yearData.gpa.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                  
                  <div class="mt-4 text-sm text-gray-600">
                    <strong>Change:</strong> {analysis.trends.gpaChange > 0 ? '+' : ''}{analysis.trends.gpaChange} points over {analysis.trends.yearsAnalyzed} years
                  </div>
                </div>
              {:else}
                <div class="text-center py-8">
                  <div class="text-4xl mb-4">📊</div>
                  <p class="text-gray-600">{analysis.trends.message}</p>
                </div>
              {/if}
            </div>

          {:else if activeTab === 'recommendations'}
            <!-- Recommendations Tab -->
            <div class="space-y-4">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">💡 Personalized Recommendations</h3>
              {#if analysis.recommendations.length > 0}
                <div class="space-y-6">
                  {#each analysis.recommendations as rec}
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div class="flex items-start space-x-3">
                        <div class="text-2xl">💡</div>
                        <div class="flex-1">
                          <div class="flex items-center justify-between mb-2">
                            <h4 class="font-semibold text-blue-900">{rec.title}</h4>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }">
                              {rec.priority} priority
                            </span>
                          </div>
                          <p class="text-blue-700 text-sm mb-3">{rec.description}</p>
                          <div class="space-y-2">
                            <h5 class="font-medium text-blue-900 text-sm">Action Steps:</h5>
                            <ul class="space-y-1">
                              {#each rec.actionItems as action}
                                <li class="flex items-start space-x-2 text-sm text-blue-700">
                                  <span class="text-blue-500 mt-1">•</span>
                                  <span>{action}</span>
                                </li>
                              {/each}
                            </ul>
                          </div>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-3">
                            {rec.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="text-center py-8">
                  <div class="text-4xl mb-4">🎯</div>
                  <p class="text-gray-600">Excellent! Your academic profile shows strong performance across all areas.</p>
                </div>
              {/if}
            </div>

          {:else if activeTab === 'competitiveness'}
            <!-- Competitiveness Tab -->
            <div class="space-y-6">
              <h3 class="text-xl font-semibold text-gray-900 mb-4">🎯 Admissions Competitiveness</h3>
              
              <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6">
                <div class="text-center mb-6">
                  <h4 class="text-2xl font-bold text-gray-900 mb-2">{analysis.competitiveness.level}</h4>
                  <p class="text-gray-600">{analysis.competitiveness.description}</p>
                  <div class="mt-4 flex items-center justify-center space-x-4">
                    <div class="text-center">
                      <div class="text-3xl font-bold text-blue-600">{analysis.competitiveness.gpaScore.toFixed(2)}</div>
                      <div class="text-sm text-gray-600">Your GPA</div>
                    </div>
                    <div class="text-center">
                      <div class="text-3xl font-bold text-green-600">{analysis.competitiveness.percentile}th</div>
                      <div class="text-sm text-gray-600">Percentile</div>
                    </div>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="bg-white rounded-lg p-4">
                    <h5 class="font-semibold text-gray-900 mb-2">🎓 Opportunities</h5>
                    <ul class="space-y-2">
                      {#each analysis.competitiveness.opportunities as opportunity}
                        <li class="flex items-start space-x-2 text-sm">
                          <span class="text-green-500 mt-1">✓</span>
                          <span class="text-gray-700">{opportunity}</span>
                        </li>
                      {/each}
                    </ul>
                  </div>
                  
                  {#if analysis.insights.length > 0}
                    <div class="bg-white rounded-lg p-4 md:col-span-2">
                      <h5 class="font-semibold text-gray-900 mb-2">🔍 Key Insights</h5>
                      <div class="space-y-2">
                        {#each analysis.insights as insight}
                          <div class="flex items-start space-x-2">
                            <span class="text-blue-500 mt-1">
                              {#if insight.type === 'strength'}💪
                              {:else if insight.type === 'achievement'}🏆
                              {:else}💡{/if}
                            </span>
                            <div>
                              <div class="font-medium text-gray-900 text-sm">{insight.title}</div>
                              <div class="text-gray-600 text-sm">{insight.description}</div>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
              
              {#if analysis.riskFactors.length > 0}
                <div class="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h4 class="font-semibold text-red-900 mb-4">⚠️ Risk Factors to Address</h4>
                  <div class="space-y-3">
                    {#each analysis.riskFactors as risk}
                      <div class="flex items-start space-x-3">
                        <span class="text-red-500 mt-1">⚠️</span>
                        <div>
                          <div class="font-medium text-red-900">{risk.type}</div>
                          <div class="text-red-700 text-sm">{risk.description}</div>
                        </div>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
                          risk.severity === 'high' ? 'bg-red-100 text-red-800' :
                          risk.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }">
                          {risk.severity}
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="bg-white rounded-xl shadow-sm border p-6">
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            on:click={loadAcademicData}
            class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh Analysis
          </button>
          <a 
            href="/gpa-converter" 
            class="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Update Transcript
          </a>
        </div>
      </div>
    </div>
  {:else}
    <!-- Error State -->
    <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div class="text-4xl mb-4">❌</div>
      <h2 class="text-xl font-bold text-red-900 mb-2">Analysis Error</h2>
      <p class="text-red-700 mb-4">There was an issue analyzing your academic profile.</p>
      <button
        on:click={loadAcademicData}
        class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  {/if}
</div> 
