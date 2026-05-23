<script lang="ts">
	import { onMount } from 'svelte';
	import { Upload, Sparkles, CheckCircle2, AlertCircle, FileText, Trash2, Play, Download } from 'lucide-svelte';

	let { data } = $props();

	// ─── State ──────────────────────────────────────────────────────────────────
	let csvText = $state('');
	let parsedRows = $state<any[]>([]);
	let parseError = $state('');
	let useAI = $state(true);
	let isImporting = $state(false);
	let importResult = $state<{ inserted: number; errors: any[]; } | null>(null);
	let step = $state<'upload' | 'preview' | 'done'>('upload');
	let aiEnrichingIndex = $state(-1);

	// ─── CSV Headers (must match exactly) ───────────────────────────────────────
	const REQUIRED_COLS = ['program_name', 'university_name', 'country', 'city'];
	const OPTIONAL_COLS = [
		'id',
		'tuition_per_semester',
		'semester_fee',
		'application_fee',
		'living_cost_per_month',
		'degree_level',
		'field_of_study',
		'application_deadline',
		'official_url',
		'language_of_instruction',
		'direct_application_url',
		'source_url',
		'full_description_text',
		'program_duration_months',
		'intake',
		'duration',
		'format',
		'pace'
	];
	const ALL_COLS = [...REQUIRED_COLS, ...OPTIONAL_COLS];

	// ─── Sample CSV ─────────────────────────────────────────────────────────────
	const SAMPLE_CSV = [
		'id,program_name,university_name,country,city,tuition_per_semester,semester_fee,application_fee,living_cost_per_month,degree_level,field_of_study,application_deadline,official_url,language_of_instruction,direct_application_url,source_url,full_description_text,program_duration_months,intake,duration,format,pace',
		'rwth-aachen-software-eng,Software Systems Engineering (M.Sc.),RWTH Aachen University,Germany,Aachen,0,310,0,900,master,Computer Science,2026-03-01,https://www.rwth-aachen.de/programs/software-systems,English,https://www.rwth-aachen.de/programs/software-systems,https://www.rwth-aachen.de/programs/software-systems,"Software Systems Engineering at RWTH Aachen prepares students for advanced software architecture, engineering, and distributed systems work.",24,Winter,2 years,On Campus,Full-time',
		'tum-informatics,Informatics (M.Sc.),Technical University of Munich,Germany,Munich,0,144,0,1200,master,Computer Science,2026-05-31,https://www.tum.de/en/programs/informatics,English,https://www.tum.de/en/programs/informatics,https://www.tum.de/en/programs/informatics,"TUM Informatics combines rigorous computer science training with strong research and industry pathways for international students.",24,Winter/Summer,2 years,On Campus,Full-time',
		'kit-computer-science,Computer Science (M.Sc.),Karlsruhe Institute of Technology,Germany,Karlsruhe,1500,178,0,850,master,Computer Science,2026-07-15,https://www.kit.edu/english/programs,English,https://www.kit.edu/english/programs,https://www.kit.edu/english/programs,"KIT Computer Science offers advanced study in algorithms, systems, and intelligent applications with a research-led curriculum.",24,Winter,2 years,On Campus,Full-time'
	].join('\n');

	// ─── Parse CSV ───────────────────────────────────────────────────────────────
	function parseCSV(text: string): any[] {
		const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
		if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

		const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

		const missing = REQUIRED_COLS.filter(r => !headers.includes(r));
		if (missing.length > 0) throw new Error(`Missing required columns: ${missing.join(', ')}`);

		return lines.slice(1).map((line, idx) => {
			// Handle quoted commas
			const cols: string[] = [];
			let inQuote = false;
			let current = '';
			for (const ch of line) {
				if (ch === '"') { inQuote = !inQuote; }
				else if (ch === ',' && !inQuote) { cols.push(current.trim()); current = ''; }
				else { current += ch; }
			}
			cols.push(current.trim());

			const row: any = { _rowIndex: idx + 2 };
			headers.forEach((h, i) => { row[h] = cols[i] || ''; });

			// Validate
			const errors: string[] = [];
			if (!row.program_name) errors.push('Missing program_name');
			if (!row.university_name) errors.push('Missing university_name');
			row._errors = errors;
			row._valid = errors.length === 0;

			return row;
		});
	}

	function handleParse() {
		parseError = '';
		parsedRows = [];
		try {
			const rows = parseCSV(csvText);
			parsedRows = rows;
			step = 'preview';
		} catch (e: any) {
			parseError = e.message;
		}
	}

	function loadSample() {
		// Reset to upload step first
		step = 'upload';
		parsedRows = [];
		parseError = '';
		importResult = null;

		const header = 'id,program_name,university_name,country,city,tuition_per_semester,semester_fee,application_fee,living_cost_per_month,degree_level,field_of_study,application_deadline,official_url,language_of_instruction,direct_application_url,source_url,full_description_text,program_duration_months,intake,duration,format,pace';
		const row1   = 'rwth-aachen-software-eng,Software Systems Engineering (M.Sc.),RWTH Aachen University,Germany,Aachen,0,310,0,900,master,Computer Science,2026-03-01,https://www.rwth-aachen.de/programs/software-systems,English,https://www.rwth-aachen.de/programs/software-systems,https://www.rwth-aachen.de/programs/software-systems,"Software Systems Engineering at RWTH Aachen prepares students for advanced software architecture, engineering, and distributed systems work.",24,Winter,2 years,On Campus,Full-time';
		const row2   = 'tum-informatics,Informatics (M.Sc.),Technical University of Munich,Germany,Munich,0,144,0,1200,master,Computer Science,2026-05-31,https://www.tum.de/en/programs/informatics,English,https://www.tum.de/en/programs/informatics,https://www.tum.de/en/programs/informatics,"TUM Informatics combines rigorous computer science training with strong research and industry pathways for international students.",24,Winter/Summer,2 years,On Campus,Full-time';
		const row3   = 'kit-computer-science,Computer Science (M.Sc.),Karlsruhe Institute of Technology,Germany,Karlsruhe,1500,178,0,850,master,Computer Science,2026-07-15,https://www.kit.edu/english/programs,English,https://www.kit.edu/english/programs,https://www.kit.edu/english/programs,"KIT Computer Science offers advanced study in algorithms, systems, and intelligent applications with a research-led curriculum.",24,Winter,2 years,On Campus,Full-time';
		csvText = [header, row1, row2, row3].join('\n');
	}

	function downloadTemplate() {
		const header = ALL_COLS.join(',');
		const blob = new Blob([header + '\n'], { type: 'text/csv' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = 'abroaducate_programs_template.csv';
		a.click();
	}

	function removeRow(index: number) {
		parsedRows = parsedRows.filter((_, i) => i !== index);
	}

	// ─── Import ──────────────────────────────────────────────────────────────────
	async function runImport() {
		isImporting = true;
		importResult = null;
		const validRows = parsedRows.filter(r => r._valid);

		try {
			const res = await fetch('/api/admin/bulk-import-programs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ programs: validRows, useAI })
			});
			const result = await res.json();

			// Surface API-level errors clearly
			if (!res.ok || result.error) {
				importResult = {
					inserted: 0,
					errors: [{ program: 'API Error', error: result.error || `HTTP ${res.status}` }]
				};
			} else {
				importResult = result;
			}
			step = 'done';
		} catch (e: any) {
			importResult = { inserted: 0, errors: [{ program: 'Network', error: e.message }] };
			step = 'done';
		} finally {
			isImporting = false;
		}
	}

	const validCount = $derived(parsedRows.filter(r => r._valid).length);
	const errorCount = $derived(parsedRows.filter(r => !r._valid).length);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Bulk Program Import</h1>
			<p class="text-sm text-gray-500 mt-1">Upload a CSV of programs. Optionally enrich with AI-generated descriptions, timelines, and strategies.</p>
		</div>
		<div class="flex gap-3">
			<button onclick={downloadTemplate} class="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
				<Download size={16} /> Download Template
			</button>
			<a href="/admin/programs" class="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
				← Back to Programs
			</a>
		</div>
	</div>

	<!-- Steps indicator -->
	<div class="flex items-center gap-3 text-sm font-semibold">
		{#each [['upload', '1', 'Upload CSV'], ['preview', '2', 'Preview & Validate'], ['done', '3', 'Import Complete']] as [s, num, label]}
			<div class="flex items-center gap-2 {step === s ? 'text-yellow-700' : step > s ? 'text-emerald-600' : 'text-gray-400'}">
				<div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold {step === s ? 'bg-yellow-100 border-2 border-yellow-400' : step > s ? 'bg-emerald-100 border-2 border-emerald-400' : 'bg-gray-100 border-2 border-gray-200'}">{num}</div>
				{label}
			</div>
			{#if s !== 'done'}<div class="flex-1 h-px bg-gray-200 max-w-[60px]"></div>{/if}
		{/each}
	</div>

	<!-- ── STEP 1: Upload ─────────────────────────────────────────────────────── -->
	{#if step === 'upload'}
	<div class="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
		<div class="flex items-center gap-4">
			<!-- AI Toggle -->
			<div class="flex items-center gap-3 p-4 rounded-xl border-2 {useAI ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50'} cursor-pointer flex-1" onclick={() => useAI = !useAI}>
				<div class="w-10 h-10 rounded-xl {useAI ? 'bg-yellow-400' : 'bg-gray-300'} flex items-center justify-center flex-shrink-0 transition-colors">
					<Sparkles size={20} class="text-white" />
				</div>
				<div>
					<div class="font-bold text-gray-900 text-sm">AI Enrichment {useAI ? 'ON' : 'OFF'}</div>
					<div class="text-xs text-gray-500">Auto-generate descriptions, timelines & funding strategy via GPT-4o-mini (~$0.02/program)</div>
				</div>
				<div class="ml-auto">
					<div class="w-12 h-6 rounded-full {useAI ? 'bg-yellow-400' : 'bg-gray-300'} relative transition-colors">
						<div class="absolute top-1 {useAI ? 'left-7' : 'left-1'} w-4 h-4 bg-white rounded-full shadow transition-all"></div>
					</div>
				</div>
			</div>
		</div>

		<!-- CSV Textarea -->
		<div>
			<div class="flex justify-between items-center mb-2">
				<label class="text-sm font-bold text-gray-700">Paste CSV Data</label>
				<button onclick={loadSample} class="text-xs text-yellow-600 hover:text-yellow-800 font-semibold underline">Load Sample Data</button>
			</div>
			<textarea
				bind:value={csvText}
				rows={12}
				placeholder="Paste your CSV here. First row must be the header row matching the template columns."
				class="w-full border rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-yellow-400 resize-y bg-gray-50"
			></textarea>
		</div>

		{#if parseError}
			<div class="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200 text-red-800 text-sm">
				<AlertCircle size={18} class="flex-shrink-0 mt-0.5" />
				<div><strong>Parse Error:</strong> {parseError}</div>
			</div>
		{/if}

		<div class="flex justify-end">
			<button
				onclick={handleParse}
				disabled={!csvText.trim()}
				class="px-6 py-3 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				Parse & Preview →
			</button>
		</div>
	</div>
	{/if}

	<!-- ── STEP 2: Preview ────────────────────────────────────────────────────── -->
	{#if step === 'preview'}
	<div class="space-y-4">
		<!-- Summary bar -->
		<div class="flex items-center gap-4 p-4 bg-white rounded-xl border shadow-sm">
			<div class="flex items-center gap-2 text-emerald-700 font-bold text-sm">
				<CheckCircle2 size={18} class="text-emerald-500" /> {validCount} Valid
			</div>
			{#if errorCount > 0}
				<div class="flex items-center gap-2 text-red-700 font-bold text-sm">
					<AlertCircle size={18} class="text-red-400" /> {errorCount} Errors (will be skipped)
				</div>
			{/if}
			{#if useAI}
				<div class="flex items-center gap-2 text-yellow-700 font-bold text-sm ml-auto">
					<Sparkles size={16} /> AI Enrichment will run on all {validCount} programs
				</div>
			{/if}
		</div>

		<!-- Table -->
		<div class="bg-white rounded-2xl border shadow-sm overflow-hidden">
			<div class="overflow-x-auto max-h-[55vh] overflow-y-auto">
				<table class="w-full text-left text-sm">
					<thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b sticky top-0">
						<tr>
							<th class="px-4 py-3 font-semibold">#</th>
							<th class="px-4 py-3 font-semibold">Program</th>
							<th class="px-4 py-3 font-semibold">University</th>
							<th class="px-4 py-3 font-semibold">Location</th>
							<th class="px-4 py-3 font-semibold">Tuition/Sem</th>
							<th class="px-4 py-3 font-semibold">Deadline</th>
							<th class="px-4 py-3 font-semibold">Status</th>
							<th class="px-4 py-3"></th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each parsedRows as row, i}
							<tr class="{row._valid ? 'hover:bg-gray-50' : 'bg-red-50'} transition-colors">
								<td class="px-4 py-3 text-gray-400 text-xs">{row._rowIndex}</td>
								<td class="px-4 py-3 font-semibold text-gray-900 max-w-[200px]">
									<div class="truncate">{row.program_name || '—'}</div>
									{#if row.field_of_study}<div class="text-xs text-gray-400 truncate">{row.field_of_study}</div>{/if}
								</td>
								<td class="px-4 py-3 text-gray-700 max-w-[160px]">
									<div class="truncate">{row.university_name || '—'}</div>
								</td>
								<td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{row.city}, {row.country}</td>
								<td class="px-4 py-3 font-mono text-emerald-700 text-xs whitespace-nowrap">
									{row.tuition_per_semester ? `€${row.tuition_per_semester}` : 'Free'}
								</td>
								<td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{row.application_deadline || '—'}</td>
								<td class="px-4 py-3">
									{#if row._valid}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
											<CheckCircle2 size={12} /> Ready
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold" title={row._errors.join(', ')}>
											<AlertCircle size={12} /> Error
										</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<button onclick={() => removeRow(i)} class="text-gray-300 hover:text-red-500 transition-colors p-1">
										<Trash2 size={14} />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex justify-between items-center">
			<button onclick={() => step = 'upload'} class="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
				← Back
			</button>
			<button
				onclick={runImport}
				disabled={isImporting || validCount === 0}
				class="flex items-center gap-2 px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
			>
				{#if isImporting}
					<div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
					{useAI ? 'AI Enriching & Importing...' : 'Importing...'}
				{:else}
					<Play size={18} /> Import {validCount} Program{validCount !== 1 ? 's' : ''}
					{#if useAI}<span class="text-yellow-200 text-xs font-normal ml-1">+ AI</span>{/if}
				{/if}
			</button>
		</div>
	</div>
	{/if}

	<!-- ── STEP 3: Done ────────────────────────────────────────────────────────── -->
	{#if step === 'done' && importResult}
	<div class="bg-white rounded-2xl border shadow-sm p-8 text-center space-y-6">
		<div class="w-20 h-20 rounded-full {importResult.inserted > 0 ? 'bg-emerald-100' : 'bg-red-100'} flex items-center justify-center mx-auto">
			{#if importResult.inserted > 0}
				<CheckCircle2 size={40} class="text-emerald-500" />
			{:else}
				<AlertCircle size={40} class="text-red-400" />
			{/if}
		</div>

		<div>
			<h2 class="text-3xl font-extrabold text-gray-900">{importResult.inserted} Program{importResult.inserted !== 1 ? 's' : ''} Imported!</h2>
			{#if useAI}<p class="text-gray-500 mt-1">Each program was enriched with AI-generated descriptions and timelines.</p>{/if}
		</div>

		{#if importResult.errors && importResult.errors.length > 0}
			<div class="text-left bg-red-50 rounded-xl border border-red-200 p-4">
				<p class="text-sm font-bold text-red-800 mb-2">⚠️ {importResult.errors.length} Error{importResult.errors.length !== 1 ? 's' : ''}</p>
				<ul class="space-y-1">
					{#each importResult.errors as err}
						<li class="text-xs text-red-700 font-mono">• {err.program}: {err.error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="flex justify-center gap-4">
			<button onclick={() => { step = 'upload'; csvText = ''; parsedRows = []; importResult = null; }} class="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
				Import More
			</button>
			<a href="/admin/programs" class="px-5 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl transition-colors">
				View All Programs →
			</a>
		</div>
	</div>
	{/if}
</div>
