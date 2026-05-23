<script lang="ts">
	import { User, GraduationCap, MapPin, Target, ChevronLeft, Save } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let { data } = $props();
	let { profile } = $derived(data);
	
	let isSaving = $state(false);

	// Ensure fields are defined to prevent undefined values in bindings
	let formState = $state({
		field_of_study: '',
		current_level: '',
		target_level: '',
		gpa: '',
		ielts_score: '',
		toefl_score: '',
		nationality: ''
	});

	$effect(() => {
		formState.field_of_study = profile?.field_of_study || '';
		formState.current_level = profile?.current_level || '';
		formState.target_level = profile?.target_level || '';
		formState.gpa = profile?.gpa || '';
		formState.ielts_score = profile?.ielts_score || '';
		formState.toefl_score = profile?.toefl_score || '';
		formState.nationality = profile?.nationality || '';
	});
</script>

<svelte:head>
	<title>Build Your Profile - Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 flex flex-col items-center pt-10 pb-20 px-4">
	<div class="w-full max-w-3xl">
		<a href="/dashboard" class="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-6">
			<ChevronLeft size={16} /> Back to Dashboard
		</a>
		
		<div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
			<!-- Header -->
			<div class="bg-slate-900 px-8 py-10 relative overflow-hidden">
				<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-emerald-500 to-blue-500"></div>
				<div class="absolute -right-10 -top-10 opacity-10">
					<User size={150} />
				</div>
				<div class="relative z-10">
					<h1 class="text-3xl font-extrabold text-white mb-2">Build Your Profile</h1>
					<p class="text-slate-400 text-sm max-w-xl">
						The more details you provide, the more accurate your Clarity Engine match scores and funding strategies will be.
					</p>
				</div>
			</div>

			<!-- Form -->
			<form 
				method="POST" 
				action="?/updateProfile"
				class="p-8 space-y-10"
				use:enhance={() => {
					isSaving = true;
					return async ({ update }) => {
						await update();
						isSaving = false;
					};
				}}
			>
				<!-- Section 1: Demographics -->
				<div>
					<div class="flex items-center gap-2 mb-6">
						<MapPin size={20} class="text-blue-500" />
						<h2 class="text-lg font-bold text-slate-900 uppercase tracking-wide">Demographics</h2>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="space-y-2">
							<label class="block text-sm font-bold text-slate-700" for="nationality">Nationality</label>
							<input type="text" id="nationality" name="nationality" bind:value={formState.nationality} class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-slate-800" placeholder="e.g. Nigerian, Indian, US">
						</div>
					</div>
				</div>

				<div class="h-px bg-slate-100"></div>

				<!-- Section 2: Academic Background -->
				<div>
					<div class="flex items-center gap-2 mb-6">
						<GraduationCap size={20} class="text-emerald-500" />
						<h2 class="text-lg font-bold text-slate-900 uppercase tracking-wide">Academic Background</h2>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="space-y-2">
							<label class="block text-sm font-bold text-slate-700" for="current_level">Current Degree Level</label>
							<select id="current_level" name="current_level" bind:value={formState.current_level} class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-slate-800">
								<option value="">Select Level</option>
								<option value="High School">High School</option>
								<option value="Bachelors">Bachelor's Degree</option>
								<option value="Masters">Master's Degree</option>
							</select>
						</div>
						<div class="space-y-2">
							<label class="block text-sm font-bold text-slate-700" for="gpa">Cumulative GPA / Grade</label>
							<input type="number" step="0.01" id="gpa" name="gpa" bind:value={formState.gpa} class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-slate-800" placeholder="e.g. 3.8">
							<p class="text-[11px] text-slate-400 font-medium">Use your local scale (e.g., 3.8/4.0 or 75%)</p>
						</div>
						<div class="space-y-2">
							<label class="block text-sm font-bold text-slate-700" for="ielts_score">IELTS Score (Optional)</label>
							<input type="number" step="0.5" id="ielts_score" name="ielts_score" bind:value={formState.ielts_score} class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-slate-800" placeholder="e.g. 7.5">
						</div>
						<div class="space-y-2">
							<label class="block text-sm font-bold text-slate-700" for="toefl_score">TOEFL Score (Optional)</label>
							<input type="number" id="toefl_score" name="toefl_score" bind:value={formState.toefl_score} class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-slate-800" placeholder="e.g. 100">
						</div>
					</div>
				</div>

				<div class="h-px bg-slate-100"></div>

				<!-- Section 3: Future Goals -->
				<div>
					<div class="flex items-center gap-2 mb-6">
						<Target size={20} class="text-orange-500" />
						<h2 class="text-lg font-bold text-slate-900 uppercase tracking-wide">Target Program</h2>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="space-y-2">
							<label class="block text-sm font-bold text-slate-700" for="target_level">Target Degree Level</label>
							<select id="target_level" name="target_level" bind:value={formState.target_level} class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-slate-800">
								<option value="">Select Level</option>
								<option value="Bachelors">Bachelor's Degree</option>
								<option value="Masters">Master's Degree</option>
								<option value="PhD">PhD</option>
							</select>
						</div>
						<div class="space-y-2">
							<label class="block text-sm font-bold text-slate-700" for="field_of_study">Target Field of Study</label>
							<input type="text" id="field_of_study" name="field_of_study" bind:value={formState.field_of_study} class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-slate-800" placeholder="e.g. Computer Science, Public Health">
						</div>
					</div>
				</div>

				<!-- Footer Actions -->
				<div class="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
					<a href="/dashboard" class="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</a>
					<button type="submit" disabled={isSaving} class="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2 disabled:opacity-70">
						{#if isSaving}
							<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
							Saving...
						{:else}
							<Save size={16} /> Save Profile
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
