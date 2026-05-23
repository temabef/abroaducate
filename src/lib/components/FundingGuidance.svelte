<script lang="ts">
	import { ExternalLink, Lightbulb, Search, Mail, BookOpen, Users, Globe } from 'lucide-svelte';

	interface Props {
		country: string;
		degreeLevel: string;
		universityName: string;
		programName: string;
	}

	let { country, degreeLevel, universityName, programName }: Props = $props();

	// ── Funding structure lookup ──────────────────────────────────────────────
	// Based on how funding actually works in each of our 9 countries.
	// Degree level: 'master' | 'phd' | 'bachelor'

	type FundingTip = {
		icon: any;
		title: string;
		description: string;
		link?: { label: string; url: string };
	};

	type CountryProfile = {
		headline: string;
		context: string;
		tips: FundingTip[];
	};

	const level = (degreeLevel || 'master').toLowerCase();
	const isPhD = level === 'phd' || level === 'doctorate' || level === 'doctoral';
	const isMaster = !isPhD && level !== 'bachelor';
	const c = (country || '').toLowerCase();

	function getProfile(): CountryProfile {
		// PhD — same advice across all countries, with country-specific links
		if (isPhD) {
			const euroaxessUrl = `https://euraxess.ec.europa.eu/jobs/search?query=${encodeURIComponent(country)}`;
			return {
				headline: 'How PhD funding works in ' + country,
				context: 'PhD positions in Europe are almost always funded through advertised research positions — not traditional scholarships. The university or research group pays you a salary or stipend to do your research. The key is finding an open position, not applying for a scholarship.',
				tips: [
					{
						icon: Search,
						title: 'Search EURAXESS for open positions',
						description: 'EURAXESS is the official EU research jobs board. Filter by country and field to find funded PhD positions posted by universities.',
						link: { label: 'Search EURAXESS', url: euroaxessUrl }
					},
					{
						icon: Globe,
						title: 'Check the university\'s open positions page',
						description: `Go directly to ${universityName}'s website and look for "Open Positions", "PhD Vacancies", or "Graduate School" — most funded positions are listed there first.`
					},
					{
						icon: Mail,
						title: 'Email professors directly',
						description: 'Find professors at this university whose research matches your interest. A well-targeted cold email explaining your background and research interest is the most effective path to a funded PhD position.'
					},
					{
						icon: Users,
						title: 'Contact the graduate committee',
						description: 'Reach out to the department\'s graduate admissions or PhD coordinator. Ask specifically about funded positions and whether any research groups are currently recruiting.'
					}
				]
			};
		}

		// Master's — country-specific
		if (c.includes('germany')) {
			return {
				headline: 'How Master\'s funding works in Germany',
				context: 'German public universities charge zero or near-zero tuition. The main funding challenge is living costs (€800–1,100/month). DAAD is the primary funding body for international students.',
				tips: [
					{
						icon: Search,
						title: 'DAAD Scholarship Database',
						description: 'The German Academic Exchange Service (DAAD) runs dozens of scholarship programs for international Master\'s students. Search by field and nationality.',
						link: { label: 'Search DAAD scholarships', url: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/' }
					},
					{
						icon: Lightbulb,
						title: 'Deutschlandstipendium',
						description: `${universityName} may offer the Deutschlandstipendium — a €300/month merit scholarship co-funded by the university and private sponsors. Apply directly through the university.`
					},
					{
						icon: Globe,
						title: 'Heinrich Böll & Friedrich Ebert Foundations',
						description: 'German political foundations (Heinrich Böll, Friedrich Ebert, Konrad Adenauer) offer generous scholarships for international students with strong academic and civic records.',
						link: { label: 'Heinrich Böll Foundation', url: 'https://www.boell.de/en/foundation-scholarships' }
					},
					{
						icon: BookOpen,
						title: 'Check the university scholarship page',
						description: `${universityName} may have its own merit scholarships or emergency funds. Check their international office or financial aid page directly.`
					}
				]
			};
		}

		if (c.includes('france')) {
			return {
				headline: 'How Master\'s funding works in France',
				context: 'French public universities have low tuition (€243–380/year for EU students, higher for non-EU). The main funding routes are the Eiffel Excellence Scholarship and Campus France programs.',
				tips: [
					{
						icon: Search,
						title: 'Eiffel Excellence Scholarship',
						description: 'The French government\'s flagship scholarship for international Master\'s students. Covers living costs + travel. Highly competitive — apply early.',
						link: { label: 'Eiffel Scholarship', url: 'https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence' }
					},
					{
						icon: Globe,
						title: 'Campus France Scholarship Search',
						description: 'Campus France lists all French government and university scholarships for international students in one place.',
						link: { label: 'Campus France', url: 'https://www.campusfrance.org/en/scholarships-and-financial-aids' }
					},
					{
						icon: BookOpen,
						title: 'University excellence grants',
						description: `${universityName} may offer its own excellence grants or tuition waivers for high-achieving international students. Check their international admissions page.`
					},
					{
						icon: Mail,
						title: 'Contact the international office',
						description: 'French universities often have emergency funds and smaller grants not listed publicly. The international student office is the best place to ask.'
					}
				]
			};
		}

		if (c.includes('sweden')) {
			return {
				headline: 'How Master\'s funding works in Sweden',
				context: 'Sweden charges tuition for non-EU students (€7,500–25,000/year). The Swedish Institute scholarship is the main route for international students and is highly competitive.',
				tips: [
					{
						icon: Search,
						title: 'Swedish Institute Scholarships',
						description: 'The Swedish Institute offers full scholarships covering tuition + living costs for Master\'s students from eligible countries. Applications open in November.',
						link: { label: 'Swedish Institute', url: 'https://si.se/en/apply/scholarships/' }
					},
					{
						icon: Globe,
						title: 'University-specific scholarships',
						description: `${universityName} may offer its own merit scholarships or tuition waivers for international students. Check their scholarship page directly.`
					},
					{
						icon: Lightbulb,
						title: 'Adlerbert Study Scholarships',
						description: 'Chalmers University and some other Swedish universities offer the Adlerbert scholarship for non-EU students. Check if this university participates.'
					}
				]
			};
		}

		if (c.includes('italy')) {
			return {
				headline: 'How Master\'s funding works in Italy',
				context: 'Italian public universities have income-based tuition (often €0–3,000/year for low-income students). The DSU regional scholarship system is the main funding route.',
				tips: [
					{
						icon: Search,
						title: 'DSU Regional Scholarship (Borsa di Studio)',
						description: 'Each Italian region has a DSU (Diritto allo Studio Universitario) body that offers income-based scholarships covering tuition + living costs. Apply through the regional DSU office.',
						link: { label: 'Find your regional DSU', url: 'https://www.studiare-in-italia.it/studentistranieri/index.html' }
					},
					{
						icon: Globe,
						title: 'Italian Government Scholarships (MAECI)',
						description: 'The Italian Ministry of Foreign Affairs offers scholarships for international students. Applications open annually through the Italian embassy in your country.',
						link: { label: 'MAECI Scholarships', url: 'https://www.esteri.it/en/opportunities/scholarships/' }
					},
					{
						icon: BookOpen,
						title: 'University merit scholarships',
						description: `${universityName} may offer merit-based fee waivers or scholarships for high-GPA international students. Check their international office.`
					}
				]
			};
		}

		if (c.includes('poland')) {
			return {
				headline: 'How Master\'s funding works in Poland',
				context: 'Polish public universities offer low tuition (€1,000–4,000/year). The Polish government runs the Stefan Banach scholarship program for students from Eastern Europe and Central Asia.',
				tips: [
					{
						icon: Search,
						title: 'Stefan Banach Scholarship (NAWA)',
						description: 'The Polish National Agency for Academic Exchange (NAWA) offers the Stefan Banach scholarship for students from Eastern Europe, Central Asia, and the South Caucasus.',
						link: { label: 'NAWA Scholarships', url: 'https://nawa.gov.pl/en/students/scholarships-for-foreigners' }
					},
					{
						icon: Globe,
						title: 'Polish Government Scholarships',
						description: 'The Polish government offers scholarships through bilateral agreements with many countries. Check with the Polish embassy in your home country.',
						link: { label: 'Study in Poland', url: 'https://www.study.gov.pl/en/scholarships' }
					},
					{
						icon: BookOpen,
						title: 'University merit awards',
						description: `${universityName} may offer rector's scholarships or merit awards for high-achieving international students. Contact their international office.`
					}
				]
			};
		}

		if (c.includes('austria')) {
			return {
				headline: 'How Master\'s funding works in Austria',
				context: 'Austrian public universities charge a semester fee (€363.36/semester). The OeAD (Austrian Agency for Education and Internationalisation) manages most scholarship programs.',
				tips: [
					{
						icon: Search,
						title: 'OeAD Scholarship Programs',
						description: 'The Austrian Agency for Education and Internationalisation (OeAD) offers several scholarship programs for international Master\'s students.',
						link: { label: 'OeAD Scholarships', url: 'https://oead.at/en/to-austria/grants-and-scholarships/' }
					},
					{
						icon: Globe,
						title: 'Ernst Mach Grant',
						description: 'The Ernst Mach Grant supports international students for short research stays and full degree programs in Austria. Check eligibility for your country.',
						link: { label: 'Ernst Mach Grant', url: 'https://oead.at/en/to-austria/grants-and-scholarships/ernst-mach-grant-worldwide/' }
					},
					{
						icon: BookOpen,
						title: 'University scholarships',
						description: `${universityName} may offer its own merit scholarships. Check their scholarship and financial aid pages directly.`
					}
				]
			};
		}

		if (c.includes('czechia') || c.includes('czech')) {
			return {
				headline: 'How Master\'s funding works in Czechia',
				context: 'Czech public universities offer free tuition for programs taught in Czech. English-taught programs charge €1,500–8,000/year. Government scholarships are available through bilateral agreements.',
				tips: [
					{
						icon: Search,
						title: 'Czech Government Scholarships',
						description: 'The Czech Ministry of Education offers government scholarships for students from developing countries through bilateral agreements. Apply through the Czech embassy.',
						link: { label: 'Study in Czech Republic', url: 'https://www.dzs.cz/en/czech-republic-scholarships/' }
					},
					{
						icon: Globe,
						title: 'DZS Scholarship Programs',
						description: 'The Czech National Agency for International Education (DZS) manages several scholarship programs for international students.',
						link: { label: 'DZS Scholarships', url: 'https://www.dzs.cz/en/' }
					},
					{
						icon: BookOpen,
						title: 'University merit scholarships',
						description: `${universityName} may offer its own scholarships or tuition waivers. Contact their international office or check their website directly.`
					},
					{
						icon: Mail,
						title: 'Contact the department directly',
						description: 'Some Czech departments have discretionary funds for outstanding international students. A direct email to the program coordinator is worth trying.'
					}
				]
			};
		}

		if (c.includes('lithuania')) {
			return {
				headline: 'How Master\'s funding works in Lithuania',
				context: 'Lithuanian public universities charge €1,500–5,000/year for international students. The Lithuanian government offers scholarships through bilateral agreements, and some universities have their own merit awards.',
				tips: [
					{
						icon: Search,
						title: 'Lithuanian Government Scholarships',
						description: 'The Lithuanian Ministry of Education offers scholarships for students from countries with bilateral agreements. Check with the Lithuanian embassy in your country.',
						link: { label: 'Study in Lithuania', url: 'https://www.studyinlithuania.lt/en/scholarships' }
					},
					{
						icon: Globe,
						title: 'EUROSTIPENDIUM',
						description: 'Some Lithuanian universities participate in regional scholarship programs. Check the university\'s international office for current opportunities.',
					},
					{
						icon: BookOpen,
						title: 'University merit scholarships',
						description: `${universityName} may offer its own merit scholarships or partial tuition waivers for high-achieving international students. Contact their international admissions office.`
					},
					{
						icon: Mail,
						title: 'Contact the international office',
						description: 'Lithuanian universities often have emergency funds and smaller grants. The international student office is the best starting point.'
					}
				]
			};
		}

		if (c.includes('estonia')) {
			return {
				headline: 'How Master\'s funding works in Estonia',
				context: 'Estonian universities charge €1,660–7,500/year for international students. Scholarships are limited but the Estonian government and some universities offer merit-based support.',
				tips: [
					{
						icon: Search,
						title: 'Archimedes Foundation Scholarships',
						description: 'The Archimedes Foundation manages Estonian government scholarships for international students. Check their current programs.',
						link: { label: 'Archimedes Foundation', url: 'https://archimedes.ee/en/scholarships/' }
					},
					{
						icon: Globe,
						title: 'Study in Estonia Scholarships',
						description: 'The Study in Estonia portal lists all available scholarships for international students studying in Estonia.',
						link: { label: 'Study in Estonia', url: 'https://www.studyinestonia.ee/scholarships' }
					},
					{
						icon: BookOpen,
						title: 'University merit awards',
						description: `${universityName} may offer merit-based scholarships or tuition reductions. Contact their international office directly.`
					}
				]
			};
		}

		// Generic fallback for any other country
		return {
			headline: 'How to fund your Master\'s in ' + country,
			context: 'No scholarships in our catalog match this program yet. Here are the most effective ways to find funding for this degree.',
			tips: [
				{
					icon: Globe,
					title: 'Check the university scholarship page',
					description: `${universityName} may offer its own merit scholarships, tuition waivers, or emergency funds for international students.`
				},
				{
					icon: Search,
					title: 'Search your home country\'s scholarship programs',
					description: 'Many governments offer scholarships for citizens studying abroad. Check with your national scholarship agency or ministry of education.'
				},
				{
					icon: Mail,
					title: 'Contact the international office',
					description: 'The university\'s international student office often knows about funding opportunities not listed publicly.'
				}
			]
		};
	}

	const profile = $derived(getProfile());

	// EuroAxess link for PhD
	const euroaxessUrl = $derived(
		isPhD
			? `https://euraxess.ec.europa.eu/jobs/search?query=${encodeURIComponent(country + ' ' + programName)}`
			: null
	);

	// University scholarship search URL (Google search as fallback)
	const uniScholarshipUrl = $derived(
		`https://www.google.com/search?q=${encodeURIComponent(universityName + ' scholarship international students')}`
	);
</script>

<div class="funding-guidance">
	<!-- Header -->
	<div class="fg-header">
		<div class="fg-header-icon">
			<Lightbulb size={20} />
		</div>
		<div>
			<h3 class="fg-title">{profile.headline}</h3>
			<p class="fg-context">{profile.context}</p>
		</div>
	</div>

	<!-- Tips -->
	<div class="fg-tips">
		{#each profile.tips as tip}
			{@const TipIcon = tip.icon}
			<div class="fg-tip">
				<div class="fg-tip-icon">
					<TipIcon size={16} />
				</div>
				<div class="fg-tip-body">
					<div class="fg-tip-title">{tip.title}</div>
					<p class="fg-tip-desc">{tip.description}</p>
					{#if tip.link}
						<a href={tip.link.url} target="_blank" rel="noopener noreferrer" class="fg-tip-link">
							{tip.link.label} <ExternalLink size={12} />
						</a>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Action links -->
	<div class="fg-actions">
		{#if isPhD && euroaxessUrl}
			<a href={euroaxessUrl} target="_blank" rel="noopener noreferrer" class="fg-action-btn fg-action-primary">
				<Search size={14} />
				Search funded PhD positions on EURAXESS
				<ExternalLink size={12} />
			</a>
		{/if}
		<a href={uniScholarshipUrl} target="_blank" rel="noopener noreferrer" class="fg-action-btn fg-action-secondary">
			<Globe size={14} />
			Find {universityName} scholarships
			<ExternalLink size={12} />
		</a>
		<a href="/scholarships" class="fg-action-btn fg-action-ghost">
			<BookOpen size={14} />
			Browse all scholarships in our catalog
		</a>
	</div>
</div>

<style>
	.funding-guidance {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.fg-header {
		display: flex;
		gap: 0.875rem;
		align-items: flex-start;
	}
	.fg-header-icon {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.625rem;
		background: rgba(255, 255, 255, 0.15);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: #fde68a;
	}
	.fg-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: white;
		margin-bottom: 0.375rem;
		font-family: 'Outfit', sans-serif;
	}
	.fg-context {
		font-size: 0.875rem;
		color: rgba(255, 255, 255, 0.75);
		line-height: 1.6;
	}

	.fg-tips {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}
	.fg-tip {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.875rem;
		padding: 0.875rem 1rem;
	}
	.fg-tip-icon {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.12);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: #6ee7b7;
		margin-top: 0.125rem;
	}
	.fg-tip-body {
		flex: 1;
		min-width: 0;
	}
	.fg-tip-title {
		font-size: 0.875rem;
		font-weight: 700;
		color: white;
		margin-bottom: 0.25rem;
	}
	.fg-tip-desc {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.55;
	}
	.fg-tip-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.5rem;
		font-size: 0.75rem;
		font-weight: 700;
		color: #6ee7b7;
		text-decoration: none;
		transition: color 0.15s;
	}
	.fg-tip-link:hover { color: #a7f3d0; }

	.fg-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}
	.fg-action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		border-radius: 0.625rem;
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.15s;
	}
	.fg-action-primary {
		background: white;
		color: #065f46;
	}
	.fg-action-primary:hover { background: #ecfdf5; }
	.fg-action-secondary {
		background: rgba(255, 255, 255, 0.12);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}
	.fg-action-secondary:hover { background: rgba(255, 255, 255, 0.2); }
	.fg-action-ghost {
		background: transparent;
		color: rgba(255, 255, 255, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	.fg-action-ghost:hover { color: white; border-color: rgba(255, 255, 255, 0.25); }
</style>
