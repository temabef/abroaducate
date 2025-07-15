<svelte:head>
  <title>IELTS Writing Practice - Task 1 & Task 2 | Abroaducate</title>
  <meta name="description" content="Practice IELTS Academic Writing with Task 1 data description and Task 2 essays. Real exam conditions with time limits and word count tracking." />
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  export let data;
  const { user } = data;

  // Practice sets for writing
  let writingSets: { id: string; title: string; task_type: string }[] = [];
  let questions: any[] = [];
  let currentSetId: string | null = null;
  let currentQuestion: any = null;
  let loading = true;
  let debugInfo = '';
  let errorMessage = '';

  // Writing state
  let userResponse = '';
  let timeStarted: Date | null = null;
  let timeElapsed = 0;
  let isTimerRunning = false;
  let timerInterval: NodeJS.Timeout;
  let showResults = false;
  let submitted = false;

  // Assessment data
  let assessmentCriteria = {
    taskAchievement: { score: 0, feedback: '' },
    coherenceCohesion: { score: 0, feedback: '' },
    lexicalResource: { score: 0, feedback: '' },
    grammaticalRange: { score: 0, feedback: '' }
  };

  // Timer functions
  function startTimer() {
    if (!timeStarted) {
      timeStarted = new Date();
      isTimerRunning = true;
      timerInterval = setInterval(() => {
        if (timeStarted) {
          timeElapsed = Math.floor((new Date().getTime() - timeStarted.getTime()) / 1000);
        }
      }, 1000);
    }
  }

  function stopTimer() {
    isTimerRunning = false;
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  }

  // Word count tracking - now reactive
  let wordCount = $derived(userResponse.trim() === '' ? 0 : userResponse.trim().split(/\s+/).filter(word => word.length > 0).length);

  // Load writing practice sets
  onMount(async () => {
    try {
      debugInfo = 'Loading IELTS writing practice sets...';
      
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

      // Fetch writing practice sets
      const { data: setsRows, error: setsError } = await supabase
        .from('practice_sets')
        .select('id, title')
        .eq('test_id', testId)
        .eq('section', 'writing')
        .order('sort_order', { ascending: true });
        
      if (setsError || !setsRows) {
        errorMessage = 'No writing practice sets found';
        loading = false;
        return;
      }
      
      writingSets = setsRows.map(set => ({
        ...set,
        task_type: set.title.includes('Task 1') ? 'task1' : 'task2'
      }));
      
      if (writingSets.length > 0) {
        currentSetId = writingSets[0].id;
        await loadQuestionsForSet(currentSetId);
      }
      
    } catch (e) {
      console.error('Error loading writing practice:', e);
      errorMessage = `Error: ${e instanceof Error ? e.message : 'Unknown error'}`;
      loading = false;
    }
  });

  async function loadQuestionsForSet(setId: string) {
    loading = true;
    currentSetId = setId; // Update current set ID first
    debugInfo = `Loading questions for writing set: ${setId}`;
    
    try {
      const { data: questionRows, error: questionError } = await supabase
        .from('practice_questions')
        .select('id, question_text, explanation, metadata')
        .eq('set_id', setId)
        .order('sort_order', { ascending: true });
        
      if (questionError || !questionRows || questionRows.length === 0) {
        errorMessage = 'No questions found for this writing set';
        questions = [];
        loading = false;
        return;
      }
      
      questions = questionRows;
      currentQuestion = questions[0];
      resetWritingSession();
      
      debugInfo = `Successfully loaded ${questions.length} writing questions`;
      errorMessage = '';
      loading = false;
      
    } catch (e) {
      console.error('Error loading questions:', e);
      errorMessage = `Error loading questions: ${e instanceof Error ? e.message : 'Unknown error'}`;
      loading = false;
    }
  }

  function resetWritingSession() {
    userResponse = '';
    // wordCount will be automatically updated by reactive statement
    timeStarted = null;
    timeElapsed = 0;
    isTimerRunning = false;
    showResults = false;
    submitted = false;
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  }

  function selectQuestion(question: any) {
    currentQuestion = question;
    resetWritingSession();
  }

  function submitResponse() {
    stopTimer();
    submitted = true;
    showResults = true;
    
    // Provide basic assessment feedback
    const taskType = currentQuestion.metadata?.task_type || 'unknown';
    const wordLimit = currentQuestion.metadata?.word_limit || 250;
    const timeLimit = currentQuestion.metadata?.time_limit || 2400; // seconds
    
    // Basic assessment logic
    assessmentCriteria = {
      taskAchievement: {
        score: wordCount >= wordLimit ? 7 : 5,
        feedback: wordCount >= wordLimit 
          ? 'Good! You met the word count requirement.' 
          : `You need at least ${wordLimit} words. You wrote ${wordCount}.`
      },
      coherenceCohesion: {
        score: 6,
        feedback: 'Consider using more linking words and clear paragraph structure.'
      },
      lexicalResource: {
        score: 6,
        feedback: 'Try to use a wider range of vocabulary and avoid repetition.'
      },
      grammaticalRange: {
        score: 6,
        feedback: 'Practice using more complex sentence structures.'
      }
    };
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function getTaskInfo(question: any) {
    const metadata = question.metadata || {};
    return {
      wordLimit: metadata.word_limit || 250,
      timeLimit: metadata.time_limit || 2400,
      taskType: metadata.task_type || 'essay',
      isTask1: metadata.task_type?.includes('chart') || metadata.task_type?.includes('graph') || metadata.task_type?.includes('process')
    };
  }


</script>

<section class="pt-28 pb-16 min-h-screen bg-gray-50">
  <div class="max-w-5xl mx-auto px-4">
    <!-- Error Display Only -->
    {#if errorMessage}
      <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 class="font-bold text-sm text-red-700 mb-2">⚠️ Error:</h3>
        <p class="text-sm text-red-600">{errorMessage}</p>
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Sidebar: Task Selection -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-lg font-semibold mb-4">Writing Tasks</h2>
          
          <!-- Writing Set Selection -->
          {#if writingSets.length > 0}
            <div class="space-y-2 mb-6">
              {#each writingSets as set}
                <button
                  on:click={() => loadQuestionsForSet(set.id)}
                  class="w-full text-left p-3 rounded-lg border transition-colors
                    {currentSetId === set.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}"
                >
                  <span class="font-medium text-sm">{set.title}</span>
                  <div class="text-xs text-gray-500 mt-1">
                    {set.task_type === 'task1' ? 'Data Description' : 'Essay Writing'}
                  </div>
                </button>
              {/each}
            </div>
          {/if}

          <!-- Question Selection -->
          {#if questions.length > 0}
            <div class="border-t pt-4">
              <h3 class="font-medium text-sm mb-3">Available Questions</h3>
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

          <!-- Timer and Word Count -->
          {#if currentQuestion}
            <div class="border-t pt-4 mt-4">
              <div class="space-y-3">
                <div class="bg-gray-50 p-3 rounded">
                  <div class="text-xs text-gray-600 mb-1">Time Elapsed</div>
                  <div class="text-lg font-mono font-bold text-gray-900">
                    {formatTime(timeElapsed)}
                  </div>
                </div>
                
                <div class="bg-gray-50 p-3 rounded">
                  <div class="text-xs text-gray-600 mb-1">Word Count</div>
                  <div class="text-lg font-bold 
                    {wordCount >= getTaskInfo(currentQuestion).wordLimit ? 'text-green-600' : 'text-orange-600'}">
                    {wordCount} / {getTaskInfo(currentQuestion).wordLimit}
                  </div>
                </div>

                {#if !submitted}
                  <button
                    on:click={submitResponse}
                    disabled={wordCount < getTaskInfo(currentQuestion).wordLimit}
                    class="w-full py-2 px-4 rounded-md font-medium transition-colors
                      {wordCount >= getTaskInfo(currentQuestion).wordLimit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}"
                  >
                    Submit Response
                  </button>
                  {#if wordCount < getTaskInfo(currentQuestion).wordLimit}
                    <p class="text-xs text-orange-600 mt-2 text-center">
                      Need {getTaskInfo(currentQuestion).wordLimit - wordCount} more words to submit
                    </p>
                  {/if}
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </div>

      <!-- Main Content: Writing Interface -->
      <div class="lg:col-span-3">
        {#if loading}
          <div class="bg-white rounded-lg shadow-md p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Loading writing practice...</p>
          </div>
        {:else if currentQuestion}
          <div class="bg-white rounded-lg shadow-md p-6">
            <!-- Task Information -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-4">
                <h1 class="text-2xl font-bold text-gray-900">
                  IELTS Writing Practice
                </h1>
                <div class="flex items-center gap-4 text-sm text-gray-600">
                  <span>⏱️ Target: {Math.floor(getTaskInfo(currentQuestion).timeLimit / 60)} minutes</span>
                  <span>📝 Min words: {getTaskInfo(currentQuestion).wordLimit}</span>
                </div>
              </div>
              
              <!-- Task Type Badge -->
              <div class="mb-4">
                <span class="px-3 py-1 text-sm font-medium rounded-full
                  {getTaskInfo(currentQuestion).isTask1 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                  {getTaskInfo(currentQuestion).isTask1 ? 'Writing Task 1 - Data Description' : 'Writing Task 2 - Essay'}
                </span>
              </div>

              <!-- Question Text -->
              <div class="bg-gray-50 border-l-4 border-blue-500 p-4 mb-6">
                <h3 class="font-semibold text-gray-900 mb-2">Task:</h3>
                <p class="text-gray-700 leading-relaxed">{currentQuestion.question_text}</p>
              </div>

              <!-- Instructions -->
              {#if currentQuestion.explanation}
                <details class="mb-6">
                  <summary class="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                    📚 View Assessment Criteria & Tips
                  </summary>
                  <div class="mt-3 p-4 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-800">{currentQuestion.explanation}</p>
                  </div>
                </details>
              {/if}
            </div>

            <!-- Writing Interface -->
            {#if !showResults}
              <div class="mb-6">
                <label for="response" class="block text-sm font-medium text-gray-700 mb-2">
                  Your Response:
                </label>
                <textarea
                  id="response"
                  bind:value={userResponse}
                  on:input={() => !isTimerRunning && userResponse.length > 0 && startTimer()}
                  placeholder="Start typing your response here..."
                  rows="20"
                  class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm leading-relaxed"
                ></textarea>
                
                <div class="flex justify-between items-center mt-2 text-sm text-gray-600">
                  <span>💡 Tip: Plan your response before writing</span>
                  <span class="font-medium">
                    Words: {wordCount} | Time: {formatTime(timeElapsed)}
                  </span>
                </div>
              </div>
            {:else}
              <!-- Results Display -->
              <div class="space-y-6">
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 class="font-semibold text-green-900 mb-2">✅ Response Submitted!</h3>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-green-700">Words written:</span>
                      <span class="font-semibold ml-2">{wordCount}</span>
                    </div>
                    <div>
                      <span class="text-green-700">Time taken:</span>
                      <span class="font-semibold ml-2">{formatTime(timeElapsed)}</span>
                    </div>
                  </div>
                </div>

                <!-- Assessment Results -->
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Assessment Feedback</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each Object.entries(assessmentCriteria) as [criterion, result]}
                      <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-center mb-2">
                          <h4 class="font-medium text-gray-900 capitalize">
                            {criterion.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <span class="px-2 py-1 text-xs font-medium rounded-full
                            {result.score >= 7 ? 'bg-green-100 text-green-800' : 
                             result.score >= 6 ? 'bg-yellow-100 text-yellow-800' : 
                             'bg-red-100 text-red-800'}">
                            Band {result.score}
                          </span>
                        </div>
                        <p class="text-sm text-gray-600">{result.feedback}</p>
                      </div>
                    {/each}
                  </div>
                </div>

                <!-- Your Response -->
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 class="font-medium text-gray-900 mb-3">Your Response:</h4>
                  <div class="bg-white p-4 rounded border text-sm leading-relaxed whitespace-pre-wrap">
                    {userResponse}
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-3">
                  <button
                    on:click={resetWritingSession}
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Try Again
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
            <p class="text-gray-600">No writing questions available. Please check the database setup.</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section> 