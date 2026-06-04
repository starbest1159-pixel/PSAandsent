# Billing Plans

Concepts
- Plans define recurring price and interval (monthly, yearly)
- Support for metered or tiered pricing if gateway supports it

Recommended fields
- plan_id (internal)
- gateway_plan_id (gateway mapping)
- price_amount
- currency
- interval (month/year)
- trial_period_days

Operations
- Create a plan in the gateway when adding a product tier
- Map gateway plan IDs to internal plan records
- Ensure idempotent plan creation to avoid duplicates
