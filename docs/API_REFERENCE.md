# REST API Reference Manual

## Base URL & Authentication

- **Production API Base:** `https://paisawise-two.vercel.app/api`
- **Local Dev Base:** `http://localhost:4000/api` (or proxied via `http://localhost:5173/api`)
- **Authentication Scheme:** `Bearer <JWT_TOKEN>` in the `Authorization` header for protected endpoints.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## 1. System Health Endpoint

### `GET /api/health`
Checks backend service availability and connectivity.

#### Response (`200 OK`)
```json
{
  "status": "ok",
  "service": "PaisaWise Backend API",
  "timestamp": "2026-10-24T12:27:40.454Z"
}
```

---

## 2. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/send-otp`
Dispatches a 6-digit expiring verification code via Gmail SMTP.

#### Request Body
```json
{
  "email": "user@example.com",
  "purpose": "email_verification"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "OTP sent to your email inbox."
}
```

---

### `POST /api/auth/register`
Creates a new user record with Bcrypt password hashing and initiates OTP verification.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "Rahul Sharma"
}
```

#### Response (`201 Created`)
```json
{
  "success": true,
  "userId": "usr-1740000000-abcd",
  "email": "user@example.com",
  "message": "Account created successfully. Please verify the OTP sent to your email."
}
```

---

### `POST /api/auth/verify-otp`
Validates the submitted 6-digit OTP code against the database.

#### Request Body
```json
{
  "email": "user@example.com",
  "otp": "482910",
  "purpose": "signup_verification"
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "usr-1740000000-abcd",
    "email": "user@example.com",
    "fullName": "Rahul Sharma",
    "emailVerified": true
  }
}
```

---

### `POST /api/auth/login`
Authenticates existing users with email and password.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### Response (`200 OK`)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "usr-1740000000-abcd",
    "email": "user@example.com",
    "fullName": "Rahul Sharma"
  }
}
```

---

## 3. Transactions Endpoints (`/api/transactions`)

### `GET /api/transactions`
Retrieves paginated, filtered transaction records for the authenticated user.

#### Query Parameters
- `startDate` (optional): `YYYY-MM-DD`
- `endDate` (optional): `YYYY-MM-DD`
- `type` (optional): `expense` | `income` | `all`
- `category` (optional): Category ID string
- `search` (optional): Text query matching title or notes

#### Response (`200 OK`)
```json
[
  {
    "id": "txn-1740000100",
    "user_id": "usr-1740000000-abcd",
    "category_id": "cat-groceries",
    "type": "expense",
    "amount": 2450.00,
    "currency": "INR",
    "title": "Reliance Smart Supermarket",
    "payment_method": "UPI",
    "transaction_date": "2026-10-24",
    "notes": "Weekly groceries",
    "created_at": "2026-10-24T10:30:00.000Z"
  }
]
```

---

### `POST /api/transactions`
Logs a new transaction with decimal precision.

#### Request Body
```json
{
  "type": "expense",
  "amount": 2450.00,
  "currency": "INR",
  "title": "Reliance Smart Supermarket",
  "category_id": "cat-groceries",
  "payment_method": "UPI",
  "transaction_date": "2026-10-24",
  "notes": "Weekly groceries"
}
```

#### Response (`201 Created`)
```json
{
  "id": "txn-1740000100",
  "title": "Reliance Smart Supermarket",
  "amount": 2450.00,
  "status": "created"
}
```

---

### `DELETE /api/transactions/:id`
Deletes a specific transaction by ID.

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Transaction deleted successfully."
}
```

---

## 4. Budgets Endpoints (`/api/budgets`)

### `GET /api/budgets`
Fetches all category budgets and computes real-time utilization.

#### Response (`200 OK`)
```json
[
  {
    "id": "bgt-1",
    "category_id": "cat-groceries",
    "monthly_limit": 15000.00,
    "current_spent": 8450.00,
    "percentage_used": 56.33,
    "warning_threshold_triggered": false
  }
]
```

---

### `POST /api/budgets`
Creates or updates a category budget limit.

#### Request Body
```json
{
  "category_id": "cat-dining",
  "monthly_limit": 8000.00
}
```

---

## 5. Savings Goals Endpoints (`/api/goals`)

### `GET /api/goals`
Retrieves all milestone savings goals with deadline calculations.

#### Response (`200 OK`)
```json
[
  {
    "id": "goal-1",
    "name": "Emergency Fund (6 Months)",
    "target_amount": 150000.00,
    "current_amount": 65000.00,
    "target_date": "2027-04-30",
    "status": "in_progress",
    "suggested_monthly_savings": 14166.67
  }
]
```

---

### `POST /api/goals/:id/contribute`
Deposits funds into a specific savings goal.

#### Request Body
```json
{
  "amount": 5000.00
}
```

#### Response (`200 OK`)
```json
{
  "success": true,
  "new_balance": 70000.00,
  "percentage_achieved": 46.67
}
```

---

## 6. Google Sheets Endpoints (`/api/sheets-connection`)

### `GET /api/sheets-connection`
Retrieves the user's active Google Sheets connection metadata.

#### Response (`200 OK`)
```json
{
  "connected": true,
  "spreadsheet_id": "1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA",
  "spreadsheet_name": "PaisaWise Financial Ledger",
  "selected_sheet_name": "PaisaWise_Transactions",
  "last_sync_at": "2026-10-24T10:39:15.000Z",
  "row_count": 12
}
```

---

### `POST /api/sheets-connection`
Saves or updates a Google Sheet connection URL or ID.

#### Request Body
```json
{
  "spreadsheet_id": "1hgC9wdhGU68c7xdxBdltEFrBEJtXS2F1MCNJawKQ2lA",
  "spreadsheet_name": "PaisaWise Financial Ledger"
}
```
