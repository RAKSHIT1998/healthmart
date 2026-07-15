import { MedicineType, ProductCategoryGroup } from '../enums/catalog.enum';

const MEDICINE_IMAGE_MAP: Record<string, string> = {
  [MedicineType.TABLET]: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600',
  [MedicineType.CAPSULE]: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600',
  [MedicineType.SYRUP]: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=600',
  [MedicineType.INJECTION]: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600',
  [MedicineType.OINTMENT]: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600',
  [MedicineType.DROPS]: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600',
  [MedicineType.INHALER]: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600',
  [MedicineType.DEVICE]: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=600',
  [MedicineType.OTHER]: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600',
};

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  [ProductCategoryGroup.BABY_CARE]: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600',
  [ProductCategoryGroup.DEVICES]: 'https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=600',
  [ProductCategoryGroup.PERSONAL_CARE]: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=600',
  [ProductCategoryGroup.HEALTHCARE]: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600',
  [ProductCategoryGroup.MEDICINE]: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600',
};

export function getDefaultMedicineImage(medicineType?: string, categoryGroup?: string): string {
  const fallbackImage = MEDICINE_IMAGE_MAP[MedicineType.OTHER] || 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600';

  return (
    (medicineType ? MEDICINE_IMAGE_MAP[medicineType] : undefined) ??
    (categoryGroup ? CATEGORY_IMAGE_MAP[categoryGroup] : undefined) ??
    fallbackImage
  );
}
