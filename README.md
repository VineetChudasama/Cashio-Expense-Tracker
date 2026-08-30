# 💸 Cashio — Intelligent Finance & Expense Tracker

<div align="center">

![Cashio Banner](frontend/public/logo-dark.png)

### Master Your Financial Flow with Predictive Intelligence

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

**[Live Demo (Vercel)](https://cashio-tracker.vercel.app)** • **[API Server (Render)](https://cashio-backend.onrender.com)** • **[Report Bug](https://github.com/VineetChudasama/Cashio-Expense-Tracker/issues)**

</div>

---

## 🌟 Overview

**Cashio** is a modern, full-stack personal finance application engineered for individuals and teams seeking total clarity over their money. Combining luxury glassmorphic aesthetics with predictive forecasting algorithms and zero-friction peer debt settlement, Cashio turns transaction tracking into actionable financial intelligence.

---

## 🚀 Key Features

### 📊 1. Smart Expense Management
* **Instant Logging**: Track daily expenses with intuitive category tagging, customizable currency settings, and instant date selection.
* **Granular Filtering & Search**: Filter transactions by category, custom date intervals, or search keywords with server-side pagination.
* **Export Ready**: View historical logs with real-time summary aggregates.

### 🔮 2. 30-Day Predictive Cash Flow Forecast
* **Pattern Detection**: Automated detection of recurring expenditure patterns (subscriptions, utilities, salaries).
* **Trajectory Simulation**: Computes 30-day forward-looking account balance projections to prevent overdrafts before they happen.
* **Interactive Visualization**: Rich time-series charts visualizing actual history seamlessly merged with projected trends.

### 🤝 3. Peer Splits & Debt Simplification
* **Group Expense Sharing**: Split shared dinners, trips, or household bills with peers via email lookup.
* **Greedy Settlement Optimization**: Built-in debt simplification algorithm minimizes the total number of peer-to-peer payments required.
* **1-Click Settlement**: Track individual participant settlements and clear balances instantly.

### 💡 4. Real-Time Financial Insights
* **Anomaly & Trend Detection**: Analyzes month-over-month shifts, top expenditure categories, and weekend vs. weekday spending velocity.
* **Actionable Budget Feedback**: Identifies budget optimization opportunities tailored to your spending habits.

### 🔒 5. Enterprise-Grade Security
* **One-Way Password Hashing**: Passwords are cryptographically salted and hashed using **`bcrypt`** (never stored in plaintext).
* **Real-time Password Compliance**: 5-parameter strict compliance checklist with dictionary attack and breached credential warnings.
* **6-Digit Email OTP Authentication**: Secure identity verification for registration, password recovery, and email updates using Brevo HTTP REST API and Supabase Auth.
* **Permanent Account Erasure**: 2-step verification modal with cascade deletion ensuring complete privacy control.

### 🎨 6. Luxury UI & Adaptive Theming
* **Dark / Light Glassmorphism**: Tailored emerald and obsidian aesthetic with fluid animations powered by Framer Motion.
* **Fully Responsive**: Optimized UX across mobile smartphones, tablets, and wide-screen desktops.

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React 18, Vite
* **Styling**: Tailwind CSS, Custom Glassmorphism System
* **Animations**: Framer Motion
* **Icons**: Lucide React
* **Charts**: Recharts
* **State & Routing**: React Router v6, Context API

### Backend
* **Runtime**: Node.js (ES Modules)
* **Framework**: Express.js
* **ORM & Database**: Prisma ORM, PostgreSQL (Supabase)
* **Authentication**: JWT (JSON Web Tokens), bcryptjs
* **Validation**: express-validator
* **Mailing**: Brevo HTTP REST API (port 443), Nodemailer (SMTP fallback), Resend API

---

## 📂 Project Architecture

```
expense-tracker/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Database schema definitions
│   ├── src/
│   │   ├── middleware/          # JWT auth middleware
│   │   ├── routes/              # Express API route handlers
│   │   │   ├── auth.js          # Authentication & verification
│   │   │   ├── expenses.js      # Expense CRUD & pagination
│   │   │   ├── forecast.js      # Predictive cash flow engine
│   │   │   ├── insights.js      # Analytical insights
│   │   │   ├── splits.js        # Group splits & debt simplification
│   │   │   └── users.js         # Profile management & account deletion
│   │   ├── utils/               # Mailer, OTP, password compliance
│   │   └── index.js             # Express server entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/                  # Static assets & logos
│   ├── src/
│   │   ├── components/          # Reusable UI widgets & modals
│   │   ├── context/             # AuthContext & ThemeContext
│   │   ├── lib/                 # Axios API client
│   │   ├── pages/               # Route pages (Dashboard, Expenses, Splits, etc.)
│   │   ├── App.jsx              # Application router & code-splitting
│   │   └── main.jsx             # React entry point
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
git clone https://github.com/VineetChudasama/Cashio-Expense-Tracker.git
cd Cashio-Expense-Tracker
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

# Email Configuration (Brevo HTTP REST API)
BREVO_API_KEY="xkeysib-your_brevo_v3_api_key"
EMAIL_USER="your-email@gmail.com"

# Optional Fallbacks
RESEND_API_KEY=""
```

Run database migrations:
```bash
npx prisma migrate dev --name init
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
```

Start the frontend development server:
```bash
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 📡 API Reference Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user & send OTP | No |
| `POST` | `/api/auth/verify-register-otp` | Verify 6-digit registration OTP | No |
| `POST` | `/api/auth/login` | Sign in with email & password | No |
| `POST` | `/api/auth/forgot-password` | Send password reset OTP | No |
| `POST` | `/api/auth/reset-password` | Reset password using OTP code | No |
| `GET` | `/api/expenses` | List expenses (supports pagination & filters) | **Yes** |
| `POST` | `/api/expenses` | Create a new expense | **Yes** |
| `PUT` | `/api/expenses/:id` | Update an existing expense | **Yes** |
| `DELETE` | `/api/expenses/:id` | Delete an expense | **Yes** |
| `GET` | `/api/forecast` | Retrieve 30-day cash flow projection | **Yes** |
| `GET` | `/api/splits` | List group shared expenses | **Yes** |
| `GET` | `/api/splits/settle` | Calculate simplified debt transactions | **Yes** |
| `POST` | `/api/splits/settle-transaction`| Settle balance between two peers | **Yes** |
| `GET` | `/api/insights` | Retrieve spending anomalies and advice | **Yes** |
| `GET` | `/api/users/profile` | Get current profile details & statistics | **Yes** |
| `PUT` | `/api/users/profile` | Update profile name and currency | **Yes** |
| `DELETE`| `/api/users/account` | Permanently delete account & records | **Yes** |

---

## 🔒 Security Practices

1. **Authentication**: Stateless JSON Web Tokens (JWT) stored securely on the client.
2. **Password Safety**: Salted bcrypt hashing with 10 rounds; passwords cannot be retrieved or decrypted.
3. **Database Transactions**: Deletions and balance settlements execute within atomic Prisma transactions (`$transaction`) preventing data inconsistency.
4. **Cloud Mail Reliability**: REST HTTPS API dispatch to circumvent cloud SMTP port limitations.

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute for personal and commercial projects.

---

<div align="center">
  <sub>Built with ❤️ by Vineet Chudasama</sub>
</div>
