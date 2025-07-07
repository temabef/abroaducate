<script lang="ts">
  interface WeekPlan { week: number; title: string; tasks: string[]; }

  const studyPlan: WeekPlan[] = [
    {
      week: 1,
      title: 'Foundation & Diagnostic',
      tasks: [
        'Take a diagnostic IELTS practice test (Reading & Listening)',
        'Review band descriptors and scoring criteria',
        'Set target score and schedule daily study blocks',
        'Learn IELTS question types (Reading)'
      ]
    },
    {
      week: 2,
      title: 'Reading & Listening Focus',
      tasks: [
        'Complete Reading practice set 1 (Passages 1–3)',
        'Complete Listening practice set 1 (Sections 1–4)',
        'Analyse mistakes & update vocab list',
        'Watch strategy video: Skimming & Scanning'
      ]
    },
    {
      week: 3,
      title: 'Writing Task 1 & Speaking Part 1',
      tasks: [
        'Study Writing Task 1 band-9 samples',
        'Write 3 Task 1 reports and self-review',
        'Record Speaking Part 1 answers (10 questions)',
        'Peer/self evaluate with rubric'
      ]
    },
    {
      week: 4,
      title: 'Writing Task 2, Full Mock & Review',
      tasks: [
        'Write 2 Task 2 essays under timed conditions',
        'Take full mock test (all 4 sections)',
        'Analyse performance & focus on weak areas',
        'Plan test-day logistics & relaxation techniques'
      ]
    }
  ];
</script>

<section class="pt-28 pb-16 bg-gray-50 min-h-screen">
  <div class="max-w-5xl mx-auto px-4">
    <h1 class="text-4xl font-extrabold text-gray-900 mb-4">Test Prep Centre</h1>
    <p class="text-lg text-gray-600 mb-8">
      Start with our <span class="font-semibold">1-Month IELTS Study Plan</span>. Track your
      weekly tasks, access practice sets, and monitor progress. More tests (TOEFL, GRE, GMAT) coming soon.
    </p>

    <!-- Study Plan -->
    <div class="space-y-6">
      {#each studyPlan as week}
        <details class="group bg-white border border-gray-200 rounded-lg shadow-sm">
          <summary class="flex items-center justify-between p-4 cursor-pointer select-none">
            <span class="text-xl font-semibold">Week {week.week}: {week.title}</span>
            <svg class="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </summary>
          <ul class="px-6 pb-4 list-disc space-y-2 text-gray-700">
            {#each week.tasks as task}
              <li>{task}</li>
            {/each}
          </ul>
        </details>
      {/each}
    </div>

    <!-- CTA Card -->
    <div class="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-8 flex flex-col lg:flex-row items-center lg:items-start gap-6 shadow-lg">
      <div class="text-3xl">🚀</div>
      <div class="flex-1">
        <h2 class="text-2xl font-bold mb-2">Ready for a full mock test?</h2>
        <p class="mb-4">Take Reading & Listening set 1 now and get your instant score.</p>
        <a href="/practice/ielts/reading" class="inline-block px-6 py-3 bg-white text-blue-700 font-semibold rounded-md hover:bg-gray-100 transition">Start Practice</a>
      </div>
    </div>
  </div>
</section> 