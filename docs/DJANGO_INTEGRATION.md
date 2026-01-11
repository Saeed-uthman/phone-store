# Django REST Framework Integration Guide

## Phone Store Inventory Management System

This document provides comprehensive guidance for integrating the React frontend with a Django REST Framework (DRF) backend. The frontend is designed as an API-ready application that can seamlessly connect to Django without refactoring.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Django Project Setup](#django-project-setup)
3. [Database Models](#database-models)
4. [Serializers](#serializers)
5. [API Endpoints](#api-endpoints)
6. [Authentication](#authentication)
7. [Frontend API Service](#frontend-api-service)
8. [CORS Configuration](#cors-configuration)
9. [Environment Variables](#environment-variables)
10. [Deployment Considerations](#deployment-considerations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │  Components │  │    Services (api.ts)    │  │
│  │ - Dashboard │  │ - Receipt   │  │  - authApi              │  │
│  │ - Products  │  │ - Sidebar   │  │  - productsApi          │  │
│  │ - Sales     │  │ - Forms     │  │  - salesApi             │  │
│  │ - Reports   │  │             │  │  - suppliersApi         │  │
│  └─────────────┘  └─────────────┘  │  - dashboardApi         │  │
│                                     │  - reportsApi           │  │
│                                     │  - alertsApi            │  │
│                                     └───────────┬─────────────┘  │
└───────────────────────────────────────────────────────────────────┘
                                                  │
                                                  │ HTTP/HTTPS
                                                  │ REST API
                                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Django DRF)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Views    │  │ Serializers │  │        Models           │  │
│  │ - AuthView  │  │             │  │  - User                 │  │
│  │ - Product   │  │             │  │  - Product              │  │
│  │ - Sale      │  │             │  │  - IMEI                 │  │
│  │ - Supplier  │  │             │  │  - Sale / SaleItem      │  │
│  │ - Report    │  │             │  │  - Supplier             │  │
│  └─────────────┘  └─────────────┘  │  - Activity             │  │
│                                     └─────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  MySQL Database (XAMPP)                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

---

## XAMPP MySQL Setup

Before setting up Django, you need to configure MySQL in XAMPP:

### 1. Install and Start XAMPP

1. Download XAMPP from [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. Install XAMPP with MySQL/MariaDB component
3. Open XAMPP Control Panel
4. Start **Apache** and **MySQL** services

### 2. Create the Database

1. Open phpMyAdmin: [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
2. Click **"New"** in the left sidebar
3. Enter database name: `phonestore_db`
4. Select collation: `utf8mb4_general_ci`
5. Click **"Create"**

### 3. Configure MySQL User (Optional but Recommended)

For production, create a dedicated user instead of using root:

```sql
-- Run in phpMyAdmin SQL tab
CREATE USER 'phonestore_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON phonestore_db.* TO 'phonestore_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Install MySQL Client for Python

**Windows:**
```bash
# Option 1: Install mysqlclient (requires Visual C++ Build Tools)
pip install mysqlclient

# Option 2: Use PyMySQL as alternative (easier installation)
pip install pymysql
```

If using PyMySQL, add this to `phonestore_backend/__init__.py`:
```python
import pymysql
pymysql.install_as_MySQLdb()
```

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install python3-dev default-libmysqlclient-dev build-essential
pip install mysqlclient

# Mac (with Homebrew)
brew install mysql-client pkg-config
export PKG_CONFIG_PATH="/usr/local/opt/mysql-client/lib/pkgconfig"
pip install mysqlclient
```

---

## Django Project Setup

### 1. Create Django Project

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers mysqlclient python-decouple

# Create project and app
django-admin startproject phonestore_backend
cd phonestore_backend
python manage.py startapp inventory
python manage.py startapp authentication
```

### 2. Project Structure

```
phonestore_backend/
├── phonestore_backend/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── authentication/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── inventory/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
└── manage.py
```

### 3. Settings Configuration

```python
# phonestore_backend/settings.py

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    # Local apps
    'authentication',
    'inventory',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be first
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=12),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Database (MySQL via XAMPP)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'phonestore_db',
        'USER': 'root',                    # Default XAMPP MySQL user
        'PASSWORD': '',                     # Default XAMPP MySQL has no password
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
    }
}

# Note: Before running migrations, create the database in XAMPP phpMyAdmin:
# 1. Open http://localhost/phpmyadmin
# 2. Click "New" to create a new database
# 3. Enter "phonestore_db" as the database name
# 4. Select "utf8mb4_general_ci" as the collation
# 5. Click "Create"
```

---

## Database Models

### User Model (authentication/models.py)

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('SALES_ATTENDANT', 'Sales Attendant'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='SALES_ATTENDANT')
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.username} ({self.role})"
```

### Inventory Models (inventory/models.py)

```python
from django.db import models
from django.conf import settings
from django.utils import timezone

class Supplier(models.Model):
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'suppliers'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('Phone', 'Phone'),
        ('Accessory', 'Accessory'),
        ('Charger', 'Charger'),
        ('Cable', 'Cable'),
        ('Case', 'Case'),
        ('Screen Protector', 'Screen Protector'),
    ]
    
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=0)
    cost_price = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.brand} {self.model}"
    
    @property
    def is_low_stock(self):
        return self.quantity <= self.low_stock_threshold
    
    @property
    def is_out_of_stock(self):
        return self.quantity == 0


class IMEI(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='imeis')
    imei_number = models.CharField(max_length=20, unique=True)
    is_sold = models.BooleanField(default=False)
    sold_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'imeis'
        verbose_name = 'IMEI'
        verbose_name_plural = 'IMEIs'
    
    def __str__(self):
        return self.imei_number
    
    def mark_as_sold(self):
        self.is_sold = True
        self.sold_at = timezone.now()
        self.save()


class Sale(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('transfer', 'Bank Transfer'),
    ]
    
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    customer_name = models.CharField(max_length=200, blank=True, null=True)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sales')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'sales'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Sale #{self.id} - {self.total_amount}"


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='sale_items')
    imei = models.ForeignKey(IMEI, on_delete=models.SET_NULL, null=True, blank=True, related_name='sale_item')
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    class Meta:
        db_table = 'sale_items'
    
    def __str__(self):
        return f"{self.product} x {self.quantity}"


class Activity(models.Model):
    TYPE_CHOICES = [
        ('sale', 'Sale'),
        ('stock_update', 'Stock Update'),
        ('low_stock', 'Low Stock Alert'),
        ('new_product', 'New Product'),
    ]
    
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    message = models.TextField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='activities')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'activities'
        ordering = ['-created_at']
        verbose_name_plural = 'Activities'
    
    def __str__(self):
        return f"{self.type}: {self.message[:50]}"
```

---

## Serializers

### Authentication Serializers (authentication/serializers.py)

```python
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone']
        read_only_fields = ['id']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user data to response (matching frontend User type)
        data['id'] = self.user.id
        data['username'] = self.user.username
        data['email'] = self.user.email
        data['role'] = self.user.role
        data['token'] = data['access']  # Frontend expects 'token' field
        
        return data


class LoginResponseSerializer(serializers.Serializer):
    """Response format expected by frontend"""
    data = UserSerializer()
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(default='Login successful')
```

### Inventory Serializers (inventory/serializers.py)

```python
from rest_framework import serializers
from .models import Product, IMEI, Supplier, Sale, SaleItem, Activity

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'phone', 'email', 'address', 'created_at']
        read_only_fields = ['id', 'created_at']


class IMEISerializer(serializers.ModelSerializer):
    class Meta:
        model = IMEI
        fields = ['id', 'product_id', 'imei_number', 'is_sold', 'sold_at']
        read_only_fields = ['id', 'sold_at']


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'category', 'brand', 'model', 'quantity',
            'cost_price', 'selling_price', 'low_stock_threshold',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductDetailSerializer(ProductSerializer):
    imeis = IMEISerializer(many=True, read_only=True)
    available_imeis_count = serializers.SerializerMethodField()
    
    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ['imeis', 'available_imeis_count']
    
    def get_available_imeis_count(self, obj):
        return obj.imeis.filter(is_sold=False).count()


class SaleItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    imei = IMEISerializer(read_only=True)
    
    class Meta:
        model = SaleItem
        fields = ['product_id', 'product', 'quantity', 'imei_id', 'imei', 'unit_price', 'total_price']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Sale
        fields = [
            'id', 'items', 'total_amount', 'payment_method',
            'customer_name', 'customer_phone', 'created_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'created_by']


class SaleItemCreateSerializer(serializers.Serializer):
    """For creating sale items"""
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    imei_id = serializers.IntegerField(required=False, allow_null=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2)


class SaleCreateSerializer(serializers.Serializer):
    """Matches frontend SalePayload type"""
    items = SaleItemCreateSerializer(many=True)
    payment_method = serializers.ChoiceField(choices=['cash', 'card', 'transfer'])
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    customer_name = serializers.CharField(required=False, allow_blank=True)
    customer_phone = serializers.CharField(required=False, allow_blank=True)


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'type', 'message', 'created_at']


class DashboardStatsSerializer(serializers.Serializer):
    """Matches frontend DashboardStats type"""
    total_products = serializers.IntegerField()
    low_stock_count = serializers.IntegerField()
    today_sales = serializers.IntegerField()
    today_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    inventory_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    weekly_sales = serializers.ListField(child=serializers.IntegerField())
    monthly_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)


class StockAlertSerializer(serializers.Serializer):
    """Matches frontend StockAlert type"""
    product = ProductSerializer()
    current_stock = serializers.IntegerField()
    threshold = serializers.IntegerField()
    urgency = serializers.ChoiceField(choices=['critical', 'warning', 'low'])
```

---

## API Endpoints

### URL Configuration

```python
# phonestore_backend/urls.py

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include([
        path('auth/', include('authentication.urls')),
        path('', include('inventory.urls')),
    ])),
]
```

```python
# authentication/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('signup/', views.SignupView.as_view(), name='signup'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('me/', views.CurrentUserView.as_view(), name='current-user'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset-password'),
]
```

```python
# inventory/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Products
    path('products/', views.ProductListCreateView.as_view(), name='product-list'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/<int:pk>/imeis/', views.ProductIMEIListView.as_view(), name='product-imeis'),
    path('products/<int:pk>/imeis/available/', views.ProductAvailableIMEIListView.as_view(), name='product-available-imeis'),
    
    # Suppliers
    path('suppliers/', views.SupplierListCreateView.as_view(), name='supplier-list'),
    path('suppliers/<int:pk>/', views.SupplierDetailView.as_view(), name='supplier-detail'),
    
    # Sales
    path('sales/', views.SaleListCreateView.as_view(), name='sale-list'),
    path('sales/<int:pk>/', views.SaleDetailView.as_view(), name='sale-detail'),
    path('sales/today/', views.TodaySalesView.as_view(), name='today-sales'),
    
    # Dashboard
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/activity/', views.RecentActivityView.as_view(), name='recent-activity'),
    
    # Reports
    path('reports/sales/', views.SalesReportView.as_view(), name='sales-report'),
    path('reports/stock/', views.StockReportView.as_view(), name='stock-report'),
    
    # Alerts
    path('alerts/low-stock/', views.LowStockAlertsView.as_view(), name='low-stock-alerts'),
]
```

### Complete API Endpoint Reference

| Endpoint | Method | Description | Auth Required | Admin Only |
|----------|--------|-------------|---------------|------------|
| `/api/auth/login/` | POST | User login | No | No |
| `/api/auth/signup/` | POST | User registration | No | No |
| `/api/auth/logout/` | POST | User logout | Yes | No |
| `/api/auth/me/` | GET | Get current user | Yes | No |
| `/api/auth/refresh/` | POST | Refresh JWT token | Yes | No |
| `/api/auth/forgot-password/` | POST | Request password reset email | No | No |
| `/api/auth/reset-password/` | POST | Reset password with token | No | No |
| `/api/products/` | GET | List all products | Yes | No |
| `/api/products/` | POST | Create product | Yes | Yes |
| `/api/products/<id>/` | GET | Get product details | Yes | No |
| `/api/products/<id>/` | PUT/PATCH | Update product | Yes | Yes |
| `/api/products/<id>/` | DELETE | Delete product | Yes | Yes |
| `/api/products/<id>/imeis/` | GET | List product IMEIs | Yes | No |
| `/api/products/<id>/imeis/available/` | GET | List available IMEIs | Yes | No |
| `/api/suppliers/` | GET | List all suppliers | Yes | No |
| `/api/suppliers/` | POST | Create supplier | Yes | Yes |
| `/api/suppliers/<id>/` | GET/PUT/DELETE | Manage supplier | Yes | Yes |
| `/api/sales/` | GET | List all sales | Yes | No |
| `/api/sales/` | POST | Create new sale | Yes | No |
| `/api/sales/<id>/` | GET | Get sale details | Yes | No |
| `/api/sales/today/` | GET | Get today's sales | Yes | No |
| `/api/dashboard/stats/` | GET | Dashboard statistics | Yes | No |
| `/api/dashboard/activity/` | GET | Recent activity | Yes | No |
| `/api/reports/sales/` | GET | Sales report | Yes | Yes |
| `/api/reports/stock/` | GET | Stock report | Yes | Yes |
| `/api/alerts/low-stock/` | GET | Low stock alerts | Yes | No |

---

## Views Implementation

### Authentication Views (authentication/views.py)

```python
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import CustomTokenObtainPairSerializer, UserSerializer

class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    
    Request Body:
    {
        "username": "admin",
        "password": "password123"
    }
    
    Response:
    {
        "data": {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "role": "ADMIN",
            "token": "eyJ0eXAiOiJKV1QiLCJhbGciOi..."
        },
        "success": true,
        "message": "Login successful"
    }
    """
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({
                'data': None,
                'success': False,
                'message': 'Invalid username or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response({
            'data': serializer.validated_data,
            'success': True,
            'message': 'Login successful'
        })


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    
    Response:
    {
        "data": null,
        "success": true,
        "message": "Logged out successfully"
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass
        
        return Response({
            'data': None,
            'success': True,
            'message': 'Logged out successfully'
        })


class CurrentUserView(APIView):
    """
    GET /api/auth/me/
    
    Response:
    {
        "data": {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "role": "ADMIN"
        },
        "success": true
    }
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            'data': serializer.data,
            'success': True
        })


class SignupView(APIView):
    """
    POST /api/auth/signup/
    
    Request Body:
    {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "securepassword123"
    }
    
    Response:
    {
        "data": {
            "id": 2,
            "username": "newuser",
            "email": "newuser@example.com",
            "role": "SALES_ATTENDANT"
        },
        "success": true,
        "message": "Account created successfully"
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        
        # Validation
        if not username or not email or not password:
            return Response({
                'data': None,
                'success': False,
                'message': 'Username, email, and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(password) < 6:
            return Response({
                'data': None,
                'success': False,
                'message': 'Password must be at least 6 characters'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username exists
        if User.objects.filter(username=username).exists():
            return Response({
                'data': None,
                'success': False,
                'message': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email exists
        if User.objects.filter(email=email).exists():
            return Response({
                'data': None,
                'success': False,
                'message': 'Email already registered'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role='SALES_ATTENDANT'  # Default role for new signups
        )
        
        serializer = UserSerializer(user)
        return Response({
            'data': serializer.data,
            'success': True,
            'message': 'Account created successfully'
        }, status=status.HTTP_201_CREATED)


class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    
    Request Body:
    {
        "email": "user@example.com"
    }
    
    Response:
    {
        "data": null,
        "success": true,
        "message": "Password reset instructions sent to your email"
    }
    
    Note: For security, always return success even if email doesn't exist
    to prevent email enumeration attacks.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        from django.contrib.auth import get_user_model
        from django.core.mail import send_mail
        from django.conf import settings
        import secrets
        
        User = get_user_model()
        email = request.data.get('email')
        
        if not email:
            return Response({
                'data': None,
                'success': False,
                'message': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            # Generate reset token
            reset_token = secrets.token_urlsafe(32)
            
            # Store token (you should create a PasswordResetToken model)
            # PasswordResetToken.objects.create(
            #     user=user,
            #     token=reset_token,
            #     expires_at=timezone.now() + timedelta(hours=24)
            # )
            
            # Send email
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
            send_mail(
                subject='Password Reset Request - Phone Store',
                message=f'Click here to reset your password: {reset_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except User.DoesNotExist:
            # Don't reveal that email doesn't exist
            pass
        
        # Always return success for security
        return Response({
            'data': None,
            'success': True,
            'message': 'Password reset instructions sent to your email'
        })


class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    
    Request Body:
    {
        "token": "reset_token_from_email",
        "new_password": "newsecurepassword123"
    }
    
    Response:
    {
        "data": null,
        "success": true,
        "message": "Password reset successfully"
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not token or not new_password:
            return Response({
                'data': None,
                'success': False,
                'message': 'Token and new password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(new_password) < 6:
            return Response({
                'data': None,
                'success': False,
                'message': 'Password must be at least 6 characters'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate token (you should implement PasswordResetToken model)
        # try:
        #     reset_token = PasswordResetToken.objects.get(
        #         token=token,
        #         expires_at__gt=timezone.now(),
        #         is_used=False
        #     )
        #     user = reset_token.user
        #     user.set_password(new_password)
        #     user.save()
        #     reset_token.is_used = True
        #     reset_token.save()
        # except PasswordResetToken.DoesNotExist:
        #     return Response({
        #         'data': None,
        #         'success': False,
        #         'message': 'Invalid or expired reset token'
        #     }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'data': None,
            'success': True,
            'message': 'Password reset successfully'
        })
```

### Inventory Views (inventory/views.py)

```python
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta
from .models import Product, IMEI, Supplier, Sale, SaleItem, Activity
from .serializers import (
    ProductSerializer, ProductDetailSerializer, IMEISerializer,
    SupplierSerializer, SaleSerializer, SaleCreateSerializer,
    ActivitySerializer, DashboardStatsSerializer
)
from .permissions import IsAdminUser

# ========== PRODUCTS ==========

class ProductListCreateView(generics.ListCreateAPIView):
    """
    GET /api/products/
    POST /api/products/ (Admin only)
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'data': serializer.data,
            'success': True
        })
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        
        # Log activity
        Activity.objects.create(
            type='new_product',
            message=f'New product added: {product.brand} {product.model}',
            user=request.user
        )
        
        return Response({
            'data': serializer.data,
            'success': True,
            'message': 'Product created successfully'
        }, status=status.HTTP_201_CREATED)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/products/<id>/
    PUT/PATCH /api/products/<id>/ (Admin only)
    DELETE /api/products/<id>/ (Admin only)
    """
    queryset = Product.objects.all()
    serializer_class = ProductDetailSerializer
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'data': serializer.data,
            'success': True
        })
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'data': serializer.data,
            'success': True,
            'message': 'Product updated successfully'
        })
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'data': None,
            'success': True,
            'message': 'Product deleted successfully'
        })


class ProductIMEIListView(generics.ListAPIView):
    """GET /api/products/<id>/imeis/"""
    serializer_class = IMEISerializer
    
    def get_queryset(self):
        product_id = self.kwargs['pk']
        return IMEI.objects.filter(product_id=product_id)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'data': serializer.data,
            'success': True
        })


class ProductAvailableIMEIListView(generics.ListAPIView):
    """GET /api/products/<id>/imeis/available/"""
    serializer_class = IMEISerializer
    
    def get_queryset(self):
        product_id = self.kwargs['pk']
        return IMEI.objects.filter(product_id=product_id, is_sold=False)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'data': serializer.data,
            'success': True
        })


# ========== SUPPLIERS ==========

class SupplierListCreateView(generics.ListCreateAPIView):
    """
    GET /api/suppliers/
    POST /api/suppliers/ (Admin only)
    """
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'data': serializer.data,
            'success': True
        })
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'data': serializer.data,
            'success': True,
            'message': 'Supplier created successfully'
        }, status=status.HTTP_201_CREATED)


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/suppliers/<id>/
    PUT/PATCH /api/suppliers/<id>/ (Admin only)
    DELETE /api/suppliers/<id>/ (Admin only)
    """
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]


# ========== SALES ==========

class SaleListCreateView(generics.ListCreateAPIView):
    """
    GET /api/sales/
    POST /api/sales/
    """
    queryset = Sale.objects.prefetch_related('items__product', 'items__imei')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SaleCreateSerializer
        return SaleSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = SaleSerializer(queryset, many=True)
        return Response({
            'data': serializer.data,
            'success': True
        })
    
    def create(self, request, *args, **kwargs):
        serializer = SaleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Create sale
        sale = Sale.objects.create(
            total_amount=data['total_amount'],
            payment_method=data['payment_method'],
            customer_name=data.get('customer_name', ''),
            customer_phone=data.get('customer_phone', ''),
            created_by=request.user
        )
        
        # Create sale items and update stock
        for item_data in data['items']:
            product = Product.objects.get(id=item_data['product_id'])
            imei = None
            
            if item_data.get('imei_id'):
                imei = IMEI.objects.get(id=item_data['imei_id'])
                imei.mark_as_sold()
            
            SaleItem.objects.create(
                sale=sale,
                product=product,
                imei=imei,
                quantity=item_data['quantity'],
                unit_price=product.selling_price,
                total_price=item_data['total_price']
            )
            
            # Update product stock
            product.quantity -= item_data['quantity']
            product.save()
            
            # Check for low stock alert
            if product.is_low_stock:
                Activity.objects.create(
                    type='low_stock',
                    message=f'Low stock alert: {product.brand} {product.model} ({product.quantity} remaining)',
                    user=request.user
                )
        
        # Log sale activity
        Activity.objects.create(
            type='sale',
            message=f'Sale #{sale.id} completed - ₦{sale.total_amount:,.2f}',
            user=request.user
        )
        
        # Return complete sale data
        response_serializer = SaleSerializer(sale)
        return Response({
            'data': response_serializer.data,
            'success': True,
            'message': 'Sale completed successfully'
        }, status=status.HTTP_201_CREATED)


class SaleDetailView(generics.RetrieveAPIView):
    """GET /api/sales/<id>/"""
    queryset = Sale.objects.prefetch_related('items__product', 'items__imei')
    serializer_class = SaleSerializer
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'data': serializer.data,
            'success': True
        })


class TodaySalesView(APIView):
    """GET /api/sales/today/"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        today = timezone.now().date()
        sales = Sale.objects.filter(
            created_at__date=today
        ).prefetch_related('items__product', 'items__imei')
        
        serializer = SaleSerializer(sales, many=True)
        return Response({
            'data': serializer.data,
            'success': True
        })


# ========== DASHBOARD ==========

class DashboardStatsView(APIView):
    """
    GET /api/dashboard/stats/
    
    Response:
    {
        "data": {
            "total_products": 150,
            "low_stock_count": 8,
            "today_sales": 12,
            "today_revenue": 450000.00,
            "inventory_value": 5000000.00,
            "weekly_sales": [5, 8, 12, 6, 10, 15, 12],
            "monthly_revenue": 3500000.00
        },
        "success": true
    }
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_start = today.replace(day=1)
        
        # Total products
        total_products = Product.objects.count()
        
        # Low stock count
        low_stock_count = Product.objects.filter(
            quantity__lte=F('low_stock_threshold')
        ).count()
        
        # Today's sales
        today_sales = Sale.objects.filter(created_at__date=today)
        today_sales_count = today_sales.count()
        today_revenue = today_sales.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Inventory value
        inventory_value = Product.objects.aggregate(
            total=Sum(F('quantity') * F('selling_price'))
        )['total'] or 0
        
        # Weekly sales (last 7 days)
        weekly_sales = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            count = Sale.objects.filter(created_at__date=day).count()
            weekly_sales.append(count)
        
        # Monthly revenue
        monthly_revenue = Sale.objects.filter(
            created_at__date__gte=month_start
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        data = {
            'total_products': total_products,
            'low_stock_count': low_stock_count,
            'today_sales': today_sales_count,
            'today_revenue': float(today_revenue),
            'inventory_value': float(inventory_value),
            'weekly_sales': weekly_sales,
            'monthly_revenue': float(monthly_revenue),
        }
        
        return Response({
            'data': data,
            'success': True
        })


class RecentActivityView(generics.ListAPIView):
    """GET /api/dashboard/activity/"""
    serializer_class = ActivitySerializer
    
    def get_queryset(self):
        return Activity.objects.all()[:20]
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'data': serializer.data,
            'success': True
        })


# ========== REPORTS ==========

class SalesReportView(APIView):
    """
    GET /api/reports/sales/?period=daily|weekly|monthly
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        period = request.query_params.get('period', 'daily')
        today = timezone.now().date()
        
        if period == 'daily':
            start_date = today
            period_label = today.strftime('%B %d, %Y')
        elif period == 'weekly':
            start_date = today - timedelta(days=7)
            period_label = f'{start_date.strftime("%b %d")} - {today.strftime("%b %d, %Y")}'
        else:  # monthly
            start_date = today.replace(day=1)
            period_label = today.strftime('%B %Y')
        
        sales = Sale.objects.filter(created_at__date__gte=start_date)
        
        # Aggregate stats
        total_sales = sales.count()
        total_revenue = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        items_sold = SaleItem.objects.filter(
            sale__created_at__date__gte=start_date
        ).aggregate(total=Sum('quantity'))['total'] or 0
        
        # Top products
        top_products = SaleItem.objects.filter(
            sale__created_at__date__gte=start_date
        ).values('product').annotate(
            quantity=Sum('quantity')
        ).order_by('-quantity')[:5]
        
        top_products_data = []
        for item in top_products:
            product = Product.objects.get(id=item['product'])
            top_products_data.append({
                'product': ProductSerializer(product).data,
                'quantity': item['quantity']
            })
        
        return Response({
            'data': {
                'period': period_label,
                'total_sales': total_sales,
                'total_revenue': float(total_revenue),
                'items_sold': items_sold,
                'top_products': top_products_data
            },
            'success': True
        })


class StockReportView(APIView):
    """GET /api/reports/stock/"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        products = Product.objects.all()
        
        # Category breakdown
        categories = products.values('category').annotate(
            count=Count('id'),
            total_quantity=Sum('quantity'),
            total_value=Sum(F('quantity') * F('selling_price'))
        )
        
        return Response({
            'data': {
                'total_items': products.aggregate(total=Sum('quantity'))['total'] or 0,
                'total_value': float(products.aggregate(
                    total=Sum(F('quantity') * F('selling_price'))
                )['total'] or 0),
                'low_stock_count': products.filter(
                    quantity__lte=F('low_stock_threshold')
                ).count(),
                'categories': list(categories)
            },
            'success': True
        })


# ========== ALERTS ==========

class LowStockAlertsView(APIView):
    """GET /api/alerts/low-stock/"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        products = Product.objects.filter(
            quantity__lte=F('low_stock_threshold')
        ).order_by('quantity')
        
        alerts = []
        for product in products:
            if product.quantity == 0:
                urgency = 'critical'
            elif product.quantity <= product.low_stock_threshold // 2:
                urgency = 'warning'
            else:
                urgency = 'low'
            
            alerts.append({
                'product': ProductSerializer(product).data,
                'current_stock': product.quantity,
                'threshold': product.low_stock_threshold,
                'urgency': urgency
            })
        
        return Response({
            'data': alerts,
            'success': True
        })
```

### Permissions (inventory/permissions.py)

```python
from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    """Allow access only to admin users"""
    
    def has_permission(self, request, view):
        return request.user and request.user.role == 'ADMIN'
```

---

## Authentication

### JWT Token Flow

```
1. User logs in with username/password
   POST /api/auth/login/
   
2. Server returns JWT token + user data
   {
     "data": {
       "id": 1,
       "username": "admin",
       "role": "ADMIN",
       "token": "eyJ0eXAi..."
     },
     "success": true
   }
   
3. Frontend stores token in localStorage
   localStorage.setItem('phonestore_auth_token', token)
   
4. Subsequent requests include token in header
   Authorization: Bearer eyJ0eXAi...
   
5. Token can be refreshed before expiry
   POST /api/auth/refresh/
```

### Frontend Token Storage

The frontend stores the JWT token with the key `phonestore_auth_token` in localStorage:

```typescript
// src/contexts/AuthContext.tsx
const TOKEN_KEY = 'phonestore_auth_token';

// After login
localStorage.setItem(TOKEN_KEY, response.data.token);

// For API requests
const token = localStorage.getItem(TOKEN_KEY);
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## Frontend API Service

### Updating api.ts for Django Integration

Replace the mock API service with real HTTP calls:

```typescript
// src/services/api.ts

import type {
  User,
  LoginCredentials,
  Product,
  ProductFormData,
  IMEI,
  Supplier,
  SupplierFormData,
  Sale,
  SalePayload,
  DashboardStats,
  Activity,
  ApiResponse,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'phonestore_auth_token';

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(TOKEN_KEY);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// ============= AUTH API =============
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    return apiCall<User>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return apiCall<null>('/auth/logout/', {
      method: 'POST',
    });
  },

  getCurrentUser: async (token: string): Promise<ApiResponse<User>> => {
    return apiCall<User>('/auth/me/', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// ============= PRODUCTS API =============
export const productsApi = {
  getAll: async (): Promise<ApiResponse<Product[]>> => {
    return apiCall<Product[]>('/products/');
  },

  getById: async (id: number): Promise<ApiResponse<Product>> => {
    return apiCall<Product>(`/products/${id}/`);
  },

  create: async (data: ProductFormData): Promise<ApiResponse<Product>> => {
    return apiCall<Product>('/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<ProductFormData>): Promise<ApiResponse<Product>> => {
    return apiCall<Product>(`/products/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return apiCall<null>(`/products/${id}/`, {
      method: 'DELETE',
    });
  },

  getIMEIs: async (productId: number): Promise<ApiResponse<IMEI[]>> => {
    return apiCall<IMEI[]>(`/products/${productId}/imeis/`);
  },

  getAvailableIMEIs: async (productId: number): Promise<ApiResponse<IMEI[]>> => {
    return apiCall<IMEI[]>(`/products/${productId}/imeis/available/`);
  },
};

// ============= SUPPLIERS API =============
export const suppliersApi = {
  getAll: async (): Promise<ApiResponse<Supplier[]>> => {
    return apiCall<Supplier[]>('/suppliers/');
  },

  getById: async (id: number): Promise<ApiResponse<Supplier>> => {
    return apiCall<Supplier>(`/suppliers/${id}/`);
  },

  create: async (data: SupplierFormData): Promise<ApiResponse<Supplier>> => {
    return apiCall<Supplier>('/suppliers/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<SupplierFormData>): Promise<ApiResponse<Supplier>> => {
    return apiCall<Supplier>(`/suppliers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    return apiCall<null>(`/suppliers/${id}/`, {
      method: 'DELETE',
    });
  },
};

// ============= SALES API =============
export const salesApi = {
  getAll: async (): Promise<ApiResponse<Sale[]>> => {
    return apiCall<Sale[]>('/sales/');
  },

  getById: async (id: number): Promise<ApiResponse<Sale>> => {
    return apiCall<Sale>(`/sales/${id}/`);
  },

  create: async (payload: SalePayload, userId: number): Promise<ApiResponse<Sale>> => {
    return apiCall<Sale>('/sales/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getTodaySales: async (): Promise<ApiResponse<Sale[]>> => {
    return apiCall<Sale[]>('/sales/today/');
  },
};

// ============= DASHBOARD API =============
export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return apiCall<DashboardStats>('/dashboard/stats/');
  },

  getRecentActivity: async (): Promise<ApiResponse<Activity[]>> => {
    return apiCall<Activity[]>('/dashboard/activity/');
  },
};

// ============= REPORTS API =============
export const reportsApi = {
  getSalesReport: async (period: 'daily' | 'weekly' | 'monthly'): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/reports/sales/?period=${period}`);
  },

  getStockReport: async (): Promise<ApiResponse<any>> => {
    return apiCall<any>('/reports/stock/');
  },
};

// ============= ALERTS API =============
export const alertsApi = {
  getLowStockProducts: async (): Promise<ApiResponse<Product[]>> => {
    return apiCall<Product[]>('/alerts/low-stock/');
  },
};
```

---

## CORS Configuration

```python
# settings.py

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",    # Vite dev server
    "http://localhost:3000",    # Alternative dev port
    "https://yourdomain.com",   # Production domain
]

# Or for development, allow all origins (not recommended for production)
CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

---

## Environment Variables

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
```

### Backend (.env)

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://user:password@localhost:5432/phonestore_db

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_LIFETIME_HOURS=12
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

---

## Deployment Considerations

### Production Checklist

1. **Security**
   - Set `DEBUG=False`
   - Use strong `SECRET_KEY`
   - Configure HTTPS
   - Set appropriate CORS origins
   - Enable CSRF protection

2. **Database**
   - Use MySQL via XAMPP for development
   - For production, consider a managed MySQL service
   - Set up database backups
   - Configure connection pooling

3. **Static Files**
   - Run `python manage.py collectstatic`
   - Serve static files via Nginx/CDN

4. **Environment Variables**
   - Use environment-specific `.env` files
   - Never commit secrets to version control

5. **API Rate Limiting**
   - Implement throttling for auth endpoints
   - Add request rate limits

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "phonestore_backend.wsgi:application"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: phonestore_db
      MYSQL_ROOT_PASSWORD: password
      MYSQL_USER: phonestore_user
      MYSQL_PASSWORD: password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DB_ENGINE=django.db.backends.mysql
      - DB_NAME=phonestore_db
      - DB_USER=phonestore_user
      - DB_PASSWORD=password
      - DB_HOST=db
      - DB_PORT=3306
    depends_on:
      - db

volumes:
  mysql_data:
```

---

## Data Type Mapping

### Frontend to Backend Type Correspondence

| Frontend Type | Django Model | DRF Serializer |
|--------------|--------------|----------------|
| `User` | `authentication.User` | `UserSerializer` |
| `Product` | `inventory.Product` | `ProductSerializer` |
| `IMEI` | `inventory.IMEI` | `IMEISerializer` |
| `Supplier` | `inventory.Supplier` | `SupplierSerializer` |
| `Sale` | `inventory.Sale` | `SaleSerializer` |
| `SaleItem` | `inventory.SaleItem` | `SaleItemSerializer` |
| `SalePayload` | N/A | `SaleCreateSerializer` |
| `DashboardStats` | N/A | `DashboardStatsSerializer` |
| `Activity` | `inventory.Activity` | `ActivitySerializer` |

### Field Type Mappings

| TypeScript | Django Field | Notes |
|------------|--------------|-------|
| `number` | `IntegerField` | For IDs, quantities |
| `number` | `DecimalField` | For prices (2 decimal places) |
| `string` | `CharField` | With max_length |
| `string` | `TextField` | For longer text |
| `string` | `EmailField` | For emails |
| `boolean` | `BooleanField` | |
| `string` (ISO) | `DateTimeField` | Auto-serialized to ISO format |
| `'ADMIN' \| 'SALES_ATTENDANT'` | `CharField(choices=...)` | Enum-like |

---

## Testing

### Django Test Setup

```python
# tests/test_api.py

from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from authentication.models import User
from inventory.models import Product

class AuthenticationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',
            role='ADMIN'
        )
    
    def test_login_success(self):
        url = reverse('login')
        data = {'username': 'testuser', 'password': 'testpass123'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('token', response.data['data'])


class ProductTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin',
            password='admin123',
            role='ADMIN'
        )
        self.client.force_authenticate(user=self.admin)
        
        self.product = Product.objects.create(
            category='Phone',
            brand='Samsung',
            model='Galaxy S24',
            quantity=10,
            cost_price=500000,
            selling_price=650000,
            low_stock_threshold=5
        )
    
    def test_list_products(self):
        url = reverse('product-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']), 1)
    
    def test_create_product(self):
        url = reverse('product-list')
        data = {
            'category': 'Phone',
            'brand': 'iPhone',
            'model': '15 Pro',
            'quantity': 5,
            'cost_price': 800000,
            'selling_price': 950000,
            'low_stock_threshold': 3
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 2)
```

---

## Migration Commands

```bash
# Create migrations
python manage.py makemigrations authentication inventory

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load initial data (optional)
python manage.py loaddata initial_data.json

# Run development server
python manage.py runserver

# Run tests
python manage.py test
```

---

## Summary

This documentation provides a complete blueprint for integrating the React frontend with a Django REST Framework backend. The key points are:

1. **API Response Format**: All endpoints return `{ data, success, message? }` format
2. **Authentication**: JWT-based with token stored in localStorage
3. **Permissions**: Role-based (ADMIN vs SALES_ATTENDANT)
4. **Type Consistency**: Frontend TypeScript types map directly to Django serializers
5. **Zero Refactoring**: Frontend requires only updating the API service file

For questions or issues, refer to the [Django REST Framework documentation](https://www.django-rest-framework.org/) and the frontend codebase in `src/services/api.ts`.
