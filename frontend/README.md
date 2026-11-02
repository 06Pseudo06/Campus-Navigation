# CampusWay — Frontend Web Application

High-performance, accessible campus navigation web client built with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS v4**.

---

## 🧭 Overview

The CampusWay frontend provides an architectural-grade user experience for campus navigation:
- **Authentication Portal**: Email/password registration & login (Argon2id, session cookies), Google OAuth 2.0, and phone OTP interfaces.
- **Interactive Campus Explorer (`/explore`)**: Searchable campus building directory, Block 34 navigation, popular routes, step-by-step directions, and saved destinations.
- **Dynamic Session State**: Real-time user session persistence via `AuthContext`, reactive navbar, and authenticated dashboard CTAs.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack enabled)
- **Language**: TypeScript 5+ (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/turbopack`
- **Authentication**: Native HttpOnly cookie-based session verification with FastAPI backend

---

## 🚀 Getting Started

### 1. Install Dependencies
From the repository root or `frontend/` directory:
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env.local` inside `frontend/`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📁 Project Structure

```
frontend/
├── public/
│   ├── images/
│   │   └── campus-bg.jpg       # High-contrast campus photography
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with Geist font & AuthProvider
│   │   ├── globals.css         # Tailwind v4 configuration
│   │   ├── page.tsx            # Landing homepage with dynamic CTAs
│   │   ├── login/page.tsx      # Email/password & Google OAuth login
│   │   ├── signup/page.tsx     # User registration
│   │   ├── explore/page.tsx    # Interactive campus map & dashboard
│   │   └── about/page.tsx      # Project information
│   ├── components/
│   │   ├── auth/               # AuthCard, LoginForm, SignupForm, GoogleButton
│   │   ├── dashboard/          # Sidebar, Topbar, CampusMap, RoutesTab, SavedTab
│   │   ├── home/               # HeroCta (auth-aware dynamic hero CTAs)
│   │   └── layout/             # Navbar, CampusBranding
│   ├── context/
│   │   └── AuthContext.tsx     # Global authentication provider
│   ├── data/
│   │   └── campusData.ts       # Campus building & topological route datasets
│   ├── services/
│   │   ├── authService.ts      # Authentication API client
│   │   └── routeService.ts     # Pathfinding client
│   └── types/
│       ├── auth.ts             # User, Session & Auth response types
│       └── campus.ts           # Location, Route & Landmark types
├── .env.example
├── next.config.ts              # Turbopack & remote image configurations
├── package.json
└── tsconfig.json
```

---

## 🧪 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Next.js development server with Turbopack |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Runs production server |
| `npm run lint` | Runs ESLint checks across codebase |
| `npm run type-check` | Runs TypeScript compiler checks without emitting files |
