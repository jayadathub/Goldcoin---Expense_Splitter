# Goldcoin 🪙
> **Intelligent Shared Expense & Multi-Day Trip Debt Resolution Platform**

Goldcoin is a modern, full-stack MERN web application engineered to eliminate the awkwardness and mathematical complexity of shared finances. Beyond basic expense splitting, Goldcoin features an algorithmic **Min-Cash-Flow Debt Simplification Engine**, an interactive **Real-Time Settle-Up Calculator**, and a unique **Multi-Day Vacation Trip Clustering** ledger that consolidates distinct daily circles into a unified, minimal-transaction settlement plan.

---

## 📌 Problem Statement

Splitting expenses among friends, flatmates, and travel groups is traditionally fraught with manual calculations, circular debts, and multi-day disorganization:
- **Redundant Circular Debts**: Group members often make dozens of redundant, circular bank transfers to settle small balances (e.g., A pays B, B pays C, C pays A).
- **Multi-Day Vacation Chaos**: Traditional splitters treat every trip as a single flat list, creating confusion when expenses span multiple days with varying participants.
- **Mental Math in Partial Settle-Ups**: Existing apps don't clearly display how much debt remains when a user makes a partial payment, creating confusion over outstanding balances.
- **Lack of Transparency**: When viewing an aggregated debt across a multi-day trip, travelers cannot easily see which individual days or activities contributed to that final balance.

---

## 🎯 Target Users

- **Travelers & Vacation Groups**: Friends on multi-day road trips or weekend getaways incurring diverse expenses (hotels, fuel, meals, activities) across different days.
- **Flatmates & Roommates**: Shared households managing recurring rent, utilities, groceries, Wi-Fi, and communal supplies.
- **Event & Outing Circles**: Friends and colleagues organizing parties, dinners, road trips, or group gifts.

---

## 💡 Solution

Goldcoin transforms messy group transactions into seamless financial harmony:
1. **Granular Daily Circles**: Create independent, dated circles for each day or event.
2. **Multi-Day Trip Clusters**: Combine individual daily circles into a single vacation ledger with consolidated debt minimization.
3. **Graph-Based Debt Simplification**: Automatically eliminates circular debts using a greedy min-cash-flow algorithm, minimizing the total number of bank transfers needed.
4. **Real-Time Settle-Up Calculator**: Dynamically calculates and displays the exact amount "still to be settled" as users type partial payment amounts.
5. **Itemized Per-User Trip Breakdown**: Click any traveler's balance card to inspect an itemized ledger of every trip leg contributing to their net balance.
6. **Flexible Splitting Models**: Supports Equal, Exact Amount, Percentage, and Shares/Weight-based distribution with strict mathematical validation.
7. **Warm Editorial Aesthetic**: Built on an artisanal off-white and warm cream design system (`#fbf9f4`, `#f5efe4`) for a calm, zero-stress financial experience.

---

## ✨ Key Features & Major Workflows

### 1. Multi-Day Trip Clustering Architecture
- Create individual daily circles (e.g., *Day 1 Travel & Hotel*, *Day 2 Scuba Diving*, *Day 3 Beach Cafe*).
- Combine them into a **Trip Cluster** with a custom vacation icon or photo.
- The photo automatically serves as a sharp, unblurred ambient header backdrop with auto-adapting high-contrast typography.
- The cluster aggregates line-by-line expenses across all days, calculates global member balances, and produces a single **Consolidated Final Debt Summary**.

### 2. Min-Cash-Flow Debt Simplification Algorithm
- Eliminates circular transactions across all group members.
- Calculates net balances: $\text{Net}_i = \sum \text{Paid} - \sum \text{Owed}$.
- Pairs the largest net debtor with the largest net creditor iteratively, reducing $O(N^2)$ transactions to at most $N-1$ clean settlement transfers.

### 3. Real-Time Partial Settle-Up & Live Balance Math
- When recording a settlement, entering any partial payment instantly calculates and displays:
  - **Total Debt Outstanding**
  - **Paying Now**
  - **Still to be settled** (dynamically updated in real time)
  - Full settlement celebration badge (`Fully Settled! 🎉`) when balance reaches zero.
- Features a convenient **1-Click "Pay Full"** shortcut button next to the amount input.

### 4. Interactive Per-User Trip Breakdown
- Click on any traveler's card in the *Overall Trip Net Balances* tab to open an itemized **Trip Breakdown Modal**.
- Displays the traveler's consolidated net balance, total paid across the trip, total consumption share, and a line-by-line reconciliation of every individual trip leg that contributed to their final amount.

### 5. Inline Expense Editing & Audit Trail
- Easily edit any existing expense (description, amount, category, payer, or split distribution).
- Ledger and balances immediately recompute while preserving audit integrity.

### 6. Flexible Expense Splitting Models
- **Equal Split**: Automatically divides the bill evenly among selected members.
- **Exact Amounts**: Custom rupee distribution validated to match the exact bill total.
- **Percentage Split**: Custom percentage breakdown strictly enforced to total 100%.
- **Shares / Weights**: Proportionally divides expenses based on units/shares consumed.

### 7. Smart Member Recommendations & Recents Caching
- When creating a new circle, Goldcoin automatically surfaces recently added friends and previous co-travelers for 1-click addition.

### 8. Filterable Expense Ledger & History
- Real-time search and filter controls across date ranges, expense categories (food, travel, stay, supplies), and payer identity.

---

## 🛠️ Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router 7, Axios | Responsive Single Page Application (SPA) |
| **Backend** | Node.js, Express.js (REST API), CORS, Cookie-Parser | Secure RESTful API Gateway |
| **Database** | MongoDB Atlas, Mongoose ODM | Cloud document storage for users, groups, expenses, settlements, and clusters |
| **Authentication** | JSON Web Tokens (JWT), HTTP-Only Cookies, localStorage Bearer token fallback, bcrypt password hashing | Stateless, persistent authentication |
| **Hosting & Cloud** | Vercel (Frontend), Render (Backend), MongoDB Atlas (Database) | Production cloud deployment |

---

## 🏗️ System Architecture

```text
+-------------------------------------------------------------------+
|               Browser / Client (React 19 + Vite)                  |
|  - Auth Context & Protected Routes                                |
|  - Real-Time Settle-Up Calculator                                 |
|  - Trip Clusters & Per-User Breakdown Modal                       |
+---------------------------------+---------------------------------+
                                  |
                      HTTPS / REST API Requests
                                  |
                                  v
+---------------------------------+---------------------------------+
|               Express.js REST API Server (Node.js)                |
|  - JWT Authentication Middleware                                  |
|  - CORS & Cookie Parsers                                          |
|  - Greedy Min-Cash-Flow Debt Simplification Algorithm             |
|  - Routes:                                                        |
|      /api/auth        -> Register, Login, Me, Profile             |
|      /api/groups      -> Circles, Members, Invites, Recents       |
|      /api/expenses    -> CRUD Expenses, Splits, Group Balances    |
|      /api/settlements -> Settle Payments, Settlement History      |
|      /api/clusters    -> Cluster Ledgers, Multi-Day Consolidation |
+---------------------------------+---------------------------------+
                                  |
                            Mongoose ODM
                                  |
                                  v
+---------------------------------+---------------------------------+
|                   MongoDB Atlas Cloud Database                    |
|  Collections: Users | Groups | Expenses | Settlements | Clusters  |
+-------------------------------------------------------------------+
```

---

## 💻 Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (local instance or free MongoDB Atlas URI)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/jayadathub/Goldcoin---Expense_Splitter.git
cd Goldcoin---Expense_Splitter
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory based on `.env.example`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/expense_splitter
CLIENT_URL=http://localhost:5173,http://localhost:5174
JWT_SECRET=your_super_secret_jwt_key_here
```

Start the backend:
```bash
npm run dev
# Backend server runs at http://localhost:5000
```

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
# Frontend application runs at http://localhost:5173
```

*(Alternatively, run `npm run dev` from the root folder to start both frontend and backend concurrently).*

---

## 🔐 Environment Variables

### Backend Configuration (`backend/.env`)
| Variable | Required | Description | Sample / Default Value |
|---|---|---|---|
| `PORT` | No | Port on which the Express server listens | `5000` |
| `MONGO_URI` | Yes | MongoDB connection string (Local or MongoDB Atlas) | `mongodb+srv://<user>:<password>@cluster.mongodb.net/expense_splitter` |
| `CLIENT_URL` | Yes | Allowed frontend origin(s) for CORS | `http://localhost:5173,https://goldcoin-expense-splitter-sjwr.vercel.app` |
| `JWT_SECRET` | Yes | Secret key used to sign and verify JSON Web Tokens | `your_secret_key_here` |

### Frontend Configuration (`frontend/.env`)
| Variable | Required | Description | Sample / Default Value |
|---|---|---|---|
| `VITE_API_URL` | No | Custom backend API base URL (defaults to live Render backend in production and localhost:5000 in development) | `https://goldcoin-expense-splitter.onrender.com/api` |

> **Security Note**: Never commit actual credentials or database passwords to version control. Keep all `.env` files in `.gitignore`.

---

## 🚀 Deployment Guide & Live Access

### 🌐 Live Production Links
The application is fully deployed and accessible in production:

| Component | Platform | Live URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | **Vercel** | **[https://goldcoin-expense-splitter-sjwr.vercel.app/](https://goldcoin-expense-splitter-sjwr.vercel.app/)** | ✅ Live |
| **Backend REST API** | **Render** | [https://goldcoin-expense-splitter.onrender.com/api](https://goldcoin-expense-splitter.onrender.com/api) | ✅ Live |
| **Health Check API** | **Render** | [https://goldcoin-expense-splitter.onrender.com/api/health](https://goldcoin-expense-splitter.onrender.com/api/health) | ✅ Active |

### Accessing & Testing the Live Application
1. **Open the Application**: Navigate to **[https://goldcoin-expense-splitter-sjwr.vercel.app/](https://goldcoin-expense-splitter-sjwr.vercel.app/)** in any modern web browser.
2. **Authentication**: Click **Register** to create a test user, or sign in to an existing account.
3. **Core Workflows to Test**:
   - **Circles & Expenses**: Create a new circle, add an expense, and test Equal, Exact, Percentage, or Shares splitting.
   - **Inline Expense Editing**: Click an expense to modify values on the fly.
   - **Multi-Day Trip Clusters**: View combined vacation clusters with custom sharp image backdrops.
   - **Per-User Trip Breakdown**: Click any traveler in *Overall Trip Net Balances* to view their itemized trip breakdown modal.
   - **Debt Simplification & Settle Up**: Open *Simplified Debts*, click *Settle Up*, and test real-time partial settlement calculations.

### Deploying Your Own Backend (Render)
1. Fork or push your repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com/).
3. Set **Root Directory** to `backend`.
4. Build Command: `npm install`.
5. Start Command: `node index.js`.
6. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`.

### Deploying Your Own Frontend (Vercel)
1. Create a new project on [Vercel](https://vercel.com/) linked to your repository.
2. Select **Root Directory**: `frontend`.
3. Framework Preset: **Vite** (auto-detected).
4. Build Command: `vite build`.
5. Output Directory: `dist`.

---

## 📄 License & Academic Submission
Developed for the **End-Term Software Project (October 2026)**.  
All algorithms, workflows, and user interfaces are independently engineered, thoroughly tested, and fully functional.
