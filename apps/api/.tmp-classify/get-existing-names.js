const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const names = await db.collection('medicines').find({}).project({ name: 1, composition: 1 }).toArray();
  const fs = require('fs');
  fs.writeFileSync('.tmp-classify/existing-names.json', JSON.stringify(names.map(n => ({ name: n.name, composition: n.composition })), null, 2));
  console.log('Wrote', names.length, 'names');
  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
