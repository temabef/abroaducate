<script lang="ts">
	import {
		FileText,
		ExternalLink,
		ChevronLeft,
		CheckCircle2,
		BookOpen,
		FlaskConical,
		Users,
		Info
	} from 'lucide-svelte';

	const templates = [
		{
			name: 'Europass CV',
			description:
				'The official European standard. Widely accepted across all 10 countries on Abroaducate. Free, multilingual, and recognised by every European university admissions office.',
			url: 'https://europa.eu/europass/en/create-europass-cv',
			badge: 'Recommended',
			badgeColor: 'bg-emerald-100 text-emerald-700',
			tips: [
				'Accepted by German, French, Swedish, and all other EU universities',
				'Available in 30+ languages — useful for non-English programs',
				'Structured format means admissions staff can scan it quickly'
			]
		},
		{
			name: 'Overleaf Academic CV (LaTeX)',
			description:
				'Clean, professional LaTeX templates used by STEM and research applicants. Ideal for PhD applications and research-heavy programs.',
			url: 'https://www.overleaf.com/gallery/tagged/cv',
			badge: 'STEM / PhD',
			badgeColor: 'bg-blue-100 text-blue-700',
			tips: [
				'Free Overleaf account required',
				'Best for STEM, engineering, and research roles',
				'Looks highly professional with zero design effort'
			]
		},
		{
			name: 'Harvard Office of Career Services',
			description:
				'Simple, clean Word-based CV and resume templates. Good starting point for humanities, social sciences, and business programs.',
			url: 'https://careerservices.fas.harvard.edu/channels/create-a-resume-cv-or-cover-letter/',
			badge: 'Humanities / Business',
			badgeColor: 'bg-purple-100 text-purple-700',
			tips: [
				'Free Word/PDF download, no account needed',
				'Well-structured for non-STEM fields',
				'Easy to customise in Microsoft Word or Google Docs'
			]
		}
	];

	const sections = [
		{
			title: 'Personal Information',
			items: ['Full name', 'Email address', 'Phone number', 'LinkedIn or personal website (optional)', 'Nationality']
		},
		{
			title: 'Education',
			items: [
				'Degree, field of study, institution name',
				'Graduation year (or expected)',
				'GPA / grade (if strong — include the scale, e.g. 3.8/4.0)',
				'Thesis title (for Master\'s / PhD applicants)'
			]
		},
		{
			title: 'Work & Research Experience',
			items: [
				'Job title, employer, dates',
				'2–3 bullet points per role — focus on impact, not just duties',
				'Research positions, lab work, fieldwork',
				'Internships and relevant part-time work'
			]
		},
		{
			title: 'Skills & Languages',
			items: [
				'Language proficiency (use CEFR levels: A1–C2)',
				'Technical skills relevant to your field',
				'Software tools (e.g. SPSS, R, AutoCAD, Python)',
				'IELTS / TOEFL score if strong'
			]
		},
		{
			title: 'Additional Sections (if relevant)',
			items: [
				'Publications or conference presentations',
				'Awards and scholarships received',
				'Volunteer work and community involvement',
				'Certifications and professional training'
			]
		}
	];

	const fieldTips = [
		{
			icon: FlaskConical,
			label: 'STEM & Engineering',
			color: 'bg-blue-50 text-blue-600',
			tips: [
				'Lead with technical skills and tools',
				'Include research projects and lab experience',
				'List programming languages and software',
				'Publications and conference papers go near the top'
			]
		},
		{
			icon: BookOpen,
			label: 'Humanities & Social Sciences',
			color: 'bg-purple-50 text-purple-600',
			tips: [
				'Emphasise writing, research, and analytical skills',
				'Include languages and cultural competencies',
				'Teaching experience is valued',
				'Conference presentations and publications matter'
			]
		},
		{
			icon: Users,
			label: 'Business & Management',
			color: 'bg-emerald-50 text-emerald-600',
			tips: [
				'Quantify achievements (%, revenue, team size)',
				'Leadership roles and project management',
				'Internships and industry experience',
				'Keep it to 1–2 pages maximum'
			]
		}
	];
</script>

<svelte:head>
	<title>CV Templates for European University Applications | Abroaducate</title>
	<meta
		name="description"
		content="Free CV templates and guidance for applying to European universities. Europass, LaTeX, and Word templates with field-specific tips."
	/>
</svelte:head>

<div class="min-h-screen bg-slate-50 pt-20 pb-20">
	<!-- Header -->
	<div class="bg-white border-b border-slate-200">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
			<a
				href="/dashboard"
				class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-6"
			>
				<ChevronLeft size={16} /> Back to Dashboard
			</a>
			<div class="flex items-center gap-4">
				<div
					class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100"
				>
					<FileText size={24} strokeWidth={2} />
				</div>
				<div>
					<h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
						CV Templates & Guidance
					</h1>
					<p class="text-slate-500 mt-1">
						Free templates and tips for European university applications.
					</p>
				</div>
			</div>
		</div>
	</div>

	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

		<!-- Info callout -->
		<div class="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
			<Info size={18} class="flex-shrink-0 mt-0.5" />
			<p>
				Unlike your SOP or motivation letter, your CV is a <strong>standard document</strong> — you write
				it once and submit the same one to every program. Pick a template below, fill it in, and you're
				done. No need to regenerate it per application.
			</p>
		</div>

		<!-- Templates -->
		<section>
			<h2 class="text-xl font-extrabold text-slate-900 mb-6" style="font-family: 'Outfit', sans-serif;">
				Recommended Templates
			</h2>
			<div class="space-y-4">
				{#each templates as t}
					<div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
						<div class="flex items-start justify-between gap-4 mb-3">
							<div class="flex items-center gap-3">
								<h3 class="text-lg font-bold text-slate-900">{t.name}</h3>
								<span class="text-xs font-bold px-2.5 py-1 rounded-full {t.badgeColor}">{t.badge}</span>
							</div>
							<a
								href={t.url}
								target="_blank"
								rel="noopener noreferrer"
								class="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors"
							>
								Open Template <ExternalLink size={13} />
							</a>
						</div>
						<p class="text-slate-600 text-sm leading-relaxed mb-4">{t.description}</p>
						<ul class="space-y-1.5">
							{#each t.tips as tip}
								<li class="flex items-start gap-2 text-sm text-slate-600">
									<CheckCircle2 size={15} class="text-emerald-500 flex-shrink-0 mt-0.5" />
									{tip}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</section>

		<!-- What to include -->
		<section>
			<h2 class="text-xl font-extrabold text-slate-900 mb-2" style="font-family: 'Outfit', sans-serif;">
				What to include in your CV
			</h2>
			<p class="text-slate-500 text-sm mb-6">
				European universities expect a structured academic CV, not a one-page resume. Here's what
				every section should cover.
			</p>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each sections as section}
					<div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
						<h3 class="font-bold text-slate-900 text-sm mb-3">{section.title}</h3>
						<ul class="space-y-1.5">
							{#each section.items as item}
								<li class="flex items-start gap-2 text-sm text-slate-600">
									<span class="text-orange-400 font-bold mt-0.5 flex-shrink-0">—</span>
									{item}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</section>

		<!-- Field-specific tips -->
		<section>
			<h2 class="text-xl font-extrabold text-slate-900 mb-6" style="font-family: 'Outfit', sans-serif;">
				Tips by field
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each fieldTips as f}
					<div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
						<div class="w-9 h-9 rounded-lg {f.color} flex items-center justify-center mb-3">
							<f.icon size={18} />
						</div>
						<h3 class="font-bold text-slate-900 text-sm mb-3">{f.label}</h3>
						<ul class="space-y-1.5">
							{#each f.tips as tip}
								<li class="flex items-start gap-1.5 text-xs text-slate-500">
									<span class="text-slate-300 mt-0.5 flex-shrink-0">—</span>{tip}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</section>

		<!-- Quick tips -->
		<section class="bg-[#0f172a] rounded-2xl p-8 text-white">
			<h2 class="text-xl font-extrabold mb-6" style="font-family: 'Outfit', sans-serif;">
				Quick rules for European CVs
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each [
					{ do: true, text: 'Keep it to 2 pages maximum (1 page for Bachelor\'s applicants)' },
					{ do: true, text: 'Use reverse chronological order — most recent first' },
					{ do: true, text: 'Include a professional photo (expected in Germany, France, and most EU countries)' },
					{ do: true, text: 'State your nationality — relevant for scholarship eligibility checks' },
					{ do: false, text: 'Don\'t include an "Objective" section — it\'s outdated' },
					{ do: false, text: 'Don\'t use a US-style one-page resume format for academic applications' },
					{ do: false, text: 'Don\'t list references — "Available on request" is sufficient' },
					{ do: false, text: 'Don\'t use fancy graphics or columns — plain structured text scans better' }
				] as rule}
					<div class="flex items-start gap-3 text-sm">
						<span class="font-bold flex-shrink-0 {rule.do ? 'text-emerald-400' : 'text-red-400'}">{rule.do ? '✓' : '✗'}</span>
						<span class="text-slate-300">{rule.text}</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- Back to documents -->
		<div class="flex flex-wrap gap-3">
			{#each [
				{ href: '/sop', label: 'Write your SOP', hint: 'AI-generated, program-specific' },
				{ href: '/cover-letters', label: 'Write a Cover Letter', hint: 'For programs & professors' },
				{ href: '/personal-statements', label: 'Write a Personal Statement', hint: 'Scholarship & admission' }
			] as link}
				<a
					href={link.href}
					class="flex-1 min-w-[200px] flex items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
				>
					<div>
						<div class="text-sm font-bold text-slate-900">{link.label}</div>
						<div class="text-xs text-slate-500">{link.hint}</div>
					</div>
					<ExternalLink size={14} class="text-slate-400 group-hover:text-orange-500 transition-colors flex-shrink-0" />
				</a>
			{/each}
		</div>

	</div>
</div>
