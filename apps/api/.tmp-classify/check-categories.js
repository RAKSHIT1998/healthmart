const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const medicines = db.collection('medicines');
  const categories = db.collection('categories');

  const total = await medicines.countDocuments();
  const catList = await categories.find({}).toArray();
  const catMap = {};
  catList.forEach(c => catMap[String(c._id)] = c.name);

  const counts = await medicines.aggregate([
    { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();

  console.log(`Total medicines: ${total}`);
  console.log(`Total categories: ${catList.length}`);
  console.log('\nBreakdown:');
  counts.forEach(c => {
    const name = c._id ? (catMap[String(c._id)] || 'UNKNOWN CATEGORY ID') : 'NO CATEGORY';
    console.log(`  ${name}: ${c.count}`);
  });

  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
