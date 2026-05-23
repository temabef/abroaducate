<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ChevronLeft, Save, Copy, Check, ScrollText, Download } from 'lucide-svelte';

	let { data } = $props();
	let supabase = $derived(data.supabase);
	let session = $derived(data.session);

	let sop = $state<any>(null);
	let content = $state('');
	let title = $state('');
	let loading = $state(true);
	let saving = $state(false);
	let lastSaved = $state<Date | null>(null);
	let hasUnsavedChanges = $state(false);
	let showCopyToast = $state(false);
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
	let error = $state('');
	let sopId = $derived(data.sopId);

	const wordCount = $derived(content.trim().split(/\s+/).filter(Boolean).length);

	onMount(() => {
		if (!supabase || !session?.user) {
			goto('/auth');
			return;
		}
		void (async () => {
			const { data: sopData, error: dbErr } = await supabase
				.from('sops')
				.select('*')
				.eq('id', sopId)
				.eq('user_id', session.user.id)
				.maybeSingle();

			if (dbErr || !sopData) {
				error = 'Statement of purpose not found.';
				loading = false;
				return;
			}
			sop = sopData;
			content = sopData.content ?? sopData.generated_sop ?? '';
			title = sopData.program_name ?? sopData.university_name ?? 'Statement of Purpose';
			loading = false;
		})();

		return () => { if (autoSaveTimer) clearTimeout(autoSaveTimer); };
	});

	function scheduleAutoSave() {
		hasUnsavedChanges = true;
		if (autoSaveTimer) clearTimeout(autoSaveTimer);
		autoSaveTimer = setTimeout(save, 1500);
	}

	async function save() {
		if (!supabase || !sop) return;
		saving = true;
		const { error: updErr } = await supabase
			.from('sops')
			.update({
				content,
				generated_sop: content,
				program_name: title,
				word_count: wordCount,
				updated_at: new Date().toISOString()
			})
			.eq('id', sop.id);
		saving = false;
		if (!updErr) { lastSaved = new Date(); hasUnsavedChanges = false; }
	}

	async function copyContent() {
		try {
			await navigator.clipboard.writeText(content);
			showCopyToast = true;
			setTimeout(() => (showCopyToast = false), 1500);
		} catch {}
	}

	async function exportWord() {
		if (!sop) return;
		const res = await fetch('/api/export-word', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content, title, type: 'sop' })
		});
		if (res.ok) {
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.docx`;
			a.click();
			URL.revokeObjectURL(url);
		}
	}
</script>

<svelte:head>
	<title>{title} | Statement of Purpose | Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 pt-20 pb-16">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

		{#if loading}
			<div class="flex justify-center py-24">
				<div class="w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full animate-spin"></div>
			</div>
		{:else if error}
			<div class="text-center py-24">
				<p class="text-slate-500 mb-4">{error}</p>
				<button onclick={() => goto('/dashboard')} class="text-orange-500 font-semibold hover:underline">Back to Dashboard</button>
			</div>
		{:else}
			<!-- Header -->
			<div class="mb-6">
				<button onclick={() => goto('/dashboard')} class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4">
					<ChevronLeft size={16} /> Back to Dashboard
				</button>

				<div class="flex items-start justify-between gap-4">
					<div class="flex items-center gap-3 flex-1 min-w-0">
						<div class="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
							<ScrollText size={20} strokeWidth={2} />
						</div>
						<div class="flex-1 min-w-0">
							<input
								type="text"
								bind:value={title}
								oninput={scheduleAutoSave}
								class="text-2xl font-extrabold text-slate-900 bg-transparent border-0 focus:outline-none focus:ring-0 p-0 w-full truncate"
								placeholder="Statement of Purpose"
							/>
							<p class="text-xs text-slate-500 mt-0.5">
								{wordCount} words ·
								{#if saving}<span class="text-blue-500">Saving…</span>
								{:else if hasUnsavedChanges}<span class="text-amber-600">Unsaved changes</span>
								{:else if lastSaved}<span class="text-emerald-600">Saved {lastSaved.toLocaleTimeString()}</span>
								{:else}<span>Draft</span>{/if}
							</p>
						</div>
					</div>

					<div class="flex gap-2 flex-shrink-0">
						<button onclick={copyContent} class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
							{#if showCopyToast}<Check size={14} class="text-emerald-600" /> Copied{:else}<Copy size={14} /> Copy{/if}
						</button>
						<button onclick={exportWord} class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
							<Download size={14} /> Export
						</button>
						<button onclick={save} disabled={saving} class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-60">
							<Save size={14} /> {saving ? 'Saving…' : 'Save'}
						</button>
					</div>
				</div>
			</div>

			<!-- Editor -->
			<div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
				<div class="border-b border-slate-100 px-6 py-3 flex items-center justify-between">
					<span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Statement of Purpose</span>
					<span class="text-xs text-slate-400">{wordCount} words</span>
				</div>
				<textarea
					bind:value={content}
					oninput={scheduleAutoSave}
					class="w-full min-h-[600px] p-8 text-base text-slate-900 leading-relaxed resize-y focus:outline-none font-serif"
					placeholder="Start writing your statement of purpose here, or paste your existing draft..."
				></textarea>
			</div>

			<p class="text-xs text-slate-400 text-center mt-4">
				Auto-saves as you type. Use Export to download as a Word document.
			</p>
		{/if}
	</div>
</div>
