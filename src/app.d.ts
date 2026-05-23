// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import { SupabaseClient, Session, User } from '@supabase/supabase-js'

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface Locals {
			supabase: SupabaseClient<Database>
			supabaseServiceRole: SupabaseClient<Database>
			session: Session | null
			user: User | null
			safeGetSession(): Promise<{ session: Session | null; user: User | null }>
			getSession(): Promise<Session | null>
		}
		interface PageData {
			session: Session | null
			user: User | null
		}
	}
}

export {};

// Type stubs for libraries without bundled types
declare module 'markdown-it';
declare module 'sanitize-html';
