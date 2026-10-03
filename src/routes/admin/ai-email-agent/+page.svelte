<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	let settings = { ...data.settings };
	let logs = [...data.logs];
	let stats = { ...data.stats };

	// Simulator State
	let simFrom = 'sarah.miller@gmail.com';
	let simSubject = 'Question about DAAD scholarship and Germany blocked account';
	let simText = `Hi Abroaducate team,\n\nI am planning to apply for a Master's in Computer Science in Germany for Fall 2026. Can you tell me what the blocked account amount is right now? Also, does Abroaducate have a tool to check my SOP before I submit to Uni-Assist?\n\nThanks,\nSarah`;
	let simLoading = false;
	let simResult: any = null;
	let simError = '';
	let activeTab: 'zoho' | 'simulator' | 'logs' | 'setup' | 'settings' = 'zoho';

	// Zoho Mail Integration State
	let zohoStatus: {
		checked: boolean;
		success: boolean;
		imapConnected: boolean;
		smtpConnected: boolean;
		unreadCount?: number;
		error?: string;
	} | null = null;
	let zohoChecking = false;
	let zohoPolling = false;
	let zohoPollResult: any = null;
	let zohoLimit = 15;
	let zohoDryRun = false;

	async function checkZohoConnection() {
		zohoChecking = true;
		try {
			const res = await fetch('/api/ai-email-agent/zoho/poll');
			const data = await res.json();
			zohoStatus = { checked: true, ...data };
		} catch (err: any) {
			zohoStatus = { checked: true, success: false, imapConnected: false, smtpConnected: false, error: err.message };
		} finally {
			zohoChecking = false;
		}
	}

	async function runZohoScanAndReply(dryRun = false) {
		zohoPolling = true;
		zohoPollResult = null;
		try {
			const res = await fetch('/api/ai-email-agent/zoho/poll', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ limit: zohoLimit, dryRun })
			});
			const data = await res.json();
			if (res.ok && data.success) {
				zohoPollResult = data.result;
				refreshLogs();
				checkZohoConnection();
			} else {
				alert('Zoho processing failed: ' + (data.error || 'Unknown error'));
			}
		} catch (err: any) {
			alert('Network error: ' + err.message);
		} finally {
			zohoPolling = false;
		}
	}

	// Selected log for inspection modal
	let selectedLog: any = null;

	// Quick presets for testing
	const presets = [
		{
			title: 'DAAD & Germany Blocked Account',
			from: 'ahmed.k@yahoo.com',
			subject: 'How much for German blocked account in 2026?',
			text: 'Hello, I heard the German visa blocked account amount changed recently. How much do I need to deposit and which provider do you recommend? Also do you help with DAAD scholarships?'
		},
		{
			title: 'SOP & Application Review',
			from: 'chioma.eze@gmail.com',
			subject: 'Can someone review my Statement of Purpose?',
			text: 'Hi, I finished my draft SOP for Swedish Institute scholarships. How can I get Abroaducate to review it, and does your tool give sentence-level suggestions?'
		},
		{
			title: 'Visa Interview Preparation',
			from: 'rajesh.patel@outlook.com',
			subject: 'Help with USA F-1 Visa mock interview',
			text: 'Greetings, my US visa interview is in 10 days. Does Abroaducate have mock interview practice questions, and can I practice with AI?'
		},
		{
			title: 'Escalation / Refund Dispute',
			from: 'frustrated.user@gmail.com',
			subject: 'URGENT: Billed twice for Pro subscription',
			text: 'I was charged twice on my card yesterday for the Academic Professional plan. Please refund the duplicate payment immediately and have a manager contact me!'
		}
	];

	function applyPreset(preset: typeof presets[0]) {
		simFrom = preset.from;
		simSubject = preset.subject;
		simText = preset.text;
		simResult = null;
		simError = '';
	}

	async function runSimulation(forceSend = false) {
		simLoading = true;
		simError = '';
		simResult = null;

		try {
			const res = await fetch('/api/ai-email-agent/simulate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					from: simFrom,
					subject: simSubject,
					text: simText,
					forceSend
				})
			});

			const json = await res.json();
			if (!res.ok) {
				simError = json.error || 'Simulation failed';
			} else {
				simResult = json;
				if (forceSend) {
					// Refresh logs
					refreshLogs();
				}
			}
		} catch (err: any) {
			simError = err?.message || 'Network error running simulation';
		} finally {
			simLoading = false;
		}
	}

	let savingSettings = false;
	let settingsSavedMsg = '';

	async function saveSettings() {
		savingSettings = true;
		settingsSavedMsg = '';
		try {
			const res = await fetch('/api/ai-email-agent/logs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(settings)
			});
			const json = await res.json();
			if (res.ok) {
				settings = json.settings;
				settingsSavedMsg = 'Settings saved successfully!';
				setTimeout(() => (settingsSavedMsg = ''), 4000);
			}
		} catch (err: any) {
			alert('Failed to save settings: ' + err.message);
		} finally {
			savingSettings = false;
		}
	}

	async function refreshLogs() {
		try {
			const res = await fetch('/api/ai-email-agent/logs?limit=30');
			const json = await res.json();
			if (res.ok && json.logs) {
				logs = json.logs;
				stats = json.stats;
			}
		} catch (e) {
			console.error(e);
		}
	}
</script>

<svelte:head>
	<title>AI Email Agent | Abroaducate Admin</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header Bar -->
	<div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
		<div>
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 text-xl font-bold">
					🤖
				</div>
				<div>
					<h1 class="text-2xl font-bold text-gray-900">Abroaducate AI Email Agent</h1>
					<p class="text-sm text-gray-500">
						Autonomous inbox responder with student context, knowledge retrieval & loop protection
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-4">
			<div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold {settings.agentEnabled ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}">
				<span class="w-2 h-2 rounded-full {settings.agentEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}"></span>
				{settings.agentEnabled ? (settings.autonomousMode ? 'Autonomous Replying' : 'Draft Only Mode') : 'Agent Disabled'}
			</div>

			<button
				type="button"
				on:click={refreshLogs}
				class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-2 rounded-lg transition"
			>
				🔄 Refresh
			</button>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
		<div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
			<p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Processed</p>
			<p class="text-2xl font-extrabold text-gray-900 mt-1">{stats.total}</p>
			<p class="text-xs text-gray-500 mt-1">Inbound inquiries</p>
		</div>

		<div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
			<p class="text-xs font-semibold text-green-600 uppercase tracking-wider">AI Replies Sent</p>
			<p class="text-2xl font-extrabold text-green-600 mt-1">{stats.replied}</p>
			<p class="text-xs text-gray-500 mt-1">Dispatched autonomously</p>
		</div>

		<div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
			<p class="text-xs font-semibold text-amber-600 uppercase tracking-wider">Loops Blocked</p>
			<p class="text-2xl font-extrabold text-amber-600 mt-1">{stats.skipped}</p>
			<p class="text-xs text-gray-500 mt-1">Autoreplies & spam skipped</p>
		</div>

		<div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
			<p class="text-xs font-semibold text-purple-600 uppercase tracking-wider">Escalated</p>
			<p class="text-2xl font-extrabold text-purple-600 mt-1">{stats.escalated}</p>
			<p class="text-xs text-gray-500 mt-1">Flagged for human team</p>
		</div>
	</div>

	<!-- Navigation Tabs -->
	<div class="border-b border-gray-200 mb-6 flex space-x-8">
		<button
			type="button"
			on:click={() => (activeTab = 'zoho')}
			class="pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 {activeTab === 'zoho' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-800'}"
		>
			<span>📬</span>
			<span>Zoho Mail Inbox (Live)</span>
			{#if zohoStatus?.unreadCount}
				<span class="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
					{zohoStatus.unreadCount} unread
				</span>
			{/if}
		</button>
		<button
			type="button"
			on:click={() => (activeTab = 'simulator')}
			class="pb-3 text-sm font-semibold border-b-2 transition {activeTab === 'simulator' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-800'}"
		>
			🧪 Live Email Simulator
		</button>
		<button
			type="button"
			on:click={() => (activeTab = 'logs')}
			class="pb-3 text-sm font-semibold border-b-2 transition {activeTab === 'logs' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-800'}"
		>
			📋 Inbound & Outbound Logs ({logs.length})
		</button>
		<button
			type="button"
			on:click={() => (activeTab = 'setup')}
			class="pb-3 text-sm font-semibold border-b-2 transition {activeTab === 'setup' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-800'}"
		>
			⚙️ Webhook & Cloudflare Setup
		</button>
		<button
			type="button"
			on:click={() => (activeTab = 'settings')}
			class="pb-3 text-sm font-semibold border-b-2 transition {activeTab === 'settings' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-800'}"
		>
			🎛️ Agent Settings
		</button>
	</div>

	<!-- TAB 0: ZOHO MAIL INBOX LIVE AUTO-RESPONDER -->
	{#if activeTab === 'zoho'}
		<div class="space-y-6">
			<!-- Zoho Status Banner Card -->
			<div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
				<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
					<div>
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
								✉️
							</div>
							<div>
								<h2 class="text-lg font-bold text-gray-900">Zoho Mail Direct Auto-Responder</h2>
								<p class="text-xs text-gray-500">
									Directly reads student replies from your Zoho Inbox (<code class="bg-gray-100 px-1 py-0.5 rounded text-blue-700">imap.zoho.eu</code>) and replies via (<code class="bg-gray-100 px-1 py-0.5 rounded text-blue-700">smtp.zoho.eu</code>).
								</p>
							</div>
						</div>
					</div>

					<div class="flex items-center gap-3">
						<button
							type="button"
							on:click={checkZohoConnection}
							disabled={zohoChecking}
							class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
						>
							{#if zohoChecking}
								<span class="animate-spin">🔄</span> Checking Zoho...
							{:else}
								<span>🔌</span> Test Zoho Connection
							{/if}
						</button>
					</div>
				</div>

				<!-- Connection Feedback -->
				{#if zohoStatus}
					<div class="mt-4 p-4 rounded-lg {zohoStatus.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}">
						<div class="flex items-start justify-between">
							<div>
								<p class="font-bold text-sm">
									{zohoStatus.success ? '✅ Zoho Mail Connected Successfully!' : '⚠️ Zoho Connection Issue'}
								</p>
								<div class="text-xs mt-1.5 space-y-1">
									<p>IMAP (Reading emails): <strong>{zohoStatus.imapConnected ? 'Connected (imap.zoho.eu)' : 'Not Connected'}</strong></p>
									<p>SMTP (Sending replies): <strong>{zohoStatus.smtpConnected ? 'Connected (smtp.zoho.eu)' : 'Not Connected'}</strong></p>
									{#if zohoStatus.unreadCount !== undefined}
										<p class="text-sm font-extrabold text-blue-800 mt-2">
											📬 {zohoStatus.unreadCount} Unread student email(s) currently waiting in your Zoho Inbox.
										</p>
									{/if}
									{#if zohoStatus.error}
										<p class="text-red-600 font-semibold mt-2">{zohoStatus.error}</p>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 flex items-center justify-between">
						<span>Click <strong>Test Zoho Connection</strong> above to verify your credentials and check how many unread student emails are waiting.</span>
					</div>
				{/if}

				<!-- Action Controls -->
				<div class="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
					<div class="flex items-center gap-3 w-full sm:w-auto">
						<label class="text-xs font-semibold text-gray-700">Batch Limit:</label>
						<select
							bind:value={zohoLimit}
							class="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-amber-500 focus:border-amber-500"
						>
							<option value={5}>Process 5 emails</option>
							<option value={10}>Process 10 emails</option>
							<option value={20}>Process 20 emails</option>
							<option value={30}>Process 30 emails</option>
						</select>
					</div>

					<div class="flex items-center gap-3 w-full sm:w-auto">
						<button
							type="button"
							on:click={() => runZohoScanAndReply(true)}
							disabled={zohoPolling}
							class="flex-1 sm:flex-initial text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2.5 rounded-lg transition disabled:opacity-50"
						>
							🔍 Dry Run (Analyze without Sending)
						</button>

						<button
							type="button"
							on:click={() => runZohoScanAndReply(false)}
							disabled={zohoPolling}
							class="flex-1 sm:flex-initial text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
						>
							{#if zohoPolling}
								<span class="animate-spin">⏳</span> Processing & Replying...
							{:else}
								<span>🚀</span> Scan & Reply to Zoho Emails
							{/if}
						</button>
					</div>
				</div>
			</div>

			<!-- Live Batch Results Stream -->
			{#if zohoPollResult}
				<div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
					<div class="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
						<h3 class="font-bold text-sm text-gray-900">
							Batch Results ({zohoPollResult.repliedCount} Replied, {zohoPollResult.skippedCount} Skipped, {zohoPollResult.failedCount} Failed)
						</h3>
						<span class="text-xs text-gray-500">Total Processed: {zohoPollResult.processedCount}</span>
					</div>

					<div class="divide-y divide-gray-100">
						{#each zohoPollResult.items as item}
							<div class="p-4 flex items-start justify-between gap-4 text-xs">
								<div>
									<p class="font-bold text-gray-900">{item.from}</p>
									<p class="text-gray-600 mt-0.5">Subject: {item.subject}</p>
									{#if item.summary}
										<p class="text-gray-500 mt-1 italic">Summary: {item.summary}</p>
									{/if}
									{#if item.error}
										<p class="text-red-600 mt-1 font-semibold">{item.error}</p>
									{/if}
								</div>
								<span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider {item.status === 'replied' ? 'bg-green-100 text-green-800' : item.status.startsWith('skipped') ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}">
									{item.status}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Configuration Checklist -->
			<div class="bg-blue-50 border border-blue-200 rounded-xl p-5 text-xs text-blue-900">
				<h4 class="font-bold text-sm mb-2 text-blue-950">⚙️ Zoho Credentials Checklist</h4>
				<p class="mb-3">
					Make sure the following variables are configured in your <code class="bg-blue-100 px-1 py-0.5 rounded font-mono">.env</code> file:
				</p>
				<pre class="bg-white p-3 rounded border border-blue-200 font-mono text-[11px] text-gray-800 overflow-x-auto">
ZOHO_EMAIL=hello@abroaducate.com
ZOHO_APP_PASSWORD=xxxx xxxx xxxx xxxx
ZOHO_IMAP_HOST=imap.zoho.eu
ZOHO_SMTP_HOST=smtp.zoho.eu</pre>
			</div>
		</div>
	{/if}

	<!-- TAB 1: SIMULATOR -->
	{#if activeTab === 'simulator'}
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
			<!-- Left: Input Form -->
			<div class="lg:col-span-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
				<div>
					<h3 class="text-base font-bold text-gray-900 mb-3">Test Incoming Inquiries</h3>

					<!-- Presets -->
					<div class="mb-4">
						<label class="block text-xs font-semibold text-gray-500 mb-2">Load Quick Presets:</label>
						<div class="flex flex-wrap gap-1.5">
							{#each presets as p}
								<button
									type="button"
									on:click={() => applyPreset(p)}
									class="text-xs bg-gray-50 hover:bg-amber-50 hover:text-amber-700 border border-gray-200 px-2.5 py-1 rounded-md transition"
								>
									{p.title}
								</button>
							{/each}
						</div>
					</div>

					<div class="space-y-4">
						<div>
							<label class="block text-xs font-medium text-gray-700 mb-1">Student Sender Email</label>
							<input
								type="email"
								bind:value={simFrom}
								class="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
								placeholder="e.g. applicant@gmail.com"
							/>
						</div>

						<div>
							<label class="block text-xs font-medium text-gray-700 mb-1">Email Subject</label>
							<input
								type="text"
								bind:value={simSubject}
								class="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
								placeholder="Subject of inquiry..."
							/>
						</div>

						<div>
							<label class="block text-xs font-medium text-gray-700 mb-1">Email Body Text</label>
							<textarea
								bind:value={simText}
								rows="7"
								class="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
								placeholder="Type what an international student would send..."
							></textarea>
						</div>
					</div>
				</div>

				<div class="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
					<button
						type="button"
						on:click={() => runSimulation(false)}
						disabled={simLoading}
						class="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
					>
						{#if simLoading}
							<span class="animate-spin">⏳</span> Analyzing & Drafting...
						{:else}
							<span>⚡</span> Test Simulation (Dry Run)
						{/if}
					</button>

					<button
						type="button"
						on:click={() => runSimulation(true)}
						disabled={simLoading}
						class="bg-gray-900 hover:bg-black text-white font-medium py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50"
						title="Dispatches live outbound email to the sender"
					>
						🚀 Send Live
					</button>
				</div>

				{#if simError}
					<div class="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
						{simError}
					</div>
				{/if}
			</div>

			<!-- Right: AI Output Preview -->
			<div class="lg:col-span-7 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
				<h3 class="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
					<span>AI Analysis & Reply Preview</span>
					{#if simResult}
						<span class="text-xs font-normal text-gray-500">
							Latency: {simResult.processingMs}ms &bull; {simResult.isDryRun ? 'Dry Run' : 'Dispatched'}
						</span>
					{/if}
				</h3>

				{#if simLoading}
					<div class="h-96 flex flex-col items-center justify-center text-center p-8">
						<div class="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
						<p class="text-sm font-semibold text-gray-800">AI Senior Academic Advisor Thinking...</p>
						<p class="text-xs text-gray-500 mt-1 max-w-sm">
							Retrieving Abroaducate knowledge base, verifying student profile, checking loop guards & crafting grounded reply...
						</p>
					</div>
				{:else if simResult}
					<!-- Classification Badges -->
					<div class="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 space-y-2">
						<div class="flex flex-wrap items-center gap-2">
							<span class="text-xs font-bold uppercase tracking-wider text-gray-500">Category:</span>
							<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
								{simResult.classification?.category || 'general'}
							</span>

							<span class="text-xs font-bold uppercase tracking-wider text-gray-500 ml-2">Urgency:</span>
							<span class="px-2.5 py-0.5 rounded-full text-xs font-bold {simResult.classification?.urgency === 'critical' ? 'bg-red-100 text-red-800' : simResult.classification?.urgency === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-gray-200 text-gray-800'}">
								{simResult.classification?.urgency || 'normal'}
							</span>

							{#if simResult.escalated}
								<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
									🚨 Escalated: {simResult.classification?.escalationReason}
								</span>
							{/if}
						</div>

						<p class="text-xs text-gray-600">
							<strong>Summary:</strong> {simResult.classification?.summary || 'N/A'}
						</p>

						{#if simResult.studentProfile?.found}
							<div class="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 mt-2">
								✅ <strong>Registered Student Matched:</strong> {simResult.studentProfile.fullName || 'Student'} ({simResult.studentProfile.subscriptionTier || 'Starter'}) &bull; Target: {simResult.studentProfile.targetCountry || 'Global'}
							</div>
						{/if}
					</div>

					<!-- Outbound Subject & Body -->
					<div class="border border-gray-200 rounded-lg overflow-hidden">
						<div class="bg-gray-100 px-4 py-2 border-b border-gray-200 text-xs font-mono text-gray-700">
							<strong>Subject:</strong> {simResult.replySubject}
						</div>
						<div class="p-4 bg-white max-h-96 overflow-y-auto prose prose-sm max-w-none text-gray-800">
							{@html simResult.replyHtml}
						</div>
					</div>
				{:else}
					<div class="h-96 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-center p-6">
						<span class="text-4xl mb-3">✉️</span>
						<p class="text-sm font-semibold text-gray-700">Simulator is Ready</p>
						<p class="text-xs text-gray-400 mt-1 max-w-sm">
							Choose a preset or type a sample student email on the left, then click <strong>Test Simulation</strong> to see the AI's exact reasoning and drafted email.
						</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- TAB 2: LOGS -->
	{#if activeTab === 'logs'}
		<div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
			<div class="p-5 border-b border-gray-200 flex justify-between items-center">
				<h3 class="text-base font-bold text-gray-900">Email Processing Activity Stream</h3>
				<span class="text-xs text-gray-500">Showing last {logs.length} interactions</span>
			</div>

			{#if logs.length === 0}
				<div class="p-12 text-center text-gray-500 text-sm">
					No emails recorded yet. Once your webhook receives inquiries or you run a live simulation, they will appear here.
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200 text-left text-sm">
						<thead class="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
							<tr>
								<th class="px-6 py-3">Timestamp</th>
								<th class="px-6 py-3">Sender</th>
								<th class="px-6 py-3">Subject</th>
								<th class="px-6 py-3">Category</th>
								<th class="px-6 py-3">Status</th>
								<th class="px-6 py-3">Action</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200">
							{#each logs as log}
								<tr class="hover:bg-gray-50 transition">
									<td class="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
										{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										<br />
										<span class="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleDateString()}</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="font-medium text-gray-900 text-xs">{log.sender_name || log.sender_email}</div>
										<div class="text-gray-400 text-[11px]">{log.sender_email}</div>
									</td>
									<td class="px-6 py-4 text-xs text-gray-800 max-w-xs truncate">
										{log.subject}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700">
											{log.category}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="px-2.5 py-1 rounded-full text-xs font-semibold {log.status === 'replied' ? 'bg-green-100 text-green-800' : log.status === 'skipped_loop' ? 'bg-amber-100 text-amber-800' : log.status === 'escalated' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}">
											{log.status}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-xs">
										<button
											type="button"
											on:click={() => (selectedLog = log)}
											class="text-amber-600 hover:text-amber-800 font-medium"
										>
											View Details &rarr;
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}

	<!-- TAB 3: SETUP & WEBHOOK GUIDE -->
	{#if activeTab === 'setup'}
		<div class="space-y-6">
			<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
				<h3 class="text-base font-bold text-gray-900 mb-2">1. Your Webhook Endpoint</h3>
				<p class="text-sm text-gray-600 mb-4">
					Point your Cloudflare Email Worker, Resend, or SendGrid Inbound Parse to this URL:
				</p>
				<div class="bg-gray-900 text-amber-400 font-mono text-sm p-3.5 rounded-lg flex items-center justify-between">
					<span>https://www.abroaducate.com/api/ai-email-agent/webhook</span>
					<button
						type="button"
						on:click={() => navigator.clipboard.writeText('https://www.abroaducate.com/api/ai-email-agent/webhook')}
						class="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded transition"
					>
						Copy
					</button>
				</div>
			</div>

			<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
				<h3 class="text-base font-bold text-gray-900 mb-2">2. Cloudflare Email Routing Setup (Recommended)</h3>
				<p class="text-sm text-gray-600 mb-4">
					Because Abroaducate is powered by Cloudflare, you can route all incoming emails to <code class="bg-gray-100 text-amber-700 px-1.5 py-0.5 rounded">hello@abroaducate.com</code> for free without third-party email forwarding costs:
				</p>
				<ol class="list-decimal list-inside space-y-3 text-sm text-gray-700">
					<li>Open your <strong>Cloudflare Dashboard</strong> &rarr; <strong>Workers & Pages</strong> &rarr; Create a new Worker named <code class="bg-gray-100 px-1 rounded">abroaducate-email-agent-worker</code>.</li>
					<li>Copy the pre-built worker script located at <code class="bg-gray-100 px-1 rounded">scripts/cloudflare-email-worker.js</code> in this repo and deploy it.</li>
					<li>Under Worker Settings &rarr; Variables, set:
						<div class="bg-gray-50 border border-gray-200 p-2.5 rounded mt-1.5 font-mono text-xs">
							AI_EMAIL_AGENT_SECRET = {settings.escalationEmail ? 'your-secure-token' : 'configured-in-env'}
						</div>
					</li>
					<li>Go to <strong>Cloudflare Dashboard</strong> &rarr; <strong>Email Routing</strong> &rarr; <strong>Routing Rules</strong> &rarr; Add rule:
						<br />
						<span class="text-gray-500 text-xs ml-4">Match: <code>hello@abroaducate.com</code> &rarr; Action: <strong>Send to Worker</strong> &rarr; Destination: <code>abroaducate-email-agent-worker</code></span>
					</li>
				</ol>
			</div>

			<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
				<h3 class="text-base font-bold text-gray-900 mb-2">3. Outbound Email Dispatch</h3>
				<p class="text-sm text-gray-600 leading-relaxed">
					Replies are automatically dispatched using your existing <strong>Customer.io</strong> transactional integration (<code class="bg-gray-100 px-1">src/lib/server/email.server.ts</code>) using the official <code class="bg-gray-100 px-1">hello@abroaducate.com</code> sender identity.
				</p>
			</div>
		</div>
	{/if}

	<!-- TAB 4: SETTINGS -->
	{#if activeTab === 'settings'}
		<div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-2xl">
			<h3 class="text-base font-bold text-gray-900 mb-6">AI Email Agent Configuration</h3>

			<form on:submit|preventDefault={saveSettings} class="space-y-6">
				<!-- Master Toggle -->
				<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
					<div>
						<p class="font-semibold text-sm text-gray-900">Enable AI Email Agent</p>
						<p class="text-xs text-gray-500">Master switch to turn automated email processing on or off</p>
					</div>
					<input
						type="checkbox"
						bind:checked={settings.agentEnabled}
						class="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
					/>
				</div>

				<!-- Autonomous Mode Toggle -->
				<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
					<div>
						<p class="font-semibold text-sm text-gray-900">Autonomous Replying</p>
						<p class="text-xs text-gray-500">When enabled, sends email immediately to the student without manual confirmation</p>
					</div>
					<input
						type="checkbox"
						bind:checked={settings.autonomousMode}
						class="w-5 h-5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
					/>
				</div>

				<!-- Escalation Email -->
				<div>
					<label class="block text-xs font-semibold text-gray-700 mb-1">Human Escalation Alert Email</label>
					<input
						type="email"
						bind:value={settings.escalationEmail}
						class="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
					/>
					<p class="text-xs text-gray-400 mt-1">
						Where alerts are sent if a student asks for a refund, expresses anger, or requires human intervention.
					</p>
				</div>

				<!-- Max Replies Per User -->
				<div>
					<label class="block text-xs font-semibold text-gray-700 mb-1">Max Daily Replies Per Sender</label>
					<input
						type="number"
						bind:value={settings.dailyReplyLimitPerUser}
						min="1"
						max="50"
						class="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
					/>
					<p class="text-xs text-gray-400 mt-1">Prevents loop cascading if a user sends multiple inquiries</p>
				</div>

				<!-- Model Selection -->
				<div>
					<label class="block text-xs font-semibold text-gray-700 mb-1">LLM Model</label>
					<select
						bind:value={settings.modelName}
						class="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
					>
						<option value="gpt-4o-mini">OpenAI GPT-4o Mini (Fast, Cost-effective, Recommended)</option>
						<option value="gpt-4o">OpenAI GPT-4o (Most capable)</option>
						<option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
						<option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
					</select>
				</div>

				{#if settingsSavedMsg}
					<div class="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg">
						{settingsSavedMsg}
					</div>
				{/if}

				<div class="pt-4 border-t border-gray-100 flex justify-end">
					<button
						type="submit"
						disabled={savingSettings}
						class="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 px-6 rounded-lg text-sm transition shadow-sm disabled:opacity-50"
					>
						{savingSettings ? 'Saving...' : 'Save Configuration'}
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Modal: Log Details -->
	{#if selectedLog}
		<div class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
			<div class="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
				<div class="flex items-center justify-between pb-4 border-b border-gray-200">
					<div>
						<h3 class="font-bold text-lg text-gray-900">Email Interaction Details</h3>
						<p class="text-xs text-gray-500">ID: {selectedLog.id} &bull; {new Date(selectedLog.created_at).toLocaleString()}</p>
					</div>
					<button
						type="button"
						on:click={() => (selectedLog = null)}
						class="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1"
					>
						&times;
					</button>
				</div>

				<div class="py-4 space-y-4 text-sm">
					<div class="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg text-xs">
						<div><strong>From:</strong> {selectedLog.sender_name || ''} &lt;{selectedLog.sender_email}&gt;</div>
						<div><strong>Subject:</strong> {selectedLog.subject}</div>
						<div><strong>Category:</strong> {selectedLog.category}</div>
						<div><strong>Status:</strong> {selectedLog.status}</div>
						<div><strong>Model:</strong> {selectedLog.model_used || 'N/A'}</div>
						<div><strong>Latency:</strong> {selectedLog.processing_ms}ms</div>
					</div>

					<div>
						<h4 class="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">Incoming Message Body</h4>
						<div class="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 whitespace-pre-wrap">
							{selectedLog.incoming_body}
						</div>
					</div>

					{#if selectedLog.reply_body}
						<div>
							<h4 class="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-1">AI Response Sent</h4>
							<div class="p-4 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 whitespace-pre-wrap">
								{selectedLog.reply_body}
							</div>
						</div>
					{/if}

					{#if selectedLog.status === 'failed' && selectedLog.error_message}
						<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
							<strong>Error / Reason:</strong> {selectedLog.error_message}
						</div>
					{/if}
				</div>

				<div class="pt-4 border-t border-gray-200 flex justify-end">
					<button
						type="button"
						on:click={() => (selectedLog = null)}
						class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
