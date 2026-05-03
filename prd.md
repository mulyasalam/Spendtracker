# Product Requirements Document: SpendTracker (Personal)

## 1. Executive Summary
**Problem Statement:** Manual expense tracking often fails because apps take too many clicks to log a simple transaction, and dashboards are too cluttered to provide immediate, actionable financial context.
**Proposed Solution:** A lightning-fast, mobile-first Next.js Progressive Web App (PWA) focused on sub-3-second transaction entry and a clear "Safe-to-Spend" daily indicator. 
**Success Criteria:**
- **Speed:** Logging a standard expense requires ≤ 3 taps/seconds from app launch.
- **Cost:** Operating costs must be exactly $0/month using free-tier services.
- **Performance:** Achieve >= 95 Lighthouse score for Mobile Performance and Accessibility.
- **Usage:** Capable of being installed as an iOS Home Screen app (PWA) holding basic offline caching.

## 2. User Experience & Functionality
**User Personas:** 
- **The Frictionless Saver (You):** Wants to track spending on the go, primarily on an iPhone, without dealing with slow load times, complex bank syncing, or cluttered charts.

**Core Beneficial Features:**
1. **Quick-Pad Entry:** The app opens directly to a numeric keypad (like a calculator) rather than a dashboard. You type the amount, select a quick-category icon, and it's saved.
2. **"Safe-to-Spend" Metric:** Instead of just showing total spent, the app calculates your monthly leftover budget divided by the days remaining in the month, giving you one simple number: *How much can I spend today without breaking my budget?*

**User Stories & Acceptance Criteria:**
- **Story:** As a user, I want the app to open directly to an input screen so that I can log an expense immediately.
  - **AC:** The root path (`/`) immediately focuses a numeric input field.
  - **AC:** Submitting an expense requires only an amount and optionally a category (defaults to "Uncategorized").
- **Story:** As a user, I want to see my "Safe-to-Spend" balance so I know if I can afford a luxury purchase today.
  - **AC:** Dashboard prominently displays `(Monthly Budget - Spent) / Days Left`.
  - **AC:** Value turns green, yellow, or red based on the remaining daily allowance.
- **Story:** As a user, I want to install this on my iPhone home screen.
  - **AC:** The Next.js app includes a fully configured `manifest.json` and service worker for PWA installation.

**Non-Goals:**
- Bank account/plaid integration (strictly manual entry to stay free and fast).
- Receipt scanning or OCR.
- Multi-user or family sharing.

## 3. AI / Advanced Logic Requirements
**Tool Requirements:** 
- **Smart Category Prediction:** (Future/Optional) Analyzing past transactions to auto-select the category based on the time of day (e.g., auto-selecting "Coffee" at 8:00 AM).
**Evaluation Strategy:** 
- The Quick-Pad entry must remain independent of any complex calculations to ensure a render time of under 200ms.

## 4. Technical Specifications
**Architecture Overview:**
- **Frontend & Backend (Fullstack):** Next.js 15 (App Router) with React Server Components for fast data fetching and mutations.
- **UI Framework:** Tailwind CSS with `shadcn/ui` components for beautiful, accessible, and fast UI blocks.
- **Mobile Opt:** Configured as a Next PWA (Progressive Web App) to hide Safari browser UI on iPhone and run full-screen.

**Integration Points:**
- **Database:** Neon Database (Serverless Postgres) - *Free tier is generous and perfect for personal use.*
- **ORM:** Drizzle ORM - *For type-safe, ultra-fast database queries.*
- **Authentication:** NextAuth.js (Auth.js) with Google/GitHub Provider (or Clerk free tier) to ensure data is private.
- **Hosting:** Vercel - *Free tier offers edge-caching and seamless Next.js deployment.*

**Security & Privacy:**
- All routes (except the login/landing page) must be protected by middleware.
- Row-Level Security / user ID filtering in Drizzle to ensure only your data is queried.

## 5. Risks & Roadmap
**Phased Rollout:**
- **MVP (v1.0):** 
  - Next.js setup with Drizzle + Neon DB.
  - Quick-Pad UI and database schema (Transactions: `id, amount, category, date, notes`).
  - Vercel Deployment & PWA manifest.
- **v1.1 (The Budgeting Layer):**
  - "Safe-to-Spend" math logic.
  - Basic list view to delete/edit mistakes.
- **v2.0:**
  - Charts (weekly/monthly trends) using Recharts.
  - Dark mode optimizations for OLED iPhones.

**Technical Risks:**
- PWA caching aggressive invalidation: Since it's a financial app, stale cache must be handled carefully so the "Safe-to-Spend" number is always perfectly up to date.