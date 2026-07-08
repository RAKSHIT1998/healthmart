const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const mongoose = require('mongoose');

const CATEGORY_USES = {
  'Prescription Medicines': ['As prescribed by your doctor for your specific condition'],
  'Over the Counter': ['General wellness and everyday health needs'],
  'Healthcare Devices': ['Home health monitoring and care support'],
  'Baby Care': ['Infant and child hygiene, nutrition, and comfort'],
  'Personal Care': ['Daily personal hygiene and skincare'],
  'Cough, Cold & Allergy': ['Relief from cough, cold, and allergy symptoms'],
  'Neuro & Psychiatry': ['Management of neurological or psychiatric conditions as prescribed'],
  'Digestive & Antacids': ['Relief from indigestion, acidity, and digestive discomfort'],
  'Diabetes Care': ['Blood sugar management as part of a diabetes care plan'],
  'Pain Relief & Fever': ['Relief from pain and fever'],
  'Respiratory Care': ['Management of breathing and respiratory conditions'],
  'Antibiotics & Anti-infectives': ['Treatment of bacterial, fungal, or other infections as prescribed'],
  'Cardiac & Blood Pressure': ['Management of heart health and blood pressure as prescribed'],
  'Vitamins & Supplements': ['Nutritional support and supplementation'],
  'Wound Care & Antiseptics': ['Wound cleaning, dressing, and infection prevention'],
  'Orthopedic & Pain Relief': ['Relief from joint, muscle, and bone-related pain'],
  'Skin Care & Dermatology': ['Management of skin conditions and skincare'],
  'Oral & Dental Care': ['Oral hygiene and dental care'],
  'Eye & Ear Care': ['Eye or ear care and symptom relief'],
  "Women's Health": ["Support for women's health and wellness needs"],
  "Men's Health": ["Support for men's health and wellness needs"],
};

const DOSAGE_TEXT =
  'Take only as directed by your doctor or pharmacist, or as mentioned on the product label. Do not self-medicate, ' +
  'change the dose, or exceed the recommended dosage without medical advice.';

const SIDE_EFFECTS = [
  'Most people do not experience side effects, but some may notice mild nausea, dizziness, or an upset stomach',
  'Stop use and consult your doctor immediately if you notice a rash, swelling, difficulty breathing, or any other unusual reaction',
];

const STORAGE_TEXT =
  'Store in a cool, dry place below 25°C, away from direct sunlight and moisture. Keep out of reach and sight of children.';

function buildDescription(item) {
  const compositionText = item.composition && item.composition.length ? item.composition.join(', ') : 'the listed ingredients';
  return `${item.name} contains ${compositionText}. This product belongs to the ${item.categoryName || 'general'} category — use as directed by your doctor or pharmacist.`;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const medicines = db.collection('medicines');
  const categories = db.collection('categories');

  const categoryDocs = await categories.find({}).toArray();
  const categoryNameById = new Map(categoryDocs.map(c => [String(c._id), c.name]));

  const cursor = medicines.find({});
  let updated = 0;
  let scanned = 0;
  const bulkOps = [];

  for await (const doc of cursor) {
    scanned++;
    const categoryName = categoryNameById.get(String(doc.categoryId)) || 'General';
    const uses = CATEGORY_USES[categoryName] || ['General health and wellness needs'];

    const set = {
      description: buildDescription({ name: doc.name, composition: doc.composition, categoryName }),
      uses,
      dosage: DOSAGE_TEXT,
      sideEffects: SIDE_EFFECTS,
      storageInstructions: STORAGE_TEXT,
    };

    bulkOps.push({ updateOne: { filter: { _id: doc._id }, update: { $set: set } } });
    updated++;

    if (bulkOps.length >= 500) {
      await medicines.bulkWrite(bulkOps);
      bulkOps.length = 0;
      console.log(`Progress: ${updated} updated...`);
    }
  }

  if (bulkOps.length > 0) {
    await medicines.bulkWrite(bulkOps);
  }

  console.log(`\nScanned: ${scanned}`);
  console.log(`Updated: ${updated}`);

  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
