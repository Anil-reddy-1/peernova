# PeerNova Hand-off & Technical Architecture

This document serves as a technical hand-off guide for developers working on **PeerNova**. It explains the core technology stack, the architectural patterns, and how specific features are implemented.

---

## 🏗 System Architecture & Monorepo

The project uses a **Turborepo** architecture powered by **npm workspaces**. It strictly separates concerns into independent apps and shared packages.

### Workspace Structure
- **`apps/web`**: The frontend application built with Next.js 15.
- **`apps/api`**: The backend REST API and WebSocket server built with Express.js.
- **`packages/*`**: Shared internal dependencies:
  - `@peer-tutoring/types`: Shared TypeScript interfaces and Zod schemas (ensures frontend/backend type safety).
  - `@peer-tutoring/ui`: Shared UI components or design tokens.
  - `@peer-tutoring/config`: Shared ESLint, TSConfig, and formatting rules.

---

## 🛠 Technology Stack

### Frontend (`apps/web`)
- **Framework**: Next.js 15 (App Router) & React 19.
- **Styling**: Tailwind CSS v3 for utility-first styling.
- **Animations**: `motion` (Framer Motion v12) for complex UI animations and page transitions.
- **State Management**: `zustand` for lightweight global client state.
- **Data Fetching**: `@tanstack/react-query` for fetching, caching, and synchronizing server state.
- **Forms**: `react-hook-form` paired with `zod` for robust, type-safe client-side validation.
- **Real-time Client**: `socket.io-client` for real-time video signaling and live chat.

### Backend (`apps/api`)
- **Server Environment**: Node.js (v20+) & Express.js.
- **Database / BaaS**: Firebase Admin SDK (Firestore, Authentication).
- **Validation**: `zod` for runtime request body validation.
- **Real-time Server**: `socket.io` for managing WebSocket connections.
- **Media / Storage**: `cloudinary` for secure asset handling.
- **Emails**: `resend` for transactional email delivery.

---

## 🚀 Feature Implementations

### 1. Authentication & Role Management
**How it works:**
We use a hybrid authentication model relying on **Firebase Auth** and custom backend logic.
- **Registration**: The user submits their email/password and role (Student/Tutor) on the frontend. The backend creates the Firebase Auth user, assigns a **Firebase Custom Claim** (`role`), and simultaneously creates a corresponding profile document in the **Firestore** database.
- **Sign-in**: The frontend signs in using `firebase/auth` and receives a secure JWT token.
- **Authorization**: The frontend sends the Firebase JWT in the `Authorization: Bearer <token>` header to the backend. The backend verifies the token using the Firebase Admin SDK, ensuring the user is valid and has the correct role permissions.

### 2. Database & Data Modeling (Firestore)
**How it works:**
The application relies on **Firestore** (Google's NoSQL document database) accessed exclusively via the backend's Firebase Admin SDK. 
- The backend acts as the gatekeeper. We do not use client-side Firestore SDKs for mutations to ensure strict business logic and security.
- Data is structured into root collections like `users`, `tutors`, `sessions`, and `messages`.

### 3. File & Document Uploads (Cloudinary)
**How it works:**
To handle avatar uploads and chat document sharing securely without overloading the server, we use **Cloudinary** via a signature-based upload pattern.
- The frontend requests an upload signature from the backend (`GET /api/v1/chat/upload-signature`).
- The backend generates a secure SHA-1 signature using the Cloudinary secret key.
- The frontend uses this signature to upload the file *directly* to Cloudinary's servers.
- Cloudinary returns the secure image/file URL, which is then saved to the Firestore database.

### 4. Real-time Communication (Chat & WebRTC Signaling)
**How it works:**
Live features are powered by **Socket.io**.
- **Chat**: When a session is active, users connect to a specific Socket.io room. Messages are broadcasted instantly to the recipient and concurrently saved to the backend database.
- **Video Calls**: The 1-on-1 video system relies on WebRTC. Socket.io is used purely as the **Signaling Server** (to exchange ICE candidates and SDP offers/answers between the two peers). Once the WebRTC connection is established, the video/audio streams directly peer-to-peer, bypassing the server entirely for zero latency.

### 5. Type Safety & Validation (Zod + Shared Types)
**How it works:**
We leverage the `@peer-tutoring/types` package to share a single source of truth across the stack.
- A `Zod` schema is defined in the shared package (e.g., `RegisterSchema`).
- The **Frontend** imports it to validate the registration form using `react-hook-form`'s `zodResolver`.
- The **Backend** imports the exact same schema in an Express middleware to validate incoming `req.body` payloads.
- If the schema updates, both frontend and backend instantly inherit the changes and throw TypeScript errors if broken.

---

## 🏃‍♂️ Getting Started for Developers

1. **Install Dependencies**: Run `npm install` at the root.
2. **Environment Variables**: Ensure `.env.local` in `apps/web` and `.env` in `apps/api` are populated with your Firebase, Cloudinary, and Resend credentials.
   *(Note: The backend requires `GRPC_DNS_RESOLVER=native` on Windows to prevent Firestore timeout issues).*
3. **Run the Stack**: Run `npm run dev` at the root to start both the frontend (Port 3000) and backend (Port 4000) concurrently using Turborepo.
