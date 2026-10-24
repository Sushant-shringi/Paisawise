# System Architecture & Technical Design

## 1. High-Level Architecture

PaisaWise is architected as a high-performance, single-page application (SPA) backed by a serverless Express 5 REST API and a PostgreSQL database hosted on Supabase.

```mermaid
flowchart TD
    Client["User Browser / Mobile Device"]

    subgraph Frontend ["Frontend Layer (React 19 + TypeScript + Vite)"]
        Router["React Router v7"]
        UI["Tailwind CSS + Lucide Icons"]
        Theme["Theme Context (5 Themes + Dark/Light)"]
        AuthCtx["Auth Context (JWT + Demo Mode)"]
        FinanceCtx["Finance Context (State & Reactive Calculations)"]
        Charts["Recharts Engine (Area, Bar, Donut)"]
        PDF["jsPDF Statement Generator"]
    end

    subgraph API ["Serverless Backend Layer (Express 5 on Vercel)"]
        Gateway["Express 5 REST Router (/api)"]
        AuthMux["Auth & Email OTP Controller"]
        TxnMux["Transaction Ledger Controller"]
        BudgetMux["Budgets & Threshold Controller"]
        GoalsMux["Savings Goals Controller"]
        SheetsMux["Google Sheets Sync Controller"]
        Mailer["Nodemailer (Gmail SMTP Engine)"]
    end

    subgraph Data ["Data & Storage Layer"]
        Postgres[("Supabase PostgreSQL 15\n(Row Level Security Enabled)")]
        LocalDb[("Local SQLite In-Memory Database\n(node:sqlite Fallback)")]
    end

    subgraph External ["External Cloud Services"]
        GoogleSheets["Google Sheets API v4 / Drive"]
        GmailService["Google Gmail SMTP Relay"]
    end

    Client --> Router
    Router --> UI
    UI --> AuthCtx
    UI --> FinanceCtx
    UI --> Theme
    FinanceCtx --> Charts
    FinanceCtx --> PDF

    AuthCtx --> Gateway
    FinanceCtx --> Gateway

    Gateway --> AuthMux
    Gateway --> TxnMux
    Gateway --> BudgetMux
    Gateway --> GoalsMux
    Gateway --> SheetsMux

    AuthMux --> Mailer
    Mailer --> GmailService

    SheetsMux --> GoogleSheets

    Gateway --> Postgres
    Gateway -.-> LocalDb
```

---

## 2. Frontend Layer (React 19 & TypeScript)

### Core Technologies
- **React 19 & React Router v7**: Component-driven architecture with clean client-side routing and protected route guards.
- **Tailwind CSS v3**: Mobile-responsive, utility-first styling with comprehensive dark mode support.
- **Recharts**: High-performance SVG-based visualizations for cash flow velocity, category allocation donuts, and daily expense trends.
- **jsPDF & jsPDF-AutoTable**: Client-side financial statement generation and audit-grade PDF export without backend dependency.

### State Management Hierarchy
```mermaid
graph TD
    ThemeProvider["ThemeProvider (Custom Colors, Light/Dark Modes)"]
    AuthProvider["AuthProvider (JWT Session, Login/Register, Demo Mode)"]
    FinanceProvider["FinanceProvider (Transactions, Budgets, Goals, Sheet State)"]
    AppLayout["App Layout (Navbar, Sidebar, ThemeSwitcher, Notifications)"]

    ThemeProvider --> AuthProvider
    AuthProvider --> FinanceProvider
    FinanceProvider --> AppLayout
```

- **`ThemeContext`**: Controls the active color palette (`professional-carbon`, `crimson-dusk`, `cobalt-steel`, `ember-glow`, `mint-frost`) and synchronizes dark/light classes on the document root.
- **`AuthContext`**: Manages user authentication state, token storage in `localStorage`, session restoration, and instant 1-click **Demo Mode** fallback.
- **`FinanceContext`**: Central state engine for all financial entities. Implements reactive computations (total income, total expense, net savings, budget utilization, financial health score) and triggers real-time updates across all components.

---

## 3. Backend API Layer (Express 5 & Node.js)

### Express 5 Serverless Architecture
The backend is structured into modular routers and compiled using `esbuild` into a single, high-efficiency CJS bundle (`api/index.js`) tailored for Vercel Serverless Functions.

- **Fast Cold Starts**: Single bundled artifact with all internal dependencies pre-inlined (`~1.9 MB`).
- **External Native Drivers**: `pg` and `node:sqlite` configured as external modules to prevent binary compilation mismatches.
- **Bcrypt Password Security**: Hashes passwords with 10 salt rounds prior to storage.
- **Real-Time Gmail SMTP Relay**: Directly contacts `smtp.gmail.com:465` with SSL/TLS encryption to deliver verified 6-digit OTP codes.

---

## 4. Database Schema & Models

PaisaWise utilizes a normalized relational schema with Row-Level Security (RLS) enabled across all tables.

```mermaid
erDiagram
    users ||--o{ profiles : "has one"
    users ||--o{ transactions : "logs"
    users ||--o{ budgets : "defines"
    users ||--o{ savings_goals : "tracks"
    users ||--o{ recurring_expenses : "manages"
    users ||--o{ google_sheet_connections : "links"
    categories ||--o{ transactions : "categorizes"
    categories ||--o{ budgets : "limits"

    users {
        string id PK
        string email UK
        string password_hash
        string full_name
        boolean email_verified
        timestamp created_at
    }

    profiles {
        string id PK, FK
        string full_name
        string currency
        string timezone
        string theme
        decimal monthly_income_target
    }

    categories {
        string id PK
        string name
        string type
        string color
        string icon
    }

    transactions {
        string id PK
        string user_id FK
        string category_id FK
        decimal amount
        string type
        string payment_method
        string title
        text notes
        date transaction_date
    }

    budgets {
        string id PK
        string user_id FK
        string category_id FK
        decimal monthly_limit
        decimal current_spent
        string period
    }

    savings_goals {
        string id PK
        string user_id FK
        string name
        decimal target_amount
        decimal current_amount
        date target_date
        string status
    }

    google_sheet_connections {
        string id PK
        string user_id FK
        string spreadsheet_id
        string spreadsheet_name
        string selected_sheet_name
        string sync_status
        timestamp last_sync_at
    }
```

---

## 5. Mathematical Precision & Determinism

### Floating-Point Error Elimination
JavaScript IEEE 754 floating-point arithmetic can introduce fractional rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`). PaisaWise enforces strict cent-level precision:

```typescript
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
```

All aggregations (`totalIncome`, `totalExpense`, `remainingBudget`, `netSavings`) pass through `roundMoney` before presentation.

### Algorithmic Financial Health Score (0–100)
The Health Score is computed deterministically across 4 weighted vectors:
1. **Budget Adherence (40%)**: Ratio of actual spend to planned budget.
2. **Net Savings Rate (30%)**: Percentage of monthly income saved.
3. **Fixed Recurring Burden (15%)**: Ratio of fixed subscriptions and rent to monthly income.
4. **Expense Volatility (15%)**: Week-over-week consistency in non-discretionary spending.
