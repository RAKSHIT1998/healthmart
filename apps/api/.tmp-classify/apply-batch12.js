const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const mongoose = require('mongoose');
const fs = require('fs');

const uploadResults = require('./batch12-upload-results.json');

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const medicines = db.collection('medicines');

  let updated = 0;
  const notFound = [];
  for (const item of uploadResults) {
    if (item.status !== 'ok') continue;
    const res = await medicines.updateOne({ name: item.name }, { $set: { images: [item.cloudinaryUrl] } });
    if (res.matchedCount === 0) {
      notFound.push(item.name);
    } else {
      updated++;
    }
  }

  console.log('Updated:', updated);
  console.log('Not found in DB:', JSON.stringify(notFound));
  await mongoose.disconnect();
}

main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
