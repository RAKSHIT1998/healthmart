import { Role } from '@buymedicines/shared';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { BranchModel, CategoryModel, ManufacturerModel, UserModel } from '../models';
import { hashPassword } from '../utils/hash';

async function seed(): Promise<void> {
  await connectDatabase();

  const branch = await BranchModel.findOneAndUpdate(
    { code: 'MAIN' },
    {
      $setOnInsert: {
        name: 'BuyMedicines.store - Main Branch',
        code: 'MAIN',
        address: '123 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        lat: 12.9716,
        lng: 77.5946,
        isMainBranch: true,
        isActive: true,
      },
    },
    { upsert: true, new: true },
  );
  logger.info(`Branch ready: ${branch.name} (${branch.code})`);

  const existingAdmin = await UserModel.findOne({ email: env.ADMIN_SEED_EMAIL });
  if (!existingAdmin) {
    const passwordHash = await hashPassword(env.ADMIN_SEED_PASSWORD);
    await UserModel.create({
      name: 'Super Admin',
      email: env.ADMIN_SEED_EMAIL,
      phone: '9999999999',
      passwordHash,
      role: Role.ADMIN,
      branchId: branch._id,
      isEmailVerified: true,
      isPhoneVerified: true,
    });
    logger.info(`Admin user created: ${env.ADMIN_SEED_EMAIL} / ${env.ADMIN_SEED_PASSWORD}`);
  } else {
    logger.info('Admin user already exists, skipping');
  }

  const categories = [
    { name: 'Prescription Medicines', slug: 'prescription-medicines', group: 'medicine' },
    { name: 'Over the Counter', slug: 'over-the-counter', group: 'medicine' },
    { name: 'Healthcare Devices', slug: 'healthcare-devices', group: 'devices' },
    { name: 'Baby Care', slug: 'baby-care', group: 'baby_care' },
    { name: 'Personal Care', slug: 'personal-care', group: 'personal_care' },
  ];
  for (const category of categories) {
    await CategoryModel.findOneAndUpdate({ slug: category.slug }, { $setOnInsert: category }, { upsert: true });
  }
  logger.info(`Seeded ${categories.length} categories`);

  const manufacturers = [
    'Cipla',
    'Sun Pharma',
    'Dr Reddys',
    'Johnson & Johnson',
    'Mankind Pharma',
    'Lupin',
    'Abbott India',
    'GSK Pharma',
    'Glenmark',
    'Torrent Pharma',
    'Himalaya Wellness',
    'Reckitt Benckiser',
    'Zydus Cadila',
    'Alkem Labs',
  ];
  for (const name of manufacturers) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await ManufacturerModel.findOneAndUpdate({ slug }, { $setOnInsert: { name, slug } }, { upsert: true });
  }
  logger.info(`Seeded ${manufacturers.length} manufacturers`);

  await disconnectDatabase();
  logger.info('Seed complete');
}

seed().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
