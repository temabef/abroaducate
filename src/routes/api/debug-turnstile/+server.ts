import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
import { TURNSTILE_SECRET_KEY } from '$env/static/private';

export const GET: RequestHandler = async () => {
	return json({
		hasPublicKey: !!PUBLIC_TURNSTILE_SITE_KEY,
		hasSecretKey: !!TURNSTILE_SECRET_KEY,
		publicKeyLength: PUBLIC_TURNSTILE_SITE_KEY?.length || 0,
		secretKeyLength: TURNSTILE_SECRET_KEY?.length || 0,
		publicKeyPrefix: PUBLIC_TURNSTILE_SITE_KEY?.substring(0, 10) || 'NOT_SET',
		environment: process.env.NODE_ENV || 'unknown',
		timestamp: new Date().toISOString()
	});
};
