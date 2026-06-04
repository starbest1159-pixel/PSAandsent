# Security

Sensitive data handling
- Do not store raw payment instrument data in repository or DB
- Use gateway tokenization and keep secrets in environment variables

Encryption
- Use HTTPS for all endpoints
- Encrypt sensitive fields at rest if required

Authentication & Authorization
- Use JWTs or session cookies; rotate secrets periodically
- Role-based access control for admin endpoints

Operational security
- Rotate API keys and webhook secrets; limit scope
- Audit logs for payment events and admin actions
