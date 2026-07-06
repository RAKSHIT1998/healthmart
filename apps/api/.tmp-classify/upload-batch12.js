require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const items = require('C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/batch12-images.json');

async function main() {
  const results = [];
  for (const item of items) {
    try {
      const resp = await fetch(item.imageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!resp.ok) throw new Error('download failed: ' + resp.status);
      const buf = Buffer.from(await resp.arrayBuffer());
      const base64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
      const uploadRes = await cloudinary.uploader.upload(base64, {
        folder: 'buymedicines-store/medicines',
        resource_type: 'image',
      });
      results.push({ name: item.name, cloudinaryUrl: uploadRes.secure_url, source: item.source, status: 'ok' });
      console.log('OK:', item.name, '->', uploadRes.secure_url);
    } catch (err) {
      results.push({ name: item.name, status: 'failed', error: err.message, source: item.source });
      console.log('FAILED:', item.name, err.message);
    }
  }
  fs.writeFileSync(
    'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/batch12-upload-results.json',
    JSON.stringify(results, null, 1),
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
