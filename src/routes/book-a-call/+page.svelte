<script lang="ts">
	import { ArrowLeft, Clock, CheckCircle2, Users, Target, MessageSquare } from 'lucide-svelte';
	import { onMount } from 'svelte';

	const CALENDLY_URL = 'https://calendly.com/hello-abroaducate/30min';

	onMount(() => {
		// Load Calendly widget script
		const script = document.createElement('script');
		script.src = 'https://assets.calendly.com/assets/external/widget.js';
		script.async = true;
		document.head.appendChild(script);
	});
</script>

<svelte:head>
	<title>Book a Free Call — Abroaducate</title>
	<meta name="description" content="Book a free 30-minute consultation. Get personalised advice on which programs and scholarships to target for your profile." />
	<link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet" />
</svelte:head>

<div class="min-h-screen bg-slate-50 pt-20 pb-16">
	<!-- Page header -->
	<div class="bg-white border-b border-slate-200">
		<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
			<a href="/contact" class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6">
				<ArrowLeft size={15} /> Back to Contact
			</a>
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 border border-orange-100">
					<Clock size={24} strokeWidth={2} />
				</div>
				<div>
					<h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Book a Free 30-Minute Call</h1>
					<p class="text-slate-500 mt-1">Personalised advice on programs, scholarships, and your application strategy.</p>
				</div>
			</div>
		</div>
	</div>

	<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

			<!-- What to expect -->
			<div class="space-y-5">
				<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
					<h3 class="font-bold text-slate-900 mb-4">What we'll cover</h3>
					<ul class="space-y-3">
						{#each [
							{ icon: Target, text: 'Review your academic profile and target countries' },
							{ icon: CheckCircle2, text: 'Identify the best-fit programs for your background' },
							{ icon: Users, text: 'Match you with scholarships you can realistically win' },
							{ icon: MessageSquare, text: 'Answer any questions about the application process' }
						] as item}
							<li class="flex items-start gap-3">
								<div class="w-7 h-7 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
									<item.icon size={14} />
								</div>
								<span class="text-sm text-slate-600">{item.text}</span>
							</li>
						{/each}
					</ul>
				</div>

				<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
					<h3 class="font-bold text-slate-900 mb-3">Details</h3>
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<Clock size={16} class="text-slate-400" />
							<span class="text-sm text-slate-600">30 minutes</span>
						</div>
						<div class="flex items-center gap-3">
							<CheckCircle2 size={16} class="text-emerald-500" />
							<span class="text-sm text-slate-600">Completely free</span>
						</div>
						<div class="flex items-center gap-3">
							<Users size={16} class="text-slate-400" />
							<span class="text-sm text-slate-600">Video call (Google Meet)</span>
						</div>
					</div>
				</div>

				<div class="bg-slate-900 rounded-2xl p-6 text-white">
					<p class="text-sm font-semibold text-slate-300 mb-2">Not ready to book?</p>
					<p class="text-sm text-slate-400 mb-4">Send us a message and we'll get back to you within 24–48 hours.</p>
					<a href="/contact" class="block text-center w-full bg-white text-slate-900 font-bold py-2.5 rounded-xl hover:bg-slate-100 transition-colors text-sm">
						Send a message
					</a>
				</div>
			</div>

			<!-- Calendly embed -->
			<div class="lg:col-span-2">
				<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
					<!-- Calendly inline widget -->
					<div
						class="calendly-inline-widget"
						data-url="{CALENDLY_URL}?hide_gdpr_banner=1&primary_color=f97316"
						style="min-width:320px;height:900px;"
					></div>
				</div>
			</div>
		</div>
	</div>
</div>
