# Architecture: Peer Tutoring Marketplace

## Infrastructure Overview
- **Frontend (`apps/web`)**: Next.js 14 App Router, TailwindCSS, deployed to Vercel edge network.
- **Core API (`apps/api`)**: Node.js + Express. Handles auth, payments, bookings, WebRTC signaling via Socket.IO, and background jobs via BullMQ. Deployed to GCP Cloud Run.
- **AI Microservice (`apps/ai-service`)**: FastAPI + scikit-learn. Handles recommendation engine and compatibility scoring. Deployed to GCP Cloud Run.
- **Database**: Firebase Firestore (NoSQL).
- **Caching & Pub/Sub**: Upstash Redis (Serverless).

## Key Workflows
1. **Booking System**: Atomic transactions ensure a single time slot cannot be double-booked.
2. **Payments**: Escrow-based model. Funds are captured by Razorpay, held virtually, and released to Tutor's connected account upon session completion via BullMQ workers.
3. **AI Recommendations**: Scikit-learn model ranks tutors based on 9 engineered features (subject overlap, language, schedule, session experience).
4. **Study Assistant**: SSE streaming connection between Next.js -> Express -> OpenAI to provide 24/7 contextual tutoring.
