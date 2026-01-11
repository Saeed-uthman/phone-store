/**
 * Mock API Service Layer
 * 
 * This service layer simulates REST API calls.
 * When integrating with Django, simply replace the mock implementations
 * with actual fetch/axios calls to your Django REST endpoints.
 * 
 * API Endpoints Structure:
 * - /api/auth/login
 * - /api/products
 * - /api/products/:id
 * - /api/products/:id/imeis
 * - /api/sales
 * - /api/suppliers
 * - /api/reports
 * - /api/dashboard
 */

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

import {
  mockUsers,
  mockProducts,
  mockIMEIs,
  mockSuppliers,
  mockSales,
  mockActivities,
  mockDashboardStats,
} from '@/data/mockData';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mutable copies for CRUD operations
let products = [...mockProducts];
let imeis = [...mockIMEIs];
let suppliers = [...mockSuppliers];
let sales = [...mockSales];
let activities = [...mockActivities];

// ============================================
// AUTH API
// ============================================

// Signup credentials type
export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
}

// Forgot password type
export interface ForgotPasswordRequest {
  email: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    await delay(800);
    
    const user = mockUsers.find(
      u => u.username === credentials.username && credentials.password === 'password123'
    );

    if (!user) {
      throw new Error('Invalid username or password');
    }

    return {
      data: user,
      success: true,
      message: 'Login successful',
    };
  },

  /**
   * Sign up a new user
   * 
   * Django Endpoint: POST /api/auth/signup/
   * 
   * Request Body:
   * {
   *   "username": "string",
   *   "email": "string",
   *   "password": "string"
   * }
   * 
   * Response:
   * {
   *   "data": { "id": 1, "username": "...", "email": "...", "role": "SALES_ATTENDANT" },
   *   "success": true,
   *   "message": "Account created successfully"
   * }
   * 
   * TODO: Replace mock implementation with actual API call:
   * 
   * const response = await fetch(`${API_BASE_URL}/api/auth/signup/`, {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify(credentials),
   * });
   * 
   * if (!response.ok) {
   *   const errorData = await response.json();
   *   throw new Error(errorData.message || 'Signup failed');
   * }
   * 
   * return await response.json();
   */
  signup: async (credentials: SignupCredentials): Promise<ApiResponse<User>> => {
    await delay(800);
    
    // Mock: Check if username already exists
    const existingUser = mockUsers.find(u => u.username === credentials.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Mock: Check if email already exists
    const existingEmail = mockUsers.find(u => u.email === credentials.email);
    if (existingEmail) {
      throw new Error('Email already registered');
    }

    // Mock: Create new user (in real app, this would be handled by Django)
    const newUser: User = {
      id: mockUsers.length + 1,
      username: credentials.username,
      email: credentials.email,
      role: 'SALES_ATTENDANT', // Default role for new signups
      token: `mock_token_${Date.now()}`,
    };

    return {
      data: newUser,
      success: true,
      message: 'Account created successfully',
    };
  },

  /**
   * Request password reset email
   * 
   * Django Endpoint: POST /api/auth/forgot-password/
   * 
   * Request Body:
   * {
   *   "email": "string"
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "message": "Password reset instructions sent to your email"
   * }
   * 
   * TODO: Replace mock implementation with actual API call:
   * 
   * const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password/`, {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({ email }),
   * });
   * 
   * if (!response.ok) {
   *   const errorData = await response.json();
   *   throw new Error(errorData.message || 'Failed to send reset email');
   * }
   * 
   * return await response.json();
   */
  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    await delay(800);
    
    // Mock: In a real app, Django would send an email
    // For security, always return success even if email doesn't exist
    // This prevents email enumeration attacks
    
    console.log(`[MOCK] Password reset email would be sent to: ${email}`);

    return {
      data: null,
      success: true,
      message: 'Password reset instructions sent to your email',
    };
  },

  /**
   * Reset password with token
   * 
   * Django Endpoint: POST /api/auth/reset-password/
   * 
   * Request Body:
   * {
   *   "token": "string",
   *   "new_password": "string"
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "message": "Password reset successfully"
   * }
   * 
   * TODO: Replace mock implementation with actual API call:
   * 
   * const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/`, {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({ token, new_password: newPassword }),
   * });
   * 
   * if (!response.ok) {
   *   const errorData = await response.json();
   *   throw new Error(errorData.message || 'Failed to reset password');
   * }
   * 
   * return await response.json();
   */
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<null>> => {
    await delay(800);
    
    // Mock: Validate token and reset password
    if (!token || token.length < 10) {
      throw new Error('Invalid or expired reset token');
    }

    console.log(`[MOCK] Password would be reset for token: ${token}`);

    return {
      data: null,
      success: true,
      message: 'Password reset successfully',
    };
  },

  logout: async (): Promise<ApiResponse<null>> => {
    await delay(300);
    return {
      data: null,
      success: true,
      message: 'Logged out successfully',
    };
  },

  getCurrentUser: async (token: string): Promise<ApiResponse<User>> => {
    await delay(300);
    const user = mockUsers.find(u => u.token === token);
    
    if (!user) {
      throw new Error('Invalid token');
    }

    return {
      data: user,
      success: true,
    };
  },
};

// ============================================
// PRODUCTS API
// ============================================

export const productsApi = {
  getAll: async (): Promise<ApiResponse<Product[]>> => {
    await delay(500);
    return {
      data: products,
      success: true,
    };
  },

  getById: async (id: number): Promise<ApiResponse<Product>> => {
    await delay(300);
    const product = products.find(p => p.id === id);
    
    if (!product) {
      throw new Error('Product not found');
    }

    return {
      data: product,
      success: true,
    };
  },

  create: async (data: ProductFormData): Promise<ApiResponse<Product>> => {
    await delay(600);
    const newProduct: Product = {
      ...data,
      id: Math.max(...products.map(p => p.id)) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    products = [...products, newProduct];
    
    return {
      data: newProduct,
      success: true,
      message: 'Product created successfully',
    };
  },

  update: async (id: number, data: Partial<ProductFormData>): Promise<ApiResponse<Product>> => {
    await delay(500);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
      throw new Error('Product not found');
    }

    products[index] = {
      ...products[index],
      ...data,
      updated_at: new Date().toISOString(),
    };

    return {
      data: products[index],
      success: true,
      message: 'Product updated successfully',
    };
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    await delay(400);
    products = products.filter(p => p.id !== id);
    
    return {
      data: null,
      success: true,
      message: 'Product deleted successfully',
    };
  },

  getIMEIs: async (productId: number): Promise<ApiResponse<IMEI[]>> => {
    await delay(300);
    const productIMEIs = imeis.filter(i => i.product_id === productId);
    
    return {
      data: productIMEIs,
      success: true,
    };
  },

  getAvailableIMEIs: async (productId: number): Promise<ApiResponse<IMEI[]>> => {
    await delay(300);
    const availableIMEIs = imeis.filter(i => i.product_id === productId && !i.is_sold);
    
    return {
      data: availableIMEIs,
      success: true,
    };
  },
};

// ============================================
// SUPPLIERS API
// ============================================

export const suppliersApi = {
  getAll: async (): Promise<ApiResponse<Supplier[]>> => {
    await delay(400);
    return {
      data: suppliers,
      success: true,
    };
  },

  getById: async (id: number): Promise<ApiResponse<Supplier>> => {
    await delay(300);
    const supplier = suppliers.find(s => s.id === id);
    
    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return {
      data: supplier,
      success: true,
    };
  },

  create: async (data: SupplierFormData): Promise<ApiResponse<Supplier>> => {
    await delay(500);
    const newSupplier: Supplier = {
      ...data,
      id: Math.max(...suppliers.map(s => s.id)) + 1,
      created_at: new Date().toISOString(),
    };
    
    suppliers = [...suppliers, newSupplier];
    
    return {
      data: newSupplier,
      success: true,
      message: 'Supplier created successfully',
    };
  },

  update: async (id: number, data: Partial<SupplierFormData>): Promise<ApiResponse<Supplier>> => {
    await delay(400);
    const index = suppliers.findIndex(s => s.id === id);
    
    if (index === -1) {
      throw new Error('Supplier not found');
    }

    suppliers[index] = {
      ...suppliers[index],
      ...data,
    };

    return {
      data: suppliers[index],
      success: true,
      message: 'Supplier updated successfully',
    };
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    await delay(400);
    suppliers = suppliers.filter(s => s.id !== id);
    
    return {
      data: null,
      success: true,
      message: 'Supplier deleted successfully',
    };
  },
};

// ============================================
// SALES API
// ============================================

export const salesApi = {
  getAll: async (): Promise<ApiResponse<Sale[]>> => {
    await delay(400);
    return {
      data: sales,
      success: true,
    };
  },

  getById: async (id: number): Promise<ApiResponse<Sale>> => {
    await delay(300);
    const sale = sales.find(s => s.id === id);
    
    if (!sale) {
      throw new Error('Sale not found');
    }

    return {
      data: sale,
      success: true,
    };
  },

  create: async (payload: SalePayload, userId: number): Promise<ApiResponse<Sale>> => {
    await delay(700);
    
    const newSale: Sale = {
      id: Math.max(...sales.map(s => s.id)) + 1,
      items: payload.items.map(item => {
        const product = products.find(p => p.id === item.product_id)!;
        const imei = item.imei_id ? imeis.find(i => i.id === item.imei_id) : undefined;
        
        return {
          product_id: item.product_id,
          product,
          quantity: item.quantity,
          imei_id: item.imei_id,
          imei,
          unit_price: product.selling_price,
          total_price: item.total_price,
        };
      }),
      total_amount: payload.total_amount,
      payment_method: payload.payment_method,
      created_at: new Date().toISOString(),
      created_by: userId,
    };

    // Update stock quantities
    payload.items.forEach(item => {
      const productIndex = products.findIndex(p => p.id === item.product_id);
      if (productIndex !== -1) {
        products[productIndex] = {
          ...products[productIndex],
          quantity: products[productIndex].quantity - item.quantity,
        };
      }
      
      // Mark IMEI as sold
      if (item.imei_id) {
        const imeiIndex = imeis.findIndex(i => i.id === item.imei_id);
        if (imeiIndex !== -1) {
          imeis[imeiIndex] = {
            ...imeis[imeiIndex],
            is_sold: true,
            sold_at: new Date().toISOString(),
          };
        }
      }
    });

    sales = [...sales, newSale];
    
    return {
      data: newSale,
      success: true,
      message: 'Sale completed successfully',
    };
  },

  getTodaySales: async (): Promise<ApiResponse<Sale[]>> => {
    await delay(300);
    const today = new Date().toDateString();
    const todaySales = sales.filter(s => new Date(s.created_at).toDateString() === today);
    
    return {
      data: todaySales,
      success: true,
    };
  },
};

// ============================================
// DASHBOARD API
// ============================================

export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    await delay(500);
    
    // Recalculate stats based on current data
    const stats: DashboardStats = {
      total_products: products.length,
      low_stock_count: products.filter(p => p.quantity <= p.low_stock_threshold).length,
      today_sales: mockDashboardStats.today_sales,
      today_revenue: mockDashboardStats.today_revenue,
      inventory_value: products.reduce((sum, p) => sum + (p.cost_price * p.quantity), 0),
      weekly_sales: mockDashboardStats.weekly_sales,
      monthly_revenue: mockDashboardStats.monthly_revenue,
    };
    
    return {
      data: stats,
      success: true,
    };
  },

  getRecentActivity: async (): Promise<ApiResponse<Activity[]>> => {
    await delay(400);
    return {
      data: activities.slice(0, 10),
      success: true,
    };
  },
};

// ============================================
// REPORTS API
// ============================================

export const reportsApi = {
  getSalesReport: async (period: 'daily' | 'weekly' | 'monthly'): Promise<ApiResponse<any>> => {
    await delay(600);
    
    // Mock report data
    const report = {
      period,
      total_sales: sales.length,
      total_revenue: sales.reduce((sum, s) => sum + s.total_amount, 0),
      items_sold: sales.reduce((sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0), 0),
      top_products: [
        { product: products[0], quantity: 5 },
        { product: products[1], quantity: 3 },
        { product: products[6], quantity: 8 },
      ],
    };
    
    return {
      data: report,
      success: true,
    };
  },

  getStockReport: async (): Promise<ApiResponse<any>> => {
    await delay(500);
    
    const stockReport = {
      total_items: products.reduce((sum, p) => sum + p.quantity, 0),
      total_value: products.reduce((sum, p) => sum + (p.cost_price * p.quantity), 0),
      low_stock_items: products.filter(p => p.quantity <= p.low_stock_threshold),
      categories: [...new Set(products.map(p => p.category))].map(cat => ({
        category: cat,
        count: products.filter(p => p.category === cat).length,
        value: products.filter(p => p.category === cat).reduce((s, p) => s + (p.cost_price * p.quantity), 0),
      })),
    };
    
    return {
      data: stockReport,
      success: true,
    };
  },
};

// ============================================
// STOCK ALERTS API
// ============================================

export const alertsApi = {
  getLowStockProducts: async (): Promise<ApiResponse<Product[]>> => {
    await delay(400);
    const lowStock = products.filter(p => p.quantity <= p.low_stock_threshold);
    
    return {
      data: lowStock.sort((a, b) => a.quantity - b.quantity),
      success: true,
    };
  },
};
