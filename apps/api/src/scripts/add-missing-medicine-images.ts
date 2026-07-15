import mongoose from 'mongoose';
import { MedicineModel } from '../models/medicine.model';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../../apps/api/.env' });

const uri = process.env.MONGO_URI ?? 'mongodb://localhost:27018/buymedicines';

async function main() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const medicinesWithoutImages = await MedicineModel.find({ images: { $size: 0 } });
  console.log(`Found ${medicinesWithoutImages.length} medicines without images`);

  for (const med of medicinesWithoutImages) {
    const query = encodeURIComponent(med.name);
    const imageUrl = `https://source.unsplash.com/featured/300x200?${query}`;
    console.log(`Updating ${med.name} (${med._id}) with image ${imageUrl}`);
    med.images = [imageUrl];
    await med.save();
  }

  console.log('Done');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});