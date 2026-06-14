# PeerNova

PeerNova is a modern web platform connecting students with expert peer tutors for personalized, affordable learning sessions. It enables users to book and participate in 1-on-1 video tutoring sessions across various subjects.

## Features

- **Tutor Discovery & Booking:** Find tutors and schedule sessions seamlessly.
- **Authentication:** Secure login and user management via Firebase.
- **Real-time Chat:** Communicate with tutors and students through an integrated chat system.
- **Video Tutoring:**
  - **Dashboard Sessions:** A fully custom-built native WebRTC implementation using Socket.IO as a signaling server. This allows for low-latency peer-to-peer video, audio, and screen sharing directly within the app.
  - **Public Sessions:** Seamlessly embedded video calls powered by Jitsi Meet (`meet.jit.si`) for external or public-facing session links.

## Tech Stack

### Frontend (Web App)
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **WebRTC:** Native browser APIs (`RTCPeerConnection`, `getUserMedia`, etc.)
- **State/Auth:** Custom hooks (`useAuth`, `useWebRTC`, `useChat`)

### Backend (API)
- **Framework:** Express / Node.js
- **Real-time Signaling:** Socket.IO (handles `video:join`, `video:offer`, `video:answer`, `video:ice-candidate`)
- **Database/Auth:** Firebase

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Video Architecture Notes

If you are modifying the video call features, please note:
- The custom WebRTC hook is located at `apps/web/src/hooks/useWebRTC.ts`.
- The backend Socket signaling logic is in `apps/api/src/api/v1/chat/socket.ts`.
- STUN/TURN server credentials for WebRTC are fetched dynamically via the `/chat/turn-credentials` endpoint.
- Jitsi embedding is used in `apps/web/src/app/call/[id]/page.tsx`. Note that the free `meet.jit.si` servers have a 5-minute limit for iframe embeds; for production, migrate to an 8x8 JaaS account or self-host Jitsi.
