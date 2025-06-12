# Production Stripe Setup Guide

## Overview
This guide will help you set up production Stripe integration when you're ready to deploy your platform.

## 1. Create Production Stripe Prices

### Step 1: Log into Stripe Dashboard (Production Mode)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Switch to LIVE mode** (toggle in top-left)
3. Navigate to Products → Add Product

### Step 2: Create Academic Professional Plan
**Product Name:** Academic Professional  
**Price:** $9.99 USD  
**Billing:** Monthly recurring  
**Copy the Price ID** (starts with `price_`) 

### Step 3: Create Academic Elite Plan  
**Product Name:** Academic Elite  
**Price:** $24.99 USD  
**Billing:** Monthly recurring  
**Copy the Price ID** (starts with `price_`)

## 2. Update Environment Variables

### Create Production .env file:
```bash
# Stripe Live Keys (NEVER commit these!)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Other production variables
PUBLIC_SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

## 3. Update Stripe Configuration

### Replace Price IDs in src/lib/stripe.ts:
```typescript
export const SUBSCRIPTION_PLANS = {
    professional: {
        name: 'Academic Professional',
        price: 9.99,
        priceId: 'price_YOUR_PRODUCTION_PROFESSIONAL_PRICE_ID', // Replace this
        // ... rest of config
    },
    elite: {
        name: 'Academic Elite', 
        price: 24.99,
        priceId: 'price_YOUR_PRODUCTION_ELITE_PRICE_ID', // Replace this
        // ... rest of config
    }
};
```

## 4. Set Up Production Webhooks

### Step 1: Create Webhook Endpoint
1. In Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. **Endpoint URL:** `https://yourdomain.com/api/stripe/webhook`
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Step 2: Get Webhook Secret
1. Click on your created webhook
2. Copy the "Signing secret" (starts with `whsec_`)
3. Add to your environment variables

## 5. Test Production Setup

### Before Going Live:
```sql
-- Test admin override system
SELECT set_admin_subscription_override(
    'test-user-id'::UUID,
    'elite', 
    'Testing production setup'
);

-- Verify plan constraints
SELECT DISTINCT plan_type FROM user_subscriptions;

-- Check webhook handler is working
-- (Test with Stripe CLI or test transactions)
```

### Stripe CLI Testing:
```bash
# Install Stripe CLI
# Forward events to local webhook (for testing)
stripe listen --forward-to localhost:5173/api/stripe/webhook
```

## 6. Database Production Setup

### Ensure Plan Constraints Match:
```sql
-- Verify constraint allows production plan types
SELECT 
    conname as constraint_name, 
    pg_get_constraintdef(oid) as constraint_definition 
FROM pg_constraint 
WHERE conrelid = (SELECT oid FROM pg_class WHERE relname = 'user_subscriptions') 
AND contype = 'c';

-- Should show: CHECK (plan_type IN ('free', 'professional', 'elite'))
```

## 7. Pre-Launch Checklist

- [ ] Production Stripe prices created
- [ ] Environment variables updated with live keys
- [ ] Webhook endpoint configured and tested
- [ ] Database constraints verified
- [ ] Admin override system tested
- [ ] Plan limits updated in database
- [ ] AI model selection working correctly
- [ ] All subscription flows tested

## 8. Go-Live Process

1. **Deploy to production** with updated environment
2. **Update webhook URL** in Stripe dashboard to production domain
3. **Test a real subscription** with a small amount
4. **Monitor Stripe webhook logs** for any issues
5. **Verify admin override** still works for testing

## 9. Post-Launch Monitoring

### Key Metrics to Watch:
- Subscription conversion rates
- Webhook delivery success rates  
- Usage limit enforcement accuracy
- AI model cost per user
- Customer support issues

### Regular Maintenance:
- Monitor Stripe webhook logs
- Check database plan constraints
- Update price IDs if needed
- Review admin override usage

---

## Emergency Procedures

### If Webhooks Fail:
1. Check Stripe webhook logs
2. Verify endpoint URL is correct
3. Check webhook secret matches environment
4. Use admin override to fix user accounts temporarily

### If Plan Limits Break:
1. Use admin override to grant access
2. Check database constraints and functions
3. Review plan_limits table data
4. Test usage limit functions

**Ready for production when you are! 🚀** 