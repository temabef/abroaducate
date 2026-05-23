<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { ChevronLeft, Save, Copy, Check, PenLine, Download } from 'lucide-svelte';

	let { data } = $props();
	let supabase = $derived(data.supabase);
	let ps = $state<any>(data.personalStatement);

	let content = $state<string>(ps?.content ?? ps?.generated_content ?? '');
	let title = $state<string>(ps?.program_name ?? ps?.university_name ?? 'Personal Statement');
	let saving = $state(false);
	let lastSaved = $state<Date | null>(null);
	let hasUnsavedChanges = $state(false);
	let showCopyToast = $state(false);
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

	const wordCount = $derived(content.trim().split(/\s+/).filter(Boolean).length);

	function scheduleAutoSave() {
		hasUnsavedChanges = true;
		if (autoSaveTimer) clearTimeout(autoSaveTimer);
		autoSaveTimer = setTimeout(save, 1500);
	}

	async function save() {
		if (!supabase || !ps) return;
		saving = true;
		const { error } = await supabase
			.from('personal_statements')
			.update({
				content,
				generated_content: content,
				program_name: title,
				word_count: wordCount,
				updated_at: new Date().toISOString()
			})
			.eq('id', ps.id);
		saving = false;
		if (!error) { lastSaved = new Date(); hasUnsavedChanges = false; }
	}

	async function copyContent() {
		try {
			await navigator.clipboard.writeText(content);
			showCopyToast = true;
			setTimeout(() => (showCopyToast = false), 1500);
		} catch {}
	}

	async function exportWord() {
		if (!ps) return;
		const res = await fetch('/api/export-word', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content, title, type: 'personal-statement' })
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

	onMount(() => {
		return () => { if (autoSaveTimer) clearTimeout(autoSaveTimer); };
	});
</script>

<svelte:head>
	<title>{title} | Personal Statement | Abroaducate</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 pt-20 pb-16">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-6">
			<button onclick={() => goto('/dashboard')} class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4">
				<ChevronLeft size={16} /> Back to Dashboard
			</button>

			<div class="flex items-start justify-between gap-4">
				<div class="flex items-center gap-3 flex-1 min-w-0">
					<div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
						<PenLine size={20} strokeWidth={2} />
					</div>
					<div class="flex-1 min-w-0">
						<input
							type="text"
							bind:value={title}
							oninput={scheduleAutoSave}
							class="text-2xl font-extrabold text-slate-900 bg-transparent border-0 focus:outline-none focus:ring-0 p-0 w-full truncate"
							placeholder="Personal Statement"
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
				<span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Personal Statement</span>
				<span class="text-xs text-slate-400">{wordCount} words</span>
			</div>
			<textarea
				bind:value={content}
				oninput={scheduleAutoSave}
				class="w-full min-h-[600px] p-8 text-base text-slate-900 leading-relaxed resize-y focus:outline-none font-serif"
				placeholder="Start writing your personal statement here, or paste your existing draft..."
			></textarea>
		</div>

		<p class="text-xs text-slate-400 text-center mt-4">
			Auto-saves as you type. Use Export to download as a Word document.
		</p>
	</div>
</div>
