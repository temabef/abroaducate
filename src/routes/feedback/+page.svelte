<script lang="ts">
	import { Star, Send, CheckCircle2, Sparkles, AlertCircle, MessageCircle, Award } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let session = $derived(data.session);

	let usedSOP = $state<boolean | null>(null);
	let usedScholarshipRadar = $state<boolean | null>(null);
	let wasBeneficial = $state<number | null>(null);
	let whatWorked = $state('');
	let whatToImprove = $state('');
	let wouldRecommend = $state<string | null>(null);
	let canFeatureTestimonial = $state(false);

	let isSubmitting = $state(false);
	let submitted = $state(false);
	let errorMessage = $state<string | null>(null);

	const stars = [1, 2, 3, 4, 5];

	// Handle form response
	$effect(() => {
		if (form?.success) {
			submitted = true;
			errorMessage = null;
		} else if (form?.error) {
			errorMessage = form.error;
		}
	});
</script>

<svelte:head>
	<title>Share Your Feedback - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-emerald-50 flex flex-col items-center pt-20 pb-20 px-4">
	<div class="w-full max-w-2xl">
		<!-- Header -->
		<div class="text-center mb-10">
			<div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
				<MessageCircle size={32} class="text-white" />
			</div>
			<h1 class="text-4xl font-extrabold text-slate-900 mb-3">Help Us Build Something Amazing</h1>
			<p class="text-slate-600 text-lg">Your feedback shapes Abroaducate's future. As a thank you, we'll add <span class="font-bold text-orange-600">20 free credits</span> to your account.</p>
		</div>

		{#if submitted}
			<!-- Success State -->
			<div class="bg-white rounded-3xl shadow-xl border border-emerald-200 p-12 text-center">
				<div class="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
					<Award size={48} class="text-emerald-600" />
				</div>
				<h2 class="text-2xl font-bold text-slate-900 mb-3">Thank You!</h2>
				<p class="text-slate-600 mb-2">Your feedback has been received and <span class="font-bold text-emerald-600">20 credits have been added</span> to your account.</p>
				<p class="text-sm text-slate-500 mb-6">Account: <span class="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{session?.user?.email}</span></p>
				<a href="/dashboard" class="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all">
					Go to Dashboard
				</a>
			</div>
		{:else}
			<!-- Feedback Form -->
			{#if errorMessage}
				<div class="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 flex items-start gap-3">
					<AlertCircle size={24} class="text-red-600 flex-shrink-0 mt-0.5" />
					<div>
						<h3 class="font-bold text-red-900 mb-1">Unable to Submit</h3>
						<p class="text-red-700 text-sm">{errorMessage}</p>
					</div>
				</div>
			{/if}

			<form 
				method="POST" 
				action="?/submitFeedback"
				class="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
				use:enhance={() => {
					isSubmitting = true;
					errorMessage = null;
					return async ({ update, result }) => {
						await update();
						isSubmitting = false;
						if (result.type === 'success') {
							submitted = true;
						}
					};
				}}
			>
				<div class="bg-gradient-to-r from-orange-500 via-emerald-500 to-blue-500 h-2"></div>
				
				<div class="p-8 space-y-8">
					<!-- Question 1: Generated SOP -->
					<div class="space-y-3">
						<label class="block text-sm font-bold text-slate-900 uppercase tracking-wide">
							Did you generate an SOP or other application document?
						</label>
						<div class="flex gap-3">
							<button 
								type="button"
								class="flex-1 px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all {usedSOP === true ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}"
								onclick={() => usedSOP = true}
							>
								Yes
							</button>
							<button 
								type="button"
								class="flex-1 px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all {usedSOP === false ? 'bg-slate-100 border-slate-400 text-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}"
								onclick={() => usedSOP = false}
							>
								No
							</button>
						</div>
						<input type="hidden" name="usedSOP" value={usedSOP === null ? '' : usedSOP ? 'yes' : 'no'} />
					</div>

					<!-- Question 2: Used Scholarship Radar -->
					<div class="space-y-3">
						<label class="block text-sm font-bold text-slate-900 uppercase tracking-wide">
							Did you use the Scholarship Radar feature?
						</label>
						<div class="flex gap-3">
							<button 
								type="button"
								class="flex-1 px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all {usedScholarshipRadar === true ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}"
								onclick={() => usedScholarshipRadar = true}
							>
								Yes
							</button>
							<button 
								type="button"
								class="flex-1 px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all {usedScholarshipRadar === false ? 'bg-slate-100 border-slate-400 text-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}"
								onclick={() => usedScholarshipRadar = false}
							>
								No
							</button>
						</div>
						<input type="hidden" name="usedScholarshipRadar" value={usedScholarshipRadar === null ? '' : usedScholarshipRadar ? 'yes' : 'no'} />
					</div>

					<div class="h-px bg-slate-100"></div>

					<!-- Question 3: Rating -->
					<div class="space-y-3">
						<label class="block text-sm font-bold text-slate-900 uppercase tracking-wide">
							How beneficial was your experience? (1-5 stars)
						</label>
						<div class="flex gap-2 justify-center">
							{#each stars as star}
								<button
									type="button"
									class="transition-transform hover:scale-110"
									onclick={() => wasBeneficial = star}
								>
									<Star 
										size={40} 
										class={wasBeneficial !== null && star <= wasBeneficial ? 'fill-orange-500 text-orange-500' : 'text-slate-300'}
									/>
								</button>
							{/each}
						</div>
						<input type="hidden" name="rating" value={wasBeneficial || ''} />
					</div>

					<div class="h-px bg-slate-100"></div>

					<!-- Question 4: What worked well -->
					<div class="space-y-3">
						<label class="block text-sm font-bold text-slate-900 uppercase tracking-wide" for="whatWorked">
							What worked well for you?
						</label>
						<textarea 
							id="whatWorked"
							name="whatWorked"
							bind:value={whatWorked}
							rows="4"
							class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-slate-800 resize-none"
							placeholder="Tell us what you found most helpful..."
						></textarea>
					</div>

					<!-- Question 5: What to improve -->
					<div class="space-y-3">
						<label class="block text-sm font-bold text-slate-900 uppercase tracking-wide" for="whatToImprove">
							What should we improve?
						</label>
						<textarea 
							id="whatToImprove"
							name="whatToImprove"
							bind:value={whatToImprove}
							rows="4"
							class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-slate-800 resize-none"
							placeholder="Share your suggestions for improvement..."
						></textarea>
					</div>

					<div class="h-px bg-slate-100"></div>

					<!-- Question 6: Would recommend -->
					<div class="space-y-3">
						<label class="block text-sm font-bold text-slate-900 uppercase tracking-wide">
							Would you recommend Abroaducate to a friend?
						</label>
						<div class="grid grid-cols-3 gap-3">
							<button 
								type="button"
								class="px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all {wouldRecommend === 'yes' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}"
								onclick={() => wouldRecommend = 'yes'}
							>
								Yes
							</button>
							<button 
								type="button"
								class="px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all {wouldRecommend === 'maybe' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}"
								onclick={() => wouldRecommend = 'maybe'}
							>
								Maybe
							</button>
							<button 
								type="button"
								class="px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all {wouldRecommend === 'no' ? 'bg-slate-100 border-slate-400 text-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'}"
								onclick={() => wouldRecommend = 'no'}
							>
								No
							</button>
						</div>
						<input type="hidden" name="wouldRecommend" value={wouldRecommend || ''} />
					</div>

					<!-- Question 7: Testimonial permission -->
					<div class="space-y-3">
						<label class="flex items-start gap-3 cursor-pointer group">
							<input 
								type="checkbox" 
								name="canFeatureTestimonial"
								bind:checked={canFeatureTestimonial}
								class="mt-1 w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
							/>
							<span class="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
								You can feature my feedback as a testimonial on the website (we'll reach out for permission before publishing)
							</span>
						</label>
					</div>
				</div>

				<!-- Submit Button -->
				<div class="bg-slate-50 px-8 py-6 border-t border-slate-200 flex items-center justify-between">
					<p class="text-sm text-slate-500">Response will be sent to <span class="font-mono text-xs bg-white px-2 py-1 rounded">hello@abroaducate.com</span></p>
					<button 
						type="submit"
						disabled={isSubmitting || wasBeneficial === null}
						class="px-8 py-3 bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-600 hover:to-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isSubmitting}
							<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
							Submitting...
						{:else}
							<Send size={16} /> Submit Feedback
						{/if}
					</button>
				</div>
			</form>
		{/if}

		<!-- Footer Note -->
		{#if !submitted}
			<p class="text-center text-sm text-slate-500 mt-6">
				Your honest feedback helps us serve African students seeking opportunities abroad. Thank you for being part of the journey!
			</p>
		{/if}
	</div>
</div>
