# Goldcoin 🪙
> **Intelligent Shared Expense & Multi-Day Trip Debt Resolution Platform**

Goldcoin is a modern, full-stack MERN web application engineered to eliminate the awkwardness and mathematical complexity of shared finances. Beyond basic group expense splitting, Goldcoin features an algorithmic **Min-Cash-Flow Debt Simplification Engine** and a unique **Multi-Day Vacation Trip Clustering** ledger that consolidates distinct daily circles into a unified, minimal-transaction settlement plan.

---

## Problem Statement

Splitting expenses among friends, flatmates, and travel groups is traditionally fraught with manual calculations, circular debts, and multi-day disorganization. 
- Traditional splitters treat every trip or event as a single flat list, leading to clutter when expenses span across multiple days or varying subgroups.
- People end up making dozens of redundant, circular bank transfers to settle small debts (e.g., A owes B, B owes C, C owes A).
- Tracking expenses during vacations with varying participants on different days creates compounding confusion.

## Target Users

- **Travelers & Vacation Groups**: Friends on weekend getaways or road trips who incur expenses across different days and activities.
- **Flatmates & Roommates**: Shared living spaces managing rent, utilities, groceries, and periodic house supplies.
- **Colleagues & Outing Circles**: Groups going out for team lunches, dinners, coffee runs, or event tickets.

## Solution

GoldCoin transforms messy group transactions into seamless financial harmony:
1. **Granular Daily Circles**: Create independent, dated circles for each day or event.
2. **Multi-Day Trip Clusters**: Cluster individual daily circles into a single vacation ledger with unified balance aggregation.
3. **Graph-Based Debt Simplification**: Automatically collapses circular debts using a greedy min-cash-flow algorithm, minimizing the total number of bank transfers needed.
4. **Flexible Splitting Models**: Supports Equal, Exact Amount, Percentage, and Shares/Weight-based distribution with mathematical validation.
5. **Warm, Aesthetic User Experience**: Built on an artisanal off-white and warm cream aesthetic (`#fbf9f4`, `#f5efe4`) designed for calm, zero-stress financial clarity.

---

## Key Features & Major Workflows

### 1. Multi-Day Trip Clustering Architecture
- Create individual daily circles (e.g., *Day 1 Travel & Hotel*, *Day 2 Scuba Diving*, *Day 3 Beach Shack*).
- Combine them into a **Trip Cluster** with a custom vacation icon (upload from PC/phone, paste from clipboard, or image URL).
- The cluster aggregates line-by-line expenses across all days, calculates global member balances, and produces a single **Consolidated Final Debt Summary**.

### 2. Min-Cash-Flow Debt Simplification Algorithm
- Eliminates circular transactions across all group members.
- Calculates net balances: $\text{Net}_i = \sum \text{Paid} - \sum \text{Owed}$.
- Pairs the largest net debtor with the largest net creditor iteratively, reducing $O(N^2)$ transactions to at most $N-1$ clean settlement transfers.

### 3. Flexible Expense Splitting
- **Equal Split**: Automatically divides the bill evenly.
- **Exact Amounts**: Custom rupee distribution validated to match the exact bill total.
- **Percentage Split**: Custom percentage breakdown strictly enforced to total 100%.
- **Shares / Weights**: Proportionally divides expenses based on units/shares consumed.

### 4. Smart Member Recommendations & Recents Caching
- When creating a new circle, GoldCoin automatically surfaces recently added friends and previous co-travelers for 1-click addition.

### 5. In-Browser Image Optimization
- Client-side `<canvas>` compression automatically resizes phone camera and PC photos (even 5–10MB files) down to ~30–50KB JPEG thumbnails before transmission.

### 6. Filterable Expense Ledger & History
- Real-time search and filter controls across date ranges, expense categories (food, travel, stay, supplies), and payer identity.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, React Router 7, Axios |
| **Backend** | Node.js, Express.js (RESTful API), Express Validator |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT), HTTP-Only Cookies, bcryptjs password hashing |
| **Image Processing** | HTML5 Canvas Client-Side Compressor, Base64 Data URL storage |

---

## System Architecture

```text
[ Browser / Client (React 19 + Tailwind v4) ]
                     │
         HTTPS / REST API Requests
                     │
                     ▼
[ Express.js Server API Gateway ]
   ├── Authentication Middleware (JWT in Cookies)
   ├── Body Parsers (10MB payload support for compressed images)
   └── Route Handlers:
         ├── /api/auth       (Register, Login, Profile Update)
         ├── /api/groups     (Circles, Members, Member Suggestions)
         ├── /api/expenses   (Multi-type splits, Ledger filters)
         ├── /api/settlements(Debt clearance transactions)
         └── /api/clusters   (Multi-day aggregation & Min-Cash-Flow graph)
                     │
                     ▼
[ MongoDB Database (Mongoose ODM) ]
   ├── Users
   ├── Groups (Circles)
   ├── Expenses (Splits breakdown)
   ├── Settlements
   └── Clusters (Aggregated daily circles)
```

---

## Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or a free MongoDB Atlas connection URI)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/GoldCoin.git
cd GoldCoin
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
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_super_secret_jwt_key_here
```

Start the backend server:
```bash
npm run dev
# Server will run at http://localhost:5000
```

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
# Frontend will run at http://localhost:5173
```

---

## Environment Variables

| Variable | Description | Sample Value |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/expense_splitter` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `JWT_SECRET` | Secret key for signing authentication tokens | *secure-random-string* |

> **Note**: Real credentials and keys are never committed to version control. Keep your `.env` file private.

---

## Deployment Guide & Live Access

### 🌐 Live Production Links
The application is fully deployed and accessible in production:

| Component | Platform | Live URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Application** | **Vercel** | **[https://goldcoin-expense-splitter-sjwr.vercel.app/](https://goldcoin-expense-splitter-sjwr.vercel.app/)** | ✅ Live |
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

### Deploy Backend (Render / Railway)
1. Push your repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com/) or [Railway](https://railway.app/).
3. Root Directory: `backend`.
4. Build Command: `npm install`.
5. Start Command: `node index.js`.
6. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`.

### Deploy Frontend (Vercel)
1. Create a new project on [Vercel](https://vercel.com/) linked to your GitHub repo.
2. Root Directory: `frontend`.
3. Framework Preset: `Vite`.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Live Frontend URL: **https://goldcoin-expense-splitter-sjwr.vercel.app/**

---


## License & Academic Submission
Developed for the **End-Term Software Project (October 2026)**.
All workflows and algorithms are independently engineered and functional.
