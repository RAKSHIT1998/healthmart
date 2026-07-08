const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const mongoose = require('mongoose');
async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const items = await db.collection('medicines').find({ $or: [{ images: { $exists: false } }, { images: [] }] }).project({ name: 1 }).sort({ name: 1 }).toArray();
  const fs = require('fs');
  fs.writeFileSync('.tmp-classify/missing-photos-list.json', JSON.stringify(items.map(i => i.name), null, 2));
  console.log('Total missing:', items.length);
  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
