<script lang="ts">
	// Blog section layout - loads AdSense script only for blog pages
</script>

<svelte:head>
	<!-- AdSense script loads ONLY for /blog/* routes -->
	<script
		async
		src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9343038264406927"
		crossorigin="anonymous"
	></script>
</svelte:head>

<slot />
