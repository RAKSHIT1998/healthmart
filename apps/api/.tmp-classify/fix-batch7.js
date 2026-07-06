const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const mongoose = require('mongoose');

const fixes = [
  { name: 'VITCOFOL INJ 10 ML 1', url: 'https://res.cloudinary.com/ikwchy59/image/upload/v1783071060/buymedicines-store/medicines/cmebocvhz1bl7eqjxc6c.jpg' },
  { name: 'ROSUVAS 10MG 1*10TAB', url: 'https://res.cloudinary.com/ikwchy59/image/upload/v1783071061/buymedicines-store/medicines/qd34epjb30sradci7iuc.jpg' },
  { name: 'ROSUVAS 20MG 1*10TAB', url: 'https://res.cloudinary.com/ikwchy59/image/upload/v1783071062/buymedicines-store/medicines/kfokw5fuyzfap4xrkoij.jpg' },
  { name: 'PANTOP 40 1*15TAB', url: 'https://res.cloudinary.com/ikwchy59/image/upload/v1783071065/buymedicines-store/medicines/edbor9ciobepnny4hynl.jpg' },
  { name: 'PANTOP 20 1*10TAB', url: 'https://res.cloudinary.com/ikwchy59/image/upload/v1783071065/buymedicines-store/medicines/infxv1z1extumrrwtuiy.jpg' },
  { name: 'RABICIP 20 15S', url: 'https://res.cloudinary.com/ikwchy59/image/upload/v1783071066/buymedicines-store/medicines/rcfpgoiixvqit3v3d0sb.jpg' },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const medicines = db.collection('medicines');

  for (const f of fixes) {
    const res = await medicines.updateOne({ name: f.name }, { $set: { images: [f.url] } });
    console.log(f.name, '-> matched:', res.matchedCount, 'modified:', res.modifiedCount);
  }

  // Verify
  console.log('\n--- Verification ---');
  for (const f of fixes) {
    const doc = await medicines.findOne({ name: f.name });
    console.log(f.name, '->', JSON.stringify(doc.images));
  }

  await mongoose.disconnect();
}

main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
