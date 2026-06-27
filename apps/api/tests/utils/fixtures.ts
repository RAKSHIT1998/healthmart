import { BranchModel, CategoryModel, ManufacturerModel, MedicineModel, OrderModel, UserModel } from '../../src/models';
import { OrderStatus, PaymentMethod, PaymentStatus, Role } from '@healthmart/shared';
import type { Types } from 'mongoose';

export async function createBranch(overrides: Partial<Record<string, unknown>> = {}) {
  return BranchModel.create({
    name: 'Test Branch',
    code: `BR${Math.floor(Math.random() * 100000)}`,
    address: '1 Test Street',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    lat: 12.9716,
    lng: 77.5946,
    isMainBranch: true,
    isActive: true,
    ...overrides,
  });
}

export async function createMedicine(overrides: Partial<Record<string, unknown>> = {}) {
  const manufacturer = await ManufacturerModel.create({ name: 'Test Pharma', slug: `test-pharma-${Date.now()}-${Math.random()}` });
  const category = await CategoryModel.create({
    name: 'Test Category',
    slug: `test-category-${Date.now()}-${Math.random()}`,
    group: 'medicine',
  });

  return MedicineModel.create({
    name: 'Test Medicine 500mg',
    slug: `test-medicine-${Date.now()}-${Math.random()}`,
    description: 'A medicine used for testing purposes.',
    composition: ['Test Compound 500mg'],
    manufacturerId: manufacturer._id,
    categoryId: category._id,
    categoryGroup: 'medicine',
    medicineType: 'tablet',
    scheduleClass: 'none',
    prescriptionRequired: false,
    mrp: 100,
    sellingPrice: 90,
    gstPercentage: 12,
    hsnCode: '3004',
    packSize: '10 tablets',
    images: ['https://example.com/image.jpg'],
    isActive: true,
    ...overrides,
  });
}

export async function createCustomer(overrides: Partial<Record<string, unknown>> = {}) {
  return UserModel.create({
    name: 'Test Customer',
    phone: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
    role: Role.CUSTOMER,
    isPhoneVerified: true,
    isActive: true,
    ...overrides,
  });
}

interface CreateOrderOptions {
  userId: Types.ObjectId;
  branchId: Types.ObjectId;
  medicineId: Types.ObjectId;
  quantity?: number;
  sellingPrice?: number;
  status?: OrderStatus;
}

export async function createOrder(options: CreateOrderOptions) {
  const quantity = options.quantity ?? 2;
  const sellingPrice = options.sellingPrice ?? 90;
  const subtotal = quantity * sellingPrice;

  return OrderModel.create({
    orderNumber: `MMS-TEST-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId: options.userId,
    branchId: options.branchId,
    items: [
      {
        medicineId: options.medicineId,
        name: 'Test Medicine 500mg',
        quantity,
        mrp: sellingPrice,
        sellingPrice,
        gstPercentage: 12,
        hsnCode: '3004',
        prescriptionRequired: false,
        batchAllocations: [],
      },
    ],
    addressSnapshot: {
      contactName: 'Test Customer',
      contactPhone: '9876543210',
      line1: '1 Test Street',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      lat: 12.9716,
      lng: 77.5946,
    },
    deliverySlot: { type: 'standard' },
    paymentMethod: PaymentMethod.COD,
    paymentStatus: PaymentStatus.PENDING,
    status: options.status ?? OrderStatus.PLACED,
    statusHistory: [{ status: options.status ?? OrderStatus.PLACED, changedAt: new Date() }],
    subtotal,
    discount: 0,
    deliveryFee: 29,
    gstAmount: Math.round(((subtotal * 12) / 112) * 100) / 100,
    totalAmount: subtotal + 29,
    walletAmountUsed: 0,
    prescriptionIds: [],
    margInvoiceSynced: false,
  } as never);
}
