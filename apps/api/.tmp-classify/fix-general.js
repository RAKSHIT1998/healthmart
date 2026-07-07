const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const medicines = db.collection('medicines');
  const categories = db.collection('categories');

  const catNames = ['Neuro & Psychiatry', 'Cardiac & Blood Pressure', 'Vitamins & Supplements', 'Oral & Dental Care', 'Antibiotics & Anti-infectives'];
  const cats = {};
  for (const name of catNames) {
    const doc = await categories.findOne({ name });
    if (!doc) throw new Error(`Category not found: ${name}`);
    cats[name] = doc._id;
  }

  const updates = [
    { name: 'AXOGURD NT 1*10', categoryId: cats['Neuro & Psychiatry'], composition: ['Nortriptyline 10mg', 'Pregabalin 75mg'], prescriptionRequired: true, scheduleClass: 'H' },
    { name: 'FORITIUS 10 MG 1*10TAB', categoryId: cats['Cardiac & Blood Pressure'], composition: ['Rosuvastatin 10mg'], prescriptionRequired: true, scheduleClass: 'H' },
    { name: 'FORTIUS 5MG W1*10', categoryId: cats['Cardiac & Blood Pressure'], composition: ['Rosuvastatin 5mg'], prescriptionRequired: true, scheduleClass: 'H' },
    { name: 'SEDEROM', categoryId: cats['Vitamins & Supplements'], composition: ['Methylcobalamin', 'Folic acid', 'Ferric ammonium citrate', 'Vitamin C'], prescriptionRequired: false, scheduleClass: null },
    { name: 'SENSOPIL GEL 1*100G', categoryId: cats['Oral & Dental Care'], composition: ['Potassium nitrate', 'Sodium monofluorophosphate', 'Triclosan'], prescriptionRequired: false, scheduleClass: null },
    { name: 'LYNX 2ML 1*2ML', categoryId: cats['Antibiotics & Anti-infectives'], composition: ['Lincomycin 300mg'], prescriptionRequired: true, scheduleClass: 'H' },
  ];

  let updated = 0;
  for (const u of updates) {
    const { name, ...set } = u;
    const res = await medicines.updateOne({ name }, { $set: set });
    console.log(res.matchedCount ? `OK: ${name}` : `NOT FOUND: ${name}`);
    if (res.matchedCount) updated++;
  }
  console.log(`\nUpdated: ${updated}/${updates.length}`);

  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
