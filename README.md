# Phone Store Inventory Management System

A full-stack phone store management platform with:
- Admin/Staff dashboard for inventory, sales, stock alerts, reporting, and settings
- Customer shopping flow (products, cart, checkout, receipt)
- Customer accounts for purchase history and receipt downloads
- PHP REST-style API + MySQL backend
- React + TypeScript frontend

## Features

### Admin/Staff
- JWT-based login/signup (`/api/auth/*`)
- Product management (CRUD)
- POS sales (multi-product)
- Sales history and receipt printing
- Dashboard KPIs:
  - Total inventory value
  - Expected profit
  - Profit earned from completed sales
- Stock alerts with dashboard preview
- Reports with PDF export (Sales or Inventory active tab only)

### Customer
- Product browsing and product details
- Cart + checkout (guest checkout supported)
- Paystack payment initialization placeholder
- E-receipt view + print/download
- Customer account auth (`/api/customer-auth/*`)
- Purchase history with receipt download (`/api/customer/orders*`)
- Legacy guest orders linked by customer email after login

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query
- PDF: `jspdf`, `jspdf-autotable`
- Backend: PHP (XAMPP/cPanel friendly), MySQL, custom JWT helper

## Project Structure

```text
.
├─ src/                    # React frontend
│  ├─ pages/               # Admin + customer pages
│  ├─ services/api.ts      # API integration layer
│  ├─ contexts/            # Auth providers (admin/staff + customer)
│  └─ components/          # Shared UI and layouts
├─ api/                    # PHP API
│  ├─ auth/                # Admin/staff auth endpoints
│  ├─ customer-auth/       # Customer auth endpoints
│  ├─ customer/orders/     # Customer order history + receipt endpoints
│  ├─ products/            # Product endpoints + stock alerts + IMEI
│  ├─ sales/               # Sales/POS endpoints
│  ├─ reports/             # Report endpoints
│  ├─ dashboard/           # Dashboard summary + activity
│  ├─ payments/            # Paystack initialize placeholder
│  ├─ orders/              # Checkout order create/fetch
│  └─ database/            # SQL schema + extensions + seed
└─ README.md
```

## Prerequisites

- Node.js 18+ and npm
- PHP 8.0+
- MySQL 8+ (or MariaDB equivalent)
- XAMPP/WAMP/LAMP (recommended for local PHP/MySQL)

## Local Setup

## 1) Clone and Install

```bash
git clone <your-repo-url>
cd shop-inventory-system
npm install
```

## 2) Configure Database Connection

Update `api/config/database.php` if needed:
- host
- db_name
- username
- password

Default values are:
- host: `localhost`
- db_name: `phone_inventory`
- username: `root`
- password: empty

## 3) Create and Seed Database

Run the SQL files in this order:
1. `api/database/schema.sql`
2. `api/database/schema_extensions.sql`
3. `api/database/seed_from_mock_data.sql` (optional sample data import)

Example with XAMPP MySQL (Windows):

```powershell
& 'C:\xampp\mysql\bin\mysql.exe' -u root -e "source C:/path/to/shop-inventory-system/api/database/schema.sql"
& 'C:\xampp\mysql\bin\mysql.exe' -u root -D phone_inventory -e "source C:/path/to/shop-inventory-system/api/database/schema_extensions.sql"
& 'C:\xampp\mysql\bin\mysql.exe' -u root -D phone_inventory -e "source C:/path/to/shop-inventory-system/api/database/seed_from_mock_data.sql"
```

## 4) Serve API from Apache

Place/serve project so API is available under:

`http://localhost/phone-inventory-api/api`

If your base path differs, update `API_BASE_URL` in `src/services/api.ts`.

## 5) Run Frontend

```bash
npm run dev
```

Vite runs on:
- `http://localhost:8080`

Build production frontend:

```bash
npm run build
```

## API Endpoints (Current)

### Admin/Staff Auth
- `POST /api/auth/login.php`
- `POST /api/auth/signup.php`
- `POST /api/auth/forgot-password.php`

### Products / Sales / Reports
- `GET|POST|PUT|DELETE /api/products/index.php`
- `GET /api/products/low-stock.php`
- `GET /api/products/imeis.php`
- `GET|POST /api/sales/index.php`
- `GET /api/reports/index.php`
- `GET /api/dashboard/summary.php`
- `GET /api/dashboard/activity.php`

### Customer Checkout / Payments
- `POST /api/orders/index.php`
- `GET /api/orders/index.php?receipt_number=...`
- `POST /api/payments/initialize.php`

### Customer Accounts + History
- `POST /api/customer-auth/signup.php`
- `POST /api/customer-auth/login.php`
- `GET /api/customer-auth/me.php`
- `GET /api/customer/orders.php`
- `GET /api/customer/orders/receipt.php?receipt_number=...`

## Auth Model

- Admin/staff and customer accounts are separate.
- Admin/staff tokens use `/api/auth/*`.
- Customer tokens use `/api/customer-auth/*`.
- Customer history/receipt endpoints require a customer JWT.
- Guest checkout remains enabled.

## Frontend Routes

### Admin/Staff
- `/login`
- `/dashboard`
- `/products`
- `/sales`
- `/sales-history`
- `/alerts`
- `/reports`
- `/settings`

### Customer
- `/shop/products`
- `/shop/products/:id`
- `/shop/cart`
- `/shop/checkout`
- `/shop/receipt/:receiptNumber`
- `/shop/login`
- `/shop/signup`
- `/shop/history`

## Reports PDF Export

Reports page export supports:
- Active tab only (`Sales` or `Inventory`)
- Timestamp
- Current period/filter context
- KPI summary values
- Tab-specific tables
- No-data fallback text in generated PDF

Generated file names:
- `report-sales-{period}-YYYY-MM-DD.pdf`
- `report-inventory-YYYY-MM-DD.pdf`

## Security Notes

- Change JWT secret in `api/config/jwt.php` before production.
- Restrict CORS in `api/config/cors.php` for production domains.
- Enforce HTTPS in production.
- Use strong database credentials.

## Troubleshooting

- `Invalid or expired token`
  - Re-login and ensure the correct auth flow (admin vs customer).
- API 404/500
  - Verify Apache path and that `api/` is correctly served.
  - Check PHP/Apache logs.
- Database errors
  - Re-run SQL files in the documented order.
  - Confirm `phone_inventory` exists and credentials are correct.
- Frontend can’t reach backend
  - Confirm `API_BASE_URL` in `src/services/api.ts`.

## License

This project is for academic/final-year and internal business use unless otherwise specified by the repository owner.

developed by saidu usman abullahi