# Payment Integration

Supported gateways
- Stripe (primary)
- PayPal (billing agreements / subscriptions)
- Adapters: add custom adapters for other gateways

Payment intent
- Use Stripe PaymentIntent or PayPal Orders API depending on provider.
- Keep access tokens/secret keys in env and do not expose on frontend.

Webhooks
- Store webhook signing secrets in env
- Validate signatures on incoming webhook events
- Implement idempotency handling to avoid double-processing
- Retry failed webhook deliveries with exponential backoff

Recommended keys and env values
- STRIPE_SECRET
- STRIPE_PUBLISHABLE_KEY
- PAYPAL_CLIENT_ID
- PAYPAL_SECRET
- WEBHOOK_SECRET

Gateway-specific notes
- Stripe: use test keys in development and set up webhook endpoint with stripe CLI
- PayPal: configure sandbox credentials and webhooks in developer dashboard
