# 💸 Cashio — Intelligent Finance, Split & Push Notification Workspace

<div align="center">

![Cashio Banner](frontend/public/logo-dark.png)

### Master Your Financial Flow with Predictive Intelligence & Real-Time Alerts

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Web Push](https://img.shields.io/badge/Web_Push-VAPID-FF6B6B?style=for-the-badge&logo=google-chrome&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

**[Live Web App (Vercel)](https://cashio-tracker.vercel.app)** • **[API Server (Render)](https://cashio-backend.onrender.com)** • **[Report Bug](https://github.com/VineetChudasama/Cashio-Expense-Tracker/issues)**

</div>

---

## 🌟 Overview

**Cashio** is a full-stack financial workspace and expense tracking platform engineered for individuals and teams seeking total clarity over their money. Combining obsidian and pearl mint luxury glassmorphism with predictive forecasting algorithms, zero-friction peer debt settlement, and **background Web Push notifications**, Cashio turns daily transaction tracking into proactive financial intelligence.

---

## 🚀 Key Features

### 🔔 1. Background Web Push Notifications & PWA
* **Background Device Push**: Receive instant push notifications on your phone (Chrome / Android) and desktop even when Cashio is not open.
* **Proactive Budget Alerts**: Automated notifications when approaching 80% or exceeding 100% of your projected monthly spending limits.
* **Automated Daily Reminders & Summaries**: Daily evening expense logging nudges and weekly spending digests powered by a server-side background scheduler.
* **Instant Group Split Alerts**: Real-time push delivery when peers split a bill with you or mark a debt as settled.
* **Universal Browser Engine**: Seamless, tailored compatibility across Google Chrome, Brave (with privacy toggle guidance), iOS Safari (PWA mode), Microsoft Edge, Mozilla Firefox, and macOS Safari.
* **In-App Notification Drawer**: Dynamic interactive notification bell with physics-based hover animations, unread counters, and category filters (`All`, `Splits`, `Alerts`, `Unread`).

### 📊 2. Smart Expense Management
* **Instant Transaction Logging**: Record daily expenses with customizable category tagging, note attachments, and flexible currency settings ($ USD, ₹ INR, € EUR, £ GBP, etc.).
* **Granular Filtering & Search**: Filter transactions by category, custom date intervals, or search keywords with server-side pagination.
* **Summary Aggregates**: Real-time spending velocity and category breakdown cards.

### 🔮 3. 30-Day Predictive Cash Flow Forecast
* **Pattern Detection**: Automated detection of recurring expenditure patterns (subscriptions, utilities, rent).
* **Trajectory Simulation**: Computes 30-day forward-looking account balance projections to prevent overdrafts before they happen.
* **Interactive Visualization**: Recharts time-series visualization seamlessly blending historical data with projected future trends.

### 🤝 4. Peer Splits & Debt Simplification
* **Group Expense Sharing**: Split shared dinners, trips, or household bills with peers via email lookup.
* **Greedy Settlement Optimization**: Built-in debt simplification algorithm minimizes the total number of peer-to-peer payments required.
* **1-Click Settlement**: Track individual participant settlements and clear balances instantly with automatic push notifications.

### 💡 5. Actionable Financial Insights
* **Anomaly & Trend Detection**: Analyzes month-over-month shifts, top expenditure categories, and weekend vs. weekday spending velocity.
* **Actionable Budget Feedback**: Identifies budget optimization opportunities tailored to your habits.

### 🔒 6. Enterprise-Grade Security & Privacy
* **One-Way Password Hashing**: Passwords salted and hashed with **`bcrypt`** (never stored in plaintext).
* **Real-time Password Compliance**: 5-parameter strict compliance checklist with dictionary attack and breached credential warnings.
* **6-Digit Email OTP Authentication**: Secure identity verification for registration, password recovery, and email changes using Brevo HTTP REST API and Supabase Auth.
* **Permanent Account Erasure**: 2-step verification modal with cascade deletion ensuring complete data privacy.

### 🎨 7. Dual Luxury Glassmorphism Themes
* **Obsidian Emerald (Dark) & Pearl Mint (Light)**: Tailored palettes with luminous ambient glow typography, dot-matrix grid backgrounds, and fluid Framer Motion animations.
* **Full OpenGraph & SEO**: Rich link preview cards and metadata for social sharing.

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React 18, Vite
* **Styling**: Tailwind CSS, Custom Glassmorphism System
* **Animations**: Framer Motion
* **Push & PWA**: Web Push API, Service Workers (`/sw.js`), Web App Manifest (`manifest.json`)
* **Icons**: Lucide React
* **Charts**: Recharts
* **State & Routing**: React Router v6, Context API

### Backend
* **Runtime**: Node.js (ES Modules)
* **Framework**: Express.js
* **ORM & Database**: Prisma ORM, PostgreSQL (Supabase / Render)
* **Web Push Delivery**: `web-push` (VAPID Keypair Authentication)
* **Authentication**: JWT (JSON Web Tokens), bcryptjs
* **Validation**: express-validator
* **Mailing**: Brevo HTTP REST API (port 443), Nodemailer (SMTP fallback), Resend API

---

## 📂 Project Architecture

```
expense-tracker/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma            # Prisma schema (User, Expense, PushSubscription, NotificationPreference)
│   ├── src/
│   │   ├── middleware/              # JWT auth middleware
│   │   ├── routes/                  # Express API route handlers
│   │   │   ├── auth.js              # Authentication & OTP verification
│   │   │   ├── expenses.js          # Expense CRUD & pagination
│   │   │   ├── forecast.js          # Predictive cash flow engine
│   │   │   ├── insights.js          # Analytical insights
│   │   │   ├── notifications.js     # Push subscription, preferences & in-app alerts
│   │   │   ├── splits.js            # Group splits & debt simplification
│   │   │   └── users.js             # Profile management & account deletion
│   │   ├── utils/
│   │   │   ├── webPush.js           # VAPID setup & Web Push dispatcher
│   │   │   ├── pushScheduler.js     # Background cron scheduler (reminders & budget checks)
│   │   │   ├── notifications.js     # In-app and push notification creator
│   │   │   ├── mailer.js            # Brevo HTTP & Nodemailer dispatchers
│   │   │   └── debtSimplify.js      # Greedy debt minimization algorithm
│   │   └── index.js                 # Express server entry point & scheduler startup
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   │   ├── sw.js                    # Service Worker (Web Push & Notification click handler)
│   │   ├── manifest.json            # PWA Web App Manifest
│   │   ├── og-image.png             # OpenGraph social card preview
│   │   └── logo-dark.png            # App emblems & icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── NotificationBell.jsx     # Animated notification drawer & badge
│   │   │   ├── NotificationSettings.jsx # Multi-browser push permission & preference manager
│   │   │   ├── FlowBackground.jsx       # Ambient aurora & dot matrix background
│   │   │   ├── Layout.jsx               # Navigation bar & layout wrapper
│   │   │   └── ...                      # Modals, forms & badging widgets
│   │   ├── context/                 # AuthContext & ThemeContext
│   │   ├── lib/                     # Axios API client
│   │   ├── utils/
│   │   │   └── pushNotifications.js # Browser detection, VAPID registration & PushManager
│   │   ├── pages/                   # Dashboard, Expenses, Splits, Forecast, Insights, Profile, Landing
│   │   ├── App.jsx                  # Application router & code-splitting
│   │   └── main.jsx                 # React entry point & SW registration
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
* **Node.js** (v18.0.0 or higher)
* **PostgreSQL** database (Local or Cloud e.g., Supabase / Neon / Render)
* **npm** or **yarn**

### 2. Clone the Repository
```bash
git clone https://github.com/VineetChudasama/Flow-Expense-Tracker.git
cd Flow-Expense-Tracker
```

### 3. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"
JWT_SECRET="your_super_secret_jwt_key_here"

# Web Push Notification VAPID Keys (Run: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:support@cashio.app"

# Email Configuration (Brevo HTTP REST API)
BREVO_API_KEY="xkeysib-your_brevo_v3_api_key"
EMAIL_USER="your-email@gmail.com"

# Optional Fallbacks
RESEND_API_KEY=""
```

Sync database schema with Prisma:
```bash
npx prisma db push
```

Start the backend development server:
```bash
npm run dev
```

### 4. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL="http://localhost:5000/api"
VITE_VAPID_PUBLIC_KEY="your-vapid-public-key"
```

Start the frontend development server:
```bash
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 📡 API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/notifications/vapid-public-key` | Retrieve VAPID public key for browser push subscription | No |
| `POST` | `/api/auth/register` | Register new user & send 6-digit OTP | No |
| `POST` | `/api/auth/verify-register-otp` | Verify 6-digit registration OTP | No |
| `POST` | `/api/auth/login` | Sign in with email & password | No |
| `POST` | `/api/auth/forgot-password` | Send password reset OTP | No |
| `POST` | `/api/auth/reset-password` | Reset password using OTP code | No |
| `GET` | `/api/notifications` | Get paginated in-app notifications | **Yes** |
| `PATCH`| `/api/notifications/:id/read` | Mark single notification as read | **Yes** |
| `PATCH`| `/api/notifications/read-all` | Mark all user notifications as read | **Yes** |
| `GET` | `/api/notifications/preferences`| Get user push notification preferences | **Yes** |
| `PUT` | `/api/notifications/preferences`| Update notification preferences | **Yes** |
| `POST` | `/api/notifications/subscribe` | Register new Web Push browser subscription | **Yes** |
| `POST` | `/api/notifications/unsubscribe` | Unsubscribe current browser endpoint | **Yes** |
| `POST` | `/api/notifications/test` | Dispatch instant test push notification | **Yes** |
| `GET` | `/api/expenses` | List expenses (supports search, categories & date filters) | **Yes** |
| `POST` | `/api/expenses` | Create a new expense | **Yes** |
| `PUT` | `/api/expenses/:id` | Update an existing expense | **Yes** |
| `DELETE`| `/api/expenses/:id` | Delete an expense | **Yes** |
| `GET` | `/api/forecast` | Retrieve 30-day cash flow projection | **Yes** |
| `GET` | `/api/splits` | List group shared expenses & participants | **Yes** |
| `GET` | `/api/splits/settle` | Calculate simplified debt transactions | **Yes** |
| `POST` | `/api/splits/settle-transaction`| Settle balance between two peers | **Yes** |
| `GET` | `/api/insights` | Retrieve spending anomalies and optimization tips | **Yes** |
| `GET` | `/api/users/profile` | Get current profile details & workspace statistics | **Yes** |
| `PUT` | `/api/users/profile` | Update profile name and preferred currency | **Yes** |
| `DELETE`| `/api/users/account` | Permanently delete account & cascade records | **Yes** |

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute for personal and commercial projects.

---

<div align="center">
  <sub>Built with ❤️ by Vineet Chudasama</sub>
</div>
