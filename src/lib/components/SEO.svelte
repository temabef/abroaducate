<script lang="ts">
	export let title: string;
	export let description: string;
	export let canonical: string = '';
	export let image: string = 'https://abroaducate.com/og-image.png';
	export let type: string = 'website';
	export let keywords: string = '';
	export let schemaType: 'WebSite' | 'WebPage' | 'Article' | 'Product' = 'WebPage';
	export let structuredData: any = null;

	// Default keywords for academic/study abroad platform
	const defaultKeywords = 'study abroad, statement of purpose, SOP, university applications, scholarships, IELTS, academic writing, AI writing assistant';
	const finalKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;

	// Generate structured data based on page type
	function generateStructuredData() {
		if (structuredData) return structuredData;

		const baseData = {
			"@context": "https://schema.org",
			"@type": schemaType,
			"name": title,
			"description": description,
			"url": canonical || `https://abroaducate.com${typeof window !== 'undefined' ? window.location.pathname : ''}`,
			"isPartOf": {
				"@type": "WebSite",
				"name": "Abroaducate",
				"url": "https://abroaducate.com"
			}
		};

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

	const pageStructuredData = generateStructuredData();
	const fullTitle = title.includes('Abroaducate') ? title : `${title} | Abroaducate`;
</script>

<svelte:head>
	<!-- Page Title -->
	<title>{fullTitle}</title>
	
	<!-- Meta Description -->
	<meta name="description" content={description} />
	<meta name="keywords" content={finalKeywords} />
	
	<!-- Canonical URL -->
	{#if canonical}
		<link rel="canonical" href={canonical} />
	{/if}
	
	<!-- Open Graph Tags -->
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:url" content={canonical || `https://abroaducate.com${typeof window !== 'undefined' ? window.location.pathname : ''}`} />
	<meta property="og:type" content={type} />
	
	<!-- Twitter Card Tags -->
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	
	<!-- Additional SEO Meta Tags -->
	<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
	
	<!-- Structured Data -->
	{@html `<script type="application/ld+json">${JSON.stringify(pageStructuredData)}</script>`}
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