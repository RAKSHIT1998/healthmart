import { connectDatabase, disconnectDatabase } from '../config/db';
import { logger } from '../config/logger';
import { BranchModel, CategoryModel, ManufacturerModel, MedicineModel, InventoryModel } from '../models';

/**
 * Populates a handful of realistic medicines (with stock) on top of the base
 * `seed.ts` data — purely so a fresh local environment has something to look
 * at in the storefront/dashboard. Not required for the app to function;
 * run `npm run seed` first.
 */
async function main(): Promise<void> {
  await connectDatabase();

  const branch = await BranchModel.findOne({ code: 'MAIN' });
  const otc = await CategoryModel.findOne({ slug: 'over-the-counter' });
  const rx = await CategoryModel.findOne({ slug: 'prescription-medicines' });
  const devices = await CategoryModel.findOne({ slug: 'healthcare-devices' });
  const cipla = await ManufacturerModel.findOne({ slug: 'cipla' });
  const sun = await ManufacturerModel.findOne({ slug: 'sun-pharma' });

  if (!branch || !otc || !rx || !devices || !cipla || !sun) {
    throw new Error('Run `npm run seed` first to create the branch/categories/manufacturers.');
  }

  const medicines = [
    {
      name: 'Paracetamol 650mg Tablet',
      slug: 'paracetamol-650mg-tablet',
      shortDescription: 'Fast relief from fever and mild to moderate pain',
      description:
        'Paracetamol 650mg is used for the treatment of fever and mild to moderate pain including headache, body ache, and toothache.',
      composition: ['Paracetamol 650mg'],
      uses: ['Fever', 'Headache', 'Body ache', 'Toothache'],
      dosage: 'One tablet every 4-6 hours as needed, not exceeding 4 tablets in 24 hours.',
      sideEffects: ['Nausea', 'Rash (rare)'],
      storageInstructions: 'Store below 30°C in a dry place, away from sunlight.',
      manufacturerId: cipla._id,
      categoryId: otc._id,
      categoryGroup: 'medicine',
      medicineType: 'tablet',
      scheduleClass: 'none',
      prescriptionRequired: false,
      mrp: 35,
      sellingPrice: 28,
      gstPercentage: 12,
      hsnCode: '30049099',
      packSize: '15 tablets',
      images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600'],
      tags: ['fever', 'pain relief', 'paracetamol'],
      isActive: true,
      stock: 500,
    },
    {
      name: 'Vitamin C 500mg Tablet',
      slug: 'vitamin-c-500mg-tablet',
      shortDescription: 'Immunity booster with antioxidant properties',
      description: 'Vitamin C supplement that supports immune function, skin health, and acts as an antioxidant.',
      composition: ['Ascorbic Acid 500mg'],
      uses: ['Immunity support', 'Antioxidant', 'Skin health'],
      dosage: 'One tablet daily after meals.',
      sideEffects: ['Mild stomach upset at high doses'],
      storageInstructions: 'Store in a cool, dry place.',
      manufacturerId: sun._id,
      categoryId: otc._id,
      categoryGroup: 'healthcare',
      medicineType: 'tablet',
      scheduleClass: 'none',
      prescriptionRequired: false,
      mrp: 120,
      sellingPrice: 89,
      gstPercentage: 12,
      hsnCode: '30045090',
      packSize: '30 tablets',
      images: ['https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600'],
      tags: ['vitamin', 'immunity'],
      isActive: true,
      stock: 300,
    },
    {
      name: 'Amoxicillin 500mg Capsule',
      slug: 'amoxicillin-500mg-capsule',
      shortDescription: 'Broad-spectrum antibiotic for bacterial infections',
      description: 'Amoxicillin is a penicillin antibiotic used to treat a wide variety of bacterial infections.',
      composition: ['Amoxicillin 500mg'],
      uses: ['Bacterial infections', 'Respiratory tract infections'],
      dosage: 'As prescribed by your doctor, typically every 8 hours.',
      sideEffects: ['Diarrhea', 'Nausea', 'Allergic reactions'],
      storageInstructions: 'Store below 25°C, protect from moisture.',
      manufacturerId: cipla._id,
      categoryId: rx._id,
      categoryGroup: 'medicine',
      medicineType: 'capsule',
      scheduleClass: 'schedule_h',
      prescriptionRequired: true,
      mrp: 95,
      sellingPrice: 78,
      gstPercentage: 12,
      hsnCode: '30041020',
      packSize: '10 capsules',
      images: ['https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600'],
      tags: ['antibiotic'],
      isActive: true,
      stock: 150,
    },
    {
      name: 'Digital Infrared Thermometer',
      slug: 'digital-infrared-thermometer',
      shortDescription: 'Non-contact infrared thermometer for accurate readings',
      description:
        'A non-contact infrared thermometer for quick and accurate body temperature measurement, suitable for all ages.',
      composition: ['N/A'],
      uses: ['Body temperature measurement'],
      sideEffects: [],
      storageInstructions: 'Store in the provided case, away from direct sunlight.',
      manufacturerId: sun._id,
      categoryId: devices._id,
      categoryGroup: 'devices',
      medicineType: 'device',
      scheduleClass: 'none',
      prescriptionRequired: false,
      mrp: 1499,
      sellingPrice: 999,
      gstPercentage: 18,
      hsnCode: '90258090',
      packSize: '1 unit',
      images: ['https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600'],
      tags: ['thermometer', 'device'],
      isActive: true,
      stock: 80,
    },
    {
      name: 'Cough Syrup (Honey & Tulsi)',
      slug: 'cough-syrup-honey-tulsi',
      shortDescription: 'Ayurvedic relief from cough and throat irritation',
      description: 'A soothing herbal cough syrup with honey and tulsi extracts for relief from cough and throat irritation.',
      composition: ['Honey', 'Tulsi Extract', 'Ginger Extract'],
      uses: ['Cough relief', 'Sore throat'],
      dosage: 'Two teaspoons, 3 times a day.',
      sideEffects: [],
      storageInstructions: 'Store in a cool place, shake well before use.',
      manufacturerId: cipla._id,
      categoryId: otc._id,
      categoryGroup: 'medicine',
      medicineType: 'syrup',
      scheduleClass: 'none',
      prescriptionRequired: false,
      mrp: 110,
      sellingPrice: 85,
      gstPercentage: 12,
      hsnCode: '30049011',
      packSize: '100ml',
      images: ['https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600'],
      tags: ['cough', 'cold', 'ayurvedic'],
      isActive: true,
      stock: 200,
    },
    {
      name: 'Baby Diaper Rash Cream',
      slug: 'baby-diaper-rash-cream',
      shortDescription: 'Gentle protective cream for diaper rash',
      description: 'A gentle, dermatologically tested cream that protects baby skin from diaper rash and soothes irritation.',
      composition: ['Zinc Oxide 15%'],
      uses: ['Diaper rash prevention', 'Skin protection'],
      dosage: 'Apply a thin layer at every diaper change.',
      sideEffects: [],
      storageInstructions: 'Store below 30°C.',
      manufacturerId: sun._id,
      categoryId: otc._id,
      categoryGroup: 'baby_care',
      medicineType: 'ointment',
      scheduleClass: 'none',
      prescriptionRequired: false,
      mrp: 199,
      sellingPrice: 159,
      gstPercentage: 18,
      hsnCode: '33049910',
      packSize: '50g',
      images: ['https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600'],
      tags: ['baby care', 'skin'],
      isActive: true,
      stock: 120,
    },
  ];

  for (const med of medicines) {
    const { stock, ...medData } = med;
    const existing = await MedicineModel.findOne({ slug: medData.slug });
    const created = existing ?? (await MedicineModel.create(medData as never));
    const medicine = Array.isArray(created) ? created[0]! : created;
    await InventoryModel.findOneAndUpdate(
      { medicineId: medicine._id, branchId: branch._id },
      { $set: { totalQuantity: stock }, $setOnInsert: { reservedQuantity: 0 } },
      { upsert: true },
    );
    logger.info(`Seeded: ${medicine.name}`);
  }

  await disconnectDatabase();
  logger.info('Demo medicines seeded.');
}

main().catch((err) => {
  logger.error({ err }, 'Demo data seed failed');
  process.exit(1);
});
