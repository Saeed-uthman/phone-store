# Phone Store Inventory - PHP API Setup Guide

Complete guide for setting up the PHP/MySQL backend locally with XAMPP and deploying to cPanel.

---

## Table of Contents
1. [Local Development Setup (XAMPP)](#local-development-setup-xampp)
2. [Database Setup](#database-setup)
3. [Testing the API](#testing-the-api)
4. [Connecting React Frontend](#connecting-react-frontend)
5. [cPanel Deployment](#cpanel-deployment)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Troubleshooting](#troubleshooting)

---

## Local Development Setup (XAMPP)

### Step 1: Install XAMPP

1. Download XAMPP from [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. Install XAMPP (recommended path: `C:\xampp` on Windows or `/Applications/XAMPP` on Mac)
3. During installation, ensure these components are selected:
   - Apache
   - MySQL
   - PHP
   - phpMyAdmin

### Step 2: Start XAMPP Services

1. Open XAMPP Control Panel
2. Start **Apache** (click "Start" button)
3. Start **MySQL** (click "Start" button)
4. Both should show green "Running" status

### Step 3: Copy API Files

1. Navigate to XAMPP's web directory:
   - **Windows:** `C:\xampp\htdocs\`
   - **Mac:** `/Applications/XAMPP/htdocs/`
   - **Linux:** `/opt/lampp/htdocs/`

2. Create a new folder called `phone-inventory-api`

3. Copy the entire `api` folder from this project into it:
   ```
   htdocs/
   └── phone-inventory-api/
       └── api/
           ├── config/
           ├── models/
           ├── auth/
           ├── products/
           ├── sales/
           ├── reports/
           ├── database/
           └── .htaccess
   ```

### Step 4: Configure PHP (if needed)

1. Open `C:\xampp\php\php.ini`
2. Ensure these extensions are enabled (remove `;` if present):
   ```ini
   extension=pdo_mysql
   extension=openssl
   extension=mbstring
   ```
3. Restart Apache after changes

---

## Database Setup

### Step 1: Open phpMyAdmin

1. Open your browser
2. Go to: `http://localhost/phpmyadmin`

### Step 2: Create Database

**Option A: Using SQL Script (Recommended)**

1. Click "SQL" tab at the top
2. Copy the entire contents of `api/database/schema.sql`
3. Paste into the SQL query box
4. Click "Go" to execute

**Option B: Manual Creation**

1. Click "New" in the left sidebar
2. Database name: `phone_inventory`
3. Collation: `utf8mb4_unicode_ci`
4. Click "Create"
5. Then run the schema.sql script

### Step 3: Verify Database

After setup, you should see these tables:
- `users` (with 1 admin user)
- `products` (with 20 sample products)
- `sales` (with 3 sample sales)
- `sale_items`
- `password_resets`

### Default Admin Credentials
- **Username:** `admin`
- **Password:** `admin123`

⚠️ **Change this password in production!**

---

## Testing the API

### Using Browser (GET requests only)

Test if API is working:
```
http://localhost/phone-inventory-api/api/auth/login.php
```
Should return: `{"success":false,"message":"Method not allowed"}`

### Using cURL (Command Line)

**Login:**
```bash
curl -X POST http://localhost/phone-inventory-api/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Get Products (with token):**
```bash
curl http://localhost/phone-inventory-api/api/products/index.php \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Download Postman from [https://www.postman.com/downloads/](https://www.postman.com/downloads/)

2. **Login Request:**
   - Method: `POST`
   - URL: `http://localhost/phone-inventory-api/api/auth/login.php`
   - Body (JSON):
     ```json
     {
       "username": "admin",
       "password": "admin123"
     }
     ```
   - Copy the `token` from response

3. **Get Products Request:**
   - Method: `GET`
   - URL: `http://localhost/phone-inventory-api/api/products/index.php`
   - Headers: `Authorization: Bearer <your-token>`

### Using VS Code REST Client

Create a file `test.http`:
```http
### Login
POST http://localhost/phone-inventory-api/api/auth/login.php
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

### Get Products
GET http://localhost/phone-inventory-api/api/products/index.php
Authorization: Bearer <paste-token-here>
```

---

## Connecting React Frontend

### Step 1: Update API Base URL

Edit `src/services/api.ts`:

```typescript
// For local development with XAMPP
const API_BASE_URL = 'http://localhost/phone-inventory-api/api';

// For production (update with your domain)
// const API_BASE_URL = 'https://yourdomain.com/api';
```

### Step 2: Update Auth API Calls

```typescript
// In src/services/api.ts

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },
  
  signup: async (credentials: SignupCredentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  }
};
```

### Step 3: Handle CORS

The API already includes CORS headers. If you still have issues:

1. Make sure Apache is configured to allow CORS
2. Or use a proxy in Vite:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost/phone-inventory-api',
        changeOrigin: true,
      }
    }
  }
});
```

---

## cPanel Deployment

### Step 1: Prepare Files

1. Zip the entire `api` folder
2. Download the zip file

### Step 2: Upload to cPanel

1. Login to your cPanel
2. Open **File Manager**
3. Navigate to `public_html` (or your subdomain folder)
4. Create folder `api` (or upload to root for `/api` endpoints)
5. Click "Upload" and upload the zip file
6. Right-click the zip → "Extract"

### Step 3: Create MySQL Database

1. In cPanel, go to **MySQL Databases**
2. Create new database: `yourusername_phone_inventory`
3. Create new user with strong password
4. Add user to database with ALL PRIVILEGES

### Step 4: Update Database Configuration

Edit `api/config/database.php` on server:

```php
private $host = "localhost";
private $db_name = "yourusername_phone_inventory";  // cPanel prefixes username
private $username = "yourusername_dbuser";          // cPanel prefixes username
private $password = "your_secure_password";
```

### Step 5: Import Database Schema

1. Go to **phpMyAdmin** in cPanel
2. Select your database
3. Click "Import" tab
4. Upload `schema.sql`
5. Click "Go"

### Step 6: Update JWT Secret

Edit `api/config/jwt.php`:
```php
private static $secret_key = "generate_a_long_random_string_here_for_production";
```

Generate a secure key:
```bash
openssl rand -hex 32
```

### Step 7: Set File Permissions

In File Manager, set permissions:
- `api/` folder: 755
- All PHP files: 644
- `.htaccess`: 644

### Step 8: Test Deployment

```bash
curl -X POST https://yourdomain.com/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## API Endpoints Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login.php` | User login |
| POST | `/api/auth/signup.php` | User registration |
| POST | `/api/auth/forgot-password.php` | Request password reset |

### Products (requires auth token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/index.php` | List all products |
| GET | `/api/products/index.php?id=1` | Get single product |
| POST | `/api/products/index.php` | Create product |
| PUT | `/api/products/index.php?id=1` | Update product |
| DELETE | `/api/products/index.php?id=1` | Delete product |
| GET | `/api/products/low-stock.php` | Get low stock products |

### Sales (requires auth token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales/index.php` | List all sales |
| GET | `/api/sales/index.php?id=1` | Get single sale |
| POST | `/api/sales/index.php` | Create new sale |
| PUT | `/api/sales/index.php?id=1` | Update sale status |

### Reports (requires auth token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/index.php?type=summary` | Sales summary |
| GET | `/api/reports/index.php?type=daily` | Daily sales chart data |
| GET | `/api/reports/index.php?type=products` | Top selling products |
| GET | `/api/reports/index.php?type=categories` | Sales by category |

---

## Troubleshooting

### Common Issues

**1. "Access denied" database error**
- Check database credentials in `config/database.php`
- Ensure MySQL user has proper privileges
- On cPanel, username is prefixed: `cpanelusername_dbuser`

**2. CORS errors in browser**
- Verify `config/cors.php` is included in all endpoints
- Check Apache mod_headers is enabled
- Try adding to `.htaccess`:
  ```
  Header set Access-Control-Allow-Origin "*"
  ```

**3. 500 Internal Server Error**
- Check PHP error logs:
  - XAMPP: `C:\xampp\apache\logs\error.log`
  - cPanel: Error Logs in cPanel
- Enable error display temporarily:
  ```php
  ini_set('display_errors', 1);
  error_reporting(E_ALL);
  ```

**4. "Class not found" errors**
- Check file paths in `require_once` statements
- Ensure all files were uploaded
- Check file permissions

**5. Token not working**
- Ensure Authorization header is being sent
- Check token hasn't expired (24 hours default)
- Verify JWT secret matches

**6. .htaccess not working**
- Enable mod_rewrite: `sudo a2enmod rewrite`
- Check AllowOverride is set to All in Apache config
- Restart Apache

### Debug Mode

Add to any PHP file for debugging:
```php
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Your code here
```

---

## Security Checklist for Production

- [ ] Change default admin password
- [ ] Update JWT secret key
- [ ] Disable PHP error display
- [ ] Use HTTPS only
- [ ] Set secure file permissions
- [ ] Remove sample data
- [ ] Enable rate limiting
- [ ] Add input sanitization
- [ ] Use prepared statements (already implemented)
- [ ] Implement password reset email

---

## Need Help?

1. Check Apache/PHP error logs
2. Test endpoints with Postman
3. Verify database connection
4. Check CORS configuration
