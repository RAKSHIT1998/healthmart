import { OrderStatus } from '@buymedicines/shared';
import { setupTestDB, teardownTestDB, clearDatabase } from './utils/db';
import { createBranch, createCustomer, createMedicine, createOrder } from './utils/fixtures';
import { inventoryRepository } from '../src/repositories';
import * as inventoryService from '../src/services/inventory.service';
import { updateOrderStatus } from '../src/services/order.service';
import { invoiceRepository } from '../src/repositories';
import { ApiError } from '../src/utils/ApiError';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
afterEach(clearDatabase);

describe('Order status machine', () => {
  it('rejects an out-of-sequence status transition', async () => {
    const branch = await createBranch();
    const customer = await createCustomer();
    const medicine = await createMedicine();
    const order = await createOrder({
      userId: customer._id,
      branchId: branch._id,
      medicineId: medicine._id,
      status: OrderStatus.PLACED,
    });

    await expect(updateOrderStatus(String(order._id), OrderStatus.DELIVERED, String(customer._id))).rejects.toThrow(ApiError);
  });

  it('walks a placed order through acceptance, packing (FIFO deduction), dispatch, and delivery', async () => {
    const branch = await createBranch();
    const customer = await createCustomer();
    const medicine = await createMedicine();
    const quantity = 3;

    await inventoryService.receivePurchase({
      medicineId: String(medicine._id),
      branchId: String(branch._id),
      batchNumber: 'TEST-BATCH-1',
      expiryDate: new Date('2026-12-01'),
      quantity: 10,
      costPrice: 40,
    });
    await inventoryService.reserveItems([{ medicineId: String(medicine._id), branchId: String(branch._id), quantity }]);

    const order = await createOrder({
      userId: customer._id,
      branchId: branch._id,
      medicineId: medicine._id,
      quantity,
      status: OrderStatus.PLACED,
    });

    await updateOrderStatus(String(order._id), OrderStatus.ACCEPTED, String(customer._id));
    const packed = await updateOrderStatus(String(order._id), OrderStatus.PACKED, String(customer._id));

    expect(packed.items[0]!.batchAllocations.length).toBeGreaterThan(0);

    const afterPack = await inventoryService.getAvailability(String(medicine._id), String(branch._id));
    expect(afterPack.totalQuantity).toBe(7); // 10 received - 3 consumed
    expect(afterPack.reservedQuantity).toBe(0); // reservation cleared on consumption

    await updateOrderStatus(String(order._id), OrderStatus.OUT_FOR_DELIVERY, String(customer._id));
    await updateOrderStatus(String(order._id), OrderStatus.DELIVERED, String(customer._id));

    const invoice = await invoiceRepository.findByOrderId(String(order._id));
    expect(invoice).not.toBeNull();
    expect(invoice!.totalAmount).toBe(order.totalAmount);
  });

  it('releases the stock reservation when a placed order is cancelled', async () => {
    const branch = await createBranch();
    const customer = await createCustomer();
    const medicine = await createMedicine();
    const quantity = 4;

    await inventoryRepository.addStock(String(medicine._id), String(branch._id), 10);
    await inventoryService.reserveItems([{ medicineId: String(medicine._id), branchId: String(branch._id), quantity }]);

    const order = await createOrder({
      userId: customer._id,
      branchId: branch._id,
      medicineId: medicine._id,
      quantity,
      status: OrderStatus.PLACED,
    });

    await updateOrderStatus(String(order._id), OrderStatus.CANCELLED, String(customer._id), 'Customer requested');

    const availability = await inventoryService.getAvailability(String(medicine._id), String(branch._id));
    expect(availability.reservedQuantity).toBe(0);
    expect(availability.availableQuantity).toBe(10);
  });
});
