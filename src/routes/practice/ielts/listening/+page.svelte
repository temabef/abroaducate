<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';
  import TestPrepProgress from '$lib/components/TestPrepProgress.svelte';

  let { data } = $props();
  let { session } = $derived(data);

  interface ListeningQuestion {
    id: string;
    question_text: string;
    question_type: 'multiple_choice' | 'fill_blank' | 'true_false';
    sort_order: number;
    audio_file_id?: string;
    audio_url?: string;
    transcript?: string;
    choices?: Array<{
      id: string;
      choice_text: string;
      is_correct: boolean;
    }>;
  }

  interface ListeningSet {
    id: string;
    title: string;
    section: string;
    sort_order: number;
    questions: ListeningQuestion[];
  }

  let currentSet: ListeningSet | null = $state(null);
  let currentQuestionIndex = $state(0);
  let userAnswers = $state<Record<string, string>>({});
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let showTranscript = $state(false);
  let showResults = $state(false);
  let isSubmitting = $state(false);
  let submissionError = $state<string | null>(null);

  // Progress tracking
  let totalQuestions = $state(0);
  let answeredQuestions = $state(0);
  let correctAnswers = $state(0);
  let finalScore = $state(0);

  // Validation state
  let validationErrors = $state<string[]>([]);

  onMount(async () => {
    if (!session?.user) {
      goto('/login?redirect=/practice/ielts/listening');
      return;
    }

    await loadListeningSet();
  });

  // Cleanup function for text-to-speech
  onMount(() => {
    return () => {
      stopSpeech();
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    };
  });

  async function loadListeningSet() {
    isLoading = true;
    error = null;

    try {
      // First try to load from BBC Learning English API
      const bbcResponse = await fetch('/api/bbc-learning-english?limit=3');
      if (bbcResponse.ok) {
        const bbcData = await bbcResponse.json();
        if (bbcData.success && bbcData.data && bbcData.data.length > 0) {
          // Convert BBC data to our format
          const allQuestions: any[] = [];
          
          bbcData.data.forEach((item: any, setIndex: number) => {
            // Create IELTS-style questions based on the transcript content
            interface Question {
              id: string;
              question_text: string;
              question_type: 'multiple_choice';
              sort_order: number;
              choices: Array<{
                id: string;
                choice_text: string;
                is_correct: boolean;
              }>;
            }
            
            let questions: Question[] = [];
            
            if (item.id === 'ielts-listening-1') {
              // Student Accommodation Discussion questions
              questions = [
                {
                  id: `${item.id}-1`,
                  question_text: 'How much does the new accommodation complex cost per month?',
                  question_type: 'multiple_choice',
                  sort_order: 1,
                  choices: [
                    { id: `${item.id}-1-a`, choice_text: '650 pounds', is_correct: false },
                    { id: `${item.id}-1-b`, choice_text: '800 pounds', is_correct: true },
                    { id: `${item.id}-1-c`, choice_text: '500 pounds', is_correct: false },
                    { id: `${item.id}-1-d`, choice_text: '750 pounds', is_correct: false }
                  ]
                },
                {
                  id: `${item.id}-2`,
                  question_text: 'What is included in the rent for the new accommodation?',
                  question_type: 'multiple_choice',
                  sort_order: 2,
                  choices: [
                    { id: `${item.id}-2-a`, choice_text: 'Only electricity', is_correct: false },
                    { id: `${item.id}-2-b`, choice_text: 'Utilities and internet', is_correct: true },
                    { id: `${item.id}-2-c`, choice_text: 'Just the room', is_correct: false },
                    { id: `${item.id}-2-d`, choice_text: 'All meals', is_correct: false }
                  ]
                },
                {
                  id: `${item.id}-3`,
                  question_text: 'When is the application deadline?',
                  question_type: 'multiple_choice',
                  sort_order: 3,
                  choices: [
                    { id: `${item.id}-3-a`, choice_text: 'This Friday', is_correct: false },
                    { id: `${item.id}-3-b`, choice_text: 'Next Friday', is_correct: true },
                    { id: `${item.id}-3-c`, choice_text: 'Next month', is_correct: false },
                    { id: `${item.id}-3-d`, choice_text: 'End of semester', is_correct: false }
                  ]
                }
              ];
            } else if (item.id === 'ielts-listening-2') {
              // University Library Tour questions
              questions = [
                {
                  id: `${item.id}-1`,
                  question_text: 'How many books does the library have?',
                  question_type: 'multiple_choice',
                  sort_order: 1,
                  choices: [
                    { id: `${item.id}-1-a`, choice_text: '200,000 books', is_correct: false },
                    { id: `${item.id}-1-b`, choice_text: '500,000 books', is_correct: true },
                    { id: `${item.id}-1-c`, choice_text: '50,000 books', is_correct: false },
                    { id: `${item.id}-1-d`, choice_text: '1 million books', is_correct: false }
                  ]
                },
                {
                  id: `${item.id}-2`,
                  question_text: 'What is the noise level policy for the first floor?',
                  question_type: 'multiple_choice',
                  sort_order: 2,
                  choices: [
                    { id: `${item.id}-2-a`, choice_text: 'Group discussions allowed', is_correct: false },
                    { id: `${item.id}-2-b`, choice_text: 'Quiet study area', is_correct: true },
                    { id: `${item.id}-2-c`, choice_text: 'No restrictions', is_correct: false },
                    { id: `${item.id}-2-d`, choice_text: 'Complete silence', is_correct: false }
                  ]
                },
                {
                  id: `${item.id}-3`,
                  question_text: 'How many private study rooms are available?',
                  question_type: 'multiple_choice',
                  sort_order: 3,
                  choices: [
                    { id: `${item.id}-3-a`, choice_text: '10 rooms', is_correct: false },
                    { id: `${item.id}-3-b`, choice_text: '15 rooms', is_correct: false },
                    { id: `${item.id}-3-c`, choice_text: '20 rooms', is_correct: true },
                    { id: `${item.id}-3-d`, choice_text: '25 rooms', is_correct: false }
                  ]
                }
              ];
            } else if (item.id === 'ielts-listening-3') {
              // Environmental Science Seminar questions
              questions = [
                {
                  id: `${item.id}-1`,
                  question_text: 'By how much have solar panel costs dropped in the last decade?',
                  question_type: 'multiple_choice',
                  sort_order: 1,
                  choices: [
                    { id: `${item.id}-1-a`, choice_text: '50%', is_correct: false },
                    { id: `${item.id}-1-b`, choice_text: '60%', is_correct: false },
                    { id: `${item.id}-1-c`, choice_text: '70%', is_correct: true },
                    { id: `${item.id}-1-d`, choice_text: '80%', is_correct: false }
                  ]
                },
                {
                  id: `${item.id}-2`,
                  question_text: 'What is the main challenge mentioned for solar energy?',
                  question_type: 'multiple_choice',
                  sort_order: 2,
                  choices: [
                    { id: `${item.id}-2-a`, choice_text: 'High installation costs', is_correct: false },
                    { id: `${item.id}-2-b`, choice_text: 'Storage and intermittency', is_correct: true },
                    { id: `${item.id}-2-c`, choice_text: 'Public opposition', is_correct: false },
                    { id: `${item.id}-2-d`, choice_text: 'Limited sunlight', is_correct: false }
                  ]
                },
                {
                  id: `${item.id}-3`,
                  question_text: 'What percentage of UK electricity does the government aim to generate from offshore wind by 2030?',
                  question_type: 'multiple_choice',
                  sort_order: 3,
                  choices: [
                    { id: `${item.id}-3-a`, choice_text: '30%', is_correct: false },
                    { id: `${item.id}-3-b`, choice_text: '35%', is_correct: false },
                    { id: `${item.id}-3-c`, choice_text: '40%', is_correct: true },
                    { id: `${item.id}-3-d`, choice_text: '45%', is_correct: false }
                  ]
                }
              ];
            }
            
            // Add all questions from this transcript to the main array
            questions.forEach((question, questionIndex) => {
              allQuestions.push({
                id: question.id,
                question_text: question.question_text,
                question_type: question.question_type,
                sort_order: allQuestions.length + 1,
                audio_url: item.audioUrl,
                transcript: item.transcript,
                choices: question.choices
              });
            });
          });

          console.log('All Questions loaded:', allQuestions);
          console.log('Audio URLs:', allQuestions.map((q: any) => q.audio_url));

          currentSet = {
            id: '00000000-0000-0000-0000-000000000001', // Use a proper UUID for the listening set
            title: 'IELTS Listening Practice - Academic Conversations',
            section: 'listening',
            sort_order: 1,
            questions: allQuestions
          };

          totalQuestions = currentSet.questions.length;
          answeredQuestions = 0;
          correctAnswers = 0;
          isLoading = false;
          return;
        }
      }

      // Fallback to database content
      const { data: setData, error: setError } = await supabase
        .from('practice_sets')
        .select('id, title, section, sort_order')
        .eq('section', 'listening')
        .order('sort_order')
        .limit(1)
        .single();

      if (setError) throw setError;

      // Get questions with audio files
      const { data: questionsData, error: questionsError } = await supabase
        .rpc('get_listening_questions_with_audio', { set_id_param: setData.id });

      if (questionsError) throw questionsError;

      currentSet = {
        ...setData,
        questions: questionsData || []
      };

      totalQuestions = currentSet.questions.length;
      answeredQuestions = 0;
      correctAnswers = 0;

    } catch (e) {
      error = `Failed to load listening practice: ${e}`;
      console.error('Listening practice error:', e);
    } finally {
      isLoading = false;
    }
  }

  function handleAnswer(questionId: string, answer: string) {
    userAnswers[questionId] = answer;
    answeredQuestions = Object.keys(userAnswers).length;
    
    // Clear validation errors when user answers
    validationErrors = validationErrors.filter(err => !err.includes(questionId));
  }

  // Validation function
  function validateAnswers(): boolean {
    const errors: string[] = [];
    
    if (!currentSet) {
      errors.push('No practice set loaded');
      return false;
    }
    
    // Check if all questions are answered
    for (const question of currentSet.questions) {
      if (!userAnswers[question.id]) {
        errors.push(`Question ${question.sort_order} is not answered`);
      }
    }
    
    validationErrors = errors;
    return errors.length === 0;
  }

  // Text-to-Speech function for when audio files aren't available
  let speechUtterance: SpeechSynthesisUtterance | null = $state(null);
  let isSpeaking = $state(false);
  let isPaused = $state(false);
  let speechProgress = $state(0); // Track speech progress (0-100)
  let speechStartTime = $state(0);
  let speechDuration = $state(0);
  let progressInterval: ReturnType<typeof setInterval> | null = $state(null);
  let isStartingSpeech = $state(false); // Prevent multiple speech instances

  function speakTranscript() {
    if (!currentQuestion()?.transcript) return;
    
    // Check if speech synthesis is available
    if (!window.speechSynthesis) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    // Prevent multiple speech instances
    if (isStartingSpeech) return;
    isStartingSpeech = true;

    // If already speaking, pause it
    if (isSpeaking && !isPaused) {
      try {
        speechSynthesis.pause();
        isPaused = true;
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
      } catch (e) {
        console.error('Error pausing speech:', e);
        stopSpeech();
      }
      isStartingSpeech = false;
      return;
    }

    // If paused, resume from where we left off
    if (isPaused) {
      try {
        speechSynthesis.resume();
        isPaused = false;
        // Restart progress tracking
        speechStartTime = Date.now() - (speechProgress / 100) * speechDuration * 1000;
        startProgressTracking();
      } catch (e) {
        console.error('Error resuming speech:', e);
        stopSpeech();
        // Restart from beginning
        setTimeout(() => {
          isStartingSpeech = false;
          speakTranscript();
        }, 100);
        return;
      }
      isStartingSpeech = false;
      return;
    }

    // Start new speech from the beginning
    try {
      // Cancel any existing speech first
      speechSynthesis.cancel();
      
      // Small delay to ensure cancellation is complete
      setTimeout(() => {
        speechUtterance = new SpeechSynthesisUtterance(currentQuestion()?.transcript);
        speechUtterance.rate = 0.8; // Slightly slower for IELTS practice
        speechUtterance.pitch = 1;
        speechUtterance.volume = 1;
        speechUtterance.lang = 'en-GB'; // British English for IELTS

        // Calculate estimated duration (rough estimate: 120 words per minute for slower speech)
        const transcript = currentQuestion()?.transcript;
        const wordCount = transcript ? transcript.split(' ').length : 0;
        speechDuration = (wordCount / 120) * 60; // seconds - adjusted for slower rate
        speechStartTime = Date.now();
        speechProgress = 0;

        // Set up event handlers
        speechUtterance.onstart = () => {
          isSpeaking = true;
          isPaused = false;
          isStartingSpeech = false;
          speechStartTime = Date.now();
          startProgressTracking();
          console.log('Text-to-speech started successfully');
        };

        speechUtterance.onend = () => {
          isSpeaking = false;
          isPaused = false;
          isStartingSpeech = false;
          speechProgress = 100;
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          console.log('Text-to-speech ended successfully');
        };

        speechUtterance.onerror = (event) => {
          console.error('Text-to-speech error:', event.error);
          isSpeaking = false;
          isPaused = false;
          isStartingSpeech = false;
          speechProgress = 0;
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          
          // Only show alert for serious errors, not interruptions
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
            alert('Text-to-speech failed. Please try clicking play again.');
          }
        };

        // Start speaking
        speechSynthesis.speak(speechUtterance);
      }, 50);
    } catch (e) {
      console.error('Error starting speech:', e);
      isStartingSpeech = false;
      alert('Text-to-speech is not available. Please check your browser settings.');
    }
  }

  // Start progress tracking
  function startProgressTracking() {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    progressInterval = setInterval(() => {
      if (isSpeaking && !isPaused && speechDuration > 0) {
        const elapsed = (Date.now() - speechStartTime) / 1000;
        speechProgress = Math.min((elapsed / speechDuration) * 100, 100);
        
        if (speechProgress >= 100) {
          clearInterval(progressInterval!);
          progressInterval = null;
        }
      }
    }, 100);
  }

  // Stop speech when moving to different questions
  function stopSpeech() {
    try {
      if (isSpeaking || isPaused) {
        speechSynthesis.cancel();
      }
    } catch (e) {
      console.error('Error stopping speech:', e);
    } finally {
      isSpeaking = false;
      isPaused = false;
      isStartingSpeech = false;
      speechProgress = 0;
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
    }
  }

  // Handle progress bar click to seek
  function seekSpeech(event: MouseEvent) {
    if (!currentQuestion()?.transcript) return;
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    
    console.log('Seek requested to:', percentage * 100, '%');
    
    // For text-to-speech, we can't actually seek, but we can restart from a different position
    // This is a limitation of the Web Speech API
    if (currentQuestion()?.transcript) {
      stopSpeech();
      setTimeout(() => {
        speakTranscript();
        // Set progress to clicked position
        speechProgress = percentage * 100;
        speechStartTime = Date.now() - (speechProgress / 100) * speechDuration * 1000;
      }, 100);
    }
  }

  function nextQuestion() {
    if (currentQuestionIndex < (currentSet?.questions.length || 0) - 1) {
      // Check if current question is answered
      const currentQuestionId = currentSet?.questions[currentQuestionIndex]?.id;
      if (currentQuestionId && !userAnswers[currentQuestionId]) {
        alert('Please answer this question before moving to the next one.');
        return;
      }
      
      // Stop speech completely before navigation
      stopSpeech();
      
      // Reset all speech state
      isSpeaking = false;
      isPaused = false;
      speechProgress = 0;
      speechUtterance = null;
      
      // Navigate to next question
      currentQuestionIndex++;
    }
  }

  function previousQuestion() {
    if (currentQuestionIndex > 0) {
      // Stop speech completely before navigation
      stopSpeech();
      
      // Reset all speech state
      isSpeaking = false;
      isPaused = false;
      speechProgress = 0;
      speechUtterance = null;
      
      // Navigate to previous question
      currentQuestionIndex--;
    }
  }

  async function submitPractice() {
    if (!session?.user || !currentSet) {
      console.error('No session or currentSet available');
      return;
    }

    // Validate that all questions are answered
    const unansweredQuestions = currentSet.questions.filter(q => !userAnswers[q.id]);
    if (unansweredQuestions.length > 0) {
      alert(`Please answer all questions before submitting. You have ${unansweredQuestions.length} unanswered question(s).`);
      return;
    }

    try {
      console.log('Submitting practice...');
      console.log('User answers:', Object.keys(userAnswers).length);
      console.log('Total questions:', totalQuestions);
      
      // Calculate score
      let score = 0;
      const responses = [];

      for (const question of currentSet.questions) {
        const userAnswer = userAnswers[question.id];
        console.log(`Question ${question.id}: user answer = ${userAnswer}`);
        
        if (userAnswer) {
          const isCorrect = question.choices?.find(c => c.id === userAnswer)?.is_correct || false;
          console.log(`Question ${question.id}: isCorrect = ${isCorrect}`);
          
          if (isCorrect) score++;
          
          responses.push({
            question_id: question.id,
            selected_choice_id: userAnswer,
            is_correct: isCorrect
          });
        }
      }

      console.log('Final score:', score);
      console.log('Total questions:', totalQuestions);

      // Update state
      finalScore = score;
      correctAnswers = score;
      
      // Force show results immediately
      showResults = true;
      
      console.log('Results should now be visible');
      console.log('showResults:', showResults);
      console.log('finalScore:', finalScore);

      // Force a re-render
      setTimeout(() => {
        showResults = true;
        console.log('Forced showResults update');
      }, 50);

    } catch (e) {
      console.error('Error calculating results:', e);
      alert('Error calculating results. Please try again.');
    }
  }

  function resetPractice() {
    showResults = false;
    currentQuestionIndex = 0;
    userAnswers = {};
    answeredQuestions = 0;
    correctAnswers = 0;
    finalScore = 0;
    validationErrors = [];
    submissionError = null;
    stopSpeech();
  }

  // --- Runes mode reactivity fixes ---
  const currentQuestion = $derived(() => {
    const set = currentSet as ListeningSet | null;
    if (!set || !set.questions) return null;
    return set.questions[currentQuestionIndex] || null;
  });
  
  const progressPercentage = $derived(() =>
    totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
  );

  const canSubmit = $derived(answeredQuestions === totalQuestions && totalQuestions > 0);

  // Stop speech when question changes
  $effect(() => {
    if (currentQuestion()) {
      // Only stop speech if we're actually changing questions, not on initial load
      // We'll handle this in the navigation functions instead
    }
  });
</script>

<svelte:head>
  <title>IELTS Listening Practice - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-3xl font-bold text-gray-900">IELTS Listening Practice</h1>
        <button
          onclick={() => goto('/test-prep')}
          class="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
        >
          ← Back to Test Prep
        </button>
      </div>
      
      {#if currentSet}
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">{currentSet.title}</h2>
          <p class="text-gray-600">Listen carefully to the audio and answer the questions below.</p>
        </div>
      {/if}
    </div>

    {#if isLoading}
      <div class="bg-white rounded-lg shadow p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading listening practice...</p>
      </div>
    {:else if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <p class="text-red-800">{error}</p>
        <button
          onclick={loadListeningSet}
          class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    {:else if showResults}
      <!-- Results Display -->
      <div class="bg-white rounded-lg shadow p-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">🎉 Practice Completed!</h2>
          <div class="text-6xl font-bold text-blue-600 mb-4">
            {finalScore}/{totalQuestions}
          </div>
          <div class="text-2xl text-gray-600 mb-4">
            ({Math.round((finalScore/totalQuestions)*100)}%)
          </div>
          <div class="text-xl text-gray-700 mb-6">
            {#if finalScore >= 8}
              <div class="flex items-center justify-center gap-2">
                <span>🌟</span>
                <span>Excellent! You're doing great!</span>
              </div>
            {:else if finalScore >= 6}
              <div class="flex items-center justify-center gap-2">
                <span>👍</span>
                <span>Good work! Keep practicing!</span>
              </div>
            {:else}
              <div class="flex items-center justify-center gap-2">
                <span>📚</span>
                <span>Keep studying! You'll improve with practice!</span>
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Detailed Results -->
        <div class="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 class="text-xl font-semibold text-gray-900 mb-6">Question Review</h3>
          <div class="space-y-4">
            {#each currentSet?.questions ?? [] as question, index}
              {@const userAnswer = userAnswers[question.id]}
              {@const userChoice = question.choices?.find(c => c.id === userAnswer)}
              {@const correctChoice = question.choices?.find(c => c.is_correct)}
              {@const isCorrect = userChoice?.is_correct || false}
              
              <div class="p-4 border rounded-lg {isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
                <div class="flex justify-between items-start mb-3">
                  <span class="font-semibold text-gray-900">Question {index + 1}:</span>
                  <span class="text-sm font-medium {isCorrect ? 'text-green-600' : 'text-red-600'}">
                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                
                <p class="text-gray-800 mb-3 font-medium">{question.question_text}</p>
                
                <div class="space-y-2">
                  <p class="text-sm text-gray-600">
                    <span class="font-medium">Your answer:</span> 
                    <span class="{isCorrect ? 'text-green-700' : 'text-red-700'}">
                      {userChoice?.choice_text || 'Not answered'}
                    </span>
                  </p>
                  
                  {#if !isCorrect && correctChoice}
                    <p class="text-sm text-green-700">
                      <span class="font-medium">Correct answer:</span> {correctChoice.choice_text}
                    </p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
        
        <div class="flex justify-center gap-4">
          <button
            onclick={resetPractice}
            class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            onclick={() => goto('/test-prep')}
            class="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Back to Test Prep
          </button>
        </div>
      </div>
    {:else if currentSet && currentQuestion()}
      <!-- Progress Bar -->
      <TestPrepProgress
        currentSection="listening"
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        answeredQuestions={answeredQuestions}
      />

      

      <!-- Validation Errors -->
      {#if validationErrors.length > 0}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 class="text-red-800 font-medium mb-2">Please fix the following errors:</h3>
          <ul class="text-red-700 text-sm space-y-1">
            {#each validationErrors as error}
              <li>• {error}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- Submission Error -->
      {#if submissionError}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p class="text-red-800">{submissionError}</p>
        </div>
      {/if}

      <!-- Audio Player -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Audio Player (Text-to-Speech)</h3>
          <button
            onclick={() => showTranscript = !showTranscript}
            class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            {showTranscript ? 'Hide' : 'Show'} Transcript
          </button>
        </div>

        <!-- Text-to-Speech Controls -->
        <div class="flex items-center gap-4 mb-4">
          <button
            onclick={speakTranscript}
            class="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
            title={isSpeaking && !isPaused ? 'Pause Audio' : isPaused ? 'Resume Audio' : 'Play Audio'}
          >
            {#if isSpeaking && !isPaused}
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            {:else if isPaused}
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path>
              </svg>
            {:else}
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path>
              </svg>
            {/if}
          </button>

          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm text-gray-600">
                {#if isSpeaking && !isPaused}
                  Playing transcript...
                {:else if isPaused}
                  Audio paused - click to resume
                {:else}
                  Click play to hear the transcript
                {/if}
              </span>
              {#if isSpeaking && !isPaused}
                <div class="flex space-x-1">
                  <div class="w-1 h-4 bg-blue-600 rounded animate-pulse"></div>
                  <div class="w-1 h-4 bg-blue-600 rounded animate-pulse" style="animation-delay: 0.1s"></div>
                  <div class="w-1 h-4 bg-blue-600 rounded animate-pulse" style="animation-delay: 0.2s"></div>
                </div>
              {/if}
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 cursor-pointer" 
                  onclick={seekSpeech}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      seekSpeech(e as any);
                    }
                  }}
                  role="slider"
                  tabindex="0"
                  aria-label="Audio progress"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={speechProgress}>
               <div
                 class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                 style="width: {isSpeaking || isPaused ? speechProgress + '%' : '0%'}"
               ></div>
             </div>
          </div>
        </div>
        
        <!-- Transcript -->
        {#if showTranscript && currentQuestion()?.transcript}
          <div class="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 class="font-semibold text-gray-900 mb-2">Transcript:</h4>
            <p class="text-gray-700 text-sm leading-relaxed">{currentQuestion()?.transcript}</p>
          </div>
        {/if}
      </div>

             <!-- Question -->
       <div class="bg-white rounded-lg shadow p-6 mb-6">
         <div class="flex justify-between items-center mb-4">
           <h3 class="text-lg font-semibold text-gray-900">
             Question {currentQuestionIndex + 1} of {totalQuestions}
           </h3>
           <span class="text-sm text-gray-500">
             {answeredQuestions}/{totalQuestions} answered
           </span>
         </div>

                   <p class="text-gray-800 mb-6 text-lg">{currentQuestion()?.question_text}</p>
          
          <!-- Answer reminder -->
          {#if currentSet}
            {@const currentQuestionId = currentSet.questions[currentQuestionIndex]?.id}
            {@const isCurrentQuestionAnswered = currentQuestionId ? !!userAnswers[currentQuestionId] : false}
            {#if !isCurrentQuestionAnswered}
              <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p class="text-yellow-800 text-sm">
                  <span class="font-medium">⚠️ Please answer this question before proceeding.</span>
                </p>
              </div>
            {/if}
          {/if}

        <!-- Multiple Choice Options -->
        {#if currentQuestion()?.question_type === 'multiple_choice' && currentQuestion()?.choices}
          <div class="space-y-3">
            {#each currentQuestion()?.choices ?? [] as choice}
              <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition
                {currentQuestion()?.id && choice.id ? userAnswers[String(currentQuestion()?.id)] === String(choice.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200' : ''}">
                <input
                  type="radio"
                  name="question_{currentQuestion()?.id}"
                  value={choice.id}
                  checked={currentQuestion()?.id && choice.id ? userAnswers[String(currentQuestion()?.id)] === String(choice.id) : false}
                  onchange={() => handleAnswer(String(currentQuestion()?.id || ''), String(choice.id || ''))}
                  class="mr-3"
                />
                <span class="text-gray-800">{choice.choice_text}</span>
              </label>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Navigation -->
      <div class="flex justify-between items-center">
        <button
          onclick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          class="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div class="flex gap-3">
          {#if currentQuestionIndex === totalQuestions - 1}
            <button
              onclick={submitPractice}
              disabled={!canSubmit || isSubmitting}
              class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {#if isSubmitting}
                Submitting...
              {:else}
                Submit Practice
              {/if}
            </button>
            
                                  {:else}
              {#if currentSet}
                {@const currentQuestionId = currentSet.questions[currentQuestionIndex]?.id}
                {@const isCurrentQuestionAnswered = currentQuestionId ? !!userAnswers[currentQuestionId] : false}
                <button
                  onclick={nextQuestion}
                  disabled={!isCurrentQuestionAnswered}
                  class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              {/if}
            {/if}
        </div>
      </div>
    {:else}
      <div class="bg-white rounded-lg shadow p-8 text-center">
        <p class="text-gray-600">No listening practice available at the moment.</p>
      </div>
    {/if}
  </div>
</div> 