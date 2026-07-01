export interface DashboardMetrics {
  todaySales: number;
  todayOrders: number;
  monthlySales: number;
  monthlyOrders: number;
  totalCustomers: number;
  cancelledOrdersToday: number;
  averageOrderValue: number;
  inventoryValue: number;
  lowStockCount: number;
  expiringSoonCount: number;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface Medicine {
  id: string;
  name: string;
  slug: string;
  description: string;
  composition: string[];
  manufacturerId: { id: string; name: string } | string;
  categoryId: { id: string; name: string } | string;
  categoryGroup: string;
  medicineType: string;
  scheduleClass: string;
  prescriptionRequired: boolean;
  isGeneric: boolean;
  mrp: number;
  sellingPrice: number;
  gstPercentage: number;
  hsnCode: string;
  packSize: string;
  images: string[];
  isActive: boolean;
  salesCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  group: string;
}

export interface Manufacturer {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  gstin?: string;
  isMainBranch: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ServiceablePincode {
  id: string;
  pincode: string;
  branchId: { id: string; name: string; code: string } | string;
  estimatedDeliveryMinutes: number;
  isActive: boolean;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  medicineId: { id: string; name: string; sellingPrice: number; images?: string[]; mrp?: number } | string;
  branchId: { id: string; name: string; code: string } | string;
  totalQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
}

export interface Batch {
  id: string;
  medicineId: { id: string; name: string } | string;
  batchNumber: string;
  expiryDate: string;
  quantityRemaining: number;
}

export interface InventoryMovement {
  id: string;
  medicineId: { id: string; name: string; slug: string } | string;
  branchId: { id: string; name: string; code: string } | string;
  batchId?: string;
  type: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  createdBy?: { id: string; name: string; email?: string; role: string } | string;
  notes?: string;
  createdAt: string;
}

export interface ReturnRequestItem {
  medicineId: string;
  name: string;
  quantity: number;
  sellingPrice: number;
  gstPercentage: number;
}

export interface ReturnRequest {
  id: string;
  orderId: { id: string; orderNumber: string; paymentMethod: string } | string;
  userId: { id: string; name: string; phone?: string } | string;
  branchId: string;
  items: ReturnRequestItem[];
  reasonCategory: string;
  reason?: string;
  status: 'requested' | 'approved' | 'rejected' | 'refunded';
  refundAmount: number;
  refundMethod?: string;
  rejectionReason?: string;
  processedAt?: string;
  createdAt: string;
}

export interface AddressSnapshot {
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
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  userId: { id: string; name: string; phone?: string } | string;
  branchId: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  items: Array<{ name: string; quantity: number; sellingPrice: number; prescriptionRequired: boolean }>;
  driverId?: string;
  addressSnapshot?: AddressSnapshot;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  type: 'flat' | 'percentage' | 'free_delivery';
  value: number;
  minOrderValue: number;
  usageLimitPerUser: number;
  usedCount: number;
  validFrom: string;
  validTill: string;
  isActive: boolean;
}

export interface Prescription {
  id: string;
  userId: { id: string; name: string; phone?: string } | string;
  imageUrls: string[];
  notes?: string;
  ocrMatchedTerms: string[];
  status: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  userId: { id: string; name: string; phone?: string } | string;
  branchId: string;
  vehicleType: string;
  vehicleNumber?: string;
  isAvailable: boolean;
  totalDeliveries: number;
  rating: number;
}

export interface MargSyncLog {
  id: string;
  entity: string;
  mode: string;
  status: string;
  recordsProcessed: number;
  recordsFailed: number;
  errorMessages: string[];
  startedAt: string;
  finishedAt?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId?: { id: string; name: string; role: string } | string;
  actorRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
}
