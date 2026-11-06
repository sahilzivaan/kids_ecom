export interface Product {
  id: number;
  name: string;
  category: string;
  status: 'Active' | 'Draft' | string;
  mrp: number;
  sale: number;
  stock: number;
  sizes: string;
  description: string;
  images?: { id: number; url: string; is_primary: boolean; display_order: number }[];
  sold?: number;
  revenue?: number;
  rank?: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  delivery_name?: string;
  items_count: number;
  total_amount: string | number;
  payment_method: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | string;
  created_at: string;
  shipping_address?: string;
  city?: string;
  delivery_phone?: string;
  delivery_email?: string;
  items?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  orders: number;
  spent: number;
  status: 'Active' | 'Inactive' | string;
  joined?: string;
  initials?: string;
}

export interface KPI {
  label: string;
  value: string | number;
  change: string;
  dir: 'up' | 'down';
  icon: string;
  spark: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Settings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  storeAddress: string;
  codEnabled: boolean;
  razorpayEnabled: boolean;
  razorpayKey: string;
  razorpaySecret: string;
  gstPercent?: number;
  lowStockThreshold?: number;
  orderEmailAlerts?: boolean;
}

export interface AnalyticsMetrics {
  totalRevenue: number;
  revChange: number;
  avgOrder: number;
  aovChange: number;
  conversion: number;
  convChange: number;
}

export interface Coupon {
  id: number;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  min_order: number;
  expiry: string;
  usage_count: number;
  status: 'Active' | 'Inactive';
}

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

