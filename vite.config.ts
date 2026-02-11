import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(), 
		SvelteKitPWA({
			registerType: 'autoUpdate',
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/api\.abroaducate\.com\//,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'api-cache',
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					}
				]
			},
			manifest: {
				name: 'Abroaducate',
				short_name: 'Abroaducate',
				description: 'AI-powered academic application platform helping students worldwide achieve their study abroad dreams',
				start_url: '/',
				display: 'standalone',
				background_color: '#1E40AF',
				theme_color: '#3B82F6',
				orientation: 'portrait-primary',
				categories: ['education', 'productivity'],
				icons: [
					{
						src: '/favicon-192x192.svg',
						sizes: '192x192',
						type: 'image/svg+xml',
						purpose: 'any maskable'
					},
					{
						src: '/favicon-512x512.svg', 
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'any maskable'
					},
					{
						src: '/apple-touch-icon.svg',
						sizes: '180x180', 
						type: 'image/svg+xml'
					}
				]
			},
			devOptions: {
				enabled: true
			}
		})
	],
	optimizeDeps: {
		exclude: ['@supabase/ssr'],
		include: ['@supabase/postgrest-js', 'cookie', 'svelte-fa']
	},
});
