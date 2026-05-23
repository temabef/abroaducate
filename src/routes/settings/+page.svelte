<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { User, GraduationCap, CreditCard, ShieldAlert, Save, CheckCircle2, ArrowLeft, ArrowRight, Zap } from 'lucide-svelte';
	import type { PageData, ActionData } from './$types';
	import { onMount } from 'svelte';

	let { data, form }: { data: PageData, form: ActionData } = $props();

	let isSaving = $state(false);

	// Tailwind v4 parser fix: Extract inline enhance handler into a function
	const submitHandler = () => {
		isSaving = true;
		return async ({ update }: any) => {
			await update();
			isSaving = false;
		};
	};

	let activeTab = $state<'profile' | 'academic' | 'subscription' | 'account'>('profile');

	const profile = $derived(data.profile || {});
	const user = $derived(data.user);
	const subscription = $derived(data.subscription);

	onMount(() => {
		const tab = $page.url.searchParams.get('tab');
		if (tab === 'academic' || tab === 'subscription' || tab === 'account' || tab === 'profile') {
			activeTab = tab as any;
		}
	});
</script>

<svelte:head>
	<title>Settings | Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 pt-24 pb-20">
	<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header with Back Button -->
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
			<div>
				<h1 class="text-3xl font-extrabold tracking-tight text-slate-900" style="font-family: 'Outfit', sans-serif;">Account Settings</h1>
				<p class="text-slate-500 mt-1">Configure your academic identity for the Clarity Engine.</p>
			</div>
			
			<a href="/dashboard" class="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md rounded-xl font-bold transition-all shadow-sm group">
				<ArrowLeft size={18} class="group-hover:-translate-x-1 transition-transform text-slate-400" />
				Back to Dashboard
			</a>
		</div>

		<div class="flex flex-col md:flex-row gap-8">
			<!-- Sidebar Navigation -->
			<aside class="w-full md:w-64 shrink-0 flex flex-col gap-2">
				<button 
					onclick={() => activeTab = 'profile'} 
					class="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all {activeTab === 'profile' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-white hover:shadow-sm'}"
				>
					<User size={18} class={activeTab === 'profile' ? 'text-white' : 'text-slate-400'} /> Personal Profile
				</button>
				<button 
					onclick={() => activeTab = 'academic'} 
					class="w-full flex justify-between items-center px-4 py-3 rounded-xl font-bold text-sm transition-all {activeTab === 'academic' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-600 hover:bg-white hover:shadow-sm'}"
				>
					<div class="flex items-center gap-3">
						<GraduationCap size={18} class={activeTab === 'academic' ? 'text-white' : 'text-slate-400'} /> Academic Details
					</div>
					{#if (!profile.gpa || !profile.current_level) && activeTab !== 'academic'}
						<span class="relative flex h-2.5 w-2.5">
						  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
						  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
						</span>
					{/if}
				</button>
				<button 
					onclick={() => activeTab = 'subscription'} 
					class="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all {activeTab === 'subscription' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-white hover:shadow-sm'}"
				>
					<CreditCard size={18} class={activeTab === 'subscription' ? 'text-white' : 'text-slate-400'} /> Subscription
				</button>
				<button 
					onclick={() => activeTab = 'account'} 
					class="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all mt-4 {activeTab === 'account' ? 'bg-red-50 text-red-600 border border-red-100 shadow-sm' : 'text-slate-500 hover:text-red-500 hover:bg-red-50/50'}"
				>
					<ShieldAlert size={18} /> Danger Zone
				</button>
			</aside>

			<!-- Content Area -->
			<main class="flex-1 min-w-0">
				{#if activeTab === 'profile'}
					<div class="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
						<h2 class="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Personal Information</h2>
						<form method="POST" action="?/updateAccount" use:enhance={submitHandler}>
							<div class="space-y-5">
								<div>
									<label for="fullName" class="block text-sm font-bold text-slate-700 mb-1.5">Full Name</label>
									<input type="text" id="fullName" name="fullName" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" value={user.user_metadata?.full_name || ''} placeholder="John Doe">
								</div>
								<div>
									<label for="email" class="block text-sm font-bold text-slate-700 mb-1.5">Email Address <span class="font-normal text-slate-400 ml-1">(managed via auth)</span></label>
									<input type="email" id="email" class="w-full bg-slate-100/50 border border-slate-200 text-slate-500 rounded-xl px-4 py-2.5 font-medium cursor-not-allowed" value={user.email} disabled>
								</div>
							</div>
							
							<div class="mt-8 flex items-center gap-4">
								<button class="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2" disabled={isSaving}>
									{#if isSaving}Saving...{:else}<Save size={18} /> Save Profile{/if}
								</button>
								{#if form?.success && !form?.isAcademic}<div class="text-emerald-600 flex items-center text-sm font-bold animate-in fade-in slide-in-from-left-4"><CheckCircle2 size={16} class="mr-1.5" /> Saved successfully</div>{/if}
							</div>
						</form>
					</div>
					
					<div class="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mt-6">
						<h2 class="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Demographics</h2>
						<form method="POST" action="?/updateProfile" use:enhance={submitHandler}>
							<div>
								<label for="nationality" class="block text-sm font-bold text-slate-700 mb-1.5">Nationality</label>
								<input type="text" id="nationality" name="nationality" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" value={profile.nationality || ''} placeholder="e.g. Nigerian, Indian, American">
							</div>
							<div class="mt-8">
								<button class="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2" disabled={isSaving}>
									{#if isSaving}Saving...{:else}Save Demographics{/if}
								</button>
							</div>
						</form>
					</div>

				{:else if activeTab === 'academic'}
					<div class="bg-white rounded-2xl p-8 shadow-xl shadow-emerald-900/5 border-2 border-emerald-100 relative overflow-hidden">
						<!-- Decorative background blobb -->
						<div class="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

						<div class="relative z-10">
							<div class="flex items-start gap-4 mb-8">
								<div class="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
									<Zap class="text-emerald-600" size={24} />
								</div>
								<div>
									<h2 class="text-2xl font-extrabold text-slate-900">Academic Target Profile</h2>
									<p class="text-slate-500 font-medium leading-relaxed mt-1">Completing this unlocks the Clarity Engine. The AI matches these exact metrics against university passing rubrics.</p>
								</div>
							</div>
							
							<form method="POST" action="?/updateProfile" use:enhance={submitHandler}>
								<!-- We send a hidden flag to know it was academic save -->
								<input type="hidden" name="isAcademic" value="true">

								<div class="space-y-6 bg-slate-50/50 border border-slate-100 rounded-2xl p-6">
									<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div>
											<label for="current_level" class="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">Current Degree 
												{#if !profile.current_level}<span class="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">Required</span>{/if}
											</label>
											<select id="current_level" name="current_level" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm">
												<option value="">-- Select Level --</option>
												<option value="highschool" selected={profile.current_level === 'highschool'}>High School</option>
												<option value="undergraduate" selected={profile.current_level === 'undergraduate'}>Undergraduate / Bachelor's</option>
												<option value="masters" selected={profile.current_level === 'masters'}>Master's Degree</option>
											</select>
										</div>
										<div>
											<label for="target_level" class="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">Target Degree Level</label>
											<select id="target_level" name="target_level" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm">
												<option value="">-- Select Target --</option>
												<option value="masters" selected={profile.target_level === 'masters'}>Master's Degree</option>
												<option value="phd" selected={profile.target_level === 'phd'}>PhD / Doctorate</option>
											</select>
										</div>
									</div>

									<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 border-dashed">
										<div>
											<label for="field_of_study" class="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">Field of Study
												{#if !profile.field_of_study}<span class="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">Required</span>{/if}
											</label>
											<input type="text" id="field_of_study" name="field_of_study" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm" value={profile.field_of_study || ''} placeholder="e.g. Computer Science, Economics">
										</div>
										<div>
											<label for="gpa" class="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">Current GPA <span class="font-normal text-slate-400 ml-1">(US 4.0 Scale)</span>
												{#if !profile.gpa}<span class="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">Required</span>{/if}
											</label>
											<input type="number" step="0.01" min="0" max="4" id="gpa" name="gpa" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm" value={profile.gpa || ''} placeholder="e.g. 3.5">
										</div>
									</div>

									<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 border-dashed">
										<div>
											<label for="ielts_score" class="block text-sm font-bold text-slate-700 mb-1.5">IELTS Score <span class="font-normal text-slate-400 ml-1">(Optional)</span></label>
											<input type="number" step="0.5" min="0" max="9" id="ielts_score" name="ielts_score" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm" value={profile.ielts_score || ''} placeholder="e.g. 7.5">
										</div>
										<div>
											<label for="toefl_score" class="block text-sm font-bold text-slate-700 mb-1.5">TOEFL Score <span class="font-normal text-slate-400 ml-1">(Optional)</span></label>
											<input type="number" step="1" min="0" max="120" id="toefl_score" name="toefl_score" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm" value={profile.toefl_score || ''} placeholder="e.g. 100">
										</div>
									</div>
								</div>

								<div class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
									<div class="flex items-center gap-4">
										<button class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20" disabled={isSaving}>
											{#if isSaving}Saving...{:else}Save Details{/if}
										</button>
										{#if form?.success && form?.isAcademic}
											<span class="text-emerald-700 font-bold flex items-center text-sm animate-in fade-in slide-in-from-left-4"><CheckCircle2 size={18} class="mr-1.5" /> All set!</span>
										{/if}
									</div>
									
									{#if form?.success && form?.isAcademic}
										<a href="/dashboard" class="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 animate-in fade-in zoom-in ml-auto bg-indigo-50 px-4 py-2 rounded-lg">
											Return to Dashboard <ArrowRight size={16} />
										</a>
									{/if}
								</div>
							</form>
						</div>
					</div>

				{:else if activeTab === 'subscription'}
					<div class="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
						<h2 class="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Subscription Plan</h2>
						
						<div class="mt-4 p-6 border border-slate-200 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100">
							<div class="text-xs text-slate-500 font-bold tracking-widest mb-1.5 uppercase">Current Plan</div>
							<div class="text-3xl font-extrabold text-slate-900 capitalize" style="font-family: 'Outfit', sans-serif;">{subscription ? subscription.plan_type : 'Free Plan'}</div>
							{#if subscription?.status}
								<div class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
									<div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
									{subscription.status}
								</div>
							{/if}
							
							<div class="mt-6 pt-6 border-t border-slate-200">
								<div class="text-xs text-slate-500 font-bold tracking-widest mb-1.5 uppercase">Available Credits</div>
								<div class="text-2xl font-bold text-slate-900">{profile.credits !== undefined ? profile.credits : 3}</div>
								{#if !subscription}
									<p class="text-sm font-medium text-slate-500 mt-2">You receive 3 free credits to test the AI Strategy Engine.</p>
								{/if}
							</div>
						</div>
						
						<div class="mt-8 flex gap-4">
							{#if subscription}
								<a href="/pricing" class="px-6 py-3 bg-white border-2 border-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-50 transition-colors">
									Manage Billing
								</a>
							{:else}
								<a href="/pricing" class="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-900/20">
									Upgrade & Get Credits
								</a>
							{/if}
						</div>
					</div>

				{:else if activeTab === 'account'}
					<div class="bg-white rounded-2xl p-8 shadow-sm border border-red-100 relative overflow-hidden">
						<!-- Danger strip -->
						<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
						
						<h2 class="text-xl font-bold text-red-600 mb-2">Danger Zone</h2>
						<p class="text-sm font-medium text-slate-500 mb-8 border-b border-slate-100 pb-6">These actions affect your core account access and cannot be undone.</p>
						
						<div class="flex flex-col gap-5">
							<form action="/auth/logout" method="POST">
								<button class="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors border border-slate-200">
									Sign Out securely
								</button>
							</form>
							
							<button class="w-full sm:w-auto px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-colors border border-red-200">
								Permanently Delete Account
							</button>
						</div>
					</div>
				{/if}
			</main>
		</div>
	</div>
</div>
