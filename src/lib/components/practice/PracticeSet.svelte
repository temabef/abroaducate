<script lang="ts">
  import Question from './Question.svelte';
  import Timer from './Timer.svelte';
  import { supabase } from '$lib/supabaseClient';

  export let questions: { id: string; question_text: string; choices: any[], explanation?: string, is_correct?: boolean }[] = [];
  export let user: any;
  export let setId: string | null;
  export let passage: string | null;

  let answers: Record<string, string> = {};
  let submitted = false;
  let score = 0;
  let isSubmitting = false;

  function handleAnswer(questionId: string, choiceId: string) {
    if (submitted) return;
    answers[questionId] = choiceId;
    answers = answers; // force reactivity
  }

  async function submit() {
    if (isSubmitting) return;
    isSubmitting = true;

    score = 0;
    questions.forEach(q => {
      const correctChoice = q.choices.find(c => c.is_correct);
      if (correctChoice && answers[q.id] === correctChoice.id) {
        score++;
      }
    });

    // Save the attempt
    const { data: attemptData, error: attemptError } = await supabase
      .from('user_practice_attempts')
      .insert({
        user_id: user.id,
        set_id: setId,
        score: score,
        completed_at: new Date()
      })
      .select('id')
      .single();

    if (attemptError) {
      console.error('Error saving attempt:', attemptError);
    } else if (attemptData) {
      // Save the individual responses
      const responsesToInsert = Object.entries(answers).map(([question_id, choice_id]) => ({
        attempt_id: attemptData.id,
        question_id,
        choice_id,
        user_id: user.id // Also include user_id here for policy
      }));

      const { error: responseError } = await supabase
        .from('user_practice_responses')
        .insert(responsesToInsert);

      if (responseError) {
        console.error('Error saving responses:', responseError);
      }
    }

    submitted = true;
    isSubmitting = false;
  }

  function reset() {
    answers = {};
    submitted = false;
    score = 0;
  }
</script>

<div class="space-y-6">
  {#if !submitted}
    <div class="flex justify-between items-center p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md sticky top-16 z-10">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Time Remaining</h3>
      <Timer duration={300} onTimesUp={submit} />
    </div>
  {/if}

  {#if passage}
    <div class="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 class="text-xl font-semibold mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">Reading Passage</h3>
      <div class="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm max-w-none">
        <p style="white-space: pre-wrap;">{passage}</p>
      </div>
    </div>
  {/if}

  {#if submitted}
    <div class="p-6 bg-blue-100 border border-blue-200 rounded-lg text-center">
      <h2 class="text-2xl font-bold text-blue-800">Your Score: {score} / {questions.length}</h2>
    </div>
  {/if}

  {#each questions as question, i}
    <Question
      {question}
      index={i}
      onAnswer={handleAnswer}
      selectedValue={answers[question.id] || null}
      {submitted}
    />
  {/each}

  {#if !submitted}
    <button class="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" on:click={submit} disabled={isSubmitting}>
      {#if isSubmitting}Submitting...{:else}Submit Answers{/if}
    </button>
  {:else}
    <button class="w-full px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700" on:click={reset}>Try Again</button>
  {/if}
</div> 