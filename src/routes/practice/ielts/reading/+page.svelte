<svelte:head>
  <title>IELTS Reading Practice - Test Prep | Abroaducate</title>
  <meta name="description" content="Practice IELTS Academic Reading with real test questions. Get instant feedback and improve your reading comprehension skills." />
</svelte:head>

<script lang="ts">
  import PracticeSet from '$lib/components/practice/PracticeSet.svelte';
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  export let data;
  const { user } = data;

  // All available reading sets for IELTS
  let practiceSets: { id: string; title: string; passage: string | null }[] = [];
  let currentSetId: string | null = null;
  let passage: string | null = null;
  let questions: any[] = [];
  let loading = true;
  let debugInfo = ''; // Add debug information
  let errorMessage = ''; // Add error tracking

  // Load all practice sets and default to the first one
  async function loadQuestionsForSet(setId: string) {
    loading = true;
    debugInfo = `Loading questions for set: ${setId}`;
    const selected = practiceSets.find(s => s.id === setId);
    passage = selected?.passage || null;
    
    try {
      debugInfo = `Fetching questions for set ID: ${setId}`;
      const { data: questionRows, error: questionError } = await supabase
        .from('practice_questions')
        .select('id, question_text, explanation')
        .eq('set_id', setId);
        
      if (questionError) {
        console.error('Error fetching questions:', questionError);
        errorMessage = `Question fetch error: ${questionError.message}`;
        questions = [];
        return;
      }
      
      if (!questionRows || questionRows.length === 0) {
        console.error('No questions found for set:', setId);
        errorMessage = `No questions found for set: ${setId}`;
        questions = [];
        return;
      }
      
      debugInfo = `Found ${questionRows.length} questions, fetching choices...`;
      const questionIds = questionRows.map(q => q.id);
      
      const { data: choiceRows, error: choiceError } = await supabase
        .from('practice_choices')
        .select('id, choice_text, is_correct, question_id')
        .in('question_id', questionIds);
        
      if (choiceError) {
        console.error('Error fetching choices:', choiceError);
        errorMessage = `Choice fetch error: ${choiceError.message}`;
        questions = [];
        return;
      }
      
      if (!choiceRows || choiceRows.length === 0) {
        console.error('No choices found for questions:', questionIds);
        errorMessage = `No choices found for questions`;
        questions = [];
        return;
      }
      
      debugInfo = `Found ${choiceRows.length} choices, assembling questions...`;
      questions = questionRows.map(question => ({
        ...question,
        choices: choiceRows.filter(c => c.question_id === question.id)
      }));
      
      debugInfo = `Successfully loaded ${questions.length} questions with choices`;
      errorMessage = '';
      
    } catch (e: any) {
      console.error('Unexpected error loading questions:', e);
      errorMessage = `Unexpected error: ${e.message}`;
      questions = [];
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    try {
      debugInfo = 'Starting IELTS practice initialization...';
      
      // Fetch the IELTS test ID
      debugInfo = 'Fetching IELTS test...';
      const { data: testRow, error: testError } = await supabase
        .from('practice_tests')
        .select('id')
        .eq('slug', 'ielts')
        .single();
        
      if (testError) {
        console.error('Error fetching test:', testError);
        errorMessage = `Test fetch error: ${testError.message}`;
        return;
      }
      
      if (!testRow) {
        console.error('No IELTS test found');
        errorMessage = 'No IELTS test found in database';
        return;
      }
      
      const testId = testRow.id;
      debugInfo = `Found IELTS test with ID: ${testId}`;

      // Fetch all reading sets for this test
      debugInfo = 'Fetching practice sets...';
      const { data: setsRows, error: setsError } = await supabase
        .from('practice_sets')
        .select('id, title, passage')
        .eq('test_id', testId)
        .eq('section', 'reading')
        .order('sort_order', { ascending: true });
        
      if (setsError) {
        console.error('Error fetching practice sets:', setsError);
        errorMessage = `Sets fetch error: ${setsError.message}`;
        return;
      }
      
      if (!setsRows || setsRows.length === 0) {
        console.error('No practice sets found for test:', testId);
        errorMessage = `No reading practice sets found for test: ${testId}`;
        return;
      }
      
      practiceSets = setsRows;
      currentSetId = practiceSets[0].id;
      debugInfo = `Found ${practiceSets.length} practice sets, loading first set: ${currentSetId}`;
      
      await loadQuestionsForSet(currentSetId);
    } catch (e: any) {
      console.error('Unexpected error initializing page:', e);
      errorMessage = `Initialization error: ${e.message}`;
    }
  });
</script>

<section class="pt-28 pb-16 max-w-3xl mx-auto px-4 min-h-screen">
  <!-- Error Display Only -->
  {#if errorMessage}
    <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 class="font-bold text-sm text-red-700 mb-2">⚠️ Error:</h3>
      <p class="text-sm text-red-600">{errorMessage}</p>
    </div>
  {/if}

  {#if practiceSets.length}
    <div class="mb-6">
      <label for="set-select" class="block mb-2 font-medium">Choose Practice Set:</label>
      <select
        id="set-select"
        bind:value={currentSetId}
        on:change={() => currentSetId && loadQuestionsForSet(currentSetId)}
        class="border rounded p-2"
      >
        {#each practiceSets as set}
          <option value={set.id}>{set.title}</option>
        {/each}
      </select>
    </div>
  {/if}
  
  <h1 class="text-3xl font-bold mb-6">IELTS Reading – {practiceSets.find(s => s.id === currentSetId)?.title}</h1>
  
  {#if loading}
    <div class="text-center py-8">
      <p class="text-lg">Loading questions…</p>
      <p class="text-sm text-gray-500 mt-2">{debugInfo}</p>
    </div>
  {:else}
    {#if questions.length}
      <PracticeSet {questions} {user} setId={currentSetId} {passage} />
    {:else}
      <div class="text-center py-8">
        <p class="text-lg text-red-600">No questions found.</p>
        <p class="text-sm text-gray-500 mt-2">Check the debug information above for details.</p>
      </div>
    {/if}
  {/if}
</section> 