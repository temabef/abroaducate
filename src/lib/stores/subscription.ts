import { writable } from 'svelte/store';

export type SubscriptionState = {
  loaded: boolean;
  isPremium: boolean;
  planType: string | null;
  status: string | null;
  userId: string | null;
};

export const subscriptionState = writable<SubscriptionState>({
  loaded: true,
  isPremium: false,
  planType: null,
  status: null,
  userId: null
});


