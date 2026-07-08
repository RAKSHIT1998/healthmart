const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const mongoose = require('mongoose');
async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const medicines = db.collection('medicines');
  const total = await medicines.countDocuments();
  const withImages = await medicines.countDocuments({ images: { $exists: true, $ne: [] } });
  console.log(`Total: ${total}`);
  console.log(`With images: ${withImages}`);
  console.log(`Without images: ${total - withImages}`);
  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
