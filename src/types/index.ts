// User & Authentication Types
export type UserRole = 'ADMIN' | 'SALES_ATTENDANT';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Product Types
export type ProductCategory = 'Phone' | 'Accessory' | 'Charger' | 'Cable' | 'Case' | 'Screen Protector';

export interface Product {
  id: number;
  category: ProductCategory;
  brand: string;
  model: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  category: ProductCategory;
  brand: string;
  model: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  low_stock_threshold: number;
}

// IMEI Types
export interface IMEI {
  id: number;
  product_id: number;
  imei_number: string;
  is_sold: boolean;
  sold_at?: string;
}


// Sales Types
export interface SaleItem {
  product_id: number;
  product: Product;
  quantity: number;
  imei_id?: number;
  imei?: IMEI;
  unit_price: number;
  total_price: number;
}

export interface Sale {
  id: number;
  items: SaleItem[];
  total_amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  created_at: string;
  created_by: number;
}

export interface SalePayload {
  items: {
    product_id: number;
    quantity: number;
    imei_id?: number;
    total_price: number;
  }[];
  payment_method: 'cash' | 'card' | 'transfer';
  total_amount: number;
}

// Dashboard Types
export interface DashboardStats {
  total_products: number;
  low_stock_count: number;
  today_sales: number;
  today_revenue: number;
  inventory_value: number;
  weekly_sales: number[];
  monthly_revenue: number;
}

export interface Activity {
  id: number;
  type: 'sale' | 'stock_update' | 'low_stock' | 'new_product';
  message: string;
  created_at: string;
}

// Report Types
export interface SalesReport {
  period: string;
  total_sales: number;
  total_revenue: number;
  items_sold: number;
  top_products: { product: Product; quantity: number }[];
}

export interface StockAlert {
  product: Product;
  current_stock: number;
  threshold: number;
  urgency: 'critical' | 'warning' | 'low';
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
