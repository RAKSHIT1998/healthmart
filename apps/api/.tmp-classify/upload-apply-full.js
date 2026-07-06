// Usage: node upload-apply-full.js <batch-full.json>
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { v2: cloudinary } = require('cloudinary');
const mongoose = require('mongoose');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function main() {
  const file = process.argv[2];
  const items = require(require('path').resolve(file));

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const medicines = db.collection('medicines');

  let updated = 0;
  const notFound = [];
  for (const item of items) {
    try {
      const set = {};
      let imgUrl = null;
      if (item.imageUrl) {
        const resp = await fetch(item.imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!resp.ok) throw new Error('download failed: ' + resp.status);
        const buf = Buffer.from(await resp.arrayBuffer());
        const base64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
        const uploadRes = await cloudinary.uploader.upload(base64, {
          folder: 'buymedicines-store/medicines',
          resource_type: 'image',
        });
        set.images = [uploadRes.secure_url];
        imgUrl = uploadRes.secure_url;
      }
      if (item.description) set.description = item.description;
      if (item.composition) set.composition = item.composition;
      if (item.uses) set.uses = item.uses;
      if (item.dosage) set.dosage = item.dosage;
      if (item.sideEffects) set.sideEffects = item.sideEffects;
      if (item.storageInstructions) set.storageInstructions = item.storageInstructions;

      const res = await medicines.updateOne({ name: item.name }, { $set: set });
      if (res.matchedCount === 0) {
        notFound.push(item.name);
      } else {
        updated++;
        console.log('OK:', item.name, imgUrl ? '-> ' + imgUrl : '(text fields only, no image)');
      }
    } catch (err) {
      console.log('FAILED:', item.name, err.message);
    }
  }

  console.log('\nUpdated:', updated);
  console.log('Not found in DB:', JSON.stringify(notFound));
  await mongoose.disconnect();
}

main().catch((e) => { console.error('ERR', e.message); process.exit(1); });
