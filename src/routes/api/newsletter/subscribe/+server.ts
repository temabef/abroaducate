import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { CUSTOMER_IO_SITE_ID, CUSTOMER_IO_TRACK_API_KEY, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

// Use service-role key so unauthenticated visitors can subscribe
const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const CUSTOMER_IO_TRACK_BASE_URL = 'https://track-eu.customer.io/api/v1';

function getCustomerIoAuthHeader() {
  if (!CUSTOMER_IO_SITE_ID || !CUSTOMER_IO_TRACK_API_KEY) {
    return null;
  }

  return `Basic ${Buffer.from(`${CUSTOMER_IO_SITE_ID}:${CUSTOMER_IO_TRACK_API_KEY}`).toString('base64')}`;
}

async function customerIoIdentify(params: {
  personId: string;
  email: string;
  attributes: Record<string, unknown>;
}) {
  const authHeader = getCustomerIoAuthHeader();
  if (!authHeader) {
    console.warn('[newsletter/subscribe] Customer.io credentials are not set; skipping Customer.io sync');
    return;
  }

  const response = await fetch(`${CUSTOMER_IO_TRACK_BASE_URL}/customers/${encodeURIComponent(params.personId)}`, {
    method: 'PUT',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: params.email,
      ...params.attributes
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Customer.io identify failed: ${response.status} ${errorText}`);
  }
}

async function customerIoTrackEvent(params: {
  personId: string;
  name: string;
  data: Record<string, unknown>;
}) {
  const authHeader = getCustomerIoAuthHeader();
  if (!authHeader) {
    console.warn('[newsletter/subscribe] Customer.io credentials are not set; skipping Customer.io event sync');
    return;
  }

  const response = await fetch(`${CUSTOMER_IO_TRACK_BASE_URL}/customers/${encodeURIComponent(params.personId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: params.name,
      data: params.data
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Customer.io event track failed: ${response.status} ${errorText}`);
  }
}

async function identifyNewsletterSubscriberInCustomerIo(params: {
  subscriberId: string;
  email: string;
  source: string;
  createdAt?: string;
}) {
  const createdAtUnix = params.createdAt
    ? Math.floor(new Date(params.createdAt).getTime() / 1000)
    : Math.floor(Date.now() / 1000);

  await customerIoIdentify({
    personId: `newsletter_${params.subscriberId}`,
    email: params.email,
    attributes: {
      source: params.source,
      user_type: 'newsletter_subscriber',
      newsletter_subscribed: true,
      scholarship_digest: true,
      weekly_updates: true,
      marketing_emails: true,
      created_at: createdAtUnix
    }
  });
}

async function trackNewsletterSubscribedEvent(params: {
  subscriberId: string;
  email: string;
  source: string;
  action: 'subscribed' | 'reactivated' | 'already_active';
}) {
  await customerIoTrackEvent({
    personId: `newsletter_${params.subscriberId}`,
    name: 'newsletter_subscribed',
    data: {
      email: params.email,
      source: params.source,
      user_type: 'newsletter_subscriber',
      action: params.action,
      scholarship_digest: true,
      weekly_updates: true,
      marketing_emails: true
    }
  });
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    const source = (body.source || 'blog_cta').trim();

    // --- Validate email ---
    if (!email) {
      return json({ error: 'Email address is required.' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // --- Check if already subscribed and active ---
    const { data: existing } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, status, subscribed_at')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'active') {
        console.log(`[newsletter/subscribe] existing active subscriber found: ${existing.id} (${email})`);
        try {
          await identifyNewsletterSubscriberInCustomerIo({
            subscriberId: existing.id,
            email,
            source,
            createdAt: existing.subscribed_at
          });
          console.log(`[newsletter/subscribe] Customer.io identify success for existing active subscriber: ${existing.id}`);
          await trackNewsletterSubscribedEvent({
            subscriberId: existing.id,
            email,
            source,
            action: 'already_active'
          });
          console.log(`[newsletter/subscribe] Customer.io event success for existing active subscriber: ${existing.id}`);
        } catch (customerIoError) {
          console.error('[newsletter/subscribe] Customer.io sync error for existing active subscriber:', customerIoError);
        }

        // Already subscribed — return success silently (don't reveal data)
        return json({ success: true, message: "You're already on the list! We'll keep you posted." });
      }
      // Reactivate if previously unsubscribed
      const reactivatedAt = new Date().toISOString();
      console.log(`[newsletter/subscribe] reactivating subscriber: ${existing.id} (${email})`);
      const { error: reactivateError } = await supabaseAdmin
        .from('newsletter_subscribers')
        .update({
          status: 'active',
          source,
          scholarship_digest: true,
          weekly_updates: true,
          marketing_emails: true,
          updated_at: reactivatedAt
        })
        .eq('id', existing.id);

      if (reactivateError) {
        console.error('[newsletter/subscribe] reactivate error:', reactivateError);
        return json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
      }

      try {
        await identifyNewsletterSubscriberInCustomerIo({
          subscriberId: existing.id,
          email,
          source,
          createdAt: existing.subscribed_at || reactivatedAt
        });
        console.log(`[newsletter/subscribe] Customer.io identify success for reactivated subscriber: ${existing.id}`);
        await trackNewsletterSubscribedEvent({
          subscriberId: existing.id,
          email,
          source,
          action: 'reactivated'
        });
        console.log(`[newsletter/subscribe] Customer.io event success for reactivated subscriber: ${existing.id}`);
      } catch (customerIoError) {
        console.error('[newsletter/subscribe] Customer.io sync error for reactivated subscriber:', customerIoError);
      }

      return json({ success: true, message: "Welcome back! You've been re-added to our Scholarship Radar list." });
    }

    // --- New subscriber: insert into newsletter_subscribers ---
    const subscribedAt = new Date().toISOString();
    const { data: insertedSubscriber, error: insertError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .insert({
        email,
        source,
        status: 'active',
        scholarship_digest: true,
        weekly_updates: true,
        marketing_emails: true,
        subscribed_at: subscribedAt,
        updated_at: subscribedAt
      })
      .select('id, subscribed_at')
      .single();

    if (insertError) {
      // Handle unique constraint violation gracefully
      if (insertError.code === '23505') {
        return json({ success: true, message: "You're already on the list! We'll keep you posted." });
      }
      console.error('[newsletter/subscribe] insert error:', insertError);
      return json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }

    console.log(`[newsletter/subscribe] inserted new subscriber: ${insertedSubscriber.id} (${email})`);

    try {
      await identifyNewsletterSubscriberInCustomerIo({
        subscriberId: insertedSubscriber.id,
        email,
        source,
        createdAt: insertedSubscriber.subscribed_at
      });
      console.log(`[newsletter/subscribe] Customer.io identify success for new subscriber: ${insertedSubscriber.id}`);
      await trackNewsletterSubscribedEvent({
        subscriberId: insertedSubscriber.id,
        email,
        source,
        action: 'subscribed'
      });
      console.log(`[newsletter/subscribe] Customer.io event success for new subscriber: ${insertedSubscriber.id}`);
    } catch (customerIoError) {
      console.error('[newsletter/subscribe] Customer.io sync error for new subscriber:', customerIoError);
    }

    return json({
      success: true,
      message: "You're in! Expect your first Scholarship Radar update within the week."
    });

  } catch (err) {
    console.error('[newsletter/subscribe] unexpected error:', err);
    return json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
};
