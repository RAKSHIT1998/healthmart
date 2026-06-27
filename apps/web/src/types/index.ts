export interface Manufacturer {
  id: string;
  name: string;
  logo?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  group: string;
  image?: string;
}

export interface MedicineVariant {
  label: string;
  mrp: number;
  sellingPrice: number;
  packSize: string;
}

export interface Medicine {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  composition: string[];
  uses: string[];
  dosage?: string;
  sideEffects: string[];
  storageInstructions?: string;
  manufacturerId: Manufacturer | string;
  categoryId: Category | string;
  categoryGroup: string;
  medicineType: string;
  scheduleClass: string;
  prescriptionRequired: boolean;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number;
  hsnCode: string;
  packSize: string;
  images: string[];
  alternativeMedicineIds: Medicine[] | string[];
  variants: MedicineVariant[];
  tags: string[];
  isActive: boolean;
  ratingsAverage: number;
  ratingsCount: number;
  discountPercentage?: number;
}

export interface MedicineDetailResponse {
  medicine: Medicine;
  related: Medicine[];
  rating: { average: number; count: number };
  availability: { totalQuantity: number; reservedQuantity: number; availableQuantity: number };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CartPricedItem {
  medicineId: string;
  name: string;
  image?: string;
  slug: string;
  variantLabel?: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number;
  hsnCode: string;
  prescriptionRequired: boolean;
  lineTotal: number;
}

export interface CartTotals {
  items: CartPricedItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  gstAmount: number;
  totalAmount: number;
  couponCode?: string;
  freeDelivery: boolean;
}

export interface Address {
  id: string;
  label: 'home' | 'work' | 'other';
  contactName: string;
  contactPhone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export interface OrderItem {
  medicineId: string;
  name: string;
  image?: string;
  variantLabel?: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  prescriptionRequired: boolean;
}

export interface OrderStatusHistoryEntry {
  status: string;
  changedAt: string;
  reason?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  statusHistory: OrderStatusHistoryEntry[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  gstAmount: number;
  totalAmount: number;
  couponCode?: string;
  createdAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
  driverId?: string;
}

export interface CheckoutResult {
  order: Order;
  paymentSessionId: string | null;
  requiresPayment: boolean;
}

export interface Wallet {
  id: string;
  balance: number;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: 'flat' | 'percentage' | 'free_delivery';
  value: number;
  minOrderValue: number;
  validTill: string;
}

export interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  createdAt: string;
  userId: { name: string } | string;
}

export interface Prescription {
  id: string;
  imageUrls: string[];
  status: string;
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}
