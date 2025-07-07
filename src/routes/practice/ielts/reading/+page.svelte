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

  // Load all practice sets and default to the first one
  async function loadQuestionsForSet(setId: string) {
    loading = true;
    const selected = practiceSets.find(s => s.id === setId);
    passage = selected?.passage || null;
    try {
      const { data: questionRows, error: questionError } = await supabase
        .from('practice_questions')
        .select('id, question_text, explanation')
        .eq('set_id', setId);
      if (questionError || !questionRows) {
        console.error('Error fetching questions:', questionError);
        questions = [];
        return;
      }
      const questionIds = questionRows.map(q => q.id);
      const { data: choiceRows, error: choiceError } = await supabase
        .from('practice_choices')
        .select('id, choice_text, is_correct, question_id')
        .in('question_id', questionIds);
      if (choiceError || !choiceRows) {
        console.error('Error fetching choices:', choiceError);
        questions = [];
        return;
      }
      questions = questionRows.map(question => ({
        ...question,
        choices: choiceRows.filter(c => c.question_id === question.id)
      }));
    } catch (e) {
      console.error('Unexpected error loading questions:', e);
      questions = [];
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    try {
      // Fetch the IELTS test ID
      const { data: testRow, error: testError } = await supabase
        .from('practice_tests')
        .select('id')
        .eq('slug', 'ielts')
        .single();
      if (testError || !testRow) {
        console.error('Error fetching test:', testError);
        return;
      }
      const testId = testRow.id;

      // Fetch all reading sets for this test
      const { data: setsRows, error: setsError } = await supabase
        .from('practice_sets')
        .select('id, title, passage')
        .eq('test_id', testId)
        .order('sort_order', { ascending: true });
      if (setsError || !setsRows?.length) {
        console.error('Error fetching practice sets:', setsError);
        return;
      }
      practiceSets = setsRows;
      currentSetId = practiceSets[0].id;
      await loadQuestionsForSet(currentSetId);
    } catch (e) {
      console.error('Unexpected error initializing page:', e);
    }
  });
</script>

<section class="pt-28 pb-16 max-w-3xl mx-auto px-4 min-h-screen">
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
    <p>Loading questions…</p>
  {:else}
    {#if questions.length}
      <PracticeSet {questions} {user} setId={currentSetId} {passage} />
    {:else}
      <p>No questions found.</p>
    {/if}
  {/if}
</section> 