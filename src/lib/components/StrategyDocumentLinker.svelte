
<script lang="ts">
	import { X, FileText, ArrowRight, Zap, CheckCircle2, Upload } from 'lucide-svelte';

	let {
		show = $bindable(false),
		userDocuments = [],
		scholarshipTitle = 'this scholarship',
		onProcessGeneration = (_info: any) => {}
	} = $props<{
		show: boolean;
		userDocuments: any[];
		scholarshipTitle?: string;
		onProcessGeneration: (info: any) => void;
	}>();

	let mode = $state<'select' | 'paste'>('select');
	let selectedDocId = $state<string | null>(null);
	let pastedText = $state('');
	let pastedTitle = $state('');
	let saving = $state(false);

	// Auto-default to the first document when modal opens
	$effect(() => {
		if (show) {
			if (userDocuments.length > 0) {
				mode = 'select';
				if (!selectedDocId) selectedDocId = userDocuments[0].id;
			} else {
				mode = 'paste';
			}
		}
	});

	async function handleGenerate() {
		if (mode === 'select') {
			const doc = userDocuments.find((d: any) => d.id === selectedDocId);
			if (!doc) return;
			onProcessGeneration({
				docId: doc.id,
				type: doc.type,
				name: doc.program_name || 'My Document'
			});
			show = false;
			return;
		}

		// Paste mode — save to DB first, then pass the new doc ID
		const text = pastedText.trim();
		if (text.length < 50) return;
		saving = true;
		try {
			const res = await fetch('/api/documents/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'sop',
					title: pastedTitle.trim() || 'Pasted Document',
					content: text
				})
			});
			if (res.ok) {
				const j = await res.json();
				onProcessGeneration({
					docId: j.id,
					type: 'sop',
					name: pastedTitle.trim() || 'Pasted Document',
					text
				});
			} else {
				// Fall back to sending text directly — strategy endpoint will save it
				onProcessGeneration({
					text,
					name: pastedTitle.trim() || 'Pasted Document'
				});
			}
		} catch {
			onProcessGeneration({
				text,
				name: pastedTitle.trim() || 'Pasted Document'
			});
		} finally {
			saving = false;
			show = false;
			// reset for next time
			pastedText = '';
			pastedTitle = '';
		}
	}

	function handleSkip() {
		onProcessGeneration({ text: null, name: null });
		show = false;
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
		<div class="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
			<!-- Header -->
			<div class="bg-slate-900 px-6 py-5 flex justify-between items-center text-white">
				<div>
					<h3 class="text-lg font-bold flex items-center gap-2">
						<Zap size={18} class="text-orange-400" fill="currentColor" />
						Get a stronger strategy
					</h3>
					<p class="text-slate-400 text-xs mt-1">
						Adding your document lets the AI audit your actual writing.
					</p>
				</div>
				<button onclick={() => (show = false)} class="text-slate-400 hover:text-white transition-colors" aria-label="Close">
					<X size={18} />
				</button>
			</div>

			<!-- Body -->
			<div class="p-6">
				<p class="text-sm text-slate-600 mb-4">
					For <strong class="text-slate-900">{scholarshipTitle}</strong>, the AI can give you specific rewrite
					suggestions if you share your SOP or personal statement. Otherwise it will give generic advice.
				</p>

				{#if userDocuments.length > 0}
					<!-- Tabs: saved vs paste -->
					<div class="flex bg-slate-100 rounded-lg p-1 mb-4">
						<button
							class="flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors {mode === 'select'
								? 'bg-white text-slate-900 shadow-sm'
								: 'text-slate-500'}"
							onclick={() => (mode = 'select')}
						>
							Your documents
						</button>
						<button
							class="flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors {mode === 'paste'
								? 'bg-white text-slate-900 shadow-sm'
								: 'text-slate-500'}"
							onclick={() => (mode = 'paste')}
						>
							Paste new
						</button>
					</div>
				{:else}
					<!-- Only paste mode available -->
					<div class="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-4">
						<FileText size={14} />
						<span>You haven't added any documents yet. Paste one below, or skip to get a basic strategy.</span>
					</div>
				{/if}

				{#if mode === 'select' && userDocuments.length > 0}
					<!-- Document list -->
					<div class="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
						{#each userDocuments as doc}
							<button
								class="w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 {selectedDocId === doc.id
									? 'border-orange-500 bg-orange-50'
									: 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'}"
								onclick={() => (selectedDocId = doc.id)}
							>
								<div class="mt-0.5 flex-shrink-0">
									{#if selectedDocId === doc.id}
										<CheckCircle2 size={16} class="text-orange-500" />
									{:else}
										<FileText size={16} class="text-slate-400" />
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<div class="font-semibold text-slate-900 text-sm truncate">
										{doc.program_name || 'Untitled'}
									</div>
									<div class="text-xs text-slate-500">
										{doc.typeName} · {doc.word_count || 0} words · Updated {new Date(doc.updated_at).toLocaleDateString()}
									</div>
								</div>
							</button>
						{/each}
					</div>
				{:else}
					<!-- Paste textarea -->
					<div class="space-y-3 mb-4">
						<div>
							<label for="pasted-title" class="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Title</label>
							<input
								id="pasted-title"
								type="text"
								bind:value={pastedTitle}
								placeholder="e.g. My Master's SOP draft"
								class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
							/>
						</div>
						<div>
							<label for="pasted-text" class="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Paste your SOP or personal statement</label>
							<textarea
								id="pasted-text"
								bind:value={pastedText}
								placeholder="Paste the full text here..."
								class="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[140px] resize-y"
							></textarea>
							<div class="flex justify-between text-xs text-slate-400 mt-1">
								<span>Minimum 50 characters</span>
								<span>{pastedText.trim().length} characters</span>
							</div>
						</div>
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex flex-col gap-2">
					<button
						onclick={handleGenerate}
						disabled={saving || (mode === 'select' ? !selectedDocId : pastedText.trim().length < 50)}
						class="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors flex justify-center items-center gap-2 disabled:bg-slate-200 disabled:text-slate-400"
					>
						{#if saving}
							Saving…
						{:else}
							Continue with this document
							<ArrowRight size={16} />
						{/if}
					</button>
					<button
						onclick={handleSkip}
						class="w-full text-slate-500 font-medium py-2 hover:text-slate-900 transition-colors text-sm"
					>
						Skip — generate a basic strategy without a document
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
