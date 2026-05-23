<script lang="ts">
    console.log('Programs Admin Page script is running!');
	import { onMount } from 'svelte';
	import { Plus, Edit2, Trash2, Search, Link as LinkIcon } from 'lucide-svelte';

	let { data } = $props();
	let { supabase } = $derived(data);

	let programs = $state<any[]>([]);
	let universitiesList = $state<any[]>([]); // Added for university linking
	let isLoading = $state(true);
	let searchQuery = $state('');
	
	// Editor Modal State
	let showEditor = $state(false);
	let isEditing = $state(false);
	let currentProgram = $state<any>({});
	
	
	async function loadPrograms() {
		isLoading = true;
		const { data: p } = await supabase.from('programs').select('*').order('program_name');
		programs = p || [];
		
		const { data: u } = await supabase.from('universities').select('id, name').order('name');
		universitiesList = u || [];
		
		isLoading = false;
	}

	onMount(() => {
		loadPrograms();
	});

	function openAddModal() {
		isEditing = false;
		currentProgram = {
			id: '',
			program_name: '',
			university_name: '',
			university_id: null,
			country: 'Germany',
			city: '',
			tuition_per_semester: 0,
			semester_fee: 0,
			application_fee: 0,
			living_cost_per_month: 0,
			degree_level: 'master',
			field_of_study: 'Various',
			application_steps: [],
			funding_pathway: '',
			funding_pathway_explanation: '',
			rubric_criteria: { min_gpa: 0, english_level_required: false, german_level_required: false }
		};
		showEditor = true;
	}

	async function openEditModal(prog: any) {
		isEditing = true;
		currentProgram = { 
			...prog,
			application_steps: prog.application_steps || [],
			funding_pathway: prog.funding_pathway || '',
			funding_pathway_explanation: prog.funding_pathway_explanation || '',
			rubric_criteria: prog.rubric_criteria || { min_gpa: 0, english_level_required: false, german_level_required: false }
		};
		
		showEditor = true;
	}

	async function saveProgram() {
		try {
			if (isEditing) {
				const { error } = await supabase
					.from('programs')
					.update({
						program_name: currentProgram.program_name,
						university_name: currentProgram.university_name,
						university_id: currentProgram.university_id || null,
						country: currentProgram.country,
						city: currentProgram.city,
						tuition_per_semester: currentProgram.tuition_per_semester,
						semester_fee: currentProgram.semester_fee,
						application_fee: currentProgram.application_fee,
						living_cost_per_month: currentProgram.living_cost_per_month,
						application_steps: currentProgram.application_steps,
						funding_pathway: currentProgram.funding_pathway,
						funding_pathway_explanation: currentProgram.funding_pathway_explanation,
						rubric_criteria: currentProgram.rubric_criteria
					})
					.eq('id', currentProgram.id);
					
				if (error) throw error;
			} else {
				// Base ID generation (needs proper slugification in a real app)
				const newId = currentProgram.id || currentProgram.program_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
				const { error } = await supabase
					.from('programs')
					.insert({
						id: newId,
						program_name: currentProgram.program_name,
						university_name: currentProgram.university_name,
						university_id: currentProgram.university_id || null,
						country: currentProgram.country,
						city: currentProgram.city,
						tuition_per_semester: currentProgram.tuition_per_semester,
						semester_fee: currentProgram.semester_fee,
						application_fee: currentProgram.application_fee,
						living_cost_per_month: currentProgram.living_cost_per_month,
						degree_level: currentProgram.degree_level,
						field_of_study: currentProgram.field_of_study,
						application_steps: currentProgram.application_steps,
						funding_pathway: currentProgram.funding_pathway,
						funding_pathway_explanation: currentProgram.funding_pathway_explanation,
						rubric_criteria: currentProgram.rubric_criteria
					});
					
				if (error) throw error;
				currentProgram.id = newId;
			}
			
			showEditor = false;
			await loadPrograms();
		} catch (e: any) {
			alert('Error saving: ' + e.message);
		}
	}

	function addTimelineStep() {
		currentProgram.application_steps = [...currentProgram.application_steps, { step_number: currentProgram.application_steps.length + 1, title: '', description: '', type: 'university_action', estimated_month: 'October', deadline: '' }];
	}
	function removeTimelineStep(index: number) {
		currentProgram.application_steps = currentProgram.application_steps.filter((_: any, i: number) => i !== index);
	}

	const filteredPrograms = $derived(
		programs.filter(p => 
			p.program_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
			p.university_name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

<div class="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Programs</h1>
		<p class="text-sm text-gray-500 mt-1">Manage all programs and link them to funding strategies.</p>
	</div>
	<button onclick={openAddModal} class="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors">
		<Plus size={18} /> Add Program
	</button>
</div>

<div class="bg-white border rounded-xl shadow-sm mb-8">
	<div class="p-4 border-b flex items-center gap-3">
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
		<input 
			type="text" 
			bind:value={searchQuery}
			placeholder="Search programs or universities..." 
			class="w-full text-base outline-none bg-transparent"
		/>
	</div>
	<div class="overflow-x-auto">
		<table class="w-full text-left text-sm text-gray-600">
			<thead class="text-xs text-gray-500 uppercase bg-gray-50 border-b">
				<tr>
					<th class="px-6 py-4 font-semibold">Program</th>
					<th class="px-6 py-4 font-semibold">University</th>
					<th class="px-6 py-4 font-semibold">Location</th>
					<th class="px-6 py-4 font-semibold text-right">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if isLoading}
					<tr><td colspan="4" class="px-6 py-8 text-center">Loading...</td></tr>
				{:else if filteredPrograms.length === 0}
					<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">No programs found.</td></tr>
				{:else}
					{#each filteredPrograms as prog}
						<tr class="border-b hover:bg-gray-50 transition-colors">
							<td class="px-6 py-4 font-bold text-gray-900">{prog.program_name}</td>
							<td class="px-6 py-4">{prog.university_name}</td>
							<td class="px-6 py-4">{prog.city}, {prog.country}</td>
							<td class="px-6 py-4 text-right flex justify-end gap-2">
								<button onclick={() => openEditModal(prog)} class="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 transition-colors">
									<Edit2 size={16} />
								</button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

{#if showEditor}
	<div class="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
			<div class="px-6 py-4 border-b flex justify-between items-center">
				<h3 class="text-xl font-bold text-gray-900">{isEditing ? 'Edit Program' : 'Add New Program'}</h3>
				<button onclick={() => showEditor = false} class="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
			</div>
			
			<div class="p-6 overflow-y-auto flex-1 bg-gray-50">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<!-- Basics -->
					<div class="space-y-4 bg-white p-5 rounded-xl border">
						<h4 class="font-bold text-gray-900 mb-2 border-b pb-2">Core Details</h4>
						{#if !isEditing}
							<div>
								<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Program ID / Slug</label>
								<input type="text" bind:value={currentProgram.id} placeholder="e.g. rwth-software-engineering" class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500" />
							</div>
						{/if}
						<div>
							<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Program Name</label>
							<input type="text" bind:value={currentProgram.program_name} class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500" />
						</div>
						<div>
							<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">University Name (Legacy/Fallback)</label>
							<input type="text" bind:value={currentProgram.university_name} class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500" />
						</div>
						<div>
							<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Linked University (Catalog)</label>
							<select bind:value={currentProgram.university_id} class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500">
								<option value={null}>-- Select University --</option>
								{#each universitiesList as u}
									<option value={u.id}>{u.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<!-- Location & Cost -->
					<div class="space-y-4 bg-white p-5 rounded-xl border">
						<h4 class="font-bold text-gray-900 mb-2 border-b pb-2">Logistics</h4>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Country</label>
								<input type="text" bind:value={currentProgram.country} class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500" />
							</div>
							<div>
								<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">City</label>
								<input type="text" bind:value={currentProgram.city} class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500" />
							</div>
						</div>
						<div class="grid grid-cols-2 gap-4 mt-4">
							<div>
								<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Tuition (€ / Sem)</label>
								<input type="number" bind:value={currentProgram.tuition_per_semester} class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500" />
							</div>
							<div>
								<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Semester Fee (€ / Sem)</label>
								<input type="number" bind:value={currentProgram.semester_fee} class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500" />
							</div>
							<div>
								<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Application Fee (€)</label>
								<input type="number" bind:value={currentProgram.application_fee} class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500" />
							</div>
							<div>
								<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Est. Living Cost (€ / Mo)</label>
								<input type="number" bind:value={currentProgram.living_cost_per_month} class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500" />
							</div>
						</div>
					</div>

					<!-- Rich Data Strategy & Rubric -->
					<div class="space-y-4 bg-white p-5 rounded-xl border mt-6 lg:col-span-2">
						<h4 class="font-bold text-gray-900 mb-2 border-b pb-2">Clarity Engine: Strategy & Rubric</h4>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Funding Pathway</label>
								<select bind:value={currentProgram.funding_pathway} class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500">
									<option value="">-- Select Pathway --</option>
									<option value="funding_first">Direct + Scholarships</option>
									<option value="program_first">Uni-Assist Flow</option>
									<option value="professor_dependent">Professor Contact First</option>
								</select>
							</div>
							<div>
								<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Pathway Explanation</label>
								<textarea bind:value={currentProgram.funding_pathway_explanation} placeholder="Explain the strategy..." class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500 h-10"></textarea>
							</div>
						</div>
						<div class="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
							<div>
								<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Min GPA (German Scale)</label>
								<input type="number" step="0.1" bind:value={currentProgram.rubric_criteria.min_gpa} class="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-yellow-500" />
							</div>
							<div class="flex items-center gap-2 mt-6">
								<input type="checkbox" id="english_req" bind:checked={currentProgram.rubric_criteria.english_level_required} class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500" />
								<label for="english_req" class="text-sm font-semibold text-gray-700">Requires English (IELTS)</label>
							</div>
							<div class="flex items-center gap-2 mt-6">
								<input type="checkbox" id="german_req" bind:checked={currentProgram.rubric_criteria.german_level_required} class="rounded border-gray-300 text-yellow-500 focus:ring-yellow-500" />
								<label for="german_req" class="text-sm font-semibold text-gray-700">Requires German (Goethe/TestDaF)</label>
							</div>
						</div>
					</div>

					<!-- Rich Data Timeline Builder -->
					<div class="space-y-4 bg-white p-5 rounded-xl border mt-6 lg:col-span-2">
						<div class="flex justify-between items-center mb-2 border-b pb-2">
							<h4 class="font-bold text-gray-900">Application Timeline Steps</h4>
							<button type="button" onclick={addTimelineStep} class="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus size={12}/> Add Step</button>
						</div>
						
						{#each currentProgram.application_steps as step, i}
							<div class="grid grid-cols-12 gap-3 p-3 bg-slate-50 border rounded-lg relative">
								<div class="col-span-1 flex items-center justify-center font-bold text-slate-400">#{i + 1}</div>
								<div class="col-span-3">
									<input type="text" bind:value={step.title} placeholder="Step Title" class="w-full border rounded px-2 py-1 text-xs outline-none focus:border-yellow-500" />
								</div>
								<div class="col-span-2">
									<select bind:value={step.type} class="w-full border rounded px-2 py-1 text-xs outline-none focus:border-yellow-500">
										<option value="university_action">Action</option>
										<option value="university_deadline">Deadline</option>
										<option value="visa_prep">Visa Prep</option>
									</select>
								</div>
								<div class="col-span-2">
									<input type="text" bind:value={step.estimated_month} placeholder="Month (e.g. October)" class="w-full border rounded px-2 py-1 text-xs outline-none focus:border-yellow-500" />
								</div>
								<div class="col-span-3">
									<input type="text" bind:value={step.deadline} placeholder="Exact Deadline" class="w-full border rounded px-2 py-1 text-xs outline-none focus:border-yellow-500" />
								</div>
								<div class="col-span-1 flex justify-end">
									<button type="button" onclick={() => removeTimelineStep(i)} class="text-red-500 hover:text-red-700 p-1"><Trash2 size={14}/></button>
								</div>
								<div class="col-span-12">
									<input type="text" bind:value={step.description} placeholder="Short Description..." class="w-full border rounded px-2 py-1 text-xs outline-none focus:border-yellow-500" />
								</div>
							</div>
						{/each}
						{#if currentProgram.application_steps.length === 0}
							<div class="text-center text-slate-400 text-sm py-4 border border-dashed rounded-lg">No steps added. Timeline will be empty.</div>
						{/if}
					</div>
				</div>
			</div>
			
			<div class="px-6 py-4 border-t bg-white flex justify-end gap-3">
				<button onclick={() => showEditor = false} class="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
				<button onclick={saveProgram} class="px-6 py-2 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-lg">Save Program</button>
			</div>
		</div>
	</div>
{/if}
