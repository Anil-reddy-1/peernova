# Runbook: Production Operations

## 1. Deploying
Deployment is handled automatically by GitHub Actions on push to `main`.
- Web: Auto-deploys via Vercel GitHub App.
- API: `./.github/workflows/deploy-api.yml` deploys to Cloud Run.
- AI: `./.github/workflows/deploy-ai.yml` deploys to Cloud Run.

## 2. Model Retraining
The AI recommendation model should be retrained periodically to incorporate new user interactions.
Command:
```bash
curl -X POST https://ai-service-url/api/v1/retrain-model -H "X-Internal-Secret: YOUR_SECRET"
```

## 3. Cost Optimization (Firebase)
To prevent unexpected bills from runaway Firestore reads:
1. All client-side queries limit results to 20 per page.
2. The AI service relies on Redis caching to avoid heavy table scans.
3. Chat messages are paginated via virtualized lists in React.

## 4. Monitoring & Alerting
- Sentry captures all unhandled exceptions.
- Critical errors (e.g., Payment Webhook failures) alert the `#engineering` Slack channel via Sentry integrations.
- Pino structured logs are exported to GCP Cloud Logging.
