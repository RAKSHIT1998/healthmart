const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const categories = await db.collection('categories').find({}).project({ name: 1 }).toArray();
  const manufacturers = await db.collection('manufacturers').find({}).project({ name: 1 }).toArray();
  const existingNames = await db.collection('medicines').find({}).project({ name: 1 }).toArray();

  console.log('CATEGORIES:');
  categories.forEach(c => console.log(`  ${c._id} | ${c.name}`));
  console.log('\nMANUFACTURERS:');
  manufacturers.forEach(m => console.log(`  ${m._id} | ${m.name}`));
  console.log(`\nEXISTING MEDICINE COUNT: ${existingNames.length}`);

  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
