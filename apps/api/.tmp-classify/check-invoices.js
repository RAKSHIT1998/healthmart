const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: 'C:/Users/rakshit/AppData/Local/Temp/claude/c--Users-rakshit-Downloads-medicine-delivery-healthmart/c1a0433a-e667-4a2d-8c3f-9c93339293f5/scratchpad/prod.env' });
const mongoose = require('mongoose');
async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, dbName: 'test' });
  const db = mongoose.connection.db;
  const total = await db.collection('invoices').countDocuments();
  const withPdf = await db.collection('invoices').countDocuments({ pdfUrl: { $exists: true, $ne: null } });
  const withoutPdf = total - withPdf;
  console.log(`Total invoices: ${total}`);
  console.log(`With pdfUrl: ${withPdf}`);
  console.log(`Without pdfUrl: ${withoutPdf}`);
  const recent = await db.collection('invoices').find({}).sort({ createdAt: -1 }).limit(5).project({ invoiceNumber: 1, pdfUrl: 1, createdAt: 1 }).toArray();
  console.log('\nRecent invoices:');
  recent.forEach(r => console.log(` ${r.invoiceNumber} | pdfUrl: ${r.pdfUrl || 'MISSING'} | ${r.createdAt}`));
  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
