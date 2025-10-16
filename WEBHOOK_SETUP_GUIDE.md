# 🔧 STRIPE WEBHOOK SETUP GUIDE

## 🚨 CRITICAL: This will fix your payment issues!

### **Step 1: Go to Stripe Dashboard**
1. Open https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"** (or find existing endpoint)
3. Set endpoint URL: `https://abroaducate.com/api/stripe/webhook`

### **Step 2: Select Events to Listen For**
Select these events:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `invoice.payment_action_required`

### **Step 3: Get Webhook Secret**
1. After creating the webhook, click on it
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_...`)

### **Step 4: Add to Environment Variables**

#### **For Local Development (.env file):**
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

#### **For Production (Vercel):**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_your_actual_secret_here`
   - **Environment**: Production (and Preview)

### **Step 5: Redeploy**
```bash
# If using Vercel CLI:
vercel --prod

# Or trigger redeploy from Vercel dashboard
```

### **Step 6: Test the Webhook**
1. Go to your webhook in Stripe dashboard
2. Click **"Send test webhook"**
3. Check your server logs for webhook events

## 🧪 **Testing Payment Flow**

### **Test Cards to Use:**
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`

### **What to Look For:**
1. ✅ Webhook events appear in server logs
2. ✅ Subscription status updates in database
3. ✅ Payment success/failure notifications
4. ✅ Admin dashboard shows payment data

## 🚨 **Common Issues & Solutions**

### **Issue: "Webhook signature verification failed"**
- **Solution**: Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
- **Check**: No extra spaces or quotes in the secret

### **Issue: "Webhook not receiving events"**
- **Solution**: Check webhook URL is correct
- **Check**: Webhook is enabled (not disabled)

### **Issue: "Environment variable not found"**
- **Solution**: Restart your development server after adding to .env
- **Check**: Variable name is exactly `STRIPE_WEBHOOK_SECRET`

## 📊 **Monitoring Success**

After setup, you should see:
1. **Webhook events** in your server logs
2. **Payment data** in admin dashboard
3. **Successful subscriptions** in database
4. **Failed payment retries** working automatically

## 🎯 **Expected Results**

Once configured:
- ✅ Failed payments will be retried automatically
- ✅ Users will get notified of payment issues
- ✅ Admin dashboard will show payment statistics
- ✅ Subscription status will update correctly
- ✅ Revenue will start flowing! 💰

---

**Need Help?** Check the server logs for webhook events and payment processing status.
