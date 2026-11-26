<div align="center">

<img src="public/favicon.svg" width="72" height="72" alt="UniMart Logo" />

# UniMart — University Community Marketplace

**A verified multi-university campus marketplace where students and faculty buy, sell, negotiate, chat, and exchange campus services safely.**

[![Live Demo](https://img.shields.io/badge/Live%20App-Render-047857?style=for-the-badge&logo=render&logoColor=white)](https://unimart-campus-marketplace.onrender.com/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Raiyan-19/UniMart---University-Community-Marketplace)

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-REST%20API-000000?style=flat-square&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat-square&logo=postgresql&logoColor=white)

**[Explore Live Website](https://unimart-campus-marketplace.onrender.com/) · [Source Code on GitHub](https://github.com/Raiyan-19/UniMart---University-Community-Marketplace) · [Report an Issue](https://github.com/Raiyan-19/UniMart---University-Community-Marketplace/issues)**

</div>

---

## Overview

General classifieds and unmoderated social groups make campus buying and selling noisy, untrustworthy, and unsafe for university students. **UniMart** solves this by creating a dedicated, campus-scoped community marketplace tailored for universities (pre-seeded with **BAUST**, **DU**, **BRUR**, and **RU**).

Users verify through academic email domains, browse listings scoped to their campus or across partner universities, make structured price offers, message sellers directly, discover peer tutoring and student services, shop **Graduating Senior Clearance** deals, and rely on an **Enterprise Admin Console** for verification, content moderation, and audit logging.

---

## Quick Links

| Resource | Link |
| :--- | :--- |
| **Live Production Web App** | https://unimart-campus-marketplace.onrender.com/ |
| **GitHub Repository** | https://github.com/Raiyan-19/UniMart---University-Community-Marketplace |
| **Health Check Endpoint** | https://unimart-campus-marketplace.onrender.com/api/health |

> **Note:** The live site runs on Render's free tier, so the initial cold-start request after inactivity may take ~30–50 seconds while the server and PostgreSQL pool wake up.

---

## Key Features

### Multi-Campus Marketplace & Discovery
- **Campus-Scoped Filtering:** Switch between supported campuses (**BAUST**, **DU**, **BRUR**, **RU**) from the header selector to browse campus-specific listings or explore all universities.
- **Instant Live Search:** Header search bar with real-time product and category suggestions, clear triggers, and seamless navigation into filtered results.
- **Rich Product Listings:** Support for multi-image uploads (stored in **Supabase Storage** with local disk fallback), condition badges, original vs. discounted pricing, department tags, and view tracking.
- **Wishlist & Reviews:** Save favorite items to your wishlist and post verified ratings/reviews after transactions.

### Campus Trust, Auth & Role-Based Access
- **Academic Email & OTP Verification:** Registration supports institutional domain checks and OTP/email delivery via **Resend**, **Gmail SMTP (`nodemailer`)**, or **Brevo**.
- **Stateless JWT Authentication:** Signed `jsonwebtoken` sessions with `scrypt` password hashing (`salt + 64-byte digest`) that persist across server restarts and horizontal scaling.
- **Three User Roles:** Tailored capabilities across **Student**, **Teacher**, and **Admin** accounts.

### Offers, Messaging & Campus Hubs
- **Atomic Offer Negotiation:** Buyers submit custom price offers (`PENDING`); accepting an offer updates product status (`sold`), creates a `Transaction` record, and fires notifications inside a single Prisma `$transaction`.
- **Direct Buyer–Seller Chat:** Dedicated conversation threads linked to users and listings, paired with real-time in-app notifications.
- **Campus Services Directory:** Peer tutoring, academic skills, lab help, and local campus services.
- **Graduating Senior Clearance (`Graduating Sale`):** Dedicated section for outgoing seniors selling dorm gear, books, and electronics before graduation.
- **Student Guides & Helpdesk:** Campus safety checklists, trading rules, and support workflows.

### Enterprise Admin Management Console
- **Student & Faculty Verification:** Review pending users, approve/reject profiles, and run bulk verification actions (`POST /api/admin/users/bulk-verify`).
- **Listing & Report Moderation:** Inspect flagged listings and user reports (`GET /api/admin/listings`, status updates, deletion).
- **Immutable Audit Logs:** Track administrative actions with actor metadata, target IDs, and timestamps (`GET /api/admin/audit-logs`).

### Desktop & Mobile Feature Parity
- **Mobile Bottom Navigation + All Features Drawer:** Thumb-friendly 5-slot mobile navigation bar (`Home`, `Browse`, `Post`, `Messages`, `Menu`) opening a scroll-locked slide-up drawer with account summary, admin shortcut, all sidebar views, and confirmation-guarded logout.
- **Mobile Quick Explore Strip:** Horizontal shortcut pills on smaller screens for instant access to Services, Graduating Sale, Saved Items, and Guides while keeping desktop layout clean.

---

## System Architecture

```mermaid
flowchart LR
  Client["React 19 SPA<br/>(Vite + Tailwind CSS v4)"] -->|REST API + JWT Bearer| Express["Express.js Server<br/>(server.ts)"]
  Express -->|Auth & Role Guards| AuthMW["JWT Auth Middleware"]
  Express -->|Modular Controllers| Prisma["Prisma ORM Client"]
  Prisma -->|SQL Queries & $transaction| Postgres[("PostgreSQL<br/>(Supabase Pooler)")]
  Express -->|Image Uploads| Storage["Supabase Storage<br/>(unimart-uploads bucket)"]
  Express -->|OTP & Alerts| Mailer["Email Delivery<br/>(Resend / Gmail SMTP / Brevo)"]
```

### Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Motion |
| **Backend API** | Node.js, Express.js, `tsx` |
| **Database & ORM** | PostgreSQL (Supabase), Prisma ORM (`17` relational models) |
| **Authentication** | Stateless JWT (`jsonwebtoken`), Node `crypto.scryptSync` password hashing |
| **Media Storage** | Supabase Storage (`@supabase/supabase-js`) with local `/uploads` dev fallback |
| **Email Delivery** | Resend API / Brevo / Nodemailer SMTP |
| **Deployment** | Render (`render.yaml` Blueprint) + Supabase Free Tier |

---

## Demo Accounts

The database seed ([prisma/seed.ts](prisma/seed.ts)) provisions sample accounts so you can immediately explore all three roles on the [live deployment](https://unimart-campus-marketplace.onrender.com/) or locally:

| Role | Name | Email | Password | Campus |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Raiyan | `raiyan19@student.baust.edu.bd` | `password123` | BAUST (CSE) |
| **Student** | Sadman Sakib | `sadman@du.ac.bd` | `password123` | DU (CSE) |
| **Teacher** | Dr. Aminul Islam | `aminul@baust.edu.bd` | `password123` | BAUST (CSE) |
| **Admin** | Sara Khan | `admin@unimart.edu.bd` | `admin123` | BAUST (Admin) |

---

## Project Structure

```text
Unimart---University-Community-Marketplace/
├── prisma/
│   ├── schema.prisma          # 17 PostgreSQL models (User, Product, Offer, Transaction, AuditLog, etc.)
│   └── seed.ts                # Idempotent database seeding (4 universities, departments, demo items)
├── public/
│   ├── favicon.svg            # Scalable vector brand icon
│   ├── favicon.ico            # 32x32 ICO icon
│   └── apple-touch-icon.png   # 180x180 iOS home screen icon
├── server/
│   ├── controllers/           # Route handlers (auth, products, offers, chat, admin, upload, etc.)
│   ├── db/                    # Prisma singleton client & async repository store
│   ├── middleware/            # JWT verification & role authorization guards
│   ├── routes/                # 11 modular Express routers mounted under /api/*
│   └── services/              # Email delivery & verification helpers
├── src/
│   ├── components/            # Feature modules (admin, auth, chat, graduating, guides, home, layout, marketplace, notifications, profile, services, support, views)
│   ├── context/               # React AuthContext & global state providers
│   ├── services/              # Frontend API client
│   ├── types/                 # Shared TypeScript interfaces
│   ├── utils/                 # Validation, routing, permissions & unit tests (*.test.ts)
│   ├── App.tsx                # Application shell & view routing
│   └── main.tsx               # React root entrypoint
├── server.ts                  # Express + Vite middleware (dev) / dist static server (prod)
├── render.yaml                # Render Blueprint deployment configuration
├── .env.example               # Environment variable template
└── package.json               # Scripts & dependencies
```

---

## API Overview

| Base Path | Module | Responsibilities |
| :--- | :--- | :--- |
| `/api/health` | Health Monitor | Verifies server status & live PostgreSQL connectivity (`SELECT 1`) |
| `/api/auth` | Authentication | Registration, login, OTP/email verification, current session user |
| `/api/universities` | Campuses | Supported universities & academic departments |
| `/api/users` | Profiles | Profile updates, public seller lookup, password updates |
| `/api/products` | Marketplace | Browse/filter listings, search suggestions, create/edit/delete, wishlist |
| `/api/offers` | Negotiation | Submit offers, accept/reject offers atomically via `$transaction` |
| `/api/chat` | Messaging | Conversations list, message threads, unread handling |
| `/api/reviews` | Trust & Ratings | Buyer/seller reviews after transactions |
| `/api/reports` | Safety | Flag listings or report suspicious behavior |
| `/api/notifications` | Alerts | Fetch and mark user notifications as read |
| `/api/upload` | Media | Upload listing/avatar images to Supabase Storage or local fallback |
| `/api/admin` | Moderation | User verification, bulk verify, listing moderation, audit logs |

---

## Getting Started (Local Development)

### Prerequisites
- **Node.js** `v20+` and **npm**
- A free **PostgreSQL** database (e.g., [Supabase](https://supabase.com) Session Pooler URI)

### 1. Clone the Repository

```bash
git clone https://github.com/Raiyan-19/UniMart---University-Community-Marketplace.git
cd UniMart---University-Community-Marketplace
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Minimum required variables in `.env`:

```env
APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
JWT_SECRET="replace-with-a-strong-32-plus-character-random-secret"

# Optional: Cloud image uploads via Supabase Storage
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_BUCKET="unimart-uploads"
```

> Refer to [`.env.example`](.env.example) for optional email provider settings (`RESEND_API_KEY`, `GMAIL_USER`/`GMAIL_APP_PASSWORD`, or `BREVO_API_KEY`) and `GEMINI_API_KEY`.

### 4. Push Schema & Seed Database

```bash
npx prisma generate
npm run db:push
npm run db:seed
```

### 5. Run the Development Server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. Both the Vite React frontend and Express API run together on port `3000`.

### Available Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start Express + Vite dev server on port `3000` |
| `npm run lint` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm run build` | Build production frontend bundle into `dist/` |
| `npm start` | Start production server (`tsx server.ts`) |
| `npm run db:push` | Push Prisma schema to PostgreSQL |
| `npm run db:seed` | Populate universities, departments, demo users & listings |

---

## Production Deployment (Render + Supabase)

This repository includes [`render.yaml`](render.yaml) for one-click deployment on **Render**:

1. Create a **Supabase** PostgreSQL project and public storage bucket named `unimart-uploads`.
2. Connect the GitHub repository on **Render** (`Web Service` or Blueprint).
3. Configure the environment variables (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`, `APP_URL`, and `JWT_SECRET`).
4. Render automatically runs:
   - **Build:** `npm install && npx prisma generate && npm run build`
   - **Start:** `npx prisma db push --skip-generate && NODE_ENV=production npm start`
   - **Health Check:** `/api/health`

---

## Author

**Raiyan**
- GitHub: [@Raiyan-19](https://github.com/Raiyan-19)
- Email: `sultanmdraiyan@gmail.com`
- Live Deployment: https://unimart-campus-marketplace.onrender.com/
- Repository: https://github.com/Raiyan-19/UniMart---University-Community-Marketplace
