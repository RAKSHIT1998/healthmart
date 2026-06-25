export enum ScheduleDrugClass {
  NONE = 'none',
  SCHEDULE_H = 'schedule_h',
  SCHEDULE_H1 = 'schedule_h1',
  SCHEDULE_X = 'schedule_x',
  SCHEDULE_G = 'schedule_g',
}

export enum MedicineType {
  TABLET = 'tablet',
  CAPSULE = 'capsule',
  SYRUP = 'syrup',
  INJECTION = 'injection',
  OINTMENT = 'ointment',
  DROPS = 'drops',
  INHALER = 'inhaler',
  DEVICE = 'device',
  OTHER = 'other',
}

export enum ProductCategoryGroup {
  MEDICINE = 'medicine',
  HEALTHCARE = 'healthcare',
  BABY_CARE = 'baby_care',
  PERSONAL_CARE = 'personal_care',
  DEVICES = 'devices',
}

export enum CouponType {
  FLAT = 'flat',
  PERCENTAGE = 'percentage',
  FREE_DELIVERY = 'free_delivery',
}

export enum PrescriptionStatus {
  PENDING = 'pending',
  OCR_PROCESSED = 'ocr_processed',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
