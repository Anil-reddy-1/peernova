# PeerNova

PeerNova is a modern web platform connecting students with expert peer tutors for personalized, affordable learning sessions. It enables users to book and participate in 1-on-1 video tutoring sessions across various subjects.

## Architecture

This repository is split into two fully standalone applications:

- **`frontend/`**: The Next.js App Router application providing the user interface.
- **`backend/`**: The Node.js/Express API server providing business logic, real-time signaling, and database interactions.

There is no monorepo setup (e.g., Turborepo or workspace hoisting). Both applications manage their own dependencies, configuration, and build processes independently.

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
- **State/Auth:** Zustand, Custom hooks (`useAuth`, `useWebRTC`, `useChat`)

### Backend (API)
- **Framework:** Express / Node.js
- **Real-time Signaling:** Socket.IO (handles `video:join`, `video:offer`, `video:answer`, `video:ice-candidate`)
- **Database/Auth:** Firebase Admin SDK

## Getting Started

To run the application locally, you will need to start both the backend and frontend servers in separate terminal windows.

### 1. Start the Backend

Open a terminal and navigate to the `backend/` directory:

```bash
cd backend
npm install
```

Make sure you have an `.env.local` file configured in the `backend/` directory with your Firebase Admin credentials and other required variables (you can copy `.env.example` as a template).

Start the backend development server:

```bash
npm run dev
```

The API will be available at `http://localhost:4000`.

### 2. Start the Frontend

Open a second terminal and navigate to the `frontend/` directory:

```bash
cd frontend
npm install
```

Make sure you have an `.env.local` file configured in the `frontend/` directory with your Firebase public credentials and Next.js configuration (you can copy `.env.example` as a template).

Start the frontend development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Video Architecture Notes

If you are modifying the video call features, please note:
- The custom WebRTC hook is located at `frontend/src/hooks/useWebRTC.ts`.
- The backend Socket signaling logic is in `backend/src/api/v1/chat/socket.ts`.
- STUN/TURN server credentials for WebRTC are fetched dynamically via the `/api/v1/chat/turn-credentials` endpoint.
- Jitsi embedding is used in `frontend/src/app/call/[id]/page.tsx` (or similar public route). Note that the free `meet.jit.si` servers have a 5-minute limit for iframe embeds; for production, migrate to an 8x8 JaaS account or self-host Jitsi.
