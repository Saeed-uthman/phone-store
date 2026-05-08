import type {
  User,
  LoginCredentials,
  Product,
  ProductFormData,
  IMEI,
  Sale,
  SalePayload,
  DashboardStats,
  Activity,
  ApiResponse,
  CustomerCartItem,
  CreateOrderData,
  CustomerOrder,
  PaymentInitializationResult,
  StockAlertItem,
  ProductCategory,
  CustomerUser,
  PaginatedResponse,
} from '@/types';

const API_BASE_URL = 'http://localhost/phone-inventory-api/api';
const AUTH_TOKEN_STORAGE_KEY = 'phonestore_auth_token';
const AUTH_USER_STORAGE_KEY = 'phonestore_auth_user';
const CUSTOMER_CART_STORAGE_KEY = 'phonestore_customer_cart';
const CUSTOMER_AUTH_TOKEN_STORAGE_KEY = 'phonestore_customer_token';
const CUSTOMER_AUTH_USER_STORAGE_KEY = 'phonestore_customer_user';

type BackendAuthUser = {
  id: number | string;
  username: string;
  email?: string;
  role?: string;
};

type BackendAuthResponse = {
  success?: boolean;
  message?: string;
  token?: string;
  user?: BackendAuthUser;
};

type BackendCustomerAuthUser = {
  id: number | string;
  full_name: string;
  email: string;
  phone: string;
};

type BackendCustomerAuthResponse = {
  success?: boolean;
  message?: string;
  token?: string;
  user?: BackendCustomerAuthUser;
  data?: BackendCustomerAuthUser;
};

type BackendWrapped<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type BackendPaginatedWrapped<T> = {
  success: boolean;
  message?: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
};

type BackendProduct = {
  id: number;
  name: string;
  brand: string;
  model: string;
  category: string;
  sku: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  min_stock_level: number;
  created_at: string;
  updated_at: string;
};

type BackendSaleItem = {
  product_id: number;
  product_name: string;
  brand: string;
  model: string;
  category?: string;
  cost_price?: number;
  stock_quantity?: number;
  min_stock_level?: number;
  product_created_at?: string;
  product_updated_at?: string;
  quantity: number;
  price: number;
  total: number;
  imei_id?: number;
  imei_number?: string;
};

type BackendSale = {
  id: number;
  total: number;
  payment_method: string;
  created_at: string;
  cashier_id?: number;
  items: BackendSaleItem[];
};

type BackendIMEI = {
  id: number;
  product_id: number;
  imei_number: string;
  is_sold: number | boolean;
  sold_at?: string | null;
};

type BackendOrderItem = {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

type BackendOrder = {
  id: number;
  receipt_number: string;
  customer_account_id?: number | null;
  customer: {
    full_name: string;
    phone_number: string;
    email: string;
  };
  items: BackendOrderItem[];
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed';
  payment_reference?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  collection_instruction?: string;
};

const getToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

const getCustomerToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(CUSTOMER_AUTH_TOKEN_STORAGE_KEY);
};

const saveStoredUser = (user: User | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (user) {
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    return;
  }

  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
};

const readStoredUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
};

const saveStoredCustomerUser = (user: CustomerUser | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (user) {
    localStorage.setItem(CUSTOMER_AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(CUSTOMER_AUTH_TOKEN_STORAGE_KEY, user.token);
    return;
  }

  localStorage.removeItem(CUSTOMER_AUTH_USER_STORAGE_KEY);
  localStorage.removeItem(CUSTOMER_AUTH_TOKEN_STORAGE_KEY);
};

const readStoredCustomerUser = (): CustomerUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawUser = localStorage.getItem(CUSTOMER_AUTH_USER_STORAGE_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as CustomerUser;
  } catch {
    localStorage.removeItem(CUSTOMER_AUTH_USER_STORAGE_KEY);
    localStorage.removeItem(CUSTOMER_AUTH_TOKEN_STORAGE_KEY);
    return null;
  }
};

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    throw new Error('Invalid token');
  }

  const base64Payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
  const paddedPayload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, '=');

  return JSON.parse(atob(paddedPayload)) as Record<string, unknown>;
};

const normalizeUserRole = (role?: string): User['role'] =>
  role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'SALES_ATTENDANT';

const request = async <T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; customerAuth?: boolean; token?: string } = {}
): Promise<T> => {
  const method = options.method || 'GET';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options.auth) {
    const token = options.token || getToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.customerAuth) {
    const token = options.token || getCustomerToken();
    if (!token) {
      throw new Error('Customer authentication required');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const rawText = await response.text();
  let payload: Record<string, unknown> = {};
  if (rawText) {
    try {
      payload = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      payload = { message: rawText };
    }
  }

  if (!response.ok || payload.success === false) {
    const responseMessage = typeof payload.message === 'string'
      ? payload.message
      : `Request failed (${response.status})`;
    throw new Error(responseMessage);
  }

  return payload as T;
};

const frontendToBackendCategory: Record<ProductCategory, string> = {
  Phone: 'smartphones',
  Accessory: 'accessories',
  Charger: 'chargers',
  Cable: 'cables',
  Case: 'cases',
  'Screen Protector': 'accessories',
};

const backendToFrontendCategory = (category: string): ProductCategory => {
  switch (category) {
    case 'smartphones':
      return 'Phone';
    case 'chargers':
      return 'Charger';
    case 'cables':
      return 'Cable';
    case 'cases':
      return 'Case';
    case 'accessories':
    case 'audio':
    case 'smartwatches':
    case 'tablets':
    case 'other':
    default:
      return 'Accessory';
  }
};

const mapBackendProduct = (product: Partial<BackendProduct> & Record<string, unknown>): Product => ({
  id: Number(product.id || 0),
  category: backendToFrontendCategory(String(product.category || 'accessories')),
  brand: String(product.brand || ''),
  model: String(product.model || product.name || ''),
  quantity: Number(product.stock_quantity ?? 0),
  cost_price: Number(product.cost_price ?? 0),
  selling_price: Number(product.price ?? 0),
  low_stock_threshold: Number(product.min_stock_level ?? 0),
  created_at: String(product.created_at || new Date().toISOString()),
  updated_at: String(product.updated_at || product.created_at || new Date().toISOString()),
});

const mapBackendPaymentToFrontend = (method: string): 'cash' | 'card' | 'transfer' => {
  if (method === 'bank_transfer' || method === 'mobile_money') {
    return 'transfer';
  }
  if (method === 'cash') {
    return 'cash';
  }
  return 'card';
};

const mapFrontendPaymentToBackend = (method: 'cash' | 'card' | 'transfer') => {
  if (method === 'transfer') {
    return 'bank_transfer';
  }
  return method;
};

const mapBackendSale = (sale: BackendSale): Sale => ({
  id: Number(sale.id),
  items: (sale.items || []).map((item) => {
    const product = mapBackendProduct({
      id: item.product_id,
      brand: item.brand,
      model: item.model,
      category: item.category || 'smartphones',
      stock_quantity: item.stock_quantity ?? 0,
      cost_price: item.cost_price ?? 0,
      price: item.price,
      min_stock_level: item.min_stock_level ?? 0,
      created_at: item.product_created_at || sale.created_at,
      updated_at: item.product_updated_at || sale.created_at,
      name: item.product_name,
    });

    return {
      product_id: Number(item.product_id),
      product,
      quantity: Number(item.quantity),
      imei_id: item.imei_id ? Number(item.imei_id) : undefined,
      imei: item.imei_number
        ? {
            id: Number(item.imei_id || 0),
            product_id: Number(item.product_id),
            imei_number: String(item.imei_number),
            is_sold: true,
            sold_at: sale.created_at,
          }
        : undefined,
      unit_price: Number(item.price),
      total_price: Number(item.total),
    };
  }),
  total_amount: Number(sale.total),
  payment_method: mapBackendPaymentToFrontend(String(sale.payment_method || 'card')),
  created_at: String(sale.created_at),
  created_by: Number(sale.cashier_id || 0),
});

const mapOrderFromBackend = (order: BackendOrder): CustomerOrder => ({
  id: Number(order.id),
  receipt_number: String(order.receipt_number),
  customer_account_id: order.customer_account_id === null || order.customer_account_id === undefined
    ? null
    : Number(order.customer_account_id),
  customer: {
    full_name: String(order.customer.full_name),
    phone_number: String(order.customer.phone_number),
    email: String(order.customer.email),
  },
  items: (order.items || []).map((item) => ({
    product_id: Number(item.product_id),
    product_name: String(item.product_name),
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    line_total: Number(item.line_total),
  })),
  total_amount: Number(order.total_amount),
  payment_status: order.payment_status === 'paid' ? 'paid' : 'pending',
  payment_reference: order.payment_reference,
  status: order.status,
  created_at: String(order.created_at),
  collection_instruction: order.collection_instruction,
});

const getCartFromStorage = (): CustomerCartItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const rawCart = localStorage.getItem(CUSTOMER_CART_STORAGE_KEY);
  if (!rawCart) {
    return [];
  }

  try {
    return JSON.parse(rawCart) as CustomerCartItem[];
  } catch {
    localStorage.removeItem(CUSTOMER_CART_STORAGE_KEY);
    return [];
  }
};

const saveCartToStorage = (items: CustomerCartItem[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(CUSTOMER_CART_STORAGE_KEY, JSON.stringify(items));
};

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

const mapBackendCustomerUser = (user: BackendCustomerAuthUser, token: string): CustomerUser => ({
  id: Number(user.id),
  full_name: String(user.full_name),
  email: String(user.email),
  phone: String(user.phone),
  token,
});

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    const response = await request<BackendAuthResponse>('/auth/login.php', {
      method: 'POST',
      body: credentials,
    });

    if (!response.user || !response.token) {
      throw new Error('Invalid login response from server');
    }

    const user: User = {
      id: Number(response.user.id),
      username: response.user.username,
      email: response.user.email ?? '',
      role: normalizeUserRole(response.user.role),
      token: response.token,
    };

    saveStoredUser(user);

    return {
      data: user,
      success: true,
      message: response.message || 'Login successful',
    };
  },

  signup: async (credentials: SignupCredentials): Promise<ApiResponse<null>> => {
    const response = await request<BackendAuthResponse>('/auth/signup.php', {
      method: 'POST',
      body: credentials,
    });

    return {
      data: null,
      success: true,
      message: response.message || 'Account created successfully',
    };
  },

  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    const response = await request<BackendAuthResponse>('/auth/forgot-password.php', {
      method: 'POST',
      body: { email },
    });

    return {
      data: null,
      success: true,
      message: response.message || 'Password reset instructions sent to your email',
    };
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<null>> => {
    await Promise.resolve();
    if (!token || token.length < 10) {
      throw new Error('Invalid or expired reset token');
    }

    return {
      data: null,
      success: true,
      message: 'Password reset successfully',
    };
  },

  logout: async (): Promise<ApiResponse<null>> => {
    saveStoredUser(null);
    return {
      data: null,
      success: true,
      message: 'Logged out successfully',
    };
  },

  getCurrentUser: async (token: string): Promise<ApiResponse<User>> => {
    const cachedUser = readStoredUser();
    if (cachedUser?.token === token) {
      return {
        data: cachedUser,
        success: true,
      };
    }

    const payload = decodeJwtPayload(token);
    const expiresAt = Number(payload.exp);

    if (Number.isFinite(expiresAt) && expiresAt <= Date.now() / 1000) {
      throw new Error('Invalid or expired token');
    }

    const user: User = {
      id: Number(payload.user_id),
      username: String(payload.username || ''),
      email: '',
      role: normalizeUserRole(String(payload.role || '')),
      token,
    };

    return {
      data: user,
      success: true,
    };
  },
};

export const customerAuthApi = {
  signup: async (payload: { full_name: string; email: string; phone: string; password: string }): Promise<ApiResponse<CustomerUser>> => {
    const response = await request<BackendCustomerAuthResponse>('/customer-auth/signup.php', {
      method: 'POST',
      body: payload,
    });

    if (!response.user || !response.token) {
      throw new Error('Invalid signup response from server');
    }

    const user = mapBackendCustomerUser(response.user, response.token);
    saveStoredCustomerUser(user);

    return {
      data: user,
      success: true,
      message: response.message || 'Account created successfully',
    };
  },

  login: async (payload: { email: string; password: string }): Promise<ApiResponse<CustomerUser>> => {
    const response = await request<BackendCustomerAuthResponse>('/customer-auth/login.php', {
      method: 'POST',
      body: payload,
    });

    if (!response.user || !response.token) {
      throw new Error('Invalid login response from server');
    }

    const user = mapBackendCustomerUser(response.user, response.token);
    saveStoredCustomerUser(user);

    return {
      data: user,
      success: true,
      message: response.message || 'Login successful',
    };
  },

  me: async (token?: string): Promise<ApiResponse<CustomerUser>> => {
    const activeToken = token || getCustomerToken();
    if (!activeToken) {
      throw new Error('Customer authentication required');
    }

    const response = await request<BackendWrapped<BackendCustomerAuthUser>>('/customer-auth/me.php', {
      customerAuth: true,
      token: activeToken,
    });

    const user = mapBackendCustomerUser(response.data, activeToken);
    saveStoredCustomerUser(user);

    return {
      data: user,
      success: true,
    };
  },

  logout: async (): Promise<ApiResponse<null>> => {
    saveStoredCustomerUser(null);
    return {
      data: null,
      success: true,
      message: 'Logged out successfully',
    };
  },

  getStoredUser: (): CustomerUser | null => readStoredCustomerUser(),
  getStoredToken: (): string | null => getCustomerToken(),
};

const generateSku = (data: ProductFormData) => {
  const sanitize = (value: string) => value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const brand = sanitize(data.brand).slice(0, 3) || 'PRD';
  const model = sanitize(data.model).slice(0, 6) || 'ITEM';
  return `${brand}-${model}-${Date.now().toString().slice(-5)}`;
};

const mapProductFormToBackend = (data: ProductFormData, existing?: Partial<BackendProduct>) => ({
  name: `${data.brand} ${data.model}`.trim(),
  brand: data.brand,
  model: data.model,
  category: frontendToBackendCategory[data.category],
  sku: existing?.sku || generateSku(data),
  price: data.selling_price,
  cost_price: data.cost_price,
  stock_quantity: data.quantity,
  min_stock_level: data.low_stock_threshold,
  description: existing?.name || `${data.category} product`,
  image_url: '',
  status: 'active',
});

const fetchBackendProductById = async (id: number): Promise<BackendProduct> => {
  const response = await request<BackendWrapped<BackendProduct>>(`/products/index.php?id=${id}`);
  return response.data;
};

export const productsApi = {
  getAll: async (): Promise<ApiResponse<Product[]>> => {
    const response = await request<BackendWrapped<BackendProduct[]>>('/products/index.php');
    return {
      data: (response.data || []).map(mapBackendProduct),
      success: true,
    };
  },

  getById: async (id: number): Promise<ApiResponse<Product>> => {
    const response = await request<BackendWrapped<BackendProduct>>(`/products/index.php?id=${id}`);
    return {
      data: mapBackendProduct(response.data),
      success: true,
    };
  },

  create: async (data: ProductFormData): Promise<ApiResponse<Product>> => {
    const payload = mapProductFormToBackend(data);
    const createResponse = await request<{ success: boolean; id: number; message?: string }>('/products/index.php', {
      method: 'POST',
      body: payload,
      auth: true,
    });

    const created = await fetchBackendProductById(Number(createResponse.id));
    return {
      data: mapBackendProduct(created),
      success: true,
      message: createResponse.message || 'Product created successfully',
    };
  },

  update: async (id: number, data: Partial<ProductFormData>): Promise<ApiResponse<Product>> => {
    const existing = await fetchBackendProductById(id);
    const mergedFrontend: ProductFormData = {
      category: data.category ?? backendToFrontendCategory(existing.category),
      brand: data.brand ?? existing.brand,
      model: data.model ?? existing.model,
      quantity: data.quantity ?? Number(existing.stock_quantity),
      cost_price: data.cost_price ?? Number(existing.cost_price),
      selling_price: data.selling_price ?? Number(existing.price),
      low_stock_threshold: data.low_stock_threshold ?? Number(existing.min_stock_level),
    };

    const payload = mapProductFormToBackend(mergedFrontend, existing);

    const response = await request<{ success: boolean; message?: string }>(`/products/index.php?id=${id}`, {
      method: 'PUT',
      body: payload,
      auth: true,
    });

    const updated = await fetchBackendProductById(id);

    return {
      data: mapBackendProduct(updated),
      success: true,
      message: response.message || 'Product updated successfully',
    };
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    const response = await request<{ success: boolean; message?: string }>(`/products/index.php?id=${id}`, {
      method: 'DELETE',
      auth: true,
    });

    return {
      data: null,
      success: true,
      message: response.message || 'Product deleted successfully',
    };
  },

  getIMEIs: async (productId: number): Promise<ApiResponse<IMEI[]>> => {
    const response = await request<BackendWrapped<BackendIMEI[]>>(`/products/imeis.php?product_id=${productId}`, {
      auth: true,
    });

    return {
      data: (response.data || []).map((imei) => ({
        id: Number(imei.id),
        product_id: Number(imei.product_id),
        imei_number: String(imei.imei_number),
        is_sold: Boolean(imei.is_sold),
        sold_at: imei.sold_at || undefined,
      })),
      success: true,
    };
  },

  getAvailableIMEIs: async (productId: number): Promise<ApiResponse<IMEI[]>> => {
    const response = await request<BackendWrapped<BackendIMEI[]>>(`/products/imeis.php?product_id=${productId}&available=1`, {
      auth: true,
    });

    return {
      data: (response.data || []).map((imei) => ({
        id: Number(imei.id),
        product_id: Number(imei.product_id),
        imei_number: String(imei.imei_number),
        is_sold: Boolean(imei.is_sold),
        sold_at: imei.sold_at || undefined,
      })),
      success: true,
    };
  },
};

export const salesApi = {
  getAll: async (): Promise<ApiResponse<Sale[]>> => {
    const response = await request<BackendWrapped<BackendSale[]>>('/sales/index.php', { auth: true });
    return {
      data: (response.data || []).map(mapBackendSale),
      success: true,
    };
  },

  getById: async (id: number): Promise<ApiResponse<Sale>> => {
    const response = await request<BackendWrapped<BackendSale>>(`/sales/index.php?id=${id}`, { auth: true });
    return {
      data: mapBackendSale(response.data),
      success: true,
    };
  },

  create: async (payload: SalePayload, _userId: number): Promise<ApiResponse<Sale>> => {
    const backendPayload = {
      items: payload.items.map((item) => {
        const quantity = Number(item.quantity) || 1;
        const price = Number(item.total_price) / quantity;
        return {
          product_id: item.product_id,
          quantity,
          price,
          total_price: item.total_price,
          imei_id: item.imei_id,
        };
      }),
      payment_method: mapFrontendPaymentToBackend(payload.payment_method),
      customer_name: 'Walk-in Customer',
      customer_phone: '',
      customer_email: '',
      tax: 0,
      discount: 0,
      status: 'completed',
    };

    const response = await request<BackendWrapped<BackendSale>>('/sales/index.php', {
      method: 'POST',
      body: backendPayload,
      auth: true,
    });

    return {
      data: mapBackendSale(response.data),
      success: true,
      message: response.message || 'Sale completed successfully',
    };
  },

  getTodaySales: async (): Promise<ApiResponse<Sale[]>> => {
    const response = await salesApi.getAll();
    const today = new Date().toDateString();
    return {
      data: response.data.filter((sale) => new Date(sale.created_at).toDateString() === today),
      success: true,
    };
  },
};

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const getRangeForPeriod = (period: 'daily' | 'weekly' | 'monthly') => {
  const end = new Date();
  const start = new Date();

  if (period === 'daily') {
    start.setDate(end.getDate() - 1);
  } else if (period === 'weekly') {
    start.setDate(end.getDate() - 7);
  } else {
    start.setMonth(end.getMonth() - 1);
  }

  return { start: formatDate(start), end: formatDate(end) };
};

export const reportsApi = {
  getSalesReport: async (period: 'daily' | 'weekly' | 'monthly'): Promise<ApiResponse<any>> => {
    const range = getRangeForPeriod(period);

    const [summaryResponse, productResponse] = await Promise.all([
      request<BackendWrapped<any>>(`/reports/index.php?type=summary&start_date=${range.start}&end_date=${range.end}`, { auth: true }),
      request<BackendWrapped<any[]>>(`/reports/index.php?type=products&start_date=${range.start}&end_date=${range.end}`, { auth: true }),
    ]);

    const top_products = (productResponse.data || []).map((item) => ({
      product: {
        id: Number(item.id || 0),
        category: 'Phone' as ProductCategory,
        brand: String(item.brand || ''),
        model: String(item.model || ''),
        quantity: 0,
        cost_price: 0,
        selling_price: 0,
        low_stock_threshold: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      quantity: Number(item.total_sold || 0),
    }));

    const report = {
      period,
      total_sales: Number(summaryResponse.data?.sales?.total_transactions || 0),
      total_revenue: Number(summaryResponse.data?.sales?.total_revenue || 0),
      items_sold: top_products.reduce((sum, item) => sum + item.quantity, 0),
      top_products,
    };

    return {
      data: report,
      success: true,
    };
  },

  getStockReport: async (): Promise<ApiResponse<any>> => {
    const products = (await productsApi.getAll()).data;
    const categories = [...new Set(products.map((product) => product.category))].map((category) => {
      const categoryProducts = products.filter((product) => product.category === category);
      return {
        category,
        count: categoryProducts.length,
        value: categoryProducts.reduce((sum, product) => sum + (product.cost_price * product.quantity), 0),
      };
    });

    return {
      data: {
        total_items: products.reduce((sum, product) => sum + product.quantity, 0),
        total_value: products.reduce((sum, product) => sum + (product.cost_price * product.quantity), 0),
        low_stock_items: products.filter((product) => product.quantity <= product.low_stock_threshold),
        categories,
      },
      success: true,
    };
  },
};

export const getProducts = async (): Promise<Product[]> => {
  const response = await request<BackendWrapped<BackendProduct[]>>('/products/index.php');
  return (response.data || []).map(mapBackendProduct).filter((product) => product.quantity > 0);
};

export const getProductById = async (id: number): Promise<Product> => {
  const response = await request<BackendWrapped<BackendProduct>>(`/products/index.php?id=${id}`);
  return mapBackendProduct(response.data);
};

export const getCart = async (): Promise<CustomerCartItem[]> => {
  return getCartFromStorage();
};

export const addToCart = async (product: Product): Promise<CustomerCartItem[]> => {
  const cart = getCartFromStorage();
  const existing = cart.find((item) => item.product_id === product.id);

  if (existing) {
    if (existing.quantity + 1 > product.quantity) {
      throw new Error('Requested quantity exceeds available stock');
    }
    existing.quantity += 1;
    existing.line_total = existing.quantity * existing.product.selling_price;
  } else {
    cart.push({
      product_id: product.id,
      product,
      quantity: 1,
      line_total: product.selling_price,
    });
  }

  saveCartToStorage(cart);
  return cart;
};

export const updateCartQuantity = async (productId: number, quantity: number): Promise<CustomerCartItem[]> => {
  const cart = getCartFromStorage();
  const index = cart.findIndex((item) => item.product_id === productId);
  if (index === -1) {
    throw new Error('Cart item not found');
  }

  const product = cart[index].product;
  if (quantity <= 0) {
    cart.splice(index, 1);
  } else {
    if (quantity > product.quantity) {
      throw new Error('Requested quantity exceeds available stock');
    }
    cart[index] = {
      ...cart[index],
      quantity,
      line_total: quantity * product.selling_price,
    };
  }

  saveCartToStorage(cart);
  return cart;
};

export const removeFromCart = async (productId: number): Promise<CustomerCartItem[]> => {
  const cart = getCartFromStorage().filter((item) => item.product_id !== productId);
  saveCartToStorage(cart);
  return cart;
};

export const clearCart = async (): Promise<void> => {
  saveCartToStorage([]);
};

export const createOrder = async (orderData: CreateOrderData): Promise<CustomerOrder> => {
  const response = await request<BackendWrapped<BackendOrder>>('/orders/index.php', {
    method: 'POST',
    body: orderData,
    customerAuth: typeof orderData.customer_account_id === 'number',
  });
  return mapOrderFromBackend(response.data);
};

export const initializePaystackPayment = async (orderData: CustomerOrder): Promise<PaymentInitializationResult> => {
  const response = await request<{ success: boolean; message: string; receipt_number: string; payment_reference: string }>(
    '/payments/initialize.php',
    {
      method: 'POST',
      body: { order_id: orderData.id },
    }
  );

  await clearCart();

  return {
    success: true,
    message: response.message || 'Payment successful',
    receipt_number: response.receipt_number,
    payment_reference: response.payment_reference,
  };
};

export const getOrderByReceiptNumber = async (receiptNumber: string): Promise<CustomerOrder | null> => {
  try {
    const response = await request<BackendWrapped<BackendOrder>>(`/orders/index.php?receipt_number=${encodeURIComponent(receiptNumber)}`);
    return mapOrderFromBackend(response.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.toLowerCase().includes('order not found')) {
      return null;
    }
    throw error;
  }
};

export const getCustomerOrderHistory = async (page = 1, perPage = 10): Promise<PaginatedResponse<CustomerOrder>> => {
  const response = await request<BackendPaginatedWrapped<BackendOrder>>(
    `/customer/orders.php?page=${page}&per_page=${perPage}`,
    { customerAuth: true }
  );

  return {
    data: (response.data || []).map(mapOrderFromBackend),
    total: Number(response.pagination?.total || 0),
    page: Number(response.pagination?.page || page),
    per_page: Number(response.pagination?.per_page || perPage),
    total_pages: Number(response.pagination?.total_pages || 0),
  };
};

export const getCustomerReceiptByNumber = async (receiptNumber: string): Promise<CustomerOrder> => {
  const response = await request<BackendWrapped<BackendOrder>>(
    `/customer/orders/receipt.php?receipt_number=${encodeURIComponent(receiptNumber)}`,
    { customerAuth: true }
  );
  return mapOrderFromBackend(response.data);
};

export const getDashboardSummary = async (): Promise<DashboardStats> => {
  const response = await request<BackendWrapped<DashboardStats>>('/dashboard/summary.php', { auth: true });
  return response.data;
};

export const getStockAlerts = async (): Promise<StockAlertItem[]> => {
  const response = await request<BackendWrapped<BackendProduct[]>>('/products/low-stock.php', { auth: true });
  return (response.data || [])
    .map((product) => {
      const mapped = mapBackendProduct(product);
      return {
        id: mapped.id,
        product_id: mapped.id,
        product_name: `${mapped.brand} ${mapped.model}`,
        category: mapped.category,
        quantity: mapped.quantity,
        threshold: mapped.low_stock_threshold,
        status: mapped.quantity === 0 ? 'out_of_stock' : 'low_stock',
      } as StockAlertItem;
    })
    .sort((a, b) => a.quantity - b.quantity);
};

export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return {
      data: await getDashboardSummary(),
      success: true,
    };
  },

  getRecentActivity: async (): Promise<ApiResponse<Activity[]>> => {
    const response = await request<BackendWrapped<Array<{ id: number; type: string; message: string; created_at: string }>>>(
      '/dashboard/activity.php',
      { auth: true }
    );

    const data: Activity[] = (response.data || []).map((item) => {
      const type = item.type === 'sale' || item.type === 'stock_update' || item.type === 'low_stock' || item.type === 'new_product'
        ? item.type
        : 'stock_update';

      return {
        id: Number(item.id),
        type,
        message: String(item.message),
        created_at: String(item.created_at),
      };
    });

    return {
      data,
      success: true,
    };
  },
};

export const alertsApi = {
  getLowStockProducts: async (): Promise<ApiResponse<Product[]>> => {
    const response = await request<BackendWrapped<BackendProduct[]>>('/products/low-stock.php', { auth: true });
    return {
      data: (response.data || []).map(mapBackendProduct),
      success: true,
    };
  },
};
