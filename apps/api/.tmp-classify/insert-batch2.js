const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const mongoose = require('mongoose');

const CATEGORY_GROUP_MAP = {
  'Healthcare Devices': 'devices',
  'Baby Care': 'baby_care',
  'Personal Care': 'personal_care',
};

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function guessMedicineType(item) {
  if (item.medicineType) return item.medicineType;
  const n = item.name.toLowerCase();
  if (item.composition.some(c => c.toLowerCase() === 'device')) return 'device';
  if (n.includes('capsule')) return 'capsule';
  if (n.includes('syrup') || n.includes('suspension') || n.includes('solution') || n.includes('emulsion') || n.includes('juice')) return 'syrup';
  if (n.includes('injection')) return 'injection';
  if (n.includes('cream') || n.includes('ointment') || n.includes('gel') || n.includes('lotion') || n.includes('balm')) return 'ointment';
  if (n.includes('drops') || n.includes('spray')) return 'drops';
  if (n.includes('inhaler') || n.includes('rotacap') || n.includes('respule') || n.includes('nebulizer solution')) return 'inhaler';
  if (n.includes('tablet') || n.includes('pill') || n.includes('capsule')) return 'tablet';
  return 'other';
}

function guessPackSize(medicineType) {
  const map = { tablet: 'TAB', capsule: 'CAP', syrup: 'SYP', injection: 'INJ', ointment: 'OINT', drops: 'DROP', inhaler: 'INHL', device: 'PACK', other: 'PACK' };
  return map[medicineType] || 'PACK';
}

function guessIsGeneric(item) {
  const firstCompositionWord = (item.composition[0] || '').toLowerCase().split(' ')[0];
  const nameLower = item.name.toLowerCase();
  return firstCompositionWord.length > 2 && nameLower.startsWith(firstCompositionWord);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const medicines = db.collection('medicines');
  const categories = db.collection('categories');
  const manufacturers = db.collection('manufacturers');

  const p1 = require('./new-batch2-part1.json');
  const p2 = require('./new-batch2-part2.json');
  const allItems = [...p1, ...p2];

  const seen = new Set();
  const deduped = [];
  for (const item of allItems) {
    const key = item.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  const existingNames = new Set((await medicines.find({}, { projection: { name: 1 } }).toArray()).map(m => m.name.toLowerCase()));
  const toInsert = deduped.filter(item => !existingNames.has(item.name.toLowerCase()));
  const skippedDupes = deduped.length - toInsert.length;

  const categoryDocs = await categories.find({}).toArray();
  const categoryByName = new Map(categoryDocs.map(c => [c.name, c._id]));

  const manufacturerDocs = await manufacturers.find({}).toArray();
  const manufacturerByNameLower = new Map(manufacturerDocs.map(m => [m.name.toLowerCase(), m._id]));

  const newManufacturerNames = new Set();
  for (const item of toInsert) {
    if (!manufacturerByNameLower.has(item.manufacturer.toLowerCase())) {
      newManufacturerNames.add(item.manufacturer);
    }
  }
  for (const name of newManufacturerNames) {
    const result = await manufacturers.insertOne({ name, createdAt: new Date(), updatedAt: new Date() });
    manufacturerByNameLower.set(name.toLowerCase(), result.insertedId);
  }

  const now = new Date();
  const docs = [];
  const errors = [];
  const usedSlugs = new Set((await medicines.find({}, { projection: { slug: 1 } }).toArray()).map(m => m.slug));

  for (const item of toInsert) {
    const categoryId = categoryByName.get(item.category);
    if (!categoryId) { errors.push(`Unknown category "${item.category}" for ${item.name}`); continue; }
    const manufacturerId = manufacturerByNameLower.get(item.manufacturer.toLowerCase());
    if (!manufacturerId) { errors.push(`Unknown manufacturer "${item.manufacturer}" for ${item.name}`); continue; }

    const medicineType = guessMedicineType(item);
    const packSize = guessPackSize(medicineType);
    const categoryGroup = CATEGORY_GROUP_MAP[item.category] || 'medicine';
    const isGeneric = guessIsGeneric(item);

    let slug = slugify(item.name);
    let suffix = 1;
    while (usedSlugs.has(slug)) {
      slug = `${slugify(item.name)}-${suffix}`;
      suffix++;
    }
    usedSlugs.add(slug);

    docs.push({
      name: item.name, slug, description: item.name, composition: item.composition, uses: [], sideEffects: [],
      manufacturerId, categoryId, categoryGroup, medicineType,
      scheduleClass: item.scheduleClass || 'none', prescriptionRequired: !!item.prescriptionRequired, isGeneric,
      mrp: item.mrp, sellingPrice: item.sellingPrice, gstPercentage: 12, hsnCode: '3004', packSize,
      images: [], alternativeMedicineIds: [], variants: [], tags: [], isActive: true,
      ratingsAverage: 0, ratingsCount: 0, salesCount: 0, createdAt: now, updatedAt: now,
    });
  }

  console.log(`Generated: ${allItems.length}`);
  console.log(`After internal dedup: ${deduped.length}`);
  console.log(`Skipped (already in catalog): ${skippedDupes}`);
  console.log(`New manufacturers created: ${newManufacturerNames.size} (${[...newManufacturerNames].join(', ')})`);
  console.log(`Errors: ${errors.length}`);
  errors.forEach(e => console.log('  -', e));
  console.log(`Ready to insert: ${docs.length}`);

  if (docs.length > 0) {
    const result = await medicines.insertMany(docs);
    console.log(`\nInserted: ${result.insertedCount}`);
  }

  const totalCount = await medicines.countDocuments();
  console.log(`\nTotal medicines in catalog now: ${totalCount}`);
  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
