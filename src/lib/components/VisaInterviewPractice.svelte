<script lang="ts">
    import { onMount } from 'svelte';
    import AuthenticationFlow from './AuthenticationFlow.svelte';
    // No longer importing the main site-wide footer
    // import Footer from '$lib/components/Footer.svelte';

    // Props
    let { user, supabase } = $props<{ user: any; supabase: any }>();

    // State
    let allQuestions: any[] = $state([]);
    let practiceQuestions: any[] = $state([]);
    let currentQuestionIndex = $state(0);
    let userAnswer = $state('');
    let feedbackHistory: any[] = $state([]);
    let loading = $state(false);
    let view: 'practice' | 'summary' = $state('practice');
    let loadingQuestions = $state(true);
    let subscriptionTier = $state('free');
    let questionLimit = $state(6);
    
    // Progressive engagement state
    let showAuthModal = $state(false);
    let pendingAnswer = $state(''); // Store answer during login process
    let isAuthenticated = $state(false);

    // Reactive getters
    let currentQuestion = $derived(practiceQuestions[currentQuestionIndex]);
    let currentFeedback = $derived(feedbackHistory[currentQuestionIndex]);
    let showResults = $derived(!!currentFeedback);
    let canSubmit = $derived(userAnswer.trim().length >= 10);
    let answerWordCount = $derived(userAnswer.trim().split(/\s+/).filter(w => w.length > 0).length);
    let progressPercentage = $derived(practiceQuestions.length > 0 ? ((currentQuestionIndex + 1) / practiceQuestions.length) * 100 : 0);

    // Check authentication status
    $effect(() => {
        isAuthenticated = !!user?.id;
        if (isAuthenticated && pendingAnswer) {
            // User just logged in, restore their answer and get feedback
            userAnswer = pendingAnswer;
            pendingAnswer = '';
            submitAnswer();
        }
    });

    onMount(async () => {
        await loadQuestions();
        if (isAuthenticated) {
            await loadUserProfile();
        }
        shuffleAndStart();
    });

    async function loadUserProfile() {
        if (!user?.id) return;
        
        try {
            const response = await fetch('/api/get-user-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
            });
            
            if (response.ok) {
                const data = await response.json();
                subscriptionTier = data.profile?.subscription_tier || 'free';
                
                // Updated question limits based on new structure
                const limits = {
                    free: 6,        // 1 question from each of the 6 categories
                    professional: 50,  // Updated to 50 questions
                    elite: 80       // Updated to 80+ questions
                };
                questionLimit = limits[subscriptionTier as keyof typeof limits] || 6;
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    async function loadQuestions() {
        try {
            const response = await fetch('/api/visa-interview?visa_type=F1');
            const data = await response.json();
            allQuestions = data.questions || [];
        } catch (error) {
            console.error('Failed to load questions:', error);
        } finally {
            loadingQuestions = false;
        }
    }

    function shuffleAndStart() {
        // For non-authenticated users, show only first question
        const questionsToShow = isAuthenticated ? questionLimit : 1;
        practiceQuestions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, questionsToShow);
        currentQuestionIndex = 0;
        userAnswer = '';
        feedbackHistory = [];
        view = 'practice';
    }

    function nextQuestion() {
        if (currentQuestionIndex < practiceQuestions.length - 1) {
            currentQuestionIndex++;
            userAnswer = '';
        } else {
            view = 'summary';
        }
    }

    async function handleGetFeedback() {
        if (!canSubmit) return;

        // If user is not authenticated, show login modal
        if (!isAuthenticated) {
            pendingAnswer = userAnswer; // Store the answer
            showAuthModal = true;
            return;
        }

        // If authenticated, proceed with feedback
        await submitAnswer();
    }

    async function submitAnswer() {
        if (!canSubmit || loading || !isAuthenticated) return;

        loading = true;
        try {
            const response = await fetch('/api/visa-interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: currentQuestion.question,
                    answer: userAnswer,
                    questionId: currentQuestion.id
                })
            });
            const result = await response.json();
            if (!response.ok) {
                if (result.upgradeRequired) {
                    alert(`${result.message}\n\nUpgrade to continue practicing!`);
                    return;
                }
                throw new Error(result.error);
            }
            feedbackHistory[currentQuestionIndex] = result.feedback;
            // Force reactivity by reassigning the array
            feedbackHistory = [...feedbackHistory];
            
            // After getting feedback for the first question, load more questions for authenticated user
            if (currentQuestionIndex === 0 && practiceQuestions.length === 1) {
                await loadUserProfile(); // Update limits based on subscription
                const additionalQuestions = [...allQuestions].sort(() => 0.5 - Math.random()).slice(1, questionLimit);
                practiceQuestions = [practiceQuestions[0], ...additionalQuestions];
            }
        } catch (error: any) {
            console.error('Submission error:', error);
            alert(error.message || 'Failed to get feedback');
        } finally {
            loading = false;
        }
    }

    function onAuthSuccess() {
        showAuthModal = false;
        // Effect will handle restoring answer and submitting
    }

    function onAuthClose() {
        showAuthModal = false;
        pendingAnswer = ''; // Clear pending answer if user cancels
    }

    function getScoreColor(score: number): string {
        if (score >= 8) return 'text-green-600';
        if (score >= 6) return 'text-yellow-600';
        return 'text-red-600';
    }

    function getScoreBg(score: number): string {
        if (score >= 8) return 'bg-green-100';
        if (score >= 6) return 'bg-yellow-100';
        return 'bg-red-100';
    }

    function getCategoryEmoji(category: string): string {
        const emojis: Record<string, string> = {
            'background': '👤',
            'academic': '📚',
            'financial': '💰',
            'ties': '🏠',
            'plans': '🎯',
            'motivation': '💡'
        };
        return emojis[category] || '❓';
    }

    function getDifficultyColor(difficulty: string): string {
        const colors: Record<string, string> = {
            'basic': 'bg-green-100 text-green-800',
            'intermediate': 'bg-yellow-100 text-yellow-800',
            'advanced': 'bg-red-100 text-red-800'
        };
        return colors[difficulty] || 'bg-gray-100 text-gray-800';
    }
</script>

<div class="space-y-8">
    {#if loadingQuestions}
        <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-slate-600">Loading interview questions...</p>
        </div>
    {:else if view === 'practice' && currentQuestion}
        <!-- Practice View -->
        <!-- Progress Bar -->
        <div>
            <div class="flex justify-between mb-1">
                <span class="text-base font-medium text-blue-700">Practice Progress</span>
                <span class="text-sm font-medium text-blue-700">
                    Question {currentQuestionIndex + 1} of {practiceQuestions.length}
                    {#if !isAuthenticated}
                        <span class="text-gray-500">(Sign in to access more questions)</span>
                    {/if}
                </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    class="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style="width: {progressPercentage}%"
                ></div>
            </div>
        </div>

        <!-- Question & Answer Area -->
        <div class="bg-white rounded-lg shadow-xl p-6 border-t-4 border-blue-500">
            <div class="mb-4 flex flex-wrap gap-2">
                <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize"
                    >{getCategoryEmoji(currentQuestion.category)} {currentQuestion.category.replace(
                        '_',
                        ' '
                    )}</span
                >
                <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getDifficultyColor(
                        currentQuestion.difficulty
                    )}"
                    >{currentQuestion.difficulty}</span
                >
                <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                    >F-1 Visa</span
                >
                {#if !isAuthenticated}
                    <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >✨ Free Preview</span
                    >
                {/if}
            </div>
            <h2 class="text-xl font-semibold text-slate-900 mb-4">📝 {currentQuestion.question}</h2>

            <div class="space-y-4">
                <div>
                    <label for="userAnswer" class="block text-sm font-medium text-slate-700 mb-2"
                        >Your Answer:</label
                    >
                    <textarea
                        id="userAnswer"
                        bind:value={userAnswer}
                        placeholder="Type your answer here... Be clear, concise, and honest."
                        class="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        disabled={loading || showResults}
                    ></textarea>
                    <div class="mt-2 flex justify-between text-sm text-slate-500">
                        <span>Word count: {answerWordCount}</span>
                        {#if !canSubmit && !showResults}
                            <span class="text-red-500">Please write at least 10 words to get feedback.</span>
                        {:else}
                            <span class={answerWordCount >= 30 && answerWordCount <= 100 ? 'text-green-600' : ''}
                                >Recommended: 30-100 words</span
                            >
                        {/if}
                    </div>
                </div>
                {#if !showResults}
                    <div class="flex gap-3">
                        <button
                            onclick={handleGetFeedback}
                            disabled={!canSubmit || loading}
                            class="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition duration-200 font-medium"
                        >
                            {#if loading}
                                <div class="flex items-center justify-center">
                                    <div
                                        class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                                    ></div>
                                    <span>Getting Feedback...</span>
                                </div>
                            {:else if !isAuthenticated}
                                🚀 Get AI Feedback (Sign in required)
                            {:else}
                                ✨ Get AI Feedback
                            {/if}
                        </button>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Feedback Section -->
        {#if showResults && currentFeedback}
            <div class="bg-white rounded-lg shadow-xl p-6 space-y-4 border-t-4 border-green-500">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold text-slate-900">🤖 AI Feedback</h3>
                    <div class="flex items-center space-x-2">
                        <span class="text-sm text-slate-500">Score:</span><span
                            class="text-2xl font-bold {getScoreColor(
                                currentFeedback.score
                            )} px-3 py-1 rounded-lg {getScoreBg(currentFeedback.score)}"
                            >{currentFeedback.score}/10</span
                        >
                    </div>
                </div>
                <div class="bg-slate-50 rounded-lg p-4">
                    <h4 class="font-medium text-slate-900 mb-2">📋 Overall Assessment</h4>
                    <p class="text-slate-700">{currentFeedback.overall}</p>
                </div>
                {#if currentFeedback.strengths?.length > 0}
                    <div class="bg-green-50 rounded-lg p-4">
                        <h4 class="font-medium text-green-900 mb-2">✅ Strengths</h4>
                        <ul class="space-y-1 list-disc list-inside">
                            {#each currentFeedback.strengths as strength}
                                <li class="text-green-800 text-sm">{strength}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}
                {#if currentFeedback.improvements?.length > 0}
                    <div class="bg-yellow-50 rounded-lg p-4">
                        <h4 class="font-medium text-yellow-900 mb-2">🎯 Areas for Improvement</h4>
                        <ul class="space-y-1 list-disc list-inside">
                            {#each currentFeedback.improvements as improvement}
                                <li class="text-yellow-800 text-sm">{improvement}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}
                {#if currentFeedback.tips?.length > 0}
                    <div class="bg-blue-50 rounded-lg p-4">
                        <h4 class="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
                        <ul class="space-y-1 list-disc list-inside">
                            {#each currentFeedback.tips as tip}
                                <li class="text-blue-800 text-sm">{tip}</li>
                            {/each}
                        </ul>
                    </div>
                {/if}
                <div class="flex gap-3 pt-4">
                    <button
                        onclick={nextQuestion}
                        class="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition duration-200 font-medium"
                    >
                        🚀 Next Question
                    </button>
                </div>
            </div>
        {/if}
    {:else if view === 'summary'}
        <!-- Summary View -->
        <div class="bg-white rounded-lg shadow-xl p-8 space-y-6 text-center">
            <h2 class="text-3xl font-bold text-slate-800">Practice Session Complete!</h2>
            <p class="text-slate-600">
                Well done! Here's a summary of your performance across your practice session.
            </p>
            <div class="py-4">
                <div
                    class="text-6xl font-bold text-blue-600"
                >
                    {(
                        feedbackHistory.reduce((sum, f) => sum + f.score, 0) / feedbackHistory.length
                    ).toFixed(1)}
                </div>
                <div class="text-slate-500">Average Score</div>
            </div>
            <div class="text-left grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-green-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-green-800 mb-2">Recurring Strengths</h4>
                    <ul class="list-disc list-inside text-sm text-green-700 space-y-1">
                        {#each [...new Set(feedbackHistory.flatMap(f => f.strengths || []))].slice(0, 5) as strength}
                            <li>{strength}</li>
                        {/each}
                    </ul>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-yellow-800 mb-2">Common Areas for Improvement</h4>
                    <ul class="list-disc list-inside text-sm text-yellow-700 space-y-1">
                        {#each [...new Set(feedbackHistory.flatMap(f => f.improvements || []))].slice(0, 5) as improvement}
                            <li>{improvement}</li>
                        {/each}
                    </ul>
                </div>
            </div>
            <button
                onclick={shuffleAndStart}
                class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold mt-4"
            >
                🔄 Start New Session
            </button>
        </div>
    {/if}
</div>

<!-- Authentication Modal -->
{#if showAuthModal}
    <AuthenticationFlow 
        bind:show={showAuthModal} 
        {supabase} 
        mode="login" 
        returnUrl="/visa-interview-practice"
        on:success={onAuthSuccess}
        on:close={onAuthClose}
    />
{/if} 