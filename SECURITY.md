# Security Policy & GDPR Compliance

## OWASP Top 10 Mitigations
- **A01: Broken Access Control**: Strict Firebase ID token verification. Role-based access control (RBAC) middleware blocks unauthorized routes.
- **A02: Cryptographic Failures**: All data in transit uses TLS 1.3 via Cloud Run and Vercel edge networks. No passwords are stored; handled securely by Firebase Auth.
- **A03: Injection**: Zod schema validation on every API endpoint. Firestore uses prepared queries.
- **A04: Insecure Design**: Secure defaults. Rate limiting at IP and token levels.
- **A05: Security Misconfiguration**: Helmet enabled for strict HTTP headers. `X-Powered-By` removed. Sentry strips Auth tokens from error reports.
- **A07: Identification and Auth Failures**: Handled exclusively by Google Identity platform.

## GDPR Compliance
This application implements GDPR required endpoints:
1. `GET /api/v1/users/export-my-data`: Complete JSON dump of user interactions, sessions, and profile.
2. `DELETE /api/v1/users/delete-my-data`: Anonymizes PII, soft-deletes session records, and triggers hard deletion from Firebase Identity Provider.

## Abuse Prevention
- Max 100 requests / min / IP for standard routes.
- Max 10 requests / 15 min / IP for authentication and critical mutations.
