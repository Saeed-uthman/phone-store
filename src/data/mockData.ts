import type {
  Product,
  IMEI,
  Sale,
  Activity,
  User,
  CustomerCartItem,
  CustomerOrder,
} from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@phonestore.com',
    role: 'ADMIN',
    token: 'mock-admin-token-xyz123',
  },
  {
    id: 2,
    username: 'sales',
    email: 'sales@phonestore.com',
    role: 'SALES_ATTENDANT',
    token: 'mock-sales-token-abc456',
  },
];

// Mock Products
export const mockProducts: Product[] = [
  {
    id: 1,
    category: 'Phone',
    brand: 'Samsung',
    model: 'Galaxy A15',
    quantity: 10,
    cost_price: 120000,
    selling_price: 150000,
    low_stock_threshold: 3,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:30:00Z',
  },
  {
    id: 2,
    category: 'Phone',
    brand: 'iPhone',
    model: '15 Pro Max',
    quantity: 5,
    cost_price: 850000,
    selling_price: 1050000,
    low_stock_threshold: 2,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-22T11:00:00Z',
  },
  {
    id: 3,
    category: 'Phone',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    quantity: 3,
    cost_price: 700000,
    selling_price: 900000,
    low_stock_threshold: 2,
    created_at: '2024-01-12T08:00:00Z',
    updated_at: '2024-01-21T16:00:00Z',
  },
  {
    id: 4,
    category: 'Phone',
    brand: 'Xiaomi',
    model: 'Redmi Note 13',
    quantity: 15,
    cost_price: 80000,
    selling_price: 110000,
    low_stock_threshold: 5,
    created_at: '2024-01-08T10:00:00Z',
    updated_at: '2024-01-19T12:00:00Z',
  },
  {
    id: 5,
    category: 'Phone',
    brand: 'Google',
    model: 'Pixel 8',
    quantity: 2,
    cost_price: 450000,
    selling_price: 580000,
    low_stock_threshold: 2,
    created_at: '2024-01-05T11:00:00Z',
    updated_at: '2024-01-18T09:00:00Z',
  },
  {
    id: 6,
    category: 'Accessory',
    brand: 'Samsung',
    model: 'Galaxy Buds3 Pro',
    quantity: 20,
    cost_price: 45000,
    selling_price: 65000,
    low_stock_threshold: 5,
    created_at: '2024-01-14T13:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 7,
    category: 'Charger',
    brand: 'Apple',
    model: '20W USB-C Power Adapter',
    quantity: 30,
    cost_price: 8000,
    selling_price: 15000,
    low_stock_threshold: 10,
    created_at: '2024-01-11T14:00:00Z',
    updated_at: '2024-01-17T11:00:00Z',
  },
  {
    id: 8,
    category: 'Case',
    brand: 'Spigen',
    model: 'Ultra Hybrid iPhone 15',
    quantity: 50,
    cost_price: 3000,
    selling_price: 7500,
    low_stock_threshold: 15,
    created_at: '2024-01-09T09:00:00Z',
    updated_at: '2024-01-16T15:00:00Z',
  },
  {
    id: 9,
    category: 'Screen Protector',
    brand: 'Tempered',
    model: 'Samsung S24 Ultra Glass',
    quantity: 40,
    cost_price: 1500,
    selling_price: 4000,
    low_stock_threshold: 10,
    created_at: '2024-01-07T10:00:00Z',
    updated_at: '2024-01-15T12:00:00Z',
  },
  {
    id: 10,
    category: 'Cable',
    brand: 'Anker',
    model: 'USB-C to Lightning 1m',
    quantity: 25,
    cost_price: 2500,
    selling_price: 5500,
    low_stock_threshold: 8,
    created_at: '2024-01-06T11:00:00Z',
    updated_at: '2024-01-14T10:00:00Z',
  },
];

// Mock IMEIs
export const mockIMEIs: IMEI[] = [
  // Samsung Galaxy A15 IMEIs
  { id: 1, product_id: 1, imei_number: '356789012345678', is_sold: false },
  { id: 2, product_id: 1, imei_number: '356789012345679', is_sold: false },
  { id: 3, product_id: 1, imei_number: '356789012345680', is_sold: true, sold_at: '2024-01-20T10:30:00Z' },
  { id: 4, product_id: 1, imei_number: '356789012345681', is_sold: false },
  { id: 5, product_id: 1, imei_number: '356789012345682', is_sold: false },
  { id: 6, product_id: 1, imei_number: '356789012345683', is_sold: true, sold_at: '2024-01-21T14:00:00Z' },
  { id: 7, product_id: 1, imei_number: '356789012345684', is_sold: false },
  { id: 8, product_id: 1, imei_number: '356789012345685', is_sold: false },
  { id: 9, product_id: 1, imei_number: '356789012345686', is_sold: false },
  { id: 10, product_id: 1, imei_number: '356789012345687', is_sold: false },
  // iPhone 15 Pro Max IMEIs
  { id: 11, product_id: 2, imei_number: '490154203237518', is_sold: false },
  { id: 12, product_id: 2, imei_number: '490154203237519', is_sold: false },
  { id: 13, product_id: 2, imei_number: '490154203237520', is_sold: true, sold_at: '2024-01-19T11:00:00Z' },
  { id: 14, product_id: 2, imei_number: '490154203237521', is_sold: false },
  { id: 15, product_id: 2, imei_number: '490154203237522', is_sold: false },
  // Samsung Galaxy S24 Ultra IMEIs
  { id: 16, product_id: 3, imei_number: '352436108765432', is_sold: false },
  { id: 17, product_id: 3, imei_number: '352436108765433', is_sold: false },
  { id: 18, product_id: 3, imei_number: '352436108765434', is_sold: false },
  // Xiaomi Redmi Note 13 IMEIs
  { id: 19, product_id: 4, imei_number: '861234567890123', is_sold: false },
  { id: 20, product_id: 4, imei_number: '861234567890124', is_sold: false },
  { id: 21, product_id: 4, imei_number: '861234567890125', is_sold: false },
  { id: 22, product_id: 4, imei_number: '861234567890126', is_sold: false },
  { id: 23, product_id: 4, imei_number: '861234567890127', is_sold: false },
  // Google Pixel 8 IMEIs
  { id: 24, product_id: 5, imei_number: '358673104590876', is_sold: false },
  { id: 25, product_id: 5, imei_number: '358673104590877', is_sold: false },
];


// Mock Sales - Extended with more historical data
export const mockSales: Sale[] = [
  {
    id: 1,
    items: [
      {
        product_id: 1,
        product: mockProducts[0],
        quantity: 1,
        imei_id: 3,
        imei: mockIMEIs[2],
        unit_price: 150000,
        total_price: 150000,
      },
    ],
    total_amount: 150000,
    payment_method: 'card',
    created_at: '2024-01-20T10:30:00Z',
    created_by: 2,
  },
  {
    id: 2,
    items: [
      {
        product_id: 2,
        product: mockProducts[1],
        quantity: 1,
        imei_id: 13,
        imei: mockIMEIs[12],
        unit_price: 1050000,
        total_price: 1050000,
      },
      {
        product_id: 7,
        product: mockProducts[6],
        quantity: 1,
        unit_price: 15000,
        total_price: 15000,
      },
    ],
    total_amount: 1065000,
    payment_method: 'transfer',
    created_at: '2024-01-19T11:00:00Z',
    created_by: 1,
  },
  {
    id: 3,
    items: [
      {
        product_id: 8,
        product: mockProducts[7],
        quantity: 2,
        unit_price: 7500,
        total_price: 15000,
      },
      {
        product_id: 9,
        product: mockProducts[8],
        quantity: 2,
        unit_price: 4000,
        total_price: 8000,
      },
    ],
    total_amount: 23000,
    payment_method: 'cash',
    created_at: '2024-01-21T14:00:00Z',
    created_by: 2,
  },
  {
    id: 4,
    items: [
      {
        product_id: 1,
        product: mockProducts[0],
        quantity: 1,
        imei_id: 6,
        imei: mockIMEIs[5],
        unit_price: 150000,
        total_price: 150000,
      },
    ],
    total_amount: 150000,
    payment_method: 'cash',
    created_at: '2024-01-21T15:30:00Z',
    created_by: 1,
  },
  {
    id: 5,
    items: [
      {
        product_id: 6,
        product: mockProducts[5],
        quantity: 2,
        unit_price: 65000,
        total_price: 130000,
      },
    ],
    total_amount: 130000,
    payment_method: 'transfer',
    created_at: '2024-01-18T09:15:00Z',
    created_by: 2,
  },
  {
    id: 6,
    items: [
      {
        product_id: 4,
        product: mockProducts[3],
        quantity: 1,
        imei_id: 19,
        imei: mockIMEIs[18],
        unit_price: 110000,
        total_price: 110000,
      },
      {
        product_id: 8,
        product: mockProducts[7],
        quantity: 1,
        unit_price: 7500,
        total_price: 7500,
      },
      {
        product_id: 9,
        product: mockProducts[8],
        quantity: 1,
        unit_price: 4000,
        total_price: 4000,
      },
    ],
    total_amount: 121500,
    payment_method: 'card',
    created_at: '2024-01-17T16:45:00Z',
    created_by: 1,
  },
  {
    id: 7,
    items: [
      {
        product_id: 10,
        product: mockProducts[9],
        quantity: 3,
        unit_price: 5500,
        total_price: 16500,
      },
    ],
    total_amount: 16500,
    payment_method: 'cash',
    created_at: '2024-01-16T11:20:00Z',
    created_by: 2,
  },
  {
    id: 8,
    items: [
      {
        product_id: 3,
        product: mockProducts[2],
        quantity: 1,
        imei_id: 16,
        imei: mockIMEIs[15],
        unit_price: 900000,
        total_price: 900000,
      },
    ],
    total_amount: 900000,
    payment_method: 'transfer',
    created_at: '2024-01-15T14:00:00Z',
    created_by: 1,
  },
  {
    id: 9,
    items: [
      {
        product_id: 7,
        product: mockProducts[6],
        quantity: 2,
        unit_price: 15000,
        total_price: 30000,
      },
      {
        product_id: 10,
        product: mockProducts[9],
        quantity: 2,
        unit_price: 5500,
        total_price: 11000,
      },
    ],
    total_amount: 41000,
    payment_method: 'card',
    created_at: '2024-01-14T10:30:00Z',
    created_by: 2,
  },
  {
    id: 10,
    items: [
      {
        product_id: 5,
        product: mockProducts[4],
        quantity: 1,
        imei_id: 24,
        imei: mockIMEIs[23],
        unit_price: 580000,
        total_price: 580000,
      },
      {
        product_id: 7,
        product: mockProducts[6],
        quantity: 1,
        unit_price: 15000,
        total_price: 15000,
      },
    ],
    total_amount: 595000,
    payment_method: 'transfer',
    created_at: '2024-01-12T13:00:00Z',
    created_by: 1,
  },
];

// Mock Activities
export const mockActivities: Activity[] = [
  {
    id: 1,
    type: 'sale',
    message: 'Samsung Galaxy A15 sold for ₦150,000',
    created_at: '2024-01-21T15:30:00Z',
  },
  {
    id: 2,
    type: 'low_stock',
    message: 'Google Pixel 8 is running low (2 units left)',
    created_at: '2024-01-21T14:00:00Z',
  },
  {
    id: 3,
    type: 'sale',
    message: 'Multiple items sold for ₦23,000',
    created_at: '2024-01-21T14:00:00Z',
  },
  {
    id: 4,
    type: 'stock_update',
    message: 'Added 10 units of Anker USB-C Cable',
    created_at: '2024-01-21T10:00:00Z',
  },
  {
    id: 5,
    type: 'sale',
    message: 'iPhone 15 Pro Max + Charger sold for ₦1,065,000',
    created_at: '2024-01-19T11:00:00Z',
  },
  {
    id: 6,
    type: 'new_product',
    message: 'New product added: Samsung Galaxy Buds3 Pro',
    created_at: '2024-01-14T13:00:00Z',
  },
  {
    id: 7,
    type: 'low_stock',
    message: 'Samsung Galaxy S24 Ultra is running low (3 units left)',
    created_at: '2024-01-12T16:00:00Z',
  },
];

// Dashboard Stats
export const mockDashboardStats = {
  total_products: mockProducts.length,
  low_stock_count: mockProducts.filter(p => p.quantity <= p.low_stock_threshold).length,
  today_sales: 2,
  today_revenue: 173000,
  inventory_value: mockProducts.reduce((sum, p) => sum + (p.cost_price * p.quantity), 0),
  expected_profit: mockProducts.reduce((sum, p) => sum + ((p.selling_price - p.cost_price) * p.quantity), 0),
  profit_earned: mockSales.reduce((sum, sale) => {
    const costTotal = sale.items.reduce((acc, item) => acc + (item.product.cost_price * item.quantity), 0);
    return sum + (sale.total_amount - costTotal);
  }, 0),
  weekly_sales: [45, 62, 38, 71, 55, 48, 65],
  monthly_revenue: 1538000,
};

export const mockCustomerCart: CustomerCartItem[] = [];
export const mockCustomerOrders: CustomerOrder[] = [];
