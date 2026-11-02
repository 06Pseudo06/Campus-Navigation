# CampusWay — Campus Navigation & Wayfinding Web Application

A modern campus wayfinding and navigation system designed for university students, staff, freshmen, and first-time visitors to easily locate campus buildings, gates, lecture halls, and landmarks.

---

## 🏗️ Architecture Overview

The complete project architecture consists of:
1. **Frontend**: Next.js (App Router) with TypeScript & Tailwind CSS
2. **Backend**: FastAPI (Python) with Python Graph Routing Algorithms *(Planned for Phase 2)*
3. **Database**: PostgreSQL with Docker local environment *(Planned for Phase 2)*
4. **Services**:
   - **Campus Map Service**: 2D/3D building layouts, points of interest, gate locations.
   - **Route Planning Service**: Algorithmic graph-based shortest path routing with accessibility support.
   - **Visitor Assistance Service**: Guest check-in, parking guidance, emergency facilities.

---

## 🚀 Phase 1: Login & Signup Frontend

Phase 1 delivers the architectural-magazine visual frontend for user authentication:
- **Visual Design**: High-fidelity university campus photography, warm evening lighting, dark contrast overlays, refined typography, and centered authentication cards.
- **Header**: Responsive navigation with CampusWay pinnacle/compass logo and navigation links.
- **Right-Side Branding**: Distinctive architectural slogan:
  ```
  FIND.
  EXPLORE.
  BELONG.
  ```
- **Login Experience (`/login`)**:
  - Email & password controlled inputs with real-time validation.
  - Password visibility toggle (show/hide).
  - "Remember me" checkbox and "Forgot password?" recovery modal.
  - "Continue with Google" OAuth button.
  - Warm red/orange primary CTA button (`#DE4B31`).
  - Mobile OTP alternative interface with country code selector (default `+91` India) and 30-second resend countdown.
  - Clear system feedback without fabricating fake tokens, mock sessions, or false backend success.
- **Signup Experience (`/signup`)**:
  - Full Name, Email, Password, and Confirm Password matching validation.
  - Password visibility toggles.
  - Accessible error messages.
  - Google and Mobile OTP alternatives.
  - Navigation between Login and Signup.
- **Service Layer (`src/services/authService.ts`)**:
  - Modular API client reading `NEXT_PUBLIC_API_BASE_URL`.
  - Gracefully handles offline backend state with informative messages.

---

## 📁 Repository Structure

```
campus-wayfinder/
├── frontend/
│   ├── public/
│   │   ├── images/
│   │   │   └── campus-bg.jpg      # Architectural campus photography
│   │   └── favicon.ico
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Root layout with Geist font
│   │   │   ├── globals.css        # Tailwind CSS configuration
│   │   │   ├── page.tsx           # Home landing page with CTAs
│   │   │   ├── login/
│   │   │   │   └── page.tsx       # /login route
│   │   │   ├── signup/
│   │   │   │   └── page.tsx       # /signup route
│   │   │   ├── explore/
│   │   │   │   └── page.tsx       # /explore placeholder for map service
│   │   │   └── about/
│   │   │       └── page.tsx       # /about project details
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── AuthCard.tsx
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SignupForm.tsx
│   │   │   │   ├── GoogleButton.tsx
│   │   │   │   └── PhoneOtpForm.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── CampusBranding.tsx
│   │   │   └── icons/
│   │   │       └── Icons.tsx
│   │   ├── services/
│   │   │   └── authService.ts     # FastAPI backend connection client
│   │   └── types/
│   │       └── auth.ts            # TypeScript interfaces
│   ├── .env.example
│   ├── .env.local
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
├── package.json                   # Root workspace scripts
└── README.md
```

---

## 💻 Running Locally

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` inside `frontend/`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server
From the workspace root or inside `frontend/`:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- Login page: [http://localhost:3000/login](http://localhost:3000/login)
- Signup page: [http://localhost:3000/signup](http://localhost:3000/signup)
- Explore preview: [http://localhost:3000/explore](http://localhost:3000/explore)
- About page: [http://localhost:3000/about](http://localhost:3000/about)

### 4. Build for Production
```bash
npm run build
```

---

## 🔐 Phase 2: Authentication (Google OAuth 2.0 & Email/Password with Argon2id)

CampusWay features a complete dual-authentication system handled by the FastAPI backend:
1. **Google OAuth 2.0**: Authorization Code flow with CSRF-protected state parameters, ID token signature verification, and automatic account linking.
2. **Email & Password Authentication**: Argon2id password hashing (OWASP standard parameters), duplicate email enforcement, `remember_me` session duration expansion, and HTTP-only signed session cookies.

### 🌐 Google Cloud Console Setup Steps

To enable real Google sign-in with your Google accounts:

1. **Open Google Cloud Console**:
   Navigate to [https://console.cloud.google.com/](https://console.cloud.google.com/).

2. **Create or Select a Project**:
   Click the project dropdown in the top bar and select **New Project** (e.g. `CampusWay`).

3. **Configure OAuth Consent Screen**:
   - Go to **APIs & Services** > **OAuth consent screen**.
   - User Type: Select **External**, then click **Create**.
   - App Information: Enter **App name** (`CampusWay`), **User support email**, and **Developer contact email**.
   - Scopes: Click **Add or Remove Scopes** and select `.../auth/userinfo.email`, `.../auth/userinfo.profile`, and `openid`.
   - Test Users: While your app is in "Testing" mode, add your personal Google email address under **Test users** so you can log in.
   - Save and continue.

4. **Create OAuth 2.0 Credentials**:
   - Go to **APIs & Services** > **Credentials**.
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: Select **Web application**.
   - Name: `CampusWay Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
   - **Authorized redirect URIs**:
     - `http://localhost:8000/api/v1/auth/google/callback`
   - Click **Create**.
   - Copy your **Client ID** and **Client Secret**.

5. **Configure Backend Environment Variables**:
   Open `backend/.env` (created from `backend/.env.example`) and fill in:
   ```env
   GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
   FRONTEND_URL=http://localhost:3000
   SESSION_SECRET=a-secure-random-string-at-least-32-characters
   ENVIRONMENT=development
   ```

---

## 💻 Running the Application

### One Command to Run Everything
From the workspace root, simply run:
```bash
npm run dev
```
This automatically boots **both** the FastAPI Python backend (port 8000) and the Next.js frontend (port 3000) concurrently using `concurrently`.

- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **Sign In Page**: [http://localhost:3000/login](http://localhost:3000/login)
- **Campus Dashboard**: [http://localhost:3000/explore](http://localhost:3000/explore)
- **FastAPI Interactive Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### Running Services Separately (Optional)
If you prefer running services in separate terminals:
```bash
# Terminal 1 - FastAPI Backend
npm run dev:backend

# Terminal 2 - Next.js Frontend
npm run dev:frontend
```

### 3. Run Backend Automated Tests (21 Tests)
```bash
npm run test:backend
# or:
backend\venv\Scripts\pytest backend/tests -v
```

> [!NOTE]
> Until valid Google Cloud credentials are added to `backend/.env`, clicking "Continue with Google" redirects back with an informative configuration warning message. Once credentials are provided, clicking "Continue with Google" directly opens Google's account selection window and authenticates you into CampusWay!
