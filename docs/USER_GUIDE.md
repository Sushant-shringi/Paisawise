# PaisaWise — End-User Manual & Feature Guide

Welcome to the comprehensive user guide for **PaisaWise**. This manual covers step-by-step instructions for getting the most out of your personal finance platform.

---

## 1. Getting Started & Account Creation

### Registering Your Account
1. Open the application at [https://paisawise-two.vercel.app](https://paisawise-two.vercel.app) (or your local development URL).
2. Click on the **"Create Account"** tab on the login screen.
3. Fill in your **Legal Name**, **Email Address**, and choose a strong password (minimum 6 characters).
4. Review and accept the Terms of Service, then click **"Register with Email OTP"**.
5. Check your Gmail inbox for a single-use 6-digit verification code.
6. Enter the 6-digit code on the verification screen to complete onboarding.

> **Tip:** You can also click **"Explore with pre-seeded demo records"** to immediately tour the platform pre-populated with realistic Indian transactions, budgets, and savings goals.

---

## 2. The Financial Cockpit (Dashboard)

The central cockpit provides an instant summary of your financial trajectory:

- **Total Income (₹):** Cumulative money earned during the selected period.
- **Total Expenses (₹):** Sum of all outflows across every category.
- **Net Savings (₹):** Difference between income and expenses. Displays green for net positive cash flow.
- **Financial Health Score (0–100):** Algorithmic rating calculated from budget discipline, savings rate, and fixed recurring burdens.
- **Monthly Income Target:** Progress bar tracking earned income against your target goal.
- **Expense Breakdown Donut:** Interactive Recharts chart detailing category percentages (Groceries, Housing, Dining, Commute).
- **Daily Expense Trend:** Outflow velocity bar chart highlighting spending spikes.

---

## 3. Transaction Management & Ledger

### Logging a New Expense or Income
1. Navigate to **Transactions** in the navigation bar.
2. Click the **"Record"** (or `+ Add Transaction`) button in the top right.
3. Select whether the transaction is an **Expense** or **Income**.
4. Enter the **Title** (e.g., `Reliance Smart Supermarket`, `Salary Credit`, `Zomato Order`).
5. Specify the **Amount** in Indian Rupees (₹).
6. Select the **Payment Method**:
   - `UPI` (Google Pay, PhonePe, Paytm)
   - `Net Banking`
   - `Credit Card`
   - `Debit Card`
   - `Cash`
7. Assign a **Category** and optionally attach notes.
8. Click **"Add Transaction"**. The ledger updates immediately.

### Searching & Filtering
- **Keyword Search:** Filter by merchant name or notes in real time.
- **Type Toggle:** View all records, expenses only, or income only.
- **Date Preset Dropdown:** Inspect data for *This Month*, *Last Month*, *Last 30 Days*, or *Year-to-Date*.
- **Exporting Records:** Click **"Export CSV"** to download an RFC-4180 compliant spreadsheet.

---

## 4. Budgets & Threshold Guardrails

PaisaWise protects you from accidental overspending:

1. Navigate to **Budgets** in the navigation sidebar.
2. Review category allowances (e.g., *Food & Dining*, *Groceries*, *Shopping*).
3. **Threshold Indicators:**
   - **Green (`< 50%`):** Healthy spending velocity.
   - **Yellow (`50% – 80%`):** Normal burn rate.
   - **Orange Warning (`> 80%`):** Critical warning threshold triggered. In-app alerts notify you to slow discretionary spending.
   - **Red (`> 100%`):** Budget exceeded.
4. Click **"Create Budget"** to define new spending caps for unbudgeted categories.

---

## 5. Milestone Savings Goals

Plan for major financial milestones (Emergency Fund, Laptop, Diwali Gifts, Down Payment):

1. Navigate to **Savings Goals**.
2. Click **"Create New Goal"**, specify your target amount (e.g., ₹1,50,000) and target completion date.
3. PaisaWise automatically computes your **Suggested Monthly Savings** based on months remaining.
4. **1-Click Contributions:** Click **"Contribute"** on any goal card, enter the deposit amount (e.g., ₹5,000), and confirm. The milestone bar animates to reflect your updated balance.

---

## 6. Recurring Expenses & Subscriptions

Audit and control predictable monthly overhead:

1. Navigate to **Recurring & Bills**.
2. View your **Monthly Commitment Total** (e.g., ₹25,000 House Rent, ₹3,500 Health Insurance EMI, ₹999 Broadband, ₹649 Netflix).
3. The platform projects your annualized burn so you can optimize subscriptions and never get surprised by auto-debit dates.

---

## 7. Google Sheets Cloud Synchronization

Synchronize your ledger with Google Sheets:

1. Navigate to **Google Sheets Integration** (`/sheets`).
2. Verify the connected Google Sheet URL:  
   `https://docs.google.com/spreadsheets/d/1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA/edit?gid=0#gid=0`.
3. Click **"Connect & Sync with Google Sheet"**.
4. Click **"Copy All Data for Google Sheets (Ctrl+V)"**.
5. Switch to your Google Spreadsheet tab.
6. Single-click cell **A1**.
7. Press **`Ctrl+V`** (Windows) or **`Cmd+V`** (Mac).
8. All columns (Transaction ID, Date, Type, Title, Category, Amount, Payment Method, Notes) populate cleanly with zero duplicate entries.

---

## 8. Theme Customization (Dark & Light Mode)

PaisaWise supports dynamic theme customization:

1. Click the **Theme Dropdown** in the top navigation header (or visit **Settings**).
2. Choose from curated palettes:
   - **Professional Carbon:** Sleek, high-contrast dark theme.
   - **Crimson Dusk:** Deep wine & rose dark theme.
   - **Cobalt Steel:** Midnight cyan & sapphire theme.
   - **Ember Glow:** Warm amber & obsidian theme.
   - **Mint Frost:** Clean, crisp daylight theme.
