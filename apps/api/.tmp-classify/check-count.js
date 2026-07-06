const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const total = await db.collection('medicines').countDocuments();
  const withImages = await db.collection('medicines').countDocuments({ images: { $exists: true, $ne: [] } });
  console.log(`With images: ${withImages}/${total}`);
  await mongoose.disconnect();
}
main();
