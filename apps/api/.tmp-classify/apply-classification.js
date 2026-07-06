const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const { classify } = require('./classify.js');

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const categories = db.collection('categories');
  const medicines = db.collection('medicines');

  const allCats = await categories.find({}).toArray();
  const byName = new Map(allCats.map((c) => [c.name.toLowerCase(), c]));

  // --- Consolidate duplicate "General" categories ---
  const generalMain = allCats.find((c) => c.slug === 'general');
  const generalDup = allCats.find((c) => c.slug === 'general-marg-sync');
  let reassigned = 0;
  if (generalDup && generalMain) {
    const r = await medicines.updateMany({ categoryId: generalDup._id }, { $set: { categoryId: generalMain._id } });
    reassigned = r.modifiedCount;
    await categories.updateOne({ _id: generalDup._id }, { $set: { isActive: false } });
  }

  // --- Create any new categories referenced by the ruleset ---
  const meds = await medicines.find({}).project({ _id: 1, name: 1 }).toArray();
  const neededNames = new Set();
  const ruleByMed = new Map();
  for (const m of meds) {
    const r = classify(m.name);
    if (r) {
      neededNames.add(r.category);
      ruleByMed.set(String(m._id), r);
    }
  }

  const created = [];
  for (const name of neededNames) {
    if (byName.has(name.toLowerCase())) continue;
    const doc = {
      name,
      slug: slugify(name),
      group: 'medicine',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await categories.insertOne(doc);
    doc._id = res.insertedId;
    byName.set(name.toLowerCase(), doc);
    created.push(name);
  }

  // --- Apply classification to medicines ---
  const ops = [];
  const report = [];
  for (const m of meds) {
    const rule = ruleByMed.get(String(m._id));
    if (!rule) {
      report.push({ id: String(m._id), name: m.name, status: 'unclassified' });
      continue;
    }
    const cat = byName.get(rule.category.toLowerCase());
    ops.push({
      updateOne: {
        filter: { _id: m._id },
        update: {
          $set: {
            categoryId: cat._id,
            categoryGroup: rule.group || 'medicine',
            prescriptionRequired: rule.rx,
            scheduleClass: rule.schedule,
          },
        },
      },
    });
    report.push({
      id: String(m._id),
      name: m.name,
      status: 'classified',
      category: rule.category,
      scheduleClass: rule.schedule,
      prescriptionRequired: rule.rx,
    });
  }

  const bulkResult = ops.length ? await medicines.bulkWrite(ops) : { modifiedCount: 0 };

  fs.writeFileSync(
    'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/classification-report.json',
    JSON.stringify(report, null, 1),
  );

  console.log('Duplicate "General" reassigned:', reassigned, '(then deactivated)');
  console.log('Categories created:', JSON.stringify(created));
  console.log('Medicines updated:', bulkResult.modifiedCount);
  console.log('Left unclassified (still in General):', report.filter((r) => r.status === 'unclassified').length);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('ERR', e);
  process.exit(1);
});
