const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const DEFAULT_QTY = 20;
const EXPIRY = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000);

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const medicines = db.collection('medicines');
  const batches = db.collection('batches');
  const inventories = db.collection('inventories');
  const movements = db.collection('inventorymovements');
  const branches = db.collection('branches');

  const branch = await branches.findOne({ isMainBranch: true }) || (await branches.find({}).limit(1).toArray())[0];
  if (!branch) throw new Error('No branch found');
  const branchId = branch._id;

  const allMeds = await medicines.find({}).project({ _id: 1, name: 1, sellingPrice: 1, mrp: 1 }).toArray();
  console.log('Medicines to stock:', allMeds.length, 'at branch', branch.name);

  // Skip any medicine that already has an inventory record at this branch (avoid double-stocking).
  const existingInvMedIds = new Set(
    (await inventories.find({ branchId }).project({ medicineId: 1 }).toArray()).map((i) => String(i.medicineId)),
  );

  let stocked = 0;
  let skipped = 0;
  const batchDocs = [];
  const movementDocs = [];
  const now = new Date();

  for (const med of allMeds) {
    if (existingInvMedIds.has(String(med._id))) {
      skipped++;
      continue;
    }
    const sellingPrice = med.sellingPrice || med.mrp || 10;
    const costPrice = Math.max(1, Math.round(sellingPrice * 0.7 * 100) / 100);
    const batchId = new ObjectId();
    batchDocs.push({
      _id: batchId,
      medicineId: med._id,
      branchId,
      batchNumber: 'INITIAL-STOCK',
      expiryDate: EXPIRY,
      quantityReceived: DEFAULT_QTY,
      quantityRemaining: DEFAULT_QTY,
      costPrice,
      receivedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    movementDocs.push({
      medicineId: med._id,
      branchId,
      batchId,
      type: 'purchase',
      quantity: DEFAULT_QTY,
      referenceType: 'Batch',
      referenceId: batchId,
      notes: 'Initial bulk stock-in (auto-generated cost estimate at 70% of selling price)',
      createdAt: now,
    });
    stocked++;
  }

  if (batchDocs.length) {
    await batches.insertMany(batchDocs);
    await movements.insertMany(movementDocs);
    const invOps = batchDocs.map((b) => ({
      updateOne: {
        filter: { medicineId: b.medicineId, branchId: b.branchId },
        update: { $inc: { totalQuantity: b.quantityReceived }, $setOnInsert: { reservedQuantity: 0, lowStockThreshold: 10 } },
        upsert: true,
      },
    }));
    await inventories.bulkWrite(invOps);
  }

  console.log('Newly stocked:', stocked, '| Already had inventory (skipped):', skipped);
  await mongoose.disconnect();
}

main().catch((e) => { console.error('ERR', e); process.exit(1); });
