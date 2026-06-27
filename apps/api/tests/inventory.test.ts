import { setupTestDB, teardownTestDB, clearDatabase } from './utils/db';
import { createBranch, createMedicine } from './utils/fixtures';
import { inventoryRepository, batchRepository } from '../src/repositories';
import * as inventoryService from '../src/services/inventory.service';
import { ApiError } from '../src/utils/ApiError';

beforeAll(setupTestDB);
afterAll(teardownTestDB);
afterEach(clearDatabase);

describe('Inventory engine — never oversell', () => {
  it('reserves stock atomically and rejects when insufficient', async () => {
    const branch = await createBranch();
    const medicine = await createMedicine();
    await inventoryRepository.addStock(String(medicine._id), String(branch._id), 10);

    await inventoryService.reserveItems([
      { medicineId: String(medicine._id), branchId: String(branch._id), quantity: 6 },
    ]);

    const availability = await inventoryService.getAvailability(String(medicine._id), String(branch._id));
    expect(availability.totalQuantity).toBe(10);
    expect(availability.reservedQuantity).toBe(6);
    expect(availability.availableQuantity).toBe(4);

    await expect(
      inventoryService.reserveItems([
        { medicineId: String(medicine._id), branchId: String(branch._id), quantity: 5 },
      ]),
    ).rejects.toThrow(ApiError);

    // Failed reservation must not have partially incremented reservedQuantity.
    const after = await inventoryService.getAvailability(String(medicine._id), String(branch._id));
    expect(after.reservedQuantity).toBe(6);
  });

  it('rolls back all items in a multi-item reservation if any single item fails', async () => {
    const branch = await createBranch();
    const plentiful = await createMedicine({ name: 'Plentiful Medicine' });
    const scarce = await createMedicine({ name: 'Scarce Medicine' });

    await inventoryRepository.addStock(String(plentiful._id), String(branch._id), 100);
    await inventoryRepository.addStock(String(scarce._id), String(branch._id), 1);

    await expect(
      inventoryService.reserveItems([
        { medicineId: String(plentiful._id), branchId: String(branch._id), quantity: 5 },
        { medicineId: String(scarce._id), branchId: String(branch._id), quantity: 5 },
      ]),
    ).rejects.toThrow(ApiError);

    const plentifulAvailability = await inventoryService.getAvailability(String(plentiful._id), String(branch._id));
    expect(plentifulAvailability.reservedQuantity).toBe(0);
  });

  it('never lets concurrent reservations exceed total stock', async () => {
    const branch = await createBranch();
    const medicine = await createMedicine();
    await inventoryRepository.addStock(String(medicine._id), String(branch._id), 10);

    const attempts = Array.from({ length: 25 }, () =>
      inventoryService
        .reserveItems([{ medicineId: String(medicine._id), branchId: String(branch._id), quantity: 1 }])
        .then(() => true)
        .catch(() => false),
    );

    const results = await Promise.all(attempts);
    const successCount = results.filter(Boolean).length;

    expect(successCount).toBe(10);

    const availability = await inventoryService.getAvailability(String(medicine._id), String(branch._id));
    expect(availability.reservedQuantity).toBe(10);
    expect(availability.availableQuantity).toBe(0);
  });

  it('releases a reservation back to available stock', async () => {
    const branch = await createBranch();
    const medicine = await createMedicine();
    await inventoryRepository.addStock(String(medicine._id), String(branch._id), 10);
    await inventoryService.reserveItems([{ medicineId: String(medicine._id), branchId: String(branch._id), quantity: 4 }]);

    await inventoryService.releaseItems([{ medicineId: String(medicine._id), branchId: String(branch._id), quantity: 4 }]);

    const availability = await inventoryService.getAvailability(String(medicine._id), String(branch._id));
    expect(availability.reservedQuantity).toBe(0);
    expect(availability.availableQuantity).toBe(10);
  });
});

describe('FIFO batch allocation', () => {
  it('allocates from the earliest-expiring batch first', async () => {
    const branch = await createBranch();
    const medicine = await createMedicine();

    const oldBatch = await inventoryService.receivePurchase({
      medicineId: String(medicine._id),
      branchId: String(branch._id),
      batchNumber: 'OLD-001',
      expiryDate: new Date('2026-06-01'),
      quantity: 5,
      costPrice: 50,
    });
    const newBatch = await inventoryService.receivePurchase({
      medicineId: String(medicine._id),
      branchId: String(branch._id),
      batchNumber: 'NEW-001',
      expiryDate: new Date('2027-06-01'),
      quantity: 10,
      costPrice: 55,
    });

    const allocation = await inventoryService.planFifoAllocation(String(medicine._id), String(branch._id), 8);

    expect(allocation).toHaveLength(2);
    expect(String(allocation[0]!.batchId)).toBe(String(oldBatch._id));
    expect(allocation[0]!.quantity).toBe(5);
    expect(String(allocation[1]!.batchId)).toBe(String(newBatch._id));
    expect(allocation[1]!.quantity).toBe(3);
  });

  it('commits FIFO consumption by deducting batches and inventory totals', async () => {
    const branch = await createBranch();
    const medicine = await createMedicine();

    await inventoryService.receivePurchase({
      medicineId: String(medicine._id),
      branchId: String(branch._id),
      batchNumber: 'BATCH-A',
      expiryDate: new Date('2026-12-01'),
      quantity: 10,
      costPrice: 40,
    });

    await inventoryService.reserveItems([{ medicineId: String(medicine._id), branchId: String(branch._id), quantity: 6 }]);
    const allocation = await inventoryService.planFifoAllocation(String(medicine._id), String(branch._id), 6);
    await inventoryService.commitFifoConsumption(String(medicine._id), String(branch._id), allocation);

    const availability = await inventoryService.getAvailability(String(medicine._id), String(branch._id));
    expect(availability.totalQuantity).toBe(4);
    expect(availability.reservedQuantity).toBe(0);

    const batches = await batchRepository.find({ medicineId: medicine._id, branchId: branch._id });
    expect(batches[0]!.quantityRemaining).toBe(4);
  });

  it('restores FIFO consumption back to batches and inventory on cancellation/return', async () => {
    const branch = await createBranch();
    const medicine = await createMedicine();

    await inventoryService.receivePurchase({
      medicineId: String(medicine._id),
      branchId: String(branch._id),
      batchNumber: 'BATCH-B',
      expiryDate: new Date('2026-12-01'),
      quantity: 10,
      costPrice: 40,
    });

    await inventoryService.reserveItems([{ medicineId: String(medicine._id), branchId: String(branch._id), quantity: 5 }]);
    const allocation = await inventoryService.planFifoAllocation(String(medicine._id), String(branch._id), 5);
    await inventoryService.commitFifoConsumption(String(medicine._id), String(branch._id), allocation);
    await inventoryService.restoreFifoConsumption(String(medicine._id), String(branch._id), allocation);

    const availability = await inventoryService.getAvailability(String(medicine._id), String(branch._id));
    expect(availability.totalQuantity).toBe(10);

    const batches = await batchRepository.find({ medicineId: medicine._id, branchId: branch._id });
    expect(batches[0]!.quantityRemaining).toBe(10);
  });
});
