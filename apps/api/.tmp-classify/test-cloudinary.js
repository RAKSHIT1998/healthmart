require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const { v2: cloudinary } = require('cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
async function main() {
  try {
    const result = await cloudinary.uploader.upload(
      'data:text/plain;base64,' + Buffer.from('test invoice content').toString('base64'),
      { folder: 'buymedicines-store/test', resource_type: 'raw' }
    );
    console.log('SUCCESS:', result.secure_url);
    await cloudinary.uploader.destroy(result.public_id, { resource_type: 'raw' });
    console.log('Cleaned up test file.');
  } catch (err) {
    console.log('FAILED:', err.message);
  }
}
main();
