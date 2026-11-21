<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		title?: string;
		description?: string;
		canonical?: string;
		image?: string;
		type?: string;
		keywords?: string;
		schemaType?: 'WebSite' | 'WebPage' | 'Article' | 'Product';
		structuredData?: any;
		/** Article only */
		datePublished?: string;
		dateModified?: string;
		authorName?: string;
	}

	const SITE = 'https://abroaducate.com';
	const DEFAULT_IMAGE = `${SITE}/og-image.png`;

	let {
		title = 'Abroaducate',
		description = 'Expert guides, tips, and insights for your study abroad journey.',
		canonical: canonicalProp = '',
		image: imageProp = DEFAULT_IMAGE,
		type: typeProp = '',
		keywords = '',
		schemaType = 'WebPage',
		structuredData = null,
		datePublished = '',
		dateModified = '',
		authorName = 'Abroaducate'
	}: Props = $props();

	// Always emit a canonical on the primary (non-www) domain, without query strings,
	// so www/non-www and ?utm= variants consolidate into one URL in Google.
	let canonical = $derived(
		(canonicalProp || `${SITE}${page.url.pathname}`).replace('://www.abroaducate.com', '://abroaducate.com')
	);
	let image = $derived(imageProp || DEFAULT_IMAGE);
	let type = $derived(typeProp || (schemaType === 'Article' ? 'article' : 'website'));

	// Default keywords for academic/study abroad platform
	const defaultKeywords = 'study abroad, statement of purpose, SOP, university applications, scholarships, IELTS, academic writing, AI writing assistant';
	let finalKeywords = $derived(keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords);

	// Safe title calculation
	let safeTitle = $derived(title || 'Abroaducate');
	let fullTitle = $derived(
		safeTitle.includes('Abroaducate') ? safeTitle : `${safeTitle} | Abroaducate`
	);

	// Generate structured data based on page type
	function generateStructuredData() {
		if (structuredData) return structuredData;

		const baseData = {
			"@context": "https://schema.org",
			"@type": schemaType,
			"name": safeTitle,
			"description": description || '',
			"url": canonical,
			"isPartOf": {
				"@type": "WebSite",
				"name": "Abroaducate",
				"url": "https://abroaducate.com"
			}
		};

		if (schemaType === 'Article') {
			return {
				"@context": "https://schema.org",
				"@type": "BlogPosting",
				"headline": safeTitle.slice(0, 110),
				"description": description || '',
				"image": [image],
				"url": canonical,
				"mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
				...(datePublished ? { "datePublished": datePublished } : {}),
				...(dateModified || datePublished ? { "dateModified": dateModified || datePublished } : {}),
				"author":
					authorName === 'Abroaducate'
						? { "@type": "Organization", "name": authorName, "url": SITE }
						: { "@type": "Person", "name": authorName, "jobTitle": "Founder", "worksFor": { "@type": "Organization", "name": "Abroaducate", "url": SITE } },
				"publisher": {
					"@type": "Organization",
					"name": "Abroaducate",
					"url": SITE,
					"logo": { "@type": "ImageObject", "url": `${SITE}/favicon-512x512.svg` }
				}
			};
		}

		if (schemaType === 'WebSite') {
			return {
				...baseData,
				"potentialAction": {
					"@type": "SearchAction",
					"target": "https://abroaducate.com/universities?search={search_term_string}",
					"query-input": "required name=search_term_string"
				}
			};
		}

		return baseData;
	}

	let pageStructuredData = $derived(generateStructuredData());
</script>

<svelte:head>
	<!-- Page Title -->
	<title>{fullTitle}</title>
	
	<!-- Meta Description -->
	<meta name="description" content={description} />
	<meta name="keywords" content={finalKeywords} />
	
	<!-- Canonical URL -->
	<link rel="canonical" href={canonical} />

	<!-- Open Graph Tags -->
	<meta property="og:site_name" content="Abroaducate" />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content={type} />
	{#if type === 'article' && datePublished}
		<meta property="article:published_time" content={datePublished} />
	{/if}

	<!-- Twitter Card Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	
	<!-- Additional SEO Meta Tags -->
	<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
	
	<!-- Structured Data -->
	{@html `<script type="application/ld+json">${JSON.stringify(pageStructuredData).replace(/</g, '\\u003c')}</script>`}
</svelte:head>

<!-- 
Usage Examples:

Basic usage:
<SEO 
  title="Page Title"
  description="Page description for search engines"
/>

Advanced usage:
<SEO 
  title="Custom Page Title"
  description="Detailed page description"
  canonical="https://abroaducate.com/custom-page"
  image="https://abroaducate.com/custom-image.png"
  keywords="custom, keywords, here"
  schemaType="Article"
  structuredData={{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Custom Article Title",
    "author": {
      "@type": "Organization",
      "name": "Abroaducate"
    }
  }}
/>
--> 