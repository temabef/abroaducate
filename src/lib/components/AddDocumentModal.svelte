
<script lang="ts">
	import { X, FileText, Save, ScrollText, Mail, PenLine, GraduationCap } from 'lucide-svelte';

	let {
		show = $bindable(false),
		onCreated = (_info: { id: string; type: string; title: string }) => {}
	} = $props<{
		show: boolean;
		onCreated?: (info: { id: string; type: string; title: string }) => void;
	}>();

	type DocType = 'sop' | 'cover-letter' | 'personal-statement' | 'academic-cv';

	const TYPES: { value: DocType; label: string; hint: string; iconName: string }[] = [
		{ value: 'sop', label: 'Statement of Purpose', hint: 'SOP / motivation letter', iconName: 'sop' },
		{ value: 'cover-letter', label: 'Cover Letter', hint: 'For programs & professors', iconName: 'cl' },
		{ value: 'personal-statement', label: 'Personal Statement', hint: 'Scholarship & admission', iconName: 'ps' },
		{ value: 'academic-cv', label: 'Academic CV', hint: 'Research & academic roles', iconName: 'cv' }
	];

	let docType = $state<DocType>('sop');
	let title = $state('');
	let content = $state('');
	let saving = $state(false);
	let errorMsg = $state('');

	$effect(() => {
		if (show) {
			// reset on open
			docType = 'sop';
			title = '';
			content = '';
			errorMsg = '';
		}
	});

	const wordCount = $derived(content.trim().split(/\s+/).filter(Boolean).length);

	async function save() {
		errorMsg = '';
		if (!title.trim()) { errorMsg = 'Give your document a title'; return; }
		if (content.trim().length < 30) { errorMsg = 'Content is too short (min 30 characters)'; return; }

		saving = true;
		try {
			const res = await fetch('/api/documents/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: docType, title: title.trim(), content: content.trim() })
			});
			if (!res.ok) {
				const j = await res.json().catch(() => ({}));
				errorMsg = j?.message || j?.error || `Failed to save (${res.status})`;
				return;
			}
			const j = await res.json();
			onCreated({ id: j.id, type: j.type, title: j.title });
			show = false;
		} catch (e: any) {
			errorMsg = e?.message ?? 'Failed to save document';
		} finally {
			saving = false;
		}
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
		<div class="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
			<div class="bg-slate-900 px-6 py-5 flex justify-between items-center text-white">
				<div>
					<h3 class="text-lg font-bold flex items-center gap-2"><FileText size={18} /> Add existing document</h3>
					<p class="text-slate-400 text-xs mt-1">Paste the text of an SOP, cover letter, or CV you've already written.</p>
				</div>
				<button onclick={() => (show = false)} class="text-slate-400 hover:text-white transition-colors" aria-label="Close">
					<X size={18} />
				</button>
			</div>

			<div class="p-6">
				<!-- Document type -->
				<p class="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Type</p>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
					{#each TYPES as t}
						<button
							onclick={() => (docType = t.value)}
							class="flex flex-col items-start gap-1 border rounded-lg p-3 text-left transition-all {docType === t.value
								? 'border-orange-500 bg-orange-50'
								: 'border-slate-200 hover:border-slate-300'}"
						>
							<div class="flex items-center gap-2">
								{#if t.iconName === 'sop'}<ScrollText size={16} class="text-orange-600" />
								{:else if t.iconName === 'cl'}<Mail size={16} class="text-emerald-600" />
								{:else if t.iconName === 'ps'}<PenLine size={16} class="text-blue-600" />
								{:else}<GraduationCap size={16} class="text-purple-600" />
								{/if}
								<span class="text-xs font-bold text-slate-900">{t.label}</span>
							</div>
							<span class="text-[10px] text-slate-500">{t.hint}</span>
						</button>
					{/each}
				</div>

				<!-- Title -->
				<div class="mb-4">
					<label for="add-doc-title" class="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Title</label>
					<input
						id="add-doc-title"
						type="text"
						bind:value={title}
						placeholder="e.g. My Master's SOP draft"
						class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
					/>
				</div>

				<!-- Content -->
				<div class="mb-4">
					<label for="add-doc-content" class="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Content</label>
					<textarea
						id="add-doc-content"
						bind:value={content}
						placeholder="Paste the full text of your document here..."
						class="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[220px] resize-y"
					></textarea>
					<div class="flex justify-between text-xs text-slate-400 mt-1">
						<span>Minimum 30 characters</span>
						<span>{wordCount} words</span>
					</div>
				</div>

				{#if errorMsg}
					<div class="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2 mb-4">{errorMsg}</div>
				{/if}

				<div class="flex gap-3">
					<button
						onclick={() => (show = false)}
						class="flex-1 text-slate-600 font-semibold py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
					>
						Cancel
					</button>
					<button
						onclick={save}
						disabled={saving || content.trim().length < 30 || !title.trim()}
						class="flex-1 bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors flex justify-center items-center gap-2 disabled:bg-slate-200 disabled:text-slate-400"
					>
						{#if saving}
							Saving…
						{:else}
							<Save size={14} /> Save document
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
