<script lang="ts">
	import type { Writable } from "svelte/store";

  export let question: { id: string; question_text: string; choices: any[], explanation?: string };
  export let index: number;
  export let onAnswer: (questionId: string, choiceId: string) => void;
  export let selectedValue: string | null;
  export let submitted = false; // to control display mode

  let correctChoiceId: string | null = null;
  $: if (submitted) {
    correctChoiceId = question.choices.find(c => c.is_correct)?.id || null;
  }
</script>

<div class="space-y-2 mb-4 p-4 rounded-lg" class:border-green-500={submitted && selectedValue === correctChoiceId} class:border-red-500={submitted && selectedValue !== correctChoiceId} class:border={submitted}>
  <p class="font-medium">{index + 1}. {question.question_text}</p>
  <div class="pl-4">
    {#if question.choices && question.choices.length > 0}
      <ul class="space-y-2">
        {#each question.choices as choice (choice.id)}
          <li>
            <label class="flex items-center p-2 rounded-lg cursor-pointer"
              class:bg-green-100={submitted && choice.is_correct}
              class:bg-red-100={submitted && !choice.is_correct && selectedValue === choice.id}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={choice.id}
                bind:group={selectedValue}
                on:change={() => onAnswer(question.id, choice.id)}
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                disabled={submitted}
              />
              <span class="ml-3"
                class:text-green-800={submitted && choice.is_correct}
                class:text-red-800={submitted && !choice.is_correct && selectedValue === choice.id}
              >{choice.choice_text}</span>
            </label>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  {#if submitted && question.explanation}
    <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
      <strong>Explanation:</strong> {question.explanation}
    </div>
  {/if}
</div> 