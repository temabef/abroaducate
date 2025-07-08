<svelte:head>
  <title>IELTS Speaking Practice - Parts 1, 2 & 3 | Abroaducate</title>
  <meta name="description" content="Practice IELTS Speaking with authentic questions for Parts 1, 2, and 3. Self-assessment tools and speaking tips included." />
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  export let data;
  const { user } = data;

  // Practice sets for speaking
  let speakingSets: { id: string; title: string; part: number }[] = [];
  let questions: any[] = [];
  let currentSetId: string | null = null;
  let currentQuestion: any = null;
  let loading = true;
  let debugInfo = '';
  let errorMessage = '';

  // Speaking state
  let currentPart = 1;
  let isRecording = false;
  let preparationTime = 0;
  let speakingTime = 0;
  let preparationInterval: NodeJS.Timeout;
  let speakingInterval: NodeJS.Timeout;
  let isPreparingPart2 = false;
  let notes = '';
  let showResults = false;
  let sessionComplete = false;

  // Speaking parts information
  const speakingParts = {
    1: {
      title: 'Part 1: Introduction & Interview',
      duration: '4-5 minutes',
      description: 'Personal questions about yourself, your family, work, studies, and interests',
      tips: [
        'Give extended answers with examples',
        'Use varied vocabulary and grammar',
        'Speak naturally and maintain eye contact',
        'Don\'t memorize answers - be authentic'
      ]
    },
    2: {
      title: 'Part 2: Individual Long Turn',
      duration: '3-4 minutes (1 min prep + 2 min speaking)',
      description: 'Speak about a specific topic using cue card prompts',
      tips: [
        'Use the 1-minute preparation time effectively',
        'Cover all bullet points on the cue card',
        'Speak for the full 2 minutes',
        'Include specific details and examples'
      ]
    },
    3: {
      title: 'Part 3: Two-way Discussion',
      duration: '4-5 minutes',
      description: 'Abstract discussion related to Part 2 topic',
      tips: [
        'Express and justify your opinions',
        'Speculate about future trends',
        'Compare different perspectives',
        'Use advanced vocabulary and complex grammar'
      ]
    }
  };

  // Assessment criteria
  const assessmentCriteria = [
    {
      name: 'Fluency & Coherence',
      description: 'Ability to speak smoothly and organize ideas logically',
      bandDescriptors: {
        9: 'Speaks fluently with natural language',
        7: 'Speaks at length with some hesitation',
        5: 'Usually maintains flow but uses repetition',
        3: 'Frequently pauses and uses simple connectives'
      }
    },
    {
      name: 'Lexical Resource',
      description: 'Range and accuracy of vocabulary',
      bandDescriptors: {
        9: 'Uses vocabulary with full flexibility and precise meaning',
        7: 'Uses vocabulary flexibly to express precise meaning',
        5: 'Limited flexibility but attempts to use uncommon vocabulary',
        3: 'Uses simple vocabulary with frequent repetition'
      }
    },
    {
      name: 'Grammatical Range & Accuracy',
      description: 'Range and accuracy of grammar structures',
      bandDescriptors: {
        9: 'Uses full range of structures with accuracy',
        7: 'Uses range of complex structures with some errors',
        5: 'Uses mix of simple and complex forms with errors',
        3: 'Uses only simple forms with frequent errors'
      }
    },
    {
      name: 'Pronunciation',
      description: 'Clarity and natural sound of speech',
      bandDescriptors: {
        9: 'Uses wide range of pronunciation features naturally',
        7: 'Easy to understand with some L1 accent',
        5: 'Generally intelligible despite mispronunciation',
        3: 'Frequently difficult to understand'
      }
    }
  ];

  // Load speaking practice sets
  onMount(async () => {
    try {
      debugInfo = 'Loading IELTS speaking practice sets...';
      
      // Fetch the IELTS test ID
      const { data: testRow, error: testError } = await supabase
        .from('practice_tests')
        .select('id')
        .eq('slug', 'ielts')
        .single();
        
      if (testError || !testRow) {
        errorMessage = 'IELTS test not found in database';
        loading = false;
        return;
      }
      
      const testId = testRow.id;
      debugInfo = `Found IELTS test with ID: ${testId}`;

      // Fetch speaking practice sets
      const { data: setsRows, error: setsError } = await supabase
        .from('practice_sets')
        .select('id, title')
        .eq('test_id', testId)
        .eq('section', 'speaking')
        .order('sort_order', { ascending: true });
        
      if (setsError || !setsRows) {
        errorMessage = 'No speaking practice sets found';
        loading = false;
        return;
      }
      
      speakingSets = setsRows.map(set => ({
        ...set,
        part: set.title.includes('Part 1') ? 1 : set.title.includes('Part 2') ? 2 : 3
      }));
      
      if (speakingSets.length > 0) {
        currentSetId = speakingSets[0].id;
        await loadQuestionsForSet(currentSetId);
      }
      
    } catch (e) {
      console.error('Error loading speaking practice:', e);
      errorMessage = `Error: ${e.message}`;
      loading = false;
    }
  });

  async function loadQuestionsForSet(setId: string) {
    loading = true;
    debugInfo = `Loading questions for speaking set: ${setId}`;
    
    try {
      const { data: questionRows, error: questionError } = await supabase
        .from('practice_questions')
        .select('id, question_text, explanation, metadata')
        .eq('set_id', setId)
        .order('sort_order', { ascending: true });
        
      if (questionError || !questionRows || questionRows.length === 0) {
        errorMessage = 'No questions found for this speaking set';
        questions = [];
        loading = false;
        return;
      }
      
      questions = questionRows;
      currentQuestion = questions[0];
      
      // Update current part based on question metadata
      if (currentQuestion.metadata?.part) {
        currentPart = currentQuestion.metadata.part;
      }
      
      resetSpeakingSession();
      
      debugInfo = `Successfully loaded ${questions.length} speaking questions`;
      errorMessage = '';
      loading = false;
      
    } catch (e) {
      console.error('Error loading questions:', e);
      errorMessage = `Error loading questions: ${e.message}`;
      loading = false;
    }
  }

  function resetSpeakingSession() {
    isRecording = false;
    preparationTime = 0;
    speakingTime = 0;
    isPreparingPart2 = false;
    notes = '';
    showResults = false;
    sessionComplete = false;
    if (preparationInterval) clearInterval(preparationInterval);
    if (speakingInterval) clearInterval(speakingInterval);
  }

  function startPreparation() {
    isPreparingPart2 = true;
    preparationTime = 60; // 1 minute for Part 2
    preparationInterval = setInterval(() => {
      preparationTime--;
      if (preparationTime <= 0) {
        clearInterval(preparationInterval);
        isPreparingPart2 = false;
      }
    }, 1000);
  }

  function startSpeaking() {
    isRecording = true;
    speakingTime = 0;
    const maxTime = currentPart === 2 ? 120 : 300; // 2 min for Part 2, 5 min for others
    
    speakingInterval = setInterval(() => {
      speakingTime++;
      if (speakingTime >= maxTime) {
        stopSpeaking();
      }
    }, 1000);
  }

  function stopSpeaking() {
    isRecording = false;
    if (speakingInterval) {
      clearInterval(speakingInterval);
    }
    showResults = true;
    sessionComplete = true;
  }

  function selectSet(setId: string) {
    if (currentSetId !== setId) {
      currentSetId = setId;
      loadQuestionsForSet(setId);
    }
  }

  function selectQuestion(question: any) {
    currentQuestion = question;
    if (question.metadata?.part) {
      currentPart = question.metadata.part;
    }
    resetSpeakingSession();
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function getPartColor(part: number): string {
    switch(part) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
      case 3: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<section class="pt-28 pb-16 min-h-screen bg-gray-50">
  <div class="max-w-6xl mx-auto px-4">
    <!-- Error Display Only -->
    {#if errorMessage}
      <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 class="font-bold text-sm text-red-700 mb-2">⚠️ Error:</h3>
        <p class="text-sm text-red-600">{errorMessage}</p>
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Sidebar: Part Selection & Timer -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-md p-6 space-y-6">
          <!-- Speaking Parts -->
          <div>
            <h2 class="text-lg font-semibold mb-4">Speaking Parts</h2>
            <div class="space-y-2">
              {#each speakingSets as set}
                <button
                  on:click={() => selectSet(set.id)}
                  class="w-full text-left p-3 rounded-lg border transition-colors
                    {currentSetId === set.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-sm">{set.title}</span>
                    <span class="px-2 py-1 text-xs rounded-full {getPartColor(set.part)}">
                      Part {set.part}
                    </span>
                  </div>
                </button>
              {/each}
            </div>
          </div>

          <!-- Questions -->
          {#if questions.length > 0}
            <div class="border-t pt-4">
              <h3 class="font-medium text-sm mb-3">Questions</h3>
              <div class="space-y-2">
                {#each questions as question, index}
                  <button
                    on:click={() => selectQuestion(question)}
                    class="w-full text-left p-2 rounded border text-sm transition-colors
                      {currentQuestion?.id === question.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}"
                  >
                    Question {index + 1}
                  </button>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Timer Display -->
          {#if currentQuestion}
            <div class="border-t pt-4">
              <h3 class="font-medium text-sm mb-3">Session Timer</h3>
              
              {#if currentPart === 2}
                <div class="space-y-3">
                  {#if isPreparingPart2}
                    <div class="bg-yellow-50 p-3 rounded">
                      <div class="text-xs text-yellow-600 mb-1">Preparation Time</div>
                      <div class="text-lg font-mono font-bold text-yellow-800">
                        {formatTime(preparationTime)}
                      </div>
                    </div>
                  {/if}
                  
                  <div class="bg-gray-50 p-3 rounded">
                    <div class="text-xs text-gray-600 mb-1">Speaking Time</div>
                    <div class="text-lg font-mono font-bold 
                      {isRecording ? 'text-red-600' : 'text-gray-900'}">
                      {formatTime(speakingTime)}
                    </div>
                  </div>
                </div>
              {:else}
                <div class="bg-gray-50 p-3 rounded">
                  <div class="text-xs text-gray-600 mb-1">Speaking Time</div>
                  <div class="text-lg font-mono font-bold 
                    {isRecording ? 'text-red-600' : 'text-gray-900'}">
                    {formatTime(speakingTime)}
                  </div>
                </div>
              {/if}

              <!-- Control Buttons -->
              <div class="mt-4 space-y-2">
                {#if currentPart === 2 && !isPreparingPart2 && !isRecording && speakingTime === 0}
                  <button
                    on:click={startPreparation}
                    class="w-full py-2 px-4 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    Start Preparation (1 min)
                  </button>
                {/if}
                
                {#if !isRecording && (currentPart !== 2 || !isPreparingPart2)}
                  <button
                    on:click={startSpeaking}
                    class="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    🎤 Start Speaking
                  </button>
                {/if}
                
                {#if isRecording}
                  <button
                    on:click={stopSpeaking}
                    class="w-full py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    ⏹️ Stop Speaking
                  </button>
                {/if}
                
                {#if sessionComplete}
                  <button
                    on:click={resetSpeakingSession}
                    class="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Main Content: Speaking Interface -->
      <div class="lg:col-span-3">
        {#if loading}
          <div class="bg-white rounded-lg shadow-md p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Loading speaking practice...</p>
          </div>
        {:else if currentQuestion}
          <div class="space-y-6">
            <!-- Part Information -->
            <div class="bg-white rounded-lg shadow-md p-6">
              <div class="flex items-center justify-between mb-4">
                <h1 class="text-2xl font-bold text-gray-900">
                  IELTS Speaking Practice
                </h1>
                <span class="px-3 py-1 text-sm font-medium rounded-full {getPartColor(currentPart)}">
                  Part {currentPart}
                </span>
              </div>
              
              <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 class="font-semibold text-gray-900 mb-2">
                  {speakingParts[currentPart].title}
                </h3>
                <p class="text-gray-700 text-sm mb-2">
                  {speakingParts[currentPart].description}
                </p>
                <p class="text-gray-600 text-sm">
                  ⏱️ Duration: {speakingParts[currentPart].duration}
                </p>
              </div>

              <!-- Speaking Tips -->
              <details class="mb-4">
                <summary class="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                  💡 Speaking Tips for Part {currentPart}
                </summary>
                <div class="mt-3 p-4 bg-blue-50 rounded-lg">
                  <ul class="space-y-2">
                    {#each speakingParts[currentPart].tips as tip}
                      <li class="flex items-start gap-2">
                        <span class="text-blue-500 mt-0.5">•</span>
                        <span class="text-sm text-blue-800">{tip}</span>
                      </li>
                    {/each}
                  </ul>
                </div>
              </details>
            </div>

            <!-- Question Card -->
            <div class="bg-white rounded-lg shadow-md p-6">
              <h3 class="font-semibold text-gray-900 mb-4">
                {currentPart === 2 ? 'Cue Card' : 'Question'}
              </h3>
              
              <div class="bg-gray-50 border-l-4 border-blue-500 p-4 mb-6">
                <p class="text-gray-700 leading-relaxed">{currentQuestion.question_text}</p>
              </div>

              <!-- Part 2 Preparation Notes -->
              {#if currentPart === 2}
                <div class="mb-6">
                  <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
                    📝 Preparation Notes (use during 1-minute preparation):
                  </label>
                  <textarea
                    id="notes"
                    bind:value={notes}
                    placeholder="Make notes about what you want to say for each bullet point..."
                    rows="6"
                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isRecording}
                  ></textarea>
                </div>
              {/if}

              <!-- Recording Status -->
              {#if isRecording}
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div class="flex items-center gap-3">
                    <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span class="font-medium text-red-800">Recording in progress...</span>
                    <span class="text-red-600 font-mono">{formatTime(speakingTime)}</span>
                  </div>
                  <p class="text-sm text-red-700 mt-2">
                    💡 Speak clearly and naturally. Cover all points if this is Part 2.
                  </p>
                </div>
              {/if}

              <!-- Preparation Status for Part 2 -->
              {#if isPreparingPart2}
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div class="flex items-center gap-3">
                    <div class="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span class="font-medium text-yellow-800">Preparation Time</span>
                    <span class="text-yellow-600 font-mono">{formatTime(preparationTime)}</span>
                  </div>
                  <p class="text-sm text-yellow-700 mt-2">
                    ✏️ Make notes about what you want to say. You'll have 2 minutes to speak.
                  </p>
                </div>
              {/if}

              <!-- Assessment Guidance -->
              {#if currentQuestion.explanation}
                <details class="mb-4">
                  <summary class="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                    📚 Assessment Criteria & Guidance
                  </summary>
                  <div class="mt-3 p-4 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-800">{currentQuestion.explanation}</p>
                  </div>
                </details>
              {/if}
            </div>

            <!-- Results & Self-Assessment -->
            {#if showResults}
              <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Session Complete! 🎉</h3>
                
                <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h4 class="font-medium text-green-900 mb-2">Your Performance:</h4>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-green-700">Speaking time:</span>
                      <span class="font-semibold ml-2">{formatTime(speakingTime)}</span>
                    </div>
                    <div>
                      <span class="text-green-700">Part completed:</span>
                      <span class="font-semibold ml-2">Part {currentPart}</span>
                    </div>
                  </div>
                </div>

                <!-- Self-Assessment -->
                <div class="mb-6">
                  <h4 class="font-medium text-gray-900 mb-4">Self-Assessment Guide</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each assessmentCriteria as criterion}
                      <div class="border border-gray-200 rounded-lg p-4">
                        <h5 class="font-medium text-gray-900 mb-2">{criterion.name}</h5>
                        <p class="text-sm text-gray-600 mb-3">{criterion.description}</p>
                        <div class="space-y-1 text-xs">
                          {#each Object.entries(criterion.bandDescriptors) as [band, description]}
                            <div class="flex gap-2">
                              <span class="font-mono font-bold text-blue-600 min-w-[20px]">{band}:</span>
                              <span class="text-gray-700">{description}</span>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>

                <!-- Next Steps -->
                <div class="flex gap-3">
                  <button
                    on:click={resetSpeakingSession}
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Practice Again
                  </button>
                  <button
                    on:click={() => {
                      const nextIndex = questions.findIndex(q => q.id === currentQuestion.id) + 1;
                      if (nextIndex < questions.length) {
                        selectQuestion(questions[nextIndex]);
                      }
                    }}
                    disabled={questions.findIndex(q => q.id === currentQuestion.id) >= questions.length - 1}
                    class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Next Question
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {:else}
          <div class="bg-white rounded-lg shadow-md p-8 text-center">
            <p class="text-gray-600">No speaking questions available. Please check the database setup.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section> 