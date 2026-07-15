import { getDefaultMedicineImage } from '@buymedicines/shared';

export function resolveMedicineImage(medicine?: {
  images?: string[];
  medicineType?: string;
  categoryGroup?: string;
}): string {
  return medicine?.images?.[0] || getDefaultMedicineImage(medicine?.medicineType, medicine?.categoryGroup);
}
